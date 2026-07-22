import type {
  Admission,
  Announcement,
  AppNotification,
  Assessment,
  AttendanceRecord,
  AttendanceStatus,
  AuditLog,
  AiTutorMessage,
  AiTutorSession,
  CalendarEvent,
  ChatMessage,
  ClassRoom,
  ClassSubject,
  Conversation,
  FeeInvoice,
  FeePayment,
  FeeStructure,
  ForumComment,
  ForumPost,
  ForumReport,
  Grade,
  Homework,
  HomeworkSubmission,
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
  ApplicationStatus,
  UserRole,
  WhatsAppOutboxItem,
} from '@/types'
import { requireSupabase } from '@/lib/supabase'
import { todayISO } from '@/lib/utils'
import {
  buildCapsSystemPrompt,
  generateTutorReply,
  parseOpenAiSseStream,
  preferredTutorModel,
  streamTutorReply,
  type TutorChatMessage,
  type TutorMode,
} from '@/lib/caps-tutor'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase'

/** Reveal text in short chunks so UI still feels live when using the DB OpenAI proxy. */
async function revealTextProgressively(text: string, onDelta: (full: string) => void) {
  const parts = text.split(/(\s+)/)
  let full = ''
  for (let i = 0; i < parts.length; i++) {
    full += parts[i]
    if (i % 3 === 0 || i === parts.length - 1) {
      onDelta(full)
      await new Promise((r) => setTimeout(r, 12))
    }
  }
  onDelta(text)
}

type Listener = () => void

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    schoolId: String(row.school_id ?? ''),
    role: row.role as UserRole,
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    gender: row.gender as Profile['gender'],
    address: row.address ? String(row.address) : undefined,
    isActive: Boolean(row.is_active ?? true),
    emailVerified: Boolean(row.email_verified ?? false),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

class LiveApi {
  private listeners = new Set<Listener>()
  private ready = false
  school: School = { id: '', name: 'Horizon High School' }
  profiles: Profile[] = []
  grades: Grade[] = []
  classes: ClassRoom[] = []
  subjects: Subject[] = []
  classSubjects: ClassSubject[] = []
  teachers: Teacher[] = []
  students: Student[] = []
  parents: Parent[] = []
  parentStudents: ParentStudent[] = []
  admissions: Admission[] = []
  attendance: AttendanceRecord[] = []
  assessments: Assessment[] = []
  marks: Mark[] = []
  homework: Homework[] = []
  materials: LearningMaterial[] = []
  timetable: TimetableSlot[] = []
  calendar: CalendarEvent[] = []
  announcements: Announcement[] = []
  notifications: AppNotification[] = []
  forumPosts: ForumPost[] = []
  forumComments: ForumComment[] = []
  forumReports: ForumReport[] = []
  auditLogs: AuditLog[] = []
  homeworkSubmissions: HomeworkSubmission[] = []
  feeStructures: FeeStructure[] = []
  feeInvoices: FeeInvoice[] = []
  feePayments: FeePayment[] = []
  conversations: Conversation[] = []
  messages: ChatMessage[] = []
  aiSessions: AiTutorSession[] = []
  aiMessages: AiTutorMessage[] = []
  whatsappOutbox: WhatsAppOutboxItem[] = []

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  private emit() {
    this.listeners.forEach((fn) => fn())
  }

  getDb() {
    return {
      school: this.school,
      profiles: this.profiles,
      grades: this.grades,
      classes: this.classes,
      subjects: this.subjects,
      classSubjects: this.classSubjects,
      teachers: this.teachers,
      students: this.students,
      parents: this.parents,
      parentStudents: this.parentStudents,
      admissions: this.admissions,
      attendance: this.attendance,
      assessments: this.assessments,
      marks: this.marks,
      homework: this.homework,
      materials: this.materials,
      timetable: this.timetable,
      calendar: this.calendar,
      announcements: this.announcements,
      notifications: this.notifications,
      forumPosts: this.forumPosts,
      forumComments: this.forumComments,
      forumReports: this.forumReports,
      auditLogs: this.auditLogs,
      passwords: {} as Record<string, string>,
      feeStructures: this.feeStructures,
      feeInvoices: this.feeInvoices,
      feePayments: this.feePayments,
      conversations: this.conversations,
      messages: this.messages,
      aiSessions: this.aiSessions,
      aiMessages: this.aiMessages,
      whatsappOutbox: this.whatsappOutbox,
    }
  }

