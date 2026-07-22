import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search } from 'lucide-react'
import { applicationsApi } from '@/services/applications-api'
import {
  ApplicationSuccess,
  StudentApplicationWizard,
} from '@/pages/public/StudentApplicationWizard'
import {
  ApplicationHomePage,
  readSavedApplicationDraftSummary,
} from '@/pages/public/ApplicationHomePage'
import { Button } from '@/components/ui/button'
import { DRAFT_STORAGE_KEY } from '@/lib/applications'
import type { ApplicationDocument, StudentApplication, StudentApplicationType } from '@/types'

type Submission = { application: StudentApplication; documents: ApplicationDocument[] }

export function StudentApplicationsPublicPage() {
  const [schoolName, setSchoolName] = useState('School')
  const [submitted, setSubmitted] = useState<Submission | null>(null)
  const [applicationType, setApplicationType] = useState<StudentApplicationType | null>(null)
  const [resumeStoredDraft, setResumeStoredDraft] = useState(false)
  const [savedDraft, setSavedDraft] = useState(readSavedApplicationDraftSummary)

  useEffect(() => {
    void applicationsApi.getSchoolName().then(setSchoolName)
  }, [])

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link to="/login" className="text-sm font-medium text-sky-700 hover:underline">
          ← Back to sign in
        </Link>
        <div className="flex gap-2">
          <Link to="/apply/track">
            <Button variant="outline" size="sm">
              <Search className="mr-1 h-4 w-4" /> Track application
            </Button>
          </Link>
          <Link to="/apply">
            <Button size="sm" variant="secondary">
              <ClipboardList className="mr-1 h-4 w-4" /> Apply
            </Button>
          </Link>
        </div>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <ApplicationSuccess app={submitted.application} documents={submitted.documents} />
          <div className="mx-auto flex max-w-lg justify-center gap-2">
            <Link to="/apply/track">
              <Button>Track status</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(null)
                setApplicationType(null)
              }}
            >
              New application
            </Button>
          </div>
        </div>
      ) : applicationType ? (
        <StudentApplicationWizard
          key={`${applicationType}-${resumeStoredDraft ? 'saved' : 'new'}`}
          schoolName={schoolName}
          initialApplicationType={applicationType}
          resumeStoredDraft={resumeStoredDraft}
          onSubmitted={(application, documents) => {
            setSubmitted({ application, documents })
            setApplicationType(null)
            setSavedDraft(null)
          }}
          onSaveAndExit={() => {
            setApplicationType(null)
            setResumeStoredDraft(false)
            setSavedDraft(readSavedApplicationDraftSummary())
          }}
        />
      ) : (
        <ApplicationHomePage
          schoolName={schoolName}
          savedDraft={savedDraft}
          onStart={(type) => {
            localStorage.removeItem(DRAFT_STORAGE_KEY)
            setSavedDraft(null)
            setResumeStoredDraft(false)
            setApplicationType(type)
          }}
          onResumeSaved={() => {
            if (!savedDraft) return
            setResumeStoredDraft(true)
            setApplicationType(savedDraft.applicationType)
          }}
        />
      )}
    </div>
  )
}
