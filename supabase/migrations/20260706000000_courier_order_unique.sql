-- Prevent two couriers from being assigned the same order
CREATE UNIQUE INDEX IF NOT EXISTS courier_orders_order_id_unique
  ON public.courier_orders (order_id);
