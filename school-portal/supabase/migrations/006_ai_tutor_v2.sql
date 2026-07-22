-- AI Tutor v2 — world-class CAPS assistant support

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
  ADD COLUMN IF NOT EXISTS ai_tutor_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_tutor_model TEXT DEFAULT 'gpt-5.5';

ALTER TABLE ai_tutor_sessions
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en-ZA',
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'chat';

ALTER TABLE ai_tutor_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-tutor-uploads', 'ai-tutor-uploads', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS ai_tutor_uploads_own ON storage.objects;
CREATE POLICY ai_tutor_uploads_own ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'ai-tutor-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'ai-tutor-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students must not read the school's OpenAI key via normal school select.
-- Admins can update it; the edge function / service role uses the key server-side.
-- Client may still use VITE_OPENAI_API_KEY for single-tenant deployments.
