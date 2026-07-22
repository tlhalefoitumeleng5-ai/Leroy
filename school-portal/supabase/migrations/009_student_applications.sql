-- Student Applications module (new + returning students)
-- Full form fields, documents, tracking codes, status history, notifications

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS student_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL,
  application_type TEXT NOT NULL CHECK (application_type IN ('new_student', 'returning_student')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'waiting_for_documents', 'draft')),
  -- Personal
  first_name TEXT NOT NULL DEFAULT '',
  middle_name TEXT,
  surname TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  gender TEXT,
  id_or_passport TEXT,
  nationality TEXT DEFAULT 'South African',
  home_language TEXT,
  grade_applying_for TEXT,
  previous_school TEXT,
  current_grade TEXT,
  residential_address TEXT,
  -- Parent / guardian
  parent_full_name TEXT,
  parent_relationship TEXT,
  parent_id_number TEXT,
  parent_phone TEXT,
  parent_whatsapp TEXT,
  parent_email TEXT,
  parent_occupation TEXT,
  emergency_contact TEXT,
  -- Medical
  medical_aid TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  doctor_name TEXT,
  doctor_contact TEXT,
  -- Meta
  form_locale TEXT DEFAULT 'en-ZA',
  is_draft BOOLEAN NOT NULL DEFAULT true,
  admin_notes TEXT,
  missing_documents_note TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_applications_school ON student_applications(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_applications_status ON student_applications(status);
CREATE INDEX IF NOT EXISTS idx_student_applications_number ON student_applications(application_number);
CREATE INDEX IF NOT EXISTS idx_student_applications_email ON student_applications(parent_email);

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES student_applications(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  is_blurry BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_documents_app ON application_documents(application_id);

CREATE TABLE IF NOT EXISTS application_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES student_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES student_applications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- ---------- Application number sequence ----------
CREATE SEQUENCE IF NOT EXISTS student_application_seq START 1001;

CREATE OR REPLACE FUNCTION public.next_application_number(p_school_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT := to_char(now(), 'YYYY');
  v_seq BIGINT;
  v_prefix TEXT;
BEGIN
  SELECT COALESCE(NULLIF(regexp_replace(upper(left(name, 3)), '[^A-Z]', '', 'g'), ''), 'SCH')
  INTO v_prefix
  FROM schools WHERE id = p_school_id;

  v_seq := nextval('student_application_seq');
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT lpad((floor(random() * 1000000))::int::text, 6, '0');
$$;

-- ---------- Tracking RPC (public, no auth) ----------
CREATE OR REPLACE FUNCTION public.track_student_application(
  p_application_number TEXT,
  p_access_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
  v_docs jsonb;
  v_events jsonb;
BEGIN
  SELECT * INTO v_app
  FROM student_applications
  WHERE application_number = upper(trim(p_application_number))
    AND access_code = trim(p_access_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application not found. Check your number and access code.');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'docType', d.doc_type,
    'fileName', d.file_name,
    'mimeType', d.mime_type,
    'storagePath', d.storage_path,
    'fileSize', d.file_size,
    'isBlurry', d.is_blurry,
    'createdAt', d.created_at
  ) ORDER BY d.created_at), '[]'::jsonb)
  INTO v_docs
  FROM application_documents d
  WHERE d.application_id = v_app.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'fromStatus', e.from_status,
    'toStatus', e.to_status,
    'note', e.note,
    'createdAt', e.created_at
  ) ORDER BY e.created_at), '[]'::jsonb)
  INTO v_events
  FROM application_status_events e
  WHERE e.application_id = v_app.id;

  RETURN jsonb_build_object(
    'ok', true,
    'application', to_jsonb(v_app),
    'documents', v_docs,
    'events', v_events
  );
END;
$$;

