import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, GraduationCap, RefreshCw, TrendingUp, CalendarDays, Hash, BookMarked, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import PerformanceTrend from '@/components/student/PerformanceTrend'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as studentApi from '@/api/studentApi'
import { formatDate, formatPercent } from '@/utils/helpers'

const AcademicHistory = () => {
  usePageTitle('Academic History')

  const { toastError, toastInfo } = useToast()
  const [history, setHistory] = useState([])
  const [timeline, setTimeline] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const load = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await studentApi.getStudentAcademicHistory()
      setHistory(res?.data?.history || [])
      setTimeline(res?.data?.timeline || [])
      setTrend(res?.data?.performance_trend || [])
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      setLoading(false)
      setRefreshing(false)
      toastError(err?.message || 'Unable to load academic history.')
    }
  }

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const handleRefresh = async () => {
    toastInfo('Refreshing academic history')
    await load({ silent: true })
  }

  return (
    <div className="ah-page">

      {/* ── Compact Action Bar ── */}
      <div className="ah-action-bar">
        <div className="ah-action-bar__left">
          <div className="ah-page-icon">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="ah-page-label">Academics</p>
            <h1 className="ah-page-title">Academic History</h1>
          </div>
        </div>
        <Button variant="secondary" onClick={handleRefresh} loading={refreshing} icon={RefreshCw} size="sm">
          Refresh
        </Button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="ah-skeleton">
          <div className="ah-skeleton__block ah-skeleton__block--tall" />
          <div className="ah-skeleton__row">
            <div className="ah-skeleton__block" />
            <div className="ah-skeleton__block" />
          </div>
        </div>
      ) : history.length ? (
        <>
          {/* ── Session History Table ── */}
          <div className="ah-table-card">
            <div className="ah-section-header">
              <div className="ah-section-icon">
                <GraduationCap size={15} />
              </div>
              <div>
                <p className="ah-section-title">Session History</p>
                <p className="ah-section-desc">Click any row to expand details</p>
              </div>
            </div>

            <div className="ah-table-wrap">
              <table className="ah-table">
                <thead>
                  <tr>
                    {['Session', 'Class', 'Section', 'Roll No', 'Result', 'Attendance', 'Status', ''].map((head) => (
                      <th key={head} className="ah-table__th">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const expanded = expandedRow === row.enrollment_id
                    return (
                      <>
                        <tr
                          key={row.enrollment_id}
                          className="ah-table__row ah-table__row--clickable"
                          style={{ backgroundColor: expanded ? 'var(--color-surface-raised)' : 'transparent' }}
                          onClick={() => setExpandedRow(expanded ? null : row.enrollment_id)}
                        >
                          <td className="ah-table__td ah-table__td--primary">{row.session_name}</td>
                          <td className="ah-table__td">{row.class_name}</td>
                          <td className="ah-table__td">{row.section_name}</td>
                          <td className="ah-table__td">{row.roll_number || '—'}</td>
                          <td className="ah-table__td">
                            <span className="ah-result-badge" style={resultStyle(row.result)}>
                              {String(row.result || '—').toUpperCase()}
                            </span>
                          </td>
                          <td className="ah-table__td ah-table__td--bold" style={{ color: getAttendanceTone(row.attendance_percentage) }}>
                            {formatPercent(row.attendance_percentage || 0, 0)}
                          </td>
                          <td className="ah-table__td">
                            <span className="ah-status-text">{row.enrollment_status || '—'}</span>
                          </td>
                          <td className="ah-table__td ah-table__td--chevron">
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </td>
                        </tr>

                        {expanded && (
                          <tr className="ah-table__expand-row">
                            <td colSpan={8} className="ah-table__expand-td">
                              <div className="ah-expand-grid">
                                <DetailCell icon={<CalendarDays size={13} />} label="Joined" value={formatDate(row.joined_date, 'long')} />
                                <DetailCell icon={<CalendarDays size={13} />} label="Left" value={row.left_date ? formatDate(row.left_date, 'long') : 'Active / Not recorded'} />
                                <DetailCell icon={<TrendingUp size={13} />} label="Percentage" value={formatPercent(row.percentage || 0, 0)} />
                                <DetailCell icon={<CheckCircle size={13} />} label="Promotion" value={row.is_promoted ? '✓ Promoted' : 'Not marked'} tone={row.is_promoted ? '#16a34a' : undefined} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Timeline + Trend ── */}
          <div className="ah-bottom-grid">

            {/* Visual Timeline */}
            <div className="ah-card">
              <div className="ah-section-header">
                <div className="ah-section-icon">
                  <BookMarked size={15} />
                </div>
                <div>
                  <p className="ah-section-title">Visual Timeline</p>
                  <p className="ah-section-desc">Class-by-class progression</p>
                </div>
              </div>

              <div className="ah-timeline">
                {timeline.map((item, index) => {
                  const style = resultStyle(item.result)
                  return (
                    <div key={`${item.session_name}-${index}`} className="ah-timeline-item">
                      {/* Rail */}
                      <div className="ah-timeline-rail">
                        <div className="ah-timeline-dot" style={{ borderColor: style.color, backgroundColor: style.color }}>
                          {index + 1}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="ah-timeline-line" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="ah-timeline-content">
                        <p className="ah-timeline-session">{item.session_name}</p>
                        <p className="ah-timeline-class">{item.class_name} {item.section_name}</p>
                        <div className="ah-timeline-badges">
                          <span className="ah-timeline-badge" style={resultStyle(item.result)}>
                            {String(item.result || '—').toUpperCase()}
                          </span>
                          <span className="ah-timeline-badge" style={{ backgroundColor: 'rgba(37,99,235,0.10)', color: '#2563eb' }}>
                            {formatPercent(item.attendance_percentage || 0, 0)} att.
                          </span>
                          <span className="ah-timeline-badge" style={{ backgroundColor: 'rgba(22,163,74,0.10)', color: '#15803d' }}>
                            {item.promoted ? '✓ Promoted' : 'In record'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Performance Trend */}
            <div className="ah-card">
              <div className="ah-section-header">
                <div className="ah-section-icon ah-section-icon--blue">
                  <TrendingUp size={15} />
                </div>
                <div>
                  <p className="ah-section-title">Performance Trend</p>
                  <p className="ah-section-desc">Session-wise percentage across your record</p>
                </div>
              </div>
              <PerformanceTrend data={trend} />
            </div>

          </div>
        </>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No academic history found"
          description="Once session records are available, your academic journey will appear here."
        />
      )}

      <style>{`
        /* ── Page ── */
        .ah-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .ah-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ah-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ah-page-icon {
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

        .ah-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .ah-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        /* ── Skeleton ── */
        .ah-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: ahPulse 1.6s ease-in-out infinite;
        }

        .ah-skeleton__block {
          height: 120px;
          border-radius: 18px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          flex: 1;
        }

        .ah-skeleton__block--tall {
          height: 220px;
        }

        .ah-skeleton__row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @keyframes ahPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* ── Section header (shared) ── */
        .ah-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-surface-raised);
        }

        .ah-section-icon {
          display: flex;
          height: 30px;
          width: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background-color: rgba(124, 58, 237, 0.10);
          color: var(--student-accent);
          flex-shrink: 0;
        }

        .ah-section-icon--blue {
          background-color: rgba(37, 99, 235, 0.10);
          color: #2563eb;
        }

        .ah-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .ah-section-desc {
          font-size: 11px;
          color: var(--color-text-muted);
          margin: 2px 0 0;
        }

        /* ── Table Card ── */
        .ah-table-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 18px;
          overflow: hidden;
        }

        .ah-table-wrap {
          overflow-x: auto;
        }

        .ah-table {
          width: 100%;
          min-width: 640px;
          border-collapse: collapse;
        }

        .ah-table thead {
          background-color: var(--color-surface-raised);
        }

        .ah-table__th {
          padding: 10px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          white-space: nowrap;
        }

        .ah-table__row {
          border-top: 1px solid var(--color-border);
          transition: background-color 0.12s ease;
        }

        .ah-table__row--clickable {
          cursor: pointer;
        }

        .ah-table__row--clickable:hover {
          background-color: var(--color-surface-raised) !important;
        }

        .ah-table__td {
          padding: 12px 16px;
          font-size: 13px;
          color: var(--color-text-secondary);
          vertical-align: middle;
        }

        .ah-table__td--primary {
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .ah-table__td--bold {
          font-weight: 700;
        }

        .ah-table__td--chevron {
          color: var(--color-text-muted);
          width: 32px;
        }

        .ah-result-badge {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.10em;
        }

        .ah-status-text {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: var(--color-text-muted);
        }

        /* ── Expand Row ── */
        .ah-table__expand-row {
          background-color: var(--color-surface-raised);
          border-top: 1px solid var(--color-border);
        }

        .ah-table__expand-td {
          padding: 12px 16px 16px;
        }

        .ah-expand-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 768px) {
          .ah-expand-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* ── Detail Cell ── */
        .ah-detail-cell {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 11px 13px;
        }

        .ah-detail-cell__header {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 5px;
          color: var(--color-text-muted);
        }

        .ah-detail-cell__label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .ah-detail-cell__value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        /* ── Bottom Grid ── */
        .ah-bottom-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 1280px) {
          .ah-bottom-grid {
            grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
          }
        }

        /* ── Section Card ── */
        .ah-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 18px;
          overflow: hidden;
        }

        /* ── Timeline ── */
        .ah-timeline {
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .ah-timeline-item {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .ah-timeline-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 28px;
          flex-shrink: 0;
        }

        .ah-timeline-dot {
          height: 28px;
          width: 28px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
          z-index: 1;
        }

        .ah-timeline-line {
          width: 2px;
          flex: 1;
          min-height: 14px;
          background-color: var(--color-border);
          margin-top: 0;
        }

        .ah-timeline-content {
          flex: 1;
          padding-bottom: 14px;
          min-width: 0;
        }

        .ah-timeline-session {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 2px;
        }

        .ah-timeline-class {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin: 0 0 8px;
        }

        .ah-timeline-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .ah-timeline-badge {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

const DetailCell = ({ icon, label, value, tone }) => (
  <div className="ah-detail-cell">
    <div className="ah-detail-cell__header">
      {icon}
      <span className="ah-detail-cell__label">{label}</span>
    </div>
    <p className="ah-detail-cell__value" style={tone ? { color: tone } : {}}>
      {value || '—'}
    </p>
  </div>
)

/* ── Helpers ── */

function resultStyle(result) {
  if (result === 'pass')        return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (result === 'compartment') return { backgroundColor: '#fef3c7', color: '#b45309' }
  if (result === 'fail')        return { backgroundColor: '#fee2e2', color: '#dc2626' }
  return { backgroundColor: '#e5e7eb', color: '#4b5563' }
}

function getAttendanceTone(percentage) {
  const value = Number(percentage || 0)
  if (value >= 85) return '#16a34a'
  if (value >= 75) return '#d97706'
  return '#ef4444'
}

export default AcademicHistory
