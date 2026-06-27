import { useEffect, useMemo, useState } from 'react'
import { BellRing, Download, PhoneCall, TriangleAlert, TrendingUp, Users, AlertCircle, Activity, ChevronRight, RefreshCw, CalendarDays, FilterX, Search, CheckCircle2, Layout, FileText, FileSpreadsheet } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/utils/helpers'
import { downloadAttendanceSummaryPdf } from '@/api/attendanceApi'

// ─────────────────────────────────────────────────────────────────────────────
//  STRUCTURAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div 
    className="bg-surface border rounded-[28px] p-5 flex flex-col shadow-sm transition-all hover:shadow-md group"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between mb-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-surface-raised shadow-inner" style={{ color }}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted group-hover:text-text-primary transition-colors">{label}</span>
    </div>
    <div>
      <span className="text-3xl font-bold text-text-primary leading-none tracking-tight">{value}</span>
      {sub && <p className="text-[10px] font-semibold text-text-muted uppercase mt-2 tracking-tighter opacity-70">{sub}</p>}
    </div>
  </div>
)

const ReportCard = ({ title, subtitle, onExport, onExportPdf, accent = 'var(--color-primary)', children }) => (
  <div 
    className="bg-surface border rounded-[28px] overflow-hidden flex flex-col shadow-sm h-full"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="p-5 sm:px-6 sm:py-5 border-b bg-surface-raised/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full shrink-0 shadow-sm" style={{ background: accent }} />
          <h2 className="text-base font-bold text-text-primary tracking-tight truncate">{title}</h2>
        </div>
        <p className="text-[11px] font-semibold text-text-muted mt-1 ml-4.5 truncate uppercase tracking-wider opacity-60">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        {onExportPdf && (
          <Button 
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={onExportPdf}
            className="h-9 rounded-2xl px-4 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all"
          >
            PDF
          </Button>
        )}
        <Button 
          variant="secondary"
          size="sm"
          icon={FileSpreadsheet}
          onClick={onExport}
          className="h-9 rounded-2xl px-4 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:shadow active:scale-95 transition-all"
        >
          CSV
        </Button>
      </div>
    </div>
    <div className="p-5 sm:p-6 flex-1">{children}</div>
  </div>
)

const PanelSkeleton = () => (
  <div className="flex flex-col gap-4 h-full">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 rounded-2xl bg-surface-raised animate-pulse" />
    ))}
  </div>
)

const EmptyPanel = ({ text, icon: Icon = TriangleAlert }) => (
  <div className="border border-dashed rounded-[24px] p-12 text-center flex flex-col items-center gap-5 bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
    <div className="h-14 w-14 rounded-[22px] bg-surface-raised flex items-center justify-center text-text-muted/40 shadow-inner">
      <Icon size={28} />
    </div>
    <p className="text-sm font-semibold text-text-secondary italic opacity-80">{text}</p>
  </div>
)


// ─────────────────────────────────────────────────────────────────────────────
//  REPORT PANELS
// ─────────────────────────────────────────────────────────────────────────────

