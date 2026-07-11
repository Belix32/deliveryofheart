-- =============================================================================
-- Назначить роль platform admin
-- =============================================================================
-- Куда: Supabase → SQL Editor → New query → Run
--
-- Выполните ПОСЛЕ PRODUCTION-INSERT-ADMIN-PLATFORM.sql
-- и ПОСЛЕ PRODUCTION-PATCH-PLATFORM-ADMIN-RLS.sql (или миграции platform_admin_rls).
--
-- 1. Узнайте UUID: SELECT id, email FROM auth.users ORDER BY created_at;
-- 2. Замените YOUR_USER_UUID ниже на свой UUID (тот же, что ADMIN_USER_ID в Vercel).
-- =============================================================================

-- Назначить роль admin
INSERT INTO public.user_roles (user_id, role_id, restaurant_id, is_active)
SELECT
  'YOUR_USER_UUID'::uuid,
  r.id,
  NULL,
  TRUE
FROM public.roles r
WHERE r.name = 'admin'
ON CONFLICT (user_id, role_id, restaurant_id)
DO UPDATE SET is_active = TRUE;

-- Синхронизировать UUID с RLS (должен совпадать с ADMIN_USER_ID в приложении)
INSERT INTO public.app_settings (key, value)
VALUES ('platform_admin_user_id', to_jsonb('YOUR_USER_UUID'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Проверка
SELECT u.email, r.name AS role, ur.is_active
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN public.roles r ON r.id = ur.role_id
WHERE u.id = 'YOUR_USER_UUID'::uuid
  AND r.name = 'admin';
