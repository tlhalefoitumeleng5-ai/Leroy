export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'teacher'
  | 'parent'
  | 'student'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'waiting_list'
export type AttendanceStatus = 'present' | 'late' | 'absent'
export type AssessmentType = 'homework' | 'assignment' | 'test' | 'exam' | 'project' | 'oral'
export type NotificationType =
  | 'attendance'
  | 'marks'
  | 'announcement'
  | 'homework'
  | 'admission'
  | 'forum'
  | 'system'

export interface Profile {
  id: string
  schoolId: string
  role: UserRole
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatarUrl?: string
  dateOfBirth?: string
  gender?: Gender
  address?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
}

export interface School {
  id: string
  name: string
  emisNumber?: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
}

export interface Grade {
  id: string
  schoolId: string
  gradeNumber: number
  name: string
}

export interface ClassRoom {
  id: string
  schoolId: string
  gradeId: string
  name: string
  room?: string
  classTeacherId?: string
}

export interface Subject {
  id: string
  schoolId: string
  code: string
  name: string
  description?: string
}

export interface ClassSubject {
  id: string
  classId: string
  subjectId: string
  teacherId?: string
}

export interface Student {
  id: string
  profileId: string
  schoolId: string
  studentNumber: string
  classId?: string
  gradeId?: string
  admissionDate?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  house?: string
  admissionNumber?: string
}

export interface HomeworkSubmission {
  id: string
  homeworkId: string
  studentId: string
  fileUrl?: string
  fileName?: string
  notes?: string
  status: 'pending' | 'submitted' | 'late' | 'graded'
  submittedAt: string
}

export interface Teacher {
  id: string
  profileId: string
  schoolId: string
  employeeNumber?: string
  department?: string
}

export interface Parent {
  id: string
  profileId: string
  schoolId: string
  relationship?: string
}

export interface ParentStudent {
  id: string
  parentId: string
  studentId: string
  isPrimary: boolean
}

export interface Admission {
  id: string
  schoolId: string
  applicantName: string
  applicantSurname: string
  idNumber: string
  gender?: Gender
  dateOfBirth: string
  gradeApplyingFor: number
  currentSchool?: string
  previousGrade?: number
  parentName: string
  parentPhone: string
  parentEmail: string
  physicalAddress: string
  emergencyContact?: string
  birthCertificateUrl?: string
  parentIdUrl?: string
  latestReportUrl?: string
  proofOfResidenceUrl?: string
  status: ApplicationStatus
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  schoolId: string
  studentId: string
  classId: string
  date: string
  status: AttendanceStatus
  notes?: string
  recordedBy?: string
  recordedAt: string
}

export interface Assessment {
  id: string
  schoolId: string
  classSubjectId: string
  title: string
  type: AssessmentType
  maxScore: number
  weight?: number
  dueDate?: string
  description?: string
  createdBy?: string
  createdAt: string
}

export interface Mark {
  id: string
  assessmentId: string
  studentId: string
  score: number
  percentage: number
  comment?: string
  capturedBy?: string
  capturedAt: string
}

export interface Homework {
  id: string
  schoolId: string
  classSubjectId: string
  title: string
  description?: string
  dueDate: string
  attachmentUrl?: string
  createdBy?: string
  createdAt: string
}

export interface LearningMaterial {
  id: string
  schoolId: string
  classSubjectId: string
  title: string
  description?: string
  fileUrl: string
  fileType?: string
  uploadedBy?: string
  createdAt: string
}

export interface TimetableSlot {
  id: string
  schoolId: string
  classId: string
  subjectId: string
  teacherId?: string
  dayOfWeek: number
  periodNumber: number
  startTime: string
  endTime: string
  room?: string
}

export interface CalendarEvent {
  id: string
  schoolId: string
  title: string
  description?: string
  startAt: string
  endAt?: string
  allDay: boolean
  audience: string[]
  createdBy?: string
}

export interface Announcement {
  id: string
  schoolId: string
  title: string
  body: string
  audience: string[]
  pinned: boolean
  createdBy?: string
  createdAt: string
}

export interface AppNotification {
  id: string
  schoolId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface ForumPost {
  id: string
  schoolId: string
  authorId: string
  title: string
  body: string
  isHidden: boolean
  createdAt: string
  likes: string[]
}

export interface ForumComment {
  id: string
  postId: string
  authorId: string
  body: string
  isHidden: boolean
  createdAt: string
}

export interface ForumReport {
  id: string
  postId?: string
  commentId?: string
  reportedBy: string
  reason: string
  status: string
  createdAt: string
}

export interface AuditLog {
  id: string
  schoolId?: string
  actorId?: string
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}
