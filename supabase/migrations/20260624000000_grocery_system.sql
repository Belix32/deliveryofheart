-- =============================================================================
-- DELIVERYHEART — GROCERY / PRODUCTS MODULE
-- Migration: 20260624000000_grocery_system.sql
--
-- Применение (Supabase Dashboard → SQL Editor → New query → Run):
--   1. Скопируйте весь файл и выполните целиком.
--   2. После миграции назначьте роль grocery_owner владельцу магазинов
--      (см. раздел 12 в конце файла).
--   3. Опционально: раскомментируйте блок SEED в конце для тестовых данных.
--
-- Требования: уже применены базовые таблицы (users, orders, coupons, roles,
-- user_roles, couriers) и миграция auth/RLS (20260424000000_*).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. EXTENSIONS & ENUMS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grocery_product_unit') THEN
    CREATE TYPE grocery_product_unit AS ENUM ('шт', 'кг', 'л', 'уп');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type_enum') THEN
    CREATE TYPE order_type_enum AS ENUM ('food', 'grocery');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_scope_enum') THEN
    CREATE TYPE coupon_scope_enum AS ENUM ('food', 'grocery');
  END IF;
END $$;

-- =============================================================================
-- 2. GROCERY STORES (несколько магазинов, один владелец)
-- =============================================================================

CREATE TABLE IF NOT EXISTS grocery_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Сураж',
  address TEXT NOT NULL,
  phone TEXT,
  image_url TEXT,
  cover_url TEXT,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 500,
  delivery_price NUMERIC(10, 2) NOT NULL DEFAULT 250,
  delivery_time_min INTEGER NOT NULL DEFAULT 30,
  delivery_time_max INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grocery_stores_slug_unique UNIQUE (slug),
  CONSTRAINT grocery_stores_min_order_nonneg CHECK (min_order_amount >= 0),
  CONSTRAINT grocery_stores_delivery_price_nonneg CHECK (delivery_price >= 0)
);

COMMENT ON TABLE grocery_stores IS 'Магазины продуктов. Несколько точек, один owner_user_id.';
COMMENT ON COLUMN grocery_stores.min_order_amount IS 'Минимальная сумма заказа — задаёт владелец для каждой точки';
COMMENT ON COLUMN grocery_stores.delivery_price IS 'Стоимость доставки (по умолчанию 250 ₽)';

-- =============================================================================
-- 3. GROCERY CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS grocery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES grocery_stores(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES grocery_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grocery_categories_store_slug_unique UNIQUE (store_id, slug)
);

COMMENT ON TABLE grocery_categories IS 'Категории товаров внутри магазина';

-- =============================================================================
-- 4. PRODUCTS (включая весовые: кг, дробное количество)
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES grocery_stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES grocery_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC(10, 2) NOT NULL,
  old_price NUMERIC(10, 2),
  unit grocery_product_unit NOT NULL DEFAULT 'шт',
  quantity_step NUMERIC(10, 3) NOT NULL DEFAULT 1,
  min_quantity NUMERIC(10, 3) NOT NULL DEFAULT 1,
  max_quantity NUMERIC(10, 3),
  weight_label TEXT,
  image_url TEXT,
  stock NUMERIC(10, 3) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_price_positive CHECK (price > 0),
  CONSTRAINT products_stock_nonneg CHECK (stock >= 0),
  CONSTRAINT products_quantity_step_positive CHECK (quantity_step > 0),
  CONSTRAINT products_min_quantity_positive CHECK (min_quantity > 0),
  CONSTRAINT products_max_quantity_check CHECK (
    max_quantity IS NULL OR max_quantity >= min_quantity
  )
);

COMMENT ON TABLE products IS 'Товары магазина. price — цена за единицу (за кг / шт / л / уп)';
COMMENT ON COLUMN products.quantity_step IS 'Шаг добавления в корзину: 0.1 для кг, 1 для шт';
COMMENT ON COLUMN products.stock IS 'Остаток в единицах товара (кг, шт, л, уп)';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_sku_unique
  ON products (store_id, sku)
  WHERE sku IS NOT NULL;

