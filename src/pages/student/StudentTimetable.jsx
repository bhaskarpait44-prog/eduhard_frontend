import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, CalendarRange, Clock3, RefreshCw } from 'lucide-react'
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

const VIEW_TABS = [
  { key: 'today',  label: 'Today'  },
  { key: 'weekly', label: 'Weekly' },
  { key: 'exams',  label: 'Exams'  },
]

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

  const [view,         setView]         = useState('today')
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const subjectLegend = useMemo(() => buildSubjectLegend(timetable), [timetable])

  const handleRefresh = async () => {
    toastInfo('Refreshing timetable')
    try { await refresh() } catch {}
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            My Timetable
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Day-at-a-glance, weekly schedule &amp; upcoming exams
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Current Period"
          icon={Clock3}
          tone="#16a34a"
          value={currentPeriod ? currentPeriod.subject_name : 'No active class'}
          sub={currentPeriod
            ? `${renderTimeRange(currentPeriod)} · ${currentPeriod.teacher_name}`
            : 'You are free right now.'}
          active={Boolean(currentPeriod)}
        />
        <StatCard
          title="Next Period"
          icon={CalendarRange}
          tone="#d97706"
          value={nextPeriod ? nextPeriod.subject_name : 'No upcoming class'}
          sub={nextPeriod
            ? `${renderTimeRange(nextPeriod)} · ${nextPeriod.teacher_name}`
            : 'Nothing else lined up today.'}
        />
        <StatCard
          title="Periods Today"
          icon={AlarmClock}
          tone="#2563eb"
          value={String(todaySchedule.length || totalPeriods || 0)}
          sub="Total periods in today's schedule."
        />
      </div>

      {/* ── View switcher ── */}
      <div
        className="flex items-center rounded-2xl border p-1 w-fit gap-1"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
      >
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className="rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: view === tab.key ? 'var(--student-accent)' : 'transparent',
              color:           view === tab.key ? '#fff' : 'var(--color-text-secondary)',
              boxShadow:       view === tab.key ? '0 1px 6px rgba(109,40,217,0.22)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

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

              {/* Subject legend */}
              {subjectLegend.length > 0 && (
                <section
                  className="rounded-2xl border p-5"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                        Subject Legend
                      </p>
                      <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Tap a subject to see slot details
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
                    >
                      {subjectLegend.length} subject{subjectLegend.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {subjectLegend.map((item) => (
                      <button
                        key={item.subject_name}
                        type="button"
                        onClick={() => setSelectedSlot(item.example)}
                        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 hover:opacity-80 hover:scale-105"
                        style={{
                          backgroundColor: item.soft,
                          color:           item.color,
                          border:          `1px solid ${item.color}30`,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.subject_name}
                      </button>
                    ))}
                  </div>
                </section>
              )}
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

      {/* ── Slot detail modal ── */}
      <Modal
        open={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title="Timetable Slot"
      >
        {selectedSlot && (
          <div className="space-y-3">
            <InfoRow label="Subject" value={selectedSlot.subject_name} />
            <InfoRow label="Teacher" value={selectedSlot.teacher_name} />
            <InfoRow label="Room"    value={selectedSlot.room_number ? `Room ${selectedSlot.room_number}` : 'Not set'} />
            <InfoRow label="Day"     value={capitalize(selectedSlot.day_of_week)} />
            <InfoRow label="Time"    value={renderTimeRange(selectedSlot)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

const StatCard = ({ title, icon: Icon, tone, value, sub, active }) => (
  <div
    className="relative overflow-hidden rounded-2xl border p-4"
    style={{
      borderColor:     active ? `${tone}44` : 'var(--color-border)',
      backgroundColor: 'var(--color-surface)',
    }}
  >
    {/* Accent bar */}
    <span
      className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
      style={{ backgroundColor: tone }}
    />
    <div className="pl-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tone}18`, color: tone }}
        >
          <Icon size={16} />
        </div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {title}
        </p>
      </div>
      <p
        className="mt-3 text-base font-bold leading-snug"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {sub}
      </p>
      {active && (
        <span
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: `${tone}14`, color: tone }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: tone }}
          />
          LIVE NOW
        </span>
      )}
    </div>
  </div>
)

const InfoRow = ({ label, value }) => (
  <div
    className="rounded-xl border px-4 py-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p
      className="text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {value || '—'}
    </p>
  </div>
)

const TimetableSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-64 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="h-40 rounded-2xl bg-[var(--color-surface-raised)]" />
  </div>
)

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function renderTimeRange(slot) {
  if (!slot) return '—'
  return `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`
}

const SUBJECT_COLORS = {
  'Physics':               { color: '#7C6FCD', soft: 'rgba(124,111,205,0.10)' },
  'Chemistry':             { color: '#26A97A', soft: 'rgba(38,169,122,0.10)'  },
  'Mathematics':           { color: '#F5A623', soft: 'rgba(245,166,35,0.10)'  },
  'Math':                  { color: '#F5A623', soft: 'rgba(245,166,35,0.10)'  },
  'English':               { color: '#4BAEE8', soft: 'rgba(75,174,232,0.10)'  },
  'Biology':               { color: '#E84B9A', soft: 'rgba(232,75,154,0.10)'  },
  'History':               { color: '#E8834B', soft: 'rgba(232,131,75,0.10)'  },
  'Geography':             { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)'  },
  'Computer Sc':           { color: '#4B7BE8', soft: 'rgba(75,123,232,0.10)'  },
  'Computer':              { color: '#4B7BE8', soft: 'rgba(75,123,232,0.10)'  },
  'Hindi':                 { color: '#E84B4B', soft: 'rgba(232,75,75,0.10)'   },
  'Assamese':              { color: '#E84B4B', soft: 'rgba(232,75,75,0.10)'   },
  'Economics':             { color: '#26A9A9', soft: 'rgba(38,169,169,0.10)'  },
  'Political Sc':          { color: '#A926A9', soft: 'rgba(169,38,169,0.10)'  },
  'Physical Ed':           { color: '#26A94B', soft: 'rgba(38,169,75,0.10)'   },
  'EVS':                   { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)'  },
  'Environmental Science': { color: '#6AB04C', soft: 'rgba(106,176,76,0.10)'  },
}

const FALLBACK_PALETTE = [
  { color: '#2563eb', soft: 'rgba(37,99,235,0.10)'  },
  { color: '#16a34a', soft: 'rgba(22,163,74,0.10)'  },
  { color: '#d97706', soft: 'rgba(217,119,6,0.10)'  },
  { color: '#7c3aed', soft: 'rgba(124,58,237,0.10)' },
  { color: '#dc2626', soft: 'rgba(220,38,38,0.10)'  },
]

function buildSubjectLegend(timetable) {
  return [...new Map(timetable.map((slot) => [slot.subject_name, slot])).values()]
    .map((slot, index) => {
      const name  = slot.subject_name || ''
      const key   = Object.keys(SUBJECT_COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()))
      const theme = key ? SUBJECT_COLORS[key] : FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
      return { subject_name: name, example: slot, color: theme.color, soft: theme.soft }
    })
}

function capitalize(value) {
  return String(value || '').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default StudentTimetable
