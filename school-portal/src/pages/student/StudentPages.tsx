import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/services/api'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime, fullName, percentageColor, todayISO } from '@/lib/utils'
import { toast } from 'sonner'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function StudentDashboard() {
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const marks = api.getMarksForUser(user.profile)
  const attendance = api.getAttendanceForUser(user.profile)
  const homework = api.listHomework().filter((h) => {
    if (!student?.classId) return false
    const cs = api.getClassSubject(h.classSubjectId)
    return cs?.classId === student.classId
  })
  const announcements = api.listAnnouncements()
  const avg =
    marks.length > 0 ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0
  const present = attendance.filter((a) => a.status === 'present').length

  return (
    <div>
      <PageHeader
        title={`Sawubona, ${user.profile.firstName}`}
        description="Your learning hub for today"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Average mark" value={`${avg}%`} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Present days" value={present} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Homework due" value={homework.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard
          title="Class"
          value={student?.classId ? api.getClass(student.classId)?.name ?? '—' : '—'}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <TimetableView classId={student?.classId} todayOnly />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  {a.pinned ? <Badge>Pinned</Badge> : null}
                  <p className="font-medium text-sm">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function StudentProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const cls = student?.classId ? api.getClass(student.classId) : undefined
  const grade = student?.gradeId ? api.getGrade(student.gradeId) : undefined

  return (
    <div>
      <PageHeader title="Student Profile" description="Your official school record" />
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Full name" value={fullName(user.profile.firstName, user.profile.lastName)} />
          <Field label="Student number" value={student?.studentNumber ?? '—'} />
          <Field label="Email" value={user.email} />
          <Field label="Phone" value={user.profile.phone ?? '—'} />
          <Field label="Date of birth" value={formatDate(user.profile.dateOfBirth)} />
          <Field label="Gender" value={user.profile.gender ?? '—'} />
          <Field label="Grade" value={grade?.name ?? '—'} />
          <Field label="Class" value={cls?.name ?? '—'} />
          <Field label="Address" value={user.profile.address ?? '—'} />
          <Field label="Emergency contact" value={student?.emergencyContactName ?? '—'} />
          <Field label="Emergency phone" value={student?.emergencyContactPhone ?? '—'} />
          <Field label="Admission date" value={formatDate(student?.admissionDate)} />
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium capitalize">{value}</p>
    </div>
  )
}

export function TimetableView({
  classId,
  teacherId,
  todayOnly,
}: {
  classId?: string
  teacherId?: string
  todayOnly?: boolean
}) {
  const jsDay = new Date().getDay()
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? 1 : jsDay
  let slots = api.getTimetable({ classId, teacherId })
  if (todayOnly) slots = slots.filter((s) => s.dayOfWeek === dayOfWeek)

  if (slots.length === 0) return <EmptyState title="No timetable slots" description="Check back once the timetable is published." />

  if (todayOnly) {
    return (
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">{api.getSubject(s.subjectId)?.name}</p>
              <p className="text-xs text-muted-foreground">
                Period {s.periodNumber} · {s.room}
              </p>
            </div>
            <p className="text-xs font-medium">
              {s.startTime}–{s.endTime}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-6 gap-2">
        <div className="text-xs font-semibold text-muted-foreground">Period</div>
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
        {[1, 2, 3, 4, 5, 6, 7].map((period) => (
          <Fragment key={`row-${period}`}>
            <div className="flex items-center text-xs font-medium">
              P{period}
            </div>
            {[1, 2, 3, 4, 5].map((day) => {
              const slot = slots.find((s) => s.dayOfWeek === day && s.periodNumber === period)
              return (
                <div
                  key={`${day}-${period}`}
                  className="rounded-lg border border-border bg-card p-2 text-center text-[11px] min-h-14"
                >
                  {slot ? (
                    <>
                      <p className="font-semibold text-primary">{api.getSubject(slot.subjectId)?.code}</p>
                      <p className="text-muted-foreground">{slot.startTime}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export function StudentTimetablePage() {
  const { user } = useAuth()
  const student = user ? api.getStudentByProfile(user.id) : undefined
  return (
    <div>
      <PageHeader title="Daily Timetable" description="Your personal class schedule" />
      <Card>
        <CardContent className="p-5">
          <TimetableView classId={student?.classId} />
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentAttendancePage() {
  const { user } = useAuth()
  if (!user) return null
  const rows = api.getAttendanceForUser(user.profile)
  return (
    <div>
      <PageHeader title="Attendance" description="Your daily attendance record" />
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Notes</Th>
            <Th>Recorded</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>
                <Badge
                  variant={
                    r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'destructive'
                  }
                >
                  {r.status}
                </Badge>
              </Td>
              <Td>{r.notes ?? '—'}</Td>
              <Td>{formatDateTime(r.recordedAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {rows.length === 0 ? <EmptyState title="No attendance yet" /> : null}
    </div>
  )
}

export function StudentHomeworkPage() {
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const rows = api.listHomework().filter((h) => {
    const cs = api.getClassSubject(h.classSubjectId)
    return cs?.classId === student?.classId
  })
  return (
    <div>
      <PageHeader title="Homework & Assignments" description="Tasks set by your teachers" />
      <div className="space-y-3">
        {rows.map((h) => {
          const cs = api.getClassSubject(h.classSubjectId)
          const subject = cs ? api.getSubject(cs.subjectId) : undefined
          return (
            <Card key={h.id}>
              <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-sm text-muted-foreground">{subject?.name}</p>
                  <p className="mt-1 text-sm">{h.description}</p>
                </div>
                <Badge variant={h.dueDate <= todayISO() ? 'warning' : 'secondary'}>
                  Due {formatDate(h.dueDate)}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
        {rows.length === 0 ? <EmptyState title="No homework" /> : null}
      </div>
    </div>
  )
}

export function StudentSubjectsPage() {
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const rows = api.listClassSubjects().filter((cs) => cs.classId === student?.classId)
  return (
    <div>
      <PageHeader title="Subjects" description="Subjects enrolled for your class" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((cs) => {
          const subject = api.getSubject(cs.subjectId)
          const teacher = cs.teacherId ? api.getProfile(cs.teacherId) : undefined
          const materials = api.listMaterials().filter((m) => m.classSubjectId === cs.id)
          return (
            <Card key={cs.id} className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base">{subject?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Code: {subject?.code}</p>
                <p>
                  Teacher:{' '}
                  {teacher ? fullName(teacher.firstName, teacher.lastName) : 'Not assigned'}
                </p>
                <p className="text-muted-foreground">{materials.length} learning material(s)</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function StudentMarksPage() {
  const { user } = useAuth()
  if (!user) return null
  const marks = api.getMarksForUser(user.profile)
  return (
    <div>
      <PageHeader title="Marks" description="Only your own marks are visible (POPIA / RLS)" />
      <Table>
        <thead>
          <tr>
            <Th>Subject</Th>
            <Th>Assessment</Th>
            <Th>Type</Th>
            <Th>Score</Th>
            <Th>%</Th>
          </tr>
        </thead>
        <tbody>
          {marks.map((m) => (
            <tr key={m.id}>
              <Td>{m.subjectName}</Td>
              <Td>{m.assessment.title}</Td>
              <Td className="capitalize">{m.assessment.type}</Td>
              <Td>
                {m.score}/{m.assessment.maxScore}
              </Td>
              <Td className={`font-semibold ${percentageColor(m.percentage)}`}>{m.percentage}%</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {marks.length === 0 ? <EmptyState title="No marks published yet" /> : null}
    </div>
  )
}

export function StudentExamsPage() {
  const { user } = useAuth()
  if (!user) return null
  const exams = api.getMarksForUser(user.profile).filter((m) => m.assessment.type === 'exam')
  return (
    <div>
      <PageHeader title="Exam Results" description="Formal examination outcomes" />
      <div className="space-y-3">
        {exams.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold">{m.assessment.title}</p>
                <p className="text-sm text-muted-foreground">{m.subjectName}</p>
              </div>
              <p className={`text-2xl font-bold ${percentageColor(m.percentage)}`}>{m.percentage}%</p>
            </CardContent>
          </Card>
        ))}
        {exams.length === 0 ? <EmptyState title="No exam results yet" /> : null}
      </div>
    </div>
  )
}

export function StudentAnnouncementsPage() {
  const rows = api.listAnnouncements()
  return (
    <div>
      <PageHeader title="Announcements" description="School notices for learners" />
      <div className="space-y-3">
        {rows.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{a.title}</CardTitle>
                {a.pinned ? <Badge>Pinned</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{a.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function StudentNotificationsPage() {
  const { user } = useAuth()
  if (!user) return null
  const rows = api.getNotifications(user.id)
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alerts about marks, homework, and school news"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              api.markAllRead(user.id)
              toast.success('All read')
            }}
          >
            Mark all read
          </Button>
        }
      />
      <div className="space-y-2">
        {rows.map((n) => (
          <button
            key={n.id}
            className={`w-full rounded-xl border border-border p-4 text-left ${n.isRead ? '' : 'bg-primary/5'}`}
            onClick={() => api.markNotificationRead(n.id)}
          >
            <p className="font-medium text-sm">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{formatDateTime(n.createdAt)}</p>
          </button>
        ))}
        {rows.length === 0 ? <EmptyState title="Inbox empty" /> : null}
      </div>
    </div>
  )
}

export function StudentReportCardPage() {
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const marks = api.getMarksForUser(user.profile)
  const avg =
    marks.length > 0 ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0

  function download() {
    const lines = [
      'HORIZON HIGH SCHOOL — REPORT CARD',
      `Learner: ${fullName(user!.profile.firstName, user!.profile.lastName)}`,
      `Student No: ${student?.studentNumber ?? ''}`,
      `Generated: ${new Date().toLocaleString('en-ZA')}`,
      '',
      ...marks.map(
        (m) =>
          `${m.subjectName} | ${m.assessment.title} | ${m.score}/${m.assessment.maxScore} | ${m.percentage}%`,
      ),
      '',
      `Overall average: ${avg}%`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-card-${student?.studentNumber ?? 'student'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report card downloaded')
  }

  return (
    <div>
      <PageHeader
        title="Report Card"
        description="Download your current academic summary"
        actions={
          <Button onClick={download}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-display text-xl font-bold">Horizon High School</p>
              <p className="text-sm text-muted-foreground">Academic Report</p>
            </div>
            <p className="text-3xl font-bold text-primary">{avg}%</p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Assessment</Th>
                <Th>%</Th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => (
                <tr key={m.id}>
                  <Td>{m.subjectName}</Td>
                  <Td>{m.assessment.title}</Td>
                  <Td className={percentageColor(m.percentage)}>{m.percentage}%</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-xs text-muted-foreground">
            This document is issued via School Portal. Official stamped copies are available from the school office.
          </p>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link to="/student/marks" className="text-sm text-primary hover:underline">
          View detailed marks →
        </Link>
      </div>
    </div>
  )
}
