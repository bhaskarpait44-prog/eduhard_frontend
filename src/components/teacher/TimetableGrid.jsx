import { Clock, MapPin, Sparkles } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const renderTimeRange = (slot) => {
  if (!slot) return '--'
  return `${to12Hour(slot.start_time)} - ${to12Hour(slot.end_time)}`
}

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '0'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Subject colour palette ───────────────────────────────────────────────────
// accent = left border / highlight color
// bg     = pastel card background
// text   = subject name text color

const SUBJECT_COLORS = {
  // Existing subjects
  'Physics':           { accent: '#6366f1', bg: '#f0f2ff', text: '#312e81' }, // Indigo
  'Chemistry':         { accent: '#10b981', bg: '#ecfdf5', text: '#064e3b' }, // Emerald
  'Mathematics':       { accent: '#f59e0b', bg: '#fffbeb', text: '#78350f' }, // Amber
  'Math':              { accent: '#f59e0b', bg: '#fffbeb', text: '#78350f' },
  'English':           { accent: '#3b82f6', bg: '#eff6ff', text: '#1e3a8a' }, // Blue
  'Biology':           { accent: '#ec4899', bg: '#fdf2f8', text: '#701a75' }, // Pink
  'History':           { accent: '#f97316', bg: '#fff7ed', text: '#7c2d12' }, // Orange
  'Geography':         { accent: '#84cc16', bg: '#f7fee7', text: '#365314' }, // Lime
  'Computer Sc':       { accent: '#a855f7', bg: '#faf5ff', text: '#581c87' }, // Purple
  'Computer':          { accent: '#a855f7', bg: '#faf5ff', text: '#581c87' },
  'Hindi':             { accent: '#ef4444', bg: '#fef2f2', text: '#7f1d1d' }, // Red
  'Assamese':          { accent: '#ef4444', bg: '#fef2f2', text: '#7f1d1d' },
  'Economics':         { accent: '#06b6d4', bg: '#ecfeff', text: '#083344' }, // Cyan
  'Political Sc':      { accent: '#d946ef', bg: '#fdf4ff', text: '#4a044e' }, // Fuchsia
  'Physical Ed':       { accent: '#22c55e', bg: '#f0fdf4', text: '#14532d' }, // Green
  'EVS':               { accent: '#84cc16', bg: '#f7fee7', text: '#365314' },
  'Environmental Science': { accent: '#84cc16', bg: '#f7fee7', text: '#365314' },
  'General Knowledge': { accent: '#ca8a04', bg: '#fefce8', text: '#713f12' }, // Yellow
  'Sanskrit':          { accent: '#eab308', bg: '#fefce8', text: '#713f12' },

  // New LKG subjects
  'English Oral':      { accent: '#ec4899', bg: '#fdf2f8', text: '#701a75' }, // Pink
  'English Writing':   { accent: '#d946ef', bg: '#fdf4ff', text: '#4a044e' }, // Fuchsia
  'Rhymes':            { accent: '#06b6d4', bg: '#ecfeff', text: '#083344' }, // Cyan
  'Drawing':           { accent: '#eab308', bg: '#fefce8', text: '#713f12' }, // Yellow
}
const FALLBACK = { accent: '#64748b', bg: '#f8fafc', text: '#334155' }

const getColor = (name) => SUBJECT_COLORS[name] || FALLBACK

// ─── Component ────────────────────────────────────────────────────────────────

