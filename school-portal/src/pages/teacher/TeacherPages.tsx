import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { formatDate, fullName, percentageColor, todayISO } from '@/lib/utils'
import { useApiRefresh } from '@/lib/student-helpers'
import type { AttendanceStatus, AssessmentType } from '@/types'
import { TimetableView } from '@/pages/student/StudentPages'
import { CapsSubjectsBanner, QuickLinks } from '@/pages/shared/ProductionPages'

export function TeacherDashboard() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const classes = api.teacherClassSubjects(user.id)
  const assessments = api.listAssessments().filter((a) =>
    classes.some((cs) => cs.id === a.classSubjectId),
  )
  const homework = api.listHomework().filter((h) => h.createdBy === user.id)
  const submissions = homework.flatMap((h) => api.listHomeworkSubmissions(h.id))
  const pending = submissions.filter((s) => s.status === 'submitted' || s.status === 'late').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`Good day, ${user.profile.firstName}`} description="CAPS teaching workspace" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Class subjects" value={classes.length} />
        <StatCard title="Assessments" value={assessments.length} />
        <StatCard title="Homework set" value={homework.length} />
        <StatCard title="Submissions to review" value={pending} />
      </div>
      <CapsSubjectsBanner />
      <QuickLinks
        items={[
          { to: '/teacher/marks', label: 'Capture marks', hint: 'SBA, tests & exams' },
          { to: '/teacher/homework', label: 'Assignments', hint: 'Publish & grade uploads' },
          { to: '/teacher/attendance', label: 'Attendance', hint: 'Present · late · absent' },
          { to: '/teacher/materials', label: 'Learning materials', hint: 'Upload CAPS resources' },
          { to: '/teacher/messages', label: 'Messages', hint: 'Parents & learners' },
          { to: '/teacher/progress', label: 'Progress', hint: 'Learner tracking' },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Your timetable today</CardTitle>
        </CardHeader>
        <CardContent>
          <TimetableView teacherId={user.id} todayOnly />
        </CardContent>
      </Card>
    </div>
  )
}

export function TeacherMarksPage() {
  const { user } = useAuth()
  const [assessmentId, setAssessmentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<AssessmentType>('test')
  const [maxScore, setMaxScore] = useState('50')
  const [classSubjectId, setClassSubjectId] = useState('')
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  if (!user) return null

  const myCs = api.teacherClassSubjects(user.id)
  const assessments = api.listAssessments().filter((a) => myCs.some((cs) => cs.id === a.classSubjectId))
  const selected = assessments.find((a) => a.id === assessmentId)
  const selectedCs = selected ? api.getClassSubject(selected.classSubjectId) : undefined
  const students = selectedCs ? api.studentsInClass(selectedCs.classId) : []
  const marks = assessmentId
    ? api.getMarksForUser(user.profile).filter((m) => m.assessmentId === assessmentId)
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Capture Marks" description="You can only edit marks for classes assigned to you" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!classSubjectId) return toast.error('Select a class subject')
              api.createAssessment({
                schoolId: api.getDb().school.id,
                classSubjectId,
                title,
                type,
                maxScore: Number(maxScore),
                createdBy: user.id,
              })
              setTitle('')
              refresh()
              toast.success('Assessment created')
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label>Class subject</Label>
              <Select value={classSubjectId} onChange={(e) => setClassSubjectId(e.target.value)} required>
                <option value="">Select…</option>
                {myCs.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {api.getClass(cs.classId)?.name} — {api.getSubject(cs.subjectId)?.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as AssessmentType)}>
                {['homework', 'assignment', 'test', 'exam', 'project', 'oral'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max score</Label>
              <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enter marks</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              try {
                api.upsertMark({
                  assessmentId,
                  studentId,
                  score: Number(score),
                  comment,
                  capturedBy: user.id,
                })
                setScore('')
                setComment('')
                refresh()
                toast.success('Mark saved — parents notified')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed')
              }
            }}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label>Assessment</Label>
              <Select
                value={assessmentId}
                onChange={(e) => {
                  setAssessmentId(e.target.value)
                  setStudentId('')
                }}
                required
              >
                <option value="">Select…</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.type})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">Select…</option>
                {students.map((s) => {
                  const p = api.getProfile(s.profileId)
                  return (
                    <option key={s.id} value={s.id}>
                      {p ? fullName(p.firstName, p.lastName) : s.studentNumber}
                    </option>
                  )
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Score {selected ? `/ ${selected.maxScore}` : ''}</Label>
              <Input
                type="number"
                min={0}
                max={selected?.maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Comment</Label>
              <Input value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <Button type="submit">Save mark</Button>
          </form>
        </CardContent>
      </Card>

      {assessmentId ? (
        <Table>
          <thead>
            <tr>
              <Th>Student</Th>
              <Th>Score</Th>
              <Th>%</Th>
              <Th>Comment</Th>
            </tr>
          </thead>
          <tbody>
            {marks.map((m) => {
              const stu = api.listStudents().find((s) => s.id === m.studentId)
              const p = stu ? api.getProfile(stu.profileId) : undefined
              return (
                <tr key={m.id}>
                  <Td>{p ? fullName(p.firstName, p.lastName) : m.studentId}</Td>
                  <Td>
                    {m.score}/{m.assessment.maxScore}
                  </Td>
                  <Td className={percentageColor(m.percentage)}>{m.percentage}%</Td>
                  <Td>{m.comment ?? '—'}</Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  )
}

export function TeacherAttendancePage() {
  const { user } = useAuth()
  const [classId, setClassId] = useState('')
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [, setTick] = useState(0)

  if (!user) return null

  const classIds = [...new Set(api.teacherClassSubjects(user.id).map((cs) => cs.classId))]
  const students = classId ? api.studentsInClass(classId) : []

  return (
    <div>
      <PageHeader title="Capture Attendance" description={`Date: ${formatDate(todayISO())}`} />
      <div className="mb-4 max-w-sm space-y-2">
        <Label>Class</Label>
        <Select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value)
            setStatuses({})
          }}
        >
          <option value="">Select class…</option>
          {classIds.map((id) => (
            <option key={id} value={id}>
              {api.getClass(id)?.name}
            </option>
          ))}
        </Select>
      </div>

      {classId ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            {students.map((s) => {
              const p = api.getProfile(s.profileId)
              return (
                <div key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-sm">{p ? fullName(p.firstName, p.lastName) : s.studentNumber}</p>
                  <div className="flex gap-2">
                    {(['present', 'late', 'absent'] as AttendanceStatus[]).map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={statuses[s.id] === st ? 'default' : 'outline'}
                        onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
            <Button
              onClick={() => {
                Object.entries(statuses).forEach(([studentId, status]) => {
                  api.recordAttendance({ studentId, classId, status, recordedBy: user.id })
                })
                setTick((t) => t + 1)
                toast.success('Attendance saved — parents notified instantly')
              }}
            >
              Submit attendance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Select a class to begin" />
      )}
    </div>
  )
}

export function TeacherClassesPage() {
  const { user } = useAuth()
  if (!user) return null
  const classIds = [...new Set(api.teacherClassSubjects(user.id).map((cs) => cs.classId))]
  return (
    <div>
      <PageHeader title="Manage Classes" />
      <div className="grid gap-4 sm:grid-cols-2">
        {classIds.map((id) => {
          const cls = api.getClass(id)!
          const students = api.studentsInClass(id)
          return (
            <Card key={id}>
              <CardHeader>
                <CardTitle>{cls.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Room {cls.room ?? '—'}</p>
                <p className="text-sm font-medium">{students.length} learners</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {students.map((s) => {
                    const p = api.getProfile(s.profileId)
                    return <li key={s.id}>{p ? fullName(p.firstName, p.lastName) : s.studentNumber}</li>
                  })}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function TeacherSubjectsPage() {
  const { user } = useAuth()
  if (!user) return null
  const rows = api.teacherClassSubjects(user.id)
  return (
    <div>
      <PageHeader title="Manage Subjects" />
      <Table>
        <thead>
          <tr>
            <Th>Class</Th>
            <Th>Subject</Th>
            <Th>Code</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((cs) => (
            <tr key={cs.id}>
              <Td>{api.getClass(cs.classId)?.name}</Td>
              <Td>{api.getSubject(cs.subjectId)?.name}</Td>
              <Td>{api.getSubject(cs.subjectId)?.code}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function TeacherMaterialsPage() {
  useApiRefresh()
  const { user } = useAuth()
  const [classSubjectId, setClassSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) return null
  const myCs = api.teacherClassSubjects(user.id)
  const materials = api.listMaterials().filter((m) => myCs.some((cs) => cs.id === m.classSubjectId))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Upload Learning Material" description="Share CAPS-aligned resources with your classes" />
      <Card>
        <CardContent className="p-5">
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!file) return toast.error('Choose a file')
              setBusy(true)
              try {
                await api.uploadLearningMaterial({
                  classSubjectId,
                  title,
                  description,
                  file,
                  uploadedBy: user.id,
                })
                setTitle('')
                setDescription('')
                setFile(null)
                toast.success('Material uploaded to cloud storage')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Upload failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            <div className="space-y-2">
              <Label>Class subject</Label>
              <Select value={classSubjectId} onChange={(e) => setClassSubjectId(e.target.value)} required>
                <option value="">Select…</option>
                {myCs.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {api.getClass(cs.classId)?.name} — {api.getSubject(cs.subjectId)?.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload material'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {materials.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Open
              </a>
            </CardContent>
          </Card>
        ))}
        {materials.length === 0 ? <EmptyState title="No materials yet" /> : null}
      </div>
    </div>
  )
}

export function TeacherHomeworkPage() {
  useApiRefresh()
  const { user } = useAuth()
  const [classSubjectId, setClassSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  if (!user) return null
  const myCs = api.teacherClassSubjects(user.id)
  const homework = api.listHomework().filter((h) => myCs.some((cs) => cs.id === h.classSubjectId))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Assignments & Homework" description="Publish tasks and review learner uploads" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await api.createHomeworkWithAttachment({
                  classSubjectId,
                  title,
                  description,
                  dueDate,
                  createdBy: user.id,
                  file: file || undefined,
                })
                setTitle('')
                setDescription('')
                setFile(null)
                toast.success('Assignment published')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            <Select value={classSubjectId} onChange={(e) => setClassSubjectId(e.target.value)} required>
              <option value="">Class subject…</option>
              {myCs.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {api.getClass(cs.classId)?.name} — {api.getSubject(cs.subjectId)?.name}
                </option>
              ))}
            </Select>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <Input className="sm:col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
            <Textarea className="sm:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions" />
            <Input type="file" className="sm:col-span-2" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button type="submit" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish assignment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {homework.map((h) => {
          const subs = api.listHomeworkSubmissions(h.id)
          const subject = api.getSubject(api.getClassSubject(h.classSubjectId)?.subjectId ?? '')
          return (
            <Card key={h.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {h.title}{' '}
                  <span className="text-muted-foreground font-normal text-sm">· {subject?.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{h.description}</p>
                <Badge variant="secondary">Due {formatDate(h.dueDate)}</Badge>
                {h.attachmentUrl ? (
                  <a href={h.attachmentUrl} className="block text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                    Teacher attachment
                  </a>
                ) : null}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Submissions ({subs.length})</p>
                  {subs.map((s) => {
                    const st = api.students.find((x) => x.id === s.studentId)
                    const p = st ? api.getProfile(st.profileId) : undefined
                    return (
                      <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{p ? fullName(p.firstName, p.lastName) : 'Learner'}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.fileName || 'No file'} · {s.status}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {s.fileUrl ? (
                            <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline self-center">
                              Open
                            </a>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await api.gradeHomeworkSubmission(s.id, 'graded')
                                toast.success('Marked as graded')
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : 'Failed')
                              }
                            }}
                          >
                            Mark graded
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  {subs.length === 0 ? <p className="text-xs text-muted-foreground">No submissions yet.</p> : null}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {homework.length === 0 ? <EmptyState title="No assignments yet" /> : null}
      </div>
    </div>
  )
}

export function TeacherReportsPage() {
  const { user } = useAuth()
  const marks = user ? api.getMarksForUser(user.profile) : []
  const bySubject = useMemo(() => {
    const map = new Map<string, number[]>()
    marks.forEach((m) => {
      const arr = map.get(m.subjectName) ?? []
      arr.push(m.percentage)
      map.set(m.subjectName, arr)
    })
    return [...map.entries()].map(([name, vals]) => ({
      name,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      count: vals.length,
    }))
  }, [marks])

  if (!user) return null

  return (
    <div>
      <PageHeader
        title="Generate Reports"
        description="Subject performance summary"
        actions={
          <Button
            onClick={() => {
              const text = bySubject.map((r) => `${r.name}: avg ${r.avg}% (${r.count} marks)`).join('\n')
              const blob = new Blob([text], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'teacher-report.txt'
              a.click()
              toast.success('Report downloaded')
            }}
          >
            Download report
          </Button>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Subject</Th>
            <Th>Marks captured</Th>
            <Th>Average %</Th>
          </tr>
        </thead>
        <tbody>
          {bySubject.map((r) => (
            <tr key={r.name}>
              <Td>{r.name}</Td>
              <Td>{r.count}</Td>
              <Td className={percentageColor(r.avg)}>{r.avg}%</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function TeacherProgressPage() {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  if (!user) return null

  const classIds = [...new Set(api.teacherClassSubjects(user.id).map((cs) => cs.classId))]
  const students = classIds.flatMap((id) => api.studentsInClass(id))
  const marks = studentId
    ? api.getMarksForUser(user.profile).filter((m) => m.studentId === studentId)
    : []

  return (
    <div>
      <PageHeader title="View Student Progress" />
      <div className="mb-4 max-w-md space-y-2">
        <Label>Student</Label>
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Select…</option>
          {students.map((s) => {
            const p = api.getProfile(s.profileId)
            return (
              <option key={s.id} value={s.id}>
                {p ? fullName(p.firstName, p.lastName) : s.studentNumber}
              </option>
            )
          })}
        </Select>
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
    </div>
  )
}

export function TeacherTimetablePage() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader title="My Timetable" />
      <Card>
        <CardContent className="p-5">
          <TimetableView teacherId={user?.id} />
        </CardContent>
      </Card>
    </div>
  )
}
