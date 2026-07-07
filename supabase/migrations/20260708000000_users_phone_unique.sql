-- Уникальный телефон: один номер — один аккаунт
-- Перед применением удалите дубликаты:
--   SELECT phone, COUNT(*) FROM public.users WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
  ON public.users (phone)
  WHERE phone IS NOT NULL AND phone <> '';
