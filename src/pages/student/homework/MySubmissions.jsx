import { useEffect, useMemo, useState } from 'react'
import { BookCheck, RefreshCw, ChevronDown, SlidersHorizontal } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentHomework from '@/hooks/useStudentHomework'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const MySubmissions = () => {
  usePageTitle('My Submissions')

  const { toastError, toastInfo } = useToast()
  const { submissions, loading, refreshing, error, refresh } = useStudentHomework()
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const subjects = useMemo(
    () => [...new Map(submissions.map((item) => [item.subject_name, item.subject_name])).values()],
    [submissions]
  )

  const filtered = useMemo(() => submissions
    .filter((item) => statusFilter === 'all' || item.status === statusFilter)
    .filter((item) => subjectFilter === 'all' || item.subject_name === subjectFilter),
  [statusFilter, subjectFilter, submissions])

  return (
    <div className="sub-page">

      {/* ── Compact Action Bar ── */}
      <div className="sub-action-bar">
        <div className="sub-action-bar__left">
          <div className="sub-page-icon">
            <BookCheck size={18} />
          </div>
          <div>
            <p className="sub-page-label">Academics</p>
            <h1 className="sub-page-title">My Submissions</h1>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            toastInfo('Refreshing submissions')
            await refresh()
          }}
          loading={refreshing}
          icon={RefreshCw}
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="sub-toolbar">
        <div className="sub-toolbar__label">
          <SlidersHorizontal size={13} />
          Filter submissions
        </div>
        <div className="sub-toolbar__filters">
          <div className="sub-select-wrap">
            <label className="sub-select-label" htmlFor="sub-subject-filter">Subject</label>
            <div className="sub-select-field-wrap">
              <select
                id="sub-subject-filter"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="sub-select-field"
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <div className="sub-select-icon"><ChevronDown size={14} /></div>
            </div>
          </div>

          <div className="sub-select-wrap">
            <label className="sub-select-label" htmlFor="sub-status-filter">Status</label>
            <div className="sub-select-field-wrap">
              <select
                id="sub-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="sub-select-field"
              >
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
              <div className="sub-select-icon"><ChevronDown size={14} /></div>
            </div>
          </div>

          {!loading && (
            <div className="sub-count-chip">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Submissions Table ── */}
      {loading ? (
        <div className="sub-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sub-skeleton__row" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="sub-table-card">
          <div className="sub-table-wrap">
            <table className="sub-table">
              <thead>
                <tr>
                  {['Subject', 'Title', 'Due Date', 'Submitted', 'Status', 'Marks'].map((head) => (
                    <th key={head} className="sub-table__th">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="sub-table__row">
                    <td className="sub-table__td sub-table__td--primary">{row.subject_name}</td>
                    <td className="sub-table__td">{row.title}</td>
                    <td className="sub-table__td sub-table__td--mono">{formatDate(row.due_date, 'short')}</td>
                    <td className="sub-table__td sub-table__td--mono">
                      {row.submitted_at ? formatDate(row.submitted_at, 'short') : '--'}
                    </td>
                    <td className="sub-table__td">
                      <span className="sub-status-badge" style={statusStyle(row.status)}>
                        {row.status}
                      </span>
                    </td>
                    <td className="sub-table__td sub-table__td--marks">
                      {row.marks_obtained ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BookCheck}
          title="No submissions yet"
          description="Once you submit homework online, it will appear here."
        />
      )}

      <style>{`
        /* ── Page ── */
        .sub-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Action Bar ── */
        .sub-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sub-action-bar__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sub-page-icon {
          display: flex;
          height: 38px;
          width: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background-color: rgba(22, 163, 74, 0.10);
          color: #16a34a;
          flex-shrink: 0;
        }

        .sub-page-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1;
        }

        .sub-page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 2px 0 0 0;
          line-height: 1.2;
        }

        /* ── Toolbar ── */
        .sub-toolbar {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sub-toolbar__label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .sub-toolbar__filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 10px;
        }

        /* ── Custom Select ── */
        .sub-select-wrap {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 150px;
          flex: 1;
        }

        .sub-select-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .sub-select-field-wrap {
          position: relative;
        }

        .sub-select-field {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background-color: var(--color-surface-raised);
          border: 1.5px solid var(--color-border);
          border-radius: 11px;
          padding: 9px 36px 9px 13px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .sub-select-field:focus {
          border-color: #16a34a;
        }

        .sub-select-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .sub-count-chip {
          display: inline-flex;
          align-items: center;
          padding: 7px 14px;
          border-radius: 10px;
          background-color: rgba(22, 163, 74, 0.08);
          color: #16a34a;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          align-self: flex-end;
        }

        /* ── Skeleton ── */
        .sub-skeleton {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: subPulse 1.6s ease-in-out infinite;
        }

        .sub-skeleton__row {
          height: 52px;
          border-radius: 14px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
        }

        @keyframes subPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* ── Table ── */
        .sub-table-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          overflow: hidden;
        }

        .sub-table-wrap {
          overflow-x: auto;
        }

        .sub-table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
          font-size: 13px;
        }

        .sub-table thead {
          background-color: var(--color-surface-raised);
        }

        .sub-table__th {
          padding: 11px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        .sub-table__row {
          border-top: 1px solid var(--color-border);
          transition: background-color 0.12s ease;
        }

        .sub-table__row:hover {
          background-color: var(--color-surface-raised);
        }

        .sub-table__td {
          padding: 12px 16px;
          color: var(--color-text-secondary);
          vertical-align: middle;
        }

        .sub-table__td--primary {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .sub-table__td--mono {
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }

        .sub-table__td--marks {
          font-weight: 700;
          color: var(--color-text-primary);
          font-size: 14px;
        }

        /* ── Status Badge ── */
        .sub-status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  )
}

function statusStyle(status) {
  if (status === 'graded') return { backgroundColor: '#dcfce7', color: '#15803d' }
  return { backgroundColor: '#dbeafe', color: '#1d4ed8' }
}

export default MySubmissions
