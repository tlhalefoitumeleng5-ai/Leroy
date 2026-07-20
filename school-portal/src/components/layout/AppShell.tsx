import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Bot,
  Calendar,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  School,
  Settings,
  Smartphone,
  Sun,
  Users,
  X,
  FileText,
  Clock,
  Megaphone,
  Shield,
  UserCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { cn, fullName, roleLabel } from '@/lib/utils'
import { api } from '@/services/api'
import { schoolName } from '@/lib/supabase'
import type { UserRole } from '@/types'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

function navForRole(role: UserRole): NavItem[] {
  const icon = (node: React.ReactNode) => node
  switch (role) {
    case 'student':
      return [
        { to: '/student', label: 'Dashboard', icon: icon(<LayoutDashboard className="h-4 w-4" />) },
        { to: '/student/profile', label: 'Profile', icon: icon(<UserCircle className="h-4 w-4" />) },
        { to: '/student/timetable', label: 'Timetable', icon: icon(<Clock className="h-4 w-4" />) },
        { to: '/student/attendance', label: 'Attendance', icon: icon(<ClipboardList className="h-4 w-4" />) },
        { to: '/student/homework', label: 'Homework', icon: icon(<BookOpen className="h-4 w-4" />) },
        { to: '/student/subjects', label: 'Subjects', icon: icon(<GraduationCap className="h-4 w-4" />) },
        { to: '/student/marks', label: 'Marks', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/student/exams', label: 'Exam Results', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/student/ai-tutor', label: 'AI Tutor', icon: icon(<Bot className="h-4 w-4" />) },
        { to: '/student/messages', label: 'Messages', icon: icon(<MessageSquare className="h-4 w-4" />) },
        { to: '/student/fees', label: 'Fees', icon: icon(<CreditCard className="h-4 w-4" />) },
        { to: '/student/announcements', label: 'Announcements', icon: icon(<Megaphone className="h-4 w-4" />) },
        { to: '/student/notifications', label: 'Notifications', icon: icon(<Bell className="h-4 w-4" />) },
        { to: '/student/report-card', label: 'Report Card', icon: icon(<FileText className="h-4 w-4" />) },
      ]
    case 'parent':
      return [
        { to: '/parent', label: 'Dashboard', icon: icon(<LayoutDashboard className="h-4 w-4" />) },
        { to: '/parent/child', label: 'Child Profile', icon: icon(<UserCircle className="h-4 w-4" />) },
        { to: '/parent/attendance', label: 'Attendance', icon: icon(<ClipboardList className="h-4 w-4" />) },
        { to: '/parent/marks', label: 'Marks', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/parent/timetable', label: 'Timetable', icon: icon(<Clock className="h-4 w-4" />) },
        { to: '/parent/fees', label: 'School Fees', icon: icon(<CreditCard className="h-4 w-4" />) },
        { to: '/parent/messages', label: 'Messages', icon: icon(<MessageSquare className="h-4 w-4" />) },
        { to: '/parent/announcements', label: 'Announcements', icon: icon(<Megaphone className="h-4 w-4" />) },
        { to: '/parent/calendar', label: 'Calendar', icon: icon(<Calendar className="h-4 w-4" />) },
        { to: '/parent/notifications', label: 'Notifications', icon: icon(<Bell className="h-4 w-4" />) },
        { to: '/parent/forum', label: 'Community Forum', icon: icon(<MessageSquare className="h-4 w-4" />) },
      ]
    case 'teacher':
      return [
        { to: '/teacher', label: 'Dashboard', icon: icon(<LayoutDashboard className="h-4 w-4" />) },
        { to: '/teacher/marks', label: 'Capture Marks', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/teacher/attendance', label: 'Attendance', icon: icon(<ClipboardList className="h-4 w-4" />) },
        { to: '/teacher/homework', label: 'Assignments', icon: icon(<BookOpen className="h-4 w-4" />) },
        { to: '/teacher/classes', label: 'Classes', icon: icon(<Users className="h-4 w-4" />) },
        { to: '/teacher/subjects', label: 'Subjects', icon: icon(<BookOpen className="h-4 w-4" />) },
        { to: '/teacher/materials', label: 'Learning Material', icon: icon(<BookOpen className="h-4 w-4" />) },
        { to: '/teacher/messages', label: 'Messages', icon: icon(<MessageSquare className="h-4 w-4" />) },
        { to: '/teacher/reports', label: 'Reports', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/teacher/progress', label: 'Student Progress', icon: icon(<GraduationCap className="h-4 w-4" />) },
        { to: '/teacher/timetable', label: 'Timetable', icon: icon(<Clock className="h-4 w-4" />) },
      ]
    case 'school_admin':
      return [
        { to: '/admin', label: 'Dashboard', icon: icon(<LayoutDashboard className="h-4 w-4" />) },
        { to: '/admin/students', label: 'Students', icon: icon(<GraduationCap className="h-4 w-4" />) },
        { to: '/admin/teachers', label: 'Teachers', icon: icon(<Users className="h-4 w-4" />) },
        { to: '/admin/parents', label: 'Parents', icon: icon(<Users className="h-4 w-4" />) },
        { to: '/admin/fees', label: 'School Fees', icon: icon(<CreditCard className="h-4 w-4" />) },
        { to: '/admin/subjects', label: 'Subjects', icon: icon(<BookOpen className="h-4 w-4" />) },
        { to: '/admin/classes', label: 'Classes', icon: icon(<School className="h-4 w-4" />) },
        { to: '/admin/timetable', label: 'Timetable', icon: icon(<Clock className="h-4 w-4" />) },
        { to: '/admin/admissions', label: 'Admissions', icon: icon(<ClipboardList className="h-4 w-4" />) },
        { to: '/admin/announcements', label: 'Announcements', icon: icon(<Megaphone className="h-4 w-4" />) },
        { to: '/admin/whatsapp', label: 'WhatsApp & AI', icon: icon(<Smartphone className="h-4 w-4" />) },
        { to: '/admin/messages', label: 'Messages', icon: icon(<MessageSquare className="h-4 w-4" />) },
        { to: '/admin/reports', label: 'Reports', icon: icon(<FileText className="h-4 w-4" />) },
        { to: '/admin/calendar', label: 'Calendar', icon: icon(<Calendar className="h-4 w-4" />) },
        { to: '/admin/audit', label: 'Audit Logs', icon: icon(<Shield className="h-4 w-4" />) },
      ]
    case 'super_admin':
      return [
        { to: '/super', label: 'Dashboard', icon: icon(<LayoutDashboard className="h-4 w-4" />) },
        { to: '/super/schools', label: 'Schools', icon: icon(<School className="h-4 w-4" />) },
        { to: '/super/users', label: 'All Users', icon: icon(<Users className="h-4 w-4" />) },
        { to: '/super/audit', label: 'System Audit', icon: icon(<Shield className="h-4 w-4" />) },
        { to: '/admin', label: 'School Admin', icon: icon(<Settings className="h-4 w-4" />) },
      ]
    default:
      return []
  }
}

export function AppShell() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = user ? api.getNotifications(user.id).filter((n) => !n.isRead).length : 0

  const items = useMemo(() => (user ? navForRole(user.profile.role) : []), [user])

  if (!user) return null

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] border-r border-border bg-card/95 backdrop-blur transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <School className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-bold leading-tight truncate">{schoolName}</p>
              <p className="text-xs text-muted-foreground">School Portal</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length <= 2}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-border p-3 space-y-2">
            <NavLink
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Account & Security
            </NavLink>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                void logout().then(() => navigate('/login'))
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fullName(user.profile.firstName, user.profile.lastName)}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(user.profile.role)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => {
              const base =
                user.profile.role === 'parent'
                  ? '/parent/notifications'
                  : user.profile.role === 'student'
                    ? '/student/notifications'
                    : '/account'
              navigate(base)
            }}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                {unread}
              </span>
            ) : null}
          </Button>
        </header>
        <main className="flex-1 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
