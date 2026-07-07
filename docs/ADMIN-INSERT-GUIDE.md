# Что вставить куда — админ-панель Deliveryheart

## 1. SQL в Supabase (обязательно)

**Файл:** `supabase/PRODUCTION-INSERT-ADMIN-PLATFORM.sql`

1. Откройте [Supabase](https://supabase.com/dashboard) → проект **delivery**
2. **SQL Editor** → **New query**
3. Скопируйте **весь** файл `PRODUCTION-INSERT-ADMIN-PLATFORM.sql`
4. Нажмите **Run**

Если в личном кабинете была ошибка `infinite recursion` — **сначала** выполните:
`supabase/PRODUCTION-PATCH-RLS-RECURSION.sql`

В том же SQL-файле в конце — раскомментируйте блок **«Назначить себе роль admin»** и подставьте свой UUID.

---

## 2. Переменные в Vercel (обязательно)

**Settings → Environment Variables** → добавьте или проверьте:

```env
NEXT_PUBLIC_SUPABASE_URL=https://raafwoxicqyywpzjgovz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
NEXT_PUBLIC_CITY=Сураж
ADMIN_USER_ID=ваш-uuid-из-auth.users
```

UUID узнать в SQL Editor:

```sql
SELECT id, email FROM auth.users ORDER BY created_at;
```

После изменений — **Deployments → Redeploy** (без кэша).

---

## 3. Локально `.env.local`

Те же переменные, что в Vercel (для разработки):

```env
NEXT_PUBLIC_SUPABASE_URL=https://raafwoxicqyywpzjgovz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_CITY=Сураж
ADMIN_USER_ID=ваш-uuid
```

---

## 4. Промпты для Cursor (4 фазы)

Копируйте по одному в новый чат агента после выполнения пунктов 1–3.

---

### Промпт — Фаза 1

```
Контекст: проект deliveryheart (/Users/ilyacheplya/Projects/deliveryheart).
Задача — Фаза 1 админ-панели: инфраструктура и доведение уже существующих разделов до полной работоспособности.

Текущее состояние:
- Доступ к /admin: ADMIN_USER_ID + роль admin в user_roles (middleware, guards, withAdmin).
- Работают через API: дашборд, заказы, курьеры (список), рестораны (чтение/toggle/delete), пользователи, промокоды (чтение/toggle/delete), города, отзывы (чтение), платежи.
- Частично/моки: couriers/[id] (browser supabase), рестораны без create/edit, промокоды без create, categories-global только чтение, analytics не в меню.

Сделай:

1. AdminShell — 17 пунктов меню: Дашборд, Заказы, Курьеры, Рестораны, Пользователи, Админы ресторанов, Промокоды, Баннеры, Категории, Отзывы, Города, Зоны доставки, Платежи, Аналитика, Уведомления, Настройки, Логи.

2. Общие компоненты в src/components/admin/: AdminDataTable, AdminModal, AdminEmptyState, AdminLoader, AdminConfirmDelete.

3. API (withAdmin + createAdminClient):
   - Доработать GET /api/admin/orders — фильтры status, city, page; PATCH — статус + order_status_history.
   - POST /api/admin/restaurants, расширить PATCH.
   - POST /api/admin/coupons.
   - POST/PATCH/DELETE /api/admin/categories.
   - DELETE /api/admin/reviews (+ PATCH is_visible).

4. Страницы на fetch('/api/admin/...'): orders, couriers/[id], restaurants (create/edit), coupons (create), categories-global (CRUD).

5. Не трогай пока: banners, delivery-zones, notifications, settings, logs.

Ограничения: минимальный diff, typecheck, не коммить без просьбы.
```

---

### Промпт — Фаза 2

```
Контекст: deliveryheart, Фаза 1 завершена. Таблицы banners, delivery_zones, app_settings, notification_*, admin_audit_logs уже в БД (PRODUCTION-INSERT-ADMIN-PLATFORM.sql применён).

Задача — Фаза 2:

A) Раздел /admin/restaurant-admins — полностью рабочий через user_roles (restaurant_owner, restaurant_admin).
   API: GET/POST/DELETE /api/admin/restaurant-admins.
   UI: таблица, поиск, фильтр по ресторану, модалка назначения. Запрет role_name = 'admin'.

B) Синхронизировать supabase/migrations/20260707000000_admin_platform_tables.sql с применённым SQL.

Ограничения: typecheck, withAdmin на всех routes.
```

---

### Промпт — Фаза 3

```
Контекст: deliveryheart, Фазы 1–2 завершены. Новые таблицы в БД.

Задача — рабочие разделы без моков:

1. /admin/banners — CRUD /api/admin/banners (image_url как текст URL).
2. /admin/delivery-zones — CRUD, привязка к city_id, без карты.
3. /admin/settings — GET/PATCH app_settings (default_city, min_order_amount, delivery_fee, commission, support_phone/email).
4. /admin/notifications — шаблоны + кампании (черновики, без реальной отправки).
5. /admin/logs — GET admin_audit_logs с пагинацией.

Все через fetch + withAdmin. typecheck.
```

---

### Промпт — Фаза 4

```
Контекст: deliveryheart, Фазы 1–3 завершены.

Задача — полировка:

1. logAdminAction() во всех admin POST/PATCH/DELETE → admin_audit_logs.
2. Zod-валидация admin API (src/lib/admin/schemas.ts).
3. HomeBanners на главной — активные banners для NEXT_PUBLIC_CITY.
4. ADMIN-SETUP.md с env и SQL инструкциями.
5. Экспорт CSV для orders и payments.
6. Обновить database.types.ts.

typecheck. Чеклист деплоя Vercel в конце.
```

---

## 5. Порядок действий

| Шаг | Действие |
|-----|----------|
| 1 | SQL: `PRODUCTION-PATCH-RLS-RECURSION.sql` (если нужно) |
| 2 | SQL: `PRODUCTION-INSERT-ADMIN-PLATFORM.sql` + назначить admin |
| 3 | Vercel env + `ADMIN_USER_ID` + Redeploy |
| 4 | Промпт Фаза 1 → 2 → 3 → 4 в Cursor |
| 5 | Открыть `/admin` под своим аккаунтом |

---

## 6. Проверка доступа

- Ваш аккаунт + `ADMIN_USER_ID` + роль `admin` → `/admin` открывается
- Любой другой аккаунт → редирект на `/`
- Без `ADMIN_USER_ID` на Vercel → никто не попадёт в админку
