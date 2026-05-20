import { useEffect, useMemo, useState } from 'react'
import { BellRing, Download, PhoneCall, TriangleAlert, TrendingUp, Users, AlertCircle, Activity, ChevronRight, RefreshCw, CalendarDays, FilterX, Search, CheckCircle2, Layout } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'

// ─────────────────────────────────────────────────────────────────────────────
//  STRUCTURAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div 
    className="bg-surface border rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm transition-all hover:shadow-md"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-raised" style={{ color }}>
        <Icon size={16} />
      </div>
      <span className="text-[10px] font-black tracking-widest uppercase text-text-muted">{label}</span>
    </div>
    <div>
      <span className="text-2xl font-black text-text-primary leading-none tracking-tight">{value}</span>
      {sub && <p className="text-[10px] font-bold text-text-muted uppercase mt-1.5 tracking-tighter">{sub}</p>}
    </div>
  </div>
)

const ReportCard = ({ title, subtitle, onExport, accent = 'var(--color-primary)', children }) => (
  <div 
    className="bg-surface border rounded-2xl overflow-hidden flex flex-col shadow-sm"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="p-4 sm:px-6 sm:py-5 border-b bg-surface-raised/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full shrink-0" style={{ background: accent }} />
          <h2 className="text-sm sm:text-base font-black text-text-primary tracking-tight truncate">{title}</h2>
        </div>
        <p className="text-xs font-medium text-text-muted mt-1 ml-4 truncate">{subtitle}</p>
      </div>
      <Button 
        variant="outline"
        size="sm"
        icon={Download}
        onClick={onExport}
        className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest"
      >
        Export CSV
      </Button>
    </div>
    <div className="p-4 sm:p-6 flex-1">{children}</div>
  </div>
)

const PanelSkeleton = () => (
  <div className="flex flex-col gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 rounded-xl bg-surface-raised animate-pulse" />
    ))}
  </div>
)

const EmptyPanel = ({ text, icon: Icon = TriangleAlert }) => (
  <div className="border border-dashed rounded-2xl p-12 text-center flex flex-col items-center gap-4 bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
    <div className="h-12 w-12 rounded-full bg-surface-raised flex items-center justify-center text-text-muted/40">
      <Icon size={24} />
    </div>
    <p className="text-sm font-bold text-text-secondary italic">{text}</p>
  </div>
)


// ─────────────────────────────────────────────────────────────────────────────
//  REPORT PANELS — logic identical to original
// ─────────────────────────────────────────────────────────────────────────────

const SummaryTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text="No attendance records found for this range." />
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { label: 'Roll', width: '60px', align: 'center' },
              { label: 'Student Information', width: 'auto', align: 'left' },
              { label: 'Days', width: '60px', align: 'center' },
              { label: 'Pres', width: '60px', align: 'center' },
              { label: 'Abs', width: '60px', align: 'center' },
              { label: '%', width: '80px', align: 'center' },
              { label: 'Status', width: '90px', align: 'center' }
            ].map((col) => (
              <th 
                key={col.label} 
                className={cn(
                  "px-3 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted",
                  col.align === 'center' ? 'text-center' : 'text-left'
                )}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => {
            const pct = Number(row.percentage || 0)
            const sColor = pct >= threshold ? 'text-success' : pct >= threshold - 10 ? 'text-warning' : 'text-error'
            const sBg    = pct >= threshold ? 'bg-green-100 text-green-700' : pct >= threshold - 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            const sLabel = pct >= threshold ? 'Good' : pct >= threshold - 10 ? 'Warning' : 'Critical'
            return (
              <tr key={row.enrollment_id} className="hover:bg-surface-raised/40 transition-colors group">
                <td className="px-3 py-3 text-center text-xs font-mono font-bold text-text-muted">{row.roll_number || '--'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {row.first_name} {row.last_name}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">ID: {row.student_id}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-xs font-bold text-text-secondary">{row.total_days || 0}</td>
                <td className="px-3 py-3 text-center text-xs font-black text-green-600">{row.present || 0}</td>
                <td className="px-3 py-3 text-center text-xs font-black text-red-500">{row.absent || 0}</td>
                <td className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn("text-xs font-black", sColor)}>{pct.toFixed(0)}%</span>
                    <div className="h-1 w-12 rounded-full bg-surface-raised overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: 'currentColor' }} className={sColor} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", sBg)}>{sLabel}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const DailySummaryPanel = ({ rows }) => {
  if (!rows.length) return <EmptyPanel text="No daily summary available for the selected range." icon={Activity} />
  const max = Math.max(...rows.map((row) => row.percentage), 1)
  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const color = row.percentage >= 90 ? 'bg-green-500' : row.percentage >= 75 ? 'bg-primary' : row.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
        const textColor = row.percentage >= 90 ? 'text-green-600' : row.percentage >= 75 ? 'text-primary' : row.percentage >= 60 ? 'text-orange-600' : 'text-red-600'
        return (
          <div key={row.date} className="group">
            <div className="flex justify-between items-end mb-1.5 px-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-raised px-2 py-0.5 rounded-md">{row.date}</span>
              <span className={cn("text-xs font-black", textColor)}>
                {row.present}/{row.total}
                <span className="text-text-muted/30 font-normal mx-2">|</span>
                {row.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)} 
                style={{ width: `${(row.percentage / max) * 100}%` }} 
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}


const BelowThresholdTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text={`All students meet the ${threshold}% target.`} icon={CheckCircle2} />
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const percentage = Number(row.percentage || 0)
        const totalDays = Number(row.total_days || 0)
        const effectivePresentDays = percentage * totalDays / 100
        const daysShort = percentage >= threshold ? 0 : Math.ceil((threshold * totalDays / 100) - effectivePresentDays)
        return (
          <div key={row.enrollment_id} className="bg-surface-raised/30 border rounded-2xl p-4 relative overflow-hidden group hover:border-red-200 transition-all shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none opacity-[0.03] bg-red-600" style={{ width: `${percentage}%` }} />
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <p className="text-sm font-black text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">Roll {row.roll_number || '--'} · {totalDays} Working Days</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-red-600 font-black uppercase tracking-widest">
                  <TriangleAlert size={14} />
                  <span>{Math.max(0, daysShort)} days short of {threshold}%</span>
                </div>
              </div>
              <div className="text-3xl font-black text-red-600 leading-none tracking-tighter">
                {percentage.toFixed(0)}<span className="text-sm ml-0.5 font-bold">%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ChronicAbsentees = ({ rows, onAlert }) => {
  if (!rows.length) return <EmptyPanel text="Excellent! No chronic absentees detected." icon={Users} />
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.enrollment_id} className="bg-surface-raised/30 border rounded-2xl p-4 transition-all hover:border-orange-200 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <p className="text-sm font-black text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-widest shadow-sm">
                  {row.consecutive_absent_days} Days Consecutive
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-text-secondary">
                  <div className="h-6 w-6 rounded-lg bg-surface-raised flex items-center justify-center text-emerald-600 shrink-0">
                    <PhoneCall size={12} />
                  </div>
                  <span className="truncate">{row.father_phone || row.mother_phone || 'No Phone Number'}</span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-2.5 text-[10px] font-medium text-text-muted mt-1">
                  <div className="h-6 w-6 rounded-lg bg-surface-raised flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                    <BellRing size={12} />
                  </div>
                  <p className="line-clamp-2 leading-relaxed">{Array.isArray(row.dates) ? row.dates.join(', ') : 'No date records'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
               <button 
                onClick={() => (row.father_phone || row.mother_phone) && window.open(`tel:${row.father_phone || row.mother_phone}`, '_self')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <PhoneCall size={14} /> Call
              </button>
              <button 
                onClick={onAlert}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <BellRing size={14} /> Alert
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS — identical to original
// ─────────────────────────────────────────────────────────────────────────────

const firstOfMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
const today = () => new Date().toISOString().slice(0, 10)

const dedupeAssignments = (assignments) => {
  const grouped = {}
  assignments.forEach((a) => {
    const key = `${a.class_id}:${a.section_id}`
    if (!grouped[key]) {
      grouped[key] = {
        class_name: a.class_name,
        section_name: a.section_name,
        subjects: [],
        is_class_teacher: false,
      }
    }
    if (a.is_class_teacher) grouped[key].is_class_teacher = true
    if (a.subject_name && !grouped[key].subjects.includes(a.subject_name)) {
      grouped[key].subjects.push(a.subject_name)
    }
  })

  return Object.entries(grouped).map(([key, info]) => {
    let label = `${info.class_name} ${info.section_name}`
    const details = []
    if (info.is_class_teacher) details.push('Class Teacher')
    if (info.subjects.length > 0) details.push(...info.subjects)

    if (details.length > 0) {
      label += ` | ${details.join(', ')}`
    }

    return { value: key, label }
  })
}

const buildDailySummary = (students) => {
  const map = new Map()
  students.forEach((student) => {
    ;(student.records || []).forEach((record) => {
      if (!map.has(record.date)) map.set(record.date, { date: record.date, present: 0, total: 0 })
      const current = map.get(record.date)
      current.total += 1
      if (record.status === 'present' || record.status === 'late') current.present += 1
      if (record.status === 'half_day') current.present += 0.5
    })
  })
  return [...map.values()]
    .map((row) => ({ ...row, percentage: row.total ? (row.present / row.total) * 100 : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

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

const exportSummaryCsv = (rows) => {
  downloadCsv('attendance-summary.csv', [
    ['Roll', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'Half Day', 'Percentage'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      row.total_days || 0,
      row.present || 0,
      row.absent || 0,
      row.late || 0,
      row.half_day || 0,
      Number(row.percentage || 0).toFixed(2),
    ]),
  ])
}

const exportBelowThresholdCsv = (rows, threshold) => {
  downloadCsv(`attendance-below-${threshold}.csv`, [
    ['Roll', 'Name', 'Percentage', 'Total Days'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      Number(row.percentage || 0).toFixed(2),
      row.total_days || 0,
    ]),
  ])
}

const exportChronicCsv = (rows) => {
  downloadCsv('attendance-chronic-absentees.csv', [
    ['Roll', 'Name', 'Consecutive Days', 'Dates', 'Father Phone', 'Mother Phone'],
    ...rows.map((row) => [
      row.roll_number || '',
      `${row.first_name} ${row.last_name}`,
      row.consecutive_absent_days || 0,
      Array.isArray(row.dates) ? row.dates.join(' | ') : '',
      row.father_phone || '',
      row.mother_phone || '',
    ]),
  ])
}

const exportDailyCsv = (rows) => {
  downloadCsv('attendance-daily-summary.csv', [
    ['Date', 'Present Equivalent', 'Total', 'Percentage'],
    ...rows.map((row) => [row.date, row.present, row.total, row.percentage.toFixed(2)]),
  ])
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE — logic identical to original
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceReports = () => {
  usePageTitle('Attendance Reports')

  const { toastError, toastInfo } = useToast()
  const { assignmentOptions, loadingAssignments, reportData, loadingReports, loadReports, loadRegister, registerData } = useAttendance()

  const [assignmentKey, setAssignmentKey] = useState('')
  const [fromDate,      setFromDate]      = useState(firstOfMonth())
  const [toDate,        setToDate]        = useState(today())
  const [threshold,     setThreshold]     = useState('75')

  const reportAssignments = useMemo(
    () => dedupeAssignments(assignmentOptions),
    [assignmentOptions]
  )

  useEffect(() => {
    if (loadingAssignments || !reportAssignments.length) return

    const exists = reportAssignments.some((o) => o.value === assignmentKey)
    if (!assignmentKey || !exists) {
      setAssignmentKey(reportAssignments[0].value)
    }
  }, [loadingAssignments, reportAssignments, assignmentKey])

  const selectedSection = useMemo(() => {
    if (!assignmentKey) return null
    const [classId, sectionId] = assignmentKey.split(':')
    return assignmentOptions.find((assignment) =>
      String(assignment.class_id) === String(classId) &&
      String(assignment.section_id) === String(sectionId)
    ) || null
  }, [assignmentKey, assignmentOptions])

  useEffect(() => {
    if (!selectedSection || !fromDate || !toDate) return

    loadReports({
      summaryParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
      },
      thresholdParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
        threshold,
      },
      chronicParams: {
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from: fromDate,
        to: toDate,
      },
    }).catch((error) => {
      toastError(error?.message || 'Failed to load attendance reports.')
    })

    loadRegister({
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      month: String(new Date(fromDate).getMonth() + 1),
      year: String(new Date(fromDate).getFullYear()),
    }).catch(() => {})
  }, [selectedSection, fromDate, toDate, threshold, loadReports, loadRegister, toastError])

  const dailySummary = useMemo(() => buildDailySummary(registerData?.students || []), [registerData])

  // derived counts for stat strip
  const avgAtt = reportData.summary.length
    ? (reportData.summary.reduce((a, r) => a + Number(r.percentage), 0) / reportData.summary.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0f766e' }}>
              Attendance Management
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Attendance Reports
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Summary, daily trends, below-threshold tracking, and chronic absentee alerts for your assigned sections.
            </p>
          </div>
        </div>

        {/* filters — same fields, same logic as original */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Assigned Section</label>
            <Select
              value={assignmentKey}
              onChange={(e) => setAssignmentKey(e.target.value)}
              options={reportAssignments}
              placeholder={loadingAssignments ? 'Loading…' : 'Select section'}
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
          <div className="space-y-1.5 xl:col-span-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>From Date</label>
            <input 
              type="date" 
              className="w-full bg-surface-raised border border-border/50 rounded-xl px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary h-9 font-semibold" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>
          <div className="space-y-1.5 xl:col-span-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>To Date</label>
            <input 
              type="date" 
              className="w-full bg-surface-raised border border-border/50 rounded-xl px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary h-9 font-semibold" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Threshold</label>
            <Select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              options={[
                { value: '75', label: '75%' },
                { value: '80', label: '80%' },
                { value: '85', label: '85%' },
              ]}
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* ── STAT STRIP ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Students"    value={reportData.summary.length}          sub="In Selected Section"          color="#7b6ef6" icon={Users}      />
        <StatCard label="Avg Attendance"    value={`${avgAtt}%`}                       sub="Across Date Range"            color="#10b981" icon={TrendingUp}  />
        <StatCard label="Below Target"      value={reportData.belowThreshold.length}   sub={`Under ${threshold}% Target`} color="#ef4444" icon={AlertCircle} />
        <StatCard label="Chronic Absence"   value={reportData.chronicAbsentees.length} sub="3+ Consecutive Days"          color="#f59e0b" icon={Activity}    />
      </div>

      {/* ── REPORT GRID — same 4 cards as original ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 pb-10">

        <ReportCard
          title="Student Attendance Summary"
          subtitle="Per-student attendance percentage, counts, and status."
          accent="#7b6ef6"
          onExport={() => exportSummaryCsv(reportData.summary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <SummaryTable rows={reportData.summary} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Daily Class Summary"
          subtitle="Day-wise class attendance percentage to spot weak trends."
          accent="#10b981"
          onExport={() => exportDailyCsv(dailySummary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <DailySummaryPanel rows={dailySummary} />}
        </ReportCard>

        <ReportCard
          title="Below Threshold Report"
          subtitle="Students under the target attendance percentage."
          accent="#ef4444"
          onExport={() => exportBelowThresholdCsv(reportData.belowThreshold, Number(threshold))}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <BelowThresholdTable rows={reportData.belowThreshold} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Chronic Absentees"
          subtitle="Students absent for 3+ consecutive days."
          accent="#f59e0b"
          onExport={() => exportChronicCsv(reportData.chronicAbsentees)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : (
              <ChronicAbsentees
                rows={reportData.chronicAbsentees}
                onAlert={() => toastInfo('Parent alert functionality will be added in communication module.')}
              />
            )}
        </ReportCard>

      </section>
    </div>
  )
}

export default AttendanceReports