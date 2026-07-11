-- Phase 1: Lock grocery SECURITY DEFINER RPCs
-- - Bind caller identity when JWT present
-- - Revoke EXECUTE from PUBLIC / anon / authenticated (API uses service_role)
-- - Re-apply anon revoke on helper functions (prod still granted anon)

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
  -- Defense in depth: JWT callers cannot impersonate another user.
  -- Service-role API calls have auth.uid() IS NULL and are allowed.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden: user_id mismatch';
  END IF;

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

  INSERT INTO addresses (user_id, address_text, apartment, entrance, floor, comment, is_default)
  VALUES (p_user_id, p_address_text, p_apartment, p_entrance, p_floor, p_comment, FALSE)
  RETURNING id INTO v_address_id;

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

-- restore_grocery_order_stock: body unchanged (called from cancel trigger).
-- Client EXECUTE revoked below — direct PostgREST abuse is blocked.

REVOKE ALL ON FUNCTION public.checkout_grocery_order(
  UUID, UUID, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.restore_grocery_order_stock(UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.checkout_grocery_order(
  UUID, UUID, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

GRANT EXECUTE ON FUNCTION public.restore_grocery_order_stock(UUID) TO service_role;

-- Re-apply helper revokes (anon still had EXECUTE in production)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_grocery_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_courier() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_grocery_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_grocery_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_courier() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_grocery_store(UUID) TO authenticated;
