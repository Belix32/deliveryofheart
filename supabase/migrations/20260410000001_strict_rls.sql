-- Strict RLS policies (replaces EMERGENCY-RLS-FIX.sql open policies)

-- ORDERS
DROP POLICY IF EXISTS "orders_open_all" ON orders;
DROP POLICY IF EXISTS "orders_read_all" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update_all" ON orders;
DROP POLICY IF EXISTS "orders_user_select" ON orders;
DROP POLICY IF EXISTS "orders_user_insert" ON orders;
DROP POLICY IF EXISTS "orders_user_update" ON orders;

CREATE POLICY "orders_select_own" ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_select_staff" ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = TRUE
        AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = TRUE
        AND ur.restaurant_id = orders.restaurant_id
        AND r.name IN ('restaurant_owner', 'restaurant_admin')
    )
  );

CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_staff" ON orders FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = TRUE
        AND (
          r.name = 'admin'
          OR (r.name IN ('restaurant_owner', 'restaurant_admin') AND ur.restaurant_id = orders.restaurant_id)
          OR (r.name = 'courier' AND orders.courier_id IN (
            SELECT c.id FROM couriers c WHERE c.user_id = auth.uid()
          ))
        )
    )
  );

-- ADDRESSES
DROP POLICY IF EXISTS "addresses_open_all" ON addresses;
DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;

CREATE POLICY "addresses_select_own" ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_open_all" ON order_items;
DROP POLICY IF EXISTS "order_items_select" ON order_items;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;

CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          o.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() AND ur.is_active = TRUE
              AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
          )
        )
    )
  );

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- USER ROLES
DROP POLICY IF EXISTS "user_roles_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON user_roles;

CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_admin" ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND ur.is_active = TRUE AND r.name = 'admin'
    )
  );

-- RESTAURANTS & MENU (public read)
DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "menu_items_public_read" ON menu_items;
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (is_available = TRUE);

-- FAVORITES
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_own" ON favorites;
CREATE POLICY "favorites_own" ON favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- COUPONS public read for active
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_public_read" ON coupons;
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT
  USING (is_active = TRUE);
