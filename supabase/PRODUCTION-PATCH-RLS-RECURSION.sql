-- =============================================================================
-- PRODUCTION-PATCH-RLS-RECURSION.sql
-- =============================================================================
-- Когда применять:
--   Вы уже выполнили PRODUCTION-FULL-SETUP.sql (или базовую схему), но
--   в личном кабинете / при загрузке заказов видите ошибку:
--   "infinite recursion detected in policy for relation user_roles"
--
-- Как применить:
--   1. Supabase Dashboard → ваш проект → SQL Editor → New query
--   2. SQL Editor → New query
--   3. Вставьте весь этот файл → Run
--
-- Безопасно запускать повторно (CREATE OR REPLACE + DROP POLICY IF EXISTS).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. is_admin() — нужна для политики user_roles_select_admin
--    (если уже есть из grocery-миграции — просто обновится)
-- -----------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- -----------------------------------------------------------------------------
-- 2. Вспомогательные функции (обход рекурсии RLS)
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- 3. Исправленные политики RLS
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
CREATE POLICY "orders_select_staff" ON public.orders
  FOR SELECT USING (public.can_view_order_as_staff(restaurant_id));

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.can_update_order_as_staff(restaurant_id, courier_id)
  );

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_staff_member())
    )
  );

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


-- =============================================================================
-- 4. (ОПЦИОНАЛЬНО) Назначить себе роль admin
-- =============================================================================
-- Админ-панель: /admin на вашем домене
-- Без роли admin middleware перенаправит на главную.
--
-- Шаг 1 — узнайте свой user_id:
--   SELECT id, email FROM auth.users ORDER BY created_at;
--
-- Шаг 2 — раскомментируйте и подставьте UUID, затем выполните:

/*
INSERT INTO public.user_roles (user_id, role_id, restaurant_id, is_active)
SELECT
  'ВАШ_USER_ID_СЮДА'::uuid,
  r.id,
  NULL,
  TRUE
FROM public.roles r
WHERE r.name = 'admin'
ON CONFLICT (user_id, role_id, restaurant_id)
DO UPDATE SET is_active = TRUE;
*/

-- Проверка:
-- SELECT u.email, r.name
-- FROM public.user_roles ur
-- JOIN auth.users u ON u.id = ur.user_id
-- JOIN public.roles r ON r.id = ur.role_id
-- WHERE ur.is_active = TRUE;
