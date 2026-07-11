-- =============================================================================
-- PRODUCTION-PATCH-PLATFORM-ADMIN-RLS.sql
-- =============================================================================
-- Синхронизирует RLS с ADMIN_USER_ID: только designated platform admin
-- может менять admin-таблицы через PostgREST.
--
-- Как применить:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Вставьте весь этот файл → Run
--   3. Затем выполните supabase/INSERT-ADMIN-ROLE.sql (с вашим UUID)
--
-- Безопасно запускать повторно.
-- =============================================================================

-- Align database RLS with ADMIN_USER_ID: only the designated platform admin
-- may mutate admin tables via PostgREST (not any user_roles.admin row).

CREATE OR REPLACE FUNCTION public.get_platform_admin_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(trim(both '"' from value::text), '')::uuid
  FROM public.app_settings
  WHERE key = 'platform_admin_user_id'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    AND auth.uid() IS NOT NULL
    AND auth.uid() = public.get_platform_admin_user_id();
$$;

REVOKE ALL ON FUNCTION public.get_platform_admin_user_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Admin platform tables
DROP POLICY IF EXISTS banners_admin_manage ON public.banners;
CREATE POLICY banners_admin_manage ON public.banners
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS delivery_zones_admin_manage ON public.delivery_zones;
CREATE POLICY delivery_zones_admin_manage ON public.delivery_zones
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS app_settings_admin_manage ON public.app_settings;
CREATE POLICY app_settings_admin_manage ON public.app_settings
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS notification_templates_admin_manage ON public.notification_templates;
CREATE POLICY notification_templates_admin_manage ON public.notification_templates
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS notification_campaigns_admin_manage ON public.notification_campaigns;
CREATE POLICY notification_campaigns_admin_manage ON public.notification_campaigns
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS admin_audit_logs_admin_manage ON public.admin_audit_logs;
CREATE POLICY admin_audit_logs_admin_manage ON public.admin_audit_logs
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- user_roles: only platform admin reads all roles
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (public.is_platform_admin());

-- Grocery admin policies
DROP POLICY IF EXISTS grocery_stores_admin_insert ON public.grocery_stores;
CREATE POLICY grocery_stores_admin_insert ON public.grocery_stores
  FOR INSERT WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS grocery_stores_admin_delete ON public.grocery_stores;
CREATE POLICY grocery_stores_admin_delete ON public.grocery_stores
  FOR DELETE USING (public.is_platform_admin());

DROP POLICY IF EXISTS grocery_stores_admin_update ON public.grocery_stores;
CREATE POLICY grocery_stores_admin_update ON public.grocery_stores
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS grocery_stores_admin_select ON public.grocery_stores;
CREATE POLICY grocery_stores_admin_select ON public.grocery_stores
  FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS grocery_categories_admin_manage ON public.grocery_categories;
CREATE POLICY grocery_categories_admin_manage ON public.grocery_categories
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS products_admin_manage ON public.products;
CREATE POLICY products_admin_manage ON public.products
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Order staff helpers: admin branch requires designated platform admin
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
        r.name = 'courier'
        OR (
          r.name = 'admin'
          AND ur.user_id = public.get_platform_admin_user_id()
        )
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
        (
          r.name = 'admin'
          AND ur.user_id = public.get_platform_admin_user_id()
        )
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

REVOKE ALL ON FUNCTION public.can_view_order_as_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_update_order_as_staff(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_order_as_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_update_order_as_staff(UUID, UUID) TO authenticated;

-- Grocery order items: admin read only for platform admin
DROP POLICY IF EXISTS grocery_order_items_select ON public.grocery_order_items;
CREATE POLICY grocery_order_items_select ON public.grocery_order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = grocery_order_items.order_id
        AND (
          o.user_id = auth.uid()
          OR public.is_platform_admin()
          OR public.is_courier()
          OR (
            o.grocery_store_id IS NOT NULL
            AND public.owns_grocery_store(o.grocery_store_id)
          )
        )
    )
  );

-- owns_grocery_store: platform admin only (not any user_roles.admin)
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
  OR public.is_platform_admin();
$$;

REVOKE ALL ON FUNCTION public.owns_grocery_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_grocery_store(UUID) TO authenticated;

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
      AND (
        r.name IN ('courier', 'restaurant_owner', 'restaurant_admin', 'grocery_owner')
        OR (
          r.name = 'admin'
          AND ur.user_id = public.get_platform_admin_user_id()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_member() TO authenticated;

INSERT INTO public.app_settings (key, value)
SELECT 'platform_admin_user_id', to_jsonb(ur.user_id::text)
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE r.name = 'admin' AND ur.is_active = TRUE
ORDER BY ur.created_at ASC NULLS LAST
LIMIT 1
ON CONFLICT (key) DO NOTHING;