-- =============================================================================
-- 5. GROCERY ORDER ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS grocery_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity NUMERIC(10, 3) NOT NULL,
  unit grocery_product_unit NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grocery_order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT grocery_order_items_price_positive CHECK (price > 0),
  CONSTRAINT grocery_order_items_total_positive CHECK (total_price > 0)
);

COMMENT ON TABLE grocery_order_items IS 'Позиции заказа продуктов (снимок цены/названия на момент заказа)';

-- =============================================================================
-- 6. ALTER EXISTING TABLES — orders & coupons
-- =============================================================================

-- Тип заказа: еда или продукты
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_type order_type_enum NOT NULL DEFAULT 'food';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS grocery_store_id UUID REFERENCES grocery_stores(id) ON DELETE RESTRICT;

-- restaurant_id становится nullable для заказов продуктов
ALTER TABLE orders
  ALTER COLUMN restaurant_id DROP NOT NULL;

-- Купоны: отдельные для еды и продуктов
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS scope coupon_scope_enum NOT NULL DEFAULT 'food';

COMMENT ON COLUMN coupons.scope IS 'food — только рестораны; grocery — только продукты';

-- Согласованность типа заказа и FK
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_target_check;

ALTER TABLE orders ADD CONSTRAINT orders_type_target_check CHECK (
  (
    order_type = 'food'
    AND restaurant_id IS NOT NULL
    AND grocery_store_id IS NULL
  )
  OR
  (
    order_type = 'grocery'
    AND grocery_store_id IS NOT NULL
    AND restaurant_id IS NULL
  )
);

-- =============================================================================
-- 7. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_grocery_stores_owner ON grocery_stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_stores_city ON grocery_stores(city);
CREATE INDEX IF NOT EXISTS idx_grocery_stores_active ON grocery_stores(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_grocery_categories_store ON grocery_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_grocery_categories_parent ON grocery_categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(store_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin (to_tsvector('russian', name));

CREATE INDEX IF NOT EXISTS idx_grocery_order_items_order ON grocery_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_grocery_order_items_product ON grocery_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_grocery_store ON orders(grocery_store_id) WHERE grocery_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coupons_scope ON coupons(scope);

-- =============================================================================
-- 8. TRIGGERS — updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grocery_stores_updated_at ON grocery_stores;
CREATE TRIGGER grocery_stores_updated_at
  BEFORE UPDATE ON grocery_stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS grocery_categories_updated_at ON grocery_categories;
CREATE TRIGGER grocery_categories_updated_at
  BEFORE UPDATE ON grocery_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Категория должна принадлежать тому же магазину, что и товар
CREATE OR REPLACE FUNCTION public.trg_products_category_same_store()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM grocery_categories c
    WHERE c.id = NEW.category_id
      AND c.store_id = NEW.store_id
  ) THEN
    RAISE EXCEPTION 'Category does not belong to the product store';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_category_store_check ON products;
CREATE TRIGGER products_category_store_check
  BEFORE INSERT OR UPDATE OF category_id, store_id ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_products_category_same_store();

-- =============================================================================
-- 9. HELPER FUNCTIONS — роли и доступ
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = TRUE
      AND r.name = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_grocery_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = TRUE
      AND r.name = 'grocery_owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_grocery_store(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM grocery_stores gs
    WHERE gs.id = p_store_id
      AND gs.owner_user_id = auth.uid()
  )
  OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_courier()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = TRUE
      AND r.name = 'courier'
  );
$$;

