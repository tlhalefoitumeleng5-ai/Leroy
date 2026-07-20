import type {
  Admission,
  Announcement,
  AppNotification,
  Assessment,
  AttendanceRecord,
  AuditLog,
  CalendarEvent,
  ClassRoom,
  ClassSubject,
  ForumComment,
  ForumPost,
  ForumReport,
  Grade,
  Homework,
  LearningMaterial,
  Mark,
  Parent,
  ParentStudent,
  Profile,
  School,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
  UserRole,
} from '@/types'
import { todayISO, uid } from '@/lib/utils'

const SCHOOL_ID = 'school_horizon'
const YEAR = new Date().getFullYear()

function profile(
  id: string,
  role: UserRole,
  first: string,
  last: string,
  email: string,
  extras: Partial<Profile> = {},
): Profile {
  return {
    id,
    schoolId: SCHOOL_ID,
    role,
    firstName: first,
    lastName: last,
    email,
    phone: extras.phone ?? '0820000000',
    isActive: true,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    ...extras,
  }
}

const school: School = {
  id: SCHOOL_ID,
  name: 'Horizon High School',
  emisNumber: '700123456',
  address: '12 Freedom Drive, Johannesburg, Gauteng, 2001',
  phone: '0115550100',
  email: 'admin@horizonhigh.edu.za',
}

const grades: Grade[] = [8, 9, 10, 11, 12].map((n) => ({
  id: `grade_${n}`,
  schoolId: SCHOOL_ID,
  gradeNumber: n,
  name: `Grade ${n}`,
}))

const classes: ClassRoom[] = [
  { id: 'class_10a', schoolId: SCHOOL_ID, gradeId: 'grade_10', name: '10A', room: 'B12', classTeacherId: 'user_teacher1' },
  { id: 'class_10b', schoolId: SCHOOL_ID, gradeId: 'grade_10', name: '10B', room: 'B14', classTeacherId: 'user_teacher2' },
  { id: 'class_11a', schoolId: SCHOOL_ID, gradeId: 'grade_11', name: '11A', room: 'C01', classTeacherId: 'user_teacher1' },
  { id: 'class_12a', schoolId: SCHOOL_ID, gradeId: 'grade_12', name: '12A', room: 'D02', classTeacherId: 'user_teacher2' },
]

const subjects: Subject[] = [
  { id: 'sub_eng', schoolId: SCHOOL_ID, code: 'ENGHL', name: 'English Home Language' },
  { id: 'sub_afr', schoolId: SCHOOL_ID, code: 'AFRFAL', name: 'Afrikaans First Additional Language' },
  { id: 'sub_math', schoolId: SCHOOL_ID, code: 'MATH', name: 'Mathematics' },
  { id: 'sub_life', schoolId: SCHOOL_ID, code: 'LO', name: 'Life Orientation' },
  { id: 'sub_phys', schoolId: SCHOOL_ID, code: 'PHYS', name: 'Physical Sciences' },
  { id: 'sub_life_sci', schoolId: SCHOOL_ID, code: 'LFSC', name: 'Life Sciences' },
  { id: 'sub_hist', schoolId: SCHOOL_ID, code: 'HIST', name: 'History' },
  { id: 'sub_geo', schoolId: SCHOOL_ID, code: 'GEOG', name: 'Geography' },
]

const profiles: Profile[] = [
  profile('user_super', 'super_admin', 'Thabo', 'Mokoena', 'super@schoolportal.za', { phone: '0821110001' }),
  profile('user_admin', 'school_admin', 'Naledi', 'Dlamini', 'admin@horizonhigh.edu.za', { phone: '0821110002' }),
  profile('user_teacher1', 'teacher', 'Sipho', 'Nkosi', 'sipho.nkosi@horizonhigh.edu.za', { phone: '0821110003' }),
  profile('user_teacher2', 'teacher', 'Aisha', 'Patel', 'aisha.patel@horizonhigh.edu.za', { phone: '0821110004' }),
  profile('user_parent1', 'parent', 'Lindiwe', 'Molefe', 'lindiwe.molefe@email.com', { phone: '0821110005' }),
  profile('user_parent2', 'parent', 'Johan', 'van Wyk', 'johan.vanwyk@email.com', { phone: '0821110006' }),
  profile('user_student1', 'student', 'Kagiso', 'Molefe', 'kagiso.molefe@student.horizonhigh.edu.za', {
    phone: '0821110007',
    dateOfBirth: '2010-03-14',
    gender: 'male',
    address: '45 Mandela Ave, Soweto',
  }),
  profile('user_student2', 'student', 'Emma', 'van Wyk', 'emma.vanwyk@student.horizonhigh.edu.za', {
    phone: '0821110008',
    dateOfBirth: '2009-07-22',
    gender: 'female',
    address: '8 Oak Street, Randburg',
  }),
  profile('user_student3', 'student', 'Lebo', 'Maseko', 'lebo.maseko@student.horizonhigh.edu.za', {
    dateOfBirth: '2010-11-02',
    gender: 'female',
  }),
]

