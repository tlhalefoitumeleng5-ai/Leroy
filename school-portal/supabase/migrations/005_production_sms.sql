-- School Portal v2.0 — Production SA School Management System
-- Fees, messaging, AI tutor, WhatsApp outbox, CAPS fields, timetable CRUD policies

-- ---------- CAPS subject metadata ----------
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS caps_code TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT CHECK (phase IS NULL OR phase IN ('foundation', 'intermediate', 'senior', 'fet')),
  ADD COLUMN IF NOT EXISTS caps_weighting_sba NUMERIC(5,2) DEFAULT 25,
  ADD COLUMN IF NOT EXISTS caps_weighting_exam NUMERIC(5,2) DEFAULT 75;

-- ---------- Fee management ----------
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL DEFAULT to_char(now(), 'YYYY'),
  due_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  amount_paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'waived')),
  due_date DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method TEXT NOT NULL DEFAULT 'eft' CHECK (method IN ('eft', 'cash', 'card', 'payfast', 'ozow', 'other')),
  reference TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice ON fee_payments(invoice_id);

-- ---------- Messaging ----------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ---------- AI Tutor ----------
CREATE TABLE IF NOT EXISTS ai_tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'CAPS study session',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_sessions_student ON ai_tutor_sessions(student_id);

-- ---------- WhatsApp ----------
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS whatsapp_from TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_account_sid TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_auth_token TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_attendance BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_announcements BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_fees BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS whatsapp_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  to_phone TEXT NOT NULL,
  body TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status ON whatsapp_outbox(status, created_at);

-- ---------- Storage ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true),
       ('assignments', 'assignments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS learning_materials_files ON storage.objects;
CREATE POLICY learning_materials_files ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'learning-materials' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'learning-materials' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS assignment_files ON storage.objects;
CREATE POLICY assignment_files ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'assignments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
$$;

-- ---------- RLS ----------
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fee_structures_select ON fee_structures;
CREATE POLICY fee_structures_select ON fee_structures FOR SELECT USING (school_id = current_school_id() OR is_admin());
DROP POLICY IF EXISTS fee_structures_admin ON fee_structures;
CREATE POLICY fee_structures_admin ON fee_structures FOR ALL USING (is_admin());

DROP POLICY IF EXISTS fee_invoices_select ON fee_invoices;
CREATE POLICY fee_invoices_select ON fee_invoices FOR SELECT USING (
  is_admin()
  OR student_id = own_student_id()
  OR parent_linked_to_student(student_id)
);
DROP POLICY IF EXISTS fee_invoices_admin ON fee_invoices;
CREATE POLICY fee_invoices_admin ON fee_invoices FOR ALL USING (is_admin());

DROP POLICY IF EXISTS fee_payments_select ON fee_payments;
CREATE POLICY fee_payments_select ON fee_payments FOR SELECT USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM fee_invoices i
    WHERE i.id = invoice_id
      AND (i.student_id = own_student_id() OR parent_linked_to_student(i.student_id))
  )
);
DROP POLICY IF EXISTS fee_payments_admin ON fee_payments;
CREATE POLICY fee_payments_admin ON fee_payments FOR ALL USING (is_admin());

DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations FOR SELECT TO authenticated USING (
  is_admin() OR created_by = auth.uid() OR is_conversation_participant(id)
);
DROP POLICY IF EXISTS conversations_insert ON conversations;
CREATE POLICY conversations_insert ON conversations FOR INSERT TO authenticated WITH CHECK (
  school_id = current_school_id() AND created_by = auth.uid()
);
DROP POLICY IF EXISTS conversations_update ON conversations;
CREATE POLICY conversations_update ON conversations FOR UPDATE USING (
  is_admin() OR is_conversation_participant(id) OR created_by = auth.uid()
);

DROP POLICY IF EXISTS conversation_participants_select ON conversation_participants;
CREATE POLICY conversation_participants_select ON conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR is_conversation_participant(conversation_id) OR is_admin()
);
DROP POLICY IF EXISTS conversation_participants_insert ON conversation_participants;
CREATE POLICY conversation_participants_insert ON conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  OR is_admin()
);
DROP POLICY IF EXISTS conversation_participants_update ON conversation_participants;
CREATE POLICY conversation_participants_update ON conversation_participants FOR UPDATE USING (
  user_id = auth.uid() OR is_admin()
);

DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages FOR SELECT TO authenticated USING (
  is_admin()
  OR is_conversation_participant(conversation_id)
  OR EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
);
DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND (
    is_conversation_participant(conversation_id)
    OR EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  )
);
DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages FOR UPDATE USING (sender_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS ai_tutor_sessions_own ON ai_tutor_sessions;
CREATE POLICY ai_tutor_sessions_own ON ai_tutor_sessions FOR ALL USING (
  is_admin() OR student_id = own_student_id()
) WITH CHECK (student_id = own_student_id() OR is_admin());

DROP POLICY IF EXISTS ai_tutor_messages_own ON ai_tutor_messages;
CREATE POLICY ai_tutor_messages_own ON ai_tutor_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM ai_tutor_sessions s
    WHERE s.id = session_id AND (s.student_id = own_student_id() OR is_admin())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_tutor_sessions s
    WHERE s.id = session_id AND (s.student_id = own_student_id() OR is_admin())
  )
);

DROP POLICY IF EXISTS whatsapp_outbox_admin ON whatsapp_outbox;
CREATE POLICY whatsapp_outbox_admin ON whatsapp_outbox FOR ALL USING (is_admin());

-- Timetable write for admins
DROP POLICY IF EXISTS timetable_admin_write ON timetable_slots;
CREATE POLICY timetable_admin_write ON timetable_slots FOR ALL USING (is_admin());

-- Announcement → in-app notifications + WhatsApp outbox
CREATE OR REPLACE FUNCTION public.notify_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r profiles%ROWTYPE;
  phone TEXT;
BEGIN
  FOR r IN
    SELECT * FROM profiles
    WHERE school_id = NEW.school_id
      AND is_active = true
      AND (
        'all' = ANY (NEW.audience)
        OR role::text = ANY (NEW.audience)
      )
  LOOP
    INSERT INTO notifications (user_id, school_id, title, body, type, link)
    VALUES (
      r.id,
      NEW.school_id,
      'Announcement: ' || NEW.title,
      left(NEW.body, 280),
      'announcement',
      '/announcements'
    );

    IF EXISTS (
      SELECT 1 FROM schools s
      WHERE s.id = NEW.school_id AND s.whatsapp_enabled AND s.whatsapp_notify_announcements
    ) THEN
      phone := COALESCE(r.phone, '');
      IF phone <> '' THEN
        INSERT INTO whatsapp_outbox (school_id, to_phone, body, related_type, related_id)
        VALUES (
          NEW.school_id,
          phone,
          '📢 ' || NEW.title || E'\n' || left(NEW.body, 400),
          'announcement',
          NEW.id
        );
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON announcements;
CREATE TRIGGER trg_notify_announcement
AFTER INSERT ON announcements
FOR EACH ROW EXECUTE FUNCTION public.notify_announcement();

-- Attendance → WhatsApp outbox for linked parents
CREATE OR REPLACE FUNCTION public.queue_whatsapp_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sch schools%ROWTYPE;
  parent_rec RECORD;
  learner_name TEXT;
BEGIN
  SELECT * INTO sch FROM schools WHERE id = NEW.school_id;
  IF NOT FOUND OR NOT sch.whatsapp_enabled OR NOT sch.whatsapp_notify_attendance THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('absent', 'late') THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(p.first_name || ' ' || p.last_name, 'Learner') INTO learner_name
  FROM students s JOIN profiles p ON p.id = s.profile_id
  WHERE s.id = NEW.student_id;

  FOR parent_rec IN
    SELECT pr.phone
    FROM parent_students ps
    JOIN parents pa ON pa.id = ps.parent_id
    JOIN profiles pr ON pr.id = pa.profile_id
    WHERE ps.student_id = NEW.student_id AND pr.phone IS NOT NULL AND pr.phone <> ''
  LOOP
    INSERT INTO whatsapp_outbox (school_id, to_phone, body, related_type, related_id)
    VALUES (
      NEW.school_id,
      parent_rec.phone,
      'Horizon High: ' || learner_name || ' marked ' || NEW.status || ' on ' || NEW.date::text || '.',
      'attendance',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_attendance ON attendance;
CREATE TRIGGER trg_whatsapp_attendance
AFTER INSERT ON attendance
FOR EACH ROW EXECUTE FUNCTION public.queue_whatsapp_attendance();

-- Grade homework submission by teachers
DROP POLICY IF EXISTS homework_submissions_update ON homework_submissions;
CREATE POLICY homework_submissions_update ON homework_submissions
  FOR UPDATE USING (
    student_id = own_student_id()
    OR is_admin()
    OR (
      app_user_role() = 'teacher'
      AND EXISTS (
        SELECT 1 FROM homework h
        JOIN class_subjects cs ON cs.id = h.class_subject_id
        WHERE h.id = homework_submissions.homework_id
          AND cs.teacher_id = auth.uid()
      )
    )
  );
