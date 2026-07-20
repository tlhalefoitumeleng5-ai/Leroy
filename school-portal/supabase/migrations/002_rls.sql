-- School Portal — Row Level Security policies
-- Marks: students own only; parents linked children; teachers assigned classes; admins all

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
CREATE POLICY profiles_select_own_or_school ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR is_admin()
    OR (school_id = current_school_id() AND app_user_role() IN ('teacher', 'school_admin', 'super_admin'))
  );

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY profiles_admin_insert ON profiles
  FOR INSERT WITH CHECK (is_admin() OR id = auth.uid());

-- ---------- schools ----------
CREATE POLICY schools_select ON schools
  FOR SELECT USING (id = current_school_id() OR is_admin() OR app_user_role() = 'super_admin');

CREATE POLICY schools_admin_all ON schools
  FOR ALL USING (is_admin() OR app_user_role() = 'super_admin');

-- ---------- academic structure (read school, write admin) ----------
CREATE POLICY grades_select ON grades FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY grades_admin ON grades FOR ALL USING (is_admin());

CREATE POLICY classes_select ON classes FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY classes_admin ON classes FOR ALL USING (is_admin());

CREATE POLICY subjects_select ON subjects FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY subjects_admin ON subjects FOR ALL USING (is_admin());

CREATE POLICY class_subjects_select ON class_subjects FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c WHERE c.id = class_id AND (c.school_id = current_school_id() OR is_admin()))
);
CREATE POLICY class_subjects_write ON class_subjects FOR ALL USING (
  is_admin() OR teacher_id = auth.uid()
);

CREATE POLICY academic_years_select ON academic_years FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY academic_years_admin ON academic_years FOR ALL USING (is_admin());

-- ---------- students ----------
CREATE POLICY students_select ON students FOR SELECT USING (
  is_admin()
  OR profile_id = auth.uid()
  OR parent_linked_to_student(id)
  OR is_teacher_for_student(id)
);

CREATE POLICY students_admin ON students FOR ALL USING (is_admin());

-- ---------- teachers / parents ----------
CREATE POLICY teachers_select ON teachers FOR SELECT USING (school_id = current_school_id() OR is_admin() OR profile_id = auth.uid());
CREATE POLICY teachers_admin ON teachers FOR ALL USING (is_admin());

CREATE POLICY parents_select ON parents FOR SELECT USING (school_id = current_school_id() OR is_admin() OR profile_id = auth.uid());
CREATE POLICY parents_admin ON parents FOR ALL USING (is_admin());

CREATE POLICY parent_students_select ON parent_students FOR SELECT USING (
  is_admin()
  OR EXISTS (SELECT 1 FROM parents p WHERE p.id = parent_id AND p.profile_id = auth.uid())
  OR EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
);
CREATE POLICY parent_students_admin ON parent_students FOR ALL USING (is_admin());

-- ---------- MARKS (critical) ----------
CREATE POLICY marks_select ON marks FOR SELECT USING (
  is_admin()
  OR student_id = own_student_id()
  OR parent_linked_to_student(student_id)
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM assessments a
      JOIN class_subjects cs ON cs.id = a.class_subject_id
      WHERE a.id = marks.assessment_id
        AND cs.teacher_id = auth.uid()
    )
  )
);

CREATE POLICY marks_insert_teacher ON marks FOR INSERT WITH CHECK (
  is_admin()
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM assessments a
      JOIN class_subjects cs ON cs.id = a.class_subject_id
      WHERE a.id = assessment_id
        AND cs.teacher_id = auth.uid()
    )
  )
);

CREATE POLICY marks_update_teacher ON marks FOR UPDATE USING (
  is_admin()
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM assessments a
      JOIN class_subjects cs ON cs.id = a.class_subject_id
      WHERE a.id = marks.assessment_id
        AND cs.teacher_id = auth.uid()
    )
  )
);

CREATE POLICY marks_delete_admin ON marks FOR DELETE USING (is_admin());

