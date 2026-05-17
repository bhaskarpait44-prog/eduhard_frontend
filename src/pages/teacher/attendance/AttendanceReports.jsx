import { useEffect, useMemo, useState } from 'react'
import { BellRing, Download, PhoneCall, TriangleAlert, TrendingUp, Users, AlertCircle, Activity } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
//  All colours use the same CSS variables your original file used:
//    var(--color-border)         var(--color-surface)
//    var(--color-surface-raised) var(--color-text-primary)
//    var(--color-text-secondary) var(--color-text-muted)
//  Your app's existing dark/light theme switching handles everything.
//  No theme tokens, no toggle button added here.
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
  .ar * { box-sizing: border-box; }
  .ar ::-webkit-scrollbar { width: 4px; height: 4px; }
  .ar ::-webkit-scrollbar-track { background: transparent; }
  .ar ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
  .ar input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }

  @keyframes ar-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .ar-shimmer {
    background: linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-surface) 50%, var(--color-surface-raised) 75%);
    background-size: 200% 100%;
    animation: ar-shimmer 1.4s infinite;
  }
`

// ─────────────────────────────────────────────────────────────────────────────
//  STRUCTURAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div className="bg-surface border border-border rounded-[20px] p-5 sm:p-6 flex flex-col gap-2 relative overflow-hidden transition-colors hover:border-text-muted">
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(20px)', pointerEvents: 'none' }} />
    <div className="flex items-center justify-between">
      <span className="text-[10px] tracking-[0.18em] uppercase text-text-muted font-medium">{label}</span>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}1c` }}>
        <Icon size={14} style={{ color }} />
      </div>
    </div>
    <span className="text-2xl sm:text-3xl font-bold text-text-primary leading-none">{value}</span>
    {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
  </div>
)

const ReportCard = ({ title, subtitle, onExport, accent = '#7b6ef6', children }) => (
  <div className="bg-surface border border-border rounded-[24px] overflow-hidden flex flex-col shadow-sm">
    <div className="p-5 sm:px-6 sm:py-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: accent }} />
          <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">{title}</h2>
        </div>
        <p className="text-xs text-text-muted truncate ml-3">{subtitle}</p>
      </div>
      <button 
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-[1.5px] border-border bg-surface-raised text-text-secondary text-xs font-semibold hover:border-brand hover:bg-brand/5 hover:text-brand transition-all flex-shrink-0" 
        onClick={onExport}
      >
        <Download size={13} /> Export
      </button>
    </div>
    <div className="p-4 sm:p-6 flex-1">{children}</div>
  </div>
)

const FieldSelect = ({ label, value, onChange, options, placeholder }) => (
  <div className="w-full">
    <label className="text-[10px] tracking-[0.16em] uppercase text-text-muted block mb-1.5 font-semibold ml-1">{label}</label>
    <div className="relative">
      <select 
        className="w-full appearance-none bg-surface border-[1.5px] border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none cursor-pointer font-inherit transition-all focus:border-brand min-h-11 pr-10" 
        value={value} 
        onChange={onChange}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M6 8L1 3h10z"/></svg>
      </div>
    </div>
  </div>
)

const DateField = ({ label, value, onChange }) => (
  <div className="w-full">
    <label className="text-[10px] tracking-[0.16em] uppercase text-text-muted block mb-1.5 font-semibold ml-1">{label}</label>
    <input 
      type="date" 
      className="w-full bg-surface border-[1.5px] border-border rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none cursor-pointer font-inherit transition-all focus:border-brand min-h-11" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
)

const PanelSkeleton = () => (
  <div className="flex flex-col gap-3">
    {[...Array(5)].map((_, i) => <div key={i} className="h-11 rounded-xl ar-shimmer" />)}
  </div>
)

const EmptyPanel = ({ text }) => (
  <div className="border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center gap-2">
    <TriangleAlert size={20} className="text-text-muted opacity-40" />
    <p className="text-xs sm:text-sm text-text-secondary italic">{text}</p>
  </div>
)


