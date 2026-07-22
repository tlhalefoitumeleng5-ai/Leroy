import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Search } from 'lucide-react'
import { applicationsApi } from '@/services/applications-api'
import {
  ApplicationSuccess,
  StudentApplicationWizard,
} from '@/pages/public/StudentApplicationWizard'
import { Button } from '@/components/ui/button'
import type { StudentApplication } from '@/types'

export function StudentApplicationsPublicPage() {
  const [schoolName, setSchoolName] = useState('School')
  const [submitted, setSubmitted] = useState<StudentApplication | null>(null)

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
          <ApplicationSuccess app={submitted} />
          <div className="mx-auto flex max-w-lg justify-center gap-2">
            <Link to="/apply/track">
              <Button>Track status</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(null)
              }}
            >
              New application
            </Button>
          </div>
        </div>
      ) : (
        <StudentApplicationWizard schoolName={schoolName} onSubmitted={setSubmitted} />
      )}
    </div>
  )
}