const SummaryTable = ({ rows, threshold }) => {
  if (!rows.length) return <EmptyPanel text="No attendance records found for this range." />
  return (
    <div className="overflow-x-auto -mx-5 sm:mx-0">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { label: 'Roll', width: '70px', align: 'center' },
              { label: 'Student', width: 'auto', align: 'left' },
              { label: 'Days', width: '70px', align: 'center' },
              { label: 'Pres', width: '70px', align: 'center' },
              { label: 'Abs', width: '70px', align: 'center' },
              { label: '%', width: '90px', align: 'center' },
              { label: 'Status', width: '100px', align: 'center' }
            ].map((col) => (
              <th 
                key={col.label} 
                className={cn(
                  "px-4 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted",
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
            const sColor = pct >= threshold ? 'text-emerald-600' : pct >= threshold - 10 ? 'text-amber-600' : 'text-rose-600'
            const sBg    = pct >= threshold ? 'bg-emerald-50 text-emerald-700' : pct >= threshold - 10 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            const sLabel = pct >= threshold ? 'Good' : pct >= threshold - 10 ? 'Warning' : 'Critical'
            return (
              <tr key={row.enrollment_id} className="hover:bg-surface-raised/40 transition-all duration-200 group">
                <td className="px-4 py-4 text-center text-xs font-mono font-bold text-text-muted">{row.roll_number || '--'}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {row.first_name} {row.last_name}
                    </span>
                    <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mt-0.5 opacity-60">ID: {row.student_id}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center text-sm font-bold text-text-secondary">{row.total_days || 0}</td>
                <td className="px-4 py-4 text-center text-sm font-bold text-emerald-600">{row.present || 0}</td>
                <td className="px-4 py-4 text-center text-sm font-bold text-rose-500">{row.absent || 0}</td>
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={cn("text-xs font-bold", sColor)}>{pct.toFixed(0)}%</span>
                    <div className="h-1.5 w-14 rounded-full bg-surface-raised overflow-hidden shadow-inner">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(pct, 100)}%`, background: 'currentColor' }} className={sColor} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={cn("text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm", sBg)}>{sLabel}</span>
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
    <div className="flex flex-col gap-5 py-2">
      {rows.map((row) => {
        const color = row.percentage >= 90 ? 'bg-emerald-500' : row.percentage >= 75 ? 'bg-primary' : row.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
        const textColor = row.percentage >= 90 ? 'text-emerald-600' : row.percentage >= 75 ? 'text-primary' : row.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
        return (
          <div key={row.date} className="group">
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] bg-surface-raised px-3 py-1 rounded-lg shadow-sm">{row.date}</span>
              <span className={cn("text-xs font-bold", textColor)}>
                {row.present}/{row.total}
                <span className="text-text-muted/30 font-normal mx-2">|</span>
                {row.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-raised overflow-hidden shadow-inner p-0.5">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", color)} 
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
    <div className="grid grid-cols-1 gap-4">
      {rows.map((row) => {
        const percentage = Number(row.percentage || 0)
        const totalDays = Number(row.total_days || 0)
        const effectivePresentDays = percentage * totalDays / 100
        const daysShort = percentage >= threshold ? 0 : Math.ceil((threshold * totalDays / 100) - effectivePresentDays)
        return (
          <div key={row.enrollment_id} className="bg-surface-raised/20 border rounded-[22px] p-5 relative overflow-hidden group hover:border-rose-200 transition-all shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="absolute top-0 left-0 bottom-0 pointer-events-none opacity-[0.04] bg-rose-600 transition-all duration-1000" style={{ width: `${percentage}%` }} />
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <p className="text-base font-bold text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <p className="text-[10px] font-semibold text-text-muted mt-1 uppercase tracking-widest opacity-70">Roll {row.roll_number || '--'} · {totalDays} Working Days</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-rose-600 font-bold uppercase tracking-widest bg-rose-50 w-fit px-3 py-1 rounded-lg border border-rose-100">
                  <TriangleAlert size={14} strokeWidth={2.5} />
                  <span>{Math.max(0, daysShort)} days short of {threshold}%</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-rose-600 leading-none tracking-tighter">
                {percentage.toFixed(0)}<span className="text-lg ml-0.5 font-semibold opacity-60">%</span>
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
    <div className="grid grid-cols-1 gap-4">
      {rows.map((row) => (
        <div key={row.enrollment_id} className="bg-surface-raised/20 border rounded-[22px] p-5 transition-all hover:border-amber-200 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="text-base font-bold text-text-primary truncate">{row.first_name} {row.last_name}</p>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 uppercase tracking-widest shadow-sm border border-rose-200">
                  {row.consecutive_absent_days} Days Consecutive
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm">
                    <PhoneCall size={14} />
                  </div>
                  <span className="truncate">{row.father_phone || row.mother_phone || 'No Contact Number'}</span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3 text-[11px] font-medium text-text-muted mt-1 bg-surface-raised/40 p-3 rounded-xl border border-border/30">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 border border-amber-100 shadow-sm">
                    <CalendarDays size={14} />
                  </div>
                  <p className="line-clamp-2 leading-relaxed opacity-80">{Array.isArray(row.dates) ? row.dates.join(', ') : 'No date records'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
               <button 
                onClick={() => (row.father_phone || row.mother_phone) && window.open(`tel:${row.father_phone || row.mother_phone}`, '_self')}
                className="flex-1 sm:flex-none h-11 px-6 rounded-2xl bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <PhoneCall size={16} /> Call
              </button>
              <button 
                onClick={onAlert}
                className="flex-1 sm:flex-none h-11 px-6 rounded-2xl bg-amber-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <BellRing size={16} /> Alert
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceReports = () => {
  usePageTitle('Attendance Reports')

  const { toastError, toastInfo, toastSuccess } = useToast()
  const { assignmentOptions, loadingAssignments, reportData, loadingReports, loadReports, loadRegister, registerData } = useAttendance()

  const [assignmentKey, setAssignmentKey] = useState('')
  const [fromDate,      setFromDate]      = useState(firstOfMonth())
  const [toDate,        setToDate]        = useState(today())
  const [threshold,     setThreshold]     = useState('75')
  const [downloading,   setDownloading]   = useState(false)

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

  const handleDownloadSummary = async () => {
    if (!registerData?.session_id || !selectedSection) return
    setDownloading(true)
    try {
      const response = await downloadAttendanceSummaryPdf({
        session_id: registerData.session_id,
        class_id: selectedSection.class_id,
        section_id: selectedSection.section_id,
        from_date: fromDate,
        to_date: toDate
      })

      const blob = response.data || response
      if (blob.type === 'application/json') {
        const text = await blob.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_Summary_${selectedSection.class_name}_${selectedSection.section_name}_${fromDate}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      toastSuccess('Summary report downloaded.')
    } catch (err) {
      toastError(err.message || 'Failed to download attendance summary.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Attendance Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Summary, daily trends, below-threshold tracking, and chronic absentee alerts for your assigned sections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            icon={Download} 
            onClick={handleDownloadSummary}
            loading={downloading}
            disabled={!registerData || loadingReports}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div 
        className="rounded-2xl border p-6"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-6 items-end">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Assigned Section</label>
            <Select
              value={assignmentKey}
              onChange={(e) => setAssignmentKey(e.target.value)}
              options={reportAssignments}
              placeholder={loadingAssignments ? 'Loading…' : 'Select section'}
              className="h-11 px-4 rounded-xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>From Date</label>
            <Input 
              type="date" 
              className="w-full h-11 bg-surface-raised border border-border/50 rounded-xl px-4 text-sm text-text-primary outline-none focus:border-primary font-semibold transition-all" 
              style={{ height: '44px' }}
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>To Date</label>
            <Input 
              type="date" 
              className="w-full h-11 bg-surface-raised border border-border/50 rounded-xl px-4 text-sm text-text-primary outline-none focus:border-primary font-semibold transition-all" 
              style={{ height: '44px' }}
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Threshold (%)</label>
            <Select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              options={[
                { value: '75', label: '75%' },
                { value: '80', label: '80%' },
                { value: '85', label: '85%' },
              ]}
              className="h-11 px-4 rounded-xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Class Size"    value={reportData.summary.length}          sub="In Selected Section"          color="#6366f1" icon={Users}      />
        <StatCard label="Average Rate"  value={`${avgAtt}%`}                       sub="Across Date Range"            color="#10b981" icon={TrendingUp}  />
        <StatCard label="Under Target"  value={reportData.belowThreshold.length}   sub={`Under ${threshold}% Target`} color="#ef4444" icon={AlertCircle} />
        <StatCard label="Long Absents"  value={reportData.chronicAbsentees.length} sub="3+ Consecutive Days"          color="#f59e0b" icon={Activity}    />
      </div>

      {/* ── REPORT GRID ── */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <ReportCard
          title="Student-wise Summary"
          subtitle="Detailed attendance performance metrics"
          accent="#6366f1"
          onExport={() => exportSummaryCsv(reportData.summary)}
          onExportPdf={handleDownloadSummary}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <SummaryTable rows={reportData.summary} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Daily Activity Heatmap"
          subtitle="Day-wise class attendance trends"
          accent="#10b981"
          onExport={() => exportDailyCsv(dailySummary)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <DailySummaryPanel rows={dailySummary} />}
        </ReportCard>

        <ReportCard
          title="Risk Analysis"
          subtitle="Students below target percentage"
          accent="#ef4444"
          onExport={() => exportBelowThresholdCsv(reportData.belowThreshold, Number(threshold))}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : <BelowThresholdTable rows={reportData.belowThreshold} threshold={Number(threshold)} />}
        </ReportCard>

        <ReportCard
          title="Chronic Absentee Log"
          subtitle="High priority contact list"
          accent="#f59e0b"
          onExport={() => exportChronicCsv(reportData.chronicAbsentees)}
        >
          {loadingAssignments || loadingReports
            ? <PanelSkeleton />
            : (
              <ChronicAbsentees
                rows={reportData.chronicAbsentees}
                onAlert={() => toastInfo('Alert will be sent via automated notification system.')}
              />
            )}
        </ReportCard>

      </section>
    </div>
  )
}

export default AttendanceReports

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
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
