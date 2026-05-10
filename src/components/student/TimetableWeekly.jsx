import { useMemo } from 'react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const SUBJECT_COLORS = {
  'Physics':           { accent: '#7C6FCD', bg: 'rgba(124,111,205,0.08)', text: '#4A4299' },
  'Chemistry':         { accent: '#26A97A', bg: 'rgba(38,169,122,0.08)',  text: '#1A7A58' },
  'Mathematics':       { accent: '#F5A623', bg: 'rgba(245,166,35,0.08)',  text: '#B5750E' },
  'Math':              { accent: '#F5A623', bg: 'rgba(245,166,35,0.08)',  text: '#B5750E' },
  'English':           { accent: '#4BAEE8', bg: 'rgba(75,174,232,0.08)',  text: '#1F7AB0' },
  'Biology':           { accent: '#E84B9A', bg: 'rgba(232,75,154,0.08)',  text: '#B01F6E' },
  'History':           { accent: '#E8834B', bg: 'rgba(232,131,75,0.08)',  text: '#B05215' },
  'Geography':         { accent: '#6AB04C', bg: 'rgba(106,176,76,0.08)',  text: '#3E7A28' },
  'Computer Sc':       { accent: '#4B7BE8', bg: 'rgba(75,123,232,0.08)',  text: '#1F4EB0' },
  'Computer':          { accent: '#4B7BE8', bg: 'rgba(75,123,232,0.08)',  text: '#1F4EB0' },
  'Hindi':             { accent: '#E84B4B', bg: 'rgba(232,75,75,0.08)',   text: '#B01F1F' },
  'Assamese':          { accent: '#E84B4B', bg: 'rgba(232,75,75,0.08)',   text: '#B01F1F' },
  'Economics':         { accent: '#26A9A9', bg: 'rgba(38,169,169,0.08)',  text: '#1A7A7A' },
  'Political Sc':      { accent: '#A926A9', bg: 'rgba(169,38,169,0.08)',  text: '#7A1A7A' },
  'Physical Ed':       { accent: '#26A94B', bg: 'rgba(38,169,75,0.08)',   text: '#1A7A38' },
  'EVS':               { accent: '#6AB04C', bg: 'rgba(106,176,76,0.08)',  text: '#3E7A28' },
  'Environmental Science': { accent: '#6AB04C', bg: 'rgba(106,176,76,0.08)',  text: '#3E7A28' },
}

const FALLBACK = { accent: '#64748b', bg: 'rgba(100,116,139,0.08)', text: '#334155' }

const getColor = (name) => {
  if (!name) return FALLBACK
  const key = Object.keys(SUBJECT_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()))
  return key ? SUBJECT_COLORS[key] : FALLBACK
}

