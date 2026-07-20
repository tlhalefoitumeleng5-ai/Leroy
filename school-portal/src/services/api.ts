import type {
  Admission,
  Announcement,
  AppNotification,
  Assessment,
  AttendanceRecord,
  AttendanceStatus,
  AuditLog,
  CalendarEvent,
  ClassRoom,
  ClassSubject,
  ForumComment,
  ForumPost,
  Grade,
  Homework,
  LearningMaterial,
  Mark,
  Parent,
  ParentStudent,
  Profile,
  Student,
  Subject,
  Teacher,
  TimetableSlot,
  ApplicationStatus,
} from '@/types'
import { loadDemoDb, saveDemoDb, type DemoDatabase } from '@/data/demo-db'
import { todayISO, uid } from '@/lib/utils'

type Listener = () => void

class DemoApi {
  private db: DemoDatabase
  private listeners = new Set<Listener>()

  constructor() {
    this.db = loadDemoDb()
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private commit() {
    saveDemoDb(this.db)
    this.listeners.forEach((fn) => fn())
  }

  getDb() {
    return this.db
  }

  reload() {
    this.db = loadDemoDb()
    this.listeners.forEach((fn) => fn())
  }

  // ---- Auth helpers ----
  findProfileByEmail(email: string) {
    return this.db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())
  }

  verifyPassword(email: string, password: string) {
    return this.db.passwords[email.toLowerCase()] === password || this.db.passwords[email] === password
  }

  setPassword(email: string, password: string) {
    this.db.passwords[email] = password
    this.commit()
  }

  updateProfile(id: string, patch: Partial<Profile>) {
    const i = this.db.profiles.findIndex((p) => p.id === id)
    if (i >= 0) {
      this.db.profiles[i] = { ...this.db.profiles[i], ...patch }
      this.commit()
    }
    return this.db.profiles[i]
  }

  // ---- Lookups ----
  getProfile(id: string) {
    return this.db.profiles.find((p) => p.id === id)
  }

  getStudentByProfile(profileId: string) {
    return this.db.students.find((s) => s.profileId === profileId)
  }

  getParentByProfile(profileId: string) {
    return this.db.parents.find((p) => p.profileId === profileId)
  }

  getLinkedStudents(parentProfileId: string): Student[] {
    const parent = this.getParentByProfile(parentProfileId)
    if (!parent) return []
    const ids = this.db.parentStudents.filter((ps) => ps.parentId === parent.id).map((ps) => ps.studentId)
    return this.db.students.filter((s) => ids.includes(s.id))
  }

  getSubject(id: string) {
    return this.db.subjects.find((s) => s.id === id)
  }

  getClass(id: string) {
    return this.db.classes.find((c) => c.id === id)
  }

  getGrade(id: string) {
    return this.db.grades.find((g) => g.id === id)
  }

  getClassSubject(id: string) {
    return this.db.classSubjects.find((cs) => cs.id === id)
  }

  // ---- Marks (RLS simulation) ----
  getMarksForUser(profile: Profile): Array<Mark & { assessment: Assessment; subjectName: string }> {
    let allowedStudentIds: string[] = []

    if (profile.role === 'super_admin' || profile.role === 'school_admin') {
      allowedStudentIds = this.db.students.map((s) => s.id)
    } else if (profile.role === 'student') {
      const stu = this.getStudentByProfile(profile.id)
      allowedStudentIds = stu ? [stu.id] : []
    } else if (profile.role === 'parent') {
      allowedStudentIds = this.getLinkedStudents(profile.id).map((s) => s.id)
    } else if (profile.role === 'teacher') {
      const myCs = this.db.classSubjects.filter((cs) => cs.teacherId === profile.id).map((cs) => cs.id)
      const myAssessments = this.db.assessments.filter((a) => myCs.includes(a.classSubjectId)).map((a) => a.id)
      return this.db.marks
        .filter((m) => myAssessments.includes(m.assessmentId))
        .map((m) => this.enrichMark(m))
        .filter(Boolean) as Array<Mark & { assessment: Assessment; subjectName: string }>
    }

    return this.db.marks
      .filter((m) => allowedStudentIds.includes(m.studentId))
      .map((m) => this.enrichMark(m))
      .filter(Boolean) as Array<Mark & { assessment: Assessment; subjectName: string }>
  }

