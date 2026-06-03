import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  FileCheck, Users, CalendarCheck, GraduationCap, 
  Wallet, BookOpen, ShieldCheck, Award, 
  Printer, RefreshCw, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react'

import useAuthStore from '@/store/authStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { complianceApi } from '@/api'
import { formatCurrency, formatPercent, cn } from '@/utils/helpers'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'

const ComplianceReportPage = () => {
  usePageTitle('Accreditation & Compliance Report')
  const { toastError, toastSuccess } = useToast()
  const { user } = useAuthStore()
  const { currentSession, sessions, fetchSessions } = useSessionStore()
  
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (sessions.length === 0) {
      fetchSessions().catch(console.error)
    }
  }, [sessions.length, fetchSessions])

  useEffect(() => {
    if (currentSession && !selectedSessionId) {
      setSelectedSessionId(currentSession.id.toString())
    }
  }, [currentSession, selectedSessionId])

  const fetchReport = useCallback(async () => {
    if (!selectedSessionId) return
    setIsLoading(true)
    try {
      const res = await complianceApi.getComplianceReport(selectedSessionId)
      setReport(res.data)
      toastSuccess('Report generated successfully')
    } catch (err) {
      toastError(err.message || 'Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }, [selectedSessionId, toastError, toastSuccess])

  useEffect(() => {
    if (selectedSessionId) {
      fetchReport()
    }
  }, [selectedSessionId, fetchReport])

  const sessionOptions = useMemo(() => 
    sessions.map(s => ({ value: s.id.toString(), label: s.name })), 
  [sessions])

  // Threshold Logic
  const getStatus = (metric, type) => {
    const thresholds = {
      attendance: { ok: 85, warn: 75 },
      retention: { ok: 90, warn: 80 },
      pass_rate: { ok: 70, warn: 60 },
      fee: { ok: 90, warn: 80 },
      staff_attendance: { ok: 90, warn: 80 }
    }
    const t = thresholds[type]
    if (metric >= t.ok) return { label: 'Compliant', color: 'green', score: 100, icon: CheckCircle2 }
    if (metric >= t.warn) return { label: 'Attention', color: 'amber', score: 50, icon: AlertCircle }
    return { label: 'Non-Compliant', color: 'red', score: 0, icon: XCircle }
  }

  const sectionsStatus = useMemo(() => {
    if (!report) return []
    return [
      { name: 'Enrollment', ...getStatus(report.enrollment.retention_rate, 'retention') },
      { name: 'Attendance', ...getStatus(report.attendance.overall_rate, 'attendance') },
      { name: 'Academic', ...getStatus(report.academic.pass_rate, 'pass_rate') },
      { name: 'Fee Collection', ...getStatus(report.fee.collection_rate, 'fee') },
      { name: 'Staff Attendance', ...getStatus(report.staff.staff_attendance_rate, 'staff_attendance') }
    ]
  }, [report])

  const overallScore = useMemo(() => {
    if (sectionsStatus.length === 0) return 0
    return Math.round(sectionsStatus.reduce((acc, s) => acc + s.score, 0) / sectionsStatus.length)
  }, [sectionsStatus])

  const attentionAreas = useMemo(() => 
    sectionsStatus.filter(s => s.score < 100).map(s => s.name),
  [sectionsStatus])

  if (isLoading && !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-brand mb-4" size={40} />
        <p className="text-text-secondary animate-pulse">Gathering compliance data across domains...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
      {/* Header Bar - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-base p-5 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
            <FileCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Accreditation & Compliance</h1>
            <p className="text-xs text-text-secondary">Institutional health & regulatory reporting</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              options={sessionOptions}
              value={selectedSessionId}
              onChange={setSelectedSessionId}
              placeholder="Select Session"
            />
          </div>
          <Button 
            variant="secondary" 
            icon={RefreshCw} 
            loading={isLoading} 
            onClick={fetchReport}
          >
            Generate
          </Button>
          <Button 
            variant="primary" 
            icon={Printer} 
            onClick={() => window.print()}
          >
            Print PDF
          </Button>
        </div>
      </div>

      {report && (
        <div className={cn(
          "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
          isLoading && "opacity-50 pointer-events-none transition-opacity"
        )}>
          
          {/* Summary Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-surface border border-border-base p-6 rounded-[32px] flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-6">Overall Compliance</h3>
              <div className="relative h-40 w-40 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="80" cy="80" r="70"
                    fill="transparent"
                    stroke="var(--color-border)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="80" cy="80" r="70"
                    fill="transparent"
                    stroke={overallScore >= 90 ? '#10b981' : overallScore >= 70 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * overallScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-text-primary">{overallScore}%</span>
                  <span className="text-[10px] font-bold uppercase text-text-muted">Score</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-surface border border-border-base p-6 rounded-[32px] flex flex-col justify-center">
              <h3 className="text-lg font-bold text-text-primary mb-4">Executive Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-raised border border-border-base">
                  <p className="text-xs font-bold text-text-muted uppercase mb-2">Compliance Status</p>
                  <div className="flex items-center gap-2">
                    {overallScore >= 90 ? (
                      <Badge variant="green" className="px-3 py-1 text-sm">✅ Institutional Excellence</Badge>
                    ) : overallScore >= 70 ? (
                      <Badge variant="amber" className="px-3 py-1 text-sm">⚠️ Borderline Compliance</Badge>
                    ) : (
                      <Badge variant="red" className="px-3 py-1 text-sm">❌ Immediate Action Required</Badge>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-surface-raised border border-border-base">
                  <p className="text-xs font-bold text-text-muted uppercase mb-2">Areas for Attention</p>
                  <div className="flex flex-wrap gap-2">
                    {attentionAreas.length > 0 ? attentionAreas.map(area => (
                      <span key={area} className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100">
                        {area}
                      </span>
                    )) : (
                      <span className="text-xs font-semibold text-emerald-600">None - All metrics passing</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm text-text-secondary leading-relaxed italic">
                This report aggregates institutional performance data for the session <strong>{report.session.name}</strong> ({new Date(report.session.start_date).toLocaleDateString()} to {new Date(report.session.end_date).toLocaleDateString()}). 
                Values are calculated based on live system records.
              </p>
            </div>
          </div>

          {/* Report Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Enrollment Summary */}
            <SectionCard 
              title="Enrollment Summary" 
              icon={Users} 
              status={getStatus(report.enrollment.retention_rate, 'retention')}
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <MiniStat label="Total Enrolled" value={report.enrollment.total_enrolled} />
                <MiniStat label="Retention Rate" value={formatPercent(report.enrollment.retention_rate)} />
                <MiniStat label="New Admissions" value={report.enrollment.new_admissions} sub={`vs ${report.enrollment.prev_new_admissions} prev`} />
                <MiniStat label="Dropouts/Left" value={report.enrollment.students_left} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-text-muted uppercase">Gender Breakdown</p>
                <div className="flex gap-2">
                  {report.enrollment.gender_breakdown.map(g => (
                    <div key={g.gender} className="flex-1 bg-surface-raised p-2 rounded-lg text-center border border-border-base">
                      <div className="text-sm font-bold capitalize">{g.gender}</div>
                      <div className="text-xs text-text-secondary">{g.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* 2. Attendance Compliance */}
            <SectionCard 
              title="Attendance Compliance" 
              icon={CalendarCheck} 
              status={getStatus(report.attendance.overall_rate, 'attendance')}
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <MiniStat label="Overall Rate" value={formatPercent(report.attendance.overall_rate)} />
                <MiniStat label="At-Risk (<75%)" value={report.attendance.at_risk_count} sub="Students" />
              </div>
              <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface">
                    <tr className="text-left border-b border-border-base">
                      <th className="pb-2 text-text-muted uppercase">Class</th>
                      <th className="pb-2 text-right text-text-muted uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base">
                    {report.attendance.class_wise.map(c => (
                      <tr key={c.class_name}>
                        <td className="py-2 font-medium">{c.class_name}</td>
                        <td className={cn("py-2 text-right font-bold", Number(c.rate) < 75 ? 'text-red-600' : 'text-text-primary')}>
                          {formatPercent(c.rate || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* 3. Academic Performance */}
            <SectionCard 
              title="Academic Performance" 
              icon={GraduationCap} 
              status={getStatus(report.academic.pass_rate, 'pass_rate')}
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <MiniStat label="Exams Conducted" value={report.academic.exams_conducted} />
                <MiniStat label="Pass Rate" value={formatPercent(report.academic.pass_rate)} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Subject Pass Rates</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {report.academic.subject_wise.slice(0, 10).map(s => (
                      <div key={s.subject_name} className="flex items-center justify-between text-[11px] p-2 bg-surface-raised rounded-lg border border-border-base">
                        <span className="truncate mr-2 font-medium">{s.subject_name}</span>
                        <span className={cn("font-bold", s.pass_rate < 60 ? "text-red-500" : "text-emerald-600")}>{Math.round(s.pass_rate)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Grade Distribution</p>
                  <div className="space-y-1.5">
                    {report.academic.grade_distribution.length > 0 ? report.academic.grade_distribution.map(g => (
                      <div key={g.grade} className="flex items-center justify-between text-[11px] p-2 bg-surface-raised rounded-lg border border-border-base">
                        <span className="font-bold text-brand">{g.grade}</span>
                        <span className="font-semibold">{g.count} <span className="text-text-muted font-normal ml-0.5">stu.</span></span>
                      </div>
                    )) : (
                      <div className="text-center py-4 text-xs text-text-muted italic bg-surface-raised rounded-xl border border-dashed border-border-base">
                        No grades logged
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 4. Fee Collection Compliance */}
            <SectionCard 
              title="Fee Collection Compliance" 
              icon={Wallet} 
              status={getStatus(report.fee.collection_rate, 'fee')}
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="col-span-2 bg-brand/5 p-4 rounded-2xl border border-brand/10">
                   <p className="text-[10px] font-bold text-brand uppercase mb-1">Total Collection Rate</p>
                   <div className="flex items-end justify-between">
                     <span className="text-2xl font-black text-brand">{formatPercent(report.fee.collection_rate)}</span>
                     <span className="text-xs text-text-secondary">{formatCurrency(report.fee.total_collected)} of {formatCurrency(report.fee.total_invoiced)}</span>
                   </div>
                </div>
                <MiniStat label="Defaulters" value={report.fee.defaulter_count} />
                <MiniStat label="Outstanding" value={formatCurrency(report.fee.outstanding_amount)} color="red" />
              </div>
            </SectionCard>

            {/* 5. Staff & Payroll */}
            <SectionCard 
              title="Staff & Payroll" 
              icon={ShieldCheck} 
              status={getStatus(report.staff.staff_attendance_rate, 'staff_attendance')}
            >
              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Teaching Staff" value={report.staff.teaching_staff_count} />
                <MiniStat label="Non-Teaching" value={report.staff.non_teaching_staff_count} />
                <MiniStat label="Staff Attendance" value={formatPercent(report.staff.staff_attendance_rate)} />
                <MiniStat label="Payroll Disbursed" value={formatPercent(report.staff.payroll_disbursement_rate)} />
              </div>
            </SectionCard>

            {/* 6. Library Utilization */}
            <SectionCard title="Library Utilization" icon={BookOpen}>
              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Total Books" value={report.library.total_books} />
                <MiniStat label="Total Issues" value={report.library.total_issues} />
                <MiniStat label="Active Borrowers" value={report.library.active_borrowers} />
                <MiniStat label="Overdue Books" value={report.library.overdue_books} color={report.library.overdue_books > 0 ? 'red' : undefined} />
              </div>
            </SectionCard>

            {/* 7. Audit & Governance */}
            <SectionCard title="Audit & Governance" icon={ShieldCheck}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <MiniStat label="Admin Actions" value={report.audit.total_admin_actions} />
                <MiniStat label="Active Admins" value={report.audit.unique_admins} />
              </div>
              <div className="bg-surface-raised p-3 rounded-2xl border border-border-base">
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Most Modified Module</p>
                <div className="text-sm font-bold text-text-primary capitalize">{report.audit.most_modified_table.replace(/_/g, ' ')}</div>
              </div>
            </SectionCard>

            {/* 8. Certificates Issued */}
            <SectionCard title="Certificates Issued" icon={Award}>
               <div className="flex items-center justify-center p-8 bg-surface-raised rounded-[24px] border border-dashed border-border-base">
                  <div className="text-center">
                    <div className="text-5xl font-black text-text-primary mb-2">{report.certificates.count}</div>
                    <div className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Issued This Session</div>
                  </div>
               </div>
            </SectionCard>

          </div>

          {/* Footer - Only for Print */}
          <div className="hidden print:block pt-10 mt-10 border-t border-border-base text-center">
            <p className="text-xs text-text-muted">
              Computer-generated report. Printed on {new Date().toLocaleString()} by {user?.name || 'Administrator'}.
            </p>
            <p className="text-[10px] text-text-muted mt-2">© EduHard School Management System</p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 2cm; }
          body { background: white !important; font-size: 10pt; }
          .max-w-\\[1400px\\] { max-width: 100% !important; margin: 0 !important; }
          .bg-surface { background: white !important; box-shadow: none !important; }
          .border { border-color: #eee !important; }
          .shadow-sm { box-shadow: none !important; }
          .rounded-\\[32px\\], .rounded-3xl, .rounded-2xl { border-radius: 12px !important; }
          .grid { display: block !important; }
          .md\\:grid-cols-2, .lg\\:grid-cols-3 { grid-template-columns: none !important; }
          .space-y-8 > * + * { margin-top: 2rem !important; }
          .gap-6 > * + * { margin-top: 1.5rem !important; }
          .SectionCard { break-inside: avoid; page-break-inside: avoid; margin-bottom: 2rem; }
          .animate-in { animation: none !important; }
          .print\\:hidden { display: none !important; }
          .hidden { display: none !important; }
          .print\\:block { display: block !important; }
          svg, i, .lucide { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .bg-brand\\/5 { background-color: #f5f3ff !important; }
          .text-brand { color: #6d28d9 !important; }
        }
      `}</style>
    </div>
  )
}

const SectionCard = ({ title, icon: Icon, status, children }) => (
  <div className="SectionCard bg-surface border border-border-base p-6 rounded-[32px] shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-surface-raised text-text-primary rounded-xl flex items-center justify-center">
          <Icon size={20} />
        </div>
        <h3 className="font-bold text-text-primary">{title}</h3>
      </div>
      {status && (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          status.color === 'green' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
          status.color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
          'bg-red-50 text-red-600 border border-red-100'
        )}>
          <status.icon size={12} />
          {status.label}
        </div>
      )}
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
)

const MiniStat = ({ label, value, sub, color }) => (
  <div className="bg-surface-raised p-3 rounded-2xl border border-border-base hover:border-brand/20 transition-colors group">
    <p className="text-[10px] font-bold text-text-muted uppercase mb-1 truncate">{label}</p>
    <div className="flex items-baseline gap-2 overflow-hidden">
      <span className={cn(
        "text-lg font-black truncate",
        color === 'red' ? 'text-red-600' : 'text-text-primary'
      )}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-text-secondary truncate">{sub}</span>}
    </div>
  </div>
)

export default ComplianceReportPage