const TimetableGrid = ({ slots = [], currentPeriodId = null }) => {
  const periods = [...new Set(slots.map((slot) => slot.period_number))].sort((a, b) => a - b)

  if (!periods.length) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          No timetable slots are configured yet for this teacher.
        </p>
      </div>
    )
  }

  const slotMap = new Map(slots.map((slot) => [`${slot.day_of_week}:${slot.period_number}`, slot]))
  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' }).toLowerCase()

  return (
    <>
      <style>{`
        @keyframes ttgPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0px rgba(37, 99, 235, 0.4), 0 4px 14px rgba(37, 99, 235, 0.15); }
          70% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0), 0 4px 14px rgba(37, 99, 235, 0.15); }
          100% { box-shadow: 0 0 0 0px rgba(37, 99, 235, 0), 0 4px 14px rgba(37, 99, 235, 0.15); }
        }
        .ttg-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: default;
          border: 1px solid var(--color-border);
        }
        .ttg-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03) !important;
          border-color: rgba(0, 0, 0, 0.08);
        }
        .ttg-card-live {
          animation: livePulse 2s infinite;
          border: 1px solid var(--color-brand) !important;
        }

        /* ── layout switch ── */
        .ttg-desktop { display: block; }
        .ttg-mobile  { display: none;  }
        @media (max-width: 1023px) {
          .ttg-desktop { display: none;  }
          .ttg-mobile  { display: block; }
        }

        /* ── table column equal width ── */
        .ttg-table { table-layout: fixed; width: 100%; min-width: 900px; border-collapse: separate; border-spacing: 0; }
        .ttg-table th, .ttg-table td { width: calc(100% / 7); }
        .ttg-table th:first-child, .ttg-table td:first-child { width: 120px; }
      `}</style>

      {/* ══════════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════════ */}
      <div className="ttg-desktop overflow-x-auto rounded-2xl border"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <table className="ttg-table">
          <thead>
            <tr>
              {/* Timeline Header cell */}
              <th style={{
                padding: '16px 14px',
                borderBottom: '1px solid var(--color-border)',
                textAlign: 'left',
                backgroundColor: 'var(--color-surface-2)',
              }}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Timeline
                </span>
              </th>
              {DAYS.map((day) => {
                const isToday = day === todayName
                return (
                  <th key={day}
                    style={{
                      padding: '16px 8px',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'center',
                      backgroundColor: isToday ? 'var(--color-sidebar-hover)' : 'transparent',
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span className="text-[11px] font-extrabold tracking-widest uppercase" style={{
                        color: isToday ? 'var(--color-brand)' : 'var(--color-text-muted)',
                      }}>
                        {day}
                      </span>
                      {isToday && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {periods.map((period) => {
              const periodSlot = slots.find((s) => s.period_number === period)
              return (
                <tr key={period}>
                  {/* Period label */}
                  <td style={{
                    padding: '14px 14px',
                    verticalAlign: 'middle',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-2)',
                  }}>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md text-blue-600 bg-blue-50 dark:bg-blue-950/30 w-fit">
                        Period {period}
                      </span>
                      <span className="text-[10px] font-semibold flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <Clock size={11} />
                        {periodSlot ? to12Hour(periodSlot.start_time) : '--'}
                      </span>
                    </div>
                  </td>

                  {DAYS.map((day) => {
                    const slot = slotMap.get(`${day}:${period}`)
                    const isLive = slot?.id === currentPeriodId && currentPeriodId !== null
                    const isToday = day === todayName
                    const c = slot ? getColor(slot.subject_name) : null

                    return (
                      <td key={`${day}-${period}`} style={{
                        padding: '8px 6px',
                        verticalAlign: 'top',
                        borderTop: '1px solid var(--color-border)',
                        backgroundColor: isToday ? 'var(--color-sidebar-hover)' : 'transparent',
                      }}>
                        {slot ? (
                          <div
                            className={`ttg-card ${isLive ? 'ttg-card-live' : ''}`}
                            style={{
                              borderRadius: 12,
                              backgroundColor: c.bg,
                              padding: '12px 12px 10px 12px',
                              position: 'relative',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              minHeight: 100,
                            }}
                            title={`${slot.subject_name} · ${slot.class_name} ${slot.section_name}`}
                          >
                            {/* Left highlight strip */}
                            <div style={{
                              position: 'absolute',
                              top: 0, bottom: 0, left: 0,
                              width: 4,
                              backgroundColor: c.accent,
                            }} />

                            {/* Live Badge */}
                            {isLive && (
                              <span style={{
                                position: 'absolute', top: 10, right: 10,
                                display: 'flex', alignItems: 'center', gap: 3,
                                fontSize: 8, fontWeight: 800,
                                backgroundColor: c.accent, color: '#fff',
                                borderRadius: 6, padding: '1px 4px',
                              }}>
                                <span style={{
                                  width: 4, height: 4, borderRadius: '50%',
                                  backgroundColor: '#fff',
                                  animation: 'ttgPulse 1.8s ease-in-out infinite',
                                }} />
                                LIVE
                              </span>
                            )}

                            <div className="flex-1 pl-1">
                              <p style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: c.text,
                                lineHeight: 1.25,
                                marginBottom: 4,
                              }}>
                                {slot.subject_name}
                              </p>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                Class {slot.class_name}-{slot.section_name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                                {to12Hour(slot.start_time)} - {to12Hour(slot.end_time)}
                              </p>
                            </div>

                            {slot.room_number && (
                              <div className="mt-2 pl-1 pt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: c.accent }}>
                                <MapPin size={10} />
                                <span>Rm {slot.room_number}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Free cell — minimal polished layout */
                          <div style={{
                            borderRadius: 12,
                            border: '1.5px dashed var(--color-border)',
                            backgroundColor: 'rgba(0,0,0,0.01)',
                            padding: '12px',
                            minHeight: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                          }}>
                            <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-20" style={{ color: 'var(--color-text-muted)' }}>
                              Free
                            </span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE  —  stacked by period
      ══════════════════════════════════════════ */}
      <div className="ttg-mobile space-y-4">
        {periods.map((period) => {
          const periodSlot = slots.find((s) => s.period_number === period)
          return (
            <div key={period} className="rounded-xl border overflow-hidden" style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}>
              {/* Period header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50" style={{
                borderColor: 'var(--color-border)',
              }}>
                <span className="text-sm font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 rounded-md">
                  Period {period}
                </span>
                <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <Clock size={12} />
                  {renderTimeRange(periodSlot)}
                </span>
              </div>

              {/* Cards for each day */}
              <div className="p-3 space-y-2">
                {DAYS.map((day) => {
                  const slot = slotMap.get(`${day}:${period}`)
                  const isLive = slot?.id === currentPeriodId && currentPeriodId !== null
                  const isToday = day === todayName
                  const c = slot ? getColor(slot.subject_name) : null

                  if (!slot) {
                    if (!isToday) return null
                    return (
                      <div key={day} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/10">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest min-w-[36px]">
                          {day.slice(0, 3)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">Free Period</span>
                      </div>
                    )
                  }

                  return (
                    <div key={day}
                      className={`ttg-card ${isLive ? 'ttg-card-live' : ''}`}
                      style={{
                        display: 'flex',
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: c.bg,
                        position: 'relative',
                      }}
                    >
                      {/* Left accent bar */}
                      <div style={{
                        width: 4,
                        flexShrink: 0,
                        backgroundColor: c.accent,
                      }} />

                      {/* Day label column */}
                      <div style={{
                        width: 50,
                        flexShrink: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 4px',
                        borderRight: `1px solid ${c.accent}15`,
                        gap: 2,
                      }}>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: c.text }}>
                          {day.slice(0, 3)}
                        </span>
                        {isToday && (
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold" style={{ color: c.text }}>
                              {slot.subject_name}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              Class {slot.class_name} · {slot.section_name}
                            </p>
                          </div>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-extrabold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {renderTimeRange(slot)}
                          </span>
                          {slot.room_number && (
                            <span className="flex items-center gap-0.5 font-bold uppercase tracking-wider" style={{ color: c.accent }}>
                              <MapPin size={10} />
                              Rm {slot.room_number}
                            </span>
                          )}
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

export default TimetableGrid
