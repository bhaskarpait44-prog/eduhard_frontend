import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileBarChart2, RefreshCw, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ReportCardView from '@/components/student/ReportCardView'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'

const ReportCard = () => {
  usePageTitle('Report Card')

  const [searchParams, setSearchParams] = useSearchParams()
  const { toastSuccess, toastError, toastInfo } = useToast()
  const queryExamId = searchParams.get('examId') || ''
  const [publishedExams, setPublishedExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(queryExamId || '')
  const [reportCard, setReportCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const loadReportCard = useCallback(async ({ silent = false, forcedExamId } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const resultsResponse = await studentApi.getStudentResults()
      const exams = (resultsResponse?.data?.exams || []).filter(
        (exam) => exam.student_status === 'published'
      )
      setPublishedExams(exams)

      const targetExamId = String(
        forcedExamId || queryExamId || selectedExamId || exams[0]?.id || ''
      )

      setSelectedExamId(targetExamId)

      if (targetExamId) {
        const reportResponse = await studentApi.getStudentReportCard(targetExamId)
        setReportCard(reportResponse?.data || null)
        if (String(queryExamId) !== String(targetExamId)) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.set('examId', targetExamId)
              return next
            },
            { replace: true }
          )
        }
      } else {
        setReportCard(null)
      }

      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      setError(err?.message || 'Unable to load report card.')
      setLoading(false)
      setRefreshing(false)
    }
  }, [queryExamId, selectedExamId, setSearchParams])

  useEffect(() => {
    loadReportCard().catch(() => {})
  }, [loadReportCard])

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const selectedExam = useMemo(
    () => publishedExams.find((exam) => String(exam.id) === String(selectedExamId)) || null,
    [publishedExams, selectedExamId]
  )

  const handleExamChange = async (event) => {
    const examId = event.target.value
    setSelectedExamId(examId)
    await loadReportCard({ forcedExamId: examId })
  }

  const handleRefresh = async () => {
    toastInfo('Refreshing report card')
    await loadReportCard({ silent: true, forcedExamId: selectedExamId })
  }

  const handleDownloadPDF = async () => {
    if (!selectedExamId) return
    setDownloading(true)
    try {
      const res = await studentApi.getStudentResultExport(selectedExamId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ReportCard_${selectedExam?.name || 'Result'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toastSuccess('Report card downloaded successfully.')
    } catch (err) {
      toastError('Failed to download report card PDF.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="report-card-page">
      {/* ── Action Bar ── */}
      <div className="report-card-action-bar student-report-no-print">
        <div className="report-card-action-bar__left">
          <div className="report-card-page-icon">
            <FileBarChart2 size={18} />
          </div>
          <div>
            <p className="report-card-page-label">Official View</p>
            <h1 className="report-card-page-title">Report Card</h1>
          </div>
        </div>
        <div className="report-card-action-bar__right">
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            loading={downloading}
            size="sm"
            style={{ backgroundColor: 'var(--student-accent)', color: '#fff', border: 'none' }}
          >
            Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Exam Selector ── */}
      <div className="report-card-selector-row student-report-no-print">
        <div className="report-card-select-wrapper">
          <label className="report-card-select-label" htmlFor="exam-select">
            Select Exam
          </label>
          <div className="report-card-select-field-wrapper">
            <select
              id="exam-select"
              value={selectedExamId}
              onChange={handleExamChange}
              className="report-card-select-field"
            >
              {publishedExams.length === 0 && (
                <option value="">No published exams available</option>
              )}
              {publishedExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <div className="report-card-select-icon">
              <ChevronDown size={15} />
            </div>
          </div>
        </div>

        <div className="report-card-print-hint">
          <p className="report-card-print-hint__label">Print / PDF</p>
          <p className="report-card-print-hint__desc">
            Use browser print (<kbd>Ctrl+P</kbd>) to export as PDF.
          </p>
        </div>
      </div>

      {/* ── Report Card Content ── */}
      {loading ? (
        <ReportCardSkeleton />
      ) : reportCard ? (
        <div className="report-card-view-wrapper">
          <ReportCardView data={reportCard} examName={selectedExam?.name} />
        </div>
      ) : (
        <EmptyState
          icon={FileBarChart2}
          title="No published report card yet"
          description="Once at least one exam result is published, the official report card will appear here."
        />
      )}

      <style>{`
        /* ── Page Layout ── */
        .report-card-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .report-card-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .report-card-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .report-card-page-icon {
          display: flex;
          height: 38px;
          width: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background-color: rgba(124, 58, 237, 0.10);
          color: var(--student-accent);
          flex-shrink: 0;
        }

        .report-card-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .report-card-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        .report-card-action-bar__right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Exam Selector Row ── */
        .report-card-selector-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 18px 20px;
        }

        @media (min-width: 768px) {
          .report-card-selector-row {
            grid-template-columns: 1fr auto;
            align-items: end;
          }
        }

        .report-card-select-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .report-card-select-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .report-card-select-field-wrapper {
          position: relative;
        }

        .report-card-select-field {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background-color: var(--color-surface-raised);
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          padding: 10px 40px 10px 14px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .report-card-select-field:focus {
          border-color: var(--student-accent);
        }

        .report-card-select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .report-card-print-hint {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 10px 16px;
          white-space: nowrap;
        }

        .report-card-print-hint__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 4px;
        }

        .report-card-print-hint__desc {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .report-card-print-hint__desc kbd {
          display: inline-block;
          padding: 1px 5px;
          border-radius: 4px;
          background-color: var(--color-border);
          font-family: monospace;
          font-size: 11px;
          color: var(--color-text-primary);
        }

        /* ── Report Card View ── */
        .report-card-view-wrapper {
          padding: 0;
        }

        /* ── Skeleton ── */
        .report-card-skeleton-pulse {
          animation: rcPulse 1.6s ease-in-out infinite;
        }

        @keyframes rcPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}

const ReportCardSkeleton = () => (
  <div
    className="report-card-skeleton-pulse"
    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
  >
    <div
      className="student-report-no-print"
      style={{
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          height: '14px',
          width: '80px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-surface-raised)',
        }}
      />
      <div
        style={{
          height: '40px',
          width: '100%',
          borderRadius: '12px',
          backgroundColor: 'var(--color-surface-raised)',
          marginTop: '10px',
        }}
      />
    </div>
    <div
      style={{
        margin: '0 auto',
        width: '100%',
        maxWidth: '210mm',
        borderRadius: '20px',
        border: '1px solid #cbd5e1',
        backgroundColor: 'white',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(15,23,42,0.10)',
      }}
    >
      <div
        style={{
          height: '32px',
          width: '180px',
          borderRadius: '8px',
          backgroundColor: '#f1f5f9',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '24px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{ height: '64px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}
          />
        ))}
      </div>
      <div
        style={{
          height: '256px',
          borderRadius: '12px',
          backgroundColor: '#f1f5f9',
          marginTop: '24px',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginTop: '24px',
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{ height: '80px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}
          />
        ))}
      </div>
    </div>
  </div>
)

export default ReportCard
