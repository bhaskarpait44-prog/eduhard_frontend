import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookMarked,
  BookOpenText,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  ScrollText,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import * as studentApi from '@/api/studentApi'
import { ROUTES } from '@/constants/app'
import { cn, getInitials } from '@/utils/helpers'

const studentMenu = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.STUDENT_DASHBOARD },
      { label: 'My Attendance', icon: CalendarDays, path: ROUTES.STUDENT_ATTENDANCE },
      { label: 'My Timetable', icon: BookMarked, path: ROUTES.STUDENT_TIMETABLE },
      { label: 'Academic Calendar', icon: CalendarDays, path: ROUTES.STUDENT_CALENDAR },
      { label: 'Teacher Chat', icon: MessageSquare, path: ROUTES.STUDENT_CHAT },
      { label: 'Notice Board', icon: Bell, path: ROUTES.STUDENT_NOTICES },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'My Results', icon: ClipboardList, path: ROUTES.STUDENT_RESULTS },
      { label: 'Report Card', icon: FileBarChart2, path: ROUTES.STUDENT_REPORT_CARD },
      { label: 'Homework', icon: ScrollText, path: ROUTES.STUDENT_HOMEWORK },
      { label: 'My Submissions', icon: ShieldCheck, path: ROUTES.STUDENT_HOMEWORK_SUBMISSIONS },
      { label: 'Academic History', icon: GraduationCap, path: ROUTES.STUDENT_HISTORY },
      { label: 'Study Materials', icon: BookOpenText, path: ROUTES.STUDENT_MATERIALS },
      { label: 'My Library', icon: BookMarked, path: ROUTES.STUDENT_LIBRARY },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'My Fees', icon: CreditCard, path: ROUTES.STUDENT_FEES },
      { label: 'Payment History', icon: Receipt, path: ROUTES.STUDENT_FEE_PAYMENTS },
    ],
  },
  {
    label: 'Profile',
    items: [
      { label: 'My Profile', icon: UserRound, path: ROUTES.STUDENT_PROFILE },
      { label: 'Request Correction', icon: ShieldCheck, path: ROUTES.STUDENT_PROFILE_CORRECTION },
      { label: 'Change Password', icon: ShieldCheck, path: ROUTES.STUDENT_PROFILE_PASSWORD },
    ],
  },
]

const mobileTabs = [
  { label: 'Home', icon: LayoutDashboard, path: ROUTES.STUDENT_DASHBOARD },
  { label: 'Attendance', icon: CalendarDays, path: ROUTES.STUDENT_ATTENDANCE },
  { label: 'Results', icon: ClipboardList, path: ROUTES.STUDENT_RESULTS },
  { label: 'Chat', icon: MessageSquare, path: ROUTES.STUDENT_CHAT },
  { label: 'Fees', icon: CreditCard, path: ROUTES.STUDENT_FEES },
]

const studentThemeVars = {
  '--color-brand': '#4f46e5',
  '--color-brand-light': '#6366f1',
  '--color-brand-dark': '#3730a3',
  '--color-bg': '#f8fafc',
  '--color-surface': '#ffffff',
  '--color-surface-raised': '#f1f5f9',
  '--color-border': '#e2e8f0',
  '--color-text-primary': '#0f172a',
  '--color-text-secondary': '#475569',
  '--color-text-muted': '#94a3b8',
  '--color-sidebar-bg': '#ffffff',
  '--color-sidebar-text': '#1e293b',
  '--color-sidebar-muted': '#64748b',
  '--color-sidebar-active': '#4f46e5',
  '--color-sidebar-hover': '#f1f5f9',
  '--color-sidebar-border': '#e2e8f0',
  '--color-sidebar-card': '#ffffff',
  '--student-accent': '#4f46e5',
  '--student-accent-soft': 'rgba(79, 70, 229, 0.08)',
  '--student-tab-bg': 'rgba(255, 255, 255, 0.8)',
}

const StudentLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useUiStore()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [unreadNotices, setUnreadNotices] = useState(0)

  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    let active = true

    const loadUnread = async () => {
      try {
        const res = await studentApi.getStudentNotices()
        if (!active) return
        setUnreadNotices(Number(res?.data?.unread_count || 0))
      } catch {}
    }

    loadUnread()
    window.addEventListener('focus', loadUnread)
    return () => {
      active = false
      window.removeEventListener('focus', loadUnread)
    }
  }, [location.pathname])

  const studentName = user?.name || 'Student'
  const activeTab = useMemo(
    () => mobileTabs.find((item) => location.pathname.startsWith(item.path))?.path || ROUTES.STUDENT_DASHBOARD,
    [location.pathname]
  )

  /* Resolve current page label for the header */
  const currentPageLabel = useMemo(() => {
    for (const group of studentMenu) {
      const match = group.items.find((item) => location.pathname.startsWith(item.path))
      if (match) return match.label
    }
    return 'Student Portal'
  }, [location.pathname])

  return (
    <div
      className="min-h-screen"
      style={studentThemeVars}
    >
      <div className="dark:[--color-bg:#0f172a] dark:[--color-surface:#1e293b] dark:[--color-surface-raised:#334155] dark:[--color-border:#334155] dark:[--color-text-primary:#f8fafc] dark:[--color-text-secondary:#cbd5e1] dark:[--color-text-muted:#64748b] dark:[--color-sidebar-bg:#0f172a] dark:[--color-sidebar-text:#f8fafc] dark:[--color-sidebar-muted:#94a3b8] dark:[--color-sidebar-hover:#1e293b] dark:[--color-sidebar-border:#334155] dark:[--color-sidebar-card:#1e293b] dark:[--student-tab-bg:rgba(15,23,42,0.8)] dark:[--student-accent-soft:rgba(99,102,241,0.15)] dark:[--student-accent:#6366f1] min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300">

        {/* ── Desktop Sidebar ── */}
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col xl:flex"
          style={{ backgroundColor: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-sidebar-border)' }}
        >
          {/* Sidebar Brand Header */}
          <div
            className="px-4 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-light), var(--color-brand))', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
              >
                {getInitials(studentName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold" style={{ color: 'var(--color-sidebar-text)' }}>{studentName}</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-sidebar-muted)' }}>Student Portal</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {studentMenu.map((group) => (
              <div key={group.label}>
                <p
                  className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--color-sidebar-muted)' }}
                >
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                          )
                        }
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                          color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                           boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.20)' : 'none',
                        })}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                              style={{
                                backgroundColor: isActive ? 'rgba(255,255,255,0.20)' : 'var(--student-accent-soft)',
                                color: isActive ? '#fff' : 'var(--color-sidebar-active)',
                              }}
                            >
                              <Icon size={15} />
                            </span>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0">
                                {unreadNotices > 9 ? '9+' : unreadNotices}
                              </span>
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-left transition hover:opacity-80"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Mobile Drawer ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-[85vw] sm:w-80 max-w-xs flex-col"
              style={{ backgroundColor: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-sidebar-border)' }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--color-brand-light), var(--color-brand))' }}
                  >
                    {getInitials(studentName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold" style={{ color: 'var(--color-sidebar-text)' }}>{studentName}</p>
                    <p className="text-[11px]" style={{ color: 'var(--color-sidebar-muted)' }}>Student Portal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border shrink-0 transition hover:opacity-70"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Close navigation"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {studentMenu.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.20em]" style={{ color: 'var(--color-sidebar-muted)' }}>
                       {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200"
                            style={({ isActive }) => ({
                              backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                              color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                              boxShadow: isActive ? '0 2px 8px rgba(79,70,229,0.20)' : 'none',
                            })}
                          >
                            {({ isActive }) => (
                              <>
                                <span
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                  style={{
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.20)' : 'var(--student-accent-soft)',
                                    color: isActive ? '#fff' : 'var(--color-sidebar-active)',
                                  }}
                                >
                                  <Icon size={15} />
                                </span>
                                <span className="truncate flex-1">{item.label}</span>
                                {item.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0">
                                    {unreadNotices > 9 ? '9+' : unreadNotices}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-left transition hover:opacity-80"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}
                >
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="xl:pl-72">
          {/* Header */}
          <header
            className="sticky top-0 z-30 backdrop-blur-xl"
            style={{ backgroundColor: 'var(--student-tab-bg)', borderBottom: '1px solid var(--color-border)' }}
          >
            {isOffline && (
              <div className="border-b px-4 py-2 text-center text-xs font-semibold text-amber-900 dark:text-amber-100" style={{ backgroundColor: '#fde68a', borderColor: '#fcd34d' }}>
                ⚡ You are offline — showing last saved data.
              </div>
            )}

            <div className="flex items-center gap-3 px-4 sm:px-5 py-3">
              {/* Hamburger (mobile) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border xl:hidden shrink-0 transition hover:opacity-70"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                aria-label="Open navigation"
              >
                <Menu size={17} />
              </button>

              {/* Page title */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{currentPageLabel}</p>
                <p className="hidden sm:block truncate text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Student Portal — Personal school companion</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Notices bell */}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_NOTICES)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-70"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Open notices"
                >
                  <Bell size={17} />
                  {unreadNotices > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[9px] font-bold leading-[18px] text-white text-center">
                      {unreadNotices > 9 ? '9+' : unreadNotices}
                    </span>
                  ) : null}
                </button>

                {/* Dark mode toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-70"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Toggle dark mode"
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                {/* Avatar (desktop) */}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_PROFILE)}
                  className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-bold text-white shrink-0 transition hover:opacity-85"
                  style={{ background: 'linear-gradient(135deg, var(--color-brand-light), var(--color-brand))', boxShadow: '0 2px 8px rgba(99,102,241,0.20)' }}
                  title="My Profile"
                  aria-label="My Profile"
                >
                  {getInitials(studentName)}
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-5 sm:pt-6 lg:px-6 lg:pb-8">
            <Outlet />
          </main>
        </div>

        {/* ── Mobile Bottom Tab Bar ── */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1 xl:hidden"
          style={{ backgroundColor: 'var(--student-tab-bg)', borderTop: '1px solid var(--color-border)', backdropFilter: 'blur(16px)' }}
        >
          <div className="grid grid-cols-5 gap-1">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.path
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--student-accent)' : 'var(--color-text-muted)',
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? 'var(--student-accent-soft)' : 'transparent',
                    }}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="text-[10px] font-semibold truncate w-full text-center">{tab.label}</span>
                  {tab.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                    <span className="absolute right-2 top-1.5 min-w-4 h-4 rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white flex items-center justify-center">
                      {unreadNotices}
                    </span>
                  ) : null}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default StudentLayout
