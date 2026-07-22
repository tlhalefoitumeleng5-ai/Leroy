import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Heart, MessageSquare, Search, Flag, CreditCard } from 'lucide-react'
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
import { formatDate, formatDateTime, fullName, percentageColor } from '@/lib/utils'
import { formatZar } from '@/lib/caps-tutor'
import { attendanceStats, capsLevel, useApiRefresh } from '@/lib/student-helpers'
import { TimetableView } from '@/pages/student/StudentPages'
import { QuickLinks } from '@/pages/shared/ProductionPages'

export function ParentDashboard() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const children = api.getLinkedStudents(user.id)
  const marks = api.getMarksForUser(user.profile)
  const attendance = api.getAttendanceForUser(user.profile)
  const unread = api.getNotifications(user.id).filter((n) => !n.isRead).length
  const invoices = children.flatMap((c) => api.listFeeInvoices(c.id))
  const owed = invoices.reduce((s, i) => s + Math.max(0, i.amountCents - i.amountPaidCents), 0)
  const avg = marks.length ? Math.round(marks.reduce((s, m) => s + m.percentage, 0) / marks.length) : 0
  const caps = capsLevel(avg)
  const att = attendanceStats(attendance)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${user.profile.firstName}`}
        description="Stay connected with your child's CAPS progress"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Linked children" value={children.length} />
        <StatCard title="Academic average" value={marks.length ? `${avg}%` : '—'} hint={caps.label} />
        <StatCard title="Attendance" value={`${att.percentage}%`} hint={`${att.present} present · ${att.absent} absent`} />
        <StatCard title="Fees outstanding" value={formatZar(owed)} icon={<CreditCard className="h-5 w-5" />} />
      </div>
      <QuickLinks
        items={[
          { to: '/parent/fees', label: 'School fees', hint: 'Statements & balances' },
          { to: '/parent/messages', label: 'Messages', hint: 'Chat with teachers' },
          { to: '/parent/marks', label: 'Marks', hint: 'SBA, tests & exams' },
          { to: '/parent/attendance', label: 'Attendance', hint: 'Daily records' },
          { to: '/parent/announcements', label: 'Announcements', hint: 'School notices' },
          { to: '/parent/notifications', label: 'Notifications', hint: `${unread} unread` },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {children.map((c) => {
          const p = api.getProfile(c.profileId)
          const cls = c.classId ? api.getClass(c.classId) : undefined
          const childMarks = marks.filter((m) => m.studentId === c.id)
          const childAvg = childMarks.length
            ? Math.round(childMarks.reduce((s, m) => s + m.percentage, 0) / childMarks.length)
            : 0
          return (
            <Card key={c.id} className="animate-slide-up">
              <CardHeader>
                <CardTitle>{p ? fullName(p.firstName, p.lastName) : 'Learner'}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Student no: {c.studentNumber}</p>
                <p>Class: {cls?.name ?? '—'}</p>
                <p>House: {c.house ?? '—'}</p>
                <p>Average: {childMarks.length ? `${childAvg}% (CAPS L${capsLevel(childAvg).level})` : '—'}</p>
                <p>Emergency: {c.emergencyContactPhone ?? '—'}</p>
                <Link to="/parent/child" className="inline-block pt-2 text-primary text-xs hover:underline">
                  View full profile
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function ParentChildPage() {
  const { user } = useAuth()
  if (!user) return null
  const children = api.getLinkedStudents(user.id)
  return (
    <div>
      <PageHeader title="Child Profile" description="Learners linked to your parent account" />
      <div className="space-y-4">
        {children.map((c) => {
          const p = api.getProfile(c.profileId)!
          const grade = c.gradeId ? api.getGrade(c.gradeId) : undefined
          const cls = c.classId ? api.getClass(c.classId) : undefined
          return (
            <Card key={c.id}>
              <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                <Info label="Name" value={fullName(p.firstName, p.lastName)} />
                <Info label="Student number" value={c.studentNumber} />
                <Info label="Grade" value={grade?.name ?? '—'} />
                <Info label="Class" value={cls?.name ?? '—'} />
                <Info label="Email" value={p.email} />
                <Info label="Date of birth" value={formatDate(p.dateOfBirth)} />
                <Info label="Address" value={p.address ?? '—'} />
                <Info label="Admission" value={formatDate(c.admissionDate)} />
              </CardContent>
            </Card>
          )
        })}
        {children.length === 0 ? <EmptyState title="No linked children" /> : null}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

export function ParentAttendancePage() {
  const { user } = useAuth()
  if (!user) return null
  const rows = api.getAttendanceForUser(user.profile)
  return (
    <div>
      <PageHeader title="Attendance" description="Instant updates when teachers capture attendance" />
      <Table>
        <thead>
          <tr>
            <Th>Learner</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Time</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const stu = api.listStudents().find((s) => s.id === r.studentId)
            const p = stu ? api.getProfile(stu.profileId) : undefined
            return (
              <tr key={r.id}>
                <Td>{p ? fullName(p.firstName, p.lastName) : r.studentId}</Td>
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
                <Td>{formatDateTime(r.recordedAt)}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function ParentMarksPage() {
  const { user } = useAuth()
  if (!user) return null
  const marks = api.getMarksForUser(user.profile)
  return (
    <div>
      <PageHeader title="Marks" description="Only marks for your linked child are shown" />
      <Table>
        <thead>
          <tr>
            <Th>Learner</Th>
            <Th>Subject</Th>
            <Th>Assessment</Th>
            <Th>%</Th>
          </tr>
        </thead>
        <tbody>
          {marks.map((m) => {
            const stu = api.listStudents().find((s) => s.id === m.studentId)
            const p = stu ? api.getProfile(stu.profileId) : undefined
            return (
              <tr key={m.id}>
                <Td>{p ? fullName(p.firstName, p.lastName) : '—'}</Td>
                <Td>{m.subjectName}</Td>
                <Td>{m.assessment.title}</Td>
                <Td className={`font-semibold ${percentageColor(m.percentage)}`}>{m.percentage}%</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function ParentTimetablePage() {
  const { user } = useAuth()
  if (!user) return null
  const child = api.getLinkedStudents(user.id)[0]
  return (
    <div>
      <PageHeader title="Timetable" description="Your child's class timetable" />
      <Card>
        <CardContent className="p-5">
          <TimetableView classId={child?.classId} />
        </CardContent>
      </Card>
    </div>
  )
}

export function ParentAnnouncementsPage() {
  const rows = api.listAnnouncements()
  return (
    <div>
      <PageHeader title="Announcements" />
      <div className="space-y-3">
        {rows.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ParentCalendarPage() {
  const rows = api.listCalendar()
  return (
    <div>
      <PageHeader title="School Calendar" description="Events and important dates" />
      <div className="space-y-3">
        {rows.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.description}</p>
              </div>
              <p className="text-sm font-medium">{formatDateTime(e.startAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ParentNotificationsPage() {
  const { user } = useAuth()
  if (!user) return null
  const rows = api.getNotifications(user.id)
  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" onClick={() => { api.markAllRead(user.id); toast.success('All read') }}>
            Mark all read
          </Button>
        }
      />
      <div className="space-y-2">
        {rows.map((n) => (
          <button
            key={n.id}
            className={`w-full rounded-xl border p-4 text-left ${n.isRead ? '' : 'bg-primary/5'}`}
            onClick={() => api.markNotificationRead(n.id)}
          >
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ParentForumPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const posts = useMemo(() => api.listForumPosts(search), [search, refresh])

  if (!user) return null

  return (
    <div>
      <PageHeader title="Parent Community Forum" description="Authenticated parents only" />
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Create a post</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              api.createForumPost(user.id, title, body)
              setTitle('')
              setBody('')
              refresh()
              toast.success('Post published')
            }}
          >
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <Button type="submit">Post</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => {
          const author = api.getProfile(post.authorId)
          const comments = api.getComments(post.id)
          return (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle className="text-base">{post.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {author ? fullName(author.firstName, author.lastName) : 'Parent'} · {formatDateTime(post.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">{post.body}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={post.likes.includes(user.id) ? 'default' : 'outline'}
                    onClick={() => {
                      api.toggleLike(post.id, user.id)
                      refresh()
                    }}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {post.likes.length}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt('Why are you reporting this post?')
                      if (reason) {
                        api.reportPost(post.id, user.id, reason)
                        toast.success('Report submitted to administrators')
                      }
                    }}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report
                  </Button>
                </div>
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Comments ({comments.length})
                  </p>
                  {comments.map((c) => {
                    const ca = api.getProfile(c.authorId)
                    return (
                      <div key={c.id} className="rounded-lg bg-muted/50 p-2 text-sm">
                        <p className="font-medium text-xs">{ca ? fullName(ca.firstName, ca.lastName) : 'Parent'}</p>
                        <p>{c.body}</p>
                      </div>
                    )
                  })}
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const text = commentDraft[post.id]?.trim()
                      if (!text) return
                      api.addComment(post.id, user.id, text)
                      setCommentDraft((d) => ({ ...d, [post.id]: '' }))
                      refresh()
                    }}
                  >
                    <Input
                      placeholder="Write a comment…"
                      value={commentDraft[post.id] ?? ''}
                      onChange={(e) => setCommentDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                    />
                    <Button type="submit" size="sm">
                      Reply
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {posts.length === 0 ? <EmptyState title="No posts yet" description="Start the conversation." /> : null}
      </div>
    </div>
  )
}
