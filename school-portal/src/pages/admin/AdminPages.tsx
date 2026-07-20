import { useState } from 'react'
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
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatDate, formatDateTime, fullName } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'
import { TimetableView } from '@/pages/student/StudentPages'

export function AdminDashboard() {
  return (
    <div>
      <PageHeader title="School Administration" description="Manage people, academics, and operations" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students" value={api.listStudents().length} />
        <StatCard title="Teachers" value={api.listTeachers().length} />
        <StatCard title="Parents" value={api.listParents().length} />
        <StatCard
          title="Pending admissions"
          value={api.listAdmissions().filter((a) => a.status === 'pending').length}
        />
      </div>
    </div>
  )
}

export function AdminStudentsPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [classId, setClassId] = useState('')
  const [search, setSearch] = useState('')
  const [, setTick] = useState(0)

  const rows = api.listStudents().filter((s) => {
    const p = api.getProfile(s.profileId)
    const q = search.toLowerCase()
    return (
      !q ||
      s.studentNumber.toLowerCase().includes(q) ||
      p?.firstName.toLowerCase().includes(q) ||
      p?.lastName.toLowerCase().includes(q) ||
      p?.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Students" />
      <Input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add student</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              const cls = api.getClass(classId)
              if (!cls) return toast.error('Select a class')
              api.createStudent({
                firstName,
                lastName,
                email,
                studentNumber,
                classId,
                gradeId: cls.gradeId,
              })
              setFirstName('')
              setLastName('')
              setEmail('')
              setStudentNumber('')
              setTick((t) => t + 1)
              toast.success('Student created (default password Password123!)')
            }}
          >
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input placeholder="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Student number" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required />
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
              <option value="">Class…</option>
              {api.listClasses().map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="submit">Add student</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Number</Th>
            <Th>Class</Th>
            <Th>Email</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = api.getProfile(s.profileId)
            return (
              <tr key={s.id}>
                <Td>{p ? fullName(p.firstName, p.lastName) : '—'}</Td>
                <Td>{s.studentNumber}</Td>
                <Td>{s.classId ? api.getClass(s.classId)?.name : '—'}</Td>
                <Td>{p?.email}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function AdminTeachersPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Teachers" />
      <Card>
        <CardContent className="p-5">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              api.createTeacher({ firstName, lastName, email, department })
              setFirstName('')
              setLastName('')
              setEmail('')
              setDepartment('')
              setTick((t) => t + 1)
              toast.success('Teacher added')
            }}
          >
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input placeholder="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Button type="submit">Add teacher</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Employee #</Th>
            <Th>Department</Th>
            <Th>Email</Th>
          </tr>
        </thead>
        <tbody>
          {api.listTeachers().map((t) => {
            const p = api.getProfile(t.profileId)
            return (
              <tr key={t.id}>
                <Td>{p ? fullName(p.firstName, p.lastName) : '—'}</Td>
                <Td>{t.employeeNumber}</Td>
                <Td>{t.department ?? '—'}</Td>
                <Td>{p?.email}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function AdminParentsPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [studentId, setStudentId] = useState('')
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Parents" />
      <Card>
        <CardContent className="p-5">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              api.createParent({ firstName, lastName, email, phone, studentId: studentId || undefined })
              setFirstName('')
              setLastName('')
              setEmail('')
              setPhone('')
              setTick((t) => t + 1)
              toast.success('Parent added')
            }}
          >
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input placeholder="Surname" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Link student (optional)…</option>
              {api.listStudents().map((s) => {
                const p = api.getProfile(s.profileId)
                return (
                  <option key={s.id} value={s.id}>
                    {p ? fullName(p.firstName, p.lastName) : s.studentNumber}
                  </option>
                )
              })}
            </Select>
            <Button type="submit">Add parent</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Linked children</Th>
          </tr>
        </thead>
        <tbody>
          {api.listParents().map((par) => {
            const p = api.getProfile(par.profileId)
            const kids = api.getLinkedStudents(par.profileId)
            return (
              <tr key={par.id}>
                <Td>{p ? fullName(p.firstName, p.lastName) : '—'}</Td>
                <Td>{p?.email}</Td>
                <Td>{p?.phone ?? '—'}</Td>
                <Td>{kids.map((k) => api.getProfile(k.profileId)?.firstName).join(', ') || '—'}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function AdminSubjectsPage() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Subjects" />
      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
          <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            onClick={() => {
              if (!code || !name) return
              api.createSubject({ code, name })
              setCode('')
              setName('')
              setTick((t) => t + 1)
              toast.success('Subject created')
            }}
          >
            Add subject
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign subject to class / teacher</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Class…</option>
            {api.listClasses().map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Subject…</option>
            {api.listSubjects().map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Teacher…</option>
            {api.listTeachers().map((t) => {
              const p = api.getProfile(t.profileId)
              return (
                <option key={t.profileId} value={t.profileId}>
                  {p ? fullName(p.firstName, p.lastName) : t.employeeNumber}
                </option>
              )
            })}
          </Select>
          <Button
            onClick={() => {
              if (!classId || !subjectId) return
              api.assignClassSubject({ classId, subjectId, teacherId: teacherId || undefined })
              setTick((t) => t + 1)
              toast.success('Assignment saved')
            }}
          >
            Save assignment
          </Button>
        </CardContent>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Name</Th>
          </tr>
        </thead>
        <tbody>
          {api.listSubjects().map((s) => (
            <tr key={s.id}>
              <Td>{s.code}</Td>
              <Td>{s.name}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function AdminClassesPage() {
  const [name, setName] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [room, setRoom] = useState('')
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Classes" />
      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <Input placeholder="Class name (e.g. 10C)" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">Grade…</option>
            {api.listGrades().map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <Button
            onClick={() => {
              if (!name || !gradeId) return
              api.createClass({ name, gradeId, room })
              setName('')
              setRoom('')
              setTick((t) => t + 1)
              toast.success('Class created')
            }}
          >
            Create class
          </Button>
        </CardContent>
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Grade</Th>
            <Th>Room</Th>
            <Th>Learners</Th>
          </tr>
        </thead>
        <tbody>
          {api.listClasses().map((c) => (
            <tr key={c.id}>
              <Td>{c.name}</Td>
              <Td>{api.getGrade(c.gradeId)?.name}</Td>
              <Td>{c.room ?? '—'}</Td>
              <Td>{api.studentsInClass(c.id).length}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function AdminTimetablePage() {
  const [classId, setClassId] = useState(api.listClasses()[0]?.id ?? '')
  const [gradeId, setGradeId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [filter, setFilter] = useState<'class' | 'grade' | 'teacher' | 'subject'>('class')

  return (
    <div className="space-y-4">
      <PageHeader title="Manage Timetable" description="View by class, grade, teacher, or subject" />
      <div className="flex flex-wrap gap-2">
        {(['class', 'grade', 'teacher', 'subject'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            By {f}
          </Button>
        ))}
      </div>
      <div className="max-w-sm">
        {filter === 'class' ? (
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {api.listClasses().map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}
        {filter === 'grade' ? (
          <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
            <option value="">Select grade…</option>
            {api.listGrades().map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        ) : null}
        {filter === 'teacher' ? (
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Select teacher…</option>
            {api.listTeachers().map((t) => {
              const p = api.getProfile(t.profileId)
              return (
                <option key={t.profileId} value={t.profileId}>
                  {p ? fullName(p.firstName, p.lastName) : t.employeeNumber}
                </option>
              )
            })}
          </Select>
        ) : null}
        {filter === 'subject' ? (
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject…</option>
            {api.listSubjects().map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      <Card>
        <CardContent className="p-5">
          {filter === 'class' ? <TimetableView classId={classId} /> : null}
          {filter === 'grade' ? (
            gradeId ? (
              <div className="space-y-2">
                {api
                  .getTimetable({ gradeId })
                  .map((s) => (
                    <div key={s.id} className="rounded-lg border p-2 text-sm">
                      {DAYS[s.dayOfWeek - 1]} P{s.periodNumber}: {api.getSubject(s.subjectId)?.name} (
                      {api.getClass(s.classId)?.name})
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState title="Select a grade" />
            )
          ) : null}
          {filter === 'teacher' ? <TimetableView teacherId={teacherId || undefined} /> : null}
          {filter === 'subject' ? (
            subjectId ? (
              <div className="space-y-2">
                {api.getTimetable({ subjectId }).map((s) => (
                  <div key={s.id} className="rounded-lg border p-2 text-sm">
                    {DAYS[s.dayOfWeek - 1]} P{s.periodNumber}: {api.getClass(s.classId)?.name} · {s.startTime}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Select a subject" />
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function AdminAdmissionsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')
  const [, setTick] = useState(0)
  const rows = api.listAdmissions().filter((a) => filter === 'all' || a.status === filter)

  return (
    <div>
      <PageHeader title="Admissions" description="Review online applications" />
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'waiting_list'] as const).map((s) => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
            {s.replace('_', ' ')}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {a.applicantName} {a.applicantSurname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Grade {a.gradeApplyingFor} · ID {a.idNumber} · {formatDate(a.createdAt)}
                  </p>
                  <p className="text-sm">
                    Parent: {a.parentName} · {a.parentPhone} · {a.parentEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.physicalAddress}</p>
                </div>
                <Badge
                  variant={
                    a.status === 'approved'
                      ? 'success'
                      : a.status === 'rejected'
                        ? 'destructive'
                        : a.status === 'waiting_list'
                          ? 'warning'
                          : 'secondary'
                  }
                >
                  {a.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['approved', 'rejected', 'waiting_list', 'pending'] as ApplicationStatus[]).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      api.updateAdmissionStatus(a.id, status, undefined, user?.id)
                      setTick((t) => t + 1)
                      toast.success(`Marked ${status.replace('_', ' ')}`)
                    }}
                  >
                    Mark {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 ? <EmptyState title="No applications" /> : null}
      </div>
    </div>
  )
}

export function AdminReportsPage() {
  const presentToday = api
    .getDb()
    .attendance.filter((a) => a.date === new Date().toISOString().slice(0, 10) && a.status === 'present').length

  return (
    <div>
      <PageHeader title="Reports" description="Operational school reports" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total students" value={api.listStudents().length} />
        <StatCard title="Present today" value={presentToday} />
        <StatCard title="Assessments" value={api.listAssessments().length} />
        <StatCard title="Admissions pending" value={api.listAdmissions().filter((a) => a.status === 'pending').length} />
        <StatCard title="Forum posts" value={api.getDb().forumPosts.length} />
        <StatCard title="Audit events" value={api.listAuditLogs().length} />
      </div>
    </div>
  )
}

export function AdminCalendarPage() {
  const [title, setTitle] = useState('')
  const [startAt, setStartAt] = useState('')
  const [description, setDescription] = useState('')
  const { user } = useAuth()
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="School Calendar" />
      <Card>
        <CardContent className="grid gap-3 p-5">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button
            onClick={() => {
              if (!title || !startAt) return
              api.createCalendarEvent({
                title,
                description,
                startAt: new Date(startAt).toISOString(),
                allDay: false,
                audience: ['all'],
                createdBy: user?.id,
              })
              setTitle('')
              setDescription('')
              setStartAt('')
              setTick((t) => t + 1)
              toast.success('Event added')
            }}
          >
            Add event
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {api.listCalendar().map((e) => (
          <Card key={e.id}>
            <CardContent className="flex justify-between p-4 text-sm">
              <span className="font-medium">{e.title}</span>
              <span className="text-muted-foreground">{formatDateTime(e.startAt)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AdminAnnouncementsPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [, setTick] = useState(0)

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" />
      <Card>
        <CardContent className="space-y-3 p-5">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin announcement
          </label>
          <Button
            onClick={() => {
              if (!title || !body) return
              api.createAnnouncement({
                title,
                body,
                pinned,
                audience: ['all'],
                createdBy: user?.id,
              })
              setTitle('')
              setBody('')
              setPinned(false)
              setTick((t) => t + 1)
              toast.success('Announcement published')
            }}
          >
            Publish
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {api.listAnnouncements().map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {a.title}
                {a.pinned ? <Badge>Pinned</Badge> : null}
              </CardTitle>
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

export function AdminAuditPage() {
  return (
    <div>
      <PageHeader title="Audit Logs" description="Security and change trail (POPIA accountability)" />
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Actor</Th>
            <Th>Action</Th>
            <Th>Entity</Th>
          </tr>
        </thead>
        <tbody>
          {api.listAuditLogs().map((l) => {
            const actor = l.actorId ? api.getProfile(l.actorId) : undefined
            return (
              <tr key={l.id}>
                <Td>{formatDateTime(l.createdAt)}</Td>
                <Td>{actor ? fullName(actor.firstName, actor.lastName) : 'System'}</Td>
                <Td>{l.action}</Td>
                <Td>
                  {l.entityType}
                  {l.entityId ? ` · ${l.entityId}` : ''}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function SuperDashboard() {
  const school = api.getDb().school
  return (
    <div>
      <PageHeader title="Super Administrator" description="Platform-wide oversight" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Schools" value={1} />
        <StatCard title="Users" value={api.getDb().profiles.length} />
        <StatCard title="Audit events" value={api.listAuditLogs().length} />
        <StatCard title="Active roles" value={5} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{school.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>EMIS: {school.emisNumber}</p>
          <p>{school.address}</p>
          <p>
            {school.phone} · {school.email}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SuperSchoolsPage() {
  const school = api.getDb().school
  return (
    <div>
      <PageHeader title="Schools" />
      <Card>
        <CardContent className="p-6 space-y-2">
          <p className="font-display text-xl font-bold">{school.name}</p>
          <p className="text-sm">EMIS {school.emisNumber}</p>
          <p className="text-sm text-muted-foreground">{school.address}</p>
          <Badge variant="success">Active</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export function SuperUsersPage() {
  const [search, setSearch] = useState('')
  const rows = api.getDb().profiles.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.email.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.role.includes(q)
    )
  })
  return (
    <div>
      <PageHeader title="All Users" />
      <Input className="mb-4" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td>{fullName(p.firstName, p.lastName)}</Td>
              <Td>{p.email}</Td>
              <Td className="capitalize">{p.role.replace('_', ' ')}</Td>
              <Td>
                <Badge variant={p.isActive ? 'success' : 'destructive'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