const teachers: Teacher[] = [
  { id: 'tch_1', profileId: 'user_teacher1', schoolId: SCHOOL_ID, employeeNumber: 'T001', department: 'Sciences' },
  { id: 'tch_2', profileId: 'user_teacher2', schoolId: SCHOOL_ID, employeeNumber: 'T002', department: 'Languages' },
]

const students: Student[] = [
  {
    id: 'stu_1',
    profileId: 'user_student1',
    schoolId: SCHOOL_ID,
    studentNumber: 'HHS2024001',
    classId: 'class_10a',
    gradeId: 'grade_10',
    admissionDate: '2024-01-15',
    emergencyContactName: 'Lindiwe Molefe',
    emergencyContactPhone: '0821110005',
  },
  {
    id: 'stu_2',
    profileId: 'user_student2',
    schoolId: SCHOOL_ID,
    studentNumber: 'HHS2024002',
    classId: 'class_11a',
    gradeId: 'grade_11',
    admissionDate: '2023-01-10',
    emergencyContactName: 'Johan van Wyk',
    emergencyContactPhone: '0821110006',
  },
  {
    id: 'stu_3',
    profileId: 'user_student3',
    schoolId: SCHOOL_ID,
    studentNumber: 'HHS2024003',
    classId: 'class_10a',
    gradeId: 'grade_10',
    admissionDate: '2024-01-15',
  },
]

const parents: Parent[] = [
  { id: 'par_1', profileId: 'user_parent1', schoolId: SCHOOL_ID, relationship: 'mother' },
  { id: 'par_2', profileId: 'user_parent2', schoolId: SCHOOL_ID, relationship: 'father' },
]

const parentStudents: ParentStudent[] = [
  { id: 'ps_1', parentId: 'par_1', studentId: 'stu_1', isPrimary: true },
  { id: 'ps_2', parentId: 'par_2', studentId: 'stu_2', isPrimary: true },
]

const classSubjects: ClassSubject[] = [
  { id: 'cs_10a_math', classId: 'class_10a', subjectId: 'sub_math', teacherId: 'user_teacher1' },
  { id: 'cs_10a_phys', classId: 'class_10a', subjectId: 'sub_phys', teacherId: 'user_teacher1' },
  { id: 'cs_10a_eng', classId: 'class_10a', subjectId: 'sub_eng', teacherId: 'user_teacher2' },
  { id: 'cs_10a_life', classId: 'class_10a', subjectId: 'sub_life', teacherId: 'user_teacher2' },
  { id: 'cs_11a_math', classId: 'class_11a', subjectId: 'sub_math', teacherId: 'user_teacher1' },
  { id: 'cs_11a_eng', classId: 'class_11a', subjectId: 'sub_eng', teacherId: 'user_teacher2' },
  { id: 'cs_12a_math', classId: 'class_12a', subjectId: 'sub_math', teacherId: 'user_teacher1' },
]

const periods = [
  { n: 1, start: '07:45', end: '08:30' },
  { n: 2, start: '08:30', end: '09:15' },
  { n: 3, start: '09:15', end: '10:00' },
  { n: 4, start: '10:20', end: '11:05' },
  { n: 5, start: '11:05', end: '11:50' },
  { n: 6, start: '11:50', end: '12:35' },
  { n: 7, start: '13:15', end: '14:00' },
]

