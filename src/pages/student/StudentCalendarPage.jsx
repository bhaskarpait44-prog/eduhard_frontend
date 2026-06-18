// src/pages/student/StudentCalendarPage.jsx
import { useEffect, useState, useMemo } from 'react'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Info, LayoutGrid, List
} from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, parseISO
} from 'date-fns'
import useAcademicCalendarStore from '@/store/academicCalendarStore'
import useStudentStore from '@/store/useStudentStore'
import useSessionStore from '@/store/sessionStore'
import { cn } from '@/utils/helpers'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'

const EVENT_TYPES = {
  exam: { label: 'Exam', color: '#dc2626' },
  holiday: { label: 'Holiday', color: '#16a34a' },
  fee_deadline: { label: 'Fee Deadline', color: '#d97706' },
  meeting: { label: 'Meeting', color: '#2563eb' },
  sports: { label: 'Sports', color: '#7c3aed' },
  cultural: { label: 'Cultural', color: '#db2777' },
  result: { label: 'Result', color: '#0891b2' },
  other: { label: 'Other', color: '#64748b' },
}

const StudentCalendarPage = () => {
  const { events, isLoading, fetchStudentEvents } = useAcademicCalendarStore()
  const { dashboard, fetchDashboard } = useStudentStore()
  const { currentSession, fetchCurrentSession } = useSessionStore()
  
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    if (!dashboard) {
      fetchDashboard().catch(() => {})
    }
    if (!currentSession) {
      fetchCurrentSession().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const sessionId = dashboard?.student?.current_session_id || currentSession?.id
    if (sessionId) {
      fetchStudentEvents(sessionId)
    }
  }, [dashboard, currentSession])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(event => {
      const start = parseISO(event.start_date)
      const end = parseISO(event.end_date || event.start_date)
      const days = eachDayOfInterval({ start, end })

      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd')
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(event)
      })
    })
    return map
  }, [events])

  const selectedDateEvents = useMemo(() => {
    return eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
  }, [selectedDate, eventsByDate])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  }, [events])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Academic Calendar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Stay updated with exams, holidays, and school events.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] p-1 border border-[var(--color-border)] shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
              viewMode === 'grid' ? "bg-[var(--color-brand)] text-white shadow-md shadow-violet-500/20" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]"
            )}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
              viewMode === 'list' ? "bg-[var(--color-brand)] text-white shadow-md shadow-violet-500/20" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]"
            )}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Section - Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden p-0 border-[var(--color-border)] shadow-xl shadow-violet-500/5">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4 bg-[var(--color-surface-raised)]/40">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{format(viewDate, 'MMMM yyyy')}</h2>
                <div className="flex items-center gap-2">
                  <IconButton onClick={() => setViewDate(subMonths(viewDate, 1))} variant="ghost" className="hover:bg-[var(--color-border)]">
                    <ChevronLeft size={20} />
                  </IconButton>
                  <button 
                    onClick={() => {
                      const today = new Date()
                      setViewDate(today)
                      setSelectedDate(today)
                    }}
                    className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors"
                  >
                    Today
                  </button>
                  <IconButton onClick={() => setViewDate(addMonths(viewDate, 1))} variant="ghost" className="hover:bg-[var(--color-border)]">
                    <ChevronRight size={20} />
                  </IconButton>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/20">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDate[dateKey] || []
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, monthStart)

                  return (
                    <div
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[90px] border-b border-r border-[var(--color-border)] p-2 transition-all cursor-pointer relative group",
                        !isCurrentMonth && "bg-[var(--color-surface-raised)]/20 text-[var(--color-text-muted)] opacity-40",
                        isSelected && "bg-violet-50/30 dark:bg-violet-900/5",
                        isToday(day) && "bg-blue-50/30 dark:bg-blue-900/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-all",
                          isToday(day) ? "bg-[var(--color-brand)] text-white shadow-lg shadow-violet-500/30" : "text-[var(--color-text-primary)]",
                          isSelected && !isToday(day) ? "ring-2 ring-inset ring-[var(--color-brand)]" : ""
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="h-1.5 w-1.5 rounded-full shadow-sm"
                            style={{ backgroundColor: event.color || EVENT_TYPES[event.event_type]?.color || '#64748b' }}
                            title={event.title}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Right Section - Events for selected day */}
          <div className="space-y-6">
            <Card className="border-[var(--color-border)] shadow-xl shadow-violet-500/5">
              <h3 className="text-lg font-bold mb-4 text-[var(--color-text-primary)]">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map(event => {
                    const type = EVENT_TYPES[event.event_type]
                    return (
                      <div 
                        key={event.id}
                        className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] p-4 transition-all hover:bg-[var(--color-surface-raised)]/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-[var(--color-text-primary)] leading-tight">{event.title}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span 
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: event.color || type?.color }}
                              />
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                                {type?.label || event.event_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] shrink-0">
                            <Info size={14} />
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed italic">
                            "{event.description}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {event.is_all_day ? 'All Day' : `${event.start_time} - ${event.end_time}`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-3xl bg-[var(--color-surface-raised)] p-5 text-[var(--color-text-muted)]">
                    <CalendarIcon size={32} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">No events today</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)] px-4">Tap any date with dots to see what's happening.</p>
                </div>
              )}
            </Card>

            {/* Quick Legend */}
            <Card className="border-[var(--color-border)] bg-[var(--color-surface-raised)]/30">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Event Legend</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {Object.entries(EVENT_TYPES).map(([key, data]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{data.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-4">
            {events.length > 0 ? (
              <div className="space-y-8">
                {/* Simplified Grouping by Month/Year */}
                {(() => {
                  const groups = {}
                  sortedEvents.forEach(event => {
                    const monthYear = format(parseISO(event.start_date), 'MMMM yyyy')
                    if (!groups[monthYear]) groups[monthYear] = []
                    groups[monthYear].push(event)
                  })

                  return Object.entries(groups).map(([monthYear, monthEvents]) => (
                    <div key={monthYear} className="space-y-4">
                      <h3 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                        <span className="h-px flex-1 bg-[var(--color-border)]" />
                        {monthYear}
                        <span className="h-px flex-1 bg-[var(--color-border)]" />
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {monthEvents.map(event => {
                          const type = EVENT_TYPES[event.event_type]
                          return (
                            <Card key={event.id} className="relative overflow-hidden border-[var(--color-border)] hover:border-[var(--color-brand)] transition-colors">
                              <div 
                                className="absolute top-0 left-0 w-1.5 h-full" 
                                style={{ backgroundColor: event.color || type?.color }} 
                              />
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                                    {format(parseISO(event.start_date), 'EEE, MMM d')}
                                    {event.end_date && event.end_date !== event.start_date && ` - ${format(parseISO(event.end_date), 'EEE, MMM d')}`}
                                  </p>
                                  <h4 className="font-bold text-[var(--color-text-primary)] mb-2 line-clamp-1">{event.title}</h4>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <Badge 
                                      className="text-[10px] font-bold"
                                      style={{ 
                                        backgroundColor: (event.color || type?.color) + '15', 
                                        color: event.color || type?.color 
                                      }}
                                    >
                                      {type?.label || event.event_type}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                                      <Clock size={12} />
                                      {event.is_all_day ? 'All Day' : `${event.start_time} - ${event.end_time}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {event.description && (
                                <p className="mt-3 text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed italic border-t border-[var(--color-border)] pt-3">
                                  "{event.description}"
                                </p>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed">
                <div className="mb-4 rounded-full bg-[var(--color-surface-raised)] p-6 text-[var(--color-text-muted)]">
                  <CalendarIcon size={48} />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">No events found</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xs">
                  Your academic calendar is currently empty for this session.
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-[var(--color-border)] bg-[var(--color-surface-raised)]/30">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">Event Categories</h4>
              <div className="space-y-3">
                {Object.entries(EVENT_TYPES).map(([key, data]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{data.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                      {events.filter(e => e.event_type === key).length}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none shadow-xl shadow-violet-500/20">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Info size={18} />
                About the Calendar
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                The academic calendar lists all important dates for your current session. 
                Use the grid view to see dates visually, or list view for a chronological agenda.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentCalendarPage
