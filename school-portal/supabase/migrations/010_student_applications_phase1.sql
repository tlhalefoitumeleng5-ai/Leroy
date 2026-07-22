-- Student Applications Phase 1
-- Completes applicant ownership, draft lifecycle, secure document paths,
-- server-side submission validation, and the Submitted status.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Schema ----------
ALTER TABLE student_applications
  ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE student_applications
  ADD COLUMN IF NOT EXISTS storage_token TEXT;
ALTER TABLE student_applications
  ADD COLUMN IF NOT EXISTS parent_residential_address TEXT;

UPDATE student_applications
SET storage_token = encode(extensions.gen_random_bytes(24), 'hex')
WHERE storage_token IS NULL OR length(storage_token) < 32;

ALTER TABLE student_applications
  ALTER COLUMN storage_token SET DEFAULT encode(extensions.gen_random_bytes(24), 'hex');
ALTER TABLE student_applications
  ALTER COLUMN storage_token SET NOT NULL;
ALTER TABLE student_applications
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE student_applications
  DROP CONSTRAINT IF EXISTS student_applications_status_check;
ALTER TABLE student_applications
  ADD CONSTRAINT student_applications_status_check
  CHECK (
    status IN (
      'draft',
      'submitted',
      'pending',
      'under_review',
      'approved',
      'rejected',
      'waiting_for_documents'
    )
  );

ALTER TABLE application_documents
  DROP CONSTRAINT IF EXISTS application_documents_doc_type_check;
