# Настройка админ-панели (production)

Доступ к `/admin` имеет **только один** аккаунт: UUID из `ADMIN_USER_ID` + роль `admin` в базе данных.

## 1. Переменные окружения

### Vercel (Settings → Environment Variables)

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (только сервер) |
| `NEXT_PUBLIC_CITY` | Город по умолчанию (например `Сураж`) |
| `ADMIN_USER_ID` | UUID единственного platform-admin из `auth.users` |

Задайте переменные для **Production**, **Preview** и **Development**.

### Локально (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_CITY=Сураж
ADMIN_USER_ID=your-user-uuid-here
```

Ключи: Supabase → **Project Settings** → **API**.

## 2. SQL: таблицы и первый admin

### A) Таблицы админ-платформы (если ещё не применяли)

Supabase → **SQL Editor** → выполните целиком:

`supabase/PRODUCTION-INSERT-ADMIN-PLATFORM.sql`

### B) Назначить роль admin

1. Узнайте свой UUID:

```sql
SELECT id, email FROM auth.users ORDER BY created_at;
```

2. Вставьте UUID и выполните `supabase/INSERT-ADMIN-ROLE.sql` (замените `YOUR_USER_UUID`).

   Скрипт также записывает `platform_admin_user_id` в `app_settings` — это должно совпадать с `ADMIN_USER_ID` в Vercel (нужно для RLS в БД).

### C) Ошибка RLS «infinite recursion»

Сначала выполните: `supabase/PRODUCTION-PATCH-RLS-RECURSION.sql`

### D) Синхронизация RLS с ADMIN_USER_ID

Выполните: `supabase/PRODUCTION-PATCH-PLATFORM-ADMIN-RLS.sql`, затем `supabase/INSERT-ADMIN-ROLE.sql`.

## 3. Безопасность

- Без `ADMIN_USER_ID` — никто не попадёт в `/admin` (middleware + `requireAdmin`).
- Роль `admin` **не назначается** через UI (`/admin/users`, `/admin/restaurant-admins` возвращают 403).
- `ADMIN_USER_ID` — серверная переменная (не `NEXT_PUBLIC_*`).
- RLS в PostgreSQL проверяет тот же UUID через `app_settings.platform_admin_user_id` — произвольный `admin` в `user_roles` не сможет менять admin-таблицы через PostgREST.
- URL баннеров валидируются на сервере: изображения — Supabase Storage или allowlist; ссылки — относительные пути или HTTPS на домен приложения.

## 4. Redeploy на Vercel

1. Сохраните env vars.
2. **Deployments** → последний деплой → **Redeploy** (рекомендуется без build cache).
3. Выйдите и войдите снова под admin-аккаунтом (обновление JWT).

## 5. Smoke test

| URL | Ожидание |
|-----|----------|
| `/admin` (admin-аккаунт) | Админ-панель |
| `/admin` (другой пользователь) | Редирект на `/` |
| `/admin/logs` | Журнал действий после изменений |
| `/` | Баннеры (если есть активные для `NEXT_PUBLIC_CITY`) |

## 6. Аудит и валидация

- Все POST/PATCH/DELETE в `/api/admin/*` пишут в `admin_audit_logs`.
- Тело запросов валидируется через Zod (`src/lib/admin/schemas.ts`), ошибки — 400 на русском.
