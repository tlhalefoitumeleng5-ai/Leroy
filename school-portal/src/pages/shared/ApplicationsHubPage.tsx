import { Link } from 'react-router-dom'
import { ClipboardList, Search, Sparkles } from 'lucide-react'
import { PageHeader, Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

/** In-portal hub so students/parents can open Applications from the sidebar. */
export function ApplicationsHubPage() {
  const { user } = useAuth()
  const isParent = user?.profile.role === 'parent'

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in pb-8">
      <PageHeader
        title="Applications"
        description={
          isParent
            ? 'Apply for a new or returning learner, or track an existing application'
            : 'Start or track a school application'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-sky-950">New application</h2>
            <p className="text-sm text-slate-600">
              New student or returning registration — personal details, parent info, medical form, and document uploads.
            </p>
            <Link to="/apply">
              <Button className="w-full sm:w-auto">Start application</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <CardContent className="space-y-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-indigo-950">Track status</h2>
            <p className="text-sm text-slate-600">
              Enter your application number and access code to see Pending, Under Review, Approved, and more.
            </p>
            <Link to="/apply/track">
              <Button variant="outline" className="w-full sm:w-auto">
                Track application
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <p>
            Need help filling the form? Open an application and use the <strong>Ask AI for help</strong> button — it can
            explain every field and translate into all 12 official South African languages.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