const timetable: TimetableSlot[] = []
for (const day of [1, 2, 3, 4, 5]) {
  const rot = [
    { subjectId: 'sub_math', teacherId: 'user_teacher1' },
    { subjectId: 'sub_eng', teacherId: 'user_teacher2' },
    { subjectId: 'sub_phys', teacherId: 'user_teacher1' },
    { subjectId: 'sub_life', teacherId: 'user_teacher2' },
    { subjectId: 'sub_life_sci', teacherId: 'user_teacher1' },
    { subjectId: 'sub_afr', teacherId: 'user_teacher2' },
    { subjectId: 'sub_hist', teacherId: 'user_teacher2' },
  ]
  periods.forEach((p, i) => {
    const sub = rot[(day + i) % rot.length]
    timetable.push({
      id: uid('tt'),
      schoolId: SCHOOL_ID,
      classId: 'class_10a',
      subjectId: sub.subjectId,
      teacherId: sub.teacherId,
      dayOfWeek: day,
      periodNumber: p.n,
      startTime: p.start,
      endTime: p.end,
      room: 'B12',
    })
  })
}

const assessments: Assessment[] = [
  {
    id: 'as_1',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_math',
    title: 'Term 1 Algebra Test',
    type: 'test',
    maxScore: 50,
    dueDate: `${YEAR}-03-15`,
    createdBy: 'user_teacher1',
    createdAt: `${YEAR}-03-01T08:00:00Z`,
  },
  {
    id: 'as_2',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_eng',
    title: 'Poetry Essay',
    type: 'assignment',
    maxScore: 40,
    dueDate: `${YEAR}-03-20`,
    createdBy: 'user_teacher2',
    createdAt: `${YEAR}-03-05T08:00:00Z`,
  },
  {
    id: 'as_3',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_phys',
    title: 'June Exam',
    type: 'exam',
    maxScore: 150,
    dueDate: `${YEAR}-06-20`,
    createdBy: 'user_teacher1',
    createdAt: `${YEAR}-06-01T08:00:00Z`,
  },
  {
    id: 'as_4',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_11a_math',
    title: 'Functions Assignment',
    type: 'assignment',
    maxScore: 60,
    dueDate: `${YEAR}-04-10`,
    createdBy: 'user_teacher1',
    createdAt: `${YEAR}-03-28T08:00:00Z`,
  },
]

const marks: Mark[] = [
  { id: 'mk_1', assessmentId: 'as_1', studentId: 'stu_1', score: 42, percentage: 84, capturedBy: 'user_teacher1', capturedAt: `${YEAR}-03-16T10:00:00Z` },
  { id: 'mk_2', assessmentId: 'as_1', studentId: 'stu_3', score: 35, percentage: 70, capturedBy: 'user_teacher1', capturedAt: `${YEAR}-03-16T10:00:00Z` },
  { id: 'mk_3', assessmentId: 'as_2', studentId: 'stu_1', score: 32, percentage: 80, capturedBy: 'user_teacher2', capturedAt: `${YEAR}-03-21T10:00:00Z` },
  { id: 'mk_4', assessmentId: 'as_3', studentId: 'stu_1', score: 118, percentage: 78.67, capturedBy: 'user_teacher1', capturedAt: `${YEAR}-06-25T10:00:00Z` },
  { id: 'mk_5', assessmentId: 'as_4', studentId: 'stu_2', score: 51, percentage: 85, capturedBy: 'user_teacher1', capturedAt: `${YEAR}-04-12T10:00:00Z` },
]

const attendance: AttendanceRecord[] = [
  {
    id: 'att_1',
    schoolId: SCHOOL_ID,
    studentId: 'stu_1',
    classId: 'class_10a',
    date: todayISO(),
    status: 'present',
    recordedBy: 'user_teacher1',
    recordedAt: new Date().toISOString(),
  },
  {
    id: 'att_2',
    schoolId: SCHOOL_ID,
    studentId: 'stu_3',
    classId: 'class_10a',
    date: todayISO(),
    status: 'late',
    notes: 'Arrived 08:05',
    recordedBy: 'user_teacher1',
    recordedAt: new Date().toISOString(),
  },
  {
    id: 'att_3',
    schoolId: SCHOOL_ID,
    studentId: 'stu_2',
    classId: 'class_11a',
    date: todayISO(),
    status: 'present',
    recordedBy: 'user_teacher1',
    recordedAt: new Date().toISOString(),
  },
]

const homework: Homework[] = [
  {
    id: 'hw_1',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_math',
    title: 'Exercise 4.2 — Quadratic equations',
    description: 'Complete questions 1–12 in the textbook.',
    dueDate: todayISO(),
    createdBy: 'user_teacher1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hw_2',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_eng',
    title: 'Read Chapter 5 of Mother to Mother',
    description: 'Prepare discussion points for class.',
    dueDate: `${YEAR}-04-02`,
    createdBy: 'user_teacher2',
    createdAt: new Date().toISOString(),
  },
]