REVOKE ALL ON FUNCTION public.track_student_application(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_student_application(text, text) TO anon, authenticated;

-- Public save/update draft by id + access_code
CREATE OR REPLACE FUNCTION public.save_student_application_draft(
  p_id UUID,
  p_access_code TEXT,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app FROM student_applications WHERE id = p_id AND access_code = trim(p_access_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Draft not found');
  END IF;

  UPDATE student_applications SET
    first_name = COALESCE(p_payload->>'first_name', first_name),
    middle_name = COALESCE(p_payload->>'middle_name', middle_name),
    surname = COALESCE(p_payload->>'surname', surname),
    date_of_birth = COALESCE((p_payload->>'date_of_birth')::date, date_of_birth),
    gender = COALESCE(p_payload->>'gender', gender),
    id_or_passport = COALESCE(p_payload->>'id_or_passport', id_or_passport),
    nationality = COALESCE(p_payload->>'nationality', nationality),
    home_language = COALESCE(p_payload->>'home_language', home_language),
    grade_applying_for = COALESCE(p_payload->>'grade_applying_for', grade_applying_for),
    previous_school = COALESCE(p_payload->>'previous_school', previous_school),
    current_grade = COALESCE(p_payload->>'current_grade', current_grade),
    residential_address = COALESCE(p_payload->>'residential_address', residential_address),
    parent_full_name = COALESCE(p_payload->>'parent_full_name', parent_full_name),
    parent_relationship = COALESCE(p_payload->>'parent_relationship', parent_relationship),
    parent_id_number = COALESCE(p_payload->>'parent_id_number', parent_id_number),
    parent_phone = COALESCE(p_payload->>'parent_phone', parent_phone),
    parent_whatsapp = COALESCE(p_payload->>'parent_whatsapp', parent_whatsapp),
    parent_email = COALESCE(p_payload->>'parent_email', parent_email),
    parent_occupation = COALESCE(p_payload->>'parent_occupation', parent_occupation),
    emergency_contact = COALESCE(p_payload->>'emergency_contact', emergency_contact),
    medical_aid = COALESCE(p_payload->>'medical_aid', medical_aid),
    medical_conditions = COALESCE(p_payload->>'medical_conditions', medical_conditions),
    allergies = COALESCE(p_payload->>'allergies', allergies),
    doctor_name = COALESCE(p_payload->>'doctor_name', doctor_name),
    doctor_contact = COALESCE(p_payload->>'doctor_contact', doctor_contact),
    application_type = COALESCE(p_payload->>'application_type', application_type),
    form_locale = COALESCE(p_payload->>'form_locale', form_locale),
    updated_at = now()
  WHERE id = p_id;

  SELECT * INTO v_app FROM student_applications WHERE id = p_id;
  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

REVOKE ALL ON FUNCTION public.save_student_application_draft(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_student_application_draft(uuid, text, jsonb) TO anon, authenticated;

-- ---------- RLS ----------
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_applications_admin_all ON student_applications;
CREATE POLICY student_applications_admin_all ON student_applications
  FOR ALL TO authenticated
  USING (public.is_admin() AND school_id = public.current_school_id())
  WITH CHECK (public.is_admin() AND school_id = public.current_school_id());

-- Allow anonymous insert of new drafts (school_id must exist)
DROP POLICY IF EXISTS student_applications_public_insert ON student_applications;
CREATE POLICY student_applications_public_insert ON student_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS student_applications_public_select_own ON student_applications;
CREATE POLICY student_applications_public_select_own ON student_applications
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR (parent_email IS NOT NULL AND parent_email = (SELECT email FROM profiles WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS application_documents_admin ON application_documents;
CREATE POLICY application_documents_admin ON application_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  );

DROP POLICY IF EXISTS application_documents_public_insert ON application_documents;
CREATE POLICY application_documents_public_insert ON application_documents
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS application_documents_public_select ON application_documents;
CREATE POLICY application_documents_public_select ON application_documents
  FOR SELECT TO anon, authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id
        AND a.parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS application_documents_public_delete ON application_documents;
CREATE POLICY application_documents_public_delete ON application_documents
  FOR DELETE TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS application_status_events_admin ON application_status_events;
CREATE POLICY application_status_events_admin ON application_status_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  );

DROP POLICY IF EXISTS application_status_events_insert ON application_status_events;
CREATE POLICY application_status_events_insert ON application_status_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS application_notifications_admin ON application_notifications;
CREATE POLICY application_notifications_admin ON application_notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_applications a
      WHERE a.id = application_id AND public.is_admin() AND a.school_id = public.current_school_id()
    )
  );

DROP POLICY IF EXISTS application_notifications_insert ON application_notifications;
CREATE POLICY application_notifications_insert ON application_notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Storage: ensure admissions-docs policies allow public upload + read for admins
INSERT INTO storage.buckets (id, name, public)
VALUES ('admissions-docs', 'admissions-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS admissions_docs_insert ON storage.objects;
CREATE POLICY admissions_docs_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'admissions-docs');

DROP POLICY IF EXISTS admissions_docs_select ON storage.objects;
CREATE POLICY admissions_docs_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'admissions-docs');

DROP POLICY IF EXISTS admissions_docs_update ON storage.objects;
CREATE POLICY admissions_docs_update ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'admissions-docs');

