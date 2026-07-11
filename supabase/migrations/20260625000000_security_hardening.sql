-- Security hardening migration (Supabase advisors)
-- Fixes: RLS on cities, permissive order_status_history insert, legacy function exposure

-- 1. cities: enable RLS with public read for active cities
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cities_public_read ON cities;
CREATE POLICY cities_public_read ON cities FOR SELECT USING (is_active = TRUE);

-- 2. order_status_history: restrict inserts to order participants / staff
DROP POLICY IF EXISTS order_status_history_insert ON order_status_history;
CREATE POLICY order_status_history_insert ON order_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND (
          o.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
              AND ur.is_active = TRUE
              AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin')
          )
        )
    )
  );

-- 3. Legacy parking functions: revoke public/anon/authenticated execute
REVOKE ALL ON FUNCTION public.handle_new_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_parking_rating() FROM PUBLIC, anon, authenticated;

-- 4. Grocery helper functions: authenticated only (used inside RLS policies)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_grocery_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_courier() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_grocery_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_grocery_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_courier() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_grocery_store(UUID) TO authenticated;

-- 5. Deliveryheart triggers: pin search_path
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE restaurants
    SET rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE restaurant_id = NEW.restaurant_id),
        review_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = NEW.restaurant_id),
        updated_at = NOW()
    WHERE id = NEW.restaurant_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_order_number()
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
    INTO sequence_num FROM orders WHERE order_number LIKE year_month || '%';
    new_number := year_month || LPAD(sequence_num::TEXT, 6, '0');
    NEW.order_number := new_number;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_confirm_order()
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
