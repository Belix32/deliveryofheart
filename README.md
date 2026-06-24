# Доставка от души (Deliveryheart)

Сервис доставки еды для локального города. Клиентское приложение, админ-панель и курьерский интерфейс на одной кодовой базе.

**Стек:** Next.js 14, TypeScript, Supabase (PostgreSQL + Auth), Tailwind CSS

## Быстрый старт

```bash
git clone https://github.com/belix888/deliveryheart.git
cd deliveryheart
npm install
cp .env.example .env.local
# Заполните переменные Supabase в .env.local
npm run dev
```

Приложение: http://localhost:3000

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (только сервер) |
| `NEXT_PUBLIC_CITY` | Город запуска (по умолчанию: Сураж) |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry (опционально) |

## База данных

Миграции лежат в `supabase/migrations/`. Примените их в Supabase SQL Editor или через CLI:

```bash
npx supabase db push
```

Для локальной разработки с тестовыми данными:

```bash
node src/scripts/seed.mjs
```

### Порядок применения (если без CLI)

1. `supabase/migrations/20260410000000_initial_schema.sql`
2. `supabase/migrations/20260410000001_roles_and_couriers.sql`
3. `supabase/migrations/20260410000002_strict_rls.sql`

## Аутентификация

Вход и регистрация по **email и паролю** через Supabase Auth. SMS не используется.

В Supabase Dashboard → Authentication → Providers → Email:
- включите Email provider
- **отключите** «Confirm email», если нужен мгновенный вход без письма

Телефон при регистрации опционален — только для связи курьера с клиентом, не для входа.

После регистрации профиль синхронизируется в `public.users` через `/api/auth/sync-profile`.

## Деплой на Vercel

1. Импортируйте репозиторий в Vercel
2. Добавьте env-переменные из `.env.example`
3. Убедитесь, что `SUPABASE_SERVICE_ROLE_KEY` доступен только на сервере
4. Деплой: `main` / `master` ветка

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm run lint` | ESLint |
| `npm run typecheck` | Проверка TypeScript |
| `npm test` | Vitest |

## Структура

```
src/
  app/           # App Router (клиент, admin, courier, API)
  components/    # UI-компоненты
  context/       # React-контексты
  lib/           # Supabase-клиенты, auth, API-логика
supabase/
  migrations/    # Версионированные SQL-миграции
```
