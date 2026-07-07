-- Fix infinite recursion in RLS policies (user_roles ↔ orders)
-- Use SECURITY DEFINER helpers instead of inline user_roles subqueries.

CREATE OR REPLACE FUNCTION public.is_staff_member()
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
      AND r.name IN ('admin', 'courier', 'restaurant_owner', 'restaurant_admin', 'grocery_owner')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_order_as_staff(p_restaurant_id UUID)
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
      AND (
        r.name IN ('admin', 'courier')
        OR (
          r.name IN ('restaurant_owner', 'restaurant_admin')
          AND ur.restaurant_id = p_restaurant_id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_update_order_as_staff(
  p_restaurant_id UUID,
  p_courier_id UUID
)
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
      AND (
        r.name = 'admin'
        OR (
          r.name IN ('restaurant_owner', 'restaurant_admin')
          AND ur.restaurant_id = p_restaurant_id
        )
        OR (
          r.name = 'courier'
          AND p_courier_id IS NOT NULL
          AND p_courier_id IN (SELECT c.id FROM couriers c WHERE c.user_id = auth.uid())
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_member() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_order_as_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_update_order_as_staff(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_order_as_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_update_order_as_staff(UUID, UUID) TO authenticated;

-- user_roles: stop self-referencing subquery
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (public.is_admin());

-- orders
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
CREATE POLICY "orders_select_staff" ON public.orders
  FOR SELECT USING (public.can_view_order_as_staff(restaurant_id));

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.can_update_order_as_staff(restaurant_id, courier_id)
  );

-- order_items
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_staff_member())
    )
  );

-- order_status_history
DROP POLICY IF EXISTS "order_status_history_insert" ON public.order_status_history;
CREATE POLICY "order_status_history_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (o.user_id = auth.uid() OR public.is_staff_member())
    )
  );

DROP POLICY IF EXISTS "order_status_history_select" ON public.order_status_history;
CREATE POLICY "order_status_history_select" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (o.user_id = auth.uid() OR public.is_staff_member())
    )
  );