DROP POLICY IF EXISTS admissions_docs_delete ON storage.objects;
CREATE POLICY admissions_docs_delete ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'admissions-docs');

-- Secure public draft start / submit / documents (anon-safe)
CREATE OR REPLACE FUNCTION public.start_student_application_draft(
  p_school_id UUID,
  p_application_type TEXT,
  p_form_locale TEXT DEFAULT 'en-ZA',
  p_first_name TEXT DEFAULT '',
  p_surname TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num TEXT;
  v_code TEXT;
  v_row student_applications%ROWTYPE;
BEGIN
  IF p_application_type NOT IN ('new_student', 'returning_student') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid application type');
  END IF;
  v_num := public.next_application_number(p_school_id);
  v_code := public.generate_access_code();
  INSERT INTO student_applications (
    school_id, application_number, access_code, application_type, status, is_draft,
    form_locale, first_name, surname
  ) VALUES (
    p_school_id, v_num, v_code, p_application_type, 'draft', true,
    COALESCE(p_form_locale, 'en-ZA'), COALESCE(p_first_name, ''), COALESCE(p_surname, '')
  ) RETURNING * INTO v_row;

  INSERT INTO application_status_events (application_id, from_status, to_status, note)
  VALUES (v_row.id, NULL, 'draft', 'Draft started');

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_row));
END;
$$;

