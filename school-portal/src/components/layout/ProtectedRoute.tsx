import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types'

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.profile.role)) {
    return <Navigate to={homeForRole(user.profile.role)} replace />
  }

  return <Outlet />
}

export function homeForRole(role: UserRole) {
  switch (role) {
    case 'student':
      return '/student'
    case 'parent':
      return '/parent'
    case 'teacher':
      return '/teacher'
    case 'school_admin':
      return '/admin'
    case 'super_admin':
      return '/super'
    default:
      return '/login'
  }
}
