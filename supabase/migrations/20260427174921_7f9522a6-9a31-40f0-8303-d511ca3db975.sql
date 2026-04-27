-- Scenes table
CREATE TABLE public.scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  point_count INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'ply',
  file_path TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public scenes viewable by anyone"
  ON public.scenes FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own scenes"
  ON public.scenes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenes"
  ON public.scenes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenes"
  ON public.scenes FOR DELETE
  USING (auth.uid() = user_id);

-- Reconstruction jobs table
CREATE TABLE public.reconstruction_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'queued',
  message TEXT,
  source_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL DEFAULT 'images',
  external_job_id TEXT,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reconstruction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own jobs"
  ON public.reconstruction_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own jobs"
  ON public.reconstruction_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own jobs"
  ON public.reconstruction_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Realtime for jobs progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.reconstruction_jobs;

-- updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER scenes_set_updated_at BEFORE UPDATE ON public.scenes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.reconstruction_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('3d-scenes', '3d-scenes', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reconstruction-uploads', 'reconstruction-uploads', false)
  ON CONFLICT (id) DO NOTHING;

-- 3d-scenes bucket policies (public read, owner write)
CREATE POLICY "3d-scenes public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = '3d-scenes');

CREATE POLICY "3d-scenes owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = '3d-scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "3d-scenes owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = '3d-scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "3d-scenes owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = '3d-scenes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- reconstruction-uploads bucket policies (private to owner)
CREATE POLICY "uploads owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reconstruction-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reconstruction-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'reconstruction-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reconstruction-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);