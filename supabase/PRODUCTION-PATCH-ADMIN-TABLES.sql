-- =============================================================================
-- PRODUCTION-PATCH-ADMIN-TABLES.sql
-- =============================================================================
-- Когда применять:
--   Нужны таблицы для разделов админ-панели: Баннеры, Зоны доставки,
--   Настройки, Уведомления, Логи.
--
-- Как применить:
--   1. Supabase Dashboard → проект delivery (raafwoxicqyywpzjgovz)
--   2. SQL Editor → New query
--   3. Вставьте весь этот файл → Run
--
-- Безопасно запускать повторно (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS).
-- Требует: cities, public.is_admin() из предыдущих миграций.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  delivery_price NUMERIC(10,2) DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  polygon JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(20) CHECK (channel IN ('push', 'email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id),
  title VARCHAR(255),
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS banners_public_read ON banners;
CREATE POLICY banners_public_read ON banners
  FOR SELECT
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS banners_admin_manage ON banners;
CREATE POLICY banners_admin_manage ON banners
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS delivery_zones_admin_manage ON delivery_zones;
CREATE POLICY delivery_zones_admin_manage ON delivery_zones
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS app_settings_admin_manage ON app_settings;
CREATE POLICY app_settings_admin_manage ON app_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS notification_templates_admin_manage ON notification_templates;
CREATE POLICY notification_templates_admin_manage ON notification_templates
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS notification_campaigns_admin_manage ON notification_campaigns;
CREATE POLICY notification_campaigns_admin_manage ON notification_campaigns
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_audit_logs_admin_manage ON admin_audit_logs;
CREATE POLICY admin_audit_logs_admin_manage ON admin_audit_logs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- SEED: default app settings
-- -----------------------------------------------------------------------------

INSERT INTO app_settings (key, value) VALUES
  ('default_city', '"Сураж"'::jsonb),
  ('min_order_amount', '500'::jsonb),
  ('delivery_fee', '150'::jsonb),
  ('platform_commission_percent', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;
