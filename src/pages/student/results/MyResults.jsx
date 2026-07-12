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
  Medal,
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
      {/* ── Page Header ── */}
      <div className="results-header">
        <div>
          <h1 className="results-header__title">My Results</h1>
          <p className="results-header__subtitle">Exam performance and report cards</p>
        </div>
        <div className="results-header__actions">
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
          className={`results-banner ${
            totalPending > 0 ? 'results-banner--danger' : 'results-banner--warning'
          }`}
        >
          <AlertTriangle size={16} className="results-banner__icon" />
          <div className="results-banner__body">
            <p className="results-banner__title">
              {totalPending > 0 ? 'Result withheld — pending dues' : 'Result awaiting release'}
            </p>
            <p className="results-banner__desc">
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
                className="results-banner__link"
                onClick={() => navigate(ROUTES.STUDENT_FEES)}
              >
                Go to Fees <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Exam Selector ── */}
      <div className="results-card">
        <div className="results-card__header">
          <h2 className="results-card__title">Select Exam</h2>
          {!loading && exams.length > 0 && (
            <span className="results-count">{exams.length} exams</span>
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
                      className="results-badge"
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
          {/* ── Summary ── */}
          <div className="results-card">
            <div className="results-card__header">
              <div>
                <h2 className="results-summary-name">
                  {result?.exam?.name || selectedExam.name}
                </h2>
                <p className="results-summary-meta">
                  {formatDate(result?.exam?.start_date || selectedExam.start_date, 'long')}
                  {result?.summary?.class_rank && (
                    <span className="results-summary-rank">
                      <Medal size={13} />
                      Rank {result.summary.class_rank} of {result.summary.class_strength}
                    </span>
                  )}
                </p>
              </div>
              <span className="results-badge" style={resultBadgeStyle(summary?.result_status)}>
                {summary?.result_status || 'awaiting'}
              </span>
            </div>

            <div className="results-metrics">
              <MetricCard
                label="Overall"
                value={formatPercent(summary?.percentage || 0, 0)}
                icon={<TrendingUp size={15} />}
              />
              <MetricCard
                label="Grade"
                value={summary?.grade || '--'}
                color={gradeTone(summary?.grade)}
                icon={<Star size={15} />}
              />
              <MetricCard
                label="Status"
                value={String(summary?.result_status || '--').toUpperCase()}
                color={resultTone(summary?.result_status)}
                icon={<Trophy size={15} />}
              />
              <MetricCard
                label="Subjects"
                value={subjects.length}
                icon={<BookOpen size={15} />}
              />
            </div>
          </div>

          {/* ── Subject Marks Table ── */}
          <div className="results-card">
            <div className="results-card__header">
              <div>
                <h2 className="results-card__title">Subject Wise Marks</h2>
                <p className="results-card__desc">
                  Theory, practical, and combined subjects in one view.
                </p>
              </div>
              {!isWithheld && (
                <button
                  type="button"
                  className="results-link-btn"
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
            <div className="results-card">
              <div className="results-card__header">
                <div>
                  <h2 className="results-card__title">Result Analysis</h2>
                  <p className="results-card__desc">
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
                  tone="#dc2626"
                />
                {result?.analysis?.class_comparison && (
                  <div className="results-subcard">
                    <p className="results-subcard__label">Performance vs Class</p>
                    <p className="results-subcard__value">
                      {result.analysis.class_comparison}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="results-right-col">
              {compartment ? (
                <div className="results-card results-card--compartment">
                  <div className="results-compartment__head">
                    <CircleAlert size={16} />
                    <h2 className="results-card__title">Compartment Notice</h2>
                  </div>
                  <p className="results-card__desc">
                    You must pass these subjects to progress.
                  </p>
                  <div className="results-tag-row">
                    {(compartment.subjects || []).map((subject) => (
                      <span key={subject} className="results-compartment__tag">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="results-card">
                  <h2 className="results-card__title">Promotion Outlook</h2>
                  <p className="results-card__desc results-card__desc--spaced">
                    {summary?.result_status === 'pass'
                      ? 'Passing state — keep this momentum through the session.'
                      : 'Recovery needed — review red subjects and speak with your teacher.'}
                  </p>
                  <div className="results-subcard results-subcard--spaced">
                    <p className="results-subcard__label">Current Result</p>
                    <p
                      className="results-outlook-value"
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
        /* ── Page ── */
        .results-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Header ── */
        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .results-header__title {
          font-size: 20px;
          font-weight: 650;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .results-header__subtitle {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 2px 0 0;
        }

        .results-header__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Banner ── */
        .results-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid;
        }

        .results-banner--danger {
          border-color: #fecaca;
          background-color: #fef2f2;
          color: #991b1b;
        }

        .results-banner--warning {
          border-color: #fde68a;
          background-color: #fffbeb;
          color: #92400e;
        }

        .results-banner__icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .results-banner__body {
          flex: 1;
          min-width: 0;
        }

        .results-banner__title {
          font-size: 13px;
          font-weight: 650;
          margin: 0 0 2px;
        }

        .results-banner__desc {
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
          opacity: 0.9;
        }

        .results-banner__link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 650;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          color: inherit;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Card ── */
        .results-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 20px;
        }

        .results-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .results-card__title {
          font-size: 15px;
          font-weight: 650;
          color: var(--color-text-primary);
          margin: 0;
        }

        .results-card__desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 3px 0 0;
          line-height: 1.5;
        }

        .results-card__desc--spaced {
          margin-top: 8px;
        }

        .results-count {
          font-size: 12px;
          color: var(--color-text-secondary);
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          padding: 2px 10px;
          border-radius: 99px;
        }

        /* ── Badge ── */
        .results-badge {
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-start;
          line-height: 1.4;
        }

        /* ── Exam Tabs ── */
        .results-exam-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: thin;
        }

        .results-exam-tab {
          flex-shrink: 0;
          min-width: 160px;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          padding: 12px 14px;
          text-align: left;
          background-color: var(--color-surface);
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          outline: none;
        }

        .results-exam-tab:hover {
          border-color: var(--student-accent);
        }

        .results-exam-tab--active {
          border-color: var(--student-accent);
          background-color: var(--color-surface-raised);
          box-shadow: inset 0 0 0 1px var(--student-accent);
        }

        .results-exam-tab__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .results-exam-tab__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.3;
        }

        .results-exam-tab__date {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 6px 0 0;
        }

        /* ── Summary ── */
        .results-summary-name {
          font-size: 17px;
          font-weight: 650;
          color: var(--color-text-primary);
          margin: 0;
        }

        .results-summary-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 4px 0 0;
        }

        .results-summary-rank {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .results-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 640px) {
          .results-metrics {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* ── Metric Card ── */
        .results-metric {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 14px 16px;
        }

        .results-metric__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }

        .results-metric__label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .results-metric__icon {
          display: flex;
          color: var(--color-text-muted);
        }

        .results-metric__value {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.1;
          margin: 0;
          color: var(--color-text-primary);
        }

        /* ── Link Button ── */
        .results-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          color: var(--color-text-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .results-link-btn:hover {
          background-color: var(--color-surface-raised);
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

        /* ── Analysis ── */
        .results-analysis-blocks {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .results-subcard {
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 14px 16px;
        }

        .results-subcard--spaced {
          margin-top: 14px;
        }

        .results-subcard__label {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin: 0 0 6px;
        }

        .results-subcard__value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .results-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .results-analysis-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 99px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
        }

        .results-analysis-tag__dot {
          height: 6px;
          width: 6px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        .results-analysis-empty {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        /* ── Compartment ── */
        .results-card--compartment {
          border-color: #fde68a;
          background-color: #fffbeb;
        }

        .results-compartment__head {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b45309;
          margin-bottom: 4px;
        }

        .results-card--compartment .results-card__title {
          color: #92400e;
        }

        .results-card--compartment .results-card__desc {
          color: #a16207;
          margin-bottom: 12px;
        }

        .results-compartment__tag {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 99px;
          background-color: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        /* ── Outlook ── */
        .results-outlook-value {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        /* ── Awaiting Panel ── */
        .results-awaiting {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 20px;
        }

        .results-awaiting__icon {
          display: flex;
          height: 36px;
          width: 36px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background-color: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .results-awaiting__title {
          font-size: 15px;
          font-weight: 650;
          color: var(--color-text-primary);
          margin: 0 0 4px;
        }

        .results-awaiting__desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 10px;
          line-height: 1.5;
        }

        /* ── Skeletons ── */
        .results-skeleton-pulse {
          animation: results-pulse 1.6s ease-in-out infinite;
        }

        @keyframes results-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

const MetricCard = ({ label, value, color, icon }) => (
  <div className="results-metric">
    <div className="results-metric__header">
      <p className="results-metric__label">{label}</p>
      <div className="results-metric__icon">{icon}</div>
    </div>
    <p className="results-metric__value" style={color ? { color } : undefined}>
      {value}
    </p>
  </div>
)

const AnalysisBlock = ({ title, items, emptyText, tone }) => (
  <div className="results-subcard">
    <p className="results-subcard__label">{title}</p>
    {items.length ? (
      <div className="results-tag-row">
        {items.map((item) => (
          <span key={item} className="results-analysis-tag">
            <span className="results-analysis-tag__dot" style={{ backgroundColor: tone }} />
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="results-analysis-empty">{emptyText}</p>
    )}
  </div>
)

const AwaitingExamPanel = ({ exam }) => (
  <div className="results-awaiting">
    <div className="results-awaiting__icon">
      <ClipboardList size={18} />
    </div>
    <div>
      <p className="results-awaiting__title">{exam.name}</p>
      <p className="results-awaiting__desc">
        {exam.student_status === 'upcoming' || !exam.student_status
          ? `Scheduled for ${formatDate(exam.start_date, 'long')}. Results will appear after the exam is complete and results are published by the administrator.`
          : 'This exam has been conducted. Results will appear here once the administrator publishes them in the Results section.'}
      </p>
      <span className="results-badge" style={examStatusStyle(exam.student_status)}>
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
          height: '68px',
          borderRadius: '10px',
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
        borderRadius: '12px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '20px',
      }}
    >
      <div style={{ height: '20px', width: '160px', borderRadius: '8px', backgroundColor: 'var(--color-surface-raised)' }} />
      <div style={{ height: '14px', width: '120px', borderRadius: '6px', backgroundColor: 'var(--color-surface-raised)', marginTop: '10px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: '72px', borderRadius: '10px', backgroundColor: 'var(--color-surface-raised)' }} />
        ))}
      </div>
    </div>
    <div
      style={{
        borderRadius: '12px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '20px',
      }}
    >
      <div style={{ height: '18px', width: '140px', borderRadius: '8px', backgroundColor: 'var(--color-surface-raised)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
          <div key={i} style={{ height: '48px', borderRadius: '10px', backgroundColor: 'var(--color-surface-raised)' }} />
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