  async refresh() {
    const sb = requireSupabase()
    const [
      schools,
      profiles,
      grades,
      classes,
      subjects,
      classSubjects,
      teachers,
      students,
      parents,
      parentStudents,
      admissions,
      attendance,
      assessments,
      marks,
      homework,
      materials,
      timetable,
      calendar,
      announcements,
      notifications,
      forumPosts,
      forumComments,
      forumLikes,
      forumReports,
      auditLogs,
      homeworkSubmissions,
      feeStructures,
      feeInvoices,
      feePayments,
      conversations,
      conversationParticipants,
      messages,
      aiSessions,
      aiMessages,
      whatsappOutbox,
    ] = await Promise.all([
      sb.from('schools').select(
        'id,name,emis_number,address,phone,email,logo_url,whatsapp_enabled,whatsapp_provider,whatsapp_from,whatsapp_account_sid,whatsapp_auth_token,whatsapp_notify_attendance,whatsapp_notify_announcements,whatsapp_notify_fees,ai_tutor_enabled,ai_tutor_model',
      ),
      sb.from('profiles').select('*'),
      sb.from('grades').select('*'),
      sb.from('classes').select('*'),
      sb.from('subjects').select('*'),
      sb.from('class_subjects').select('*'),
      sb.from('teachers').select('*'),
      sb.from('students').select('*'),
      sb.from('parents').select('*'),
      sb.from('parent_students').select('*'),
      sb.from('admissions').select('*').order('created_at', { ascending: false }),
      sb.from('attendance').select('*').order('date', { ascending: false }),
      sb.from('assessments').select('*'),
      sb.from('marks').select('*'),
      sb.from('homework').select('*'),
      sb.from('learning_materials').select('*'),
      sb.from('timetable_slots').select('*'),
      sb.from('calendar_events').select('*').order('start_at'),
      sb.from('announcements').select('*').order('created_at', { ascending: false }),
      sb.from('notifications').select('*').order('created_at', { ascending: false }),
      sb.from('forum_posts').select('*').order('created_at', { ascending: false }),
      sb.from('forum_comments').select('*'),
      sb.from('forum_likes').select('*'),
      sb.from('forum_reports').select('*'),
      sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
      sb.from('homework_submissions').select('*'),
      sb.from('fee_structures').select('*').order('created_at', { ascending: false }),
      sb.from('fee_invoices').select('*').order('issued_at', { ascending: false }),
      sb.from('fee_payments').select('*').order('received_at', { ascending: false }),
      sb.from('conversations').select('*').order('updated_at', { ascending: false }),
      sb.from('conversation_participants').select('*'),
      sb.from('messages').select('*').order('created_at', { ascending: true }).limit(2000),
      sb.from('ai_tutor_sessions').select('*').order('updated_at', { ascending: false }),
      sb.from('ai_tutor_messages').select('*').order('created_at', { ascending: true }).limit(2000),
      sb.from('whatsapp_outbox').select('*').order('created_at', { ascending: false }).limit(200),
    ])

    const err = [
      schools, profiles, grades, classes, subjects, classSubjects, teachers, students, parents,
      parentStudents, admissions, attendance, assessments, marks, homework, materials, timetable,
      calendar, announcements, notifications, forumPosts, forumComments, forumLikes, forumReports, auditLogs,
      homeworkSubmissions, feeStructures, feeInvoices, feePayments, conversations, conversationParticipants,
      messages, aiSessions, aiMessages, whatsappOutbox,
    ].find((r) => r.error)
    if (err?.error) throw err.error

    const schoolRow = schools.data?.[0]
    this.school = schoolRow
      ? {
          id: schoolRow.id,
          name: schoolRow.name,
          emisNumber: schoolRow.emis_number ?? undefined,
          address: schoolRow.address ?? undefined,
          phone: schoolRow.phone ?? undefined,
          email: schoolRow.email ?? undefined,
          logoUrl: schoolRow.logo_url ?? undefined,
          whatsappEnabled: Boolean(schoolRow.whatsapp_enabled),
          whatsappProvider: schoolRow.whatsapp_provider ?? undefined,
          whatsappFrom: schoolRow.whatsapp_from ?? undefined,
          whatsappAccountSid: schoolRow.whatsapp_account_sid ?? undefined,
          whatsappAuthToken: schoolRow.whatsapp_auth_token ?? undefined,
          whatsappNotifyAttendance: schoolRow.whatsapp_notify_attendance ?? true,
          whatsappNotifyAnnouncements: schoolRow.whatsapp_notify_announcements ?? true,
          whatsappNotifyFees: schoolRow.whatsapp_notify_fees ?? true,
          aiTutorEnabled: schoolRow.ai_tutor_enabled ?? true,
          aiTutorModel: schoolRow.ai_tutor_model ?? 'gpt-5.5',
          // Never expose openai_api_key to the client cache
        }
      : this.school

    this.profiles = (profiles.data ?? []).map((r) => mapProfile(r))
    this.grades = (grades.data ?? []).map((g) => ({
      id: g.id,
      schoolId: g.school_id,
      gradeNumber: g.grade_number,
      name: g.name,
    }))
    this.classes = (classes.data ?? []).map((c) => ({
      id: c.id,
      schoolId: c.school_id,
      gradeId: c.grade_id,
      name: c.name,
      room: c.room ?? undefined,
      classTeacherId: c.class_teacher_id ?? undefined,
    }))
    this.subjects = (subjects.data ?? []).map((s) => ({
      id: s.id,
      schoolId: s.school_id,
      code: s.code,
      name: s.name,
      description: s.description ?? undefined,
      capsCode: s.caps_code ?? undefined,
      phase: s.phase ?? undefined,
      capsWeightingSba: s.caps_weighting_sba != null ? Number(s.caps_weighting_sba) : 25,
      capsWeightingExam: s.caps_weighting_exam != null ? Number(s.caps_weighting_exam) : 75,
    }))
    this.classSubjects = (classSubjects.data ?? []).map((cs) => ({
      id: cs.id,
      classId: cs.class_id,
      subjectId: cs.subject_id,
      teacherId: cs.teacher_id ?? undefined,
    }))
    this.teachers = (teachers.data ?? []).map((t) => ({
      id: t.id,
      profileId: t.profile_id,
      schoolId: t.school_id,
      employeeNumber: t.employee_number ?? undefined,
      department: t.department ?? undefined,
    }))
    this.students = (students.data ?? []).map((s) => ({
      id: s.id,
      profileId: s.profile_id,
      schoolId: s.school_id,
      studentNumber: s.student_number,
      classId: s.class_id ?? undefined,
      gradeId: s.grade_id ?? undefined,
      admissionDate: s.admission_date ?? undefined,
      emergencyContactName: s.emergency_contact_name ?? undefined,
      emergencyContactPhone: s.emergency_contact_phone ?? undefined,
      house: s.house ?? undefined,
      admissionNumber: s.admission_number ?? s.student_number ?? undefined,
    }))
    this.parents = (parents.data ?? []).map((p) => ({
      id: p.id,
      profileId: p.profile_id,
      schoolId: p.school_id,
      relationship: p.relationship ?? undefined,
    }))
    this.parentStudents = (parentStudents.data ?? []).map((ps) => ({
      id: ps.id,
      parentId: ps.parent_id,
      studentId: ps.student_id,
      isPrimary: Boolean(ps.is_primary),
    }))
    this.admissions = (admissions.data ?? []).map((a) => ({
      id: a.id,
      schoolId: a.school_id,
      applicantName: a.applicant_name,
      applicantSurname: a.applicant_surname,
      idNumber: a.id_number,
      gender: a.gender ?? undefined,
      dateOfBirth: a.date_of_birth,
      gradeApplyingFor: a.grade_applying_for,
      currentSchool: a.current_school ?? undefined,
      previousGrade: a.previous_grade ?? undefined,
      parentName: a.parent_name,
      parentPhone: a.parent_phone,
      parentEmail: a.parent_email,
      physicalAddress: a.physical_address,
      emergencyContact: a.emergency_contact ?? undefined,
      birthCertificateUrl: a.birth_certificate_url ?? undefined,
      parentIdUrl: a.parent_id_url ?? undefined,
      latestReportUrl: a.latest_report_url ?? undefined,
      proofOfResidenceUrl: a.proof_of_residence_url ?? undefined,
      status: a.status,
      reviewNotes: a.review_notes ?? undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }))
    this.attendance = (attendance.data ?? []).map((a) => ({
      id: a.id,
      schoolId: a.school_id,
      studentId: a.student_id,
      classId: a.class_id,
      date: a.date,
      status: a.status,
      notes: a.notes ?? undefined,
      recordedBy: a.recorded_by ?? undefined,
      recordedAt: a.recorded_at,
    }))
    this.assessments = (assessments.data ?? []).map((a) => ({
      id: a.id,
      schoolId: a.school_id,
      classSubjectId: a.class_subject_id,
      title: a.title,
      type: a.type,
      maxScore: Number(a.max_score),
      weight: a.weight != null ? Number(a.weight) : undefined,
      dueDate: a.due_date ?? undefined,
      description: a.description ?? undefined,
      createdBy: a.created_by ?? undefined,
      createdAt: a.created_at,
    }))
    this.marks = (marks.data ?? []).map((m) => ({
      id: m.id,
      assessmentId: m.assessment_id,
      studentId: m.student_id,
      score: Number(m.score),
      percentage: Number(m.percentage),
      comment: m.comment ?? undefined,
      capturedBy: m.captured_by ?? undefined,
      capturedAt: m.captured_at,
    }))
    this.homework = (homework.data ?? []).map((h) => ({
      id: h.id,
      schoolId: h.school_id,
      classSubjectId: h.class_subject_id,
      title: h.title,
      description: h.description ?? undefined,
      dueDate: h.due_date,
      attachmentUrl: h.attachment_url ?? undefined,
      createdBy: h.created_by ?? undefined,
      createdAt: h.created_at,
    }))
    this.materials = (materials.data ?? []).map((m) => ({
      id: m.id,
      schoolId: m.school_id,
      classSubjectId: m.class_subject_id,
      title: m.title,
      description: m.description ?? undefined,
      fileUrl: m.file_url,
      fileType: m.file_type ?? undefined,
      uploadedBy: m.uploaded_by ?? undefined,
      createdAt: m.created_at,
    }))
    this.timetable = (timetable.data ?? []).map((t) => ({
      id: t.id,
      schoolId: t.school_id,
      classId: t.class_id,
      subjectId: t.subject_id,
      teacherId: t.teacher_id ?? undefined,
      dayOfWeek: t.day_of_week,
      periodNumber: t.period_number,
      startTime: String(t.start_time).slice(0, 5),
      endTime: String(t.end_time).slice(0, 5),
      room: t.room ?? undefined,
    }))
    this.calendar = (calendar.data ?? []).map((e) => ({
      id: e.id,
      schoolId: e.school_id,
      title: e.title,
      description: e.description ?? undefined,
      startAt: e.start_at,
      endAt: e.end_at ?? undefined,
      allDay: Boolean(e.all_day),
      audience: e.audience ?? ['all'],
      createdBy: e.created_by ?? undefined,
    }))
    this.announcements = (announcements.data ?? []).map((a) => ({
      id: a.id,
      schoolId: a.school_id,
      title: a.title,
      body: a.body,
      audience: a.audience ?? ['all'],
      pinned: Boolean(a.pinned),
      createdBy: a.created_by ?? undefined,
      createdAt: a.created_at,
    }))
    this.notifications = (notifications.data ?? []).map((n) => ({
      id: n.id,
      schoolId: n.school_id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link ?? undefined,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    }))

    const likesByPost = new Map<string, string[]>()
    for (const like of forumLikes.data ?? []) {
      const arr = likesByPost.get(like.post_id) ?? []
      arr.push(like.user_id)
      likesByPost.set(like.post_id, arr)
    }
    this.forumPosts = (forumPosts.data ?? []).map((p) => ({
      id: p.id,
      schoolId: p.school_id,
      authorId: p.author_id,
      title: p.title,
      body: p.body,
      isHidden: Boolean(p.is_hidden),
      createdAt: p.created_at,
      likes: likesByPost.get(p.id) ?? [],
    }))
    this.forumComments = (forumComments.data ?? []).map((c) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      body: c.body,
      isHidden: Boolean(c.is_hidden),
      createdAt: c.created_at,
    }))
    this.forumReports = (forumReports.data ?? []).map((r) => ({
      id: r.id,
      postId: r.post_id ?? undefined,
      commentId: r.comment_id ?? undefined,
      reportedBy: r.reported_by,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    }))
    this.auditLogs = (auditLogs.data ?? []).map((l) => ({
      id: l.id,
      schoolId: l.school_id ?? undefined,
      actorId: l.actor_id ?? undefined,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id ?? undefined,
      metadata: (l.metadata as Record<string, unknown>) ?? undefined,
      createdAt: l.created_at,
    }))
    this.homeworkSubmissions = (homeworkSubmissions.data ?? []).map((s) => ({
      id: s.id,
      homeworkId: s.homework_id,
      studentId: s.student_id,
      fileUrl: s.file_url ?? undefined,
      fileName: s.file_name ?? undefined,
      notes: s.notes ?? undefined,
      status: s.status,
      submittedAt: s.submitted_at,
    }))

    const participantsByConv = new Map<string, string[]>()
    for (const p of conversationParticipants.data ?? []) {
      const arr = participantsByConv.get(p.conversation_id) ?? []
      arr.push(p.user_id)
      participantsByConv.set(p.conversation_id, arr)
    }
    this.conversations = (conversations.data ?? []).map((c) => ({
      id: c.id,
      schoolId: c.school_id,
      subject: c.subject ?? undefined,
      createdBy: c.created_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      participantIds: participantsByConv.get(c.id) ?? [],
    }))
    this.messages = (messages.data ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      body: m.body,
      createdAt: m.created_at,
      isDeleted: Boolean(m.is_deleted),
    }))
    this.feeStructures = (feeStructures.data ?? []).map((f) => ({
      id: f.id,
      schoolId: f.school_id,
      name: f.name,
      description: f.description ?? undefined,
      amountCents: f.amount_cents,
      gradeId: f.grade_id ?? undefined,
      academicYear: f.academic_year,
      dueDate: f.due_date ?? undefined,
      isActive: Boolean(f.is_active),
      createdAt: f.created_at,
    }))
    this.feeInvoices = (feeInvoices.data ?? []).map((i) => ({
      id: i.id,
      schoolId: i.school_id,
      studentId: i.student_id,
      feeStructureId: i.fee_structure_id ?? undefined,
      invoiceNumber: i.invoice_number,
      description: i.description,
      amountCents: i.amount_cents,
      amountPaidCents: i.amount_paid_cents,
      status: i.status,
      dueDate: i.due_date ?? undefined,
      issuedAt: i.issued_at,
    }))
    this.feePayments = (feePayments.data ?? []).map((p) => ({
      id: p.id,
      schoolId: p.school_id,
      invoiceId: p.invoice_id,
      amountCents: p.amount_cents,
      method: p.method,
      reference: p.reference ?? undefined,
      receivedAt: p.received_at,
      recordedBy: p.recorded_by ?? undefined,
      notes: p.notes ?? undefined,
    }))
    this.aiSessions = (aiSessions.data ?? []).map((s) => ({
      id: s.id,
      schoolId: s.school_id,
      studentId: s.student_id,
      subjectId: s.subject_id ?? undefined,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      gradeLevel: s.grade_level ?? undefined,
      languageCode: s.language_code ?? undefined,
      mode: s.mode ?? undefined,
    }))
    this.aiMessages = (aiMessages.data ?? []).map((m) => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
      attachmentUrl: m.attachment_url ?? undefined,
      attachmentType: m.attachment_type ?? undefined,
      provider: m.provider ?? undefined,
    }))
    this.whatsappOutbox = (whatsappOutbox.data ?? []).map((w) => ({
      id: w.id,
      schoolId: w.school_id,
      toPhone: w.to_phone,
      body: w.body,
      relatedType: w.related_type ?? undefined,
      relatedId: w.related_id ?? undefined,
      status: w.status,
      providerMessageId: w.provider_message_id ?? undefined,
      error: w.error ?? undefined,
      createdAt: w.created_at,
      sentAt: w.sent_at ?? undefined,
    }))

    this.ready = true
    this.emit()
  }

  // ---- Lookups (same surface as demo api) ----
  findProfileByEmail(email: string) {
    return this.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())
  }
  getProfile(id: string) {
    return this.profiles.find((p) => p.id === id)
  }
  getStudentByProfile(profileId: string) {
    return this.students.find((s) => s.profileId === profileId)
  }
  getParentByProfile(profileId: string) {
    return this.parents.find((p) => p.profileId === profileId)
  }
  getLinkedStudents(parentProfileId: string): Student[] {
    const parent = this.getParentByProfile(parentProfileId)
    if (!parent) return []
    const ids = this.parentStudents.filter((ps) => ps.parentId === parent.id).map((ps) => ps.studentId)
    return this.students.filter((s) => ids.includes(s.id))
  }
  getSubject(id: string) {
    return this.subjects.find((s) => s.id === id)
  }
  getClass(id: string) {
    return this.classes.find((c) => c.id === id)
  }
  getGrade(id: string) {
    return this.grades.find((g) => g.id === id)
  }
  getClassSubject(id: string) {
    return this.classSubjects.find((cs) => cs.id === id)
  }

  getMarksForUser(profile: Profile) {
    let allowedStudentIds: string[] = []
    if (profile.role === 'super_admin' || profile.role === 'school_admin') {
      allowedStudentIds = this.students.map((s) => s.id)
    } else if (profile.role === 'student') {
      const stu = this.getStudentByProfile(profile.id)
      allowedStudentIds = stu ? [stu.id] : []
    } else if (profile.role === 'parent') {
      allowedStudentIds = this.getLinkedStudents(profile.id).map((s) => s.id)
    } else if (profile.role === 'teacher') {
      const myCs = this.classSubjects.filter((cs) => cs.teacherId === profile.id).map((cs) => cs.id)
      const myAssessments = this.assessments.filter((a) => myCs.includes(a.classSubjectId)).map((a) => a.id)
      return this.marks
        .filter((m) => myAssessments.includes(m.assessmentId))
        .map((m) => this.enrichMark(m))
        .filter(Boolean) as Array<Mark & { assessment: Assessment; subjectName: string }>
    }
    return this.marks
      .filter((m) => allowedStudentIds.includes(m.studentId))
      .map((m) => this.enrichMark(m))
      .filter(Boolean) as Array<Mark & { assessment: Assessment; subjectName: string }>
  }

  private enrichMark(m: Mark) {
    const assessment = this.assessments.find((a) => a.id === m.assessmentId)
    if (!assessment) return null
    const cs = this.getClassSubject(assessment.classSubjectId)
    const subject = cs ? this.getSubject(cs.subjectId) : undefined
    return { ...m, assessment, subjectName: subject?.name ?? 'Subject' }
  }

  canTeacherEditAssessment(teacherId: string, assessmentId: string) {
    const a = this.assessments.find((x) => x.id === assessmentId)
    if (!a) return false
    const cs = this.getClassSubject(a.classSubjectId)
    return cs?.teacherId === teacherId
  }

  async upsertMark(input: {
    assessmentId: string
    studentId: string
    score: number
    comment?: string
    capturedBy: string
  }) {
    const sb = requireSupabase()
    const assessment = this.assessments.find((a) => a.id === input.assessmentId)
    if (!assessment) throw new Error('Assessment not found')
    const percentage = Math.round((input.score / assessment.maxScore) * 10000) / 100
    const { error } = await sb.from('marks').upsert(
      {
        assessment_id: input.assessmentId,
        student_id: input.studentId,
        score: input.score,
        percentage,
        comment: input.comment,
        captured_by: input.capturedBy,
        captured_at: new Date().toISOString(),
      },
      { onConflict: 'assessment_id,student_id' },
    )
    if (error) throw error
    await this.addAudit(input.capturedBy, 'UPSERT_MARK', 'marks', input.assessmentId)
    await this.refresh()
  }

  async createAssessment(data: Omit<Assessment, 'id' | 'createdAt'>) {
    const sb = requireSupabase()
    const { data: row, error } = await sb
      .from('assessments')
      .insert({
        school_id: data.schoolId || this.school.id,
        class_subject_id: data.classSubjectId,
        title: data.title,
        type: data.type,
        max_score: data.maxScore,
        weight: data.weight,
        due_date: data.dueDate,
        description: data.description,
        created_by: data.createdBy,
      })
      .select('*')
      .single()
    if (error) throw error
    await this.refresh()
    return {
      id: row.id,
      schoolId: row.school_id,
      classSubjectId: row.class_subject_id,
      title: row.title,
      type: row.type,
      maxScore: Number(row.max_score),
      createdBy: row.created_by,
      createdAt: row.created_at,
    } as Assessment
  }

  getAttendanceForUser(profile: Profile) {
    if (profile.role === 'super_admin' || profile.role === 'school_admin') return this.attendance
    if (profile.role === 'student') {
      const stu = this.getStudentByProfile(profile.id)
      return this.attendance.filter((a) => a.studentId === stu?.id)
    }
    if (profile.role === 'parent') {
      const ids = this.getLinkedStudents(profile.id).map((s) => s.id)
      return this.attendance.filter((a) => ids.includes(a.studentId))
    }
    if (profile.role === 'teacher') {
      const classIds = this.classSubjects.filter((cs) => cs.teacherId === profile.id).map((cs) => cs.classId)
      return this.attendance.filter((a) => classIds.includes(a.classId))
    }
    return []
  }

  async recordAttendance(input: {
    studentId: string
    classId: string
    status: AttendanceStatus
    notes?: string
    recordedBy: string
    date?: string
  }) {
    const sb = requireSupabase()
    const date = input.date ?? todayISO()
    const { error } = await sb.from('attendance').upsert(
      {
        school_id: this.school.id,
        student_id: input.studentId,
        class_id: input.classId,
        date,
        status: input.status,
        notes: input.notes,
        recorded_by: input.recordedBy,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,date,class_id' },
    )
    if (error) throw error
    await this.addAudit(input.recordedBy, 'RECORD_ATTENDANCE', 'attendance')
    await this.refresh()
  }

  listAdmissions() {
    return [...this.admissions]
  }

  async createAdmission(
    data: Omit<Admission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'schoolId'> & {
      status?: ApplicationStatus
    },
  ) {
    const sb = requireSupabase()
    const { data: row, error } = await sb
      .from('admissions')
      .insert({
        school_id: this.school.id,
        applicant_name: data.applicantName,
        applicant_surname: data.applicantSurname,
        id_number: data.idNumber,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        grade_applying_for: data.gradeApplyingFor,
        current_school: data.currentSchool,
        previous_grade: data.previousGrade,
        parent_name: data.parentName,
        parent_phone: data.parentPhone,
        parent_email: data.parentEmail,
        physical_address: data.physicalAddress,
        emergency_contact: data.emergencyContact,
        birth_certificate_url: data.birthCertificateUrl,
        parent_id_url: data.parentIdUrl,
        latest_report_url: data.latestReportUrl,
        proof_of_residence_url: data.proofOfResidenceUrl,
        status: data.status ?? 'pending',
      })
      .select('*')
      .single()
    if (error) throw error
    await this.refresh()
    return this.admissions.find((a) => a.id === row.id)!
  }

  async updateAdmissionStatus(id: string, status: ApplicationStatus, notes?: string, actorId?: string) {
    const sb = requireSupabase()
    const { error } = await sb
      .from('admissions')
      .update({ status, review_notes: notes, updated_at: new Date().toISOString(), reviewed_by: actorId })
      .eq('id', id)
    if (error) throw error
    await this.addAudit(actorId, 'UPDATE_ADMISSION', 'admissions', id, { status })
    await this.refresh()
  }

  getTimetable(filters: { classId?: string; teacherId?: string; subjectId?: string; gradeId?: string } = {}) {
    let rows = [...this.timetable]
    if (filters.classId) rows = rows.filter((r) => r.classId === filters.classId)
    if (filters.teacherId) rows = rows.filter((r) => r.teacherId === filters.teacherId)
    if (filters.subjectId) rows = rows.filter((r) => r.subjectId === filters.subjectId)
    if (filters.gradeId) {
      const classIds = this.classes.filter((c) => c.gradeId === filters.gradeId).map((c) => c.id)
      rows = rows.filter((r) => classIds.includes(r.classId))
    }
    return rows.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.periodNumber - b.periodNumber)
  }

  listStudents() {
    return this.students
  }
  listTeachers() {
    return this.teachers
  }
  listParents() {
    return this.parents
  }
  listSubjects() {
    return this.subjects
  }
  listClasses() {
    return this.classes
  }
  listGrades() {
    return this.grades
  }
  listClassSubjects() {
    return this.classSubjects
  }
  listHomework() {
    return this.homework
  }
  listMaterials() {
    return this.materials
  }
  listAnnouncements() {
    return [...this.announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
  }
  listCalendar() {
    return [...this.calendar]
  }
  listAssessments() {
    return this.assessments
  }
  listAuditLogs() {
    return [...this.auditLogs]
  }

  async createStudent(data: {
    firstName: string
    lastName: string
    email: string
    classId: string
    gradeId: string
    studentNumber: string
  }) {
    const sb = requireSupabase()
    const password = 'Password123!'
    const { data: created, error: authErr } = await sb.auth.signUp({
      email: data.email,
      password,
      options: {
        data: { role: 'student', first_name: data.firstName, last_name: data.lastName, school_id: this.school.id },
      },
    })
    // Prefer admin create via service is not available in browser — use edge case
    if (authErr || !created.user) {
      // Fallback: call refresh and try insert profile if user exists from seed flows
      throw new Error(authErr?.message || 'Could not create student user (admin seed required for production invites)')
    }
    await sb.from('profiles').upsert({
      id: created.user.id,
      school_id: this.school.id,
      role: 'student',
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      is_active: true,
      email_verified: false,
    })
    const { data: student, error } = await sb
      .from('students')
      .insert({
        profile_id: created.user.id,
        school_id: this.school.id,
        student_number: data.studentNumber,
        class_id: data.classId,
        grade_id: data.gradeId,
        admission_date: todayISO(),
      })
      .select('*')
      .single()
    if (error) throw error
    await this.refresh()
    return {
      id: student.id,
      profileId: student.profile_id,
      schoolId: student.school_id,
      studentNumber: student.student_number,
      classId: student.class_id,
      gradeId: student.grade_id,
    } as Student
  }

  async createTeacher(data: { firstName: string; lastName: string; email: string; department?: string }) {
    const sb = requireSupabase()
    const { data: created, error: authErr } = await sb.auth.signUp({
      email: data.email,
      password: 'Password123!',
      options: {
        data: { role: 'teacher', first_name: data.firstName, last_name: data.lastName, school_id: this.school.id },
      },
    })
    if (authErr || !created.user) throw new Error(authErr?.message || 'Create teacher failed')
    await sb.from('profiles').upsert({
      id: created.user.id,
      school_id: this.school.id,
      role: 'teacher',
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      is_active: true,
      email_verified: true,
    })
    const { data: t, error } = await sb
      .from('teachers')
      .insert({
        profile_id: created.user.id,
        school_id: this.school.id,
        employee_number: `T${String(this.teachers.length + 1).padStart(3, '0')}`,
        department: data.department,
      })
      .select('*')
      .single()
    if (error) throw error
    await this.refresh()
    return { id: t.id, profileId: t.profile_id, schoolId: t.school_id } as Teacher
  }

  async createParent(data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    studentId?: string
  }) {
    const sb = requireSupabase()
    const { data: created, error: authErr } = await sb.auth.signUp({
      email: data.email,
      password: 'Password123!',
      options: {
        data: { role: 'parent', first_name: data.firstName, last_name: data.lastName, school_id: this.school.id },
      },
    })
    if (authErr || !created.user) throw new Error(authErr?.message || 'Create parent failed')
    await sb.from('profiles').upsert({
      id: created.user.id,
      school_id: this.school.id,
      role: 'parent',
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      is_active: true,
      email_verified: true,
    })
    const { data: p, error } = await sb
      .from('parents')
      .insert({ profile_id: created.user.id, school_id: this.school.id })
      .select('*')
      .single()
    if (error) throw error
    if (data.studentId) {
      await sb.from('parent_students').upsert({
        parent_id: p.id,
        student_id: data.studentId,
        is_primary: true,
      })
    }
    await this.refresh()
    return { id: p.id, profileId: p.profile_id, schoolId: p.school_id } as Parent
  }

  async createSubject(data: { code: string; name: string; description?: string }) {
    const sb = requireSupabase()
    const { error } = await sb.from('subjects').insert({
      school_id: this.school.id,
      code: data.code,
      name: data.name,
      description: data.description,
    })
    if (error) throw error
    await this.refresh()
  }

  async createClass(data: { name: string; gradeId: string; room?: string; classTeacherId?: string }) {
    const sb = requireSupabase()
    const { error } = await sb.from('classes').insert({
      school_id: this.school.id,
      grade_id: data.gradeId,
      name: data.name,
      room: data.room,
      class_teacher_id: data.classTeacherId,
    })
    if (error) throw error
    await this.refresh()
  }

  async assignClassSubject(data: { classId: string; subjectId: string; teacherId?: string }) {
    const sb = requireSupabase()
    const { error } = await sb.from('class_subjects').upsert(
      {
        class_id: data.classId,
        subject_id: data.subjectId,
        teacher_id: data.teacherId,
      },
      { onConflict: 'class_id,subject_id' },
    )
    if (error) throw error
    await this.refresh()
  }

  async createHomework(data: Omit<Homework, 'id' | 'createdAt' | 'schoolId'>) {
    const sb = requireSupabase()
    const { error } = await sb.from('homework').insert({
      school_id: this.school.id,
      class_subject_id: data.classSubjectId,
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
      attachment_url: data.attachmentUrl,
      created_by: data.createdBy,
    })
    if (error) throw error
    await this.refresh()
  }

  async createMaterial(data: Omit<LearningMaterial, 'id' | 'createdAt' | 'schoolId'>) {
    const sb = requireSupabase()
    const { error } = await sb.from('learning_materials').insert({
      school_id: this.school.id,
      class_subject_id: data.classSubjectId,
      title: data.title,
      description: data.description,
      file_url: data.fileUrl,
      file_type: data.fileType,
      uploaded_by: data.uploadedBy,
    })
    if (error) throw error
    await this.refresh()
  }

  async createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt' | 'schoolId'>) {
    const sb = requireSupabase()
    const { error } = await sb.from('announcements').insert({
      school_id: this.school.id,
      title: data.title,
      body: data.body,
      audience: data.audience,
      pinned: data.pinned,
      created_by: data.createdBy,
    })
    if (error) throw error
    await this.refresh()
  }

  async createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'schoolId'>) {
    const sb = requireSupabase()
    const { error } = await sb.from('calendar_events').insert({
      school_id: this.school.id,
      title: data.title,
      description: data.description,
      start_at: data.startAt,
      end_at: data.endAt,
      all_day: data.allDay,
      audience: data.audience,
      created_by: data.createdBy,
    })
    if (error) throw error
    await this.refresh()
  }

  listForumPosts(search = '') {
    const q = search.toLowerCase()
    return this.forumPosts
      .filter((p) => !p.isHidden)
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
  }

  async createForumPost(authorId: string, title: string, body: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('forum_posts').insert({
      school_id: this.school.id,
      author_id: authorId,
      title,
      body,
    })
    if (error) throw error
    await this.refresh()
  }

  async toggleLike(postId: string, userId: string) {
    const sb = requireSupabase()
    const post = this.forumPosts.find((p) => p.id === postId)
    if (!post) return
    if (post.likes.includes(userId)) {
      await sb.from('forum_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await sb.from('forum_likes').insert({ post_id: postId, user_id: userId })
    }
    await this.refresh()
  }

  async addComment(postId: string, authorId: string, body: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('forum_comments').insert({ post_id: postId, author_id: authorId, body })
    if (error) throw error
    await this.refresh()
  }

  getComments(postId: string) {
    return this.forumComments.filter((c) => c.postId === postId && !c.isHidden)
  }

  async reportPost(postId: string, reportedBy: string, reason: string) {
    const sb = requireSupabase()
    await sb.from('forum_reports').insert({ post_id: postId, reported_by: reportedBy, reason })
    await this.refresh()
  }

  getNotifications(userId: string) {
    return this.notifications.filter((n) => n.userId === userId)
  }

  async markNotificationRead(id: string) {
    const sb = requireSupabase()
    await sb.from('notifications').update({ is_read: true }).eq('id', id)
    await this.refresh()
  }

  async markAllRead(userId: string) {
    const sb = requireSupabase()
    await sb.from('notifications').update({ is_read: true }).eq('user_id', userId)
    await this.refresh()
  }

  async deleteNotification(id: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('notifications').delete().eq('id', id)
    if (error) throw error
    await this.refresh()
  }

  getHomeworkSubmission(homeworkId: string, studentId: string) {
    return this.homeworkSubmissions.find((s) => s.homeworkId === homeworkId && s.studentId === studentId)
  }

  async submitHomework(input: {
    homeworkId: string
    studentId: string
    file?: File
    notes?: string
    userId: string
  }) {
    const sb = requireSupabase()
    const homework = this.homework.find((h) => h.id === input.homeworkId)
    let fileUrl: string | undefined
    let fileName: string | undefined
    if (input.file) {
      fileName = input.file.name
      const path = `${input.userId}/${input.homeworkId}/${Date.now()}-${input.file.name}`
      const { error: upErr } = await sb.storage.from('homework-submissions').upload(path, input.file, {
        upsert: true,
      })
      if (upErr) throw upErr
      const { data } = sb.storage.from('homework-submissions').getPublicUrl(path)
      fileUrl = data.publicUrl || path
    }
    const late = homework ? homework.dueDate < todayISO() : false
    const { error } = await sb.from('homework_submissions').upsert(
      {
        homework_id: input.homeworkId,
        student_id: input.studentId,
        file_url: fileUrl,
        file_name: fileName,
        notes: input.notes,
        status: late ? 'late' : 'submitted',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'homework_id,student_id' },
    )
    if (error) throw error
    await this.refresh()
  }

  async uploadAvatar(userId: string, file: File) {
    const sb = requireSupabase()
    const path = `${userId}/avatar-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data } = sb.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = data.publicUrl
    const { error } = await sb.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
    if (error) throw error
    await this.refresh()
    return avatarUrl
  }

  getParentsForStudent(studentId: string) {
    const links = this.parentStudents.filter((ps) => ps.studentId === studentId)
    return links
      .map((ps) => {
        const parent = this.parents.find((p) => p.id === ps.parentId)
        const profile = parent ? this.getProfile(parent.profileId) : undefined
        return profile ? { ...profile, relationship: parent?.relationship, isPrimary: ps.isPrimary } : null
      })
      .filter(Boolean) as Array<Profile & { relationship?: string; isPrimary: boolean }>
  }

  async updateStudentSelf(
    studentId: string,
    patch: { emergencyContactName?: string; emergencyContactPhone?: string },
  ) {
    const sb = requireSupabase()
    const payload: Record<string, string | undefined> = {}
    if (patch.emergencyContactName !== undefined) payload.emergency_contact_name = patch.emergencyContactName
    if (patch.emergencyContactPhone !== undefined) payload.emergency_contact_phone = patch.emergencyContactPhone
    const { error } = await sb.from('students').update(payload).eq('id', studentId)
    if (error) throw error
    await this.refresh()
  }

  /** Live notification channel for the signed-in user (Student Portal v1.1). */
  subscribeNotifications(userId: string, onChange?: () => void) {
    const sb = requireSupabase()
    const channel = sb
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          void this.refresh().then(() => onChange?.())
        },
      )
      .subscribe()
    return () => {
      void sb.removeChannel(channel)
    }
  }

  async addAudit(
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    const sb = requireSupabase()
    await sb.from('audit_logs').insert({
      school_id: this.school.id || null,
      actor_id: actorId ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
    })
  }

  studentsInClass(classId: string) {
    return this.students.filter((s) => s.classId === classId)
  }
  teacherClassSubjects(teacherId: string) {
    return this.classSubjects.filter((cs) => cs.teacherId === teacherId)
  }

  // ---- Fees ----
  listFeeStructures() {
    return [...this.feeStructures]
  }
  listFeeInvoices(studentId?: string) {
    return this.feeInvoices.filter((i) => !studentId || i.studentId === studentId)
  }
  listFeePayments(invoiceId?: string) {
    return this.feePayments.filter((p) => !invoiceId || p.invoiceId === invoiceId)
  }

  async createFeeStructure(data: {
    name: string
    description?: string
    amountCents: number
    gradeId?: string
    academicYear: string
    dueDate?: string
  }) {
    const sb = requireSupabase()
    const { error } = await sb.from('fee_structures').insert({
      school_id: this.school.id,
      name: data.name,
      description: data.description,
      amount_cents: data.amountCents,
      grade_id: data.gradeId || null,
      academic_year: data.academicYear,
      due_date: data.dueDate || null,
    })
    if (error) throw error
    await this.refresh()
  }

  async generateInvoicesFromStructure(structureId: string, actorId?: string) {
    const sb = requireSupabase()
    const structure = this.feeStructures.find((f) => f.id === structureId)
    if (!structure) throw new Error('Fee structure not found')
    const targets = this.students.filter((s) => !structure.gradeId || s.gradeId === structure.gradeId)
    const rows = targets.map((s, idx) => ({
      school_id: this.school.id,
      student_id: s.id,
      fee_structure_id: structure.id,
      invoice_number: `INV-${structure.academicYear}-${Date.now().toString().slice(-6)}-${idx + 1}`,
      description: structure.name,
      amount_cents: structure.amountCents,
      amount_paid_cents: 0,
      status: 'unpaid',
      due_date: structure.dueDate || null,
    }))
    if (rows.length) {
      const { error } = await sb.from('fee_invoices').insert(rows)
      if (error) throw error
    }
    await this.addAudit(actorId, 'GENERATE_FEE_INVOICES', 'fee_structures', structureId, { count: rows.length })
    await this.refresh()
    return rows.length
  }

  async recordFeePayment(input: {
    invoiceId: string
    amountCents: number
    method: FeePayment['method']
    reference?: string
    notes?: string
    recordedBy?: string
  }) {
    const sb = requireSupabase()
    const invoice = this.feeInvoices.find((i) => i.id === input.invoiceId)
    if (!invoice) throw new Error('Invoice not found')
    const { error } = await sb.from('fee_payments').insert({
      school_id: this.school.id,
      invoice_id: input.invoiceId,
      amount_cents: input.amountCents,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
      recorded_by: input.recordedBy,
    })
    if (error) throw error
    const paid = invoice.amountPaidCents + input.amountCents
    const status = paid >= invoice.amountCents ? 'paid' : paid > 0 ? 'partial' : invoice.status
    await sb
      .from('fee_invoices')
      .update({ amount_paid_cents: Math.min(paid, invoice.amountCents), status })
      .eq('id', invoice.id)
    await this.refresh()
  }

  // ---- Messaging ----
  listConversationsForUser(userId: string) {
    return this.conversations.filter((c) => c.participantIds.includes(userId))
  }
  listMessages(conversationId: string) {
    return this.messages.filter((m) => m.conversationId === conversationId && !m.isDeleted)
  }

  async startConversation(input: { createdBy: string; participantIds: string[]; subject?: string; body: string }) {
    const sb = requireSupabase()
    const { data: conv, error } = await sb
      .from('conversations')
      .insert({
        school_id: this.school.id,
        subject: input.subject,
        created_by: input.createdBy,
      })
      .select('*')
      .single()
    if (error) throw error
    const participants = Array.from(new Set([input.createdBy, ...input.participantIds]))
    const { error: pErr } = await sb.from('conversation_participants').insert(
      participants.map((userId) => ({ conversation_id: conv.id, user_id: userId })),
    )
    if (pErr) throw pErr
    const { error: mErr } = await sb.from('messages').insert({
      conversation_id: conv.id,
      sender_id: input.createdBy,
      body: input.body,
    })
    if (mErr) throw mErr
    await sb.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conv.id)
    await this.refresh()
    return conv.id as string
  }

  async sendMessage(conversationId: string, senderId: string, body: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body,
    })
    if (error) throw error
    await sb.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
    await this.refresh()
  }

  // ---- AI Tutor ----
  listAiSessions(studentId: string) {
    return this.aiSessions.filter((s) => s.studentId === studentId)
  }
  listAiMessages(sessionId: string) {
    return this.aiMessages.filter((m) => m.sessionId === sessionId)
  }

  async askAiTutor(input: {
    studentId: string
    subjectId?: string
    question: string
    sessionId?: string
    gradeLevel?: string
    languageCode?: string
    mode?: TutorMode
    imageDataUrl?: string
    pdfText?: string
    documentText?: string
    learnerName?: string
    attachmentLabel?: string
  }) {
    const sb = requireSupabase()
    let sessionId = input.sessionId
    const subject = input.subjectId ? this.getSubject(input.subjectId) : undefined
    const docText = input.documentText || input.pdfText
    const titleBits = [
      subject?.name || 'CAPS Tutor',
      input.mode && input.mode !== 'chat' ? input.mode : null,
    ].filter(Boolean)
    if (!sessionId) {
      const { data, error } = await sb
        .from('ai_tutor_sessions')
        .insert({
          school_id: this.school.id,
          student_id: input.studentId,
          subject_id: input.subjectId || null,
          title: titleBits.join(' · '),
          grade_level: input.gradeLevel || null,
          language_code: input.languageCode || 'en-ZA',
          mode: input.mode || 'chat',
        })
        .select('*')
        .single()
      if (error) throw error
      sessionId = data.id
    }

    const userContent = [
      input.question,
      input.attachmentLabel ? `\n[Attachment: ${input.attachmentLabel}]` : '',
    ]
      .join('')
      .trim()

    await sb.from('ai_tutor_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userContent,
      attachment_type: input.imageDataUrl ? 'image' : docText ? 'document' : null,
    })

    if (!sessionId) throw new Error('Could not create tutor session')

    const prior = this.listAiMessages(sessionId).map(
      (m): TutorChatMessage => ({
        role: m.role === 'system' ? 'system' : m.role,
        content: m.content,
      }),
    )

    const systemPrompt = buildCapsSystemPrompt({
      subjectName: subject?.name,
      gradeLevel: input.gradeLevel,
      languageCode: input.languageCode,
      mode: input.mode,
      learnerName: input.learnerName,
    })

    let reply = ''
    let provider: 'openai' | 'fallback' = 'fallback'

    // Prefer secure edge function (school OpenAI key)
    try {
      const historyPayload = prior.slice(-36).map((h) => ({ role: h.role, content: h.content }))
      const docBlock = docText ? `\n\nUploaded document text:\n${docText.slice(0, 18000)}` : ''
      const userMsg =
        input.imageDataUrl
          ? {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userContent + docBlock,
                },
                { type: 'image_url', image_url: { url: input.imageDataUrl, detail: 'high' } },
              ],
            }
          : {
              role: 'user',
              content: userContent + docBlock,
            }

      const { data, error } = await sb.functions.invoke('ai-tutor', {
        body: {
          systemPrompt,
          messages: [...historyPayload, userMsg],
        },
      })
      if (!error && data?.reply) {
        reply = String(data.reply)
        provider = 'openai'
      } else if (data?.code === 'NO_KEY' || error) {
        // fall through
      }
    } catch {
      // edge not deployed — continue
    }

    // School OpenAI key via secure DB proxy
    if (!reply) {
      try {
        const historyPayload = prior.slice(-36).map((h) => ({ role: h.role, content: h.content }))
        const docBlock = docText ? `\n\nUploaded document text:\n${docText.slice(0, 18000)}` : ''
        const userMsg =
          input.imageDataUrl
            ? {
                role: 'user',
                content: [
                  { type: 'text', text: userContent + docBlock },
                  { type: 'image_url', image_url: { url: input.imageDataUrl, detail: 'high' } },
                ],
              }
            : { role: 'user', content: userContent + docBlock }
        const { data, error } = await sb.rpc('ai_assistant_complete', {
          p_system_prompt: systemPrompt,
          p_messages: [...historyPayload, userMsg],
          p_model: this.school.aiTutorModel || preferredTutorModel(),
        })
        const payload = data as { ok?: boolean; reply?: string } | null
        if (!error && payload?.ok && payload.reply) {
          reply = String(payload.reply)
          provider = 'openai'
        }
      } catch {
        // continue
      }
    }

    if (!reply) {
      const result = await generateTutorReply({
        question: input.question,
        subjectName: subject?.name,
        gradeLevel: input.gradeLevel,
        languageCode: input.languageCode,
        mode: input.mode,
        history: prior,
        imageDataUrl: input.imageDataUrl,
        pdfText: docText,
        learnerName: input.learnerName,
        model: this.school.aiTutorModel || preferredTutorModel(),
      })
      reply = result.reply
      provider = result.provider
    }

    await sb.from('ai_tutor_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      provider,
    })
    await sb
      .from('ai_tutor_sessions')
      .update({
        updated_at: new Date().toISOString(),
        language_code: input.languageCode || 'en-ZA',
        mode: input.mode || 'chat',
        grade_level: input.gradeLevel || null,
        subject_id: input.subjectId || null,
      })
      .eq('id', sessionId)
    await this.refresh()
    return { sessionId: sessionId!, reply, provider }
  }

  /** Streaming AI Assistant — prefers Edge Function (school key), then client GPT stream. */
  async askAiTutorStream(
    input: {
      studentId: string
      subjectId?: string
      question: string
      sessionId?: string
      gradeLevel?: string
      languageCode?: string
      mode?: TutorMode
      imageDataUrl?: string
      pdfText?: string
      documentText?: string
      learnerName?: string
      attachmentLabel?: string
    },
    onDelta: (fullText: string) => void,
  ) {
    const sb = requireSupabase()
    let sessionId = input.sessionId
    const subject = input.subjectId ? this.getSubject(input.subjectId) : undefined
    const docText = input.documentText || input.pdfText
    const titleBits = [
      subject?.name || 'AI Assistant',
      input.mode && input.mode !== 'chat' ? input.mode : null,
    ].filter(Boolean)

    if (!sessionId) {
      const { data, error } = await sb
        .from('ai_tutor_sessions')
        .insert({
          school_id: this.school.id,
          student_id: input.studentId,
          subject_id: input.subjectId || null,
          title: titleBits.join(' · '),
          grade_level: input.gradeLevel || null,
          language_code: input.languageCode || 'en-ZA',
          mode: input.mode || 'chat',
        })
        .select('*')
        .single()
      if (error) throw error
      sessionId = data.id
    }

    const userContent = [
      input.question,
      input.attachmentLabel ? `\n[Attachment: ${input.attachmentLabel}]` : '',
    ]
      .join('')
      .trim()

    await sb.from('ai_tutor_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userContent,
      attachment_type: input.imageDataUrl ? 'image' : docText ? 'document' : null,
    })
    if (!sessionId) throw new Error('Could not create assistant session')

    const prior = this.listAiMessages(sessionId).map(
      (m): TutorChatMessage => ({
        role: m.role === 'system' ? 'system' : m.role,
        content: m.content,
      }),
    )

    const systemPrompt = buildCapsSystemPrompt({
      subjectName: subject?.name,
      gradeLevel: input.gradeLevel,
      languageCode: input.languageCode,
      mode: input.mode,
      learnerName: input.learnerName,
    })

    const historyPayload = prior.slice(-36).map((h) => ({ role: h.role, content: h.content }))
    const docBlock = docText ? `\n\nUploaded document text:\n${docText.slice(0, 18000)}` : ''
    const userMsg =
      input.imageDataUrl
        ? {
            role: 'user' as const,
            content: [
              { type: 'text', text: userContent + docBlock },
              { type: 'image_url', image_url: { url: input.imageDataUrl, detail: 'high' } },
            ],
          }
        : { role: 'user' as const, content: userContent + docBlock }

    let reply = ''
    let provider: 'openai' | 'fallback' = 'fallback'
    let model: string | undefined

    // 1) Live backend: stream via Edge Function (uses school OpenAI key)
    try {
      const { data: auth } = await sb.auth.getSession()
      const token = auth.session?.access_token
      if (token && supabaseUrl) {
        const res = await fetch(`${supabaseUrl}/functions/v1/ai-tutor`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemPrompt,
            messages: [...historyPayload, userMsg],
            stream: true,
          }),
        })
        const ct = res.headers.get('content-type') || ''
        if (res.ok && res.body && ct.includes('text/event-stream')) {
          model = res.headers.get('X-AI-Model') || preferredTutorModel(this.school.aiTutorModel)
          reply = await parseOpenAiSseStream(res.body, (_chunk, full) => onDelta(full))
          if (reply) provider = 'openai'
        } else if (res.ok) {
          const json = (await res.json()) as { reply?: string; model?: string; code?: string }
          if (json.reply) {
            reply = String(json.reply)
            provider = 'openai'
            model = json.model || preferredTutorModel(this.school.aiTutorModel)
            onDelta(reply)
          }
        }
      }
    } catch {
      // edge not deployed / network — continue
    }

    // 2) School OpenAI key via secure DB proxy (no Edge Function required)
    if (!reply) {
      try {
        const { data, error } = await sb.rpc('ai_assistant_complete', {
          p_system_prompt: systemPrompt,
          p_messages: [...historyPayload, userMsg],
          p_model: this.school.aiTutorModel || preferredTutorModel(),
        })
        const payload = data as {
          ok?: boolean
          reply?: string
          model?: string
          code?: string
        } | null
        if (!error && payload?.ok && payload.reply) {
          reply = String(payload.reply)
          provider = 'openai'
          model = payload.model || preferredTutorModel(this.school.aiTutorModel)
          await revealTextProgressively(reply, onDelta)
        }
      } catch {
        // RPC unavailable — continue
      }
    }

    // 3) Client streaming (VITE_OPENAI_API_KEY) or offline CAPS fallback
    if (!reply) {
      const result = await streamTutorReply(
        {
          question: input.question,
          subjectName: subject?.name,
          gradeLevel: input.gradeLevel,
          languageCode: input.languageCode,
          mode: input.mode,
          history: prior,
          imageDataUrl: input.imageDataUrl,
          pdfText: docText,
          learnerName: input.learnerName,
          model: this.school.aiTutorModel || preferredTutorModel(),
        },
        (_chunk, full) => onDelta(full),
      )
      reply = result.reply
      provider = result.provider
      model = result.model
    }

    await sb.from('ai_tutor_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      provider,
    })
    await sb
      .from('ai_tutor_sessions')
      .update({
        updated_at: new Date().toISOString(),
        language_code: input.languageCode || 'en-ZA',
        mode: input.mode || 'chat',
        grade_level: input.gradeLevel || null,
        subject_id: input.subjectId || null,
      })
      .eq('id', sessionId)
    await this.refresh()
    return { sessionId: sessionId!, reply, provider, model }
  }

  async updateAiTutorSettings(patch: {
    openaiApiKey?: string
    aiTutorEnabled?: boolean
    aiTutorModel?: string
  }) {
    const sb = requireSupabase()
    const payload: Record<string, unknown> = {}
    if (patch.openaiApiKey !== undefined) payload.openai_api_key = patch.openaiApiKey || null
    if (patch.aiTutorEnabled !== undefined) payload.ai_tutor_enabled = patch.aiTutorEnabled
    if (patch.aiTutorModel !== undefined) payload.ai_tutor_model = patch.aiTutorModel
    const { error } = await sb.from('schools').update(payload).eq('id', this.school.id)
    if (error) throw error
    await this.refresh()
  }

  /** Whether the school OpenAI key is set (never returns the key itself). */
  async getAiAssistantStatus(): Promise<{
    ok: boolean
    enabled: boolean
    model: string
    hasKey: boolean
  }> {
    const sb = requireSupabase()
    try {
      const { data, error } = await sb.rpc('ai_assistant_status')
      if (!error && data && typeof data === 'object') {
        const d = data as { ok?: boolean; enabled?: boolean; model?: string; hasKey?: boolean }
        return {
          ok: Boolean(d.ok),
          enabled: d.enabled !== false,
          model: d.model || this.school.aiTutorModel || preferredTutorModel(),
          hasKey: Boolean(d.hasKey) || Boolean(import.meta.env.VITE_OPENAI_API_KEY),
        }
      }
    } catch {
      // ignore
    }
    return {
      ok: true,
      enabled: this.school.aiTutorEnabled !== false,
      model: this.school.aiTutorModel || preferredTutorModel(),
      hasKey: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
    }
  }

  async isAiTutorLive(): Promise<boolean> {
    if (import.meta.env.VITE_OPENAI_API_KEY) return true
    const status = await this.getAiAssistantStatus()
    if (status.hasKey && status.enabled) return true
    try {
      const sb = requireSupabase()
      const { data } = await sb.functions.invoke('ai-tutor', {
        body: { ping: true },
      })
      return Boolean(data?.reply) || data?.code !== 'NO_KEY'
    } catch {
      return false
    }
  }

  // ---- WhatsApp ----
  listWhatsAppOutbox() {
    return [...this.whatsappOutbox]
  }

  async updateWhatsAppSettings(patch: Partial<School>) {
    const sb = requireSupabase()
    const { error } = await sb
      .from('schools')
      .update({
        whatsapp_enabled: patch.whatsappEnabled,
        whatsapp_provider: patch.whatsappProvider,
        whatsapp_from: patch.whatsappFrom,
        whatsapp_account_sid: patch.whatsappAccountSid,
        whatsapp_auth_token: patch.whatsappAuthToken,
        whatsapp_notify_attendance: patch.whatsappNotifyAttendance,
        whatsapp_notify_announcements: patch.whatsappNotifyAnnouncements,
        whatsapp_notify_fees: patch.whatsappNotifyFees,
      })
      .eq('id', this.school.id)
    if (error) throw error
    await this.refresh()
  }

  async queueWhatsApp(toPhone: string, body: string, relatedType?: string, relatedId?: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('whatsapp_outbox').insert({
      school_id: this.school.id,
      to_phone: toPhone,
      body,
      related_type: relatedType,
      related_id: relatedId,
    })
    if (error) throw error
    await this.refresh()
  }

  /** Attempts Twilio WhatsApp send for pending outbox items when credentials exist. */
  async dispatchWhatsAppQueue() {
    const school = this.school
    if (!school.whatsappEnabled || !school.whatsappAccountSid || !school.whatsappAuthToken || !school.whatsappFrom) {
      throw new Error('Configure WhatsApp credentials in Admin → WhatsApp before sending.')
    }
    const pending = this.whatsappOutbox.filter((w) => w.status === 'pending')
    const sb = requireSupabase()
    let sent = 0
    for (const item of pending) {
      try {
        const auth = btoa(`${school.whatsappAccountSid}:${school.whatsappAuthToken}`)
        const to = item.toPhone.startsWith('whatsapp:') ? item.toPhone : `whatsapp:${item.toPhone}`
        const from = school.whatsappFrom.startsWith('whatsapp:')
          ? school.whatsappFrom
          : `whatsapp:${school.whatsappFrom}`
        const body = new URLSearchParams({ To: to, From: from, Body: item.body })
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${school.whatsappAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
          },
        )
        const json = (await res.json()) as { sid?: string; message?: string }
        if (!res.ok) {
          await sb
            .from('whatsapp_outbox')
            .update({ status: 'failed', error: json.message || `HTTP ${res.status}` })
            .eq('id', item.id)
        } else {
          await sb
            .from('whatsapp_outbox')
            .update({
              status: 'sent',
              provider_message_id: json.sid,
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq('id', item.id)
          sent += 1
        }
      } catch (e) {
        await sb
          .from('whatsapp_outbox')
          .update({ status: 'failed', error: e instanceof Error ? e.message : 'Send failed' })
          .eq('id', item.id)
      }
    }
    await this.refresh()
    return { processed: pending.length, sent }
  }

  // ---- Timetable CRUD ----
  async upsertTimetableSlot(data: {
    id?: string
    classId: string
    subjectId: string
    teacherId?: string
    dayOfWeek: number
    periodNumber: number
    startTime: string
    endTime: string
    room?: string
  }) {
    const sb = requireSupabase()
    const payload = {
      school_id: this.school.id,
      class_id: data.classId,
      subject_id: data.subjectId,
      teacher_id: data.teacherId || null,
      day_of_week: data.dayOfWeek,
      period_number: data.periodNumber,
      start_time: data.startTime,
      end_time: data.endTime,
      room: data.room || null,
    }
    if (data.id) {
      const { error } = await sb.from('timetable_slots').update(payload).eq('id', data.id)
      if (error) throw error
    } else {
      const { error } = await sb.from('timetable_slots').upsert(payload, {
        onConflict: 'class_id,day_of_week,period_number',
      })
      if (error) throw error
    }
    await this.refresh()
  }

  async deleteTimetableSlot(id: string) {
    const sb = requireSupabase()
    const { error } = await sb.from('timetable_slots').delete().eq('id', id)
    if (error) throw error
    await this.refresh()
  }

  // ---- Materials / homework attachments ----
  async uploadLearningMaterial(input: {
    classSubjectId: string
    title: string
    description?: string
    file: File
    uploadedBy: string
  }) {
    const sb = requireSupabase()
    const path = `${input.uploadedBy}/${Date.now()}-${input.file.name}`
    const { error: upErr } = await sb.storage.from('learning-materials').upload(path, input.file, { upsert: true })
    if (upErr) throw upErr
    const { data } = sb.storage.from('learning-materials').getPublicUrl(path)
    await this.createMaterial({
      classSubjectId: input.classSubjectId,
      title: input.title,
      description: input.description,
      fileUrl: data.publicUrl,
      fileType: input.file.type || input.file.name.split('.').pop(),
      uploadedBy: input.uploadedBy,
    })
  }

  async createHomeworkWithAttachment(input: {
    classSubjectId: string
    title: string
    description?: string
    dueDate: string
    createdBy: string
    file?: File
  }) {
    let attachmentUrl: string | undefined
    if (input.file) {
      const sb = requireSupabase()
      const path = `${input.createdBy}/${Date.now()}-${input.file.name}`
      const { error: upErr } = await sb.storage.from('assignments').upload(path, input.file, { upsert: true })
      if (upErr) throw upErr
      const { data } = await sb.storage.from('assignments').createSignedUrl(path, 60 * 60 * 24 * 30)
      attachmentUrl = data?.signedUrl
    }
    await this.createHomework({
      classSubjectId: input.classSubjectId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      attachmentUrl,
      createdBy: input.createdBy,
    })
  }

  async gradeHomeworkSubmission(id: string, status: HomeworkSubmission['status'] = 'graded') {
    const sb = requireSupabase()
    const { error } = await sb.from('homework_submissions').update({ status }).eq('id', id)
    if (error) throw error
    await this.refresh()
  }

  listHomeworkSubmissions(homeworkId?: string) {
    return this.homeworkSubmissions.filter((s) => !homeworkId || s.homeworkId === homeworkId)
  }

  // Compatibility stubs used by old demo auth (unused with live auth)
  verifyPassword() {
    return false
  }
  setPassword() {}
  updateProfile() {
    return undefined
  }
}

export const api = new LiveApi()
export type { ParentStudent, Grade }
