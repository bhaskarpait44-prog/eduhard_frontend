import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, ArrowRight, CalendarRange, Clock3, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import TimetableToday from '@/components/shared/TimetableToday'
import TimetableWeekly from '@/components/student/TimetableWeekly'
import ExamCountdown from '@/components/student/ExamCountdown'
import ExamTimetableWeekly from '@/components/student/ExamTimetableWeekly'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentTimetable from '@/hooks/useStudentTimetable'
import useToast from '@/hooks/useToast'
import { formatTime } from '@/utils/helpers'

const StudentTimetable = () => {
  usePageTitle('My Timetable')

  const { toastError, toastInfo } = useToast()
  const {
    timetable,
    todaySchedule,
    currentPeriod,
    nextPeriod,
    examSchedule,
    loading,
    refreshing,
    error,
    refresh,
    totalPeriods,
  } = useStudentTimetable()

  const [view, setView] = useState('today')
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const subjectLegend = useMemo(() => buildSubjectLegend(timetable), [timetable])

  const handleRefresh = async () => {
    toastInfo('Refreshing timetable')
    try {
      await refresh()
    } catch {}
  }

  const viewTabs = [
    { key: 'today', label: 'Today' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'exams', label: 'Exams' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.18), rgba(34,197,94,0.06) 52%, var(--color-surface) 100%)',
          boxShadow: '0 4px 24px rgba(109,40,217,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #7c3aed, #16a34a)' }} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--student-accent)' }}>
              Timetable
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Timetable</h1>
            <p className="mt-2 max-w-2xl text-[13px] text-[var(--color-text-secondary)] sm:text-[15px]">
              See your day at a glance, switch to weekly planning, and keep upcoming exams in view.
            </p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          title="Current Period"
          icon={Clock3}
          tone="#16a34a"
          value={currentPeriod ? currentPeriod.subject_name : 'No active class'}
          sub={currentPeriod ? `${renderTimeRange(currentPeriod)} · ${currentPeriod.teacher_name}` : 'You are free right now.'}
          active={Boolean(currentPeriod)}
        />
        <StatCard
          title="Next Period"
          icon={CalendarRange}
          tone="#d97706"
          value={nextPeriod ? nextPeriod.subject_name : 'No upcoming class'}
          sub={nextPeriod ? `${renderTimeRange(nextPeriod)} · ${nextPeriod.teacher_name}` : 'Nothing else is lined up today.'}
        />
        <StatCard
          title="Today Total"
          icon={AlarmClock}
          tone="#2563eb"
          value={String(todaySchedule.length || totalPeriods || 0)}
          sub="Periods in your current view."
        />
      </section>

      {/* ── View switcher ── */}
      <section
        className="rounded-3xl border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div
          className="inline-flex rounded-2xl p-1 gap-1"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              className="rounded-xl px-5 py-2 text-[13px] font-bold transition-all duration-200"
              style={{
                backgroundColor: view === tab.key ? 'var(--student-accent)' : 'transparent',
                color: view === tab.key ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: view === tab.key ? '0 2px 8px rgba(109,40,217,0.25)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Content ── */}
      {loading ? (
        <TimetableSkeleton />
      ) : !timetable.length && !todaySchedule.length && !examSchedule.length ? (
        <EmptyState
          icon={CalendarRange}
          title="No timetable available yet"
          description="Your class and exam timetables have not been configured for this session."
        />
      ) : (
        <>
          {view === 'today' && (
            <div className="space-y-5">
              <TimetableToday
                schedule={todaySchedule}
                currentPeriodId={currentPeriod?.id || null}
                nextPeriodId={nextPeriod?.id || null}
              />
              <ExamCountdown exams={examSchedule} />
            </div>
          )}

          {view === 'weekly' && (
            <div className="space-y-5">
              <TimetableWeekly slots={timetable} currentPeriodId={currentPeriod?.id || null} />
              <section
                className="rounded-3xl border p-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">Subject Legend</h2>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Tap a subject to see its timetable slot details.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjectLegend.map((item) => (
                    <button
                      key={item.subject_name}
                      type="button"
                      onClick={() => setSelectedSlot(item.example)}
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition hover:opacity-80"
                      style={{ backgroundColor: item.soft, color: item.color, border: `1px solid ${item.color}30` }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.subject_name}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {view === 'exams' && (
            <div className="space-y-5">
              <ExamTimetableWeekly exams={examSchedule} />
              <ExamCountdown exams={examSchedule} />
            </div>
          )}
        </>
      )}

      {/* Slot detail modal */}
      <Modal
        open={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title="Timetable Slot"
      >
        {selectedSlot && (
          <div className="space-y-3">
            <InfoRow label="Subject" value={selectedSlot.subject_name} />
            <InfoRow label="Teacher" value={selectedSlot.teacher_name} />
            <InfoRow label="Room" value={selectedSlot.room_number ? `Room ${selectedSlot.room_number}` : 'Room not set'} />
            <InfoRow label="Day" value={capitalize(selectedSlot.day_of_week)} />
            <InfoRow label="Time" value={renderTimeRange(selectedSlot)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const StatCard = ({ title, icon: Icon, tone, value, sub, active }) => (
  <div
    className="relative overflow-hidden rounded-3xl border p-5"
    style={{
      borderColor: active ? `${tone}40` : 'var(--color-border)',
      backgroundColor: 'var(--color-surface)',
      boxShadow: active ? `0 4px 20px ${tone}18` : '0 2px 12px rgba(0,0,0,0.04)',
    }}
  >
    {/* Left accent bar */}
    <div className="absolute inset-y-0 left-0 w-1 rounded-full" style={{ backgroundColor: tone }} />
    <div className="pl-2">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${tone}18`, color: tone }}
        >
          <Icon size={18} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{title}</p>
      </div>
      <p className="mt-3 text-[18px] font-bold text-[var(--color-text-primary)] leading-snug">{value}</p>
      <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{sub}</p>
      {active && (
        <span
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: `${tone}14`, color: tone }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: tone }} />
          LIVE NOW
        </span>
      )}
    </div>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="rounded-2xl border px-4 py-3.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

const TimetableSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="rounded-3xl bg-[var(--color-surface)] p-12" />
    <div className="rounded-3xl bg-[var(--color-surface)] p-12" />
  </div>
)

/* ─── Utility helpers ─────────────────────────────────────────────────────── */

function renderTimeRange(slot) {
  if (!slot) return '--'
  return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
}

const SUBJECT_COLORS = {
  'Physics':           { color: '#7C6FCD', soft: 'rgba(124,111,205,0.10)' },
  'Chemistry':         { color: '#26A97A', soft: 'rgba(38,169,122,0.10)' },
  'Mathematics':       { color: '#F5A623', soft: 'rgba(245,166,35,0.10)' },
  'Math':              { color: '#F5A623', soft: 'rgba(245,166,35,0.10)' },
  'English':           { color: '#4BAEE8', soft: 'rgba(75,174,232,0.10)' },
  'Biology':           { color: '#E84B9A', soft: 'rgba(232,75,154,0.10)' },
  'History':           { color: '#E8834B', soft: 'rgba(232,131,75,0.10)' },
  'Geography':         { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)' },
  'Computer Sc':       { color: '#4B7BE8', soft: 'rgba(75,123,232,0.10)' },
  'Computer':          { color: '#4B7BE8', soft: 'rgba(75,123,232,0.10)' },
  'Hindi':             { color: '#E84B4B', soft: 'rgba(232,75,75,0.10)' },
  'Assamese':          { color: '#E84B4B', soft: 'rgba(232,75,75,0.10)' },
  'Economics':         { color: '#26A9A9', soft: 'rgba(38,169,169,0.10)' },
  'Political Sc':      { color: '#A926A9', soft: 'rgba(169,38,169,0.10)' },
  'Physical Ed':       { color: '#26A94B', soft: 'rgba(38,169,75,0.10)' },
  'EVS':               { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)' },
  'Environmental Science': { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)' },
}

const FALLBACK_PALETTE = [
  { color: '#2563eb', soft: 'rgba(37,99,235,0.10)' },
  { color: '#16a34a', soft: 'rgba(22,163,74,0.10)' },
  { color: '#d97706', soft: 'rgba(217,119,6,0.10)' },
  { color: '#7c3aed', soft: 'rgba(124,58,237,0.10)' },
  { color: '#dc2626', soft: 'rgba(220,38,38,0.10)' },
]

function buildSubjectLegend(timetable) {
  return [...new Map(timetable.map((slot) => [slot.subject_name, slot])).values()].map((slot, index) => {
    const name = slot.subject_name || ''
    const key = Object.keys(SUBJECT_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()))
    const theme = key ? SUBJECT_COLORS[key] : FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
    
    return {
      subject_name: name,
      example: slot,
      color: theme.color,
      soft: theme.soft,
    }
  })
}

function capitalize(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default StudentTimetable
