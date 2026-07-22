-- School Portal v1.1 — Student Portal enhancements

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS house TEXT,
  ADD COLUMN IF NOT EXISTS admission_number TEXT;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'late', 'graded')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (homework_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_homework_submissions_student ON homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homework ON homework_submissions(homework_id);

ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

-- Fix: use app_user_role if current_role was renamed
DROP POLICY IF EXISTS homework_submissions_select ON homework_submissions;
CREATE POLICY homework_submissions_select ON homework_submissions
  FOR SELECT USING (
    is_admin()
    OR student_id = own_student_id()
    OR parent_linked_to_student(student_id)
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

DROP POLICY IF EXISTS homework_submissions_insert ON homework_submissions;
CREATE POLICY homework_submissions_insert ON homework_submissions
  FOR INSERT WITH CHECK (student_id = own_student_id());

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

-- Students can delete own notifications
DROP POLICY IF EXISTS notifications_delete_own ON notifications;
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- Students may update their own emergency contact fields
DROP POLICY IF EXISTS "Students update own record" ON public.students;
CREATE POLICY "Students update own record"
ON public.students FOR UPDATE TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Learners need teacher names on timetable/subjects and linked parents on profile
DROP POLICY IF EXISTS profiles_select_staff_for_learners ON public.profiles;
CREATE POLICY profiles_select_staff_for_learners ON public.profiles
FOR SELECT TO authenticated
USING (
  school_id = current_school_id()
  AND role IN ('teacher', 'school_admin')
  AND app_user_role() IN ('student', 'parent')
);

DROP POLICY IF EXISTS profiles_select_linked_parents ON public.profiles;
CREATE POLICY profiles_select_linked_parents ON public.profiles
FOR SELECT TO authenticated
USING (
  app_user_role() = 'student'
  AND EXISTS (
    SELECT 1
    FROM students s
    JOIN parent_students ps ON ps.student_id = s.id
    JOIN parents par ON par.id = ps.parent_id
    WHERE s.profile_id = auth.uid()
      AND par.profile_id = profiles.id
  )
);

-- Ensure avatars bucket exists for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('homework-submissions', 'homework-submissions', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS homework_files_own ON storage.objects;
CREATE POLICY homework_files_own ON storage.objects
  FOR ALL USING (
    bucket_id = 'homework-submissions'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'homework-submissions'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
