import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, homeForRole } from '@/components/layout/ProtectedRoute'
import { useAuth } from '@/contexts/auth-context'
import { hasSupabaseConfig } from '@/lib/supabase'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage, VerifyEmailPage } from '@/pages/auth/ForgotPasswordPage'
import { AccountPage } from '@/pages/auth/AccountPage'
import { AdmissionApplicationPage } from '@/pages/public/AdmissionApplicationPage'
import { StudentApplicationsPublicPage } from '@/pages/public/StudentApplicationsPublicPage'
import { TrackApplicationPage } from '@/pages/public/TrackApplicationPage'
import { SupabaseSetupPage } from '@/pages/public/SupabaseSetupPage'
import {
  StudentAnnouncementsPage,
  StudentAttendancePage,
  StudentDashboard,
  StudentExamsPage,
  StudentHomeworkPage,
  StudentMarksPage,
  StudentNotificationsPage,
  StudentProfilePage,
  StudentReportCardPage,
  StudentSubjectsPage,
  StudentTimetablePage,
} from '@/pages/student/StudentPages'
import {
  ParentAnnouncementsPage,
  ParentAttendancePage,
  ParentCalendarPage,
  ParentChildPage,
  ParentDashboard,
  ParentForumPage,
  ParentMarksPage,
  ParentNotificationsPage,
  ParentTimetablePage,
} from '@/pages/parent/ParentPages'
import {
  TeacherAttendancePage,
  TeacherClassesPage,
  TeacherDashboard,
  TeacherHomeworkPage,
  TeacherMarksPage,
  TeacherMaterialsPage,
  TeacherProgressPage,
  TeacherReportsPage,
  TeacherSubjectsPage,
  TeacherTimetablePage,
} from '@/pages/teacher/TeacherPages'
import {
  AdminAdmissionsPage,
  AdminAnnouncementsPage,
  AdminAuditPage,
  AdminCalendarPage,
  AdminClassesPage,
  AdminDashboard,
  AdminParentsPage,
  AdminReportsPage,
  AdminStudentsPage,
  AdminSubjectsPage,
  AdminTeachersPage,
  AdminTimetablePage,
  SuperDashboard,
  SuperSchoolsPage,
  SuperUsersPage,
} from '@/pages/admin/AdminPages'
import { AdminStudentApplicationsPage } from '@/pages/admin/AdminStudentApplicationsPage'
import {
  AdminFeesPage,
  AdminWhatsAppPage,
  MessagingPage,
  ParentFeesPage,
  StudentFeesPage,
} from '@/pages/shared/ProductionPages'
import { StudentAiTutorPage } from '@/pages/student/AiTutorPage'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.profile.role)} replace />
}

export default function App() {
  if (!hasSupabaseConfig) {
    return <SupabaseSetupPage />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/apply" element={<StudentApplicationsPublicPage />} />
      <Route path="/apply/track" element={<TrackApplicationPage />} />
      <Route path="/apply/legacy" element={<AdmissionApplicationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/account" element={<AccountPage />} />

          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/timetable" element={<StudentTimetablePage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/homework" element={<StudentHomeworkPage />} />
            <Route path="/student/subjects" element={<StudentSubjectsPage />} />
            <Route path="/student/marks" element={<StudentMarksPage />} />
            <Route path="/student/exams" element={<StudentExamsPage />} />
            <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="/student/notifications" element={<StudentNotificationsPage />} />
            <Route path="/student/report-card" element={<StudentReportCardPage />} />
            <Route path="/student/messages" element={<MessagingPage />} />
            <Route path="/student/fees" element={<StudentFeesPage />} />
            <Route path="/student/ai-tutor" element={<StudentAiTutorPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['parent']} />}>
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child" element={<ParentChildPage />} />
            <Route path="/parent/attendance" element={<ParentAttendancePage />} />
            <Route path="/parent/marks" element={<ParentMarksPage />} />
            <Route path="/parent/timetable" element={<ParentTimetablePage />} />
            <Route path="/parent/announcements" element={<ParentAnnouncementsPage />} />
            <Route path="/parent/calendar" element={<ParentCalendarPage />} />
            <Route path="/parent/notifications" element={<ParentNotificationsPage />} />
            <Route path="/parent/forum" element={<ParentForumPage />} />
            <Route path="/parent/fees" element={<ParentFeesPage />} />
            <Route path="/parent/messages" element={<MessagingPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/marks" element={<TeacherMarksPage />} />
            <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
            <Route path="/teacher/classes" element={<TeacherClassesPage />} />
            <Route path="/teacher/subjects" element={<TeacherSubjectsPage />} />
            <Route path="/teacher/materials" element={<TeacherMaterialsPage />} />
            <Route path="/teacher/homework" element={<TeacherHomeworkPage />} />
            <Route path="/teacher/reports" element={<TeacherReportsPage />} />
            <Route path="/teacher/progress" element={<TeacherProgressPage />} />
            <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
            <Route path="/teacher/messages" element={<MessagingPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['school_admin', 'super_admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudentsPage />} />
            <Route path="/admin/teachers" element={<AdminTeachersPage />} />
            <Route path="/admin/parents" element={<AdminParentsPage />} />
            <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
            <Route path="/admin/classes" element={<AdminClassesPage />} />
            <Route path="/admin/timetable" element={<AdminTimetablePage />} />
            <Route path="/admin/admissions" element={<AdminAdmissionsPage />} />
            <Route path="/admin/applications" element={<AdminStudentApplicationsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/calendar" element={<AdminCalendarPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/fees" element={<AdminFeesPage />} />
            <Route path="/admin/whatsapp" element={<AdminWhatsAppPage />} />
            <Route path="/admin/messages" element={<MessagingPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route path="/super" element={<SuperDashboard />} />
            <Route path="/super/schools" element={<SuperSchoolsPage />} />
            <Route path="/super/users" element={<SuperUsersPage />} />
            <Route path="/super/audit" element={<AdminAuditPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
