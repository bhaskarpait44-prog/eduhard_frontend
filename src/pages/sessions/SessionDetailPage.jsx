// src/pages/sessions/SessionDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Zap, Lock, CalendarCheck,
  UmbrellaOff, Plus, Trash2, Calendar
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
    isLoading, isSaving,
    fetchSession, activateSession,
  } = useSessionStore()

  usePageTitle(session ? `Session: ${session.name}` : 'Session Detail')

  const [activeTab,   setActiveTab]   = useState('working_days')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [holidayModal,setHolidayModal]= useState(false)

  useEffect(() => {
    fetchSession(id).catch(() => toastError('Failed to load session'))
  }, [id])

  const handleActivate = async () => {
    setConfirmOpen(false)
    const result = await activateSession(id)
    if (result.success) {
      toastSuccess(`Session activated successfully`)
    } else {
      toastError(result.message || 'Failed to activate session')
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
              onClick={() => toastError('Lock functionality coming soon')}
            >
              Lock Session
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
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Days marked as working days are counted in attendance calculations.
              </p>
              <div className="flex flex-wrap gap-3">
                {DAYS.map(day => {
                  const isWorking = session[day] ?? session.working_days?.[day]
                  return (
                    <div
                      key={day}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl"
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
                    </div>
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
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={() => setHolidayModal(true)}
                >
                  Add Holiday
                </Button>
              </div>

              {holidays.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No holidays declared"
                  description="Add national, regional, or school holidays for this session."
                  action={
                    <Button size="sm" icon={Plus} onClick={() => setHolidayModal(true)}>
                      Add First Holiday
                    </Button>
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
                          className="flex items-center gap-4 p-3 rounded-xl"
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

      {/* ── Add Holiday Modal ─────────────────────────────────────────── */}
      <AddHolidayModal
        open={holidayModal}
        onClose={() => setHolidayModal(false)}
        sessionId={id}
        existingHolidays={holidays}
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