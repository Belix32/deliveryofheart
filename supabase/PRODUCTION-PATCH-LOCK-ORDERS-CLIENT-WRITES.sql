-- Phase 2: Block authenticated client INSERT/self-UPDATE on orders.
-- All legitimate mutations go through Next.js APIs with service_role.

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE
  USING (public.can_update_order_as_staff(restaurant_id, courier_id));