// ─────────────────────────────────────────────────────────────────────────────
//  REPORT PANELS — logic identical to original
// ─────────────────────────────────────────────────────────────────────────────

const SummaryTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text="No attendance records found for this range." />
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
        <thead>
          <tr className="border-b border-border">
            {['Roll', 'Name', 'Days', 'Pres', 'Abs', 'Late', '%', 'Status'].map((head) => (
              <th key={head} className="px-3 py-3 text-[10px] tracking-[0.12em] uppercase text-text-muted font-bold">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const pct = Number(row.percentage || 0)
            const sColor = pct >= threshold ? '#10b981' : pct >= threshold - 10 ? '#f59e0b' : '#ef4444'
            const sBg    = pct >= threshold ? 'rgba(16,185,129,0.12)' : pct >= threshold - 10 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
            const sLabel = pct >= threshold ? 'Good' : pct >= threshold - 10 ? 'Warning' : 'Critical'
            return (
              <tr key={row.enrollment_id} className="hover:bg-surface-raised transition-colors">
                <td className="px-3 py-3 text-xs text-text-secondary">{row.roll_number || '--'}</td>
                <td className="px-3 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">{row.first_name} {row.last_name}</td>
                <td className="px-3 py-3 text-xs text-text-secondary">{row.total_days || 0}</td>
                <td className="px-3 py-3 text-xs font-bold text-emerald-600">{row.present || 0}</td>
                <td className="px-3 py-3 text-xs font-bold text-red-500">{row.absent || 0}</td>
                <td className="px-3 py-3 text-xs text-amber-600">{row.late || 0}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold" style={{ color: sColor }}>{pct.toFixed(0)}%</span>
                    <div className="h-1 w-12 rounded-full bg-surface-raised overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: sColor }} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide" style={{ background: sBg, color: sColor }}>{sLabel}</span>
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
  if (!rows.length) return <EmptyPanel text="No daily summary available for the selected month." />
  const max = Math.max(...rows.map((row) => row.percentage), 1)
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const color = row.percentage >= 90 ? '#10b981' : row.percentage >= 75 ? '#7b6ef6' : row.percentage >= 60 ? '#f59e0b' : '#ef4444'
        return (
          <div key={row.date} className="group">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[11px] text-text-secondary font-mono bg-surface-raised px-1.5 py-0.5 rounded uppercase">{row.date}</span>
              <span className="text-xs font-bold" style={{ color }}>
                {row.present}/{row.total}
                <span className="text-text-muted font-normal mx-1">·</span>
                {row.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 cubic-bezier(.4,0,.2,1)" style={{ width: `${(row.percentage / max) * 100}%`, background: `linear-gradient(90deg, ${color}44, ${color})` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}


const BelowThresholdTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text={`No students are below ${threshold}% in this date range.`} />
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const percentage = Number(row.percentage || 0)
        const totalDays = Number(row.total_days || 0)
        const effectivePresentDays = percentage * totalDays / 100
        const daysShort = percentage >= threshold ? 0 : Math.ceil((threshold * totalDays / 100) - effectivePresentDays)
        return (
          <div key={row.enrollment_id} className="bg-surface-raised border border-border rounded-2xl p-4 relative overflow-hidden group hover:border-red-200 transition-colors">
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, rgba(239,68,68,0.04), transparent)' }} />
            <div className="flex items-center justify-between gap-4 relative">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <p className="text-[10px] text-text-secondary mt-0.5 uppercase tracking-wide">Roll {row.roll_number || '--'} · {totalDays} school days</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <TriangleAlert size={12} />
                  <span>{Math.max(0, daysShort)} days short of {threshold}%</span>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-red-500 leading-none">
                {percentage.toFixed(0)}<span className="text-sm ml-0.5">%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ChronicAbsentees = ({ rows, onAlert }) => {
  if (!rows.length) return <EmptyPanel text="No chronic absentees found in this date range." />
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.enrollment_id} className="bg-surface-raised border border-border rounded-2xl p-4 transition-colors hover:border-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-sm font-bold text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 uppercase tracking-wide">
                  {row.consecutive_absent_days} Days Consecutive
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <PhoneCall size={12} className="shrink-0" />
                  <span className="truncate">Call: {row.father_phone || row.mother_phone || 'N/A'}</span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-2 text-[10px] text-text-muted mt-1">
                  <BellRing size={12} className="shrink-0 mt-0.5" />
                  <p className="line-clamp-1">{Array.isArray(row.dates) ? row.dates.join(', ') : 'No dates'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2 sm:mt-0">
               <button 
                onClick={() => (row.father_phone || row.mother_phone) && window.open(`tel:${row.father_phone || row.mother_phone}`, '_self')}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
              >
                <PhoneCall size={13} /> Call
              </button>
              <button 
                onClick={onAlert}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20"
              >
                <BellRing size={13} /> Alert
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
    <div className="ar" style={{ fontFamily: 'inherit' }}>
      <style>{STYLES}</style>

      {/* ── PAGE HEADER — identical text to original ── */}
      <section
        className="ar-filters"
        style={{ marginBottom: 20, borderRadius: 28 }}
      >
        <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
            Attendance Reports
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
            Summary, daily class trends, below-threshold tracking, and chronic absentee alerts for your assigned sections only.
          </p>
        </div>

        {/* filters — same fields, same logic as original */}
        <FieldSelect
          label="Assigned Section"
          value={assignmentKey}
          onChange={(e) => setAssignmentKey(e.target.value)}
          options={reportAssignments}
          placeholder={loadingAssignments ? 'Loading…' : 'Select section'}
        />
        <DateField label="From Date" value={fromDate} onChange={setFromDate} />
        <DateField label="To Date"   value={toDate}   onChange={setToDate}   />
        <FieldSelect
          label="Threshold"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          options={[
            { value: '75', label: '75%' },
            { value: '80', label: '80%' },
            { value: '85', label: '85%' },
          ]}
        />
      </section>

      {/* ── STAT STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Students"    value={reportData.summary.length}          sub="in selected section"          color="#7b6ef6" icon={Users}      />
        <StatCard label="Avg Attendance"    value={`${avgAtt}%`}                       sub="across date range"            color="#10b981" icon={TrendingUp}  />
        <StatCard label="Below Threshold"   value={reportData.belowThreshold.length}   sub={`under ${threshold}% target`} color="#ef4444" icon={AlertCircle} />
        <StatCard label="Chronic Absentees" value={reportData.chronicAbsentees.length} sub="3+ consecutive days"          color="#f59e0b" icon={Activity}    />
      </div>

      {/* ── REPORT GRID — same 4 cards as original ── */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

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
          subtitle="Day-wise class attendance percentage to help spot weak attendance patterns."
          accent="#10b981"
          onExport={() => exportDailyCsv(dailySummary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <DailySummaryPanel rows={dailySummary} />}
        </ReportCard>

        <ReportCard
          title="Below Threshold Report"
          subtitle="Students under the target attendance percentage, sorted from lowest first."
          accent="#ef4444"
          onExport={() => exportBelowThresholdCsv(reportData.belowThreshold, Number(threshold))}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <BelowThresholdTable rows={reportData.belowThreshold} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Chronic Absentees"
          subtitle="Students absent for 3 or more consecutive days with parent contact details."
          accent="#f59e0b"
          onExport={() => exportChronicCsv(reportData.chronicAbsentees)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : (
              <ChronicAbsentees
                rows={reportData.chronicAbsentees}
                onAlert={() => toastInfo('Parent alert integration comes in the student communication steps.')}
              />
            )}
        </ReportCard>

      </section>
    </div>
  )
}

export default AttendanceReports