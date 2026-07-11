-- =============================================================================
-- DELIVERYHEART — единый SQL для продакшена
-- =============================================================================
-- ⚠️  ТРЕБУЕТ УЖЕ СУЩЕСТВУЮЩУЮ СХЕМУ (таблица public.users и др.)
--     Если ошибка "relation public.users does not exist" —
--     запустите вместо этого: supabase/PRODUCTION-FULL-SETUP.sql
-- =============================================================================
-- Куда запускать: Supabase Dashboard → SQL Editor → New query → Run
-- Безопасно перезапускать: да (DROP IF EXISTS / IF NOT EXISTS)
--
-- Что делает этот файл:
--   1. Связывает public.users с auth.users + триггер профиля при регистрации
--   2. Добавляет поля оплаты/города в orders (если ещё нет)
--   3. Убирает EMERGENCY-RLS-FIX (открытые политики) и ставит строгий RLS
--   4. Закрывает order_status_history и cities
--   5. UNIQUE(order_id) на courier_orders — защита от гонки двух курьеров
--   6. Фикс search_path у триггерных функций
--
-- НЕ нужно отдельно запускать, если применили этот файл:
--   - supabase/EMERGENCY-RLS-FIX.sql          (устарел, отменяется здесь)
--   - migrations/20260410000000_auth_and_profiles.sql
--   - migrations/20260410000001_strict_rls.sql
--   - migrations/20260424000000_auth_rls_production.sql
--   - migrations/20260625000000_security_hardening.sql  (часть delivery)
--   - migrations/20260706000000_courier_order_unique.sql
--
-- НЕ включено (отдельный продукт grocery, не для food-delivery):
--   - migrations/20260624000000_grocery_system.sql
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION
      'Таблица public.users не найдена. Сначала выполните supabase/PRODUCTION-FULL-SETUP.sql';
  END IF;
END $$;

BEGIN;

-- =============================================================================
-- 1. AUTH + PROFILE SYNC
-- =============================================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey' AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, full_name, role, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, COALESCE(NEW.phone, NEW.id::text) || '@phone.local'),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    'user',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. ORDER FIELDS (checkout / payment)
-- =============================================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(20);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- =============================================================================
-- 3. updated_at TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS restaurants_updated_at ON public.restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS menu_items_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. REMOVE EMERGENCY OPEN POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "orders_open_all" ON public.orders;
DROP POLICY IF EXISTS "orders_read_all" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update_all" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select" ON public.orders;
DROP POLICY IF EXISTS "orders_user_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_user_update" ON public.orders;
DROP POLICY IF EXISTS "orders_restaurant_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_restaurant_admin_update" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_any" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Allow users to insert own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_update_participants" ON public.orders;
DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;

DROP POLICY IF EXISTS "addresses_open_all" ON public.addresses;
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_any" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert" ON public.addresses;
DROP POLICY IF EXISTS "addresses_own" ON public.addresses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.addresses;
DROP POLICY IF EXISTS "Allow users to insert own addresses" ON public.addresses;

DROP POLICY IF EXISTS "order_items_open_all" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

DROP POLICY IF EXISTS "user_roles_read" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_read" ON public.user_roles;

DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "menu_items_public_read" ON public.menu_items;
DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
DROP POLICY IF EXISTS "cities_public_read" ON public.cities;
DROP POLICY IF EXISTS "order_status_history_insert" ON public.order_status_history;

-- =============================================================================
-- 5. STRICT RLS
-- =============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = TRUE
        AND (
          r.name = 'admin'
          OR r.name = 'courier'
          OR (r.name IN ('restaurant_owner', 'restaurant_admin') AND ur.restaurant_id = orders.restaurant_id)
        )
    )
  );

CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = TRUE
        AND (
          r.name = 'admin'
          OR (r.name IN ('restaurant_owner', 'restaurant_admin') AND ur.restaurant_id = orders.restaurant_id)
          OR (r.name = 'courier' AND orders.courier_id IN (
            SELECT c.id FROM public.couriers c WHERE c.user_id = auth.uid()
          ))
        )
    )
  );

-- addresses
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- order_items
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND ur.is_active = TRUE
              AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
          )
        )
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- user_roles
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND ur.is_active = TRUE AND r.name = 'admin'
    )
  );

-- catalog (public read)
CREATE POLICY "restaurants_public_read" ON public.restaurants FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "menu_items_public_read" ON public.menu_items FOR SELECT
  USING (is_available = TRUE);

-- favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- coupons (read active only)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT
  USING (is_active = TRUE);

-- cities (public read active)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT
  USING (is_active = TRUE);

-- order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_status_history_insert" ON public.order_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (
          o.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND ur.is_active = TRUE
              AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
          )
        )
    )
  );

CREATE POLICY "order_status_history_select" ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (
          o.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND ur.is_active = TRUE
              AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
          )
        )
    )
  );

-- =============================================================================
-- 6. COURIER: один заказ — один курьер
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS courier_orders_order_id_unique
  ON public.courier_orders (order_id);

-- =============================================================================
-- 7. TRIGGER FUNCTIONS — search_path hardening
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_restaurant_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.restaurants
  SET rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE restaurant_id = NEW.restaurant_id),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE restaurant_id = NEW.restaurant_id),
      updated_at = NOW()
  WHERE id = NEW.restaurant_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5 FOR 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE year_month || '%';
  new_number := year_month || LPAD(sequence_num::TEXT, 6, '0');
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_confirm_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    NEW.estimated_time := NOW() + INTERVAL '40 minutes';
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;

-- =============================================================================
-- ПОСЛЕ ЗАПУСКА — проверка (опционально)
-- =============================================================================
-- SELECT policyname, tablename FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('orders','addresses','courier_orders')
--   ORDER BY tablename, policyname;
--
-- SELECT indexname FROM pg_indexes
--   WHERE indexname = 'courier_orders_order_id_unique';
