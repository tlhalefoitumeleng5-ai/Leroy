import { useEffect, useState } from 'react'
import { ClipboardList, Search, Sparkles } from 'lucide-react'
import { applicationsApi } from '@/services/applications-api'
import {
  ApplicationSuccess,
  StudentApplicationWizard,
} from '@/pages/public/StudentApplicationWizard'
import {
  ApplicationHomePage,
  readSavedApplicationDraftSummary,
} from '@/pages/public/ApplicationHomePage'
import { TrackApplicationPage } from '@/pages/public/TrackApplicationPage'
import { PageHeader, Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DRAFT_STORAGE_KEY } from '@/lib/applications'
import { useAuth } from '@/contexts/auth-context'
import type { ApplicationDocument, StudentApplication, StudentApplicationType } from '@/types'

type Tab = 'apply' | 'track'
type ApplicationFlow = {
  type: StudentApplicationType
  resumeStoredDraft?: boolean
  initialApplication?: StudentApplication
}
type Submission = { application: StudentApplication; documents: ApplicationDocument[] }

/** Full Student Applications module inside the school portal shell. */
export function ApplicationsHubPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('apply')
  const [schoolName, setSchoolName] = useState('School')
  const [submitted, setSubmitted] = useState<Submission | null>(null)
  const [flow, setFlow] = useState<ApplicationFlow | null>(null)
  const [savedDraft, setSavedDraft] = useState(readSavedApplicationDraftSummary)
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [trackCredentials, setTrackCredentials] = useState<{ number: string; code: string } | null>(null)

  useEffect(() => {
    void applicationsApi.getSchoolName().then(setSchoolName)
    void applicationsApi
      .listMyApplications()
      .then(setApplications)
      .catch(() => setApplications([]))
  }, [])

  const isParent = user?.profile.role === 'parent'

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <PageHeader
        title="Student Applications"
        description={
          isParent
            ? 'New learner applications and returning registrations — apply, upload documents, and track status'
            : 'Apply online or track your school application status'
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          type="button"
          variant={tab === 'apply' ? 'default' : 'outline'}
          className={cn(tab === 'apply' && 'bg-sky-600 hover:bg-sky-700')}
          onClick={() => {
            setTab('apply')
            setSubmitted(null)
          }}
        >
          <ClipboardList className="mr-1.5 h-4 w-4" />
          Apply now
        </Button>
        <Button
          type="button"
          variant={tab === 'track' ? 'default' : 'outline'}
          className={cn(tab === 'track' && 'bg-sky-600 hover:bg-sky-700')}
          onClick={() => setTab('track')}
        >
          <Search className="mr-1.5 h-4 w-4" />
          Track status
        </Button>
      </div>

      <Card className="border-sky-100 bg-sky-50/50">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-slate-700">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p>
            Complete personal, parent/guardian and medical details, upload birth certificate, ID, reports and more.
            Use <strong>Ask AI for help</strong> on the form for explanations and translation into all 12 official
            languages. Status updates notify parents by email, WhatsApp and SMS.
          </p>
        </CardContent>
      </Card>

      {tab === 'apply' ? (
        submitted ? (
          <div className="space-y-4">
            <ApplicationSuccess app={submitted.application} documents={submitted.documents} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setTrackCredentials({
                    number: submitted.application.applicationNumber,
                    code: submitted.application.accessCode,
                  })
                  setTab('track')
                }}
              >
                Track this application
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmitted(null)
                  setFlow(null)
                }}
              >
                Start another
              </Button>
            </div>
          </div>
        ) : flow ? (
          <StudentApplicationWizard
            key={`${flow.initialApplication?.id || flow.type}-${flow.resumeStoredDraft ? 'saved' : 'new'}`}
            schoolName={schoolName}
            initialApplicationType={flow.type}
            initialApplication={flow.initialApplication}
            resumeStoredDraft={flow.resumeStoredDraft}
            onSubmitted={(application, documents) => {
              setSubmitted({ application, documents })
              setFlow(null)
              setSavedDraft(null)
              setApplications((current) => [
                application,
                ...current.filter((item) => item.id !== application.id),
              ])
            }}
            onSaveAndExit={() => {
              setFlow(null)
              setSavedDraft(readSavedApplicationDraftSummary())
              void applicationsApi.listMyApplications().then(setApplications).catch(() => undefined)
            }}
          />
        ) : (
          <ApplicationHomePage
            schoolName={schoolName}
            savedDraft={savedDraft}
            applications={applications}
            onStart={(type) => {
              localStorage.removeItem(DRAFT_STORAGE_KEY)
              setSavedDraft(null)
              setFlow({ type })
            }}
            onResumeSaved={() => {
              if (!savedDraft) return
              setFlow({ type: savedDraft.applicationType, resumeStoredDraft: true })
            }}
            onResumeApplication={(application) => {
              localStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify({
                  form: {
                    applicationType: application.applicationType,
                    firstName: application.firstName,
                    surname: application.surname,
                  },
                  meta: {
                    id: application.id,
                    accessCode: application.accessCode,
                    applicationNumber: application.applicationNumber,
                    storageToken: application.storageToken,
                  },
                }),
              )
              setFlow({ type: application.applicationType, initialApplication: application })
            }}
            onTrackApplication={(application) => {
              setTrackCredentials({
                number: application.applicationNumber,
                code: application.accessCode,
              })
              setTab('track')
            }}
          />
        )
      ) : (
        <TrackApplicationPage
          embedded
          initialNumber={trackCredentials?.number}
          initialCode={trackCredentials?.code}
        />
      )}
    </div>
  )
}
