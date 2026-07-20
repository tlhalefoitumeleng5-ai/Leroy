import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  CreditCard,
  MessageSquare,
  Send,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/services/api'
import { formatZar } from '@/lib/caps-tutor'
import { useApiRefresh } from '@/lib/student-helpers'
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
import type { FeePayment, UserRole } from '@/types'

/** Shared messaging inbox for teachers, parents, and students. */
export function MessagingPage({ rolesAllowed }: { rolesAllowed?: UserRole[] }) {
  useApiRefresh()
  const { user } = useAuth()
  const [activeId, setActiveId] = useState<string>('')
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [sending, setSending] = useState(false)

  if (!user) return null
  if (rolesAllowed && !rolesAllowed.includes(user.profile.role)) return null

  const conversations = api.listConversationsForUser(user.id)
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]
  const messages = active ? api.listMessages(active.id) : []

  const directory = api
    .getDb()
    .profiles.filter((p) => {
      if (p.id === user.id || !p.isActive) return false
      if (user.profile.role === 'student') return p.role === 'teacher' || p.role === 'school_admin'
      if (user.profile.role === 'parent') return p.role === 'teacher' || p.role === 'school_admin'
      if (user.profile.role === 'teacher') return p.role === 'parent' || p.role === 'student' || p.role === 'school_admin'
      return true
    })
    .slice(0, 80)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Messages"
        description="Secure messaging between teachers, parents and students"
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Inbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto p-3">
            {conversations.map((c) => {
              const others = c.participantIds.filter((id) => id !== user.id)
              const names = others
                .map((id) => api.getProfile(id))
                .filter(Boolean)
                .map((p) => p!.firstName)
                .join(', ')
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition hover:bg-muted/50 ${
                    active?.id === c.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{c.subject || names || 'Conversation'}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(c.updatedAt)}</p>
                </button>
              )
            })}
            {conversations.length === 0 ? <EmptyState title="No messages yet" description="Start a conversation below." /> : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!participantId || !newBody.trim()) return toast.error('Pick a recipient and write a message')
                  setSending(true)
                  try {
                    const id = await api.startConversation({
                      createdBy: user.id,
                      participantIds: [participantId],
                      subject: subject || undefined,
                      body: newBody.trim(),
                    })
                    setActiveId(id)
                    setSubject('')
                    setNewBody('')
                    setParticipantId('')
                    toast.success('Message sent')
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Could not send')
                  } finally {
                    setSending(false)
                  }
                }}
              >
                <div className="space-y-2 sm:col-span-2">
                  <Label>Recipient</Label>
                  <Select value={participantId} onChange={(e) => setParticipantId(e.target.value)} required>
                    <option value="">Select person…</option>
                    {directory.map((p) => (
                      <option key={p.id} value={p.id}>
                        {fullName(p.firstName, p.lastName)} · {p.role.replace('_', ' ')}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Subject</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional subject" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Message</Label>
                  <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} required rows={3} />
                </div>
                <Button type="submit" disabled={sending}>
                  <Send className="h-4 w-4" /> Start chat
                </Button>
              </form>
            </CardContent>
          </Card>

          {active ? (
            <Card className="flex min-h-[360px] flex-col">
              <CardHeader>
                <CardTitle className="text-base">{active.subject || 'Conversation'}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[40vh] rounded-xl bg-muted/30 p-3">
                  {messages.map((m) => {
                    const mine = m.senderId === user.id
                    const sender = api.getProfile(m.senderId)
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            mine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
                          }`}
                        >
                          {!mine ? (
                            <p className="text-[10px] opacity-70 mb-0.5">{sender?.firstName}</p>
                          ) : null}
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'opacity-80' : 'text-muted-foreground'}`}>
                            {formatDateTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!body.trim()) return
                    setSending(true)
                    try {
                      await api.sendMessage(active.id, user.id, body.trim())
                      setBody('')
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Send failed')
                    } finally {
                      setSending(false)
                    }
                  }}
                >
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending} size="icon" aria-label="Send">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AdminFeesPage() {
  useApiRefresh()
  const { user } = useAuth()
  const [name, setName] = useState('Annual school fees')
  const [amount, setAmount] = useState('12500')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [gradeId, setGradeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [payInvoiceId, setPayInvoiceId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<FeePayment['method']>('eft')
  const [busy, setBusy] = useState(false)

  const structures = api.listFeeStructures()
  const invoices = api.listFeeInvoices()
  const outstanding = invoices.filter((i) => i.status !== 'paid' && i.status !== 'waived')
  const collected = invoices.reduce((s, i) => s + i.amountPaidCents, 0)
  const owed = invoices.reduce((s, i) => s + Math.max(0, i.amountCents - i.amountPaidCents), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="School Fees" description="Fee structures, invoices and payments (ZAR)" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Collected" value={formatZar(collected)} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard title="Outstanding" value={formatZar(owed)} />
        <StatCard title="Open invoices" value={outstanding.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create fee structure</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await api.createFeeStructure({
                  name,
                  amountCents: Math.round(Number(amount) * 100),
                  academicYear: year,
                  gradeId: gradeId || undefined,
                  dueDate: dueDate || undefined,
                })
                toast.success('Fee structure saved')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (ZAR)" required />
            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Academic year" required />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">All grades</option>
              {api.listGrades().map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={busy}>
              Save structure
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee structures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {structures.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatZar(s.amountCents)} · {s.academicYear}
                  {s.gradeId ? ` · ${api.getGrade(s.gradeId)?.name}` : ' · All grades'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const n = await api.generateInvoicesFromStructure(s.id, user?.id)
                    toast.success(`Generated ${n} invoices`)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed')
                  }
                }}
              >
                Generate invoices
              </Button>
            </div>
          ))}
          {structures.length === 0 ? <EmptyState title="No fee structures yet" /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                await api.recordFeePayment({
                  invoiceId: payInvoiceId,
                  amountCents: Math.round(Number(payAmount) * 100),
                  method: payMethod,
                  recordedBy: user?.id,
                })
                setPayAmount('')
                toast.success('Payment recorded')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed')
              }
            }}
          >
            <Select value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)} required>
              <option value="">Invoice…</option>
              {outstanding.map((i) => {
                const st = api.students.find((s) => s.id === i.studentId)
                const p = st ? api.getProfile(st.profileId) : undefined
                return (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber} · {p ? fullName(p.firstName, p.lastName) : 'Learner'} · due{' '}
                    {formatZar(i.amountCents - i.amountPaidCents)}
                  </option>
                )
              })}
            </Select>
            <Input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (ZAR)" required />
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value as FeePayment['method'])}>
              <option value="eft">EFT</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="payfast">PayFast</option>
              <option value="ozow">Ozow</option>
              <option value="other">Other</option>
            </Select>
            <Button type="submit">Record payment</Button>
          </form>
        </CardContent>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Invoice</Th>
            <Th>Learner</Th>
            <Th>Amount</Th>
            <Th>Paid</Th>
            <Th>Status</Th>
            <Th>Due</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => {
            const st = api.students.find((s) => s.id === i.studentId)
            const p = st ? api.getProfile(st.profileId) : undefined
            return (
              <tr key={i.id}>
                <Td>{i.invoiceNumber}</Td>
                <Td>{p ? fullName(p.firstName, p.lastName) : '—'}</Td>
                <Td>{formatZar(i.amountCents)}</Td>
                <Td>{formatZar(i.amountPaidCents)}</Td>
                <Td>
                  <Badge variant={i.status === 'paid' ? 'success' : i.status === 'partial' ? 'warning' : 'destructive'}>
                    {i.status}
                  </Badge>
                </Td>
                <Td>{formatDate(i.dueDate)}</Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export function ParentFeesPage() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const children = api.getLinkedStudents(user.id)
  const invoices = children.flatMap((c) => api.listFeeInvoices(c.id))
  const owed = invoices.reduce((s, i) => s + Math.max(0, i.amountCents - i.amountPaidCents), 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="School Fees" description="Statements and balances for your children" />
      <StatCard title="Total outstanding" value={formatZar(owed)} hint="Pay via EFT using the invoice number as reference" icon={<CreditCard className="h-5 w-5" />} />
      <div className="space-y-3">
        {invoices.map((i) => {
          const st = api.students.find((s) => s.id === i.studentId)
          const p = st ? api.getProfile(st.profileId) : undefined
          return (
            <Card key={i.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-sm">{i.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.invoiceNumber} · {p ? fullName(p.firstName, p.lastName) : 'Learner'}
                  </p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(i.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatZar(i.amountCents - i.amountPaidCents)}</p>
                  <Badge variant={i.status === 'paid' ? 'success' : 'warning'}>{i.status}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {invoices.length === 0 ? <EmptyState title="No fee invoices yet" /> : null}
      </div>
    </div>
  )
}

export function StudentFeesPage() {
  useApiRefresh()
  const { user } = useAuth()
  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const invoices = student ? api.listFeeInvoices(student.id) : []
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="My Fees" description="View school fee invoices linked to your learner profile" />
      {invoices.map((i) => (
        <Card key={i.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-sm">{i.description}</p>
              <p className="text-xs text-muted-foreground">{i.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatZar(i.amountCents - i.amountPaidCents)}</p>
              <Badge variant={i.status === 'paid' ? 'success' : 'warning'}>{i.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      {invoices.length === 0 ? <EmptyState title="No invoices" description="Your fee statement will appear once finance publishes invoices." /> : null}
    </div>
  )
}

export function StudentAiTutorPage() {
  useApiRefresh()
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState<string>('')
  const [subjectId, setSubjectId] = useState('')
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null
  const student = api.getStudentByProfile(user.id)
  const sessions = student ? api.listAiSessions(student.id) : []
  const activeId = sessionId || sessions[0]?.id
  const messages = activeId ? api.listAiMessages(activeId) : []
  const enrolled = api.listClassSubjects().filter((cs) => cs.classId === student?.classId)

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="AI Tutor"
        description="CAPS-aligned study help for South African learners"
        actions={
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> CAPS
          </Badge>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeId === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setSessionId(s.id)}
              >
                {s.title}
              </button>
            ))}
            {sessions.length === 0 ? <p className="text-xs text-muted-foreground">Ask a question to start.</p> : null}
          </CardContent>
        </Card>
        <Card className="min-h-[420px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" /> Study chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[45vh] rounded-xl bg-muted/30 p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8 bg-card border border-border'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ask about Mathematics, English, Life Sciences, History, or exam technique. Answers follow CAPS methods.
                </p>
              ) : null}
            </div>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Subject (optional)</option>
              {enrolled.map((cs) => {
                const sub = api.getSubject(cs.subjectId)
                return (
                  <option key={cs.id} value={cs.subjectId}>
                    {sub?.name}
                  </option>
                )
              })}
            </Select>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!student || !question.trim()) return
                setBusy(true)
                try {
                  const res = await api.askAiTutor({
                    studentId: student.id,
                    subjectId: subjectId || undefined,
                    question: question.trim(),
                    sessionId: activeId || undefined,
                  })
                  setSessionId(res.sessionId)
                  setQuestion('')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Tutor unavailable')
                } finally {
                  setBusy(false)
                }
              }}
            >
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your CAPS tutor…"
                className="flex-1"
              />
              <Button type="submit" disabled={busy}>
                {busy ? 'Thinking…' : 'Ask'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AdminWhatsAppPage() {
  useApiRefresh()
  const school = api.getDb().school
  const [enabled, setEnabled] = useState(Boolean(school.whatsappEnabled))
  const [from, setFrom] = useState(school.whatsappFrom ?? '')
  const [sid, setSid] = useState(school.whatsappAccountSid ?? '')
  const [token, setToken] = useState(school.whatsappAuthToken ?? '')
  const [att, setAtt] = useState(school.whatsappNotifyAttendance ?? true)
  const [ann, setAnn] = useState(school.whatsappNotifyAnnouncements ?? true)
  const [fees, setFees] = useState(school.whatsappNotifyFees ?? true)
  const outbox = api.listWhatsAppOutbox()

  useEffect(() => {
    setEnabled(Boolean(school.whatsappEnabled))
    setFrom(school.whatsappFrom ?? '')
    setSid(school.whatsappAccountSid ?? '')
    setToken(school.whatsappAuthToken ?? '')
    setAtt(school.whatsappNotifyAttendance ?? true)
    setAnn(school.whatsappNotifyAnnouncements ?? true)
    setFees(school.whatsappNotifyFees ?? true)
  }, [school])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="WhatsApp Notifications"
        description="Queue parent alerts via Twilio WhatsApp Business"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-primary" /> Provider settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                await api.updateWhatsAppSettings({
                  whatsappEnabled: enabled,
                  whatsappProvider: 'twilio',
                  whatsappFrom: from,
                  whatsappAccountSid: sid,
                  whatsappAuthToken: token,
                  whatsappNotifyAttendance: att,
                  whatsappNotifyAnnouncements: ann,
                  whatsappNotifyFees: fees,
                })
                toast.success('WhatsApp settings saved')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Save failed')
              }
            }}
          >
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enable WhatsApp notifications
            </label>
            <div className="space-y-2">
              <Label>Twilio Account SID</Label>
              <Input value={sid} onChange={(e) => setSid(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label>Twilio Auth Token</Label>
              <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>From number (E.164, e.g. +27821234567)</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="+27…" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={att} onChange={(e) => setAtt(e.target.checked)} /> Attendance alerts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ann} onChange={(e) => setAnn(e.target.checked)} /> Announcement alerts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={fees} onChange={(e) => setFees(e.target.checked)} /> Fee reminders
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <Button type="submit">Save settings</Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await api.dispatchWhatsAppQueue()
                    toast.success(`Processed ${res.processed}, sent ${res.sent}`)
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Dispatch failed')
                  }
                }}
              >
                Process pending queue
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Absences/lates and announcements automatically queue WhatsApp messages when enabled. Parent profiles need a valid mobile number.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {outbox.map((w) => (
            <div key={w.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{w.toPhone}</p>
                <Badge variant={w.status === 'sent' ? 'success' : w.status === 'failed' ? 'destructive' : 'secondary'}>
                  {w.status}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{w.body}</p>
              {w.error ? <p className="mt-1 text-xs text-destructive">{w.error}</p> : null}
              <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(w.createdAt)}</p>
            </div>
          ))}
          {outbox.length === 0 ? <EmptyState title="Outbox empty" /> : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function QuickLinks({ items }: { items: Array<{ to: string; label: string; hint?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-primary/5 animate-scale-in"
        >
          <p className="font-semibold text-sm">{item.label}</p>
          {item.hint ? <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p> : null}
        </Link>
      ))}
    </div>
  )
}

export function CapsSubjectsBanner() {
  const subjects = api.listSubjects()
  const withCaps = subjects.filter((s) => s.phase || s.capsCode)
  if (!subjects.length) return null
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">CAPS curriculum</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {withCaps.length || subjects.length} subjects loaded · SBA/exam weightings supported for FET reporting
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {subjects.slice(0, 8).map((s) => (
            <Badge key={s.id} variant="outline">
              {s.code}
              {s.phase ? ` · ${s.phase}` : ''}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
