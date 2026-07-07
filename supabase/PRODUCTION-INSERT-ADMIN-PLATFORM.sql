-- =============================================================================
-- PRODUCTION-INSERT-ADMIN-PLATFORM.sql
-- =============================================================================
-- КУДА ВСТАВИТЬ:
--   Supabase Dashboard → проект delivery (raafwoxicqyywpzjgovz)
--   → SQL Editor → New query → вставьте ВЕСЬ этот файл → Run
--
-- КОГДА ПРИМЕНЯТЬ:
--   После PRODUCTION-FULL-SETUP.sql (базовая схема уже есть).
--   Если в личном кабинете ошибка "infinite recursion" — сначала выполните
--   PRODUCTION-PATCH-RLS-RECURSION.sql, затем этот файл.
--
-- Безопасно запускать повторно (IF NOT EXISTS, ON CONFLICT).
-- =============================================================================


-- =============================================================================
-- A. ТАБЛИЦЫ ДЛЯ АДМИН-ПАНЕЛИ (баннеры, зоны, настройки, уведомления, логи)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  delivery_price NUMERIC(10,2) DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  polygon JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  title VARCHAR(255),
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_city ON public.delivery_zones (city_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs (created_at DESC);


-- =============================================================================
-- B. ДОПОЛНЕНИЯ К СУЩЕСТВУЮЩИМ ТАБЛИЦАМ
-- =============================================================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;


-- =============================================================================
-- C. НАСТРОЙКИ ПО УМОЛЧАНИЮ
-- =============================================================================

INSERT INTO public.app_settings (key, value) VALUES
  ('default_city', '"Сураж"'::jsonb),
  ('min_order_amount', '500'::jsonb),
  ('delivery_fee', '150'::jsonb),
  ('platform_commission_percent', '10'::jsonb),
  ('support_phone', '""'::jsonb),
  ('support_email', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- D. RLS (публичное чтение баннеров; остальное через service role в админке)
-- =============================================================================

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS banners_public_read ON public.banners;
CREATE POLICY banners_public_read ON public.banners
  FOR SELECT
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );


-- =============================================================================
-- E. НАЗНАЧИТЬ СЕБЕ РОЛЬ ADMIN (раскомментируйте и подставьте UUID)
-- =============================================================================
-- Шаг 1 — узнайте свой id:
--   SELECT id, email FROM auth.users ORDER BY created_at;
--
-- Шаг 2 — раскомментируйте блок ниже, вставьте UUID, выполните снова:

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

-- Проверка роли:
-- SELECT u.email, r.name, ur.is_active
-- FROM public.user_roles ur
-- JOIN auth.users u ON u.id = ur.user_id
-- JOIN public.roles r ON r.id = ur.role_id
-- WHERE r.name = 'admin';


-- =============================================================================
-- F. ПРИМЕР ТЕСТОВОГО БАННЕРА (опционально, раскомментируйте)
-- =============================================================================

/*
INSERT INTO public.banners (title, subtitle, image_url, link_url, sort_order, is_active, city)
VALUES (
  'Доставка от души',
  'Закажите еду с доставкой по Суражу',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200',
  '/catalog',
  1,
  TRUE,
  'Сураж'
);
*/

-- Готово. Дальше в Vercel добавьте ADMIN_USER_ID и сделайте Redeploy.