const materials: LearningMaterial[] = [
  {
    id: 'lm_1',
    schoolId: SCHOOL_ID,
    classSubjectId: 'cs_10a_math',
    title: 'Algebra summary notes',
    description: 'Term 1 revision pack',
    fileUrl: '#',
    fileType: 'pdf',
    uploadedBy: 'user_teacher1',
    createdAt: new Date().toISOString(),
  },
]

const announcements: Announcement[] = [
  {
    id: 'an_1',
    schoolId: SCHOOL_ID,
    title: 'Welcome to Term 2',
    body: 'Learners must wear full winter uniform from Monday. Parent evenings will be announced soon.',
    audience: ['all'],
    pinned: true,
    createdBy: 'user_admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'an_2',
    schoolId: SCHOOL_ID,
    title: 'Grade 12 Study Camp',
    body: 'Grade 12 learners are invited to the weekend study camp at the sports hall.',
    audience: ['student', 'parent'],
    pinned: false,
    createdBy: 'user_admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const calendar: CalendarEvent[] = [
  {
    id: 'cal_1',
    schoolId: SCHOOL_ID,
    title: 'Public Holiday — Freedom Day',
    startAt: `${YEAR}-04-27T00:00:00`,
    allDay: true,
    audience: ['all'],
  },
  {
    id: 'cal_2',
    schoolId: SCHOOL_ID,
    title: 'Interhouse Athletics',
    description: 'All grades participate',
    startAt: `${YEAR}-05-10T08:00:00`,
    endAt: `${YEAR}-05-10T15:00:00`,
    allDay: false,
    audience: ['all'],
    createdBy: 'user_admin',
  },
  {
    id: 'cal_3',
    schoolId: SCHOOL_ID,
    title: 'Parent-Teacher Meetings',
    startAt: `${YEAR}-05-20T16:00:00`,
    endAt: `${YEAR}-05-20T19:00:00`,
    allDay: false,
    audience: ['parent', 'teacher'],
    createdBy: 'user_admin',
  },
]

const admissions: Admission[] = [
  {
    id: 'adm_1',
    schoolId: SCHOOL_ID,
    applicantName: 'Neo',
    applicantSurname: 'Khumalo',
    idNumber: '1201015800083',
    gender: 'male',
    dateOfBirth: '2012-01-01',
    gradeApplyingFor: 8,
    currentSchool: 'Sunshine Primary',
    previousGrade: 7,
    parentName: 'Zanele Khumalo',
    parentPhone: '0832223344',
    parentEmail: 'zanele.k@email.com',
    physicalAddress: '22 Rose Street, Alexandra',
    emergencyContact: '0832223355',
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'adm_2',
    schoolId: SCHOOL_ID,
    applicantName: 'Sarah',
    applicantSurname: 'Botha',
    idNumber: '1105054800088',
    gender: 'female',
    dateOfBirth: '2011-05-05',
    gradeApplyingFor: 9,
    currentSchool: 'Greenfield High',
    previousGrade: 8,
    parentName: 'Pieter Botha',
    parentPhone: '0841112233',
    parentEmail: 'pieter.botha@email.com',
    physicalAddress: '9 Willow Lane, Pretoria',
    status: 'waiting_list',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]

const notifications: AppNotification[] = [
  {
    id: 'nt_1',
    schoolId: SCHOOL_ID,
    userId: 'user_parent1',
    type: 'attendance',
    title: 'Attendance update: Kagiso Molefe',
    body: 'Kagiso Molefe marked present today',
    link: '/parent/attendance',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'nt_2',
    schoolId: SCHOOL_ID,
    userId: 'user_student1',
    type: 'marks',
    title: 'New mark published',
    body: 'Term 1 Algebra Test — 84%',
    link: '/student/marks',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'nt_3',
    schoolId: SCHOOL_ID,
    userId: 'user_parent1',
    type: 'announcement',
    title: 'Welcome to Term 2',
    body: 'Learners must wear full winter uniform from Monday.',
    link: '/parent/announcements',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const forumPosts: ForumPost[] = [
  {
    id: 'fp_1',
    schoolId: SCHOOL_ID,
    authorId: 'user_parent1',
    title: 'Transport to athletics day',
    body: 'Is anyone organizing a carpool for the interhouse athletics on 10 May?',
    isHidden: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    likes: ['user_parent2'],
  },
]

const forumComments: ForumComment[] = [
  {
    id: 'fc_1',
    postId: 'fp_1',
    authorId: 'user_parent2',
    body: 'I can take three learners from Randburg. Message me!',
    isHidden: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

const forumReports: ForumReport[] = []

const auditLogs: AuditLog[] = [
  {
    id: 'au_1',
    schoolId: SCHOOL_ID,
    actorId: 'user_admin',
    action: 'LOGIN',
    entityType: 'session',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'au_2',
    schoolId: SCHOOL_ID,
    actorId: 'user_teacher1',
    action: 'CAPTURE_MARKS',
    entityType: 'marks',
    entityId: 'as_1',
    metadata: { count: 2 },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export interface DemoDatabase {
  school: School
  profiles: Profile[]
  grades: Grade[]
  classes: ClassRoom[]
  subjects: Subject[]
  classSubjects: ClassSubject[]
  teachers: Teacher[]
  students: Student[]
  parents: Parent[]
  parentStudents: ParentStudent[]
  admissions: Admission[]
  attendance: AttendanceRecord[]
  assessments: Assessment[]
  marks: Mark[]
  homework: Homework[]
  materials: LearningMaterial[]
  timetable: TimetableSlot[]
  calendar: CalendarEvent[]
  announcements: Announcement[]
  notifications: AppNotification[]
  forumPosts: ForumPost[]
  forumComments: ForumComment[]
  forumReports: ForumReport[]
  auditLogs: AuditLog[]
  passwords: Record<string, string>
}

const STORAGE_KEY = 'school_portal_demo_v1'

function seed(): DemoDatabase {
  return {
    school,
    profiles: structuredClone(profiles),
    grades: structuredClone(grades),
    classes: structuredClone(classes),
    subjects: structuredClone(subjects),
    classSubjects: structuredClone(classSubjects),
    teachers: structuredClone(teachers),
    students: structuredClone(students),
    parents: structuredClone(parents),
    parentStudents: structuredClone(parentStudents),
    admissions: structuredClone(admissions),
    attendance: structuredClone(attendance),
    assessments: structuredClone(assessments),
    marks: structuredClone(marks),
    homework: structuredClone(homework),
    materials: structuredClone(materials),
    timetable: structuredClone(timetable),
    calendar: structuredClone(calendar),
    announcements: structuredClone(announcements),
    notifications: structuredClone(notifications),
    forumPosts: structuredClone(forumPosts),
    forumComments: structuredClone(forumComments),
    forumReports: structuredClone(forumReports),
    auditLogs: structuredClone(auditLogs),
    passwords: {
      'super@schoolportal.za': 'Password123!',
      'admin@horizonhigh.edu.za': 'Password123!',
      'sipho.nkosi@horizonhigh.edu.za': 'Password123!',
      'aisha.patel@horizonhigh.edu.za': 'Password123!',
      'lindiwe.molefe@email.com': 'Password123!',
      'johan.vanwyk@email.com': 'Password123!',
      'kagiso.molefe@student.horizonhigh.edu.za': 'Password123!',
      'emma.vanwyk@student.horizonhigh.edu.za': 'Password123!',
      'lebo.maseko@student.horizonhigh.edu.za': 'Password123!',
    },
  }
}

export function loadDemoDb(): DemoDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DemoDatabase
  } catch {
    /* ignore */
  }
  const db = seed()
  saveDemoDb(db)
  return db
}

export function saveDemoDb(db: DemoDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function resetDemoDb() {
  localStorage.removeItem(STORAGE_KEY)
  return seed()
}

export const DEMO_ACCOUNTS = [
  { email: 'super@schoolportal.za', role: 'Super Administrator', password: 'Password123!' },
  { email: 'admin@horizonhigh.edu.za', role: 'School Administrator', password: 'Password123!' },
  { email: 'sipho.nkosi@horizonhigh.edu.za', role: 'Teacher', password: 'Password123!' },
  { email: 'lindiwe.molefe@email.com', role: 'Parent', password: 'Password123!' },
  { email: 'kagiso.molefe@student.horizonhigh.edu.za', role: 'Student', password: 'Password123!' },
]
