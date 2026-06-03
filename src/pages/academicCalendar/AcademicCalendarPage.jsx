// src/pages/academicCalendar/AcademicCalendarPage.jsx
import { useEffect, useState, useMemo } from 'react'
import { 
  ChevronLeft, ChevronRight, Plus, Filter, 
  MoreVertical, Edit2, Trash2, Globe, Lock,
  Calendar as CalendarIcon, Clock, Users, GraduationCap, Download
} from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, parseISO, startOfDay
} from 'date-fns'
import useAcademicCalendarStore from '@/store/academicCalendarStore'
import useSessionStore from '@/store/sessionStore'
import { PERMISSION } from '@/utils/permissions'
import useAuth from '@/hooks/useAuth'
import usePermissions from '@/hooks/usePermissions'
import { cn } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import IconButton from '@/components/ui/IconButton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EventFormModal from './EventFormModal'
import { toast } from 'react-hot-toast'

const EVENT_TYPES = [
  { id: 'exam', label: 'Exam', color: '#dc2626', bg: 'bg-red-500' },
  { id: 'holiday', label: 'Holiday', color: '#16a34a', bg: 'bg-green-500' },
  { id: 'fee_deadline', label: 'Fee Deadline', color: '#d97706', bg: 'bg-amber-500' },
  { id: 'meeting', label: 'Meeting', color: '#2563eb', bg: 'bg-blue-500' },
  { id: 'sports', label: 'Sports', color: '#7c3aed', bg: 'bg-violet-500' },
  { id: 'cultural', label: 'Cultural', color: '#db2777', bg: 'bg-pink-500' },
  { id: 'result', label: 'Result', color: '#0891b2', bg: 'bg-cyan-500' },
  { id: 'other', label: 'Other', color: '#64748b', bg: 'bg-slate-500' },
]

