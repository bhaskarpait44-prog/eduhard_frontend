import { useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  ArrowRight,
  Award,
  BookOpenText,
  CalendarRange,
  CircleAlert,
  ClipboardList,
  CreditCard,
  RefreshCw,
  Sparkles,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import { ROUTES } from '@/constants/app'
import { cn, formatCurrency, formatDate, formatPercent } from '@/utils/helpers'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  usePageTitle('Student Dashboard')

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toastError, toastInfo } = useToast()
  const {
    dashboard,
    todaySchedule,
    isHoliday,
    holidayName,
    upcomingEvents,
    achievements,
    loading,
    refreshing,
    error,
    offline,
    lastLoadedAt,
    refresh,
  } = useStudentDashboard()

  const [now, setNow] = useState(Date.now())

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

  const student = dashboard?.student || {}
  const attendance = dashboard?.attendance || {}
  const latestResult = dashboard?.latest_result || null
  const fee = dashboard?.fee || {}
  const classesToday = dashboard?.classes_today || {}
  const currentPeriod = classesToday.current_period || null
  const nextPeriod = classesToday.next_period || null
  const schedule = todaySchedule?.length ? todaySchedule : dashboard?.today_schedule || []
  const recentAttendance = dashboard?.recent_attendance || []
  const homeworkDueToday = dashboard?.homework_due_today?.items || []
  const motivational = dashboard?.motivational || null
  const birthdayBanner = dashboard?.birthday_banner || null
  const hasContent = Boolean(dashboard)

  const statCards = [
    {
      key: 'attendance',
      title: 'My Attendance',
      icon: TrendingUp,
      route: ROUTES.STUDENT_ATTENDANCE,
      tone: getAttendanceTone(attendance.percentage),
      primary: formatPercent(attendance.percentage || 0, 0),
      secondary: `${attendance.present_days || 0} present / ${attendance.working_days || 0} working days`,
      footer: attendance.percentage < 75
        ? `Need ${attendance.days_needed_for_minimum || 0} more day(s) to reach 75%`
        : attendance.percentage >= 85
          ? 'Attendance is looking strong'
          : 'Keep steady for the minimum target',
      progress: Math.min(Number(attendance.percentage || 0), 100),
    },
    {
      key: 'result',
      title: 'Latest Result',
      icon: ClipboardList,
      route: ROUTES.STUDENT_RESULTS,
      tone: latestResult?.is_withheld ? '#94a3b8' : getResultTone(latestResult?.result_status),
      primary: latestResult?.is_withheld ? 'Withheld' : latestResult ? formatPercent(latestResult.percentage || 0, 0) : '—',
      secondary: latestResult?.is_withheld
        ? `Pending dues of ₹${latestResult.total_pending}`
        : latestResult
          ? `${latestResult.exam_name} • Grade ${latestResult.grade}`
          : 'Most recent published exam will appear here',
      footer: latestResult?.is_withheld
        ? 'Dues must be cleared to view result'
        : latestResult
          ? `${String(latestResult.result_status || '').toUpperCase()} • Tap to view full result`
          : 'Awaiting result publication',
      badge: latestResult?.is_withheld ? 'Withheld' : latestResult ? labelFromStatus(latestResult.result_status) : 'Awaiting',
    },
    {
      key: 'fee',
      title: 'Fee Status',
      icon: CreditCard,
      route: ROUTES.STUDENT_FEES,
      tone: Number(fee.total_pending || 0) > 0 ? '#dc2626' : '#16a34a',
      primary: formatCurrency(fee.total_pending || 0),
      secondary: Number(fee.total_pending || 0) > 0 ? 'Outstanding balance' : 'All clear',
      footer: fee.next_due_date
        ? `Next due ${formatDate(fee.next_due_date, 'short')}`
        : 'No upcoming due date',
    },
    {
      key: 'classes',
      title: "Today's Classes",
      icon: CalendarRange,
      route: ROUTES.STUDENT_TIMETABLE,
      tone: isHoliday || dashboard?.is_holiday ? '#10b981' : currentPeriod ? '#16a34a' : 'var(--color-brand)',
      primary: isHoliday || dashboard?.is_holiday ? 'Holiday' : `${classesToday.total_periods || schedule.length || 0}`,
      secondary: isHoliday || dashboard?.is_holiday
        ? (holidayName || dashboard?.holiday_name || 'School Closed')
        : (currentPeriod
            ? `${currentPeriod.subject_name} is live now`
            : nextPeriod
              ? `${nextPeriod.subject_name} is next`
              : 'No more classes today'),
      footer: isHoliday || dashboard?.is_holiday ? 'No classes scheduled' : (currentPeriod
        ? `Ends in ${formatMinutes(currentPeriod.countdown_minutes)}`
        : nextPeriod
          ? `Starts in ${formatMinutes(nextPeriod.countdown_minutes)}`
          : 'Schedule complete'),
    },
  ]

  const handleRefresh = async () => {
    toastInfo('Refreshing dashboard')
    try {
      await refresh()
    } catch {}
  }

  return (
    <div className="space-y-4 pb-2">
      {/* Offline banner */}
      {offline && (
        <Banner
          icon={WifiOff}
          title="You are offline"
          description="Showing the last saved student dashboard until the connection returns."
          tone="#b45309"
          soft="rgba(245,158,11,0.08)"
          border="rgba(245,158,11,0.25)"
        />
      )}

      {/* Birthday banner */}
      {birthdayBanner && (
        <Banner
          icon={Sparkles}
          title={birthdayBanner.title}
          description="Wishing you a joyful day and a year full of wins, growth, and good surprises."
          tone="var(--student-accent)"
          soft="var(--student-accent-soft)"
          border="var(--color-border)"
        />
      )}

      {/* ── Header ── */}
      <header
        className="rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
              style={{ backgroundColor: 'var(--student-accent)' }}
            >
              {getInitials(student.name || user?.name || 'S')}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl text-[var(--color-text-primary)]">
                {greeting}, {student.name || user?.name || 'Student'}
              </h1>
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                {student.class_name
                  ? `${student.class_name}${student.section_name ? ` · ${student.section_name}` : ''}`
                  : 'Your class details will appear here'}
                {student.roll_number ? ` · Roll No. ${student.roll_number}` : ''}
                {student.session_name ? ` · ${student.session_name}` : ''}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatLongDate(dashboard?.today)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <RefreshCw size={14} className={refreshing || loading ? 'animate-spin' : ''} />
            {lastLoadedAt ? `Updated ${formatTime(lastLoadedAt)}` : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Homework due today */}
      {homeworkDueToday.length > 0 && (
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: 'rgba(220,38,38,0.25)', backgroundColor: 'rgba(220,38,38,0.04)' }}
        >
          <div className="flex items-center gap-2">
            <CircleAlert size={16} className="shrink-0 text-red-600" />
            <p className="text-sm font-semibold text-red-700">
              {homeworkDueToday.length} homework assignment{homeworkDueToday.length > 1 ? 's' : ''} due today
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {homeworkDueToday.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.title}</p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {item.subject_name} · {item.teacher_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.STUDENT_HOMEWORK)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--student-accent)' }}
                >
                  {item.submission_type === 'online' || item.submission_type === 'both' ? 'Submit' : 'View'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.route)}
            className="group rounded-2xl border p-5 text-left transition-colors hover:border-[var(--color-text-muted)]"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {loading && !hasContent ? (
              <DashboardCardSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${card.tone}14`, color: card.tone }}
                    >
                      <card.icon size={17} />
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">{card.title}</p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <p className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                    {card.primary}
                  </p>
                  {card.badge && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: `${card.tone}14`, color: card.tone }}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{card.secondary}</p>

                {typeof card.progress === 'number' && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: `${card.tone}1a` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${card.progress}%`, backgroundColor: card.tone }}
                    />
                  </div>
                )}

                <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)]">{card.footer}</p>
              </>
            )}
          </button>
        ))}
      </section>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Today Schedule */}
          <SectionCard
            title="Today's Schedule"
            actionLabel="Timetable"
            onAction={() => navigate(ROUTES.STUDENT_TIMETABLE)}
          >
            {loading && !hasContent ? (
              <TimelineSkeleton />
            ) : schedule.length > 0 ? (
              <div>
                {schedule.map((item, idx) => (
                  <div
                    key={item.id || `${item.period_number}-${item.start_time}`}
                    className="relative flex gap-3"
                  >
                    {/* Timeline rail */}
                    <div className="flex w-5 shrink-0 flex-col items-center pt-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            item.status === 'current'
                              ? '#16a34a'
                              : item.status === 'done'
                                ? 'var(--color-border)'
                                : 'var(--student-accent)',
                          boxShadow: item.status === 'current' ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
                        }}
                      />
                      {idx < schedule.length - 1 && (
                        <div className="mt-1.5 w-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
                      )}
                    </div>

                    {/* Period row */}
                    <div
                      className="mb-2 flex-1 rounded-xl border px-4 py-3"
                      style={{
                        borderColor: item.status === 'current' ? 'rgba(22,163,74,0.30)' : 'var(--color-border)',
                        backgroundColor: item.status === 'current' ? 'rgba(22,163,74,0.05)' : 'var(--color-surface)',
                        opacity: item.status === 'done' ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {item.subject_name}
                            </p>
                            <span className={statusPillClass(item.status)} style={statusPillStyle(item.status)}>
                              {item.status === 'current' ? 'Live' : item.status === 'done' ? 'Done' : 'Upcoming'}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            {item.teacher_name}
                            {item.is_online && (
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--student-accent)' }} title="Online now" />
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                            Period {item.period_number || '—'} · {formatTimeRange(item.start_time, item.end_time)}
                            {item.room_number ? ` · Room ${item.room_number}` : ''}
                          </p>
                        </div>
                        {(item.status === 'current' || item.status === 'upcoming') && typeof item.countdown_minutes === 'number' && (
                          <div className="shrink-0 text-right">
                            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
                              {item.status === 'current' ? 'Ends in' : 'Starts in'}
                            </p>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: item.status === 'current' ? '#15803d' : 'var(--color-text-primary)' }}
                            >
                              {formatMinutes(item.countdown_minutes)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isHoliday || dashboard?.is_holiday ? (
              <EmptyMiniState
                icon={CalendarRange}
                title="School Holiday Today"
                description={`Holiday: ${holidayName || dashboard?.holiday_name || 'Declared Holiday'}`}
              />
            ) : (
              <EmptyMiniState
                icon={CalendarRange}
                title="No classes lined up today"
                description="Your day looks clear right now."
              />
            )}
          </SectionCard>

          {/* Attendance + Events row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recent Attendance */}
            <SectionCard title="Recent Attendance">
              {loading && !hasContent ? (
                <BubbleStripSkeleton />
              ) : recentAttendance.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1.5">
                    {recentAttendance.map((day, index) => (
                      <div key={`${day.date}-${index}`} className="flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          title={`${formatDate(day.date, 'long')} · ${labelFromStatus(day.status)}`}
                          className="flex aspect-square w-full max-w-[42px] items-center justify-center rounded-full border text-xs font-semibold"
                          style={attendanceBubbleStyle(day, dashboard?.today)}
                        >
                          {bubbleLabel(day.status)}
                        </button>
                        <span className="text-[10px] font-medium text-[var(--color-text-muted)]">
                          {formatDayShort(day.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                    <Legend tone="#16a34a" label="Present" />
                    <Legend tone="#dc2626" label="Absent" />
                    <Legend tone="#d97706" label="Late" />
                    <Legend tone="#2563eb" label="Half Day" />
                    <Legend tone="#94a3b8" label="Holiday" />
                  </div>
                </div>
              ) : (
                <EmptyMiniState
                  icon={TrendingUp}
                  title="Attendance will appear here soon"
                  description="Once your records are marked, this strip will show the last seven days."
                />
              )}
            </SectionCard>

            {/* Upcoming Events */}
            <SectionCard
              title="Upcoming Events"
              actionLabel="Notices"
              onAction={() => navigate(ROUTES.STUDENT_NOTICES)}
            >
              {loading && !hasContent ? (
                <EventSkeleton />
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={`${event.event_type}-${event.id}`}
                      className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    >
                      <div
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: eventTone(event.event_type).strong }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {event.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                          <span className="font-medium capitalize" style={{ color: eventTone(event.event_type).strong }}>
                            {event.event_type}
                          </span>
                          {' · '}
                          {formatDate(event.event_date, 'short')} · in {event.days_remaining} day(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMiniState
                  icon={AlarmClock}
                  title="Nothing upcoming right now"
                  description="New exams, holidays, dues, and notices will show up here."
                />
              )}
            </SectionCard>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Motivation */}
          <SectionCard title="Motivation">
            {loading && !hasContent ? (
              <MotivationSkeleton />
            ) : motivational ? (
              <Banner
                icon={motivational.type === 'streak' ? Award : CircleAlert}
                title={motivational.type === 'streak' ? 'Attendance streak' : 'Gentle reminder'}
                description={motivational.message}
                tone={motivational.type === 'streak' ? '#15803d' : '#b45309'}
                soft={motivational.type === 'streak' ? 'rgba(22,163,74,0.06)' : 'rgba(217,119,6,0.06)'}
                border={motivational.type === 'streak' ? 'rgba(22,163,74,0.20)' : 'rgba(217,119,6,0.20)'}
              />
            ) : (
              <EmptyMiniState
                icon={Sparkles}
                title="You are on track"
                description="Keep moving steadily and your milestones will show up here."
              />
            )}
          </SectionCard>

          {/* Achievement Badges */}
          <SectionCard
            title="Achievement Badges"
            actionLabel="Profile"
            onAction={() => navigate(ROUTES.STUDENT_PROFILE)}
          >
            {loading && !hasContent ? (
              <BadgeSkeleton />
            ) : achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.slice(0, 4).map((badge, idx) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: idx === 0 ? 'rgba(217,119,6,0.10)' : 'var(--color-surface-raised)',
                        color: idx === 0 ? '#b45309' : 'var(--color-text-muted)',
                      }}
                    >
                      <Award size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {prettifyBadge(badge.achievement_type)}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        {badge.earned_for || 'Student milestone'} · {formatDate(badge.earned_at, 'short')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMiniState
                icon={Award}
                title="Your badges will collect here"
                description="Perfect attendance, improvement, and top performer rewards will appear as you earn them."
              />
            )}
          </SectionCard>

          {/* Quick Links */}
          <SectionCard title="Quick Links">
            <div className="space-y-1.5">
              {[
                { label: 'Open Report Card', icon: ClipboardList, route: ROUTES.STUDENT_RESULTS, disabled: latestResult?.is_withheld },
                { label: 'Check Homework', icon: BookOpenText, route: ROUTES.STUDENT_HOMEWORK },
                { label: 'Review Fee Details', icon: CreditCard, route: ROUTES.STUDENT_FEES },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => !item.disabled && navigate(item.route)}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors hover:border-[var(--color-text-muted)]',
                    item.disabled && 'cursor-not-allowed opacity-50'
                  )}
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={16} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                  </div>
                  {item.disabled
                    ? <span className="text-[10px] font-semibold text-red-600">WITHHELD</span>
                    : <ArrowRight size={14} className="text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                  }
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <section
    className="rounded-2xl border p-5"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
          style={{ color: 'var(--student-accent)' }}
        >
          {actionLabel} <ArrowRight size={12} />
        </button>
      )}
    </div>
    {children}
  </section>
)

const Banner = ({ icon: Icon, title, description, tone, soft, border }) => (
  <div className="rounded-xl border px-4 py-3.5" style={{ borderColor: border, backgroundColor: soft }}>
    <div className="flex items-start gap-3">
      <Icon size={17} className="mt-0.5 shrink-0" style={{ color: tone }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: tone }}>{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  </div>
)

const EmptyMiniState = ({ icon: Icon, title, description }) => (
  <div className="rounded-xl border border-dashed px-4 py-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
    <Icon size={20} className="mx-auto text-[var(--color-text-muted)]" />
    <p className="mt-2.5 text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{description}</p>
  </div>
)

const Legend = ({ tone, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
    <span>{label}</span>
  </span>
)

const DashboardCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-raised)]" />
      <div className="h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
    </div>
    <div className="mt-4 h-8 w-24 rounded-lg bg-[var(--color-surface-raised)]" />
    <div className="mt-2 h-3 w-3/4 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--color-surface-raised)]" />
  </div>
)

const TimelineSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex gap-3">
        <div className="flex w-5 flex-col items-center pt-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-surface-raised)]" />
          {index < 2 && <div className="mt-1.5 h-10 w-px bg-[var(--color-surface-raised)]" />}
        </div>
        <div className="flex-1 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="h-4 w-36 rounded-full bg-[var(--color-surface-raised)]" />
          <div className="mt-2 h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
        </div>
      </div>
    ))}
  </div>
)

