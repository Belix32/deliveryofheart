# Ваш setup — i@ya.ru

UUID: `ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5`

---

## Шаг 1 — SQL в Supabase

### A) Если ещё не применяли таблицы админки

SQL Editor → вставьте и выполните **целиком**:

`supabase/PRODUCTION-INSERT-ADMIN-PLATFORM.sql`

### B) Назначить себе роль admin

SQL Editor → вставьте и выполните **целиком**:

`supabase/INSERT-MY-ADMIN-ROLE.sql`

Должен вернуться результат проверки:

| email   | role  | is_active |
|---------|-------|-----------|
| i@ya.ru | admin | true      |

### C) Если была ошибка 500 в личном кабинете (рекурсия RLS)

Сначала выполните: `supabase/PRODUCTION-PATCH-RLS-RECURSION.sql`

---

## Шаг 2 — Vercel (Settings → Environment Variables)

Добавьте или обновите переменную (для **Production**, **Preview**, **Development**):

```
ADMIN_USER_ID=ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5
```

Остальные переменные должны уже быть (проверьте):

```
NEXT_PUBLIC_SUPABASE_URL=https://raafwoxicqyywpzjgovz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ваш anon key из Supabase → Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<ваш service role key>
NEXT_PUBLIC_CITY=Сураж
```

После сохранения → **Deployments → Redeploy** (лучше без build cache).

---

## Шаг 3 — Локально `.env.local`

Создайте или дополните файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://raafwoxicqyywpzjgovz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
NEXT_PUBLIC_CITY=Сураж
ADMIN_USER_ID=ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5
```

Ключи взять: Supabase → **Project Settings** → **API** → `anon` и `service_role`.

---

## Шаг 4 — Проверка

1. Выйти с сайта и войти снова под **i@ya.ru**
2. Открыть: https://deliveryheart.vercel.app/admin
3. Должна открыться админ-панель
4. С другого аккаунта `/admin` → редирект на главную

---

## Краткий чеклист

- [ ] `PRODUCTION-INSERT-ADMIN-PLATFORM.sql` выполнен в Supabase
- [ ] `INSERT-MY-ADMIN-ROLE.sql` выполнен в Supabase
- [ ] `ADMIN_USER_ID=ec8b3a07-9b99-4706-8b3d-8cc0e383a8b5` в Vercel
- [ ] Redeploy на Vercel
- [ ] То же в `.env.local` для локальной разработки
- [ ] Вход под i@ya.ru → `/admin` работает
