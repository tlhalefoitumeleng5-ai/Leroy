import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Home,
  Megaphone,
  Printer,
  School,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { jsPDF } from 'jspdf'
import { toast } from 'sonner'
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
import { Input, Label, Textarea } from '@/components/ui/input'
import { formatDate, formatDateTime, fullName, percentageColor, todayISO } from '@/lib/utils'
import {
  attendanceStats,
  capsLevel,
  formatClock,
  subjectColor,
  useApiRefresh,
} from '@/lib/student-helpers'
import { schoolName } from '@/lib/supabase'
import { CapsSubjectsBanner, QuickLinks } from '@/pages/shared/ProductionPages'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function Avatar({
  url,
  name,
  size = 'md',
}: {
  url?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims = size === 'lg' ? 'h-20 w-20 text-2xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-base'
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  if (url) {
    return <img src={url} alt={name} className={`${dims} rounded-full object-cover border-2 border-primary/20`} />
  }
  return (
    <div className={`${dims} flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold`}>
      {initials}
    </div>
  )
}

function LiveClock() {
  const [now, setNow] = useState(() => formatClock())
  useEffect(() => {
    const id = window.setInterval(() => setNow(formatClock()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return <p className="text-sm text-muted-foreground">{now}</p>
}

export function StudentDashboard() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null

  const student = api.getStudentByProfile(user.id)
  const marks = api.getMarksForUser(user.profile)
  const attendance = api.getAttendanceForUser(user.profile)
  const stats = attendanceStats(attendance)
  const avg = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0
  const caps = capsLevel(avg)
  const announcements = api.listAnnouncements().slice(0, 4)
  const notifications = api.getNotifications(user.id).slice(0, 5)
  const jsDay = new Date().getDay()
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? 1 : jsDay
  const upcoming = api
    .getTimetable({ classId: student?.classId })
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.periodNumber - b.periodNumber)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-sky-500/10 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              url={user.profile.avatarUrl}
              name={fullName(user.profile.firstName, user.profile.lastName)}
              size="lg"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Student Portal · Production</p>
              <h1 className="font-display text-2xl font-bold md:text-3xl">
                Sawubona, {user.profile.firstName}
              </h1>
              <LiveClock />
              <p className="mt-1 text-sm text-muted-foreground">
                {api.getClass(student?.classId ?? '')?.name ?? 'Class'} · House {student?.house ?? '—'}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-card/80 px-4 py-3 text-center shadow-sm border border-border">
            <p className="text-xs text-muted-foreground">CAPS level</p>
            <p className={`text-2xl font-bold ${caps.color}`}>{caps.level}</p>
            <p className="text-xs text-muted-foreground">{caps.label}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Academic average" value={`${avg}%`} hint={caps.label} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Attendance" value={`${stats.percentage}%`} hint={`${stats.present} present · ${stats.absent} absent`} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Upcoming today" value={upcoming.length} hint="Lessons on your timetable" icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Unread alerts" value={notifications.filter((n) => !n.isRead).length} icon={<Bell className="h-5 w-5" />} />
      </div>

      <QuickLinks
        items={[
          { to: '/student/ai-tutor', label: 'AI Assistant', hint: 'ChatGPT-style help' },
          { to: '/student/applications', label: 'Applications', hint: 'Apply or track status' },
          { to: '/student/homework', label: 'Homework', hint: 'Upload submissions' },
          { to: '/student/messages', label: 'Messages', hint: 'Chat with teachers' },
          { to: '/student/fees', label: 'Fees', hint: 'View invoices' },
          { to: '/student/report-card', label: 'Report card', hint: 'PDF download' },
          { to: '/student/marks', label: 'Marks', hint: 'SBA · tests · exams' },
        ]}
      />
      <CapsSubjectsBanner />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" /> Upcoming classes
            </CardTitle>
            <Link to="/student/timetable" className="text-xs text-primary hover:underline">
              Full timetable
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <EmptyState title="No lessons today" description="Enjoy your break or catch up on homework." />
            ) : (
              upcoming.map((s) => {
                const subject = api.getSubject(s.subjectId)
                const teacher = s.teacherId ? api.getProfile(s.teacherId) : undefined
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${subjectColor(s.subjectId)}`}
                  >
                    <div>
                      <p className="text-sm font-semibold">{subject?.name}</p>
                      <p className="text-xs opacity-80">
                        {teacher ? fullName(teacher.firstName, teacher.lastName) : 'Teacher TBC'} · {s.room || 'Room TBC'}
                      </p>
                    </div>
                    <p className="text-xs font-semibold whitespace-nowrap">
                      {s.startTime}–{s.endTime}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '60ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" /> Latest announcements
            </CardTitle>
            <Link to="/student/announcements" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  {a.pinned ? <Badge>Pinned</Badge> : null}
                  <p className="text-sm font-medium">{a.title}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" /> Recent notifications
          </CardTitle>
          <Link to="/student/notifications" className="text-xs text-primary hover:underline">
            Inbox
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications" />
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full rounded-xl border border-border p-3 text-left transition hover:bg-muted/40 ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                onClick={() => void api.markNotificationRead(n.id)}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentProfilePage() {
  useApiRefresh()
  const { user, updateProfile, refresh } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [phone, setPhone] = useState(user?.profile.phone ?? '')
  const [address, setAddress] = useState(user?.profile.address ?? '')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const student = user ? api.getStudentByProfile(user.id) : undefined

  useEffect(() => {
    setPhone(user?.profile.phone ?? '')
    setAddress(user?.profile.address ?? '')
  }, [user?.profile.phone, user?.profile.address])

  useEffect(() => {
    setEmergencyName(student?.emergencyContactName ?? '')
    setEmergencyPhone(student?.emergencyContactPhone ?? '')
  }, [student?.emergencyContactName, student?.emergencyContactPhone])

  if (!user) return null
  const cls = student?.classId ? api.getClass(student.classId) : undefined
  const grade = student?.gradeId ? api.getGrade(student.gradeId) : undefined
  const parents = student ? api.getParentsForStudent(student.id) : []
  const school = api.getDb().school

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Profile" description="Update your details and view school records" />

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar
              url={user.profile.avatarUrl}
              name={fullName(user.profile.firstName, user.profile.lastName)}
              size="lg"
            />
            <button
              type="button"
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload profile picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const url = await api.uploadAvatar(user.id, file)
                  await updateProfile({ avatarUrl: url })
                  await refresh()
                  toast.success('Profile picture updated')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Upload failed')
                }
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <School className="h-8 w-8 text-primary" />
              )}
              <div>
                <p className="font-display text-lg font-bold">{schoolName}</p>
                <p className="text-sm text-muted-foreground">{fullName(user.profile.firstName, user.profile.lastName)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Admission number" value={student?.admissionNumber ?? student?.studentNumber ?? '—'} />
            <Field label="Student number" value={student?.studentNumber ?? '—'} />
            <Field label="Grade" value={grade?.name ?? '—'} />
            <Field label="Class" value={cls?.name ?? '—'} />
            <Field label="House / team" value={student?.house ?? '—'} />
            <Field label="Admission date" value={formatDate(student?.admissionDate)} />
            <Field label="Date of birth" value={formatDate(user.profile.dateOfBirth)} />
            <Field label="Gender" value={user.profile.gender ?? '—'} />
            <Field label="Email" value={user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editable details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                setSaving(true)
                try {
                  await updateProfile({ phone, address })
                  toast.success('Profile saved')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Save failed')
                } finally {
                  setSaving(false)
                }
              }}
            >
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Physical address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4 text-primary" /> Emergency contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!student) return
                setSaving(true)
                try {
                  await api.updateStudentSelf(student.id, {
                    emergencyContactName: emergencyName,
                    emergencyContactPhone: emergencyPhone,
                  })
                  toast.success('Emergency contact saved')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Save failed')
                } finally {
                  setSaving(false)
                }
              }}
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving || !student}>
                {saving ? 'Saving…' : 'Save emergency contact'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-primary" /> Parent / guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked parent profiles yet.</p>
            ) : (
              parents.map((p) => (
                <div key={p.id} className="rounded-xl border border-border p-3 transition hover:bg-muted/30">
                  <p className="font-medium text-sm">{fullName(p.firstName, p.lastName)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.relationship ?? 'parent'}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <p className="text-xs text-muted-foreground">{p.phone ?? '—'}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium capitalize break-words">{value}</p>
    </div>
  )
}

export function TimetableView({
  classId,
  teacherId,
  todayOnly,
  showTeachers = true,
}: {
  classId?: string
  teacherId?: string
  todayOnly?: boolean
  showTeachers?: boolean
}) {
  useApiRefresh()
  const jsDay = new Date().getDay()
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? 1 : jsDay
  let slots = api.getTimetable({ classId, teacherId })
  if (todayOnly) slots = slots.filter((s) => s.dayOfWeek === dayOfWeek)

  if (slots.length === 0) {
    return <EmptyState title="No timetable slots" description="Check back once the timetable is published." />
  }

  if (todayOnly) {
    return (
      <div className="space-y-2">
        {slots.map((s) => {
          const subject = api.getSubject(s.subjectId)
          const teacher = s.teacherId ? api.getProfile(s.teacherId) : undefined
          return (
            <div
              key={s.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${subjectColor(s.subjectId)} ring-2 ring-primary/30`}
            >
              <div>
                <p className="text-sm font-semibold">{subject?.name}</p>
                <p className="text-xs opacity-80">
                  {showTeachers && teacher ? fullName(teacher.firstName, teacher.lastName) + ' · ' : ''}
                  {s.room || 'Room TBC'} · Period {s.periodNumber}
                </p>
              </div>
              <p className="text-xs font-semibold">
                {s.startTime}–{s.endTime}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-6 gap-2">
        <div className="text-xs font-semibold text-muted-foreground">Period</div>
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold ${i + 1 === dayOfWeek ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {d}
            {i + 1 === dayOfWeek ? ' · Today' : ''}
          </div>
        ))}
        {[1, 2, 3, 4, 5, 6, 7].map((period) => (
          <Fragment key={`row-${period}`}>
            <div className="flex items-center text-xs font-medium">P{period}</div>
            {[1, 2, 3, 4, 5].map((day) => {
              const slot = slots.find((s) => s.dayOfWeek === day && s.periodNumber === period)
              const teacher = slot?.teacherId ? api.getProfile(slot.teacherId) : undefined
              const isToday = day === dayOfWeek
              return (
                <div
                  key={`${day}-${period}`}
                  className={`min-h-16 rounded-xl border p-2 text-center text-[11px] ${
                    slot ? subjectColor(slot.subjectId) : 'border-border bg-card'
                  } ${isToday ? 'ring-2 ring-primary/40 shadow-sm' : ''}`}
                >
                  {slot ? (
                    <>
                      <p className="font-semibold">{api.getSubject(slot.subjectId)?.code}</p>
                      <p className="opacity-80">{slot.startTime}–{slot.endTime}</p>
                      <p className="opacity-70 truncate">{slot.room}</p>
                      {showTeachers && teacher ? (
                        <p className="opacity-70 truncate">{teacher.lastName}</p>
                      ) : null}
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
  useApiRefresh()
  const { user } = useAuth()
  const student = user ? api.getStudentByProfile(user.id) : undefined
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Weekly Timetable" description="Colour-coded subjects with today’s lessons highlighted" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">This week</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableView classId={student?.classId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableView classId={student?.classId} todayOnly />
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentAttendancePage() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const rows = api.getAttendanceForUser(user.profile)
  const stats = attendanceStats(rows)
  const monthly = [...stats.byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance" description="Daily history and monthly summary" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance %" value={`${stats.percentage}%`} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Present" value={stats.present} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard title="Late" value={stats.late} />
        <StatCard title="Absent" value={stats.absent} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthly.length === 0 ? (
            <EmptyState title="No monthly data yet" />
          ) : (
            monthly.map(([month, bucket]) => {
              const pct = Math.round(((bucket.present + bucket.late * 0.5) / bucket.total) * 100)
              return (
                <div key={month} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium">{month}</p>
                    <p className={percentageColor(pct)}>{pct}%</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Present {bucket.present} · Late {bucket.late} · Absent {bucket.absent}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

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
                <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : 'destructive'}>
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
  useApiRefresh()
  const { user } = useAuth()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const rows = api.listHomework().filter((h) => {
    const cs = api.getClassSubject(h.classSubjectId)
    return cs?.classId === student?.classId
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Homework & Assignments" description="Due dates, status, and upload submissions" />
      <div className="space-y-3">
        {rows.map((h) => {
          const cs = api.getClassSubject(h.classSubjectId)
          const subject = cs ? api.getSubject(cs.subjectId) : undefined
          const submission = student ? api.getHomeworkSubmission(h.id, student.id) : undefined
          const overdue = h.dueDate < todayISO() && !submission
          return (
            <Card key={h.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-sm text-muted-foreground">{subject?.name}</p>
                    <p className="mt-1 text-sm">{h.description}</p>
                    {h.attachmentUrl ? (
                      <a href={h.attachmentUrl} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" /> Teacher attachment
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={overdue ? 'destructive' : 'secondary'}>Due {formatDate(h.dueDate)}</Badge>
                    <Badge variant={submission ? (submission.status === 'late' ? 'warning' : 'success') : 'outline'}>
                      {submission ? submission.status : 'not submitted'}
                    </Badge>
                  </div>
                </div>
                {submission?.fileName ? (
                  <p className="text-xs text-muted-foreground">Uploaded: {submission.fileName} · {formatDateTime(submission.submittedAt)}</p>
                ) : null}
                <label className="relative inline-flex cursor-pointer">
                  <span
                    className={`inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium transition-all hover:bg-muted ${
                      uploadingId === h.id ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingId === h.id ? 'Uploading…' : 'Upload completed homework'}
                  </span>
                  <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    disabled={uploadingId === h.id}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !student) return
                      setUploadingId(h.id)
                      try {
                        await api.submitHomework({
                          homeworkId: h.id,
                          studentId: student.id,
                          file,
                          userId: user.id,
                        })
                        toast.success('Homework submitted')
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Upload failed')
                      } finally {
                        setUploadingId(null)
                        e.target.value = ''
                      }
                    }}
                  />
                </label>
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
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const rows = api.listClassSubjects().filter((cs) => cs.classId === student?.classId)
  const cls = student?.classId ? api.getClass(student.classId) : undefined

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Subjects" description="All enrolled subjects with teacher and classroom" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((cs) => {
          const subject = api.getSubject(cs.subjectId)
          const teacher = cs.teacherId ? api.getProfile(cs.teacherId) : undefined
          const materials = api.listMaterials().filter((m) => m.classSubjectId === cs.id)
          const room =
            api.getTimetable({ classId: student?.classId, subjectId: cs.subjectId }).find((s) => s.room)?.room ||
            cls?.room ||
            cls?.name ||
            '—'
          return (
            <Card key={cs.id} className={`animate-fade-in border ${subjectColor(cs.subjectId)}`}>
              <CardHeader>
                <CardTitle className="text-base">{subject?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Code: {subject?.code}</p>
                <p>{subject?.description || 'CAPS-aligned subject for your grade.'}</p>
                <p>
                  Teacher:{' '}
                  {teacher ? fullName(teacher.firstName, teacher.lastName) : 'Not assigned'}
                </p>
                <p>Classroom: {room}</p>
                <p className="opacity-80">{materials.length} learning material(s)</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function StudentMarksPage() {
  useApiRefresh()
  const { user } = useAuth()
  const marks = user ? api.getMarksForUser(user.profile) : []
  const avg = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0
  const caps = capsLevel(avg)

  const byType = useMemo(() => {
    const groups: Record<string, typeof marks> = {
      assignment: [],
      test: [],
      exam: [],
      homework: [],
      project: [],
      oral: [],
    }
    for (const m of marks) {
      const key = m.assessment.type
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    }
    return groups
  }, [marks])

  const chartData = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const m of marks) {
      const arr = map.get(m.subjectName) ?? []
      arr.push(m.percentage)
      map.set(m.subjectName, arr)
    }
    return [...map.entries()].map(([name, vals]) => ({
      subject: name.length > 12 ? name.slice(0, 12) + '…' : name,
      average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))
  }, [marks])

  if (!user) return null

  function renderGroup(title: string, rows: typeof marks) {
    if (rows.length === 0) return null
    return (
      <Card key={title}>
        <CardHeader>
          <CardTitle className="text-base capitalize">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Assessment</Th>
                <Th>Score</Th>
                <Th>%</Th>
                <Th>CAPS</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const c = capsLevel(m.percentage)
                return (
                  <tr key={m.id}>
                    <Td>{m.subjectName}</Td>
                    <Td>{m.assessment.title}</Td>
                    <Td>
                      {m.score}/{m.assessment.maxScore}
                    </Td>
                    <Td className={`font-semibold ${percentageColor(m.percentage)}`}>{m.percentage}%</Td>
                    <Td>
                      L{c.level}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Marks" description="Continuous assessment with CAPS levels (your records only)" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Overall average" value={`${avg}%`} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="CAPS level" value={caps.level} hint={caps.label} />
        <StatCard title="Assessments" value={marks.length} icon={<FileText className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress by subject</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length === 0 ? (
            <EmptyState title="No marks to chart yet" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="average" fill="#1e40af" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {renderGroup('Continuous Assessment / Assignments', [...byType.assignment, ...byType.project, ...byType.homework])}
      {renderGroup('Tests', byType.test)}
      {renderGroup('Exams', byType.exam)}
      {renderGroup('Oral', byType.oral)}
      {marks.length === 0 ? <EmptyState title="No marks published yet" /> : null}
    </div>
  )
}

export function StudentExamsPage() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const exams = api.getMarksForUser(user.profile).filter((m) => m.assessment.type === 'exam')
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Exam Results" description="Formal examination outcomes" />
      <div className="space-y-3">
        {exams.map((m) => {
          const caps = capsLevel(m.percentage)
          return (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{m.assessment.title}</p>
                  <p className="text-sm text-muted-foreground">{m.subjectName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CAPS Level {caps.level} · {caps.label}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${percentageColor(m.percentage)}`}>{m.percentage}%</p>
              </CardContent>
            </Card>
          )
        })}
        {exams.length === 0 ? <EmptyState title="No exam results yet" /> : null}
      </div>
    </div>
  )
}

export function StudentAnnouncementsPage() {
  useApiRefresh()
  const rows = api.listAnnouncements()
  return (
    <div className="space-y-4 animate-fade-in">
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
  useApiRefresh()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    return api.subscribeNotifications(user.id)
  }, [user])

  if (!user) return null
  const rows = api.getNotifications(user.id)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Notifications"
        description="Real-time alerts — mark as read or delete"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              void api.markAllRead(user.id).then(() => toast.success('All read'))
            }}
          >
            Mark all read
          </Button>
        }
      />
      <div className="space-y-2">
        {rows.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border border-border p-4 ${n.isRead ? '' : 'bg-primary/5'}`}
          >
            <button
              className="min-w-0 flex-1 text-left"
              onClick={() => void api.markNotificationRead(n.id)}
            >
              <p className="font-medium text-sm">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
              <p className="text-[11px] text-muted-foreground mt-2">{formatDateTime(n.createdAt)}</p>
            </button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete notification"
              onClick={() => {
                void api.deleteNotification(n.id).then(() => toast.success('Notification deleted'))
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {rows.length === 0 ? <EmptyState title="Inbox empty" /> : null}
      </div>
    </div>
  )
}

export function StudentReportCardPage() {
  useApiRefresh()
  const { user } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)
  const student = user ? api.getStudentByProfile(user.id) : undefined
  const marks = user ? api.getMarksForUser(user.profile) : []
  const avg = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0
  const caps = capsLevel(avg)
  const attendance = attendanceStats(user ? api.getAttendanceForUser(user.profile) : [])
  const school = api.getDb().school
  const grade = student?.gradeId ? api.getGrade(student.gradeId) : undefined
  const cls = student?.classId ? api.getClass(student.classId) : undefined

  const bySubject = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const m of marks) {
      const arr = map.get(m.subjectName) ?? []
      arr.push(m.percentage)
      map.set(m.subjectName, arr)
    }
    return [...map.entries()].map(([name, vals]) => ({
      name,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      caps: capsLevel(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)),
    }))
  }, [marks])

  if (!user) return null

  function downloadPdf() {
    const doc = new jsPDF()
    let y = 16
    doc.setFontSize(16)
    doc.text(school.name || schoolName, 14, y)
    y += 8
    doc.setFontSize(11)
    doc.text('Academic Report Card', 14, y)
    y += 10
    doc.text(`Learner: ${fullName(user!.profile.firstName, user!.profile.lastName)}`, 14, y)
    y += 6
    doc.text(`Admission No: ${student?.admissionNumber ?? student?.studentNumber ?? '—'}`, 14, y)
    y += 6
    doc.text(`Grade/Class: ${grade?.name ?? '—'} / ${cls?.name ?? '—'}`, 14, y)
    y += 6
    doc.text(`House: ${student?.house ?? '—'}`, 14, y)
    y += 6
    doc.text(`Generated: ${new Date().toLocaleString('en-ZA')}`, 14, y)
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Subject', 14, y)
    doc.text('Avg %', 120, y)
    doc.text('CAPS', 150, y)
    doc.setFont('helvetica', 'normal')
    y += 6
    for (const row of bySubject) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(row.name.slice(0, 40), 14, y)
      doc.text(String(row.avg), 120, y)
      doc.text(`L${row.caps.level}`, 150, y)
      y += 6
    }
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text(`Overall average: ${avg}%  |  CAPS Level ${caps.level} (${caps.label})`, 14, y)
    y += 6
    doc.text(`Attendance: ${attendance.percentage}%`, 14, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Issued via School Portal. Official stamped copies available from the school office.', 14, y)
    doc.save(`report-card-${student?.studentNumber ?? 'student'}.pdf`)
    toast.success('PDF downloaded')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Report Card"
        description="Academic summary with PDF download and print"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={downloadPdf}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        }
      />
      <Card ref={printRef} className="print:shadow-none print:border-0">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              {school.logoUrl ? (
                <img src={school.logoUrl} alt="" className="h-12 w-12 object-contain" />
              ) : (
                <School className="h-10 w-10 text-primary" />
              )}
              <div>
                <p className="font-display text-xl font-bold">{school.name || schoolName}</p>
                <p className="text-sm text-muted-foreground">Academic Report · CAPS</p>
                <p className="text-xs text-muted-foreground">
                  {fullName(user.profile.firstName, user.profile.lastName)} · {student?.admissionNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{avg}%</p>
              <p className={`text-sm font-medium ${caps.color}`}>
                CAPS L{caps.level} · {caps.label}
              </p>
              <p className="text-xs text-muted-foreground">Attendance {attendance.percentage}%</p>
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Average %</Th>
                <Th>CAPS</Th>
              </tr>
            </thead>
            <tbody>
              {bySubject.map((row) => (
                <tr key={row.name}>
                  <Td>{row.name}</Td>
                  <Td className={percentageColor(row.avg)}>{row.avg}%</Td>
                  <Td>
                    L{row.caps.level} · {row.caps.label}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-xs text-muted-foreground">
            This document is issued via School Portal. Official stamped copies are available from the school office.
          </p>
        </CardContent>
      </Card>
      <Link to="/student/marks" className="text-sm text-primary hover:underline">
        View detailed marks →
      </Link>
    </div>
  )
}
