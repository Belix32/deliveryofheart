-- Создание Storage bucket для изображений
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Включаем публичный доступ на чтение
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Upload/update/delete: platform admin only (requires is_platform_admin())
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin upload images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin update images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin delete images" ON storage.objects;

CREATE POLICY "Platform admin upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images' AND public.is_platform_admin());

CREATE POLICY "Platform admin update images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'images' AND public.is_platform_admin())
WITH CHECK (bucket_id = 'images' AND public.is_platform_admin());

CREATE POLICY "Platform admin delete images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'images' AND public.is_platform_admin());

SELECT 'Storage bucket создан!' as result;