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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
              EC
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">EduCore</h1>
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
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
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

        <div className="mt-auto p-6 border-t border-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Parent'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guardian</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">EC</div>
            <span className="font-bold text-gray-900">EduCore</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {PARENT_MENU.find(m => m.path === location.pathname)?.label || 'Parent Portal'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all relative">
              <Bell size={20} />
              {unreadNotices > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold md:hidden">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const active = location.pathname === tab.path
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-50' : ''}`}>
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
