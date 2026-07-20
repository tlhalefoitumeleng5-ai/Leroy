import { School } from 'lucide-react'
import { schoolName } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.
 * Demo mode has been removed — live Supabase is required.
 */
export function SupabaseSetupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <School className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-2xl">{schoolName}</CardTitle>
          <CardDescription>Live Supabase connection required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            This School Portal is configured for <strong>production Supabase only</strong> (demo mode
            is disabled). Add your project credentials to <code className="rounded bg-muted px-1">school-portal/.env</code>:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_DEMO_MODE=false
VITE_SCHOOL_NAME=Horizon High School

# For migrations / seeding (server-side only — never ship to the browser)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_ACCESS_TOKEN=sbp_...   # optional Management API token`}</pre>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Open{' '}
              <a className="text-primary underline" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                supabase.com/dashboard
              </a>{' '}
              and create (or open) your project.
            </li>
            <li>Copy Project URL + anon key from Settings → API into `.env`.</li>
            <li>
              Run migrations: <code className="rounded bg-muted px-1">npm run db:migrate</code>
            </li>
            <li>
              Seed users: <code className="rounded bg-muted px-1">npm run db:seed</code>
            </li>
            <li>
              Restart the app: <code className="rounded bg-muted px-1">npm run dev</code>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Paste the credentials in this Cursor chat and I will finish the connection, run migrations,
            seed the database, and give you a phone-ready preview URL.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