  private enrichMark(m: Mark) {
    const assessment = this.db.assessments.find((a) => a.id === m.assessmentId)
    if (!assessment) return null
    const cs = this.getClassSubject(assessment.classSubjectId)
    const subject = cs ? this.getSubject(cs.subjectId) : undefined
    return { ...m, assessment, subjectName: subject?.name ?? 'Subject' }
  }

  canTeacherEditAssessment(teacherId: string, assessmentId: string) {
    const a = this.db.assessments.find((x) => x.id === assessmentId)
    if (!a) return false
    const cs = this.getClassSubject(a.classSubjectId)
    return cs?.teacherId === teacherId
  }

  upsertMark(input: {
    assessmentId: string
    studentId: string
    score: number
    comment?: string
    capturedBy: string
  }) {
    const assessment = this.db.assessments.find((a) => a.id === input.assessmentId)
    if (!assessment) throw new Error('Assessment not found')
    if (!this.canTeacherEditAssessment(input.capturedBy, input.assessmentId)) {
      const actor = this.getProfile(input.capturedBy)
      if (!actor || (actor.role !== 'school_admin' && actor.role !== 'super_admin')) {
        throw new Error('Not authorized to edit marks for this assessment')
      }
    }
    const percentage = Math.round((input.score / assessment.maxScore) * 10000) / 100
    const existing = this.db.marks.find(
      (m) => m.assessmentId === input.assessmentId && m.studentId === input.studentId,
    )
    if (existing) {
      existing.score = input.score
      existing.percentage = percentage
      existing.comment = input.comment
      existing.capturedBy = input.capturedBy
      existing.capturedAt = new Date().toISOString()
    } else {
      this.db.marks.push({
        id: uid('mk'),
        assessmentId: input.assessmentId,
        studentId: input.studentId,
        score: input.score,
        percentage,
        comment: input.comment,
        capturedBy: input.capturedBy,
        capturedAt: new Date().toISOString(),
      })
    }
    this.addAudit(input.capturedBy, 'UPSERT_MARK', 'marks', input.assessmentId)
    // notify student + parents
    const student = this.db.students.find((s) => s.id === input.studentId)
    if (student) {
      this.pushNotification(student.profileId, 'marks', 'New mark published', `${assessment.title} — ${percentage}%`, '/student/marks')
      this.getLinkedStudentsByStudentId(student.id).forEach((p) => {
        const parentProfile = this.db.parents.find((x) => x.id === p.parentId)
        if (parentProfile) {
          this.pushNotification(
            parentProfile.profileId,
            'marks',
            'Child mark updated',
            `${assessment.title} — ${percentage}%`,
            '/parent/marks',
          )
        }
      })
    }
    this.commit()
  }

  private getLinkedStudentsByStudentId(studentId: string) {
    return this.db.parentStudents.filter((ps) => ps.studentId === studentId)
  }

  createAssessment(data: Omit<Assessment, 'id' | 'createdAt'>) {
    const a: Assessment = { ...data, id: uid('as'), createdAt: new Date().toISOString() }
    this.db.assessments.push(a)
    this.addAudit(data.createdBy, 'CREATE_ASSESSMENT', 'assessments', a.id)
    this.commit()
    return a
  }

  // ---- Attendance ----
  getAttendanceForUser(profile: Profile) {
    if (profile.role === 'super_admin' || profile.role === 'school_admin') return this.db.attendance
    if (profile.role === 'student') {
      const stu = this.getStudentByProfile(profile.id)
      return this.db.attendance.filter((a) => a.studentId === stu?.id)
    }
    if (profile.role === 'parent') {
      const ids = this.getLinkedStudents(profile.id).map((s) => s.id)
      return this.db.attendance.filter((a) => ids.includes(a.studentId))
    }
    if (profile.role === 'teacher') {
      const classIds = this.db.classSubjects.filter((cs) => cs.teacherId === profile.id).map((cs) => cs.classId)
      return this.db.attendance.filter((a) => classIds.includes(a.classId))
    }
    return []
  }

