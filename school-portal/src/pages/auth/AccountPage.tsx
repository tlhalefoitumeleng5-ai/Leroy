import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { PageHeader, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { enablePushNotifications } from '@/lib/pwa'
import { api } from '@/services/api'
import { formatDateTime } from '@/lib/utils'

export function AccountPage() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const [firstName, setFirstName] = useState(user?.profile.firstName ?? '')
  const [lastName, setLastName] = useState(user?.profile.lastName ?? '')
  const [phone, setPhone] = useState(user?.profile.phone ?? '')
  const [address, setAddress] = useState(user?.profile.address ?? '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  if (!user) return null

  const notifications = api.getNotifications(user.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Account & Security" description="Manage your profile, password, and notifications" />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              updateProfile({ firstName, lastName, phone, address })
              toast.success('Profile updated')
            }}
          >
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              if (next !== confirm) {
                toast.error('Passwords do not match')
                return
              }
              try {
                await changePassword(current, next)
                toast.success('Password changed')
                setCurrent('')
                setNext('')
                setConfirm('')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed')
              }
            }}
          >
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void enablePushNotifications()}>
              Enable push
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                api.markAllRead(user.id)
                toast.success('All marked as read')
              }}
            >
              Mark all read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications</p>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                className={`w-full rounded-lg border border-border p-3 text-left transition hover:bg-muted/50 ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                onClick={() => api.markNotificationRead(n.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={logout}>
        Sign out
      </Button>
    </div>
  )
}
