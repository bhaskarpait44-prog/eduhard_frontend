import { useMemo } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, formatTime } from '@/utils/helpers'

// ─── Subject colour palette ───────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const ExamDutyTimetable = ({ duties = [] }) => {
  // Group duties by week, sorting chronologically
  const weeklyData = useMemo(() => {
    const weeks = {}
    
    duties.forEach(slot => {
      const dateStr = slot.exam_date ? String(slot.exam_date).slice(0, 10) : null
      if (!dateStr) return

      const date = new Date(`${dateStr}T00:00:00`)
      
      // Find Monday of that week
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(new Date(date).setDate(diff))
      const weekKey = monday.toISOString().split('T')[0]
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekKey,
          weekLabel: `Week of ${formatDate(weekKey, 'short')}`,
          slots: []
        }
      }
      
      weeks[weekKey].slots.push(slot)
    })
    
    // Sort slots within each week chronologically by date and start time
    Object.values(weeks).forEach(week => {
      week.slots.sort((a, b) => {
        const dateA = new Date(a.exam_date || 0)
        const dateB = new Date(b.exam_date || 0)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        return String(a.start_time).localeCompare(String(b.start_time))
      })
    })

    return Object.values(weeks).sort((a, b) => a.weekKey.localeCompare(b.weekKey))
  }, [duties])

  if (!duties.length) {
    return (
      <div className="rounded-[28px] border p-12 text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          No exam duties or marking assignments found for this session.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {weeklyData.map((week) => (
        <div key={week.weekKey} className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
              {week.weekLabel}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {week.slots.map((slot, sIndex) => {
              const theme = getColor(slot.subject_name)
              const isInvigilator = slot.duty_type === 'invigilator'
              return (
                <div
                  key={`${slot.exam_subject_id || sIndex}-${sIndex}`}
                  className="group relative rounded-2xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  {/* Left indicator bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                    style={{ backgroundColor: theme.accent }}
                  />
                  
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60" style={{ color: theme.text }}>
                      {slot.exam_name || 'Exam Session'}
                    </span>
                    {isInvigilator ? (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        Invigilator
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        Marker
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-[var(--color-text-primary)] leading-tight mb-1">
                    {slot.subject_name}
                  </h4>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-4">
                    Class: {slot.class_name}
                  </p>

                  <div className="grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                      <Calendar size={13} className="text-[var(--color-brand)] shrink-0" />
                      <span>{formatDate(slot.exam_date, 'short')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                      <Clock size={13} className="text-[var(--color-brand)] shrink-0" />
                      <span>{formatTime(slot.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] col-span-2">
                      <MapPin size={13} className="text-[var(--color-brand)] shrink-0" />
                      <span>Room {slot.room_number || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ExamDutyTimetable
