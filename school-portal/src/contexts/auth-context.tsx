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
import { hasSupabaseConfig, requireSupabase } from '@/lib/supabase'
import { api } from '@/services/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isDemoMode: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  changePassword: (current: string, next: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<string>
  verifyEmail: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    schoolId: String(row.school_id ?? ''),
    role: row.role as UserRole,
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    gender: row.gender as Profile['gender'],
    address: row.address ? String(row.address) : undefined,
    isActive: Boolean(row.is_active ?? true),
    emailVerified: Boolean(row.email_verified ?? false),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = requireSupabase()
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? mapProfile(data) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig) {
      setUser(null)
      setLoading(false)
      return
    }
    const sb = requireSupabase()
    const { data } = await sb.auth.getSession()
    const sessionUser = data.session?.user
    if (!sessionUser) {
      setUser(null)
      setLoading(false)
      return
    }
    const profile = await fetchProfile(sessionUser.id)
    if (!profile || !profile.isActive) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      await api.refresh()
    } catch (e) {
      console.error('Failed to load school data', e)
    }
    setUser({ id: sessionUser.id, email: sessionUser.email ?? profile.email, profile })
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    if (!hasSupabaseConfig) return
    const sb = requireSupabase()
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const login = useCallback(async (email: string, password: string, _remember = true) => {
    const sb = requireSupabase()
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Login failed')
    const profile = await fetchProfile(data.user.id)
    if (!profile) throw new Error('Profile missing. Run npm run db:seed')
    if (!profile.isActive) throw new Error('This account has been deactivated.')
    await api.refresh()
    await sb.from('audit_logs').insert({
      school_id: profile.schoolId || null,
      actor_id: profile.id,
      action: 'LOGIN',
      entity_type: 'session',
    })
    setUser({ id: data.user.id, email: data.user.email ?? profile.email, profile })
  }, [])

  const logout = useCallback(async () => {
    if (hasSupabaseConfig) {
      const sb = requireSupabase()
      if (user) {
        await sb.from('audit_logs').insert({
          school_id: user.profile.schoolId || null,
          actor_id: user.id,
          action: 'LOGOUT',
          entity_type: 'session',
        })
      }
      await sb.auth.signOut()
    }
    setUser(null)
  }, [user])

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return
      const sb = requireSupabase()
      const payload: Record<string, unknown> = {}
      if (patch.firstName !== undefined) payload.first_name = patch.firstName
      if (patch.lastName !== undefined) payload.last_name = patch.lastName
      if (patch.phone !== undefined) payload.phone = patch.phone
      if (patch.address !== undefined) payload.address = patch.address
      if (patch.avatarUrl !== undefined) payload.avatar_url = patch.avatarUrl
      if (patch.emailVerified !== undefined) payload.email_verified = patch.emailVerified
      const { data, error } = await sb.from('profiles').update(payload).eq('id', user.id).select('*').single()
      if (error) throw error
      const profile = mapProfile(data)
      setUser({ id: user.id, email: profile.email, profile })
    },
    [user],
  )

  const changePassword = useCallback(async (current: string, next: string) => {
    if (!user) throw new Error('Not authenticated')
    if (next.length < 8) throw new Error('Password must be at least 8 characters.')
    const sb = requireSupabase()
    const { error: reauthError } = await sb.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (reauthError) throw new Error('Current password is incorrect.')
    const { error } = await sb.auth.updateUser({ password: next })
    if (error) throw new Error(error.message)
    await sb.from('audit_logs').insert({
      school_id: user.profile.schoolId || null,
      actor_id: user.id,
      action: 'CHANGE_PASSWORD',
      entity_type: 'profile',
      entity_id: user.id,
    })
  }, [user])

  const requestPasswordReset = useCallback(async (email: string) => {
    const sb = requireSupabase()
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) throw new Error(error.message)
    return 'EMAIL_SENT'
  }, [])

  const verifyEmail = useCallback(async () => {
    if (!user) return
    await updateProfile({ emailVerified: true })
  }, [user, updateProfile])

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.profile.role),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemoMode: false,
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
