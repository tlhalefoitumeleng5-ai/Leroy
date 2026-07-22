import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import { applicationsApi } from '@/services/applications-api'
import { statusLabel } from '@/lib/applications'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, cn } from '@/lib/utils'
import type { ApplicationDocument, ApplicationStatusEvent, StudentApplication } from '@/types'

export function TrackApplicationPage({
  embedded = false,
  initialNumber = '',
  initialCode = '',
}: {
  embedded?: boolean
  initialNumber?: string
  initialCode?: string
}) {
  const [number, setNumber] = useState(initialNumber)
  const [code, setCode] = useState(initialCode)
  const [busy, setBusy] = useState(false)
  const [app, setApp] = useState<StudentApplication | null>(null)
  const [docs, setDocs] = useState<ApplicationDocument[]>([])
  const [events, setEvents] = useState<ApplicationStatusEvent[]>([])

  async function loadStatus(applicationNumber: string, accessCode: string) {
    setBusy(true)
    try {
      const res = await applicationsApi.track(applicationNumber, accessCode)
      setApp(res.application)
      setDocs(res.documents)
      setEvents(res.events)
    } catch (err) {
      setApp(null)
      toast.error(err instanceof Error ? err.message : 'Not found')
    } finally {
      setBusy(false)
    }
  }

  async function track(e: React.FormEvent) {
    e.preventDefault()
    await loadStatus(number, code)
  }

  useEffect(() => {
    if (!initialNumber || !initialCode) return
    setNumber(initialNumber)
    setCode(initialCode)
    void loadStatus(initialNumber, initialCode)
  }, [initialNumber, initialCode])

  return (
    <div
      className={
        embedded
          ? 'space-y-4'
          : 'min-h-dvh bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 py-8'
      }
    >
      {!embedded ? (
        <div className="mx-auto mb-6 flex max-w-xl items-center justify-between">
          <Link to="/apply" className="text-sm font-medium text-sky-700 hover:underline">
            ← Apply online
          </Link>
          <Link to="/login" className="text-sm text-slate-500 hover:underline">
            Sign in
          </Link>
        </div>
      ) : null}

      <Card className={cn('border-sky-100 shadow-md', !embedded && 'mx-auto max-w-xl')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-900">
            <Search className="h-5 w-5" /> Track your application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={(e) => void track(e)}>
            <div className="space-y-1.5">
              <Label>Application number</Label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase())}
                placeholder="HHS-2026-01001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Access code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                required
              />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'View status'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {app ? (
        <div className={cn('mt-6 space-y-4 animate-fade-in', !embedded && 'mx-auto max-w-xl')}>
          <Card className="border-sky-100">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {app.firstName} {app.surname}
                  </p>
                  <p className="font-mono text-sm text-sky-800">{app.applicationNumber}</p>
                  <p className="text-sm text-slate-500">
                    Grade {app.gradeApplyingFor} · {app.applicationType.replace('_', ' ')}
                  </p>
                </div>
                <Badge
                  variant={
                    app.status === 'approved'
                      ? 'success'
                      : app.status === 'rejected'
                        ? 'destructive'
                        : app.status === 'waiting_for_documents'
                          ? 'warning'
                          : 'secondary'
                  }
                >
                  {statusLabel(app.status)}
                </Badge>
              </div>
              {app.missingDocumentsNote ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Documents requested: {app.missingDocumentsNote}
                </p>
              ) : null}
              {app.adminNotes ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Note: {app.adminNotes}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Status history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium">{statusLabel(ev.toStatus as StudentApplication['status'])}</p>
                  {ev.note ? <p className="text-slate-600">{ev.note}</p> : null}
                  <p className="text-[11px] text-slate-400">{formatDateTime(ev.createdAt)}</p>
                </div>
              ))}
              {events.length === 0 ? <p className="text-sm text-slate-500">No events yet.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Documents ({docs.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">{d.fileName}</span>
                  {d.signedUrl ? (
                    <a href={d.signedUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                      Preview
                    </a>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
