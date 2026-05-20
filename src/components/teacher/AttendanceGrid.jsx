import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileText, TrendingDown, Users, CalendarDays, Activity, ChevronRight, Info } from 'lucide-react'

import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'

const STATUS_STYLE = {
  present: { label: 'P', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
  absent: { label: 'A', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
  late: { label: 'L', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  half_day: { label: 'H', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' },
  holiday: { label: '-', bg: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' },
  future: { label: '', bg: 'transparent', color: 'var(--color-text-muted)' },
}

const AttendanceGrid = ({
  registerData,
  loading,
  canEdit = false,
  onOverride,
}) => {
  const [editingCell, setEditingCell] = useState(null)
  const [overrideStatus, setOverrideStatus] = useState('present')
  const [overrideReason, setOverrideReason] = useState('')
  const [savingOverride, setSavingOverride] = useState(false)

  const month = registerData?.month || new Date().getMonth() + 1
  const year = registerData?.year || new Date().getFullYear()
  const days = useMemo(() => {
    const count = new Date(year, month, 0).getDate()
    return [...Array(count)].map((_, index) => {
      const day = index + 1
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const now = new Date()
      const dayDate = new Date(date)
      const isFuture = dayDate > new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekend = dayDate.getDay() === 0
      return { day, date, weekend, isFuture }
    })
  }, [month, year])

  const rows = registerData?.students || []
  const summary = useMemo(() => buildSummary(rows), [rows])
  const dailyTotals = useMemo(() => buildDailyTotals(rows), [rows])

  const exportCsv = () => {
    const headers = ['Roll No', 'Name', ...days.map((day) => day.day), 'Present', 'Absent', 'Attendance %']
    const csvRows = rows.map((student) => {
      const recordMap = new Map((student.records || []).map((record) => [record.date, record]))
      const stats = computeStudentStats(student.records || [])
      return [
        student.roll_number || '',
        `${student.first_name} ${student.last_name}`,
        ...days.map((day) => {
          if (day.isFuture) return ''
          if (day.weekend) return '-'
          const record = recordMap.get(day.date)
          return STATUS_STYLE[record?.status || 'holiday']?.label || ''
        }),
        stats.present,
        stats.absent,
        `${stats.percentage.toFixed(0)}%`,
      ]
    })

    downloadCsv(`attendance-register-${year}-${month}.csv`, [headers, ...csvRows])
  }

  return (
    <div className="space-y-6">
      {/* ── Sub Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-text-primary tracking-tight uppercase">Monthly Grid View</h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
              {canEdit ? 'Full write access active' : 'Read-only mode active'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            icon={Download} 
            onClick={exportCsv}
            className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Grid Container ── */}
      <section
        className="rounded-2xl border bg-surface shadow-sm overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-raised/30 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="sticky left-0 z-10 min-w-[200px] px-4 py-4 text-left text-[9px] font-black uppercase tracking-widest text-text-muted shadow-[2px_0_5px_rgba(0,0,0,0.02)]" style={{ backgroundColor: 'var(--color-surface)' }}>
                    Student Information
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.date}
                      className={cn(
                        "min-w-[36px] px-1 py-4 text-center text-[10px] font-black",
                        day.weekend ? 'text-error/40' : 'text-text-muted'
                      )}
                    >
                      {day.day}
                    </th>
                  ))}
                  <th className="min-w-[100px] px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-text-muted">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rows.map((student) => {
                  const recordMap = new Map((student.records || []).map((record) => [record.date, record]))
                  const stats = computeStudentStats(student.records || [])

                  return (
                    <tr key={student.enrollment_id} className="group hover:bg-surface-raised/40 transition-colors">
                      <td className="sticky left-0 z-10 px-4 py-3 shadow-[2px_0_5px_rgba(0,0,0,0.02)]" style={{ backgroundColor: 'inherit' }}>
                        <div className="flex flex-col min-w-0">
                          <p className="text-xs font-black text-text-primary group-hover:text-primary transition-colors truncate uppercase tracking-tight">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="mt-0.5 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                            Roll: {student.roll_number || '--'}
                          </p>
                        </div>
                      </td>

                      {days.map((day) => {
                        const record = recordMap.get(day.date)
                        const type = day.isFuture ? 'future' : day.weekend && !record ? 'holiday' : (record?.status || 'holiday')
                        const style = STATUS_STYLE[type] || STATUS_STYLE.holiday

                        return (
                          <td key={day.date} className="px-0.5 py-1 text-center">
                            <button
                              type="button"
                              disabled={!record?.attendance_id || !canEdit}
                              onClick={() => {
                                if (!record?.attendance_id || !canEdit) return
                                setEditingCell({ record, student, date: day.date })
                                setOverrideStatus(record.status)
                                setOverrideReason('')
                              }}
                              className={cn(
                                "mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black transition-all",
                                record?.attendance_id && canEdit ? "hover:scale-110 active:scale-90" : "cursor-default"
                              )}
                              style={{
                                backgroundColor: style.bg,
                                color: style.color,
                                opacity: day.isFuture ? 0.3 : 1,
                              }}
                              title={!record?.attendance_id ? undefined : canEdit ? 'Click to override status' : 'Records locked'}
                            >
                              {style.label}
                            </button>
                          </td>
                        )
                      })}

                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-[11px] font-black",
                            stats.percentage < 75 ? 'text-error' : 'text-success'
                          )}>
                            {stats.percentage.toFixed(0)}%
                          </span>
                          <div className="flex gap-1.5 mt-1 text-[8px] font-black uppercase tracking-tighter opacity-40">
                            <span>P:{stats.present}</span>
                            <span>A:{stats.absent}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!!rows.length && (
                  <tr className="bg-surface-raised/20">
                    <td className="sticky left-0 z-10 px-4 py-4 shadow-[2px_0_5px_rgba(0,0,0,0.02)]" style={{ backgroundColor: 'inherit' }}>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Daily Summary</p>
                    </td>
                    {days.map((day) => {
                      const total = dailyTotals[day.date] || { present: 0, total: 0 }
                      const pct = total.total ? (total.present / total.total) * 100 : 0
                      return (
                        <td key={day.date} className="px-0.5 py-1 text-center border-l border-border/10">
                          <div 
                            className={cn(
                              "text-[9px] font-black",
                              pct < 80 && total.total ? 'text-orange-600' : 'text-text-muted'
                            )}
                          >
                            {total.total ? `${Math.round(pct)}%` : '--'}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 text-center">
                      <Download size={14} className="mx-auto text-text-muted/30" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Analytical Summary ── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard
          icon={TrendingDown}
          title="Attention Required"
          subtitle="Top 5 students by absence count"
          items={summary.mostAbsent.map((item) => ({ name: item.name, detail: `${item.absent} Days Absent` }))}
          tone="warning"
        />
        <SummaryCard
          icon={AlertTriangle}
          title="Below Threshold"
          subtitle="Students with < 75% attendance"
          items={summary.belowThreshold.map((item) => ({ name: item.name, detail: `${item.percentage.toFixed(0)}% Attendance` }))}
          tone="error"
        />
        <SummaryCard
          icon={CheckCircle2}
          title="Perfect Score"
          subtitle="Students with 100% attendance"
          items={summary.perfectAttendance.map((item) => ({ name: item.name, detail: 'Perfect Attendance' }))}
          tone="success"
        />
      </section>

      {/* ── Override Modal ── */}
      {editingCell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-surface p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 border border-border/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-6">
              <Activity size={24} />
            </div>
            
            <h3 className="text-xl font-black text-text-primary tracking-tight">Manual Override</h3>
            <p className="mt-2 text-sm font-medium text-text-muted leading-relaxed">
              You are modifying the attendance record for <span className="font-bold text-text-primary">{editingCell.student?.first_name} {editingCell.student?.last_name}</span> on <span className="font-bold text-text-primary">{editingCell.date}</span>.
            </p>

            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {['present', 'absent', 'late', 'half_day'].map((status) => {
                  const style = STATUS_STYLE[status]
                  const selected = overrideStatus === status
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setOverrideStatus(status)}
                      className={cn(
                        "h-11 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        selected ? "text-white shadow-lg" : "text-text-primary hover:bg-surface-raised"
                      )}
                      style={{
                        borderColor: selected ? style.color : 'var(--color-border)',
                        backgroundColor: selected ? style.color : 'transparent',
                        boxShadow: selected ? `0 6px 16px ${style.color}44` : 'none'
                      }}
                    >
                      {style.label} {status.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Reason for override</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Required for audit compliance..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-border focus:ring-2 focus:ring-primary/20 transition-all bg-surface-raised"
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="h-12 rounded-2xl bg-surface-raised text-[11px] font-black uppercase tracking-widest text-text-primary hover:bg-border/20 transition-colors border border-border"
              >
                Cancel
              </button>
              <button
                disabled={!overrideReason.trim() || savingOverride}
                onClick={async () => {
                  setSavingOverride(true)
                  try {
                    await onOverride(editingCell.record.attendance_id, {
                      status: overrideStatus,
                      reason: overrideReason.trim(),
                    })
                    setEditingCell(null)
                  } finally {
                    setSavingOverride(false)
                  }
                }}
                className="h-12 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {savingOverride ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SummaryCard = ({ icon: Icon, title, subtitle, items, tone }) => {
  const tones = {
    warning: { color: '#f59e0b', bg: 'bg-orange-50/50', border: 'border-orange-100', item: 'bg-orange-50 text-orange-800' },
    error: { color: '#ef4444', bg: 'bg-red-50/50', border: 'border-red-100', item: 'bg-red-50 text-red-800' },
    success: { color: '#10b981', bg: 'bg-emerald-50/50', border: 'border-emerald-100', item: 'bg-emerald-50 text-emerald-800' }
  }
  const config = tones[tone] || { color: 'var(--color-primary)', bg: 'bg-surface-raised', border: 'border-border', item: 'bg-white text-text-primary' }

  return (
    <div className={cn("rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col", config.bg, config.border)}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm" style={{ color: config.color }}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-text-primary tracking-tight leading-none">{title}</h3>
          <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {items.length ? items.map((item, idx) => (
          <div
            key={idx}
            className={cn("px-3 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between shadow-xs", config.item)}
          >
            <span className="truncate mr-2 uppercase tracking-tight">{item.name}</span>
            <span className="shrink-0 opacity-60 font-black uppercase tracking-tighter text-[9px]">{item.detail}</span>
          </div>
        )) : (
          <div className="h-full flex items-center justify-center py-6 border border-dashed border-border/40 rounded-xl">
             <p className="text-[11px] font-bold text-text-muted/40 uppercase tracking-widest italic">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

const computeStudentStats = (records = []) => {
  const present = records.filter((item) => item.status === 'present').length
  const absent = records.filter((item) => item.status === 'absent').length
  const late = records.filter((item) => item.status === 'late').length
  const halfDay = records.filter((item) => item.status === 'half_day').length
  const total = records.length
  const effectivePresent = present + late + halfDay * 0.5
  const percentage = total ? (effectivePresent / total) * 100 : 0
  return { present, absent, late, halfDay, total, percentage }
}

const buildSummary = (rows) => {
  const normalized = rows.map((row) => {
    const stats = computeStudentStats(row.records || [])
    return {
      name: `${row.first_name} ${row.last_name}`,
      absent: stats.absent,
      percentage: stats.percentage,
    }
  })

  return {
    mostAbsent: [...normalized].sort((a, b) => b.absent - a.absent).slice(0, 5),
    belowThreshold: normalized.filter((item) => item.percentage < 75).sort((a, b) => a.percentage - b.percentage),
    perfectAttendance: normalized.filter((item) => item.percentage === 100),
  }
}

const buildDailyTotals = (rows) => {
  const totals = {}
  rows.forEach((row) => {
    ;(row.records || []).forEach((record) => {
      if (!totals[record.date]) totals[record.date] = { present: 0, total: 0 }
      totals[record.date].total += 1
      if (record.status === 'present' || record.status === 'late') totals[record.date].present += 1
      if (record.status === 'half_day') totals[record.date].present += 0.5
    })
  })
  return totals
}

const GridSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-10 w-full rounded-xl bg-surface-raised" />
    {[...Array(8)].map((_, index) => (
      <div key={index} className="flex gap-2">
        <div className="h-12 w-48 rounded-xl bg-surface-raised" />
        {[...Array(15)].map((__, cellIndex) => (
          <div key={cellIndex} className="h-12 flex-1 rounded-xl bg-surface-raised" />
        ))}
      </div>
    ))}
  </div>
)

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default AttendanceGrid

