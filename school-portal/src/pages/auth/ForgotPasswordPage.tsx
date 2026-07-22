import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function request(e: React.FormEvent) {
    e.preventDefault()
    try {
      await requestPasswordReset(email)
      setSent(true)
      toast.success('Password reset email sent (check inbox / Supabase Auth logs)')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Supabase Auth will email a secure reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-emerald-600">
              If an account exists for {email}, a reset link has been sent.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={request}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Send reset email
              </Button>
            </form>
          )}
          <Link to="/login" className="mt-4 block text-center text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export function VerifyEmailPage() {
  const { user, verifyEmail } = useAuth()
  const [done, setDone] = useState(false)

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>Confirm your school email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <p className="text-sm">
                Signed in as <strong>{user.email}</strong>
                {user.profile.emailVerified ? ' (already verified)' : ''}
              </p>
              {!user.profile.emailVerified ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    void verifyEmail().then(() => {
                      setDone(true)
                      toast.success('Email verified')
                    })
                  }}
                >
                  Verify my email
                </Button>
              ) : (
                <p className="text-sm text-emerald-600">Your email is verified.</p>
              )}
              {done ? <p className="text-sm text-emerald-600">Verification complete.</p> : null}
              <Link to="/" className="block text-center text-sm text-primary hover:underline">
                Continue to portal
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Sign in first to verify your email.</p>
              <Link to="/login">
                <Button className="w-full">Sign in</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
