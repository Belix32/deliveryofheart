-- Couriers profiles are created only via service-role admin/API paths.
-- Block authenticated self-insert of courier rows.
DROP POLICY IF EXISTS "couriers_insert_own" ON public.couriers;
DROP POLICY IF EXISTS couriers_insert_own ON public.couriers;
