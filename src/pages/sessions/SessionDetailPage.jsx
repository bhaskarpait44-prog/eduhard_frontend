// src/pages/sessions/SessionDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Zap, Lock, CalendarCheck,
  UmbrellaOff, Plus, Trash2, Calendar, Archive
} from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useAcademicCalendarStore from '@/store/academicCalendarStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AddHolidayModal from './AddHolidayModal'
import EditSessionModal from './EditSessionModal'
import { formatDate, cn } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'

const STATUS_CONFIG = {
  upcoming : { label: 'Upcoming', variant: 'blue'   },
  active   : { label: 'Active',   variant: 'green'  },
  locked   : { label: 'Locked',   variant: 'yellow' },
  closed   : { label: 'Closed',   variant: 'grey'   },
  archived : { label: 'Archived', variant: 'dark'   },
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const HOLIDAY_TYPE_LABELS = {
  national : { label: 'National',  color: '#dc2626' },
  regional : { label: 'Regional',  color: '#d97706' },
  school   : { label: 'School',    color: '#2563eb' },
}

const SessionDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()
  const {
    selectedSession : session,
    sessionStats,
    isLoading, isSaving,
    fetchSession, fetchSessionStats, activateSession, lockSession, archiveSession,
    removeHoliday, updateWorkingDays, deleteSession,
  } = useSessionStore()

  usePageTitle(session ? `Session: ${session.name}` : 'Session Detail')

  const [activeTab,   setActiveTab]   = useState('working_days')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lockOpen,    setLockOpen]    = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [holidayModal,setHolidayModal]= useState(false)
  const [deleteHolidayTarget, setDeleteHolidayTarget] = useState(null)
  
  // Working days edit state
  const [isEditingWD, setIsEditingWD] = useState(false)
  const [tempWD, setTempWD] = useState({})

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchSession(id)
        // Only fetch stats after session is loaded to ensure UI consistency
        fetchSessionStats(id).catch(() => console.error('Failed to load session stats'))
      } catch (err) {
        toastError('Failed to load session')
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (session && activeTab === 'working_days') {
      const wd = {}
      DAYS.forEach(d => wd[d] = session[d] ?? session.working_days?.[d] ?? true)
      setTempWD(wd)
    }
  }, [session, activeTab])

  const handleActivate = async () => {
    setConfirmOpen(false)
    const result = await activateSession(id)
    if (result.success) {
      toastSuccess(`Session activated successfully`)
      fetchSession(id)
    } else {
      toastError(result.message || 'Failed to activate session')
    }
  }

  const handleLock = async () => {
    setLockOpen(false)
    const result = await lockSession(id)
    if (result.success) {
      toastSuccess(`Session locked successfully. It is now read-only.`)
      fetchSession(id)
    } else {
      toastError(result.message || 'Failed to lock session')
    }
  }

  const handleArchive = async () => {
    setArchiveOpen(false)
    const result = await archiveSession(id)
    if (result.success) {
      toastSuccess(`Session archived successfully.`)
    } else {
      toastError(result.message || 'Failed to archive session')
    }
  }

  const handleDeleteHoliday = async () => {
    if (!deleteHolidayTarget) return
    const result = await removeHoliday(id, deleteHolidayTarget.id)
    if (result.success) {
      toastSuccess(`Holiday removed. Associated attendance records cleared.`)
      setDeleteHolidayTarget(null)
    } else {
      toastError(result.message || 'Failed to remove holiday')
    }
  }

  const handleSaveWD = async () => {
    const result = await updateWorkingDays(id, tempWD)
    if (result.success) {
      toastSuccess(`Working days updated successfully.`)
      setIsEditingWD(false)
    } else {
      toastError(result.message || 'Failed to update working days')
    }
  }

  const handleDeleteSession = async () => {
    setDeleteOpen(false)
    const result = await deleteSession(id)
    if (result.success) {
      toastSuccess('Session deleted successfully')
      navigate(ROUTES.SESSIONS)
    } else {
      toastError(result.message || 'Failed to delete session')
    }
  }

  if (isLoading || !session) {
    return <DetailSkeleton />
  }

  const statusCfg = STATUS_CONFIG[session.status] || { label: session.status, variant: 'grey' }
  const holidays  = session.holidays || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <button
          onClick={() => navigate(ROUTES.SESSIONS)}
          className="p-2 rounded-xl transition-colors self-start"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {session.name}
            </h1>
            <Badge variant={statusCfg.variant} dot>{statusCfg.label}</Badge>
            {session.is_current && <Badge variant="green" dot>Current</Badge>}
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDate(session.start_date)} — {formatDate(session.end_date)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {(session.status === 'upcoming' || session.status === 'active') && !session.is_locked && (
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              loading={isSaving}
            >
              Edit
            </Button>
          )}
          {!session.is_current && (
            <Button
              variant="ghost"
              icon={Trash2}
              className="text-red-500 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              loading={isSaving}
            >
              Delete
            </Button>
          )}
          {session.status === 'upcoming' && (
            <Button
              icon={Zap}
              onClick={() => setConfirmOpen(true)}
              loading={isSaving}
            >
              Activate Session
            </Button>
          )}
          {session.status === 'active' && (
            <Button
              variant="outline"
              icon={Lock}
              onClick={() => setLockOpen(true)}
              loading={isSaving}
            >
              Lock Session
            </Button>
          )}
          {session.status === 'closed' && (
            <Button
              variant="outline"
              icon={Archive}
              onClick={() => setArchiveOpen(true)}
              loading={isSaving}
            >
              Archive Session
            </Button>
          )}
        </div>
      </div>

      {/* ── Info cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Start Date',   value: formatDate(session.start_date) },
          { label: 'End Date',     value: formatDate(session.end_date) },
          { label: 'Status',       value: statusCfg.label },
          { label: 'Holidays',     value: `${holidays.length} declared` },
        ].map(card => (
          <div
            key={card.label}
            className="p-4 rounded-2xl"
            style={{
              backgroundColor : 'var(--color-surface)',
              border          : '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {card.label}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {sessionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Enrolled Students', value: sessionStats.students },
            { label: 'Avg Attendance',    value: `${sessionStats.attendance_rate}%` },
            { label: 'Fee Collection',    value: `${sessionStats.fee_stats?.percentage || 0}%` },
            { label: 'Exams Conducted',   value: sessionStats.exams },
          ].map(card => (
            <div
              key={card.label}
              className="p-4 rounded-2xl"
              style={{
                backgroundColor : 'var(--color-surface-raised)',
                border          : '1px solid var(--color-border)',
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {card.label}
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor : 'var(--color-surface)',
          border          : '1px solid var(--color-border)',
        }}
      >
        {/* Tab bar */}
        <div
          className="flex"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          {[
            { key: 'working_days', label: 'Working Days', icon: CalendarCheck },
            { key: 'holidays',     label: `Holidays (${holidays.length})`, icon: UmbrellaOff },
            { key: 'calendar',     label: 'Calendar', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium',
                'border-b-2 transition-colors',
              )}
              style={{
                borderBottomColor : activeTab === tab.key ? 'var(--color-brand)' : 'transparent',
                color             : activeTab === tab.key
                  ? 'var(--color-brand)'
                  : 'var(--color-text-secondary)',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* Working days tab */}
          {activeTab === 'working_days' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Days marked as working days are counted in attendance calculations.
                </p>
                {!session.is_locked && session.status === 'active' && (
                  isEditingWD ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setIsEditingWD(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveWD} loading={isSaving}>Save Changes</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" icon={Plus} onClick={() => setIsEditingWD(true)}>
                      Edit Working Days
                    </Button>
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {DAYS.map(day => {
                  const isWorking = isEditingWD ? tempWD[day] : (session[day] ?? session.working_days?.[day])
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!isEditingWD}
                      onClick={() => setTempWD(p => ({ ...p, [day]: !p[day] }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                        isEditingWD && "hover:shadow-md cursor-pointer"
                      )}
                      style={{
                        backgroundColor : isWorking ? '#eff6ff' : 'var(--color-surface-raised)',
                        border          : `1.5px solid ${isWorking ? '#bfdbfe' : 'var(--color-border)'}`,
                        minWidth        : '64px',
                      }}
                    >
                      <span
                        className="text-sm font-semibold capitalize"
                        style={{ color: isWorking ? '#1d4ed8' : 'var(--color-text-muted)' }}
                      >
                        {day.slice(0, 3)}
                      </span>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: isWorking ? '#2563eb' : 'var(--color-border)' }}
                      >
                        {isWorking ? '✓' : '–'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Holidays tab */}
          {activeTab === 'holidays' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Holidays are excluded from attendance calculations.
                </p>
                {!session.is_locked && session.status === 'active' && (
                  <Button
                    size="sm"
                    icon={Plus}
                    onClick={() => setHolidayModal(true)}
                  >
                    Add Holiday
                  </Button>
                )}
              </div>

              {holidays.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No holidays declared"
                  description="Add national, regional, or school holidays for this session."
                  action={
                    !session.is_locked && session.status === 'active' ? (
                      <Button size="sm" icon={Plus} onClick={() => setHolidayModal(true)}>
                        Add First Holiday
                      </Button>
                    ) : null
                  }
                  className="border-0 py-10"
                />
              ) : (
                <div className="space-y-2">
                  {holidays
                    .filter(Boolean)
                    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                    .map((holiday, i) => {
                      const typeCfg = HOLIDAY_TYPE_LABELS[holiday.type] || { label: holiday.type, color: '#64748b' }
                      return (
                        <div
                          key={i}
                          className="group flex items-center gap-4 p-3 rounded-xl"
                          style={{
                            backgroundColor : 'var(--color-surface-raised)',
                            border          : '1px solid var(--color-border)',
                          }}
                        >
                          {/* Date badge */}
                          <div
                            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: typeCfg.color }}
                          >
                            <span className="text-xs font-bold leading-none">
                              {new Date(holiday.holiday_date).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {new Date(holiday.holiday_date).getDate()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {holiday.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(holiday.holiday_date)} •{' '}
                              <span style={{ color: typeCfg.color }}>{typeCfg.label}</span>
                            </p>
                          </div>

                          {!session.is_locked && session.status === 'active' && (
                            <button
                              onClick={() => setDeleteHolidayTarget(holiday)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Holiday"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* Calendar tab */}
          {activeTab === 'calendar' && (
            <CalendarTab sessionId={id} />
          )}
        </div>
      </div>

      {/* ── Confirm activate dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleActivate}
        title="Activate Session?"
        description={`This will activate "${session.name}" and mark it as the current session. Any previously active session will be closed. This action cannot be undone.`}
        confirmLabel="Yes, Activate"
        variant="primary"
        loading={isSaving}
      />

      {/* ── Confirm lock dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onConfirm={handleLock}
        title="Lock Session?"
        description={`This will lock "${session.name}" and make it read-only. No further changes to attendance, results, or fees will be permitted. This action is permanent.`}
        confirmLabel="Yes, Lock Session"
        variant="danger"
        loading={isSaving}
      />

      {/* ── Add Holiday Modal ─────────────────────────────────────────── */}
      <AddHolidayModal
        open={holidayModal}
        onClose={() => setHolidayModal(false)}
        sessionId={id}
        existingHolidays={holidays}
      />

      {/* ── Confirm delete holiday dialog ─────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteHolidayTarget}
        onClose={() => setDeleteHolidayTarget(null)}
        onConfirm={handleDeleteHoliday}
        title="Remove Holiday?"
        description={`Remove "${deleteHolidayTarget?.name}" on ${formatDate(deleteHolidayTarget?.holiday_date)}? This will also DELETE any "Holiday" attendance records marked for this date, requiring them to be re-marked if it's now a working day.`}
        confirmLabel="Yes, Remove"
        variant="danger"
        loading={isSaving}
      />

      {/* ── Confirm archive dialog ──────────────────────────────────────── */}
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title="Archive Session?"
        description={`This will move "${session.name}" to the archive. It will no longer appear in active filters, but historical data will be preserved.`}
        confirmLabel="Yes, Archive"
        variant="warning"
        loading={isSaving}
      />

      {/* ── Confirm delete session dialog ────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteSession}
        title="Delete Session?"
        description={`This will permanently delete "${session.name}". All associated data including enrollments, attendance, and results will be lost. This action cannot be undone.`}
        confirmLabel="Yes, Delete Session"
        variant="danger"
        loading={isSaving}
      />

      {/* ── Edit Session Modal ──────────────────────────────────────────── */}
      <EditSessionModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        session={session}
      />
    </div>
  )
}

// ── Calendar Tab Component ────────────────────────────────────────────────
const CalendarTab = ({ sessionId }) => {
  const { events, isLoading, fetchEvents } = useAcademicCalendarStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents(sessionId)
  }, [sessionId])

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">Loading events...</div>

  return (
    <div className="p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Session Events</h3>
        <Button 
          variant="ghost" size="sm" icon={Calendar}
          onClick={() => navigate(ROUTES.ACADEMIC_CALENDAR)}
        >
          Full Calendar
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Plan your academic year by adding events to the calendar."
          className="border-0 py-10"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {events.slice(0, 10).map(event => (
            <div 
              key={event.id}
              className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]"
            >
              <div className="flex items-start gap-3">
                <div 
                  className="w-1 h-8 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: event.color || '#64748b' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-[var(--color-text-primary)]">{event.title}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {formatDate(event.start_date)} {event.is_all_day ? '(All Day)' : `• ${event.start_time}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {events.length > 10 && (
            <button 
              onClick={() => navigate(ROUTES.ACADEMIC_CALENDAR)}
              className="col-span-full text-center text-xs font-bold text-[var(--color-brand)] p-2 hover:underline"
            >
              + {events.length - 10} more events. View all →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-8 w-48 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
      ))}
    </div>
    <div className="h-64 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }} />
  </div>
)

export default SessionDetailPage