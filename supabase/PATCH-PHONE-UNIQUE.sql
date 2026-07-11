-- Вставьте в Supabase SQL Editor (проект delivery)
-- Один телефон = один аккаунт

-- Посмотреть дубликаты (если есть):
-- SELECT phone, array_agg(email) FROM public.users WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON public.users (phone)
  WHERE phone IS NOT NULL AND phone <> '';
