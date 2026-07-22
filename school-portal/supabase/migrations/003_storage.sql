-- Storage buckets + policies for School Portal (run in Supabase SQL editor)

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('admissions-docs', 'admissions-docs', false),
  ('learning-materials', 'learning-materials', true),
  ('avatars', 'avatars', true),
  ('report-cards', 'report-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Admissions docs: applicants can upload; admins can read
CREATE POLICY admissions_docs_upload ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'admissions-docs');

CREATE POLICY admissions_docs_admin_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'admissions-docs'
    AND (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('school_admin', 'super_admin')
      )
    )
  );

-- Learning materials: school users read; teachers/admins write
CREATE POLICY materials_read ON storage.objects
  FOR SELECT USING (bucket_id = 'learning-materials' AND auth.role() = 'authenticated');

CREATE POLICY materials_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'learning-materials'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'school_admin', 'super_admin')
    )
  );

-- Avatars: own folder
CREATE POLICY avatars_own ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Report cards: student own / parent linked / admin
CREATE POLICY report_cards_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'report-cards'
    AND auth.role() = 'authenticated'
  );
