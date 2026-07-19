import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bell, BookOpen, Clock, CalendarCheck,
  LogOut, User, Briefcase, Shield, ChevronRight, RefreshCw,
  CheckCircle2, AlertCircle, Newspaper, Library
} from 'lucide-react'

import useAuthStore from '@/store/authStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { cn } from '@/utils/helpers'
import * as noticesApi from '@/api/noticesApi'

/* ─── Quick-access tile config ─────────────────────────────────────────── */
const QUICK_TILES = [
  {
    label: 'My Notices',
    icon: Bell,
    path: ROUTES.STAFF_NOTICES,
    color: '#7c3aed',
    bg: '#f5f3ff',
    description: 'View all school announcements',
  },
  {
    label: 'Library',
    icon: Library,
    path: ROUTES.LIBRARY_DASHBOARD,
    color: '#0284c7',
    bg: '#f0f9ff',
    description: 'Browse & borrow books',
  },
  {
    label: 'Academic Calendar',
    icon: CalendarCheck,
    path: ROUTES.ACADEMIC_CALENDAR,
    color: '#059669',
    bg: '#f0fdf4',
    description: 'Holidays, events & schedule',
  },
  {
    label: 'My Profile',
    icon: User,
    path: ROUTES.STAFF_PROFILE,
    color: '#d97706',
    bg: '#fffbeb',
    description: 'View & update your details',
  },
]

const StaffDashboard = () => {
  usePageTitle('Staff Dashboard')
  const navigate = useNavigate()
  const { toastSuccess } = useToast()
  const { user, logout } = useAuthStore()
  const { currentSession, sessions, fetchSessions } = useSessionStore()

  const [notices, setNotices]       = useState([])
  const [noticeLoading, setNoticeLoading] = useState(true)
  const [currentTime, setCurrentTime]     = useState(new Date())

  /* ── Live clock ─────────────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  /* ── Fetch sessions if not loaded ───────────────────────────────── */
  useEffect(() => {
    if (sessions.length === 0) fetchSessions().catch(console.error)
  }, [sessions.length, fetchSessions])

  /* ── Fetch staff notices ────────────────────────────────────────── */
  const fetchNotices = useCallback(async () => {
    setNoticeLoading(true)
    try {
      const res = await noticesApi.getStaffNotices()
      const all = res?.data?.notices || res?.data?.data || []
      setNotices(Array.isArray(all) ? all.slice(0, 5) : [])
    } catch {
      setNotices([])
    } finally {
      setNoticeLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  /* ── Logout ─────────────────────────────────────────────────────── */
  const handleLogout = () => {
    logout()
    toastSuccess('Signed out successfully')
    navigate(ROUTES.LOGIN)
  }

  /* ── Helpers ────────────────────────────────────────────────────── */
  const timeStr = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const initials = (user?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const unreadCount = notices.filter(n => !n.is_read).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* ── Hero greeting card ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%)',
        }}
      >
        {/* decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)' }}
            >
              {user?.profile_photo
                ? <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                : initials
              }
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Welcome back</p>
              <h1 className="text-white text-2xl font-black leading-tight">{user?.name || 'Staff Member'}</h1>
              <p className="text-white/60 text-xs mt-0.5 capitalize">
                {user?.designation || user?.department || 'School Staff'}
                {currentSession && ` · ${currentSession.name}`}
              </p>
            </div>
          </div>

          {/* Clock + Logout */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <div className="text-white text-3xl font-black tabular-nums">{timeStr}</div>
              <div className="text-white/60 text-xs">{dateStr}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* Staff info strip */}
        <div className="relative mt-6 flex flex-wrap gap-3">
          {user?.employee_id && (
            <InfoChip icon={Briefcase} label="Employee ID" value={user.employee_id} />
          )}
          {user?.department && (
            <InfoChip icon={Shield} label="Department" value={user.department} />
          )}
          {user?.joining_date && (
            <InfoChip icon={Clock} label="Joined" value={new Date(user.joining_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
        </div>
      </div>

      {/* ── Quick access grid ───────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_TILES.map(tile => (
            <button
              key={tile.label}
              onClick={() => navigate(tile.path)}
              className="group flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: tile.bg, color: tile.color }}>
                <tile.icon size={20} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{tile.label}</div>
                <div className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{tile.description}</div>
              </div>
              <ChevronRight size={14} className="self-end transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Notices panel */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} style={{ color: 'var(--color-brand)' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Notices</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchNotices} className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Refresh">
                <RefreshCw size={14} />
              </button>
              <button onClick={() => navigate(ROUTES.STAFF_NOTICES)}
                className="text-xs font-semibold flex items-center gap-1 transition-colors hover:underline"
                style={{ color: 'var(--color-brand)' }}>
                View All <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {noticeLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
              ))
            ) : notices.length === 0 ? (
              <div className="py-10 text-center">
                <Newspaper size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No notices yet</p>
              </div>
            ) : (
              notices.map(notice => (
                <div key={notice.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:opacity-80',
                    !notice.is_read && 'ring-1 ring-violet-200'
                  )}
                  style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
                  onClick={() => navigate(ROUTES.STAFF_NOTICES)}
                >
                  <div className={cn(
                    'mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    !notice.is_read ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    {notice.is_read ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', !notice.is_read && 'text-violet-700')}
                      style={{ color: notice.is_read ? 'var(--color-text-primary)' : undefined }}>
                      {notice.title || 'Notice'}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {notice.body || notice.content || 'Click to read'}
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {notice.created_at
                      ? new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel — profile snapshot + session info */}
        <div className="flex flex-col gap-4">

          {/* Profile card */}
          <div className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3 mb-4">
              <LayoutDashboard size={18} style={{ color: 'var(--color-brand)' }} />
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>My Details</h3>
            </div>
            <div className="space-y-3">
              <ProfileRow label="Name" value={user?.name} />
              <ProfileRow label="Email" value={user?.email} />
              <ProfileRow label="Phone" value={user?.phone || '—'} />
              <ProfileRow label="Role" value="Staff" badge />
            </div>
            <button
              onClick={() => navigate(ROUTES.STAFF_PROFILE)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:opacity-80"
              style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-brand)' }}
            >
              <User size={13} /> View Full Profile
            </button>
          </div>

          {/* Session info */}
          {currentSession && (
            <div className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <BookOpen size={18} style={{ color: 'var(--color-brand)' }} />
                <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Active Session</h3>
              </div>
              <div className="space-y-2">
                <ProfileRow label="Session" value={currentSession.name} />
                <ProfileRow
                  label="From"
                  value={new Date(currentSession.start_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                />
                <ProfileRow
                  label="To"
                  value={new Date(currentSession.end_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                />
              </div>
            </div>
          )}

          {/* Logout card */}
          <div className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Done for the day? Sign out securely.
            </p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
const InfoChip = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
    <Icon size={12} />
    <span className="font-semibold opacity-70">{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
)

const ProfileRow = ({ label, value, badge }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    {badge ? (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
        {value}
      </span>
    ) : (
      <span className="text-xs font-semibold truncate text-right" style={{ color: 'var(--color-text-primary)' }}>{value || '—'}</span>
    )}
  </div>
)

export default StaffDashboard
