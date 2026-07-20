import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser, Profile, UserRole } from '@/types'
import { api } from '@/services/api'
import { isDemoMode } from '@/lib/supabase'

const SESSION_KEY = 'school_portal_session'
const REMEMBER_KEY = 'school_portal_remember'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isDemoMode: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => void
  updateProfile: (patch: Partial<Profile>) => void
  changePassword: (current: string, next: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<string>
  verifyEmail: () => void
  hasRole: (...roles: UserRole[]) => boolean
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    const profile = api.getProfile(parsed.id)
    if (!profile || !profile.isActive) return null
    return { id: profile.id, email: profile.email, profile }
  } catch {
    return null
  }
}

function persistSession(user: AuthUser | null, remember: boolean) {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  if (!user) return
  const raw = JSON.stringify(user)
  if (remember) localStorage.setItem(SESSION_KEY, raw)
  else sessionStorage.setItem(SESSION_KEY, raw)
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  useEffect(() => {
    setUser(loadSession())
    setLoading(false)
    return api.subscribe(() => setTick((t) => t + 1))
  }, [])

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const profile = api.findProfileByEmail(email.trim())
    if (!profile) throw new Error('No account found with that email.')
    if (!api.verifyPassword(profile.email, password)) throw new Error('Incorrect password.')
    if (!profile.isActive) throw new Error('This account has been deactivated.')
    const authUser: AuthUser = { id: profile.id, email: profile.email, profile }
    persistSession(authUser, remember)
    api.addAudit(profile.id, 'LOGIN', 'session')
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    if (user) api.addAudit(user.id, 'LOGOUT', 'session')
    persistSession(null, false)
    setUser(null)
  }, [user])

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      if (!user) return
      const updated = api.updateProfile(user.id, patch)
      if (updated) {
        const next = { ...user, email: updated.email, profile: updated }
        const remember = localStorage.getItem(REMEMBER_KEY) === '1'
        persistSession(next, remember)
        setUser(next)
      }
    },
    [user],
  )

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!user) throw new Error('Not authenticated')
      if (!api.verifyPassword(user.email, current)) throw new Error('Current password is incorrect.')
      if (next.length < 8) throw new Error('Password must be at least 8 characters.')
      api.setPassword(user.email, next)
      api.addAudit(user.id, 'CHANGE_PASSWORD', 'profile', user.id)
    },
    [user],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    const profile = api.findProfileByEmail(email.trim())
    if (!profile) throw new Error('No account found with that email.')
    const token = crypto.randomUUID().slice(0, 8).toUpperCase()
    localStorage.setItem(`reset_${profile.email}`, token)
    // Demo: password reset token shown to user (email simulation)
    return token
  }, [])

  const verifyEmail = useCallback(() => {
    if (!user) return
    updateProfile({ emailVerified: true })
  }, [user, updateProfile])

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.profile.role),
    [user],
  )

  const refresh = useCallback(() => {
    setUser(loadSession())
    setTick((t) => t + 1)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemoMode,
      login,
      logout,
      updateProfile,
      changePassword,
      requestPasswordReset,
      verifyEmail,
      hasRole,
      refresh,
    }),
    [
      user,
      loading,
      login,
      logout,
      updateProfile,
      changePassword,
      requestPasswordReset,
      verifyEmail,
      hasRole,
      refresh,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