const BubbleStripSkeleton = () => (
  <div className="grid animate-pulse grid-cols-7 gap-1.5">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={index} className="flex flex-col items-center gap-1.5">
        <div className="h-10 w-10 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="h-2.5 w-5 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const EventSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-4 w-36 rounded-full bg-[var(--color-surface-raised)]" />
        <div className="mt-2 h-3 w-24 rounded-full bg-[var(--color-surface-raised)]" />
      </div>
    ))}
  </div>
)

const MotivationSkeleton = () => (
  <div className="animate-pulse rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="h-4 w-32 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-3 h-3 w-full rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-2 h-3 w-3/4 rounded-full bg-[var(--color-surface-raised)]" />
  </div>
)

const BadgeSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border)' }}>
        <div className="h-9 w-9 rounded-lg bg-[var(--color-surface-raised)]" />
        <div className="flex-1">
          <div className="h-4 w-28 rounded-full bg-[var(--color-surface-raised)]" />
          <div className="mt-2 h-3 w-40 rounded-full bg-[var(--color-surface-raised)]" />
        </div>
      </div>
    ))}
  </div>
)

/* ─── Utility helpers ─────────────────────────────────────────────────────── */

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

function getAttendanceTone(percentage) {
  const value = Number(percentage || 0)
  if (value >= 85) return '#16a34a'
  if (value >= 75) return '#d97706'
  if (value >= 65) return '#ea580c'
  return '#dc2626'
}

