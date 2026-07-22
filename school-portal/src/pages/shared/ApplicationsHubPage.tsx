import { useEffect, useState } from 'react'
import { ClipboardList, Search, Sparkles } from 'lucide-react'
import { applicationsApi } from '@/services/applications-api'
import {
  ApplicationSuccess,
  StudentApplicationWizard,
} from '@/pages/public/StudentApplicationWizard'
import { TrackApplicationPage } from '@/pages/public/TrackApplicationPage'
import { PageHeader, Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { StudentApplication } from '@/types'

type Tab = 'apply' | 'track'

/** Full Student Applications module inside the school portal shell. */
export function ApplicationsHubPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('apply')
  const [schoolName, setSchoolName] = useState('School')
  const [submitted, setSubmitted] = useState<StudentApplication | null>(null)

  useEffect(() => {
    void applicationsApi.getSchoolName().then(setSchoolName)
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
            <ApplicationSuccess app={submitted} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setTab('track')}>
                Track this application
              </Button>
              <Button type="button" variant="outline" onClick={() => setSubmitted(null)}>
                Start another
              </Button>
            </div>
          </div>
        ) : (
          <StudentApplicationWizard schoolName={schoolName} onSubmitted={setSubmitted} />
        )
      ) : (
        <TrackApplicationPage embedded />
      )}
    </div>
  )
}