  recordAttendance(input: {
    studentId: string
    classId: string
    status: AttendanceStatus
    notes?: string
    recordedBy: string
    date?: string
  }) {
    const date = input.date ?? todayISO()
    const existing = this.db.attendance.find(
      (a) => a.studentId === input.studentId && a.classId === input.classId && a.date === date,
    )
    const record: AttendanceRecord = {
      id: existing?.id ?? uid('att'),
      schoolId: this.db.school.id,
      studentId: input.studentId,
      classId: input.classId,
      date,
      status: input.status,
      notes: input.notes,
      recordedBy: input.recordedBy,
      recordedAt: new Date().toISOString(),
    }
    if (existing) {
      Object.assign(existing, record)
    } else {
      this.db.attendance.push(record)
    }
    const student = this.db.students.find((s) => s.id === input.studentId)
    const profile = student ? this.getProfile(student.profileId) : undefined
    const name = profile ? `${profile.firstName} ${profile.lastName}` : 'Student'
    this.getLinkedStudentsByStudentId(input.studentId).forEach((ps) => {
      const parent = this.db.parents.find((p) => p.id === ps.parentId)
      if (parent) {
        this.pushNotification(
          parent.profileId,
          'attendance',
          `Attendance update: ${name}`,
          `${name} marked ${input.status} on ${date}`,
          '/parent/attendance',
        )
      }
    })
    this.addAudit(input.recordedBy, 'RECORD_ATTENDANCE', 'attendance', record.id)
    this.commit()
    return record
  }

