import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Search,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { useAuth } from '@/contexts/auth-context'
import { applicationsApi } from '@/services/applications-api'
import { APPLICATION_DOC_TYPES, statusLabel } from '@/lib/applications'
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { formatDate, formatDateTime } from '@/lib/utils'
import type {
  ApplicationDocument,
  ApplicationNotification,
  ApplicationStatusEvent,
  StudentApplication,
  StudentApplicationStatus,
} from '@/types'

const FILTERS: Array<StudentApplicationStatus | 'all'> = [
  'all',
  'pending',
  'under_review',
  'waiting_for_documents',
  'approved',
  'rejected',
  'draft',
]

export function AdminStudentApplicationsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<StudentApplication[]>([])
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<StudentApplication | null>(null)
  const [docs, setDocs] = useState<ApplicationDocument[]>([])
  const [events, setEvents] = useState<ApplicationStatusEvent[]>([])
  const [notifs, setNotifs] = useState<ApplicationNotification[]>([])
  const [notes, setNotes] = useState('')
  const [missingNote, setMissingNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const list = await applicationsApi.listApplications()
      setRows(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!term) return true
      const hay = [
        r.applicationNumber,
        r.firstName,
        r.surname,
        r.parentEmail,
        r.parentPhone,
        r.idOrPassport,
        r.gradeApplyingFor,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(term)
    })
  }, [rows, filter, q])

  async function openApp(app: StudentApplication) {
    setSelected(app)
    setNotes(app.adminNotes || '')
    setMissingNote(app.missingDocumentsNote || '')
    try {
      const [d, e, n] = await Promise.all([
        applicationsApi.listDocuments(app.id),
        applicationsApi.listEvents(app.id),
        applicationsApi.listNotifications(app.id),
      ])
      setDocs(d)
      setEvents(e)
      setNotifs(n)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load details')
    }
  }

  async function setStatus(status: StudentApplicationStatus, note?: string) {
    if (!selected) return
    setBusy(true)
    try {
      const updated = await applicationsApi.updateStatus({
        id: selected.id,
        status,
        note,
        adminNotes: notes,
        missingDocumentsNote: status === 'waiting_for_documents' ? missingNote || note : missingNote,
        actorId: user?.id,
      })
      setSelected(updated)
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      const e = await applicationsApi.listEvents(updated.id)
      const n = await applicationsApi.listNotifications(updated.id)
      setEvents(e)
      setNotifs(n)
      toast.success(`Marked ${statusLabel(status)} · parents notified`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  function exportExcel() {
    const data = filtered.map((r) => ({
      Number: r.applicationNumber,
      Type: r.applicationType,
      Status: r.status,
      FirstName: r.firstName,
      Surname: r.surname,
      DOB: r.dateOfBirth,
      Grade: r.gradeApplyingFor,
      Parent: r.parentFullName,
      Phone: r.parentPhone,
      WhatsApp: r.parentWhatsapp,
      Email: r.parentEmail,
      Submitted: r.submittedAt,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Applications')
    XLSX.writeFile(wb, `student-applications-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function exportPdf(app: StudentApplication) {
    const doc = new jsPDF()
    let y = 14
    const line = (text: string, size = 11) => {
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text, 180)
      doc.text(lines, 14, y)
      y += lines.length * (size * 0.45) + 4
      if (y > 280) {
        doc.addPage()
        y = 14
      }
    }
    line('Student Application', 16)
    line(`${app.applicationNumber} · ${statusLabel(app.status)}`, 12)
    line(`Learner: ${app.firstName} ${app.middleName || ''} ${app.surname}`)
    line(`DOB: ${app.dateOfBirth || '—'} · Gender: ${app.gender || '—'} · ID/Passport: ${app.idOrPassport || '—'}`)
    line(`Grade applying: ${app.gradeApplyingFor || '—'} · Previous school: ${app.previousSchool || '—'}`)
    line(`Address: ${app.residentialAddress || '—'}`)
    line(`Parent: ${app.parentFullName || '—'} (${app.parentRelationship || '—'})`)
    line(`Phone: ${app.parentPhone || '—'} · WhatsApp: ${app.parentWhatsapp || '—'} · Email: ${app.parentEmail || '—'}`)
    line(`Emergency: ${app.emergencyContact || '—'}`)
    line(`Medical aid: ${app.medicalAid || '—'} · Doctor: ${app.doctorName || '—'} ${app.doctorContact || ''}`)
    line(`Conditions: ${app.medicalConditions || '—'} · Allergies: ${app.allergies || '—'}`)
    line(`Admin notes: ${app.adminNotes || '—'}`)
    line(`Documents: ${docs.map((d) => d.fileName).join(', ') || 'None'}`)
    doc.save(`${app.applicationNumber}.pdf`)
  }

  async function downloadDoc(d: ApplicationDocument) {
    try {
      const blob = await applicationsApi.downloadDocumentBlob(d.storagePath)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = d.fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed')
    }
  }

  const stats = {
    pending: rows.filter((r) => r.status === 'pending').length,
    review: rows.filter((r) => r.status === 'under_review').length,
    waiting: rows.filter((r) => r.status === 'waiting_for_documents').length,
    approved: rows.filter((r) => r.status === 'approved').length,
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <PageHeader
        title="Student Applications"
        description="New enrolments and returning registrations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="Under review" value={stats.review} />
        <StatCard title="Waiting for documents" value={stats.waiting} />
        <StatCard title="Approved" value={stats.approved} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, number, email, phone, ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((s) => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : statusLabel(s)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : null}
          {filtered.map((a) => (
            <Card
              key={a.id}
              className={`cursor-pointer transition hover:border-primary/40 ${selected?.id === a.id ? 'border-primary ring-1 ring-primary/30' : ''}`}
              onClick={() => void openApp(a)}
            >
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {a.firstName} {a.surname}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{a.applicationNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Grade {a.gradeApplyingFor || '—'} · {a.applicationType.replace('_', ' ')} ·{' '}
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    a.status === 'approved'
                      ? 'success'
                      : a.status === 'rejected'
                        ? 'destructive'
                        : a.status === 'waiting_for_documents'
                          ? 'warning'
                          : 'secondary'
                  }
                >
                  {statusLabel(a.status)}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {!loading && filtered.length === 0 ? <EmptyState title="No applications found" /> : null}
        </div>

        <div>
          {!selected ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Select an application to review, approve, reject, request documents, or export.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20">
              <CardContent className="space-y-4 p-5" id="application-print-area">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selected.firstName} {selected.middleName} {selected.surname}
                    </h2>
                    <p className="font-mono text-sm text-primary">{selected.applicationNumber}</p>
                    <p className="text-xs text-muted-foreground">Access code {selected.accessCode}</p>
                  </div>
                  <Badge>{statusLabel(selected.status)}</Badge>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Type:</span> {selected.applicationType.replace('_', ' ')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Grade:</span> {selected.gradeApplyingFor || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">DOB:</span> {selected.dateOfBirth || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">ID/Passport:</span> {selected.idOrPassport || '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Address:</span> {selected.residentialAddress || '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Parent:</span> {selected.parentFullName} ·{' '}
                    {selected.parentPhone} · {selected.parentEmail}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-muted-foreground">Medical:</span> {selected.medicalAid || '—'} /{' '}
                    {selected.allergies || 'no allergies noted'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Admin notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Request missing documents (message to parent)</Label>
                  <Textarea value={missingNote} onChange={(e) => setMissingNote(e.target.value)} rows={2} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void setStatus('under_review')}>
                    Under Review
                  </Button>
                  <Button size="sm" variant="success" disabled={busy} onClick={() => void setStatus('approved', 'Approved by admissions')}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void setStatus('rejected', notes || 'Application rejected')}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !missingNote.trim()}
                    onClick={() => void setStatus('waiting_for_documents', missingNote)}
                  >
                    Request Documents
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => exportPdf(selected)}>
                    <FileText className="mr-1 h-4 w-4" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.print()
                    }}
                  >
                    <Printer className="mr-1 h-4 w-4" /> Print
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Documents</p>
                  <div className="space-y-2">
                    {docs.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{d.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {APPLICATION_DOC_TYPES.find((x) => x.id === d.docType)?.label || d.docType}
                            {d.isBlurry ? ' · possibly blurry' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {d.signedUrl ? (
                            <a href={d.signedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              Preview
                            </a>
                          ) : null}
                          <button type="button" className="text-primary hover:underline" onClick={() => void downloadDoc(d)}>
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : null}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Status history</p>
                  <div className="space-y-1">
                    {events.map((ev) => (
                      <p key={ev.id} className="text-xs text-muted-foreground">
                        {formatDateTime(ev.createdAt)} · {ev.toStatus.replace(/_/g, ' ')}
                        {ev.note ? ` — ${ev.note}` : ''}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">Notifications queued</p>
                  <div className="space-y-1">
                    {notifs.map((n) => (
                      <p key={n.id} className="text-xs text-muted-foreground">
                        {n.channel.toUpperCase()} → {n.recipient} · {n.status}
                      </p>
                    ))}
                    {notifs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">None yet.</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Quick status</Label>
                  <Select
                    value={selected.status}
                    onChange={(e) => void setStatus(e.target.value as StudentApplicationStatus)}
                  >
                    {FILTERS.filter((f) => f !== 'all').map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
