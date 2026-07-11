import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import {
  AlarmClock, ArrowRight, BellPlus, BookMarked, BookOpenCheck, CalendarDays, CheckCheck,
  CircleAlert, ClipboardCheck, LayoutGrid, RefreshCw, Users, WifiOff, Sparkles, GraduationCap, Clock,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherDashboard from '@/hooks/useTeacherDashboard'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import { ROUTES } from '@/constants/app'
import { titleCase } from '@/utils/helpers'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

const TeacherDashboard = () => {
  usePageTitle('Teacher Dashboard')

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toastInfo, toastError } = useToast()
  const {
    dashboard,
    schedule,
    recentActivity,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh,
  } = useTeacherDashboard()

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const scheduleRows = schedule || []
  const glance = dashboard?.today_at_a_glance || {}
  const nextPeriod = glance?.todays_classes?.next_period || null
  const unmarkedCount = Math.max(
    0,
    Number(glance?.attendance_status?.total || 0) - Number(glance?.attendance_status?.marked || 0)
  )

  const statsCards = [
    {
      key: 'classes',
      title: "Today's Classes",
      icon: CalendarDays,
      tone: unmarkedCount === 0 ? '#10b981' : '#f59e0b',
      route: ROUTES.TEACHER_TIMETABLE,
      metric: String(glance?.todays_classes?.total_periods || 0),
      metricLabel: 'Periods Scheduled',
      description: Number(glance?.todays_classes?.total_periods || 0) === 0
        ? 'No classes scheduled today'
        : (nextPeriod
            ? `Next: ${formatSubjectClass(nextPeriod)}`
            : 'No more periods left today'),
    },
    {
      key: 'attendance',
      title: 'Attendance Status',
      icon: ClipboardCheck,
      tone: unmarkedCount === 0 ? '#10b981' : '#ef4444',
      route: ROUTES.TEACHER_ATTENDANCE_MARK,
      metric: `${glance?.attendance_status?.marked || 0}/${glance?.attendance_status?.total || 0}`,
      metricLabel: 'Sections Marked',
      description: Number(glance?.attendance_status?.total || 0) === 0
        ? 'No classes scheduled today'
        : (Number(glance?.attendance_status?.marked || 0) === 0
            ? 'Attendance not marked yet'
            : (Number(glance?.attendance_status?.marked || 0) === Number(glance?.attendance_status?.total || 0)
                ? 'All attendance marked today'
                : `${glance.attendance_status.marked} of ${glance.attendance_status.total || 0} marked today`)),
    },
    {
      key: 'marks',
      title: 'Pending Marks Entry',
      icon: BookOpenCheck,
      tone: Number(glance?.pending_marks?.pending_exams || 0) > 0 ? '#ef4444' : '#10b981',
      route: ROUTES.TEACHER_MARKS_ENTER,
      metric: String(glance?.pending_marks?.pending_exams || 0),
      metricLabel: 'Exams Pending',
      description: Number(glance?.pending_marks?.pending_exams || 0) === 0
        ? 'All exam marks submitted'
        : `Marks pending for ${glance.pending_marks.pending_exams} exam(s)`,
    },
    {
      key: 'students',
      title: 'My Students Today',
      icon: Users,
      tone: '#00bc7d',
      route: ROUTES.TEACHER_STUDENTS,
      metric: `${Number(glance?.my_students_today?.percentage || 0).toFixed(0)}%`,
      metricLabel: 'Attendance Rate',
      description: Number(glance?.attendance_status?.total || 0) === 0
        ? 'No classes scheduled today'
        : (Number(glance?.attendance_status?.marked || 0) === 0
            ? 'Awaiting attendance marking'
            : `${glance?.my_students_today?.present || 0} present (${glance?.my_students_today?.absent || 0} absent)`),
    },
  ]

  const quickActions = [
    { 
      label: 'Mark Attendance', 
      desc: 'Submit daily student attendance for your sections.', 
      icon: ClipboardCheck, 
      route: ROUTES.TEACHER_ATTENDANCE_MARK, 
      tone: '#10b981' 
    },
    { 
      label: 'Enter Marks', 
      desc: 'Record exam and class test scores for subjects.', 
      icon: BookMarked, 
      route: ROUTES.TEACHER_MARKS_ENTER, 
      tone: '#00897b' 
    },
    { 
      label: 'Post Notice', 
      desc: 'Send general announcements directly to students.', 
      icon: BellPlus, 
      route: ROUTES.TEACHER_NOTICE_NEW, 
      tone: '#00bc7d' 
    },
    { 
      label: 'View Timetable', 
      desc: 'Check your scheduled classes and room slots.', 
      icon: LayoutGrid, 
      route: ROUTES.TEACHER_TIMETABLE, 
      tone: '#f59e0b' 
    },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing dashboard')
    try {
      await refresh()
    } catch (err) {
      console.error('Refresh error:', err)
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-[1400px] mx-auto space-y-6 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {offline && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
          style={{ borderColor: '#f59e0b55', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-text-primary)' }}
        >
          <WifiOff size={18} style={{ color: '#f59e0b' }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">You are offline</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Changes will sync when connection returns. Pull to refresh once you are back online.
            </p>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, <span className="text-brand">{dashboard?.teacher?.name || user?.name || 'Teacher'}</span>!
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Here is your classroom overview and schedule for today.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {formatLongDate(dashboard?.date)}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <GraduationCap size={13} />
              Session: <strong className="font-semibold text-text-secondary">{dashboard?.current_session?.name || 'Not available'}</strong>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Button 
            variant="secondary" 
            icon={RefreshCw} 
            loading={refreshing || loading}
            onClick={handleRefresh}
            size="sm"
          >
            {lastLoadedAt ? `Updated ${formatTime(lastLoadedAt)}` : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards Section */}
      <motion.section 
        variants={containerVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statsCards.map((card) => (
          <motion.button
            variants={itemVariants}
            key={card.key}
            type="button"
            onClick={() => navigate(card.route)}
            className="p-5 rounded-2xl flex items-start gap-4 border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus:outline-none w-full"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            {loading && !dashboard ? (
              <DashboardCardSkeleton />
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${card.tone}12` }}
                >
                  <card.icon size={18} style={{ color: card.tone }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-0.5 uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {card.title}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-xl font-bold truncate" style={{ color: card.tone }}>
                      {card.metric}
                    </p>
                    <span className="text-[10px] font-semibold text-text-muted">
                      {card.metricLabel}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 text-text-secondary leading-normal truncate" title={card.description}>
                    {card.description}
                  </p>
                </div>
              </>
            )}
          </motion.button>
        ))}
      </motion.section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-5">
          <SectionShell
            title="Today's Schedule"
            caption="Your classes lined up for the day with fast actions for attendance, marks, and students."
          >
            {loading && !scheduleRows.length ? (
              <ScheduleSkeleton />
            ) : scheduleRows.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No classes scheduled today"
                message="Your timetable is clear for today. Any free periods or updates will appear here."
              />
            ) : (
              <div className="space-y-4">
                {scheduleRows.map((item, index) => {
                  const isCurrent = item.status === 'current';
                  const isDone = item.status === 'done';
                  const pillBg = isCurrent ? 'var(--color-brand)' : (isDone ? '#00bc7d' : 'var(--color-surface-raised)');
                  const pillColor = isCurrent || isDone ? '#ffffff' : 'var(--color-text-muted)';
                  const cardBorderColor = isCurrent ? 'var(--color-brand)' : 'var(--color-border)';
                  const cardBg = 'var(--color-surface)';
                  const cardShadow = 'none';

                  return (
                    <motion.div 
                      variants={itemVariants}
                      key={item.id || `${item.class_id}-${item.period_number}-${index}`} 
                      className="flex gap-4"
                    >
                      <div className="flex w-10 flex-col items-center shrink-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${isCurrent ? 'ring-2 ring-offset-2 ring-brand' : ''}`}
                          style={{
                            backgroundColor: pillBg,
                            color: pillColor,
                            border: !isCurrent && !isDone ? '1px solid var(--color-border)' : 'none',
                          }}
                        >
                          P{item.period_number}
                        </div>
                        {index !== scheduleRows.length - 1 && (
                          <div className="my-2 h-full w-0.5 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
                        )}
                      </div>

                      <div
                        className="flex-1 rounded-2xl border p-5 transition-all duration-300 hover:shadow-sm"
                        style={{ 
                          borderColor: cardBorderColor, 
                          background: cardBg,
                          boxShadow: cardShadow,
                          borderLeft: `3px solid ${statusTone(item.status)}`
                        }}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-text-primary">
                                {item.subject_name}
                              </h3>
                              <StatusBadge status={item.status} />
                            </div>
                            
                            <p className="text-sm font-semibold text-text-secondary">
                              {item.class_name} {item.section_name} &bull; {formatTimeRange(item.start_time, item.end_time)}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-text-muted">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock size={12} className="text-brand/50" />
                                {item.room_number ? `Room ${item.room_number}` : 'Room not configured'}
                              </span>
                              <span>&bull;</span>
                              <span className={`font-semibold ${isCurrent ? 'text-brand' : ''}`}>
                                {scheduleDetail(item, now)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                            <QuickActionButton
                              label="Attendance"
                              icon={ClipboardCheck}
                              tone="#10b981"
                              onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
                                state: {
                                  class_id: String(item.class_id),
                                  section_id: String(item.section_id),
                                  subject_id: String(item.subject_id || ''),
                                  assignment_role: 'class_teacher',
                                },
                              })}
                            />
                            <QuickActionButton
                              label="Marks"
                              icon={BookMarked}
                              tone="#00897b"
                              onClick={() => navigate(ROUTES.TEACHER_MARKS_ENTER, {
                                state: {
                                  class_id: String(item.class_id),
                                  section_id: String(item.section_id),
                                  subject_id: String(item.subject_id || ''),
                                  assignment_role: 'subject_teacher',
                                },
                              })}
                            />
                            <QuickActionButton
                              label="Students"
                              icon={Users}
                              tone="#00bc7d"
                              onClick={() => navigate(ROUTES.TEACHER_STUDENTS, {
                                state: {
                                  class_id: String(item.class_id),
                                  section_id: String(item.section_id),
                                },
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionShell>

          <SectionShell
            title="Recent Activity"
            caption="The last actions you completed across attendance, marks, notices, and remarks."
          >
            {loading && !recentActivity.length ? (
              <RecentActivitySkeleton />
            ) : recentActivity.length === 0 ? (
              <EmptyState
                icon={CheckCheck}
                title="No recent activity yet"
                message="Once you start marking attendance or entering marks, your latest work will appear here."
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <button
                    key={item.id || index}
                    type="button"
                    onClick={() => navigate(activityRoute(item))}
                    className="flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-sm focus:outline-none"
                    style={{ 
                      borderColor: 'var(--color-border)', 
                      backgroundColor: 'var(--color-surface)' 
                    }}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: `${activityTone(item.table_name)}12`, color: activityTone(item.table_name) }}
                    >
                      <ActivityIcon tableName={item.table_name} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-bold text-text-primary truncate">
                        {activityMessage(item)}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={12} className="text-text-muted/60" />
                        <span>{timeAgo(item.created_at, now)}</span>
                      </div>
                    </div>
                    <ArrowRight 
                      size={16} 
                      className="text-text-muted transition-transform duration-300 group-hover:translate-x-1" 
                    />
                  </button>
                ))}
              </div>
            )}
          </SectionShell>
        </div>

        <div className="space-y-5">
          <SectionShell
            title="Quick Actions"
            caption="Shortcuts for the actions teachers repeat most during the day."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.route)}
                  className="flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-300 group hover:-translate-y-1 hover:shadow-md focus:outline-none"
                  style={{ 
                    borderColor: 'var(--color-border)', 
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: `${action.tone}12`, color: action.tone }}
                  >
                    <action.icon size={20} />
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-text-primary">
                      {action.label}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-end w-full">
                    <span 
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: action.tone }}
                    >
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </SectionShell>

          {error && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: '#ef444455', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
            >
              <div className="flex items-start gap-3">
                <CircleAlert size={18} style={{ color: '#ef4444' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Some dashboard data could not be refreshed
                  </p>
                  <p className="mt-1 text-xs opacity-90" style={{ color: 'var(--color-text-secondary)' }}>
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <div
          className="grid grid-cols-4 gap-2 rounded-2xl border p-2 shadow-2xl backdrop-blur-md"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-surface) 88%, transparent)',
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.route)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[11px] font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${action.tone}12`, color: action.tone }}
              >
                <action.icon size={16} />
              </div>
              <span className="leading-3">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const SectionShell = ({ title, caption, children }) => (
  <section
    className="rounded-2xl border p-5 sm:p-6 shadow-sm transition-all duration-300"
    style={{ 
      borderColor: 'var(--color-border)', 
      backgroundColor: 'var(--color-surface)',
    }}
  >
    <div className="mb-5 flex items-start justify-between border-b border-border-base/50 pb-3">
      <div>
        <h2 className="text-lg font-bold text-text-primary">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          {caption}
        </p>
      </div>
    </div>
    {children}
  </section>
)

const StatusBadge = ({ status }) => {
  const isCurrent = status === 'current'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border"
      style={{ 
        backgroundColor: `${statusTone(status)}12`, 
        color: statusTone(status),
        borderColor: `${statusTone(status)}25`
      }}
    >
      {isCurrent && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {status === 'done' ? 'Done' : status === 'current' ? 'Live Now' : 'Upcoming'}
    </span>
  )
}

const QuickActionButton = ({ label, icon: Icon, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all duration-150 hover:bg-surface-raised active:scale-[0.98] focus:outline-none"
    style={{ 
      borderColor: 'var(--color-border)', 
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-secondary)'
    }}
  >
    {Icon && <Icon size={13} style={{ color: tone }} />}
    <span>{label}</span>
  </button>
)

// eslint-disable-next-line no-unused-vars
const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
    <div
      className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
    >
      <Icon size={20} />
    </div>
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
    <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
  </div>
)

const DashboardCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-start justify-between">
      <div className="h-11 w-11 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      <div className="h-5 w-5 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    </div>
    <div className="mt-5 h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    <div className="mt-3 h-5 w-5/6 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
  </div>
)

const ScheduleSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, index) => (
      <div key={index} className="flex gap-3 animate-pulse">
        <div className="w-12">
          <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="flex-1 rounded-xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="h-4 w-40 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-3 h-3 w-56 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[...Array(3)].map((__, buttonIndex) => (
              <div key={buttonIndex} className="h-11 rounded-xl" style={{ backgroundColor: 'var(--color-border)' }} />
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
)

const RecentActivitySkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, index) => (
      <div
        key={index}
        className="flex items-start gap-3 rounded-xl border p-4 animate-pulse"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="mt-2 h-3 w-1/4 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
      </div>
    ))}
  </div>
)

const ActivityIcon = ({ tableName }) => {
  const iconProps = { size: 18 }
  if (tableName === 'attendance') return <ClipboardCheck {...iconProps} />
  if (tableName === 'exam_results') return <BookMarked {...iconProps} />
  if (tableName === 'student_remarks') return <Users {...iconProps} />
  if (tableName === 'teacher_notices') return <BellPlus {...iconProps} />
  return <AlarmClock {...iconProps} />
}

const formatLongDate = (date) => {
  const value = date ? new Date(date) : new Date()
  return value.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatTimeRange = (startTime, endTime) => {
  const start = to12Hour(startTime)
  const end = to12Hour(endTime)
  return `${start} - ${end}`
}

const to12Hour = (value) => {
  if (!value) return '--'
  const [hour = '0', minute = '00'] = String(value).slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatSubjectClass = (row) => `${row.subject_name} | ${row.class_name} ${row.section_name}`

const formatCountdown = (period, now) => {
  const nowDate = new Date(now)
  const start = timeToDate(period.start_time, nowDate)
  const end = timeToDate(period.end_time, nowDate)

  if (nowDate < start) {
    const diff = Math.max(0, start.getTime() - nowDate.getTime())
    const mins = Math.floor(diff / 60000)
    return `Starts in ${mins} min`
  }

  if (nowDate >= start && nowDate < end) {
    const diff = Math.max(0, end.getTime() - nowDate.getTime())
    const mins = Math.floor(diff / 60000)
    return `${mins} min remaining`
  }

  return 'Completed'
}

const timeToDate = (time, baseDate = new Date()) => {
  const [hour = '0', minute = '0'] = String(time).slice(0, 5).split(':')
  const date = new Date(baseDate)
  date.setHours(Number(hour), Number(minute), 0, 0)
  return date
}

const statusTone = (status) => {
  if (status === 'current') return '#10b981'
  if (status === 'done') return '#00897b'
  return '#94a3b8'
}

const scheduleDetail = (item, now) => {
  if (item.status === 'current') return formatCountdown(item, now)
  if (item.status === 'upcoming') return `Starts ${to12Hour(item.start_time)}`
  return `Finished ${to12Hour(item.end_time)}`
}

const timeAgo = (value, now) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const diffMs = Math.max(0, now - date.getTime())
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const activityMessage = (item) => {
  if (item.table_name === 'attendance') {
    return `Marked attendance ${item.field_name ? `for ${titleCase(String(item.field_name).replace(/_/g, ' '))}` : ''}`.trim()
  }
  if (item.table_name === 'exam_results') {
    return `Entered marks ${item.new_value ? `for ${item.new_value}` : ''}`.trim()
  }
  if (item.table_name === 'student_remarks') {
    return `Added student remark ${item.new_value ? `(${item.new_value})` : ''}`.trim()
  }
  if (item.table_name === 'teacher_notices') {
    return `Posted notice ${item.new_value ? `to ${item.new_value}` : ''}`.trim()
  }
  return 'Updated profile information'
}

const activityTone = (tableName) => {
  if (tableName === 'attendance') return '#10b981'
  if (tableName === 'exam_results') return '#00897b'
  if (tableName === 'student_remarks') return '#00bc7d'
  if (tableName === 'teacher_notices') return '#f59e0b'
  return '#94a3b8'
}

const activityRoute = (item) => {
  if (item.table_name === 'attendance') return ROUTES.TEACHER_ATTENDANCE_MARK
  if (item.table_name === 'exam_results') return ROUTES.TEACHER_MARKS_ENTER
  if (item.table_name === 'student_remarks') return ROUTES.TEACHER_STUDENT_REMARKS
  if (item.table_name === 'teacher_notices') return ROUTES.TEACHER_NOTICES
  return ROUTES.TEACHER_PROFILE
}

export default TeacherDashboard
