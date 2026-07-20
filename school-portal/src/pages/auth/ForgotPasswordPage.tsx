import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
// toast used for verify + reset feedback
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<'request' | 'reset'>('request')

  async function request(e: React.FormEvent) {
    e.preventDefault()
    try {
      const t = await requestPasswordReset(email)
      setToken(t)
      setStep('reset')
      toast.success('Reset code generated (demo email simulation)')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  function reset(e: React.FormEvent) {
    e.preventDefault()
    const saved = localStorage.getItem(`reset_${email}`)
    if (!token || saved !== token) {
      toast.error('Invalid reset code')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    api.setPassword(email, newPassword)
    localStorage.removeItem(`reset_${email}`)
    toast.success('Password updated. You can sign in now.')
    setStep('request')
    setToken(null)
    setNewPassword('')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We will issue a secure reset code to your email</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <form className="space-y-4" onSubmit={request}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Send reset code
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={reset}>
              <div className="rounded-lg bg-muted p-3 text-sm">
                Demo reset code: <span className="font-mono font-bold">{token}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">New password</Label>
                <Input
                  id="np"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Update password
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
                    verifyEmail()
                    setDone(true)
                    toast.success('Email verified')
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