ALTER TABLE application_documents
  ADD CONSTRAINT application_documents_doc_type_check
  CHECK (
    doc_type IN (
      'birth_certificate',
      'id_copy',
      'parent_id',
      'latest_report',
      'transfer_letter',
      'proof_of_residence',
      'passport_photo',
      'vaccination_card',
      'court_documents',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS idx_student_applications_applicant
  ON student_applications(applicant_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_applications_access
  ON student_applications(id, access_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_applications_storage_token
  ON student_applications(storage_token);

DROP TRIGGER IF EXISTS student_applications_updated_at ON student_applications;
CREATE TRIGGER student_applications_updated_at
  BEFORE UPDATE ON student_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------- Security helpers ----------
CREATE OR REPLACE FUNCTION public.application_admin_for_school(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role = 'super_admin'
        OR (p.role = 'school_admin' AND p.school_id = p_school_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.application_owned_by_user(p_application_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM student_applications a
    LEFT JOIN profiles p ON p.id = auth.uid()
    WHERE a.id = p_application_id
      AND (
        a.applicant_user_id = auth.uid()
        OR (
          p.email IS NOT NULL
          AND a.parent_email IS NOT NULL
          AND lower(a.parent_email) = lower(p.email)
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.application_storage_path_allowed(
  p_name TEXT,
  p_require_editable BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_parts TEXT[];
  v_application_id UUID;
  v_storage_token TEXT;
BEGIN
  v_parts := storage.foldername(p_name);
  IF array_length(v_parts, 1) < 3
    OR v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN
    RETURN false;
  END IF;

  v_application_id := v_parts[1]::UUID;
  v_storage_token := v_parts[2];

  RETURN EXISTS (
    SELECT 1
    FROM student_applications a
    WHERE a.id = v_application_id
      AND a.storage_token = v_storage_token
      AND (
        NOT p_require_editable
        OR a.is_draft
        OR a.status = 'waiting_for_documents'
      )
  );
EXCEPTION WHEN invalid_text_representation THEN
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.application_storage_admin_allowed(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_parts TEXT[];
  v_application_id UUID;
  v_school_id UUID;
BEGIN
  v_parts := storage.foldername(p_name);
  IF array_length(v_parts, 1) < 1
    OR v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  THEN
    RETURN false;
  END IF;

  v_application_id := v_parts[1]::UUID;
  SELECT school_id INTO v_school_id
  FROM student_applications
  WHERE id = v_application_id;

  RETURN v_school_id IS NOT NULL
    AND public.application_admin_for_school(v_school_id);
EXCEPTION WHEN invalid_text_representation THEN
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.application_admin_for_school(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.application_owned_by_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.application_storage_path_allowed(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.application_storage_admin_allowed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.application_admin_for_school(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.application_owned_by_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.application_storage_path_allowed(text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.application_storage_admin_allowed(text) TO authenticated;

-- ---------- Table RLS ----------
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_applications_public_insert ON student_applications;
DROP POLICY IF EXISTS student_applications_public_select_own ON student_applications;
DROP POLICY IF EXISTS student_applications_admin_all ON student_applications;

CREATE POLICY student_applications_owner_select ON student_applications
  FOR SELECT TO authenticated
  USING (public.application_owned_by_user(id));

CREATE POLICY student_applications_admin_all ON student_applications
  FOR ALL TO authenticated
  USING (public.application_admin_for_school(school_id))
  WITH CHECK (public.application_admin_for_school(school_id));

DROP POLICY IF EXISTS application_documents_public_insert ON application_documents;
DROP POLICY IF EXISTS application_documents_public_select ON application_documents;
DROP POLICY IF EXISTS application_documents_public_delete ON application_documents;
DROP POLICY IF EXISTS application_documents_admin ON application_documents;

CREATE POLICY application_documents_owner_select ON application_documents
  FOR SELECT TO authenticated
  USING (public.application_owned_by_user(application_id));

CREATE POLICY application_documents_admin_all ON application_documents
  FOR ALL TO authenticated
  USING (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  )
  WITH CHECK (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  );

DROP POLICY IF EXISTS application_status_events_insert ON application_status_events;
DROP POLICY IF EXISTS application_status_events_admin ON application_status_events;

CREATE POLICY application_status_events_owner_select ON application_status_events
  FOR SELECT TO authenticated
  USING (public.application_owned_by_user(application_id));

CREATE POLICY application_status_events_admin_all ON application_status_events
  FOR ALL TO authenticated
  USING (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  )
  WITH CHECK (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  );

DROP POLICY IF EXISTS application_notifications_insert ON application_notifications;
DROP POLICY IF EXISTS application_notifications_admin ON application_notifications;

CREATE POLICY application_notifications_owner_select ON application_notifications
  FOR SELECT TO authenticated
  USING (public.application_owned_by_user(application_id));

CREATE POLICY application_notifications_admin_all ON application_notifications
  FOR ALL TO authenticated
  USING (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  )
  WITH CHECK (
    public.application_admin_for_school(
      (SELECT a.school_id FROM student_applications a WHERE a.id = application_id)
    )
  );

-- ---------- Private storage capability paths ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admissions-docs',
  'admissions-docs',
  false,
  15728640,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS admissions_docs_upload ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_admin_read ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_insert ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_select ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_update ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_delete ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_admin_all ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_capability_select ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_capability_insert ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_capability_update ON storage.objects;
DROP POLICY IF EXISTS admissions_docs_capability_delete ON storage.objects;

CREATE POLICY admissions_docs_capability_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'admissions-docs'
    AND public.application_storage_path_allowed(name, false)
  );

CREATE POLICY admissions_docs_capability_insert ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'admissions-docs'
    AND public.application_storage_path_allowed(name, true)
  );

CREATE POLICY admissions_docs_capability_update ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (
    bucket_id = 'admissions-docs'
    AND public.application_storage_path_allowed(name, true)
  )
  WITH CHECK (
    bucket_id = 'admissions-docs'
    AND public.application_storage_path_allowed(name, true)
  );

CREATE POLICY admissions_docs_capability_delete ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'admissions-docs'
    AND public.application_storage_path_allowed(name, true)
  );

CREATE POLICY admissions_docs_admin_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'admissions-docs'
    AND public.application_storage_admin_allowed(name)
  )
  WITH CHECK (
    bucket_id = 'admissions-docs'
    AND public.application_storage_admin_allowed(name)
  );

-- ---------- Stronger codes for new applications ----------
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE sql
SET search_path = public
AS $$
  SELECT upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12));
$$;

REVOKE ALL ON FUNCTION public.generate_access_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_application_number(uuid) FROM PUBLIC;

-- ---------- Applicant RPCs ----------
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
  IF NOT EXISTS (SELECT 1 FROM schools WHERE id = p_school_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'School not found');
  END IF;

  v_num := public.next_application_number(p_school_id);
  v_code := public.generate_access_code();

  INSERT INTO student_applications (
    school_id,
    applicant_user_id,
    application_number,
    access_code,
    application_type,
    status,
    is_draft,
    form_locale,
    first_name,
    surname
  ) VALUES (
    p_school_id,
    auth.uid(),
    v_num,
    v_code,
    p_application_type,
    'draft',
    true,
    COALESCE(p_form_locale, 'en-ZA'),
    COALESCE(p_first_name, ''),
    COALESCE(p_surname, '')
  )
  RETURNING * INTO v_row;

  INSERT INTO application_status_events (application_id, from_status, to_status, note)
  VALUES (v_row.id, NULL, 'draft', 'Draft started');

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_row));
END;
$$;

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
  SELECT * INTO v_app
  FROM student_applications
  WHERE id = p_id
    AND access_code = trim(p_access_code)
    AND is_draft = true
    AND status = 'draft';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Draft not found or no longer editable');
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
    parent_residential_address = COALESCE(
      p_payload->>'parent_residential_address',
      parent_residential_address
    ),
    emergency_contact = COALESCE(p_payload->>'emergency_contact', emergency_contact),
    medical_aid = COALESCE(p_payload->>'medical_aid', medical_aid),
    medical_conditions = COALESCE(p_payload->>'medical_conditions', medical_conditions),
    allergies = COALESCE(p_payload->>'allergies', allergies),
    doctor_name = COALESCE(p_payload->>'doctor_name', doctor_name),
    doctor_contact = COALESCE(p_payload->>'doctor_contact', doctor_contact),
    application_type = COALESCE(p_payload->>'application_type', application_type),
    form_locale = COALESCE(p_payload->>'form_locale', form_locale)
  WHERE id = p_id
  RETURNING * INTO v_app;

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_application_by_credentials(
  p_id UUID,
  p_access_code TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app
  FROM student_applications
  WHERE id = p_id
    AND access_code = trim(p_access_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application not found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

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
  v_app student_applications%ROWTYPE;
  v_doc application_documents%ROWTYPE;
  v_prefix TEXT;
BEGIN
  SELECT * INTO v_app
  FROM student_applications
  WHERE id = p_application_id
    AND access_code = trim(p_access_code)
    AND (is_draft = true OR status = 'waiting_for_documents');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application is not editable');
  END IF;
  IF p_doc_type NOT IN (
    'birth_certificate',
    'id_copy',
    'parent_id',
    'latest_report',
    'transfer_letter',
    'proof_of_residence',
    'passport_photo',
    'vaccination_card',
    'court_documents',
    'other'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid document type');
  END IF;
  IF p_file_size <= 0 OR p_file_size > 15728640 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'File must be between 1 byte and 15 MB');
  END IF;
  IF p_file_name !~* '\.(pdf|doc|docx|jpg|jpeg|png)$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unsupported file extension');
  END IF;
  IF p_mime_type IS NOT NULL
    AND p_mime_type NOT IN (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    )
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unsupported file type');
  END IF;

  v_prefix := p_application_id::TEXT || '/' || v_app.storage_token || '/' || p_doc_type || '/';
  IF left(p_storage_path, length(v_prefix)) <> v_prefix
    OR position('..' IN p_storage_path) > 0
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid storage path');
  END IF;

  INSERT INTO application_documents (
    application_id,
    doc_type,
    file_name,
    mime_type,
    storage_path,
    file_size,
    is_blurry
  ) VALUES (
    p_application_id,
    p_doc_type,
    p_file_name,
    p_mime_type,
    p_storage_path,
    p_file_size,
    COALESCE(p_is_blurry, false)
  )
  RETURNING * INTO v_doc;

  RETURN jsonb_build_object('ok', true, 'document', to_jsonb(v_doc));
END;
$$;

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
    SELECT 1
    FROM student_applications
    WHERE id = p_application_id
      AND access_code = trim(p_access_code)
      AND (is_draft = true OR status = 'waiting_for_documents')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application is not editable');
  END IF;

  DELETE FROM application_documents
  WHERE id = p_document_id
    AND application_id = p_application_id
  RETURNING storage_path INTO v_path;

  IF v_path IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Document not found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'storagePath', v_path,
    'storageDeleted', false
  );
END;
$$;

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
  v_missing TEXT;
BEGIN
  SELECT * INTO v_app
  FROM student_applications
  WHERE id = p_id
    AND access_code = trim(p_access_code)
    AND is_draft = true
    AND status = 'draft';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Application not found or already submitted');
  END IF;

  IF COALESCE(trim(v_app.first_name), '') = ''
    OR COALESCE(trim(v_app.surname), '') = ''
    OR v_app.date_of_birth IS NULL
    OR COALESCE(trim(v_app.id_or_passport), '') = ''
    OR COALESCE(trim(v_app.nationality), '') = ''
    OR COALESCE(trim(v_app.grade_applying_for), '') = ''
    OR COALESCE(trim(v_app.residential_address), '') = ''
    OR COALESCE(trim(v_app.parent_full_name), '') = ''
    OR COALESCE(trim(v_app.parent_relationship), '') = ''
    OR COALESCE(trim(v_app.parent_id_number), '') = ''
    OR COALESCE(trim(v_app.parent_phone), '') = ''
    OR COALESCE(trim(v_app.parent_whatsapp), '') = ''
    OR COALESCE(trim(v_app.parent_email), '') = ''
    OR COALESCE(trim(v_app.parent_occupation), '') = ''
    OR COALESCE(trim(v_app.parent_residential_address), '') = ''
    OR COALESCE(trim(v_app.emergency_contact), '') = ''
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Required personal or parent information is incomplete');
  END IF;

  IF v_app.application_type = 'returning_student'
    AND COALESCE(trim(v_app.current_grade), '') = ''
  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Current grade is required for returning students');
  END IF;

  WITH required(doc_type, label) AS (
    SELECT *
    FROM (
      VALUES
        ('id_copy', 'Student ID or Passport'),
        ('parent_id', 'Parent ID'),
        ('latest_report', 'Latest School Report'),
        ('proof_of_residence', 'Proof of Residence')
    ) AS common_required(doc_type, label)
    UNION ALL
    SELECT *
    FROM (
      VALUES
        ('birth_certificate', 'Birth Certificate'),
        ('passport_photo', 'Passport Photo')
    ) AS new_required(doc_type, label)
    WHERE v_app.application_type = 'new_student'
  )
  SELECT string_agg(required.label, ', ' ORDER BY required.label)
  INTO v_missing
  FROM required
  WHERE NOT EXISTS (
    SELECT 1
    FROM application_documents d
    WHERE d.application_id = p_id
      AND d.doc_type = required.doc_type
  );

  IF v_missing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing required documents: ' || v_missing);
  END IF;

  UPDATE student_applications SET
    is_draft = false,
    status = 'submitted',
    submitted_at = now()
  WHERE id = p_id
  RETURNING * INTO v_app;

  INSERT INTO application_status_events (application_id, from_status, to_status, note)
  VALUES (p_id, 'draft', 'submitted', 'Application submitted by parent/guardian');

  PERFORM public.queue_application_notifications(p_id, 'submitted', NULL);

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

REVOKE ALL ON FUNCTION public.start_student_application_draft(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_student_application_draft(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_student_application_by_credentials(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_application_document(uuid, text, text, text, text, text, bigint, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_application_document_secure(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_student_application(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.start_student_application_draft(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_student_application_draft(uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_application_by_credentials(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_application_document(uuid, text, text, text, text, text, bigint, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_application_document_secure(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_student_application(uuid, text) TO anon, authenticated;

-- Notification creation is internal to submit/admin RPCs.
REVOKE ALL ON FUNCTION public.queue_application_notifications(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.queue_application_notifications(uuid, text, text) FROM anon, authenticated;

-- ---------- Admin status workflow ----------
CREATE OR REPLACE FUNCTION public.admin_update_student_application_status(
  p_id UUID,
  p_status TEXT,
  p_note TEXT DEFAULT NULL,
  p_missing_documents_note TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app student_applications%ROWTYPE;
  v_previous_status TEXT;
BEGIN
  SELECT * INTO v_app
  FROM student_applications
  WHERE id = p_id;

  IF NOT FOUND OR NOT public.application_admin_for_school(v_app.school_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;
  IF p_status NOT IN (
    'draft',
    'submitted',
    'pending',
    'under_review',
    'approved',
    'rejected',
    'waiting_for_documents'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid status');
  END IF;

  v_previous_status := v_app.status;
  UPDATE student_applications SET
    status = p_status,
    is_draft = (p_status = 'draft'),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    missing_documents_note = COALESCE(
      p_missing_documents_note,
      missing_documents_note
    ),
    reviewed_by = COALESCE(p_actor_id, auth.uid()),
    reviewed_at = now()
  WHERE id = p_id
  RETURNING * INTO v_app;

  INSERT INTO application_status_events (
    application_id,
    from_status,
    to_status,
    note,
    actor_id
  ) VALUES (
    p_id,
    v_previous_status,
    p_status,
    COALESCE(p_note, p_missing_documents_note),
    COALESCE(p_actor_id, auth.uid())
  );

  PERFORM public.queue_application_notifications(
    p_id,
    'status',
    COALESCE(p_note, p_missing_documents_note)
  );

  RETURN jsonb_build_object('ok', true, 'application', to_jsonb(v_app));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_student_application_status(
  uuid,
  text,
  text,
  text,
  text,
  uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_student_application_status(
  uuid,
  text,
  text,
  text,
  text,
  uuid
) TO authenticated;

COMMIT;