-- ---------- assessments ----------
CREATE POLICY assessments_select ON assessments FOR SELECT USING (
  school_id = current_school_id() OR is_admin()
);
CREATE POLICY assessments_write ON assessments FOR ALL USING (
  is_admin()
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_subjects cs
      WHERE cs.id = class_subject_id AND cs.teacher_id = auth.uid()
    )
  )
);

-- ---------- attendance ----------
CREATE POLICY attendance_select ON attendance FOR SELECT USING (
  is_admin()
  OR student_id = own_student_id()
  OR parent_linked_to_student(student_id)
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_subjects cs
      WHERE cs.class_id = attendance.class_id AND cs.teacher_id = auth.uid()
    )
  )
);

CREATE POLICY attendance_write ON attendance FOR ALL USING (
  is_admin()
  OR (
    app_user_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM class_subjects cs
      WHERE cs.class_id = class_id AND cs.teacher_id = auth.uid()
    )
  )
);

-- ---------- admissions ----------
CREATE POLICY admissions_public_insert ON admissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY admissions_select ON admissions FOR SELECT USING (
  is_admin() OR parent_email = (SELECT email FROM profiles WHERE id = auth.uid())
);

CREATE POLICY admissions_admin_update ON admissions FOR UPDATE USING (is_admin());

-- ---------- homework & materials ----------
CREATE POLICY homework_select ON homework FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY homework_write ON homework FOR ALL USING (
  is_admin() OR created_by = auth.uid()
);

CREATE POLICY materials_select ON learning_materials FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY materials_write ON learning_materials FOR ALL USING (
  is_admin() OR uploaded_by = auth.uid()
);

-- ---------- timetable ----------
CREATE POLICY timetable_select ON timetable_slots FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY timetable_admin ON timetable_slots FOR ALL USING (is_admin());

-- ---------- calendar & announcements ----------
CREATE POLICY calendar_select ON calendar_events FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY calendar_admin ON calendar_events FOR ALL USING (is_admin());

CREATE POLICY announcements_select ON announcements FOR SELECT USING (school_id = current_school_id() OR is_admin());
CREATE POLICY announcements_admin ON announcements FOR ALL USING (is_admin());

-- ---------- notifications ----------
CREATE POLICY notifications_own ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (is_admin() OR true);

CREATE POLICY push_own ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- ---------- forum (parents + admins) ----------
CREATE POLICY forum_posts_select ON forum_posts FOR SELECT USING (
  (school_id = current_school_id() AND is_hidden = false AND app_user_role() IN ('parent', 'school_admin', 'super_admin'))
  OR is_admin()
);

CREATE POLICY forum_posts_insert ON forum_posts FOR INSERT WITH CHECK (
  app_user_role() = 'parent' AND author_id = auth.uid() AND school_id = current_school_id()
);

CREATE POLICY forum_posts_update ON forum_posts FOR UPDATE USING (
  author_id = auth.uid() OR is_admin()
);

CREATE POLICY forum_comments_select ON forum_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM forum_posts fp
    WHERE fp.id = post_id AND fp.school_id = current_school_id() AND (fp.is_hidden = false OR is_admin())
  )
);

CREATE POLICY forum_comments_insert ON forum_comments FOR INSERT WITH CHECK (
  app_user_role() IN ('parent', 'school_admin', 'super_admin') AND author_id = auth.uid()
);

CREATE POLICY forum_likes_all ON forum_likes FOR ALL USING (
  user_id = auth.uid() OR is_admin()
);

CREATE POLICY forum_reports_insert ON forum_reports FOR INSERT WITH CHECK (
  reported_by = auth.uid() AND app_user_role() IN ('parent', 'school_admin', 'super_admin')
);

CREATE POLICY forum_reports_admin ON forum_reports FOR SELECT USING (is_admin());

-- ---------- audit ----------
CREATE POLICY audit_admin ON audit_logs FOR SELECT USING (is_admin() OR app_user_role() = 'super_admin');
CREATE POLICY audit_insert ON audit_logs FOR INSERT WITH CHECK (actor_id = auth.uid() OR is_admin());

-- Storage buckets (run in Supabase dashboard / storage API)
-- admissions-docs, learning-materials, avatars, report-cards
