import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { School, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { homeForRole } from '@/components/layout/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { schoolName } from '@/lib/supabase'

const QUICK_ACCOUNTS = [
  { email: 'admin@horizonhigh.edu.za', role: 'School Administrator' },
  { email: 'sipho.nkosi@horizonhigh.edu.za', role: 'Teacher' },
  { email: 'lindiwe.molefe@email.com', role: 'Parent' },
  { email: 'kagiso.molefe@student.horizonhigh.edu.za', role: 'Student' },
  { email: 'super@schoolportal.za', role: 'Super Administrator' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(QUICK_ACCOUNTS[3].email)
  const [password, setPassword] = useState('Password123!')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homeForRole(user.profile.role)} replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password, remember)
      toast.success('Welcome back')
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#dbeafe_100%)] dark:bg-[linear-gradient(135deg,#0b1220_0%,#121a2b_50%,#1e3a5f_100%)]" />

      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <School className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary">{schoolName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Secure School Portal · Live Supabase Auth</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your school email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShow((s) => !s)}
                    aria-label="Toggle password"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-input"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 text-center text-sm">
              <Link to="/apply" className="text-primary hover:underline">
                Online application
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/verify-email" className="text-primary hover:underline">
                Verify email
              </Link>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Seeded accounts (after npm run db:seed) · Password123!
              </p>
              <div className="space-y-1">
                {QUICK_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-card"
                    onClick={() => {
                      setEmail(a.email)
                      setPassword('Password123!')
                    }}
                  >
                    <span className="font-medium">{a.role}</span>
                    <span className="ml-2 text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