function getResultTone(status) {
  if (status === 'pass') return '#16a34a'
  if (status === 'compartment') return '#d97706'
  if (status === 'fail') return '#dc2626'
  return '#64748b'
}

function formatMinutes(value) {
  const minutes = Number(value || 0)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function formatLongDate(value) {
  if (!value) return 'Today'
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return 'now'
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatTimeRange(startTime, endTime) {
  const date = new Date().toISOString().slice(0, 10)
  return `${formatTime(`${date}T${startTime}`)} - ${formatTime(`${date}T${endTime}`)}`
}

function formatDayShort(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { weekday: 'short' })
}

function labelFromStatus(status) {
  return String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function bubbleLabel(status) {
  if (status === 'present') return 'P'
  if (status === 'absent') return 'A'
  if (status === 'late') return 'L'
  if (status === 'half_day') return 'H'
  return '•'
}

function attendanceBubbleStyle(day, today) {
  const date = String(day?.date || '')
  const isToday = today && String(today) === date
  const styles = {
    present: { backgroundColor: 'rgba(22,163,74,0.10)', color: '#15803d', borderColor: 'rgba(22,163,74,0.30)' },
    absent: { backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.30)' },
    late: { backgroundColor: 'rgba(217,119,6,0.10)', color: '#b45309', borderColor: 'rgba(217,119,6,0.30)' },
    half_day: { backgroundColor: 'rgba(37,99,235,0.08)', color: '#1d4ed8', borderColor: 'rgba(37,99,235,0.30)' },
    holiday: { backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' },
  }
  const base = styles[day?.status] || styles.holiday
  return {
    ...base,
    borderWidth: isToday ? '2px' : '1px',
  }
}

function statusPillClass(status) {
  return cn('rounded-full px-2 py-0.5 text-[10px] font-semibold')
}

function statusPillStyle(status) {
  if (status === 'current') return { backgroundColor: 'rgba(22,163,74,0.12)', color: '#15803d' }
  if (status === 'done') return { backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }
  return { backgroundColor: 'var(--student-accent-soft)', color: 'var(--student-accent)' }
}

function eventTone(type) {
  if (type === 'exam') return { strong: '#2563eb' }
  if (type === 'fee') return { strong: '#dc2626' }
  if (type === 'holiday') return { strong: '#15803d' }
  return { strong: 'var(--student-accent)' }
}

function prettifyBadge(value) {
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default StudentDashboard
