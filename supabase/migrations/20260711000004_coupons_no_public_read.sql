-- Remove public coupon enumeration; coupons are validated via service-role checkout APIs.
DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;

-- Platform admin manage (admin UI uses service role; defense-in-depth for PostgREST)
DROP POLICY IF EXISTS coupons_admin_manage ON public.coupons;
CREATE POLICY coupons_admin_manage ON public.coupons
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());
