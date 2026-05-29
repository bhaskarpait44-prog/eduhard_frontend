import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileText, TrendingDown, Users, CalendarDays, Activity, ChevronRight, Info, Loader2 } from 'lucide-react'

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10 shadow-inner">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight uppercase tracking-[0.05em]">Monthly Grid View</h2>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.15em] mt-0.5 opacity-70">
              {canEdit ? 'Full write access active' : 'Read-only mode active'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            icon={FileSpreadsheet} 
            onClick={exportCsv}
            className="h-9 rounded-2xl px-5 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Grid Container ── */}
      <section
        className="rounded-[28px] border bg-surface shadow-sm overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {loading ? (
          <GridSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-raised/30 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="sticky left-0 z-10 min-w-[220px] px-6 py-5 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted shadow-[2px_0_10px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95" style={{ backgroundColor: 'inherit' }}>
                    Student Information
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.date}
                      className={cn(
                        "min-w-[38px] px-1 py-5 text-center text-[11px] font-bold",
                        day.weekend ? 'text-rose-400' : 'text-text-muted'
                      )}
                    >
                      {day.day}
                    </th>
                  ))}
                  <th className="min-w-[120px] px-6 py-5 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted bg-surface-raised/10">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rows.map((student) => {
                  const recordMap = new Map((student.records || []).map((record) => [record.date, record]))
                  const stats = computeStudentStats(student.records || [])

                  return (
                    <tr key={student.enrollment_id} className="group hover:bg-surface-raised/40 transition-colors duration-200">
                      <td className="sticky left-0 z-10 px-6 py-4 shadow-[2px_0_10px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95" style={{ backgroundColor: 'inherit' }}>
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate uppercase tracking-tight leading-tight">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em] opacity-60">
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
                                "mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] text-[10px] font-bold transition-all duration-200 shadow-sm",
                                record?.attendance_id && canEdit ? "hover:scale-110 active:scale-90 hover:shadow-md" : "cursor-default"
                              )}
                              style={{
                                backgroundColor: style.bg,
                                color: style.color,
                                opacity: day.isFuture ? 0.3 : 1,
                                border: style.bg !== 'transparent' ? `1px solid ${style.color}22` : 'none'
                              }}
                              title={!record?.attendance_id ? undefined : canEdit ? 'Click to override status' : 'Records locked'}
                            >
                              {style.label}
                            </button>
                          </td>
                        )
                      })}

                      <td className="px-6 py-4 text-center bg-surface-raised/5">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-xs font-bold",
                            stats.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'
                          )}>
                            {stats.percentage.toFixed(0)}%
                          </span>
                          <div className="flex gap-2 mt-1.5 text-[9px] font-bold uppercase tracking-widest opacity-40">
                            <span className="text-emerald-600">P:{stats.present}</span>
                            <span className="text-rose-600">A:{stats.absent}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!!rows.length && (
                  <tr className="bg-surface-raised/20">
                    <td className="sticky left-0 z-10 px-6 py-5 shadow-[2px_0_10px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95" style={{ backgroundColor: 'inherit' }}>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Daily Rate</p>
                    </td>
                    {days.map((day) => {
                      const total = dailyTotals[day.date] || { present: 0, total: 0 }
                      const pct = total.total ? (total.present / total.total) * 100 : 0
                      return (
                        <td key={day.date} className="px-0.5 py-1 text-center border-l border-border/10">
                          <div 
                            className={cn(
                              "text-[10px] font-bold",
                              pct < 80 && total.total ? 'text-amber-600' : 'text-text-muted opacity-60'
                            )}
                          >
                            {total.total ? `${Math.round(pct)}%` : '--'}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-6 py-5 text-center bg-surface-raised/10">
                      <TrendingDown size={16} className="mx-auto text-text-muted/30" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Analytical Summary ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SummaryCard
          icon={TrendingDown}
          title="Attention Required"
          subtitle="Top absence counts"
          items={summary.mostAbsent.map((item) => ({ name: item.name, detail: `${item.absent} Days Abs` }))}
          tone="warning"
        />
        <SummaryCard
          icon={AlertTriangle}
          title="Below Threshold"
          subtitle="Target < 75%"
          items={summary.belowThreshold.map((item) => ({ name: item.name, detail: `${item.percentage.toFixed(0)}% Rate` }))}
          tone="error"
        />
        <SummaryCard
          icon={CheckCircle2}
          title="Perfect Attendance"
          subtitle="Maintaining 100%"
          items={summary.perfectAttendance.map((item) => ({ name: item.name, detail: '100% Score' }))}
          tone="success"
        />
      </section>

      {/* ── Override Modal ── */}
      <Modal open={!!editingCell} onClose={() => setEditingCell(null)} size="sm">
        <div className="p-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-amber-50 text-amber-600 mb-8 border border-amber-100 shadow-inner">
            <Activity size={28} />
          </div>
          
          <h3 className="text-2xl font-bold text-text-primary tracking-tight leading-tight">Manual Override</h3>
          <p className="mt-3 text-sm font-medium text-text-muted leading-relaxed">
            You are modifying the attendance record for <span className="font-bold text-text-primary">{editingCell?.student?.first_name} {editingCell?.student?.last_name}</span>.
          </p>

          <div className="mt-10 space-y-8">
            <div className="grid grid-cols-2 gap-3">
              {['present', 'absent', 'late', 'half_day'].map((status) => {
                const style = STATUS_STYLE[status]
                const selected = overrideStatus === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setOverrideStatus(status)}
                    className={cn(
                      "h-12 rounded-[18px] border text-[11px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 active:scale-95",
                      selected ? "text-white shadow-lg" : "text-text-primary hover:bg-surface-raised border-border/60"
                    )}
                    style={{
                      borderColor: selected ? style.color : undefined,
                      backgroundColor: selected ? style.color : undefined,
                      boxShadow: selected ? `0 8px 20px ${style.color}44` : 'none'
                    }}
                  >
                    <span className="text-base">{style.label}</span>
                    <span className="opacity-80">{status.replace('_', ' ')}</span>
                  </button>
                )
              })}
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted ml-1 opacity-70">Audit Reason</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="Reason for manual update (required)..."
                className="w-full rounded-[20px] px-5 py-4 text-sm outline-none border border-border focus:ring-2 focus:ring-primary/10 transition-all bg-surface-raised font-medium shadow-inner"
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setEditingCell(null)}
              className="h-14 rounded-[22px] bg-surface-raised text-[11px] font-bold uppercase tracking-widest text-text-primary hover:bg-border/20 transition-all active:scale-95 border border-border"
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
              className="h-14 rounded-[22px] bg-primary text-[11px] font-bold uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {savingOverride ? <Loader2 size={18} className="animate-spin" /> : 'Apply Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const SummaryCard = ({ icon: Icon, title, subtitle, items, tone }) => {
  const tones = {
    warning: { color: '#f59e0b', bg: 'bg-orange-50/50', border: 'border-orange-100', item: 'bg-white text-orange-900 border-orange-100' },
    error: { color: '#ef4444', bg: 'bg-rose-50/50', border: 'border-rose-100', item: 'bg-white text-rose-900 border-rose-100' },
    success: { color: '#10b981', bg: 'bg-emerald-50/50', border: 'border-emerald-100', item: 'bg-white text-emerald-900 border-emerald-100' }
  }
  const config = tones[tone] || { color: 'var(--color-primary)', bg: 'bg-surface-raised', border: 'border-border', item: 'bg-white text-text-primary border-border' }

  return (
    <div className={cn("rounded-[28px] border p-6 shadow-sm flex flex-col transition-all hover:shadow-md", config.bg, config.border)}>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-11 w-11 rounded-[18px] bg-white flex items-center justify-center shadow-sm border border-white" style={{ color: config.color }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">{title}</h3>
          <p className="text-[10px] font-semibold text-text-muted mt-1 uppercase tracking-[0.15em] opacity-60">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {items.length ? items.map((item, idx) => (
          <div
            key={idx}
            className={cn("px-4 py-3 rounded-2xl text-[11px] font-bold flex items-center justify-between shadow-sm border transition-all hover:translate-x-1", config.item)}
          >
            <span className="truncate mr-3 uppercase tracking-[0.05em]">{item.name}</span>
            <span className="shrink-0 opacity-60 font-bold uppercase tracking-widest text-[9px] bg-surface-raised/40 px-2 py-0.5 rounded-lg border border-white/50">{item.detail}</span>
          </div>
        )) : (
          <div className="h-full flex items-center justify-center py-8 border border-dashed border-border/60 rounded-[22px]">
             <p className="text-[11px] font-bold text-text-muted/40 uppercase tracking-widest italic tracking-[0.2em]">Perfect Streak</p>
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
    belowThreshold: normalized.filter((item) => item.percentage < 75).sort((a, b) => a.percentage - b.percentage).slice(0, 5),
    perfectAttendance: normalized.filter((item) => item.percentage === 100).slice(0, 5),
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
  <div className="p-8 space-y-5 animate-pulse">
    <div className="h-12 w-full rounded-2xl bg-surface-raised" />
    {[...Array(8)].map((_, index) => (
      <div key={index} className="flex gap-3">
        <div className="h-14 w-56 rounded-2xl bg-surface-raised" />
        {[...Array(15)].map((__, cellIndex) => (
          <div key={cellIndex} className="h-14 flex-1 rounded-2xl bg-surface-raised" />
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

