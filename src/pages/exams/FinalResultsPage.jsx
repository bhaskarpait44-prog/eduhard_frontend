// src/pages/exams/FinalResultsPage.jsx
import { useState, useEffect } from 'react'
import { Calculator, BarChart3, Download, FileText, Send } from 'lucide-react'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import OverrideResultModal from './OverrideResultModal'
import ReportCardModal from './ReportCardModal'
import { getClasses, getClassOptions } from '@/api/classApi'
import { downloadClassResultSheetPdf } from '@/api/examsApi'
import { formatPercent, formatCurrency, formatDate } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'

const RESULT_CFG = {
  pass        : { label: 'Pass',        variant: 'green'                                   },
  fail        : { label: 'Fail',        variant: 'red'                                     },
  compartment : { label: 'Compartment', variant: 'yellow'                                  },
  detained    : { label: 'Detained',    variant: 'dark', style: { color: '#7f1d1d' }       },
  withheld    : { label: 'Withheld',    variant: 'grey'                                    },
}

const GRADE_COLOR = { 
  'A+':'#15803d', 'A':'#16a34a', 'B+':'#2563eb', 'B':'#1d4ed8', 'C':'#d97706', 'D':'#ea580c', 'F':'#dc2626' 
}

const FinalResultsPage = () => {
  const { toastSuccess, toastError } = useToast()
  const { 
    classResults, classResultsMeta, isLoading, isSaving, 
    fetchClassResults, bulkCalculateResults, releaseResult 
  } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId,    setSessionId]    = useState('')
  const [classId,      setClassId]      = useState('')
  const [classes,      setClasses]      = useState([])
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [calcConfirm,  setCalcConfirm]  = useState(false)
  const [releaseConfirm, setReleaseConfirm] = useState(false)
  const [downloading,  setDownloading]  = useState(false)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) setSessionId(String(currentSession.id))
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId || !classId) {
      useExamStore.setState({ classResults: [], classResultsMeta: null })
      return
    }
    fetchClassResults({ session_id: sessionId, class_id: classId })
      .catch(() => toastError('Failed to load results'))
  }, [sessionId, classId, fetchClassResults, toastError])

  const handleCalculate = async () => {
    setCalcConfirm(false)
    const res = await bulkCalculateResults({ 
      session_id: parseInt(sessionId), 
      class_id: parseInt(classId),
      calculate: true,
      release: false 
    })
    if (res.success) {
      toastSuccess(`Final results calculated for ${res.data.calculated} students.`)
      fetchClassResults({ session_id: sessionId, class_id: classId }).catch(() => {})
    } else {
      toastError(res.message || 'Failed to calculate results')
    }
  }

  const handleBulkRelease = async (releaseVal) => {
    setReleaseConfirm(false)
    const res = await bulkCalculateResults({
      session_id: parseInt(sessionId),
      class_id: parseInt(classId),
      calculate: false,
      release: releaseVal
    })
    if (res.success) {
      toastSuccess(releaseVal ? 'Final results published successfully!' : 'Final results unpublished/withheld.')
      fetchClassResults({ session_id: sessionId, class_id: classId }).catch(() => {})
    } else {
      toastError(res.message || 'Failed to update final results publish status')
    }
  }

  const handleRelease = async (row) => {
    const res = await releaseResult({
      enrollment_id: row.enrollment_id,
      release: !row.release_result
    })
    if (res.success) {
      toastSuccess(`Result ${!row.release_result ? 'released' : 'withheld'} for student`)
      fetchClassResults({ session_id: sessionId, class_id: classId }).catch(() => {})
    } else {
      toastError(res.message || 'Failed to update release status')
    }
  }

  const handleDownloadSheet = async () => {
    if (!sessionId || !classId) return
    setDownloading(true)
    try {
      const res = await downloadClassResultSheetPdf({ session_id: sessionId, class_id: classId })
      const className = classes.find(c => String(c.value) === String(classId))?.label || 'Class'
      downloadBlob(res, `Result_Sheet_${className.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      toastError('Failed to download result sheet')
    } finally { setDownloading(false) }
  }

  const passedCount   = classResults.filter(r => r.result === 'pass').length
  const failedCount   = classResults.filter(r => r.result === 'fail').length
  const compCount     = classResults.filter(r => r.result === 'compartment').length
  const releasedCount = classResults.filter(r => r.release_result).length
  const allReleased   = classResults.length > 0 && releasedCount === classResults.length
  const hasPendingReview = Number(classResultsMeta?.submitted_count || 0) > 0 || Number(classResultsMeta?.rejected_count || 0) > 0

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div
        className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex-1 w-full">
          <Select
            label="Session"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            options={(sessions || []).map(s => ({ 
              value: String(s.id), 
              label: `${s.name}${s.is_current ? ' (Current)' : ''}` 
            }))}
            containerClassName="w-full"
          />
        </div>
        <div className="flex-1 w-full">
          <Select
            label="Class"
            value={classId}
            onChange={e => setClassId(e.target.value)}
            options={classes}
            placeholder="Select class"
            containerClassName="w-full"
          />
        </div>
        {classId && (
          <div className="flex items-end gap-2 shrink-0">
            <Button
              variant="outline"
              icon={Calculator}
              onClick={() => setCalcConfirm(true)}
              disabled={classResults.length === 0 || hasPendingReview}
            >
              Calculate Results
            </Button>
            {classResults.length > 0 && (
              <>
                <Button
                  variant={allReleased ? 'outline' : 'primary'}
                  icon={Send}
                  onClick={() => setReleaseConfirm(true)}
                  loading={isSaving}
                >
                  {allReleased ? 'Unpublish Results' : 'Publish Results'}
                </Button>
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleDownloadSheet}
                  loading={downloading}
                >
                  Result Sheet
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary badges */}
      {classId && classResults.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: `${passedCount} Passed`,      color: '#16a34a', bg: '#f0fdf4' },
            { label: `${failedCount} Failed`,      color: '#dc2626', bg: '#fef2f2' },
            { label: `${compCount} Compartment`,   color: '#d97706', bg: '#fffbeb' },
          ].map(b => (
            <div
              key={b.label}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: b.bg, color: b.color }}
            >
              {b.label}
            </div>
          ))}
        </div>
      )}

      {classId && !!classResultsMeta?.total_subjects && (
        <section
          className="rounded-[28px] border p-5"
          style={{ borderColor: hasPendingReview ? '#f59e0b55' : 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Marks review status
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {hasPendingReview
                  ? 'Final result calculation is blocked until submitted marks are approved in the exam review screen.'
                  : 'All reviewed subjects are clear for result calculation.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ReviewPill label="Approved" value={classResultsMeta.approved_count} tone="#15803d" bg="#f0fdf4" />
              <ReviewPill label="Submitted" value={classResultsMeta.submitted_count} tone="#b45309" bg="#fffbeb" />
              <ReviewPill label="Rejected" value={classResultsMeta.rejected_count} tone="#b91c1c" bg="#fef2f2" />
              <ReviewPill label="Draft" value={classResultsMeta.draft_count} tone="#475569" bg="#f8fafc" />
            </div>
          </div>
        </section>
      )}

      {/* Results table */}
      {classId && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {isLoading ? (
            <TableSkeleton cols={9} rows={5} />
          ) : classResults.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No results found"
              description="Click &quot;Calculate Results&quot; to compute final results based on weights and attendance."
              className="border-0 rounded-none py-12"
            />
          ) : (
            <div className="space-y-4">
              {/* Mobile: Card View */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {classResults.map((row, i) => {
                  const resultCfg = RESULT_CFG[row.result] || { label: row.result || 'Not Calc', variant: 'grey' }
                  const gradeColor = GRADE_COLOR[row.grade] || 'var(--color-text-secondary)'
                  const hasFeeDue = parseFloat(row.pending_balance) > 0

                  return (
                    <div key={row.enrollment_id || i} className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                             <span className="text-[10px] font-mono bg-surface-raised px-1.5 py-0.5 rounded text-text-muted">#{row.roll_number || '--'}</span>
                             <h3 className="font-bold text-text-primary truncate">{row.student_name || row.name}</h3>
                          </div>
                          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{row.admission_no}</p>
                        </div>
                        <Badge variant={resultCfg.variant} dot className="uppercase text-[10px]">{resultCfg.label}</Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-2 py-2 border-y border-border/50">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-text-muted tracking-tight">Attendance</span>
                            <span className="text-xs font-semibold" style={{ color: Number(row.attendance_pct) < 75 ? '#dc2626' : '#16a34a' }}>
                              {row.attendance_pct !== undefined ? `${row.attendance_pct}%` : '—'}
                            </span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-text-muted tracking-tight">Marks</span>
                            <span className="text-xs font-semibold text-text-primary">{row.marks_obtained || 0}/{row.total_marks || 0}</span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-text-muted tracking-tight">Percent</span>
                            <span className="text-xs font-bold" style={{ color: parseFloat(row.percentage) >= 40 ? '#16a34a' : '#dc2626' }}>{formatPercent(row.percentage)}</span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase font-bold text-text-muted tracking-tight">Promoted</span>
                            <Badge variant={row.is_promoted ? 'green' : 'red'} className="text-[9px]">{row.is_promoted ? 'Yes' : 'No'}</Badge>
                         </div>
                      </div>

                      {hasFeeDue && (
                        <div className="flex items-center justify-between bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Fee Due: {formatCurrency(row.pending_balance)}</span>
                          <Badge variant={row.release_result ? 'green' : 'grey'} className="text-[9px]">{row.release_result ? 'Result Released' : 'Result Withheld'}</Badge>
                        </div>
                      )}

                      <div className="flex gap-2">
                         <Button 
                            variant="secondary" size="sm" className="flex-1"
                            icon={FileText}
                            onClick={() => row.result && setReportTarget(row)}
                            disabled={!row.result || row.is_withheld || (parseFloat(row.pending_balance) > 0 && !row.release_result)}
                         >
                           Report Card
                         </Button>
                         <Button 
                           variant="secondary" size="sm" className="flex-1"
                           onClick={() => setOverrideTarget(row)}
                         >
                           Override
                         </Button>
                         {hasFeeDue && (
                            <Button 
                              variant="ghost" size="sm" className="px-3"
                              onClick={() => handleRelease(row)}
                              style={{ color: row.release_result ? '#d97706' : '#2563eb' }}
                              loading={isSaving}
                            >
                              {row.release_result ? 'Lock' : 'Push'}
                            </Button>
                         )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Roll','Student','Attendance','Total Marks','Percentage','Grade','Result','Promoted',''].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-text-muted)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classResults.map((row, i) => {
                      const resultCfg = RESULT_CFG[row.result] || { label: row.result, variant: 'grey' }
                      const gradeColor = GRADE_COLOR[row.grade] || 'var(--color-text-secondary)'

                      return (
                        <tr
                          key={row.enrollment_id || i}
                          style={{ borderBottom: i < classResults.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                        >
                          <td className="px-4 py-3.5 text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
                            {row.roll_number || '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {row.student_name || row.name}
                            </p>
                            <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                              {row.admission_no}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <span className="font-semibold" style={{ color: Number(row.attendance_pct) < 75 ? '#dc2626' : '#16a34a' }}>
                              {row.attendance_pct !== undefined ? `${row.attendance_pct}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {row.marks_obtained}/{row.total_marks}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="text-sm font-bold"
                              style={{ color: parseFloat(row.percentage) >= 40 ? '#16a34a' : '#dc2626' }}
                            >
                              {formatPercent(row.percentage)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold" style={{ color: gradeColor }}>
                              {row.grade || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {parseFloat(row.pending_balance) > 0 ? (
                              <div className="flex flex-col gap-1">
                                <Badge variant={row.release_result ? 'green' : 'grey'} dot>
                                  {row.release_result ? 'Released' : 'Withheld'}
                                </Badge>
                                <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">
                                  Fee Due: {formatCurrency(row.pending_balance)}
                                </span>
                              </div>
                            ) : row.result ? (
                              <Badge variant={resultCfg.variant} dot>{resultCfg.label}</Badge>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not calculated</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={row.is_promoted ? 'green' : 'red'}>
                              {row.is_promoted ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline" size="xs"
                                icon={FileText}
                                onClick={() => row.result && setReportTarget(row)}
                                disabled={!row.result || row.is_withheld || (parseFloat(row.pending_balance) > 0 && !row.release_result)}
                              >
                                Report Card
                              </Button>
                              <Button
                                variant="ghost" size="xs"
                                onClick={() => setOverrideTarget(row)}
                              >
                                Override
                              </Button>
                              {parseFloat(row.pending_balance) > 0 && (
                                <Button
                                  variant="ghost" size="xs"
                                  onClick={() => handleRelease(row)}
                                  style={{ color: row.release_result ? '#d97706' : '#2563eb' }}
                                  loading={isSaving}
                                >
                                  {row.release_result ? 'Lock' : 'Push'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculate confirm */}
      <ConfirmDialog
        open={calcConfirm}
        onClose={() => setCalcConfirm(false)}
        onConfirm={handleCalculate}
        title="Calculate Final Results?"
        description={`This will calculate session-wide final results for all ${classResults.length} students in this class based on exam weightages and attendance.`}
        confirmLabel="Calculate"
        variant="primary"
        loading={isSaving}
      />

      {/* Release confirm */}
      <ConfirmDialog
        open={releaseConfirm}
        onClose={() => setReleaseConfirm(false)}
        onConfirm={() => handleBulkRelease(!allReleased)}
        title={allReleased ? 'Unpublish Final Results?' : 'Publish Final Results?'}
        description={allReleased 
          ? `This will withdraw and withhold final results for all ${classResults.length} students in this class, hiding them from the student/parent portal.`
          : `This will release and publish final results for all ${classResults.length} students in this class, making them visible in the student/parent portal (subject to fee dues checks).`
        }
        confirmLabel={allReleased ? 'Unpublish' : 'Publish'}
        variant={allReleased ? 'danger' : 'primary'}
        loading={isSaving}
      />

      {/* Override modal */}
      <OverrideResultModal
        open={!!overrideTarget}
        student={overrideTarget}
        onClose={() => setOverrideTarget(null)}
        onSuccess={() => {
          setOverrideTarget(null)
          fetchClassResults({ session_id: sessionId, class_id: classId })
        }}
      />

      {/* Report card modal */}
      <ReportCardModal
        open={!!reportTarget}
        student={reportTarget}
        onClose={() => setReportTarget(null)}
      />

    </div>
  )
}

const ReviewPill = ({ label, value, tone, bg }) => (
  <div className="rounded-2xl px-4 py-2.5" style={{ backgroundColor: bg }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>{label}</p>
    <p className="mt-1 text-base font-bold" style={{ color: tone }}>{value || 0}</p>
  </div>
)

export default FinalResultsPage
