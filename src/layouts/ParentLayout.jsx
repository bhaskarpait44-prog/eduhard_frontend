import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpenText,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { ROUTES } from '@/constants/app'
import { getInitials } from '@/utils/helpers'
import { getParentNotices } from '@/api/noticesApi'

const PARENT_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.PARENT_DASHBOARD },
  { label: 'My Wards', icon: Users, path: ROUTES.PARENT_WARDS },
  { label: 'Attendance', icon: CalendarDays, path: ROUTES.PARENT_ATTENDANCE },
  { label: 'Fees & Dues', icon: Wallet, path: ROUTES.PARENT_FEES },
  { label: 'Results', icon: ClipboardList, path: ROUTES.PARENT_RESULTS },
  { label: 'Notices', icon: Bell, path: ROUTES.PARENT_NOTICES },
]

const MOBILE_TABS = [
  { label: 'Home', icon: LayoutDashboard, path: ROUTES.PARENT_DASHBOARD },
  { label: 'Wards', icon: Users, path: ROUTES.PARENT_WARDS },
  { label: 'Fees', icon: Wallet, path: ROUTES.PARENT_FEES },
  { label: 'Notices', icon: Bell, path: ROUTES.PARENT_NOTICES },
]

export default function ParentLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadNotices, setUnreadNotices] = useState(0)

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const res = await getParentNotices()
        setUnreadNotices(Number(res?.data?.unread_count || 0))
      } catch (err) {
        console.error('Failed to fetch parent unread count', err)
      }
    }
    loadUnread()
    window.addEventListener('focus', loadUnread)
    return () => window.removeEventListener('focus', loadUnread)
  }, [location.pathname])

  const initials = useMemo(() => getInitials(user?.name || 'Parent'), [user?.name])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-72 flex-col sticky top-0 h-screen"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200/40">
              EC
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                EduCore
              </h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Parent Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            {PARENT_MENU.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      : 'hover:bg-surface-raised'}
                  `}
                  style={({ isActive }) => ({
                    color: isActive ? undefined : 'var(--color-text-secondary)',
                  })}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.label === 'Notices' && unreadNotices > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {unreadNotices}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div
          className="mt-auto p-6"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-bold truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {user?.name || 'Parent'}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Guardian
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:text-red-500 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <header
          className="h-16 md:h-20 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">EC</div>
            <span
              className="font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              EduCore
            </span>
          </div>

          <div className="hidden md:block">
            <h2
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {PARENT_MENU.find(m => m.path === location.pathname)?.label || 'Parent Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(ROUTES.PARENT_NOTICES)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
            >
              <Bell size={20} />
              {unreadNotices > 0 && (
                <span
                  className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"
                  style={{ border: '2px solid var(--color-surface)' }}
                />
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold md:hidden">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 px-6 py-3 z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.08)]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const active = location.pathname === tab.path
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
              style={({ isActive }) => ({ color: isActive ? undefined : 'var(--color-text-muted)' })}
            >
              <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
