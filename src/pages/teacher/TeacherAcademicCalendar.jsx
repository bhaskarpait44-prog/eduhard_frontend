// src/pages/teacher/TeacherAcademicCalendar.jsx
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
import EventFormModal from '../academicCalendar/EventFormModal'
import { toast } from 'react-hot-toast'
import usePageTitle from '@/hooks/usePageTitle'

const EVENT_TYPES = [
  { id: 'exam', label: 'Exam', color: '#ef4444', bg: 'bg-red-500' },
  { id: 'holiday', label: 'Holiday', color: '#10b981', bg: 'bg-emerald-500' },
  { id: 'fee_deadline', label: 'Fee Deadline', color: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'meeting', label: 'Meeting', color: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'sports', label: 'Sports', color: '#8b5cf6', bg: 'bg-violet-500' },
  { id: 'cultural', label: 'Cultural', color: '#ec4899', bg: 'bg-pink-500' },
  { id: 'result', label: 'Result', color: '#06b6d4', bg: 'bg-cyan-500' },
  { id: 'other', label: 'Other', color: '#64748b', bg: 'bg-slate-500' },
]

const TeacherAcademicCalendar = () => {
  usePageTitle('Academic Calendar')
  const { user } = useAuth()
  const { can } = usePermissions()
  const { 
    events, isLoading, fetchEvents, deleteEvent, publishEvent,
    filterType, setFilterType, downloadPdf
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

  // Calendar Grid Calculations
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
      toast.success('Event deleted successfully')
      setDeletingId(null)
    } else {
      toast.error(res.message || 'Failed to delete event')
    }
  }

  const handleTogglePublish = async (id) => {
    const res = await publishEvent(id)
    if (res.success) {
      toast.success(`Event ${res.data.is_published ? 'published' : 'unpublished'} successfully`)
    } else {
      toast.error(res.message || 'Failed to update publication status')
    }
  }

  const handleDownloadPdf = async () => {
    if (!selectedSessionId) return
    setIsDownloading(true)
    try {
      const blob = await downloadPdf(selectedSessionId, filterType, filterAudience, null, null)
      const sessionName = sessions.find(s => String(s.id) === String(selectedSessionId))?.name || 'Calendar'
      downloadBlob(blob, `Academic_Calendar_${sessionName.replace(/\s+/g, '_')}.pdf`)
      toast.success('Calendar PDF generated successfully')
    } catch (err) {
      console.error('PDF Download Error:', err)
      toast.error(err.message || 'Failed to generate PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Header section with brand colored actions */}
      <section 
        className="rounded-[28px] border p-5 sm:p-6" 
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-sidebar-hover)]" style={{ color: 'var(--color-brand)' }}>
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Academic Calendar</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                View, filter, and plan for school holidays, exams, and scheduled academic events.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-2xl border px-3 py-2 text-sm font-semibold outline-none transition-all focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
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
              className="gap-2 rounded-2xl hover:bg-[var(--color-sidebar-hover)]"
              style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>

            {canCreate && (
              <Button 
                onClick={handleAddEvent} 
                className="gap-2 rounded-2xl text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                <Plus size={18} />
                <span>Add Event</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Filters panels */}
      <section 
        className="rounded-[24px] border p-4 sm:p-5 space-y-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: 'var(--color-text-muted)' }}>Event Type:</span>
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all border",
              !filterType 
                ? "text-white border-transparent" 
                : "bg-transparent hover:bg-[var(--color-sidebar-hover)]"
            )}
            style={{ 
              backgroundColor: !filterType ? 'var(--color-brand)' : 'transparent',
              borderColor: !filterType ? 'transparent' : 'var(--color-border)',
              color: !filterType ? '#fff' : 'var(--color-text-secondary)'
            }}
          >
            All Types
          </button>
          {EVENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all border whitespace-nowrap",
                filterType === type.id 
                  ? "text-white border-transparent" 
                  : "bg-transparent hover:bg-[var(--color-sidebar-hover)]"
              )}
              style={{ 
                backgroundColor: filterType === type.id ? 'var(--color-brand)' : 'transparent',
                borderColor: filterType === type.id ? 'transparent' : 'var(--color-border)',
                color: filterType === type.id ? '#fff' : 'var(--color-text-secondary)'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
          <span className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: 'var(--color-text-muted)' }}>Target Audience:</span>
          <button
            onClick={() => setFilterAudience(null)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all border",
              !filterAudience 
                ? "bg-slate-700 dark:bg-slate-600 text-white border-transparent" 
                : "bg-transparent hover:bg-[var(--color-sidebar-hover)]"
            )}
            style={{ 
              borderColor: !filterAudience ? 'transparent' : 'var(--color-border)',
              color: !filterAudience ? '#fff' : 'var(--color-text-secondary)'
            }}
          >
            All Audiences
          </button>
          {['everyone', 'students', 'teachers', 'parents', 'staff'].map(aud => (
            <button
              key={aud}
              onClick={() => setFilterAudience(aud)}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all border capitalize",
                filterAudience === aud 
                  ? "bg-slate-700 dark:bg-slate-600 text-white border-transparent" 
                  : "bg-transparent hover:bg-[var(--color-sidebar-hover)]"
              )}
              style={{ 
                borderColor: filterAudience === aud ? 'transparent' : 'var(--color-border)',
                color: filterAudience === aud ? '#fff' : 'var(--color-text-secondary)'
              }}
            >
              {aud}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid Calendar + Events Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar Grid panel */}
        <div className="lg:col-span-2">
          <section 
            className="rounded-[28px] border overflow-hidden p-0"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {/* Header control inside calendar */}
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{format(viewDate, 'MMMM yyyy')}</h2>
              <div className="flex items-center gap-2">
                <IconButton 
                  onClick={handlePrevMonth} 
                  variant="ghost" 
                  className="hover:bg-[var(--color-sidebar-hover)] rounded-xl"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronLeft size={20} />
                </IconButton>
                <button 
                  onClick={handleToday}
                  className="px-3.5 py-1.5 text-sm font-semibold hover:bg-[var(--color-sidebar-hover)] rounded-xl transition-all border"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                >
                  Today
                </button>
                <IconButton 
                  onClick={handleNextMonth} 
                  variant="ghost" 
                  className="hover:bg-[var(--color-sidebar-hover)] rounded-xl"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ChevronRight size={20} />
                </IconButton>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b text-center py-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days list */}
            <div className="grid grid-cols-7 bg-[var(--color-border)] gap-[1px]">
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
                      "min-h-[110px] p-2.5 transition-all cursor-pointer relative flex flex-col justify-between",
                      !isCurrentMonth ? "bg-[var(--color-surface-raised)]/40 text-[var(--color-text-muted)]" : "bg-[var(--color-surface)]",
                      isSelected && "ring-2 ring-inset ring-[var(--color-brand)] z-10",
                      isToday(day) && "bg-emerald-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                        isToday(day) ? "bg-[var(--color-brand)] text-white shadow-sm shadow-[var(--color-brand)]/20" : "",
                        isSelected && !isToday(day) ? "bg-[var(--color-sidebar-hover)] text-[var(--color-brand)]" : ""
                      )}
                      style={{
                        color: isToday(day) ? '#fff' : isSelected && !isToday(day) ? 'var(--color-brand)' : 'var(--color-text-primary)',
                        backgroundColor: isToday(day) ? 'var(--color-brand)' : isSelected && !isToday(day) ? 'var(--color-sidebar-hover)' : 'transparent'
                      }}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="space-y-1 mt-auto">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = EVENT_TYPES.find(t => t.id === event.event_type)
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-bold text-white truncate shadow-sm"
                            style={{ backgroundColor: event.color || type?.color || '#64748b' }}
                          >
                            <span className="truncate">{event.title}</span>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] font-bold text-[var(--color-text-muted)] px-1">
                          + {dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Selected day events detail panel */}
        <div className="space-y-6">
          <section 
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="mb-5 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
                  Selected Date
                </p>
                <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
              </div>
              {isToday(selectedDate) && (
                <Badge 
                  style={{ backgroundColor: 'var(--color-sidebar-hover)', color: 'var(--color-brand)', borderColor: 'rgba(0,188,125,0.1)' }}
                  className="font-bold border uppercase text-[10px] tracking-wider px-2.5 py-1 rounded-xl"
                >
                  Today
                </Badge>
              )}
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map(event => {
                  const type = EVENT_TYPES.find(t => t.id === event.event_type)
                  return (
                    <div 
                      key={event.id}
                      className="group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:shadow-md"
                      style={{ 
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-raised)',
                      }}
                    >
                      <div 
                        className="absolute left-0 top-4 h-6 w-1 rounded-r-full"
                        style={{ backgroundColor: event.color || type?.color }}
                      />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[14px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>{event.title}</p>
                          {event.description && (
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                              {event.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge 
                              className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ 
                                backgroundColor: (event.color || type?.color) + '15',
                                color: event.color || type?.color,
                                borderColor: (event.color || type?.color) + '30'
                              }}
                            >
                              {type?.label || event.event_type}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                              <Clock size={12} />
                              {event.is_all_day ? 'All Day' : `${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}`}
                            </span>
                          </div>
                        </div>

                        {canEdit && !event.is_readonly && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <IconButton 
                              onClick={() => handleEditEvent(event)}
                              variant="ghost"
                              className="h-8 w-8 hover:bg-[var(--color-sidebar-hover)] text-blue-600 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </IconButton>
                            <IconButton 
                              onClick={() => setDeletingId(event.id)}
                              variant="ghost"
                              className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </div>
                        )}
                      </div>

                      {/* Display publication status if teacher has edit permissions */}
                      {canEdit && (
                        <div className="mt-1.5 flex items-center justify-between border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                          <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            {event.is_published ? (
                              <>
                                <Globe size={11} className="text-emerald-500" /> Published (Everyone)
                              </>
                            ) : (
                              <>
                                <Lock size={11} className="text-amber-500" /> Draft (Admin only)
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => handleTogglePublish(event.id)}
                            className="text-[10px] font-bold hover:underline transition-all"
                            style={{ color: 'var(--color-brand)' }}
                          >
                            {event.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CalendarIcon size={24} className="mx-auto opacity-20" style={{ color: 'var(--color-text-primary)' }} />
                <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No events scheduled</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>There are no holidays, exams or events listed for this date.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Confirmation & Form modals */}
      {isModalOpen && (
        <EventFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={editingEvent}
          sessionId={selectedSessionId}
          defaultDate={selectedDate}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          open={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={handleDelete}
          title="Delete Event"
          description="Are you sure you want to permanently delete this academic calendar event? This action cannot be undone."
          confirmLabel="Delete Event"
          cancelLabel="Keep Event"
          variant="danger"
        />
      )}
    </div>
  )
}

export default TeacherAcademicCalendar
