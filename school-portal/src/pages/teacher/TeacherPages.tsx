import { useMemo, useState } from 'react'
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
import type { AttendanceStatus, AssessmentType } from '@/types'
import { TimetableView } from '@/pages/student/StudentPages'

export function TeacherDashboard() {
  const { user } = useAuth()
  if (!user) return null
  const classes = api.teacherClassSubjects(user.id)
  const assessments = api.listAssessments().filter((a) =>
    classes.some((cs) => cs.id === a.classSubjectId),
  )
  return (
    <div>
      <PageHeader title={`Good day, ${user.profile.firstName}`} description="Teaching workspace" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Class subjects" value={classes.length} />
        <StatCard title="Assessments" value={assessments.length} />
        <StatCard title="Homework" value={api.listHomework().filter((h) => h.createdBy === user.id).length} />
        <StatCard title="Materials" value={api.listMaterials().filter((m) => m.uploadedBy === user.id).length} />
      </div>
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
  const { user } = useAuth()
  const [classSubjectId, setClassSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [, setTick] = useState(0)

  if (!user) return null
  const myCs = api.teacherClassSubjects(user.id)
  const materials = api.listMaterials().filter((m) => myCs.some((cs) => cs.id === m.classSubjectId))

  return (
    <div className="space-y-6">
      <PageHeader title="Upload Learning Material" />
      <Card>
        <CardContent className="p-5">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              api.createMaterial({
                classSubjectId,
                title,
                description,
                fileUrl: `#${fileName || 'material.pdf'}`,
                fileType: fileName.split('.').pop() ?? 'pdf',
                uploadedBy: user.id,
              })
              setTitle('')
              setDescription('')
              setFileName('')
              setTick((t) => t + 1)
              toast.success('Material uploaded')
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
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                required
              />
            </div>
            <Button type="submit">Upload</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {materials.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
              <Badge variant="secondary">{m.fileType}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TeacherReportsPage() {
  const { user } = useAuth()
  if (!user) return null
  const marks = api.getMarksForUser(user.profile)
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
