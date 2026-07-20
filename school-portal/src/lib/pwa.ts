import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

/** Registers the service worker and prompts when an update is available. */
export function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      // SW ready — offline caching active
    },
    onRegisterError() {
      // Non-fatal in demo / local preview
    },
  })

  useEffect(() => {
    if (needRefresh) {
      toast.message('Update available', {
        action: {
          label: 'Refresh',
          onClick: () => updateServiceWorker(true),
        },
        duration: 10000,
      })
      setNeedRefresh(false)
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}

/** Request browser notification permission (push-ready hook). */
export async function enablePushNotifications() {
  if (!('Notification' in window)) {
    toast.error('Notifications are not supported on this device')
    return false
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    toast.error('Notification permission denied')
    return false
  }
  toast.success('Push notifications enabled')
  if (Notification.permission === 'granted') {
    new Notification('School Portal', {
      body: 'You will receive attendance and marks alerts.',
      icon: '/icons/icon-192.png',
    })
  }
  return true
}
