-- Migration: auth profile sync + strict RLS + order payment fields
-- Apply via Supabase SQL Editor or `supabase db push`

-- =====================================================
-- 1. Link public.users to auth.users
-- =====================================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- If users table has orphan rows, this may need manual cleanup first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey' AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.phone || '@phone.local'),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. Order payment & city fields
-- =====================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);

-- =====================================================
-- 3. updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS restaurants_updated_at ON restaurants;
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 4. Drop emergency open policies
-- =====================================================
DROP POLICY IF EXISTS "orders_open_all" ON orders;
DROP POLICY IF EXISTS "addresses_open_all" ON addresses;
DROP POLICY IF EXISTS "order_items_open_all" ON order_items;
DROP POLICY IF EXISTS "orders_read_all" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;

-- =====================================================
-- 5. Strict RLS policies
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Orders: customers see own orders
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_participants" ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND ur.is_active = true
      AND (
        r.name = 'admin'
        OR (r.name IN ('restaurant_owner', 'restaurant_admin') AND ur.restaurant_id = orders.restaurant_id)
        OR (r.name = 'courier' AND orders.courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "orders_select_staff" ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND ur.is_active = true
      AND (
        r.name = 'admin'
        OR (r.name IN ('restaurant_owner', 'restaurant_admin') AND ur.restaurant_id = orders.restaurant_id)
        OR r.name = 'courier'
      )
    )
  );

-- Addresses: own only
CREATE POLICY "addresses_own" ON addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Order items: via order ownership
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid() AND ur.is_active = true
          AND (r.name = 'admin' OR r.name = 'courier'
            OR (r.name IN ('restaurant_owner','restaurant_admin') AND ur.restaurant_id = o.restaurant_id))
        )
      )
    )
  );

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- User roles: read own; writes via service role only
DROP POLICY IF EXISTS "user_roles_read" ON user_roles;
CREATE POLICY "user_roles_read_own" ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_read" ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
    )
  );

-- Public read for catalog
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "menu_items_public_read" ON menu_items;
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (is_available = true);
