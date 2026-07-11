import { useEffect, useMemo, useState, useRef } from 'react'
import {
  CalendarDays,
  Download,
  List,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  CalendarX2,
  GraduationCap
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'

import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentAttendance from '@/hooks/useStudentAttendance'
import { formatDate, formatPercent, formatTime, cn } from '@/utils/helpers'

const STATUS_META = {
  present: { label: 'Present', token: 'present', softToken: 'present-soft' },
  absent: { label: 'Absent', token: 'absent', softToken: 'absent-soft' },
  late: { label: 'Late', token: 'late', softToken: 'late-soft' },
  halfday: { label: 'Half Day', token: 'halfday', softToken: 'halfday-soft' },
  holiday: { label: 'Holiday', token: 'holiday', softToken: 'holiday-soft' },
}

const STATUS_BADGE = {
  present: "bg-present-soft text-present border-present/20",
  absent: "bg-absent-soft text-absent border-absent/20",
  late: "bg-late-soft text-late border-late/25",
  halfday: "bg-halfday-soft text-halfday border-halfday/20",
  holiday: "bg-holiday-soft text-holiday border-holiday/20",
}

const STATUS_DOT = {
  present: "bg-present",
  absent: "bg-absent",
  late: "bg-late",
  halfday: "bg-halfday",
  holiday: "bg-holiday",
}

const STATUS_ACCENT_BORDER = {
  present: "border-l-present",
  absent: "border-l-absent",
  late: "border-l-late",
  halfday: "border-l-halfday",
  holiday: "border-l-holiday",
}

const STATUS_CALENDAR_CELL = {
  present: "bg-present-soft text-present border-present/25",
  absent: "bg-absent-soft text-absent border-absent/25",
  late: "bg-late-soft text-late border-late/30",
  halfday: "bg-halfday-soft text-halfday border-halfday/25",
  holiday: "bg-holiday-soft text-holiday border-holiday/25",
}

const normalizeStatus = (status) => {
  if (!status) return 'present';
  const s = String(status).toLowerCase();
  if (s === 'half_day' || s === 'halfday') return 'halfday';
  return s;
}

const getAttendanceLevel = (percentage) => {
  const p = Number(percentage || 0);
  if (p >= 90) {
    return {
      label: "Excellent",
      token: "present",
      message: "Great job — your attendance is well above the required minimum.",
    };
  }
  if (p >= 75) {
    return {
      label: "On track",
      token: "present",
      message: "You're meeting the 75% attendance requirement. Keep it up.",
    };
  }
  if (p >= 60) {
    return {
      label: "At risk",
      token: "late",
      message: "Your attendance is approaching the minimum. Aim to attend consistently.",
    };
  }
  return {
    label: "Critical",
    token: "absent",
    message: "Attendance is below the 75% minimum. Speak with your class teacher.",
  };
}

const MyAttendance = () => {
  usePageTitle('My Attendance')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const {
    attendance,
    summary,
    trend,
    selectedMonth,
    loading,
    refreshing,
    exporting,
    error,
    changeMonth,
    refresh,
    exportAttendance,
    availableMonths,
  } = useStudentAttendance()

  const [viewMode, setViewMode] = useState('calendar')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchRange, setSearchRange] = useState({ from: '', to: '' })
  const [selectedRecord, setSelectedRecord] = useState(null)

  const records = attendance?.records || []
  const monthSummary = attendance?.monthly_summary || {
    working_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    half_days: 0,
    percentage: 0
  }
  const overallSummary = summary || attendance?.summary || {
    percentage: 0,
    working_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    half_days: 0,
    days_needed_for_minimum: 0
  }

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const normStatus = normalizeStatus(record.status)
      if (statusFilter !== 'all' && normStatus !== statusFilter) return false
      if (searchRange.from && record.date < searchRange.from) return false
      if (searchRange.to && record.date > searchRange.to) return false
      return true
    })
  }, [records, statusFilter, searchRange.from, searchRange.to])

  const activeMonthOption = useMemo(() => {
    return availableMonths.find(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    ) || { label: '', longLabel: '' }
  }, [availableMonths, selectedMonth])

  const level = getAttendanceLevel(monthSummary.percentage)

  const handleRefresh = async () => {
    toastInfo('Refreshing attendance')
    try { await refresh() } catch {}
  }

  const handleExport = async () => {
    try {
      const response = await exportAttendance()
      if (!response) return
      const blob = response instanceof Blob
        ? response
        : response?.data instanceof Blob
          ? response.data
          : new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_Report_${activeMonthOption.label.replace(' ', '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      toastSuccess('Attendance report downloaded.')
    } catch {
      toastError('Failed to export attendance report')
    }
  }

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-soft" style={{ backgroundImage: 'var(--gradient-primary)' }}>
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              My Attendance
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Track daily records and overall trends
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
            className="gap-2 shrink-0 cursor-pointer"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            loading={exporting}
            icon={Download}
            className="gap-2 shrink-0 cursor-pointer"
            style={{ backgroundImage: 'var(--gradient-primary)' }}
          >
            Export PDF
          </Button>
        </div>
      </header>


      {/* Status banner */}
      {monthSummary && (
        <div key={`${selectedMonth.year}-${selectedMonth.month}-${refreshing}`}>
          <StatusBanner
            token={level.token}
            label={level.label}
            percentage={monthSummary.percentage || 0}
            message={level.message}
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {loading && !attendance ? (
          <AttendanceSummarySkeleton />
        ) : (
          <SummaryCard summary={monthSummary} monthLabel={activeMonthOption.longLabel} />
        )}

        <div className="rounded-3xl border border-border bg-[var(--color-surface)] p-6 shadow-card sm:p-8">
          <Controls
            availableMonths={availableMonths}
            selectedMonth={selectedMonth}
            onMonthChange={changeMonth}
            view={viewMode}
            onViewChange={setViewMode}
            filter={statusFilter}
            onFilterChange={setStatusFilter}
            from={searchRange.from}
            to={searchRange.to}
            onFromChange={(val) => setSearchRange(prev => ({ ...prev, from: val }))}
            onToChange={(val) => setSearchRange(prev => ({ ...prev, to: val }))}
          />

          <div className="mt-8 border-t border-border pt-6">
            {loading && !attendance ? (
              <AttendanceBodySkeleton />
            ) : records.length > 0 ? (
              viewMode === "list" ? (
                <RecordsList records={filteredRecords} onSelectRecord={setSelectedRecord} />
              ) : (
                <RecordsCalendar
                  month={selectedMonth.month}
                  year={selectedMonth.year}
                  records={records}
                  onSelectDate={setSelectedRecord}
                />
              )
            ) : (
              <EmptyState
                icon={Search}
                title="No attendance records for this month"
                description="Try another month or refresh to check if new records were added."
                action={
                  <Button variant="secondary" onClick={handleRefresh} icon={RefreshCw}>
                    Refresh Attendance
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>


      {/* Detail Modal */}
      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Detail"
      >
        {selectedRecord && (
          <div className="space-y-3">
            <DetailRow label="Date" value={formatDate(selectedRecord.date, 'long')} />
            <DetailRow label="Status" value={labelFromStatus(selectedRecord.status)} />
            <DetailRow label="Marked by" value={selectedRecord.marked_by_name || selectedRecord.method || '—'} />
            <DetailRow label="Time" value={selectedRecord.marked_at ? formatTime(selectedRecord.marked_at) : '—'} />
            <DetailRow label="Note" value={selectedRecord.override_reason || 'No note provided.'} />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

const ProgressRing = ({ percentage, levelToken, levelLabel }) => {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 1100
    const from = 0
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (percentage - from) * eased))
      if (t < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [percentage])

  const size = 208
  const stroke = 16
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const strokeColor = `var(--color-${levelToken})`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-raised)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {value}%
        </span>
        <span
          className="mt-1 text-xs font-bold uppercase tracking-widest"
          style={{ color: strokeColor }}
        >
          {levelLabel}
        </span>
      </div>
    </div>
  )
}

const StatTile = ({ status, label, value }) => {
  const normStatus = normalizeStatus(status)
  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 bg-[var(--color-surface)] p-4 transition-all border-border",
        "hover:shadow-soft hover:-translate-y-0.5"
      )}
      style={{ borderLeftColor: `var(--color-${normStatus})` }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

const SummaryCard = ({ summary, monthLabel }) => {
  const level = getAttendanceLevel(summary.percentage)

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-[var(--color-surface)] p-6 shadow-card sm:p-8">
      <div className="flex flex-col items-center">
        <ProgressRing
          percentage={summary.percentage || 0}
          levelToken={level.token}
          levelLabel={level.label}
        />
        <p className="mt-5 text-center font-display text-lg font-bold text-[var(--color-text-primary)]">
          {summary.working_days || 0} working day{summary.working_days === 1 ? "" : "s"}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          {monthLabel} · {summary.present_days || 0} present · {summary.absent_days || 0} absent
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <StatTile status="present" label="Present" value={summary.present_days || 0} />
        <StatTile status="absent" label="Absent" value={summary.absent_days || 0} />
        <StatTile status="late" label="Late" value={summary.late_days || 0} />
        <StatTile status="halfday" label="Half Day" value={summary.half_days || 0} />
      </div>
    </div>
  )
}

const Controls = ({
  availableMonths,
  selectedMonth,
  onMonthChange,
  view,
  onViewChange,
  filter,
  onFilterChange,
  from,
  to,
  onFromChange,
  onToChange,
}) => {
  const FILTERS = [
    { value: "all", label: "All" },
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "halfday", label: "Half Day" },
    { value: "holiday", label: "Holiday" },
  ]

  return (
    <div className="space-y-7">
      {/* Month selector */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Select month
        </p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {availableMonths.map((item) => {
            const active = item.month === selectedMonth.month && item.year === selectedMonth.year
            return (
              <button
                key={`${item.year}-${item.month}`}
                onClick={() => onMonthChange(item.month, item.year)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                  active
                    ? "bg-gradient-primary text-white shadow-soft font-bold"
                    : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]/80",
                )}
                style={active ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* View mode */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          View mode
        </p>
        <div className="inline-flex rounded-xl bg-[var(--color-surface-raised)] p-1 gap-1">
          <button
            onClick={() => onViewChange("calendar")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
              view === "calendar"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-soft"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
              view === "list"
                ? "bg-gradient-primary text-white shadow-soft"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            )}
            style={view === "list" ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>

      {/* Status filter (only for List view) */}
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer",
                    active
                      ? "border-transparent bg-[var(--color-brand)] text-white"
                      : "border-border bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-brand/40 hover:text-[var(--color-text-secondary)]",
                  )}
                  style={active ? { backgroundColor: 'var(--color-brand)' } : undefined}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => onToChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-shadow focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatusBanner = ({ token, label, percentage, message }) => {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const Icon = token === "present" ? CheckCircle2 : AlertTriangle

  const toneClasses = {
    present: "bg-present-soft border-present/30 text-present",
    late: "bg-late-soft border-late/40 text-late",
    absent: "bg-absent-soft border-absent/30 text-absent",
  }[token] || "bg-late-soft border-late/40 text-late"

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border px-5 py-4",
        toneClasses
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="pr-6">
        <p className="font-display text-sm font-bold">
          {label} — {percentage}% attendance
        </p>
        <p className="mt-0.5 text-sm opacity-90">{message}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const RecordsList = ({ records, onSelectRecord }) => {
  if (records.length === 0) return <ListEmptyState />

  return (
    <ul className="space-y-2.5">
      {records.map((rec) => {
        const normStatus = normalizeStatus(rec.status)
        const meta = STATUS_META[normStatus] || { label: rec.status, token: 'late' }
        return (
          <li
            key={rec.id || rec.date}
            onClick={() => onSelectRecord(rec)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-[var(--color-surface)] p-3.5 transition-all hover:shadow-soft cursor-pointer"
          >
            <span
              className={cn("h-9 w-1.5 shrink-0 rounded-full", STATUS_DOT[normStatus])}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-[var(--color-text-primary)]">
                {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">
                {rec.subject || 'School'} · {rec.override_reason || rec.note || 'Marked present'}
              </p>
            </div>
            {(rec.marked_at || rec.checkIn) && (
              <span className="hidden items-center gap-1.5 text-sm text-[var(--color-text-muted)] sm:flex">
                <Clock className="h-3.5 w-3.5" />
                {rec.checkIn || formatTime(rec.marked_at)}
              </span>
            )}
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-bold",
                STATUS_BADGE[normStatus],
              )}
            >
              {meta.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const ListEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <CalendarX2 className="h-10 w-10 text-[var(--color-text-muted)] opacity-60" />
      <p className="mt-3 font-display text-base font-bold text-[var(--color-text-primary)]">
        No records found
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Try a different month or clear the filters.
      </p>
    </div>
  )
}

const RecordsCalendar = ({ month, year, records, onSelectDate }) => {
  const byDay = new Map()
  for (const rec of records) {
    const dayNum = Number(rec.date.slice(8, 10))
    byDay.set(dayNum, rec)
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const legend = ["present", "absent", "late", "halfday", "holiday"]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
          {new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]"
          >
            {d.slice(0, 1)}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null)
            return <div key={`empty-${idx}`} className="aspect-square" />
          const rec = byDay.get(day)
          const normStatus = rec ? normalizeStatus(rec.status) : null
          return (
            <div
              key={day}
              onClick={() => rec && onSelectDate(rec)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all cursor-pointer",
                rec
                  ? cn("font-bold border-border", STATUS_CALENDAR_CELL[normStatus])
                  : "border-transparent bg-[var(--color-surface-raised)]/60 text-[var(--color-text-muted)]",
              )}
              title={rec ? STATUS_META[normStatus]?.label : undefined}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {legend.map((s) => (
          <span
            key={s}
            className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]"
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[s])} />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div
    className="rounded-xl border border-border px-4 py-3 bg-[var(--color-surface-raised)]"
  >
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
      {value}
    </p>
  </div>
)

const AttendanceSummarySkeleton = () => (
  <div className="animate-pulse flex flex-col items-center gap-6 rounded-3xl border border-border bg-[var(--color-surface)] p-6 shadow-card sm:p-8 w-full">
    <div className="h-52 w-52 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="h-6 w-32 rounded bg-[var(--color-surface-raised)]" />
    <div className="h-4 w-48 rounded bg-[var(--color-surface-raised)]" />
    <div className="grid w-full grid-cols-2 gap-3 mt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-[var(--color-surface-raised)]" />
      ))}
    </div>
  </div>
)

const AttendanceBodySkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 w-48 rounded bg-[var(--color-surface-raised)] mb-4" />
    <div className="grid grid-cols-7 gap-1.5 mb-6">
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-[var(--color-surface-raised)]" />
      ))}
    </div>
    <div className="h-6 w-72 rounded bg-[var(--color-surface-raised)]" />
  </div>
)

function labelFromStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default MyAttendance
