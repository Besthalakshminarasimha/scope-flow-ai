-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict listing on 3d-scenes: keep object fetch by URL working (CDN bypasses RLS),
-- but require auth to enumerate via storage.objects API.
DROP POLICY IF EXISTS "3d-scenes public read" ON storage.objects;

CREATE POLICY "3d-scenes auth list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = '3d-scenes');