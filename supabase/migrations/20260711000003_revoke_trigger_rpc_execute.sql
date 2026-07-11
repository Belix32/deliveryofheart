-- Revoke direct PostgREST execute on trigger / auth helper SECURITY DEFINER funcs.
-- Triggers still run as function owners; clients must not call these via /rpc.

REVOKE ALL ON FUNCTION public.trg_restore_grocery_stock_on_cancel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
