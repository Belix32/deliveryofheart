-- =============================================================================
-- ВАШ ПЕРСОНАЛЬНЫЙ SETUP — i@ya.ru
-- =============================================================================
-- Куда: Supabase → проект delivery → SQL Editor → New query → Run
--
-- Выполните ПОСЛЕ PRODUCTION-INSERT-ADMIN-PLATFORM.sql
-- (или вместе с ним, если таблицы админки ещё не создавали).
-- =============================================================================


-- 1. Назначить роль admin вашему аккаунту
INSERT INTO public.user_roles (user_id, role_id, restaurant_id, is_active)
SELECT
  'ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5'::uuid,
  r.id,
  NULL,
  TRUE
FROM public.roles r
WHERE r.name = 'admin'
ON CONFLICT (user_id, role_id, restaurant_id)
DO UPDATE SET is_active = TRUE;


-- 2. Проверка (должна вернуть одну строку: i@ya.ru | admin | true)
SELECT u.email, r.name AS role, ur.is_active
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
JOIN public.roles r ON r.id = ur.role_id
WHERE u.id = 'ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5'::uuid
  AND r.name = 'admin';