REVOKE ALL ON FUNCTION public.start_student_application_draft(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_student_application_draft(uuid, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_application_document(
  p_application_id UUID,
  p_access_code TEXT,
  p_doc_type TEXT,
  p_file_name TEXT,
  p_mime_type TEXT,
  p_storage_path TEXT,
  p_file_size BIGINT,
  p_is_blurry BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc application_documents%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM student_applications
    WHERE id = p_application_id AND access_code = trim(p_access_code)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid application credentials');
  END IF;

  INSERT INTO application_documents (
    application_id, doc_type, file_name, mime_type, storage_path, file_size, is_blurry
  ) VALUES (
    p_application_id, p_doc_type, p_file_name, p_mime_type, p_storage_path, p_file_size, COALESCE(p_is_blurry, false)
  ) RETURNING * INTO v_doc;

  RETURN jsonb_build_object('ok', true, 'document', to_jsonb(v_doc));
END;
$$;

REVOKE ALL ON FUNCTION public.add_application_document(uuid, text, text, text, text, text, bigint, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_application_document(uuid, text, text, text, text, text, bigint, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_student_application(
  p_id UUID,
  p_access_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app FROM student_applications WHERE id = p_id AND access_code = trim(p_access_code);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application not found');
  END IF;

  UPDATE student_applications SET
    is_draft = false,
    status = 'pending',
    submitted_at = now(),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_app;

  INSERT INTO application_status_events (application_id, from_status, to_status, note)
  VALUES (p_id, 'draft', 'pending', 'Application submitted by parent/guardian');

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

REVOKE ALL ON FUNCTION public.submit_student_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_student_application(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_application_documents_secure(
  p_application_id UUID,
  p_access_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_docs jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM student_applications
    WHERE id = p_application_id AND access_code = trim(p_access_code)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.created_at), '[]'::jsonb)
  INTO v_docs
  FROM application_documents d
  WHERE d.application_id = p_application_id;

  RETURN jsonb_build_object('ok', true, 'documents', v_docs);
END;
$$;

REVOKE ALL ON FUNCTION public.list_application_documents_secure(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_application_documents_secure(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_application_document_secure(
  p_document_id UUID,
  p_application_id UUID,
  p_access_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM student_applications
    WHERE id = p_application_id AND access_code = trim(p_access_code)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;

  SELECT storage_path INTO v_path FROM application_documents
  WHERE id = p_document_id AND application_id = p_application_id;
  IF v_path IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Document not found');
  END IF;

  DELETE FROM application_documents WHERE id = p_document_id;
  RETURN jsonb_build_object('ok', true, 'storagePath', v_path);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_application_document_secure(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_application_document_secure(uuid, uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_school_info()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'logoUrl', logo_url,
    'phone', phone,
    'email', email,
    'address', address
  )
  FROM schools
  ORDER BY created_at ASC
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.public_school_info() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_school_info() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.queue_application_notifications(
  p_application_id UUID,
  p_kind TEXT,
  p_extra_note TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
  v_name TEXT;
  v_line TEXT;
  v_wa TEXT;
BEGIN
  SELECT * INTO v_app FROM student_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not found');
  END IF;

  v_name := trim(both FROM COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.surname, ''));
  IF p_kind = 'submitted' THEN
    v_line := format(
      'We received application %s for %s. Keep your access code safe: %s.',
      v_app.application_number, v_name, v_app.access_code
    );
  ELSE
    v_line := format(
      'Application %s is now "%s".%s',
      v_app.application_number,
      replace(v_app.status, '_', ' '),
      CASE WHEN p_extra_note IS NULL OR length(trim(p_extra_note)) = 0 THEN '' ELSE ' Note: ' || p_extra_note END
    );
  END IF;

  IF v_app.parent_email IS NOT NULL AND length(trim(v_app.parent_email)) > 0 THEN
    INSERT INTO application_notifications (application_id, channel, recipient, subject, body, status)
    VALUES (
      v_app.id, 'email', v_app.parent_email,
      CASE WHEN p_kind = 'submitted'
        THEN 'Application received · ' || v_app.application_number
        ELSE 'Application update · ' || v_app.application_number END,
      v_line, 'queued'
    );
  END IF;

  v_wa := COALESCE(NULLIF(trim(v_app.parent_whatsapp), ''), NULLIF(trim(v_app.parent_phone), ''));
  IF v_wa IS NOT NULL THEN
    INSERT INTO application_notifications (application_id, channel, recipient, body, status)
    VALUES (v_app.id, 'whatsapp', v_wa, v_line, 'queued');
    INSERT INTO application_notifications (application_id, channel, recipient, body, status)
    VALUES (v_app.id, 'sms', v_wa, left(v_line, 320), 'queued');

    IF EXISTS (SELECT 1 FROM schools s WHERE s.id = v_app.school_id AND s.whatsapp_enabled IS TRUE) THEN
      INSERT INTO whatsapp_outbox (school_id, to_phone, body, related_type, related_id)
      VALUES (v_app.school_id, v_wa, v_line, 'student_application', v_app.id);
    END IF;
  END IF;

  INSERT INTO notifications (school_id, user_id, type, title, body, link)
  SELECT p.school_id, p.id, 'admission',
    CASE WHEN p_kind = 'submitted' THEN 'Application received' ELSE 'Application status updated' END,
    v_line,
    '/apply/track'
  FROM profiles p
  WHERE v_app.parent_email IS NOT NULL AND lower(p.email) = lower(v_app.parent_email);

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.queue_application_notifications(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_application_notifications(uuid, text, text) TO anon, authenticated;
