import { useMemo } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, formatTime } from '@/utils/helpers'

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

const ExamTimetableWeekly = ({ exams = [] }) => {
  const weeklyData = useMemo(() => {
    const weeks = {}
    
    exams.forEach(exam => {
      if (!exam.timetable) return
      
      exam.timetable.forEach(slot => {
        const date = new Date(slot.exam_date)
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        
        // Find Monday of that week
        const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)
        const monday = new Date(date.setDate(diff))
        const weekKey = monday.toISOString().split('T')[0]
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = {
            weekLabel: `Week of ${formatDate(weekKey, 'short')}`,
            days: {}
          }
        }
        
        if (!weeks[weekKey].days[dayOfWeek]) weeks[weekKey].days[dayOfWeek] = []
        weeks[weekKey].days[dayOfWeek].push({ ...slot, exam_name: exam.name })
      })
    })
    
    return Object.values(weeks).sort((a, b) => a.weekLabel.localeCompare(b.weekLabel))
  }, [exams])

  if (!weeklyData.length) return null

  return (
    <div className="space-y-10">
      {weeklyData.map((week, wIndex) => (
        <div key={week.weekKey || wIndex} className="space-y-5">
          <div className="flex items-center gap-3 px-2">
            <div className="h-2 w-2 rounded-full bg-[var(--student-accent)]" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              {week.weekLabel}
            </h3>
          </div>

          <div className="overflow-x-auto rounded-[32px] border shadow-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {DAYS.map((day) => (
                    <th key={day} className="p-4 text-center border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                        {day}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {DAYS.map((day) => {
                    const slots = week.days[day] || []
                    return (
                      <td key={day} className="p-2 align-top w-[16.66%]" style={{ minHeight: '160px' }}>
                        <div className="space-y-2">
                          {slots.map((slot, sIndex) => {
                            const theme = getColor(slot.subject_name)
                            return (
                              <div
                                key={`${slot.id}-${sIndex}`}
                                className="group relative rounded-[20px] p-3 transition-all hover:scale-[1.02]"
                                style={{ backgroundColor: theme.bg, border: `1px solid ${theme.accent}20` }}
                              >
                                <div className="absolute left-0 top-3 h-4 w-1 rounded-r-full" style={{ backgroundColor: theme.accent }} />
                                
                                <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60" style={{ color: theme.text }}>
                                  {slot.exam_name}
                                </p>
                                <p className="mt-1 text-xs font-bold leading-tight" style={{ color: theme.text }}>
                                  {slot.subject_name}
                                </p>
                                
                                <div className="mt-3 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    <Clock size={10} className="text-[var(--student-accent)]" />
                                    {formatTime(slot.start_time)}
                                  </div>
                                  {slot.invigilator_name && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                      <MapPin size={10} className="text-[var(--student-accent)]" />
                                      {slot.invigilator_name}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: `${theme.accent}15` }}>
                                  <span className="text-[9px] font-bold" style={{ color: theme.accent }}>
                                    {slot.room_number ? `Room ${slot.room_number}` : 'Room —'}
                                  </span>
                                  <span className="text-[9px] font-bold text-[var(--color-text-muted)]">
                                    {formatDate(slot.exam_date, 'short')}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                          {slots.length === 0 && (
                            <div className="flex h-[140px] items-center justify-center rounded-[20px] border-2 border-dashed"
                              style={{ borderColor: 'rgba(0,0,0,0.03)', backgroundColor: 'rgba(0,0,0,0.01)' }}
                            >
                              <span className="text-[9px] font-bold tracking-widest text-[var(--color-text-muted)] opacity-20 uppercase">No Exam</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ExamTimetableWeekly