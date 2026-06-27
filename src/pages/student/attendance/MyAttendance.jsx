import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CircleAlert,
  Download,
  List,
  RefreshCw,
  Search,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import AttendanceRing from '@/components/student/AttendanceRing'
import AttendanceCalendar from '@/components/student/AttendanceCalendar'
import AttendanceTrend from '@/components/student/AttendanceTrend'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStudentAttendance from '@/hooks/useStudentAttendance'
import { formatDate, formatPercent } from '@/utils/helpers'

const filterOptions = [
  { key: 'all',      label: 'All' },
  { key: 'present',  label: 'Present' },
  { key: 'absent',   label: 'Absent' },
  { key: 'late',     label: 'Late' },
  { key: 'half_day', label: 'Half Day' },
  { key: 'holiday',  label: 'Holiday' },
]

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

  const [viewMode,       setViewMode]       = useState('calendar')
  const [statusFilter,   setStatusFilter]   = useState('all')
  const [searchRange,    setSearchRange]    = useState({ from: '', to: '' })
  const [selectedRecord, setSelectedRecord] = useState(null)

  const records       = attendance?.records         || []
  const monthSummary  = attendance?.monthly_summary || {}
  const overallSummary = summary || attendance?.summary || {}

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false
      if (searchRange.from && record.date < searchRange.from) return false
      if (searchRange.to   && record.date > searchRange.to)   return false
      return true
    })
  }, [records, statusFilter, searchRange.from, searchRange.to])

  const miniStats = [
    { key: 'present', label: 'Present',  value: overallSummary.present_days || 0, tone: '#16a34a' },
    { key: 'absent',  label: 'Absent',   value: overallSummary.absent_days  || 0, tone: '#ef4444' },
    { key: 'late',    label: 'Late',     value: overallSummary.late_days    || 0, tone: '#d97706' },
    { key: 'half',    label: 'Half Day', value: overallSummary.half_days    || 0, tone: '#2563eb' },
  ]

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
      const url  = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `Attendance_Report_${selectedMonth.label.replace(' ', '_')}.pdf`)
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
    <div className="space-y-5 pb-8">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            My Attendance
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {selectedMonth.label} · Track daily records and overall trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing} icon={RefreshCw}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting} icon={Download}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* ── Low Attendance Warning ── */}
      {Number(overallSummary.percentage || 0) < 75 && (
        <div
          className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
          style={{ borderColor: '#fca5a5', backgroundColor: 'rgba(239,68,68,0.07)' }}
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <CircleAlert size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Attendance below minimum — {formatPercent(overallSummary.percentage || 0, 0)}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              You need {overallSummary.days_needed_for_minimum || 0} more consecutive day(s) to reach 75%. Speak with your class teacher.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Grid: Summary + Month/Controls ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">

        {/* Left — Ring + Mini Stats */}
        <section
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          {loading && !summary ? (
            <AttendanceSummarySkeleton />
          ) : (
            <>
              <AttendanceRing
                percentage={overallSummary.percentage || 0}
                band={overallSummary.band}
                workingDays={overallSummary.working_days || 0}
                presentDays={overallSummary.present_days || 0}
                absentDays={overallSummary.absent_days || 0}
              />
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {miniStats.map((item) => (
                  <div
                    key={item.key}
                    className="relative overflow-hidden rounded-xl border px-4 py-3.5"
                    style={{ borderColor: `${item.tone}22`, backgroundColor: `${item.tone}0d` }}
                  >
                    {/* Left accent bar */}
                    <span
                      className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: item.tone }}
                    />
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: item.tone }}>
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Right — Month Picker + View Toggle + List Filters */}
        <section
          className="rounded-2xl border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          {/* Month pills */}
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            Select Month
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableMonths.map((item) => {
              const active = item.month === selectedMonth.month && item.year === selectedMonth.year
              return (
                <button
                  key={`${item.year}-${item.month}`}
                  type="button"
                  onClick={() => changeMonth(item.month, item.year)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150"
                  style={{
                    backgroundColor: active ? 'var(--student-accent)' : 'var(--color-surface-raised)',
                    color:           active ? '#fff' : 'var(--color-text-secondary)',
                    border:          `1px solid ${active ? 'var(--student-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* View mode toggle */}
          <div className="mt-5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              View Mode
            </p>
            <div
              className="inline-flex rounded-xl border p-1 gap-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
                style={viewMode === 'calendar' ? activeTabStyle : inactiveTabStyle}
              >
                <CalendarDays size={15} />
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
                style={viewMode === 'list' ? activeTabStyle : inactiveTabStyle}
              >
                <List size={15} />
                List
              </button>
            </div>
          </div>

          {/* List view filters */}
          {viewMode === 'list' && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStatusFilter(option.key)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                    style={{
                      backgroundColor: statusFilter === option.key ? 'var(--student-accent)' : 'var(--color-surface)',
                      color:           statusFilter === option.key ? '#fff' : 'var(--color-text-secondary)',
                      border:          `1px solid ${statusFilter === option.key ? 'var(--student-accent)' : 'var(--color-border)'}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>From</label>
                  <Input
                    type="date"
                    value={searchRange.from}
                    onChange={(e) => setSearchRange((prev) => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>To</label>
                  <Input
                    type="date"
                    value={searchRange.to}
                    onChange={(e) => setSearchRange((prev) => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Body: Calendar / List / Empty ── */}
      <section className="space-y-5">
        {loading && !attendance ? (
          <AttendanceBodySkeleton />
        ) : records.length > 0 ? (
          <>
            {viewMode === 'calendar' ? (
              <AttendanceCalendar
                month={selectedMonth.month}
                year={selectedMonth.year}
                records={records}
                today={attendance?.today || new Date().toISOString().slice(0, 10)}
                onSelectDate={setSelectedRecord}
              />
            ) : (
              <ListView records={filteredRecords} />
            )}

            {/* Monthly Summary */}
            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Monthly Summary — {selectedMonth.label}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SummaryTile label="Working Days" value={monthSummary.working_days || 0} />
                <SummaryTile label="Present"      value={monthSummary.present_days  || 0} tone="#16a34a" />
                <SummaryTile label="Absent"       value={monthSummary.absent_days   || 0} tone="#ef4444" />
                <SummaryTile label="Late"         value={monthSummary.late_days     || 0} tone="#d97706" />
                <SummaryTile label="This Month"   value={formatPercent(monthSummary.percentage || 0, 0)} tone="#6d28d9" />
              </div>
            </section>

            <AttendanceTrend data={trend} />
          </>
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
      </section>

      {/* ── Detail Modal ── */}
      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Detail"
      >
        {selectedRecord && (
          <div className="space-y-3">
            <DetailRow label="Date"      value={formatDate(selectedRecord.date, 'long')} />
            <DetailRow label="Status"    value={labelFromStatus(selectedRecord.status)} />
            <DetailRow label="Marked by" value={selectedRecord.marked_by_name || selectedRecord.method || '—'} />
            <DetailRow label="Time"      value={selectedRecord.marked_at ? formatTime(selectedRecord.marked_at) : '—'} />
            <DetailRow label="Note"      value={selectedRecord.override_reason || 'No note provided.'} />
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

const ListView = ({ records }) => (
  <section
    className="overflow-hidden rounded-2xl border"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    {records.length === 0 ? (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No records match this filter.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <tr>
              {['Date', 'Day', 'Status', 'Marked By', 'Time'].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id || record.date}
                className="border-t transition-colors duration-100"
                style={{ borderColor: 'var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {formatDate(record.date, 'short')}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={statusBadgeStyle(record.status)}
                  >
                    {labelFromStatus(record.status)}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {record.marked_by_name || record.method || '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                  {record.marked_at ? formatTime(record.marked_at) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
)

const SummaryTile = ({ label, value, tone }) => (
  <div
    className="relative overflow-hidden rounded-xl border px-4 py-3.5"
    style={{
      borderColor:     tone ? `${tone}22` : 'var(--color-border)',
      backgroundColor: tone ? `${tone}0d` : 'var(--color-surface-raised)',
    }}
  >
    {tone && (
      <span
        className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
        style={{ backgroundColor: tone }}
      />
    )}
    <p
      className="text-xs font-semibold uppercase tracking-widest"
      style={{ color: tone || 'var(--color-text-muted)' }}
    >
      {label}
    </p>
    <p
      className="mt-1.5 text-2xl font-bold"
      style={{ color: tone || 'var(--color-text-primary)' }}
    >
      {value}
    </p>
  </div>
)

const DetailRow = ({ label, value }) => (
  <div
    className="rounded-xl border px-4 py-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </p>
    <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
      {value}
    </p>
  </div>
)

const AttendanceSummarySkeleton = () => (
  <div className="animate-pulse">
    <div className="mx-auto h-36 w-36 rounded-full bg-[var(--color-surface-raised)]" />
    <div className="mt-5 grid grid-cols-2 gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-[var(--color-surface-raised)]" />
      ))}
    </div>
  </div>
)

const AttendanceBodySkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-72 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="h-32 rounded-2xl bg-[var(--color-surface-raised)]" />
    <div className="h-48 rounded-2xl bg-[var(--color-surface-raised)]" />
  </div>
)

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const activeTabStyle = {
  backgroundColor: 'var(--student-accent)',
  color: '#fff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
}

const inactiveTabStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-text-secondary)',
}

function labelFromStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusBadgeStyle(status) {
  if (status === 'present')  return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'absent')   return { backgroundColor: '#fee2e2', color: '#dc2626' }
  if (status === 'late')     return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (status === 'half_day') return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
  return { backgroundColor: '#f3f4f6', color: '#6b7280' }
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default MyAttendance
