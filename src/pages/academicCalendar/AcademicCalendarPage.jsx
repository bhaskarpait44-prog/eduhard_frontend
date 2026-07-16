// src/pages/academicCalendar/AcademicCalendarPage.jsx
import { useEffect, useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, MoreVertical, Edit2, Trash2,
  Globe, Lock, Calendar as CalendarIcon, Clock, Users,
  GraduationCap, Download, List, Sparkles, History, ScrollText
} from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, parseISO
} from 'date-fns'
import useAcademicCalendarStore from '@/store/academicCalendarStore'
import useSessionStore from '@/store/sessionStore'
import useAuditStore from '@/store/auditStore'
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
  { id: 'exam',         label: 'Exam',         color: '#dc2626', bg: 'bg-red-500',    ring: 'ring-red-500/30',    soft: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900' },
  { id: 'holiday',      label: 'Holiday',      color: '#16a34a', bg: 'bg-emerald-500',ring: 'ring-emerald-500/30',soft: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  { id: 'fee_deadline', label: 'Fee Deadline', color: '#d97706', bg: 'bg-amber-500',  ring: 'ring-amber-500/30',  soft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900' },
  { id: 'meeting',      label: 'Meeting',      color: '#2563eb', bg: 'bg-blue-500',   ring: 'ring-blue-500/30',   soft: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900' },
  { id: 'sports',       label: 'Sports',       color: '#7c3aed', bg: 'bg-violet-500', ring: 'ring-violet-500/30', soft: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900' },
  { id: 'cultural',     label: 'Cultural',     color: '#db2777', bg: 'bg-pink-500',   ring: 'ring-pink-500/30',   soft: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900' },
  { id: 'result',       label: 'Result',       color: '#0891b2', bg: 'bg-cyan-500',   ring: 'ring-cyan-500/30',   soft: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900' },
  { id: 'other',        label: 'Other',        color: '#64748b', bg: 'bg-slate-500',  ring: 'ring-slate-500/30',  soft: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700' },
]

const AUDIENCES = ['everyone', 'students', 'teachers', 'parents', 'staff']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const AcademicCalendarPage = () => {
  const { user } = useAuth()
  const { can } = usePermissions()
  const {
    events, isLoading, fetchEvents, deleteEvent, publishEvent,
    filterType, setFilterType, downloadPdf
  } = useAcademicCalendarStore()
  const { sessions, currentSession, fetchSessions, fetchCurrentSession } = useSessionStore()
  const { logs: auditLogs, isLoading: isAuditLoading, fetchLogs: fetchAuditLogs } = useAuditStore()

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())
  const [filterAudience, setFilterAudience] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [viewMode, setViewMode] = useState('calendar')

  const canCreate = can(PERMISSION.CALENDAR_CREATE)
  const canEdit = can(PERMISSION.CALENDAR_EDIT)

  useEffect(() => {
    if (viewMode === 'audit') {
      fetchAuditLogs({ table_name: 'academic_events', limit: 50 }).catch(() => {})
    }
  }, [viewMode, fetchAuditLogs])

  useEffect(() => {
    fetchSessions()
    fetchCurrentSession()
  }, [])

  useEffect(() => {
    if (currentSession && !selectedSessionId) setSelectedSessionId(currentSession.id)
  }, [currentSession])

  useEffect(() => {
    if (selectedSessionId) fetchEvents(selectedSessionId)
  }, [selectedSessionId])

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
      eachDayOfInterval({ start, end }).forEach(day => {
        const key = format(day, 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        map[key].push(event)
      })
    })
    return map
  }, [filteredEvents])

  const selectedDateEvents = useMemo(
    () => eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || [],
    [selectedDate, eventsByDate]
  )

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1))
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1))
  const handleToday = () => {
    const today = new Date()
    setViewDate(today)
    setSelectedDate(today)
  }

  const handleAddEvent = () => { setEditingEvent(null); setIsModalOpen(true) }
  const handleEditEvent = (event) => { setEditingEvent(event); setIsModalOpen(true) }

  const handleDelete = async () => {
    const res = await deleteEvent(deletingId)
    if (res.success) { toast.success('Event deleted'); setDeletingId(null) }
    else toast.error(res.message)
  }

  const handleTogglePublish = async (id) => {
    const res = await publishEvent(id)
    if (res.success) toast.success(`Event ${res.data.is_published ? 'published' : 'unpublished'}`)
    else toast.error(res.message)
  }

  const handleDownloadPdf = async () => {
    if (!selectedSessionId) return
    setIsDownloading(true)
    try {
      const blob = await downloadPdf(selectedSessionId, filterType, filterAudience, null, null, viewMode)
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

  const chipBase = "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border whitespace-nowrap"
  const chipIdle = "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong,var(--color-border))]"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand)]/70 text-white shadow-sm">
              <CalendarIcon className="h-4.5 w-4.5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Academic Calendar
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] pl-11">
            Plan and manage school-wide academic events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-primary)] shadow-sm outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                viewMode === 'calendar'
                  ? "bg-[var(--color-brand)] text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                viewMode === 'list'
                  ? "bg-[var(--color-brand)] text-white shadow-sm"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            {can(PERMISSION.AUDIT_VIEW) && (
              <button
                onClick={() => setViewMode('audit')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  viewMode === 'audit'
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                )}
              >
                <History className="h-3.5 w-3.5" />
                Audit Logs
              </button>
            )}
          </div>

          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading || !selectedSessionId}
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            {isDownloading ? 'Generating…' : 'Download PDF'}
          </Button>

          {canCreate && (
            <Button onClick={handleAddEvent} className="h-9 gap-1.5 text-xs font-semibold shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {viewMode !== 'audit' && (
        <Card className="p-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mr-1">Type</span>
            <button
              onClick={() => setFilterType(null)}
              className={cn(chipBase, !filterType
                ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-sm"
                : chipIdle)}
            >
              All Types
            </button>
            {EVENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={cn(chipBase, "flex items-center gap-1.5",
                  filterType === type.id
                    ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)] shadow-sm"
                    : chipIdle
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", type.bg)} />
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[var(--color-border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mr-1">Audience</span>
            <button
              onClick={() => setFilterAudience(null)}
              className={cn(chipBase, !filterAudience
                ? "bg-slate-800 text-white border-slate-800 shadow-sm dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200"
                : chipIdle)}
            >
              All Audiences
            </button>
            {AUDIENCES.map(aud => (
              <button
                key={aud}
                onClick={() => setFilterAudience(aud)}
                className={cn(chipBase, "capitalize",
                  filterAudience === aud
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200"
                    : chipIdle
                )}
              >
                {aud}
              </button>
            ))}
          </div>
        </Card>
      )}

      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-surface-raised)]/40">
                <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                  {format(viewDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1">
                  <IconButton onClick={handlePrevMonth} size="sm" variant="ghost" aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </IconButton>
                  <button
                    onClick={handleToday}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Today
                  </button>
                  <IconButton onClick={handleNextMonth} size="sm" variant="ghost" aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/40">
                {WEEKDAYS.map(day => (
                  <div key={day} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDate[dateKey] || []
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, monthStart)
                  const today = isToday(day)

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "group min-h-[108px] border-b border-r border-[var(--color-border)] p-1.5 transition-all cursor-pointer relative",
                        (idx + 1) % 7 === 0 && "border-r-0",
                        !isCurrentMonth && "bg-[var(--color-surface-raised)]/20 text-[var(--color-text-muted)]",
                        isCurrentMonth && "hover:bg-[var(--color-surface-raised)]/40",
                        today && "bg-blue-50/40 dark:bg-blue-950/20",
                        isSelected && "ring-2 ring-inset ring-[var(--color-brand)] z-10 bg-[var(--color-brand)]/5"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                          today && "bg-[var(--color-brand)] text-white shadow-sm",
                          !today && isSelected && "text-[var(--color-brand)]",
                          !today && !isSelected && isCurrentMonth && "text-[var(--color-text-primary)]",
                          !isCurrentMonth && "text-[var(--color-text-muted)]"
                        )}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && !isSelected && (
                          <span className="text-[9px] font-bold text-[var(--color-text-muted)]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => {
                          const type = EVENT_TYPES.find(t => t.id === event.event_type)
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm",
                                type?.bg || 'bg-slate-500'
                              )}
                              title={event.title}
                            >
                              <span className="truncate">{event.title}</span>
                            </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="px-1.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)]/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {format(selectedDate, 'EEEE')}
                    </p>
                    <h3 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </h3>
                  </div>
                  {isToday(selectedDate) && (
                    <Badge className="bg-[var(--color-brand)] text-white">Today</Badge>
                  )}
                </div>
              </div>

              <div className="p-4 max-h-[520px] overflow-y-auto">
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map(event => {
                      const type = EVENT_TYPES.find(t => t.id === event.event_type)
                      return (
                        <div
                          key={event.id}
                          className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 pl-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--color-brand)]/40"
                        >
                          <span className={cn("absolute left-0 top-0 bottom-0 w-1", type?.bg || 'bg-slate-400')} />

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">
                                {event.title}
                              </h4>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", type?.soft)}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", type?.bg)} />
                                  {type?.label || event.event_type}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                  <Clock className="h-3 w-3" />
                                  {event.is_all_day
                                    ? 'All Day'
                                    : `${event.start_time}${event.end_time ? ` – ${event.end_time}` : ''}`}
                                </span>
                              </div>
                            </div>

                            {canEdit && !event.is_readonly && (
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <IconButton
                                  onClick={() => handleEditEvent(event)}
                                  size="sm" variant="ghost"
                                  className="hover:text-[var(--color-brand)]"
                                  aria-label="Edit event"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </IconButton>
                                <IconButton
                                  onClick={() => setDeletingId(event.id)}
                                  size="sm" variant="ghost"
                                  className="hover:text-red-500"
                                  aria-label="Delete event"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconButton>
                              </div>
                            )}
                          </div>

                          {event.description && (
                            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
                              {event.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[var(--color-border)]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--color-text-secondary)]">
                                <Users className="h-3 w-3" />
                                {event.audience}
                              </span>
                              {event.target_class_name && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                  <GraduationCap className="h-3 w-3" />
                                  {event.target_class_name}
                                </span>
                              )}
                            </div>

                            {canEdit && !event.is_readonly && (
                              <button
                                onClick={() => handleTogglePublish(event.id)}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all border",
                                  event.is_published
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700"
                                )}
                              >
                                {event.is_published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
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
                    <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-raised)]">
                      <CalendarIcon className="h-6 w-6 text-[var(--color-text-muted)]" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">No events scheduled</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Select another date or add a new event.
                    </p>
                    {canCreate && (
                      <Button onClick={handleAddEvent} size="sm" variant="outline" className="mt-4 gap-1.5 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        Add Event
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-[var(--color-brand)]/5 via-transparent to-transparent border-[var(--color-brand)]/20">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                Session Info
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Events are specific to the selected academic session. Holiday overlays
                from the session config are merged automatically.
              </p>
            </Card>
          </div>
        </div>
      )}
 
      {viewMode === 'list' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/40">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Month</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Date / Duration</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Event</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Category</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Audience</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-raised)]">
                          <CalendarIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">No events found</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Try adjusting your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  [...filteredEvents]
                    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                    .map((event) => {
                      const type = EVENT_TYPES.find(t => t.id === event.event_type)
                      const sd = parseISO(event.start_date)
                      const monthName = format(sd, 'MMMM')
                      const dateText = event.start_date === event.end_date
                        ? format(sd, 'dd MMM yyyy')
                        : `${format(sd, 'dd MMM')} – ${format(parseISO(event.end_date), 'dd MMM yyyy')}`

                      return (
                        <tr key={event.id} className="group transition-colors hover:bg-[var(--color-surface-raised)]/30">
                          <td className="px-4 py-3">
                            <div className="inline-flex flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 min-w-[52px]">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                                {monthName.substring(0, 3)}
                              </span>
                              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                                {format(sd, 'dd')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                            {dateText}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{event.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap", type?.soft)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", type?.bg)} />
                              {type?.label || event.event_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--color-text-secondary)]">
                                <Users className="h-3 w-3" />
                                {event.audience}
                              </span>
                              {event.target_class_name && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                                  <GraduationCap className="h-3 w-3" />
                                  {event.target_class_name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && !event.is_readonly && (
                                <>
                                  <button
                                    onClick={() => handleTogglePublish(event.id)}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-all border",
                                      event.is_published
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700"
                                    )}
                                  >
                                    {event.is_published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    {event.is_published ? 'Published' : 'Draft'}
                                  </button>
                                  <IconButton
                                    onClick={() => handleEditEvent(event)}
                                    size="sm" variant="ghost"
                                    className="hover:text-[var(--color-brand)] border border-transparent hover:border-[var(--color-border)]"
                                    aria-label="Edit"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => setDeletingId(event.id)}
                                    size="sm" variant="ghost"
                                    className="hover:text-red-500 border border-transparent hover:border-[var(--color-border)]"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </IconButton>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {viewMode === 'audit' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Academic Calendar Audit Trail</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Showing latest change logs for academic events</p>
          </div>
          {isAuditLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--color-surface-raised)] rounded-xl" />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center">
              <ScrollText className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No audit logs found</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Changes to calendar events will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 text-left">
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Timestamp</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Event ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Field Changed</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Before → After</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Reason / Note</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                  {auditLogs.map(log => {
                    const formattedDate = new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                    const FIELD_LABELS = {
                      title: 'Title',
                      description: 'Description',
                      event_type: 'Event Type',
                      start_date: 'Start Date',
                      end_date: 'End Date',
                      start_time: 'Start Time',
                      end_time: 'End Time',
                      is_all_day: 'All Day setting',
                      audience: 'Audience',
                      target_class_id: 'Target Class',
                      color: 'Color',
                      is_published: 'Publish Status',
                      notify_on_publish: 'Notify Audience',
                      is_deleted: 'Deleted'
                    }
                    const label = FIELD_LABELS[log.field_name] || log.field_name
                    return (
                      <tr key={log.id} className="hover:bg-[var(--color-surface-raised)]/30 transition-colors">
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{formattedDate}</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-500">#{log.record_id}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] px-1 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300 rounded font-semibold line-through">
                              {log.old_value !== null ? String(log.old_value) : 'None'}
                            </span>
                            <span>→</span>
                            <span className="text-[10px] px-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 rounded font-semibold">
                              {log.new_value !== null ? String(log.new_value) : 'None'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs italic text-[var(--color-text-muted)] break-words">
                          {log.reason ? `"${log.reason}"` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-[var(--color-brand)]">
                              {(log.changed_by_name || 'A')[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[var(--color-text-primary)]">{log.changed_by_name || 'System'}</span>
                              <span className="text-[9px] text-[var(--color-text-muted)]">{log.changed_by_email || ''}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

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
