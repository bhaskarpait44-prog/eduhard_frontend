import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  FileBarChart2,
  RefreshCw,
  Trophy,
  TrendingUp,
  BookOpen,
  Star,
  AlertTriangle,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import ResultTable from '@/components/student/ResultTable'
import WhatIfAnalysis from '@/components/student/WhatIfAnalysis'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentResults from '@/hooks/useStudentResults'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatDate, formatPercent } from '@/utils/helpers'

const MyResults = () => {
  usePageTitle('My Results')

  const navigate = useNavigate()
  const { toastError, toastInfo } = useToast()
  const {
    exams,
    selectedExamId,
    selectedExam,
    result,
    isWithheld,
    totalPending,
    loading,
    detailLoading,
    refreshing,
    error,
    selectExam,
    refresh,
  } = useStudentResults()

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const summary = result?.summary || null
  const subjects = result?.subjects || []
  const analysis = result?.analysis || null
  const compartment = result?.compartment || null

  const handleRefresh = async () => {
    toastInfo('Refreshing results')
    try {
      await refresh()
    } catch {
      // silently ignore refresh errors
    }
  }

  return (
    <div className="results-page">
      {/* ── Top Action Bar ── */}
      <div className="results-action-bar">
        <div className="results-action-bar__left">
          <div className="results-page-icon">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="results-page-label">Academic</p>
            <h1 className="results-page-title">My Results</h1>
          </div>
        </div>
        <div className="results-action-bar__right">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={refreshing}
            icon={RefreshCw}
            size="sm"
          >
            Refresh
          </Button>
          <Button
            onClick={() =>
              navigate(
                selectedExamId
                  ? `${ROUTES.STUDENT_REPORT_CARD}?examId=${selectedExamId}`
                  : ROUTES.STUDENT_REPORT_CARD
              )
            }
            icon={FileBarChart2}
            size="sm"
            disabled={!selectedExamId || isWithheld}
          >
            Report Card
          </Button>
        </div>
      </div>

      {/* ── Withheld Banner ── */}
      {isWithheld && (
        <div
          className="results-withheld-banner animate-in fade-in slide-in-from-top-2 duration-400"
          style={{
            borderColor: totalPending > 0 ? '#fca5a5' : '#fcd34d',
            backgroundColor: totalPending > 0 ? '#fff1f2' : '#fffbeb',
          }}
        >
          <div
            className="results-withheld-banner__icon"
            style={{
              backgroundColor: totalPending > 0 ? '#fee2e2' : '#fef3c7',
              color: totalPending > 0 ? '#dc2626' : '#d97706',
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <div className="results-withheld-banner__body">
            <p
              className="results-withheld-banner__title"
              style={{ color: totalPending > 0 ? '#991b1b' : '#92400e' }}
            >
              {totalPending > 0 ? 'Result Withheld — Pending Dues' : 'Result Awaiting Release'}
            </p>
            <p
              className="results-withheld-banner__desc"
              style={{ color: totalPending > 0 ? '#b91c1c' : '#a16207' }}
            >
              {totalPending > 0 ? (
                <>
                  Your result is withheld due to a pending balance of{' '}
                  <strong>₹{totalPending}</strong>. Clear your dues in the Fees section to unlock
                  your marks.
                </>
              ) : (
                'Your final results have not been officially released yet. Please check back later.'
              )}
            </p>
            {totalPending > 0 && (
              <button
                type="button"
                className="results-withheld-banner__link"
                onClick={() => navigate(ROUTES.STUDENT_FEES)}
              >
                Go to Fees <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Exam Selector ── */}
      <div className="results-exam-selector">
        <div className="results-exam-selector__header">
          <p className="results-exam-selector__label">Select Exam</p>
          {!loading && exams.length > 0 && (
            <span className="results-exam-selector__count">{exams.length} exams</span>
          )}
        </div>

        {loading ? (
          <ExamTabsSkeleton />
        ) : exams.length > 0 ? (
          <div className="results-exam-tabs">
            {exams.map((exam) => {
              const active = Number(selectedExamId) === Number(exam.id)
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => selectExam(exam.id)}
                  className={`results-exam-tab ${active ? 'results-exam-tab--active' : ''}`}
                >
                  <div className="results-exam-tab__top">
                    <span className="results-exam-tab__name">{exam.name}</span>
                    <span
                      className="results-exam-tab__badge"
                      style={examStatusStyle(exam.student_status)}
                    >
                      {exam.student_status}
                    </span>
                  </div>
                  <p className="results-exam-tab__date">{formatDate(exam.start_date, 'short')}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No exams available yet"
            description="Your school has not published or scheduled any exams for the current session."
          />
        )}
      </div>

      {/* ── Result Content ── */}
      {loading ? (
        <ResultsPageSkeleton />
      ) : !selectedExam ? (
        <EmptyState
          icon={ClipboardList}
          title="No exam selected"
          description="Choose an exam above to open the result view."
        />
      ) : selectedExam.student_status !== 'published' ? (
        <AwaitingExamPanel exam={selectedExam} />
      ) : detailLoading && !result ? (
        <ResultsPageSkeleton compact />
      ) : (
        <>
          {/* ── Summary Stats ── */}
          <div className="results-summary-grid">
            <div className="results-summary-header">
              <div>
                <h2 className="results-summary-exam-name">
                  {result?.exam?.name || selectedExam.name}
                </h2>
                <p className="results-summary-exam-date">
                  {formatDate(result?.exam?.start_date || selectedExam.start_date, 'long')}
                </p>
                {result?.summary?.class_rank && (
                  <p className="results-summary-rank">
                    🏅 Rank {result.summary.class_rank} of {result.summary.class_strength}
                  </p>
                )}
              </div>
              <span
                className="results-summary-status-badge"
                style={resultBadgeStyle(summary?.result_status)}
              >
                {summary?.result_status || 'awaiting'}
              </span>
            </div>

            <div className="results-metrics-row">
              <MetricCard
                label="Overall"
                value={formatPercent(summary?.percentage || 0, 0)}
                color="var(--student-accent)"
                icon={<TrendingUp size={16} />}
              />
              <MetricCard
                label="Grade"
                value={summary?.grade || '--'}
                color={gradeTone(summary?.grade)}
                icon={<Star size={16} />}
              />
              <MetricCard
                label="Status"
                value={String(summary?.result_status || '--').toUpperCase()}
                color={resultTone(summary?.result_status)}
                icon={<Trophy size={16} />}
              />
              <MetricCard
                label="Subjects"
                value={subjects.length}
                color="#2563eb"
                icon={<BookOpen size={16} />}
              />
            </div>
          </div>

          {/* ── Subject Marks Table ── */}
          <div className="results-section-card">
            <div className="results-section-card__header">
              <div>
                <h2 className="results-section-card__title">Subject Wise Marks</h2>
                <p className="results-section-card__desc">
                  Theory, practical, and combined subjects in one view.
                </p>
              </div>
              {!isWithheld && (
                <button
                  type="button"
                  className="results-open-report-btn"
                  onClick={() =>
                    navigate(`${ROUTES.STUDENT_REPORT_CARD}?examId=${selectedExamId}`)
                  }
                >
                  Open Report Card <ArrowRight size={13} />
                </button>
              )}
            </div>
            <ResultTable subjects={subjects} />
          </div>

          {/* ── Analysis + Outlook ── */}
          <div className="results-bottom-grid">
            {/* Result Analysis */}
            <div className="results-section-card">
              <div className="results-section-card__header results-section-card__header--icon">
                <div className="results-section-icon results-section-icon--green">
                  <Trophy size={16} />
                </div>
                <div>
                  <h2 className="results-section-card__title">Result Analysis</h2>
                  <p className="results-section-card__desc">
                    Strengths and areas that need attention.
                  </p>
                </div>
              </div>

              <div className="results-analysis-blocks">
                <AnalysisBlock
                  title="Strengths"
                  items={analysis?.strengths || []}
                  emptyText="No A or A+ subjects in this exam."
                  tone="#16a34a"
                />
                <AnalysisBlock
                  title="Needs Improvement"
                  items={analysis?.needs_improvement || []}
                  emptyText="No D or F subjects in this exam."
                  tone="#ef4444"
                />
                {result?.analysis?.class_comparison && (
                  <div className="results-comparison-block">
                    <p className="results-comparison-block__label">Performance vs Class</p>
                    <p className="results-comparison-block__value">
                      {result.analysis.class_comparison}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="results-right-col">
              {compartment ? (
                <div className="results-compartment-card">
                  <div className="results-compartment-card__icon">
                    <CircleAlert size={16} />
                  </div>
                  <div>
                    <h2 className="results-compartment-card__title">Compartment Notice</h2>
                    <p className="results-compartment-card__desc">
                      You must pass these subjects to progress.
                    </p>
                    <div className="results-compartment-card__tags">
                      {(compartment.subjects || []).map((subject) => (
                        <span key={subject} className="results-compartment-card__tag">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="results-section-card">
                  <h2 className="results-section-card__title">Promotion Outlook</h2>
                  <p className="results-section-card__desc" style={{ marginTop: '8px' }}>
                    {summary?.result_status === 'pass'
                      ? 'Passing state — keep this momentum through the session.'
                      : 'Recovery needed — review red subjects and speak with your teacher.'}
                  </p>
                  <div className="results-outlook-badge">
                    <p className="results-outlook-badge__label">Current Result</p>
                    <p
                      className="results-outlook-badge__value"
                      style={{ color: resultTone(summary?.result_status) }}
                    >
                      {String(summary?.result_status || 'AWAITING').toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              {subjects.length > 0 && (
                <WhatIfAnalysis
                  subjects={subjects}
                  initialPercentage={summary?.percentage || 0}
                  initialGrade={summary?.grade || 'F'}
                />
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        /* ── Page Container ── */
        .results-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .results-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .results-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .results-page-icon {
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

        .results-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .results-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        .results-action-bar__right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Withheld Banner ── */
        .results-withheld-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid;
        }

        .results-withheld-banner__icon {
          display: flex;
          height: 32px;
          width: 32px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .results-withheld-banner__body {
          flex: 1;
          min-width: 0;
        }

        .results-withheld-banner__title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .results-withheld-banner__desc {
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        .results-withheld-banner__link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          color: #dc2626;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── Exam Selector ── */
        .results-exam-selector {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 18px 20px;
        }

        .results-exam-selector__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .results-exam-selector__label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
        }

        .results-exam-selector__count {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
          background-color: var(--color-surface-raised);
          padding: 2px 10px;
          border-radius: 99px;
        }

        .results-exam-tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }

        .results-exam-tab {
          flex-shrink: 0;
          min-width: 160px;
          border-radius: 14px;
          border: 1.5px solid var(--color-border);
          padding: 12px 14px;
          text-align: left;
          background-color: var(--color-surface);
          cursor: pointer;
          transition: all 0.18s ease;
          outline: none;
        }

        .results-exam-tab:hover {
          border-color: rgba(124, 58, 237, 0.35);
          background-color: rgba(124, 58, 237, 0.04);
          transform: translateY(-1px);
        }

        .results-exam-tab--active {
          border-color: var(--student-accent) !important;
          background-color: rgba(124, 58, 237, 0.08) !important;
          box-shadow: 0 4px 16px rgba(109, 40, 217, 0.10);
        }

        .results-exam-tab__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 6px;
        }

        .results-exam-tab__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.3;
        }

        .results-exam-tab__badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .results-exam-tab__date {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin: 6px 0 0 0;
        }

        /* ── Summary Section ── */
        .results-summary-grid {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px;
        }

        .results-summary-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .results-summary-exam-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .results-summary-exam-date {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 4px 0 0 0;
        }

        .results-summary-rank {
          font-size: 12px;
          font-weight: 600;
          color: var(--student-accent);
          margin: 4px 0 0 0;
        }

        .results-summary-status-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
          white-space: nowrap;
          align-self: flex-start;
        }

        .results-metrics-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 640px) {
          .results-metrics-row {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* ── Metric Card ── */
        .results-metric-card {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .results-metric-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .results-metric-card__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .results-metric-card__icon {
          display: flex;
          height: 26px;
          width: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          opacity: 0.85;
        }

        .results-metric-card__value {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0;
        }

        /* ── Section Card ── */
        .results-section-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px;
        }

        .results-section-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .results-section-card__header--icon {
          gap: 12px;
          align-items: flex-start;
        }

        .results-section-icon {
          display: flex;
          height: 34px;
          width: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .results-section-icon--green {
          background-color: rgba(22, 163, 74, 0.10);
          color: #16a34a;
        }

        .results-section-card__title {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .results-section-card__desc {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 4px 0 0 0;
          line-height: 1.5;
        }

        /* ── Open Report Card Button ── */
        .results-open-report-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          border-radius: 99px;
          border: none;
          background-color: rgba(124, 58, 237, 0.10);
          color: var(--student-accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .results-open-report-btn:hover {
          background-color: rgba(124, 58, 237, 0.18);
        }

        /* ── Bottom Grid ── */
        .results-bottom-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 1280px) {
          .results-bottom-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .results-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Analysis Blocks ── */
        .results-analysis-blocks {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .results-analysis-block {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .results-analysis-block__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 8px;
        }

        .results-analysis-block__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .results-analysis-block__tag {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 99px;
        }

        .results-analysis-block__empty {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .results-comparison-block {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .results-comparison-block__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 6px;
        }

        .results-comparison-block__value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        /* ── Compartment Card ── */
        .results-compartment-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: rgba(245, 158, 11, 0.08);
          border: 1px solid #fcd34d;
          border-radius: 20px;
          padding: 18px 20px;
        }

        .results-compartment-card__icon {
          display: flex;
          height: 34px;
          width: 34px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background-color: rgba(245, 158, 11, 0.15);
          color: #b45309;
          flex-shrink: 0;
        }

        .results-compartment-card__title {
          font-size: 15px;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 4px;
        }

        .results-compartment-card__desc {
          font-size: 12px;
          color: #a16207;
          margin: 0 0 10px;
        }

        .results-compartment-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .results-compartment-card__tag {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 99px;
          background-color: rgba(255, 255, 255, 0.65);
          color: #92400e;
        }

        /* ── Outlook Badge ── */
        .results-outlook-badge {
          margin-top: 14px;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 12px 16px;
        }

        .results-outlook-badge__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 4px;
        }

        .results-outlook-badge__value {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        /* ── Awaiting Panel ── */
        .results-awaiting-panel {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px;
        }

        .results-awaiting-panel__icon {
          display: flex;
          height: 38px;
          width: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background-color: rgba(100, 116, 139, 0.10);
          color: #64748b;
          flex-shrink: 0;
        }

        .results-awaiting-panel__title {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 6px;
        }

        .results-awaiting-panel__desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 10px;
          line-height: 1.5;
        }

        /* ── Skeletons ── */
        .results-skeleton-pulse {
          animation: pulse 1.6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

const MetricCard = ({ label, value, color, icon }) => (
  <div className="results-metric-card">
    <div className="results-metric-card__header">
      <p className="results-metric-card__label">{label}</p>
      <div className="results-metric-card__icon" style={{ backgroundColor: `${color}18`, color }}>
        {icon}
      </div>
    </div>
    <p className="results-metric-card__value" style={{ color }}>
      {value}
    </p>
  </div>
)

const AnalysisBlock = ({ title, items, emptyText, tone }) => (
  <div className="results-analysis-block">
    <p className="results-analysis-block__label">{title}</p>
    {items.length ? (
      <div className="results-analysis-block__tags">
        {items.map((item) => (
          <span
            key={item}
            className="results-analysis-block__tag"
            style={{ backgroundColor: `${tone}16`, color: tone }}
          >
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="results-analysis-block__empty">{emptyText}</p>
    )}
  </div>
)

const AwaitingExamPanel = ({ exam }) => (
  <div className="results-awaiting-panel">
    <div className="results-awaiting-panel__icon">
      <ClipboardList size={18} />
    </div>
    <div>
      <p className="results-awaiting-panel__title">{exam.name}</p>
      <p className="results-awaiting-panel__desc">
        {exam.student_status === 'upcoming' || !exam.student_status
          ? `Scheduled for ${formatDate(exam.start_date, 'long')}. Results will appear after the exam is complete and results are published by the administrator.`
          : 'This exam has been conducted. Results will appear here once the administrator publishes them in the Results section.'}
      </p>
      <span className="results-exam-tab__badge" style={examStatusStyle(exam.student_status)}>
        {exam.student_status}
      </span>
    </div>
  </div>
)

const ExamTabsSkeleton = () => (
  <div className="results-exam-tabs results-skeleton-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        style={{
          minWidth: '160px',
          height: '72px',
          borderRadius: '14px',
          backgroundColor: 'var(--color-surface-raised)',
          flexShrink: 0,
        }}
      />
    ))}
  </div>
)

const ResultsPageSkeleton = ({ compact = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="results-skeleton-pulse">
    <div
      style={{
        borderRadius: '20px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '20px',
      }}
    >
      <div style={{ height: '20px', width: '160px', borderRadius: '8px', backgroundColor: 'var(--color-surface-raised)' }} />
      <div style={{ height: '14px', width: '120px', borderRadius: '6px', backgroundColor: 'var(--color-surface-raised)', marginTop: '10px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: '72px', borderRadius: '14px', backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    </div>
    <div
      style={{
        borderRadius: '20px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '20px',
      }}
    >
      <div style={{ height: '18px', width: '140px', borderRadius: '8px', backgroundColor: 'var(--color-surface-raised)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
          <div key={i} style={{ height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    </div>
  </div>
)

function examStatusStyle(status) {
  if (status === 'published') return { backgroundColor: '#fef3c7', color: '#b45309' } // scheduled, not yet released
  if (status === 'awaiting')  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
  return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
}

function resultBadgeStyle(status) {
  if (status === 'pass') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (status === 'compartment') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (status === 'fail') return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
}

function resultTone(status) {
  if (status === 'pass') return '#16a34a'
  if (status === 'compartment') return '#d97706'
  if (status === 'fail') return '#ef4444'
  return '#64748b'
}

function gradeTone(grade) {
  if (grade === 'A+') return '#14532d'
  if (grade === 'A')  return '#15803d'
  if (grade === 'B+') return '#6d28d9'
  if (grade === 'B')  return '#0f766e'
  if (grade === 'C')  return '#1d4ed8'
  if (grade === 'D')  return '#b45309'
  return '#dc2626'
}

export default MyResults