-- Округление количества до шага (для валидации)
CREATE OR REPLACE FUNCTION public.grocery_round_to_step(
  p_quantity NUMERIC,
  p_step NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ratio NUMERIC;
BEGIN
  IF p_step <= 0 THEN
    RAISE EXCEPTION 'quantity_step must be positive';
  END IF;
  v_ratio := p_quantity / p_step;
  IF abs(v_ratio - round(v_ratio)) > 0.0001 THEN
    RAISE EXCEPTION 'quantity % is not a multiple of step %', p_quantity, p_step;
  END IF;
  RETURN round(p_quantity, 3);
END;
$$;

-- =============================================================================
-- 10. CHECKOUT RPC — атомарное оформление заказа продуктов
-- =============================================================================

CREATE OR REPLACE FUNCTION public.checkout_grocery_order(
  p_user_id UUID,
  p_store_id UUID,
  p_items JSONB,
  p_address_text TEXT,
  p_apartment TEXT DEFAULT NULL,
  p_entrance TEXT DEFAULT NULL,
  p_floor TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'cash',
  p_delivery_city TEXT DEFAULT 'Сураж'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store grocery_stores%ROWTYPE;
  v_order_id UUID;
  v_order_number TEXT;
  v_address_id UUID;
  v_item JSONB;
  v_product products%ROWTYPE;
  v_product_id UUID;
  v_quantity NUMERIC(10, 3);
  v_price NUMERIC(10, 2);
  v_line_total NUMERIC(10, 2);
  v_subtotal NUMERIC(10, 2) := 0;
  v_delivery_price NUMERIC(10, 2);
  v_discount NUMERIC(10, 2) := 0;
  v_final NUMERIC(10, 2);
  v_coupon coupons%ROWTYPE;
  v_item_count INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items array is required';
  END IF;

  SELECT * INTO v_store
  FROM grocery_stores
  WHERE id = p_store_id AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grocery store not found or inactive';
  END IF;

  v_delivery_price := COALESCE(v_store.delivery_price, 250);

  -- Валидация позиций и блокировка остатков
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC(10, 3);
    v_price := (v_item->>'price')::NUMERIC(10, 2);

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item payload';
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = v_product_id
      AND store_id = p_store_id
      AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found in store', v_product_id;
    END IF;

    PERFORM public.grocery_round_to_step(v_quantity, v_product.quantity_step);

    IF v_quantity < v_product.min_quantity THEN
      RAISE EXCEPTION 'Quantity below minimum for product %', v_product.name;
    END IF;

    IF v_product.max_quantity IS NOT NULL AND v_quantity > v_product.max_quantity THEN
      RAISE EXCEPTION 'Quantity above maximum for product %', v_product.name;
    END IF;

    IF v_product.stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
    END IF;

    IF v_price IS NULL OR abs(v_price - v_product.price) > 0.01 THEN
      RAISE EXCEPTION 'Price mismatch for product %', v_product.name;
    END IF;

    v_line_total := round(v_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  IF v_subtotal < v_store.min_order_amount THEN
    RAISE EXCEPTION 'Order subtotal % is below minimum %', v_subtotal, v_store.min_order_amount;
  END IF;

  -- Купон только scope = grocery
  IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE upper(code) = upper(trim(p_coupon_code))
      AND scope = 'grocery'
      AND is_active = TRUE
      AND (valid_to IS NULL OR valid_to > NOW())
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid grocery coupon';
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;

    IF v_subtotal < COALESCE(v_coupon.min_order_amount, 0) THEN
      RAISE EXCEPTION 'Order amount below coupon minimum';
    END IF;

    IF v_coupon.discount_type = 'fixed' THEN
      v_discount := LEAST(v_coupon.discount_value, v_subtotal);
    ELSIF v_coupon.discount_type = 'percent' THEN
      v_discount := round(v_subtotal * v_coupon.discount_value / 100, 2);
    END IF;

    UPDATE coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = v_coupon.id;
  END IF;

  v_final := GREATEST(v_subtotal + v_delivery_price - v_discount, 0);

  -- Адрес доставки
  INSERT INTO addresses (user_id, address_text, apartment, entrance, floor, comment, is_default)
  VALUES (p_user_id, p_address_text, p_apartment, p_entrance, p_floor, p_comment, FALSE)
  RETURNING id INTO v_address_id;

  -- Номер заказа (формат как в food checkout: timestamp + random)
  v_order_number :=
    upper(to_hex((extract(epoch FROM clock_timestamp()) * 1000)::bigint))
    || upper(substr(md5(random()::text), 1, 4));

  INSERT INTO orders (
    order_number,
    user_id,
    order_type,
    grocery_store_id,
    restaurant_id,
    status,
    delivery_address_id,
    delivery_city,
    total_amount,
    delivery_price,
    discount_amount,
    coupon_code,
    final_amount,
    payment_method,
    payment_status,
    comment
  ) VALUES (
    v_order_number,
    p_user_id,
    'grocery',
    p_store_id,
    NULL,
    'pending',
    v_address_id,
    p_delivery_city,
    v_subtotal,
    v_delivery_price,
    v_discount,
    NULLIF(trim(p_coupon_code), ''),
    v_final,
    COALESCE(p_payment_method, 'cash'),
    'pending',
    p_comment
  )
  RETURNING id INTO v_order_id;

  -- Позиции + списание остатков
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::NUMERIC(10, 3);
    v_price := (v_item->>'price')::NUMERIC(10, 2);

    SELECT * INTO v_product FROM products WHERE id = v_product_id;

    v_line_total := round(v_price * v_quantity, 2);

    INSERT INTO grocery_order_items (
      order_id,
      product_id,
      product_name,
      sku,
      quantity,
      unit,
      price,
      total_price
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_quantity,
      v_product.unit,
      v_price,
      v_line_total
    );

    UPDATE products
    SET stock = stock - v_quantity,
        updated_at = NOW()
    WHERE id = v_product.id;
  END LOOP;

  INSERT INTO order_status_history (order_id, status, changed_by, note)
  VALUES (v_order_id, 'pending', p_user_id, 'Grocery order created');

  RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION public.checkout_grocery_order IS
  'Атомарное оформление заказа продуктов: проверка stock, min_order, купон grocery, списание остатков';

-- Возврат остатков при отмене grocery-заказа
CREATE OR REPLACE FUNCTION public.restore_grocery_order_stock(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_line grocery_order_items%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF NOT FOUND OR v_order.order_type <> 'grocery' THEN
    RETURN;
  END IF;

  IF v_order.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Order must be cancelled before stock restore';
  END IF;

  FOR v_line IN
    SELECT * FROM grocery_order_items WHERE order_id = p_order_id
  LOOP
    UPDATE products
    SET stock = stock + v_line.quantity,
        updated_at = NOW()
    WHERE id = v_line.product_id;
  END LOOP;
END;
$$;

-- Триггер: автоматический возврат stock при отмене
CREATE OR REPLACE FUNCTION public.trg_restore_grocery_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_type = 'grocery'
     AND NEW.status = 'cancelled'
     AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    PERFORM public.restore_grocery_order_stock(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_restore_grocery_stock ON orders;
CREATE TRIGGER orders_restore_grocery_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_restore_grocery_stock_on_cancel();

-- =============================================================================
-- 11. ROLE — grocery_owner
-- =============================================================================

INSERT INTO roles (name, display_name, description, permissions)
VALUES (
  'grocery_owner',
  'Владелец магазинов продуктов',
  'Управление всеми своими магазинами, товарами и заказами продуктов',
  '["manage_grocery_stores", "manage_products", "view_grocery_orders", "manage_grocery_orders"]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- =============================================================================
-- 12. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE grocery_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_order_items ENABLE ROW LEVEL SECURITY;

-- grocery_stores
DROP POLICY IF EXISTS grocery_stores_public_read ON grocery_stores;
CREATE POLICY grocery_stores_public_read ON grocery_stores
  FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS grocery_stores_owner_select ON grocery_stores;
CREATE POLICY grocery_stores_owner_select ON grocery_stores
  FOR SELECT
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS grocery_stores_owner_update ON grocery_stores;
CREATE POLICY grocery_stores_owner_update ON grocery_stores
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS grocery_stores_admin_insert ON grocery_stores;
CREATE POLICY grocery_stores_admin_insert ON grocery_stores
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS grocery_stores_admin_delete ON grocery_stores;
CREATE POLICY grocery_stores_admin_delete ON grocery_stores
  FOR DELETE
  USING (public.is_admin());

-- grocery_categories
DROP POLICY IF EXISTS grocery_categories_public_read ON grocery_categories;
CREATE POLICY grocery_categories_public_read ON grocery_categories
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM grocery_stores gs
      WHERE gs.id = grocery_categories.store_id AND gs.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS grocery_categories_owner_manage ON grocery_categories;
CREATE POLICY grocery_categories_owner_manage ON grocery_categories
  FOR ALL
  USING (public.owns_grocery_store(store_id))
  WITH CHECK (public.owns_grocery_store(store_id));

-- products
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products
  FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM grocery_stores gs
      WHERE gs.id = products.store_id AND gs.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS products_owner_manage ON products;
CREATE POLICY products_owner_manage ON products
  FOR ALL
  USING (public.owns_grocery_store(store_id))
  WITH CHECK (public.owns_grocery_store(store_id));

-- grocery_order_items
DROP POLICY IF EXISTS grocery_order_items_select ON grocery_order_items;
CREATE POLICY grocery_order_items_select ON grocery_order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = grocery_order_items.order_id
        AND (
          o.user_id = auth.uid()
          OR public.is_admin()
          OR public.is_courier()
          OR (
            o.grocery_store_id IS NOT NULL
            AND public.owns_grocery_store(o.grocery_store_id)
          )
        )
    )
  );

-- Расширение политик orders для grocery_owner и grocery-заказов
DROP POLICY IF EXISTS orders_grocery_owner_select ON orders;
CREATE POLICY orders_grocery_owner_select ON orders
  FOR SELECT
  USING (
    order_type = 'grocery'
    AND grocery_store_id IS NOT NULL
    AND public.owns_grocery_store(grocery_store_id)
  );

DROP POLICY IF EXISTS orders_grocery_owner_update ON orders;
CREATE POLICY orders_grocery_owner_update ON orders
  FOR UPDATE
  USING (
    order_type = 'grocery'
    AND grocery_store_id IS NOT NULL
    AND public.owns_grocery_store(grocery_store_id)
  );

-- Клиент видит свои grocery-заказы (дополняет orders_select_own)
-- orders_select_own уже покрывает user_id = auth.uid()

COMMIT;

-- =============================================================================
-- 13. НАЗНАЧЕНИЕ РОЛИ ВЛАДЕЛЬЦА (выполните вручную после регистрации пользователя)
-- =============================================================================
--
-- 1. Узнайте UUID пользователя-владельца:
--    SELECT id, email FROM auth.users WHERE email = 'owner@example.com';
--
-- 2. Назначьте роль grocery_owner:
--    INSERT INTO user_roles (user_id, role_id, is_active)
--    SELECT
--      'ВАШ_UUID_ПОЛЬЗОВАТЕЛЯ'::UUID,
--      r.id,
--      TRUE
--    FROM roles r
--    WHERE r.name = 'grocery_owner'
--    ON CONFLICT DO NOTHING;
--
-- 3. При создании магазина укажите owner_user_id = UUID владельца.
--
-- =============================================================================
-- 14. OPTIONAL SEED — тестовые магазины и товары для Суража
--     Раскомментируйте и подставьте UUID владельца перед запуском.
-- =============================================================================

/*
DO $$
DECLARE
  v_owner UUID := '00000000-0000-0000-0000-000000000000'; -- ← ЗАМЕНИТЕ
  v_store1 UUID;
  v_store2 UUID;
  v_cat_ovosh UUID;
  v_cat_mol UUID;
  v_cat_bak UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner) THEN
    RAISE EXCEPTION 'Owner user % not found in auth.users', v_owner;
  END IF;

  INSERT INTO grocery_stores (
    owner_user_id, name, slug, city, address, phone,
    min_order_amount, delivery_price, delivery_time_min, delivery_time_max, sort_order
  ) VALUES (
    v_owner, 'Магазин на Ленина', 'lenina', 'Сураж', 'ул. Ленина, 12', '+7 (900) 000-00-01',
    800, 250, 30, 60, 1
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_store1;

  INSERT INTO grocery_stores (
    owner_user_id, name, slug, city, address, phone,
    min_order_amount, delivery_price, delivery_time_min, delivery_time_max, sort_order
  ) VALUES (
    v_owner, 'Магазин на Советской', 'sovetskaya', 'Сураж', 'ул. Советская, 5', '+7 (900) 000-00-02',
    500, 250, 25, 50, 2
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_store2;

  -- Категории магазина 1
  INSERT INTO grocery_categories (store_id, name, slug, sort_order)
  VALUES (v_store1, 'Овощи', 'ovoshchi', 1)
  ON CONFLICT (store_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_ovosh;

  INSERT INTO grocery_categories (store_id, name, slug, sort_order)
  VALUES (v_store1, 'Молочка', 'molochnaya', 2)
  ON CONFLICT (store_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_mol;

  INSERT INTO grocery_categories (store_id, name, slug, sort_order)
  VALUES (v_store1, 'Бакалея', 'bakaleya', 3)
  ON CONFLICT (store_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_bak;

  -- Весовые и штучные товары
  INSERT INTO products (store_id, category_id, name, sku, price, unit, quantity_step, min_quantity, stock, weight_label)
  VALUES
    (v_store1, v_cat_ovosh, 'Картофель', 'KRT001', 45, 'кг', 0.1, 0.1, 200, 'свежий'),
    (v_store1, v_cat_ovosh, 'Морковь', 'MOR001', 55, 'кг', 0.1, 0.1, 80, 'свежая'),
    (v_store1, v_cat_ovosh, 'Лук репчатый', 'LUK001', 40, 'кг', 0.1, 0.1, 100, NULL),
    (v_store1, v_cat_mol, 'Молоко 3.2% 1л', 'MLK001', 89, 'шт', 1, 1, 40, '1 л'),
    (v_store1, v_cat_mol, 'Сметана 20% 400г', 'SMT001', 95, 'шт', 1, 1, 25, '400 г'),
    (v_store1, v_cat_mol, 'Яйца С0 10шт', 'EGG001', 110, 'уп', 1, 1, 20, '10 шт'),
    (v_store1, v_cat_bak, 'Гречка', 'GRK001', 120, 'кг', 0.1, 0.1, 50, 'крупа'),
    (v_store1, v_cat_bak, 'Рис', 'RIS001', 130, 'кг', 0.1, 0.1, 45, 'крупа'),
    (v_store1, v_cat_bak, 'Макароны 450г', 'MKR001', 65, 'шт', 1, 1, 60, '450 г')
  ON CONFLICT DO NOTHING;

  -- Тестовый купон на продукты
  INSERT INTO coupons (code, description, scope, discount_type, discount_value, min_order_amount, is_active)
  VALUES (
    'PRODUKTY10',
    'Скидка 10% на заказ продуктов',
    'grocery',
    'percent',
    10,
    500,
    TRUE
  )
  ON CONFLICT (code) DO UPDATE SET scope = 'grocery';

  RAISE NOTICE 'Seed completed for stores % and %', v_store1, v_store2;
END $$;
*/

-- =============================================================================
-- 15. ПРОВЕРКА ПОСЛЕ МИГРАЦИИ
-- =============================================================================
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('grocery_stores','grocery_categories','products','grocery_order_items');
--
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('order_type','grocery_store_id');
--
-- SELECT name FROM roles WHERE name = 'grocery_owner';
--
-- SELECT scope, COUNT(*) FROM coupons GROUP BY scope;
--
-- =============================================================================