const TimetableWeekly = ({ slots = [], currentPeriodId = null }) => {
  const periods = useMemo(() => [...new Set(slots.map((s) => s.period_number))].sort((a, b) => a - b), [slots])
  const slotMap = useMemo(() => new Map(slots.map((s) => [`${s.day_of_week}:${s.period_number}`, s])), [slots])
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  if (!periods.length) {
    return (
      <div
        className="rounded-3xl border p-12 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          No weekly timetable slots are configured yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        .tt-grid-card {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .tt-grid-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12);
          z-index: 10;
        }
        .tt-table {
          table-layout: fixed;
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .tt-table th, .tt-table td {
          width: calc(100% / 7);
        }
        .tt-table th:first-child, .tt-table td:first-child {
          width: 90px;
        }
        @media (max-width: 1023px) {
          .tt-desktop { display: none; }
          .tt-mobile { display: block; }
        }
        @media (min-width: 1024px) {
          .tt-desktop { display: block; }
          .tt-mobile { display: none; }
        }
      `}</style>

      {/* DESKTOP VIEW */}
      <div className="tt-desktop overflow-x-auto rounded-[32px] border shadow-sm"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <table className="tt-table">
          <thead>
            <tr>
              <th className="p-4" style={{ borderBottom: '1px solid var(--color-border)' }} />
              {DAYS.map((day) => {
                const isToday = day === todayName
                return (
                  <th key={day} className="p-4 text-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]"
                      style={{
                        color: isToday ? 'var(--student-accent)' : 'var(--color-text-muted)',
                        borderBottom: isToday ? '2px solid var(--student-accent)' : 'none',
                        paddingBottom: 4
                      }}
                    >
                      {day}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="p-4 align-top" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Period {period}</p>
                  <p className="mt-1 text-[10px] font-medium leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                    {renderTimeRange(slots.find(s => s.period_number === period))}
                  </p>
                </td>
                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isLive = slot?.id === currentPeriodId
                  const theme = slot ? getColor(slot.subject_name) : null

                  return (
                    <td key={`${day}-${period}`} className="p-1.5 align-top" style={{ borderTop: '1px solid var(--color-border)' }}>
                      {slot ? (
                        <div
                          className="tt-grid-card relative h-full min-h-[120px] rounded-[22px] p-3.5"
                          style={{
                            backgroundColor: theme.bg,
                            border: isLive ? `2px solid ${theme.accent}` : '1px solid transparent'
                          }}
                        >
                          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-full" style={{ backgroundColor: theme.accent }} />
                          
                          {isLive && (
                            <span className="absolute right-3 top-3 flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent, animation: 'livePulse 1.5s infinite' }} />
                          )}

                          <div className="pt-1">
                            <p className="line-clamp-2 text-xs font-bold leading-tight" style={{ color: theme.text }}>
                              {slot.subject_name}
                            </p>
                            <p className="mt-1.5 truncate text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                              {slot.teacher_name}
                            </p>
                            <p className="mt-auto pt-3 text-[10px] font-bold" style={{ color: theme.accent }}>
                              {slot.room_number ? `Room ${slot.room_number}` : 'Room —'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[120px] items-center justify-center rounded-[22px] border-2 border-dashed"
                          style={{ borderColor: 'rgba(0,0,0,0.04)', backgroundColor: 'rgba(0,0,0,0.01)' }}
                        >
                          <span className="text-[10px] font-bold text-[var(--color-text-muted)] opacity-30">FREE</span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="tt-mobile space-y-4">
        {periods.map((period) => {
          const refSlot = slots.find(s => s.period_number === period)
          return (
            <div key={period} className="overflow-hidden rounded-[28px] border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center justify-between border-b p-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
              >
                <span className="text-sm font-bold">Period {period}</span>
                <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{renderTimeRange(refSlot)}</span>
              </div>
              <div className="p-2.5 space-y-2">
                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isLive = slot?.id === currentPeriodId
                  const isToday = day === todayName
                  const theme = slot ? getColor(slot.subject_name) : null

                  if (!slot && !isToday) return null

                  if (!slot && isToday) {
                    return (
                      <div key={day} className="flex items-center gap-3 rounded-[18px] border-2 border-dashed p-3"
                        style={{ borderColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(0,0,0,0.01)' }}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--student-accent)] w-10">{day.slice(0, 3)}</span>
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">No class scheduled</span>
                      </div>
                    )
                  }

                  return (
                    <div key={day} className="tt-grid-card relative flex rounded-[18px] overflow-hidden"
                      style={{ backgroundColor: theme.bg, border: isLive ? `2px solid ${theme.accent}` : 'none' }}
                    >
                      <div className="w-1.5" style={{ backgroundColor: theme.accent }} />
                      <div className="flex w-12 flex-shrink-0 flex-col items-center justify-center border-r p-2"
                        style={{ borderColor: `${theme.accent}15` }}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: theme.text }}>{day.slice(0, 3)}</span>
                        {isToday && <span className="mt-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ backgroundColor: theme.accent }}>TODAY</span>}
                      </div>
                      <div className="flex-1 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold leading-tight" style={{ color: theme.text }}>{slot.subject_name}</p>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: theme.accent }}>
                              <span className="h-1 w-1 rounded-full bg-white animate-pulse" /> LIVE
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{slot.teacher_name}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{renderTimeRange(slot)}</span>
                          <span className="text-[10px] font-bold" style={{ color: theme.accent }}>{slot.room_number ? `Room ${slot.room_number}` : ''}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function renderTimeRange(slot) {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} – ${to12Hour(slot.end_time)}`
}

function to12Hour(value) {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default TimetableWeekly