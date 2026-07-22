import { ClipboardCheck, FileClock, RefreshCw, UserPlus } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DRAFT_STORAGE_KEY, statusLabel } from '@/lib/applications'
import type { StudentApplication, StudentApplicationType } from '@/types'

export interface SavedApplicationDraftSummary {
  applicationType: StudentApplicationType
  applicationNumber?: string
  learnerName?: string
}

export function readSavedApplicationDraftSummary(): SavedApplicationDraftSummary | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as {
      form?: { applicationType?: StudentApplicationType; firstName?: string; surname?: string }
      meta?: { applicationNumber?: string }
    }
    if (!saved.form?.applicationType) return null
    return {
      applicationType: saved.form.applicationType,
      applicationNumber: saved.meta?.applicationNumber,
      learnerName: [saved.form.firstName, saved.form.surname].filter(Boolean).join(' ') || undefined,
    }
  } catch {
    return null
  }
}

export function ApplicationHomePage({
  schoolName,
  savedDraft,
  applications = [],
  onStart,
  onResumeSaved,
  onResumeApplication,
  onTrackApplication,
}: {
  schoolName: string
  savedDraft?: SavedApplicationDraftSummary | null
  applications?: StudentApplication[]
  onStart: (type: StudentApplicationType) => void
  onResumeSaved?: () => void
  onResumeApplication?: (application: StudentApplication) => void
  onTrackApplication?: (application: StudentApplication) => void
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{schoolName}</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-slate-950 sm:text-3xl">Applications</h2>
        <p className="mt-2 text-sm text-slate-600">Choose the application that you want to complete.</p>
      </div>

      {savedDraft && onResumeSaved ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileClock className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-950">Continue your saved draft</p>
                <p className="text-sm text-amber-800">
                  {savedDraft.learnerName || 'Student application'}
                  {savedDraft.applicationNumber ? ` · ${savedDraft.applicationNumber}` : ''}
                </p>
              </div>
            </div>
            <Button type="button" className="bg-amber-700 hover:bg-amber-800" onClick={onResumeSaved}>
              Continue draft
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group overflow-hidden border-sky-200 bg-gradient-to-br from-sky-50 to-blue-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="pt-3 text-xl text-sky-950">New Student Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-sky-900">Apply for admission to this school.</p>
            <Button
              type="button"
              className="w-full bg-sky-600 hover:bg-sky-700"
              onClick={() => onStart('new_student')}
            >
              Start Application
            </Button>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <RefreshCw className="h-6 w-6" />
            </div>
            <CardTitle className="pt-3 text-xl text-emerald-950">Returning Student Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-emerald-900">Register for the next academic year.</p>
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onStart('returning_student')}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>

      {applications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-sky-700" />
              Your applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {applications.map((application) => (
              <div
                key={application.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {application.firstName || 'Student'} {application.surname}
                  </p>
                  <p className="font-mono text-xs text-slate-500">{application.applicationNumber}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={application.status === 'approved' ? 'success' : 'secondary'}>
                    {statusLabel(application.status)}
                  </Badge>
                  {application.isDraft && onResumeApplication ? (
                    <Button type="button" size="sm" onClick={() => onResumeApplication(application)}>
                      Continue draft
                    </Button>
                  ) : onTrackApplication ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onTrackApplication(application)}
                    >
                      View status
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
