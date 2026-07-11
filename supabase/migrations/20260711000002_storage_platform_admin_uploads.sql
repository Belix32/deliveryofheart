-- Restrict storage uploads on public images bucket to platform admin only.
-- Public read remains for product/banner images.

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin upload images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin update images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admin delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Platform admin upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND public.is_platform_admin()
);

CREATE POLICY "Platform admin update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND public.is_platform_admin()
)
WITH CHECK (
  bucket_id = 'images'
  AND public.is_platform_admin()
);

CREATE POLICY "Platform admin delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND public.is_platform_admin()
);