  // ---- Admissions ----
  listAdmissions() {
    return [...this.db.admissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  createAdmission(data: Omit<Admission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'schoolId'> & { status?: ApplicationStatus }) {
    const adm: Admission = {
      ...data,
      id: uid('adm'),
      schoolId: this.db.school.id,
      status: data.status ?? 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.db.admissions.push(adm)
    this.db.profiles
      .filter((p) => p.role === 'school_admin' || p.role === 'super_admin')
      .forEach((p) => {
        this.pushNotification(
          p.id,
          'admission',
          'New admission application',
          `${adm.applicantName} ${adm.applicantSurname} — Grade ${adm.gradeApplyingFor}`,
          '/admin/admissions',
        )
      })
    this.commit()
    return adm
  }

  updateAdmissionStatus(id: string, status: ApplicationStatus, notes?: string, actorId?: string) {
    const adm = this.db.admissions.find((a) => a.id === id)
    if (!adm) throw new Error('Application not found')
    adm.status = status
    adm.reviewNotes = notes
    adm.updatedAt = new Date().toISOString()
    this.addAudit(actorId, 'UPDATE_ADMISSION', 'admissions', id, { status })
    this.commit()
    return adm
  }

  // ---- Timetable ----
  getTimetable(filters: { classId?: string; teacherId?: string; subjectId?: string; gradeId?: string } = {}) {
    let rows = [...this.db.timetable]
    if (filters.classId) rows = rows.filter((r) => r.classId === filters.classId)
    if (filters.teacherId) rows = rows.filter((r) => r.teacherId === filters.teacherId)
    if (filters.subjectId) rows = rows.filter((r) => r.subjectId === filters.subjectId)
    if (filters.gradeId) {
      const classIds = this.db.classes.filter((c) => c.gradeId === filters.gradeId).map((c) => c.id)
      rows = rows.filter((r) => classIds.includes(r.classId))
    }
    return rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodNumber - b.periodNumber)
  }

  upsertTimetableSlot(slot: Omit<TimetableSlot, 'id' | 'schoolId'> & { id?: string }) {
    if (slot.id) {
      const i = this.db.timetable.findIndex((t) => t.id === slot.id)
      if (i >= 0) {
        this.db.timetable[i] = { ...this.db.timetable[i], ...slot, schoolId: this.db.school.id }
        this.commit()
        return this.db.timetable[i]
      }
    }
    const row: TimetableSlot = { ...slot, id: uid('tt'), schoolId: this.db.school.id }
    this.db.timetable.push(row)
    this.commit()
    return row
  }

  deleteTimetableSlot(id: string) {
    this.db.timetable = this.db.timetable.filter((t) => t.id !== id)
    this.commit()
  }

  // ---- CRUD helpers ----
  listStudents() {
    return this.db.students
  }
  listTeachers() {
    return this.db.teachers
  }
  listParents() {
    return this.db.parents
  }
  listSubjects() {
    return this.db.subjects
  }
  listClasses() {
    return this.db.classes
  }
  listGrades() {
    return this.db.grades
  }
  listClassSubjects() {
    return this.db.classSubjects
  }
  listHomework() {
    return this.db.homework
  }
  listMaterials() {
    return this.db.materials
  }
  listAnnouncements() {
    return [...this.db.announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
  }
  listCalendar() {
    return [...this.db.calendar].sort((a, b) => a.startAt.localeCompare(b.startAt))
  }
  listAssessments() {
    return this.db.assessments
  }
  listAuditLogs() {
    return [...this.db.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  createStudent(data: {
    firstName: string
    lastName: string
    email: string
    classId: string
    gradeId: string
    studentNumber: string
  }) {
    const id = uid('user')
    const profile: Profile = {
      id,
      schoolId: this.db.school.id,
      role: 'student',
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }
    this.db.profiles.push(profile)
    this.db.passwords[data.email] = 'Password123!'
    const student: Student = {
      id: uid('stu'),
      profileId: id,
      schoolId: this.db.school.id,
      studentNumber: data.studentNumber,
      classId: data.classId,
      gradeId: data.gradeId,
      admissionDate: todayISO(),
    }
    this.db.students.push(student)
    this.commit()
    return student
  }

  createTeacher(data: { firstName: string; lastName: string; email: string; department?: string }) {
    const id = uid('user')
    this.db.profiles.push({
      id,
      schoolId: this.db.school.id,
      role: 'teacher',
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    })
    this.db.passwords[data.email] = 'Password123!'
    const t: Teacher = {
      id: uid('tch'),
      profileId: id,
      schoolId: this.db.school.id,
      employeeNumber: `T${String(this.db.teachers.length + 1).padStart(3, '0')}`,
      department: data.department,
    }
    this.db.teachers.push(t)
    this.commit()
    return t
  }

  createParent(data: { firstName: string; lastName: string; email: string; phone?: string; studentId?: string }) {
    const id = uid('user')
    this.db.profiles.push({
      id,
      schoolId: this.db.school.id,
      role: 'parent',
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    })
    this.db.passwords[data.email] = 'Password123!'
    const p: Parent = { id: uid('par'), profileId: id, schoolId: this.db.school.id }
    this.db.parents.push(p)
    if (data.studentId) {
      this.db.parentStudents.push({
        id: uid('ps'),
        parentId: p.id,
        studentId: data.studentId,
        isPrimary: true,
      })
    }
    this.commit()
    return p
  }

  createSubject(data: { code: string; name: string; description?: string }) {
    const s: Subject = { id: uid('sub'), schoolId: this.db.school.id, ...data }
    this.db.subjects.push(s)
    this.commit()
    return s
  }

  createClass(data: { name: string; gradeId: string; room?: string; classTeacherId?: string }) {
    const c: ClassRoom = { id: uid('class'), schoolId: this.db.school.id, ...data }
    this.db.classes.push(c)
    this.commit()
    return c
  }

  assignClassSubject(data: { classId: string; subjectId: string; teacherId?: string }) {
    const existing = this.db.classSubjects.find(
      (cs) => cs.classId === data.classId && cs.subjectId === data.subjectId,
    )
    if (existing) {
      existing.teacherId = data.teacherId
      this.commit()
      return existing
    }
    const cs: ClassSubject = { id: uid('cs'), ...data }
    this.db.classSubjects.push(cs)
    this.commit()
    return cs
  }

  createHomework(data: Omit<Homework, 'id' | 'createdAt' | 'schoolId'>) {
    const hw: Homework = {
      ...data,
      id: uid('hw'),
      schoolId: this.db.school.id,
      createdAt: new Date().toISOString(),
    }
    this.db.homework.push(hw)
    this.commit()
    return hw
  }

  createMaterial(data: Omit<LearningMaterial, 'id' | 'createdAt' | 'schoolId'>) {
    const m: LearningMaterial = {
      ...data,
      id: uid('lm'),
      schoolId: this.db.school.id,
      createdAt: new Date().toISOString(),
    }
    this.db.materials.push(m)
    this.commit()
    return m
  }

  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'schoolId'>) {
    const a: Announcement = {
      ...data,
      id: uid('an'),
      schoolId: this.db.school.id,
      createdAt: new Date().toISOString(),
    }
    this.db.announcements.push(a)
    this.db.profiles.forEach((p) => {
      if (data.audience.includes('all') || data.audience.includes(p.role)) {
        this.pushNotification(p.id, 'announcement', a.title, a.body.slice(0, 120), '/announcements')
      }
    })
    this.commit()
    return a
  }

  createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'schoolId'>) {
    const e: CalendarEvent = { ...data, id: uid('cal'), schoolId: this.db.school.id }
    this.db.calendar.push(e)
    this.commit()
    return e
  }

  // ---- Forum ----
  listForumPosts(search = '') {
    const q = search.toLowerCase()
    return this.db.forumPosts
      .filter((p) => !p.isHidden)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  createForumPost(authorId: string, title: string, body: string) {
    const post: ForumPost = {
      id: uid('fp'),
      schoolId: this.db.school.id,
      authorId,
      title,
      body,
      isHidden: false,
      createdAt: new Date().toISOString(),
      likes: [],
    }
    this.db.forumPosts.push(post)
    this.commit()
    return post
  }

  toggleLike(postId: string, userId: string) {
    const post = this.db.forumPosts.find((p) => p.id === postId)
    if (!post) return
    if (post.likes.includes(userId)) post.likes = post.likes.filter((id) => id !== userId)
    else post.likes.push(userId)
    this.commit()
  }

  addComment(postId: string, authorId: string, body: string) {
    const c: ForumComment = {
      id: uid('fc'),
      postId,
      authorId,
      body,
      isHidden: false,
      createdAt: new Date().toISOString(),
    }
    this.db.forumComments.push(c)
    this.commit()
    return c
  }

  getComments(postId: string) {
    return this.db.forumComments.filter((c) => c.postId === postId && !c.isHidden)
  }

  reportPost(postId: string, reportedBy: string, reason: string) {
    this.db.forumReports.push({
      id: uid('fr'),
      postId,
      reportedBy,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    this.db.profiles
      .filter((p) => p.role === 'school_admin' || p.role === 'super_admin')
      .forEach((p) =>
        this.pushNotification(p.id, 'forum', 'Forum post reported', reason, '/admin/forum-reports'),
      )
    this.commit()
  }

  // ---- Notifications ----
  getNotifications(userId: string) {
    return this.db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  markNotificationRead(id: string) {
    const n = this.db.notifications.find((x) => x.id === id)
    if (n) {
      n.isRead = true
      this.commit()
    }
  }

  markAllRead(userId: string) {
    this.db.notifications.filter((n) => n.userId === userId).forEach((n) => (n.isRead = true))
    this.commit()
  }

  pushNotification(
    userId: string,
    type: AppNotification['type'],
    title: string,
    body: string,
    link?: string,
  ) {
    this.db.notifications.unshift({
      id: uid('nt'),
      schoolId: this.db.school.id,
      userId,
      type,
      title,
      body,
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
  }

  addAudit(
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    const log: AuditLog = {
      id: uid('au'),
      schoolId: this.db.school.id,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date().toISOString(),
    }
    this.db.auditLogs.unshift(log)
  }

  // Students in a class
  studentsInClass(classId: string) {
    return this.db.students.filter((s) => s.classId === classId)
  }

  teacherClassSubjects(teacherId: string) {
    return this.db.classSubjects.filter((cs) => cs.teacherId === teacherId)
  }
}

export const api = new DemoApi()

export type { ParentStudent, Grade }