const AcademicCalendarPage = () => {
  const { user } = useAuth()
  const { can } = usePermissions()
  const { 
    events, isLoading, fetchEvents, deleteEvent, publishEvent,
    activeMonth, activeYear, setMonth, filterType, setFilterType,
    downloadPdf
  } = useAcademicCalendarStore()
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())
  const [filterAudience, setFilterAudience] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const canCreate = can(PERMISSION.CALENDAR_CREATE)
  const canEdit = can(PERMISSION.CALENDAR_EDIT)

  useEffect(() => {
    fetchSessions()
    fetchCurrentSession()
  }, [])

  useEffect(() => {
    if (currentSession && !selectedSessionId) {
      setSelectedSessionId(currentSession.id)
    }
  }, [currentSession])

  useEffect(() => {
    if (selectedSessionId) {
      fetchEvents(selectedSessionId)
    }
  }, [selectedSessionId])

  // Calendar Logic
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const filteredEvents = useMemo(() => {
    let list = events
    if (filterType) list = list.filter(e => e.event_type === filterType)
    if (filterAudience) list = list.filter(e => e.audience === filterAudience)
    return list
  }, [events, filterType, filterAudience])

  const eventsByDate = useMemo(() => {
    const map = {}
    filteredEvents.forEach(event => {
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
  }, [filteredEvents])

  const selectedDateEvents = useMemo(() => {
    return eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
  }, [selectedDate, eventsByDate])

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1))
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1))
  const handleToday = () => {
    const today = new Date()
    setViewDate(today)
    setSelectedDate(today)
  }

  const handleAddEvent = () => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    const res = await deleteEvent(deletingId)
    if (res.success) {
      toast.success('Event deleted')
      setDeletingId(null)
    } else {
      toast.error(res.message)
    }
  }

  const handleTogglePublish = async (id) => {
    const res = await publishEvent(id)
    if (res.success) {
      toast.success(`Event ${res.data.is_published ? 'published' : 'unpublished'}`)
    } else {
      toast.error(res.message)
    }
  }

  const handleDownloadPdf = async () => {
    if (!selectedSessionId) return
    setIsDownloading(true)
    try {
      // Pass the currently viewed month and year to the PDF download
      const month = viewDate.getMonth() + 1
      const year = viewDate.getFullYear()
      const blob = await downloadPdf(selectedSessionId, filterType, month, year)
      const sessionName = sessions.find(s => String(s.id) === String(selectedSessionId))?.name || 'Calendar'
      downloadBlob(blob, `Academic_Calendar_${sessionName.replace(/\s+/g, '_')}.pdf`)
      toast.success('PDF generated successfully')
    } catch (err) {
      console.error('PDF Download Error:', err)
      toast.error(err.message || 'Failed to generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Plan and manage school-wide academic events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <Button 
            variant="secondary" 
            onClick={handleDownloadPdf} 
            loading={isDownloading}
            className="gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>

          {canCreate && (
            <Button onClick={handleAddEvent} className="gap-2">
              <Plus size={18} />
              <span>Add Event</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
        <Filter size={16} className="text-[var(--color-text-muted)]" />
        <button
          onClick={() => setFilterType(null)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
            !filterType ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
          )}
        >
          All Types
        </button>
        {EVENT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border whitespace-nowrap",
              filterType === type.id 
                ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]" 
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 border-t border-[var(--color-border)] pt-2">
        <Users size={16} className="text-[var(--color-text-muted)]" />
        <button
          onClick={() => setFilterAudience(null)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
            !filterAudience ? "bg-slate-700 text-white border-slate-700" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
          )}
        >
          All Audiences
        </button>
        {['everyone', 'students', 'teachers', 'parents', 'staff'].map(aud => (
          <button
            key={aud}
            onClick={() => setFilterAudience(aud)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border capitalize",
              filterAudience === aud 
                ? "bg-slate-700 text-white border-slate-700" 
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)]"
            )}
          >
            {aud}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Panel - Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0 border-[var(--color-border)]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4 bg-[var(--color-surface-raised)]/50">
              <h2 className="text-lg font-bold">{format(viewDate, 'MMMM yyyy')}</h2>
              <div className="flex items-center gap-2">
                <IconButton onClick={handlePrevMonth} variant="ghost" className="hover:bg-[var(--color-border)]">
                  <ChevronLeft size={20} />
                </IconButton>
                <button 
                  onClick={handleToday}
                  className="px-3 py-1 text-sm font-semibold hover:bg-[var(--color-border)] rounded-lg transition-colors"
                >
                  Today
                </button>
                <IconButton onClick={handleNextMonth} variant="ghost" className="hover:bg-[var(--color-border)]">
                  <ChevronRight size={20} />
                </IconButton>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const dayEvents = eventsByDate[dateKey] || []
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, monthStart)

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] border-b border-r border-[var(--color-border)] p-2 transition-all cursor-pointer relative",
                      !isCurrentMonth && "bg-[var(--color-surface-raised)]/30 text-[var(--color-text-muted)]",
                      isSelected && "ring-2 ring-inset ring-[var(--color-brand)] z-10",
                      isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                        isToday(day) ? "bg-[var(--color-brand)] text-white" : "",
                        isSelected && !isToday(day) ? "bg-[var(--color-surface-raised)] text-[var(--color-brand)]" : ""
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = EVENT_TYPES.find(t => t.id === event.event_type)
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white truncate shadow-sm"
                            style={{ backgroundColor: event.color || type?.color || '#64748b' }}
                          >
                            <span className="truncate">{event.title}</span>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] font-bold text-[var(--color-text-muted)] px-1">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right Panel - Event Details */}
        <div className="space-y-6">
          <Card className="border-[var(--color-border)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              {isToday(selectedDate) && (
                <Badge variant="success">Today</Badge>
              )}
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map(event => {
                  const type = EVENT_TYPES.find(t => t.id === event.event_type)
                  return (
                    <div 
                      key={event.id}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] p-4 transition-all hover:border-[var(--color-brand)] hover:shadow-lg hover:shadow-[var(--color-brand)]/5"
                    >
                      <div 
                        className="absolute left-0 top-4 h-6 w-1 rounded-r-full"
                        style={{ backgroundColor: event.color || type?.color }}
                      />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[var(--color-text-primary)] leading-tight">{event.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge 
                              className="text-[10px] uppercase tracking-wider"
                              style={{ 
                                backgroundColor: (event.color || type?.color) + '15',
                                color: event.color || type?.color,
                                borderColor: (event.color || type?.color) + '30'
                              }}
                            >
                              {type?.label || event.event_type}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                              <Clock size={12} />
                              {event.is_all_day ? 'All Day' : `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`}
                            </span>
                          </div>
                        </div>

                        {canEdit && !event.is_readonly && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <IconButton 
                              onClick={() => handleEditEvent(event)}
                              size="sm" variant="ghost" className="hover:text-[var(--color-brand)]"
                            >
                              <Edit2 size={14} />
                            </IconButton>
                            <IconButton 
                              onClick={() => setDeletingId(event.id)}
                              size="sm" variant="ghost" className="hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                            <Users size={12} />
                            <span className="capitalize">{event.audience}</span>
                          </span>
                          {event.target_class_name && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                              <GraduationCap size={12} />
                              {event.target_class_name}
                            </span>
                          )}
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => handleTogglePublish(event.id)}
                            className={cn(
                              "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                              event.is_published 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}
                          >
                            {event.is_published ? <Globe size={10} /> : <Lock size={10} />}
                            {event.is_published ? 'Published' : 'Draft'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-[var(--color-surface-raised)] p-4">
                  <CalendarIcon size={32} className="text-[var(--color-text-muted)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">No events scheduled</p>
                <p className="text-xs text-[var(--color-text-muted)]">Select another date or add a new event.</p>
              </div>
            )}
          </Card>

          <Card className="bg-[var(--color-brand)] text-white border-none shadow-xl shadow-[var(--color-brand)]/20">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <CalendarIcon size={18} />
              Session Info
            </h4>
            <p className="text-xs opacity-90 leading-relaxed">
              Events are specific to the selected academic session. 
              Holiday overlays from the session config are merged automatically.
            </p>
          </Card>
        </div>
      </div>

      <EventFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={editingEvent}
        sessionId={selectedSessionId}
      />

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Event?"
        description="This action cannot be undone. The event will be removed from all calendars."
        variant="danger"
      />
    </div>
  )
}

export default AcademicCalendarPage
