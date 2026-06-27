import { BookOpenText, CalendarClock, CheckCheck, Clock3, MessageSquareMore, Pencil, Send, XCircle, ChevronRight, User2, AlertCircle, CheckCircle2, Clock, Star, Layers } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate } from '@/utils/helpers'

const TEACHER_STATUS_META = {
  active: { label: 'Active', variant: 'green' },
  overdue: { label: 'Overdue', variant: 'red' },
  completed: { label: 'Completed', variant: 'grey' },
  cancelled: { label: 'Cancelled', variant: 'dark' },
}

const HomeworkCard = ({
  item,
  // Student props
  onOpen,
  // Teacher props
  onEdit,
  onViewSubmissions,
  onRemind,
  onDelete,
  isTeacher = false,
}) => {
  if (isTeacher) {
    const status = TEACHER_STATUS_META[item.workflow_status] || TEACHER_STATUS_META.active
    return (
      <article
        className="rounded-[24px] border p-4 sm:p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="blue">{item.class_name} {item.section_name}</Badge>
              <Badge variant="yellow">{item.subject_name}</Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {item.title}
            </h3>
            <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {item.description}
            </p>
          </div>

          <div className="rounded-2xl px-4 py-3 sm:min-w-48" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              Due Date
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {formatDate(item.due_date, 'long')}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {item.submission_type} submission
              {item.max_marks != null ? ` | ${Number(item.max_marks)} marks` : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat icon={CheckCheck} label="Submitted" value={`${item.submitted_count}/${item.student_count}`} tone="#10b981" />
          <MiniStat icon={Clock3} label="Pending" value={String(item.pending_count || 0)} tone="#f59e0b" />
          <MiniStat icon={BookOpenText} label="Graded" value={String(item.graded_count || 0)} tone="#0f766e" />
          <MiniStat icon={CalendarClock} label="Late" value={String(item.late_count || 0)} tone="#ef4444" />
        </div>

        <div className="mt-4 flex flex-col gap-2 lg:flex-row">
          <Button variant="primary" fullWidth onClick={() => onViewSubmissions(item)} icon={MessageSquareMore}>
            View Submissions
          </Button>
          <Button variant="secondary" fullWidth onClick={() => onEdit(item)} icon={Pencil}>
            Edit
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => onRemind(item)}
            icon={Send}
            disabled={Number(item.pending_count || 0) === 0 || item.workflow_status === 'cancelled'}
          >
            Remind Pending
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => onDelete(item)}
            icon={XCircle}
            disabled={item.workflow_status === 'cancelled'}
          >
            Delete
          </Button>
        </div>
      </article>
    )
  }

  // ── Student list-row view ──
  const tone = urgencyTone(item.student_status)
  const canSubmit = ['online', 'both'].includes(item.submission_type)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className="hwc-row"
      style={{ '--urgency-accent': tone.color, '--urgency-bar': tone.bar }}
    >
      {/* Left urgency bar */}
      <span className="hwc-row__bar" style={{ backgroundColor: tone.bar }} />

      {/* Subject pill + Status */}
      <div className="hwc-row__meta">
        <span className="hwc-row__subject" style={{ backgroundColor: tone.soft, color: tone.color }}>
          {item.subject_name}
        </span>
        <span className="hwc-row__status" style={{ backgroundColor: tone.softBg, color: tone.color }}>
          {statusIcon(item.student_status)}{item.student_status.replace(/_/g, '\u00a0')}
        </span>
      </div>

      {/* Title + Description */}
      <div className="hwc-row__body">
        <p className="hwc-row__title">{item.title}</p>
        {item.description && (
          <p className="hwc-row__desc">{item.description}</p>
        )}
      </div>

      {/* Right side info */}
      <div className="hwc-row__info">
        <div className="hwc-row__info-item">
          <User2 size={11} />
          <span>{item.teacher_name || '—'}</span>
        </div>
        <div className="hwc-row__info-item" style={{ color: tone.color, fontWeight: 600 }}>
          <CalendarClock size={11} />
          <span>{formatDate(item.due_date, 'short')}</span>
        </div>
        <div className="hwc-row__info-item" style={{ color: canSubmit ? '#16a34a' : '#d97706' }}>
          {canSubmit ? <CheckCircle2 size={11} /> : <Layers size={11} />}
          <span>{canSubmit ? 'Online' : 'Physical'}</span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight size={15} className="hwc-row__chevron" />

      <style>{`
        .hwc-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          padding: 13px 14px 13px 0;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.14s ease, box-shadow 0.14s ease, transform 0.14s ease;
          position: relative;
          overflow: hidden;
          outline: none;
        }

        .hwc-row:hover {
          background-color: var(--color-surface-raised);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }

        .hwc-row:active {
          transform: translateY(0);
        }

        /* Urgency accent bar on the left */
        .hwc-row__bar {
          display: block;
          width: 4px;
          min-width: 4px;
          align-self: stretch;
          border-radius: 0 3px 3px 0;
          flex-shrink: 0;
        }

        /* Subject + status column */
        .hwc-row__meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex-shrink: 0;
          min-width: 90px;
          max-width: 110px;
        }

        .hwc-row__subject {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hwc-row__status {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 99px;
          background-color: var(--color-surface-raised);
          color: var(--color-text-muted);
          white-space: nowrap;
          width: fit-content;
        }

        /* Title + description */
        .hwc-row__body {
          flex: 1;
          min-width: 0;
        }

        .hwc-row__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hwc-row__desc {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin: 3px 0 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Right info block */
        .hwc-row__info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
          align-items: flex-end;
        }

        .hwc-row__info-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .hwc-row__chevron {
          flex-shrink: 0;
          color: var(--color-text-muted);
          margin-right: 2px;
        }

        /* Hide right info on very small screens, show on sm+ */
        @media (max-width: 479px) {
          .hwc-row__info { display: none; }
          .hwc-row__meta { max-width: 90px; }
        }
      `}</style>
    </button>
  )
}

const MiniStat = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex items-center gap-2">
      <Icon size={15} style={{ color: tone }} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
    <p className="mt-2 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      {value}
    </p>
  </div>
)

function statusIcon(status) {
  if (status === 'overdue')   return '⚠ '
  if (status === 'due_today') return '⏰ '
  if (status === 'graded')    return '⭐ '
  if (status === 'submitted') return '✓ '
  return ''
}

function urgencyTone(status) {
  if (status === 'overdue')
    return { bar: '#ef4444', soft: 'rgba(239,68,68,0.10)', softBg: 'rgba(239,68,68,0.08)', color: '#dc2626' }
  if (status === 'due_today')
    return { bar: '#f59e0b', soft: 'rgba(245,158,11,0.10)', softBg: 'rgba(245,158,11,0.08)', color: '#b45309' }
  if (status === 'submitted' || status === 'graded')
    return { bar: '#22c55e', soft: 'rgba(22,163,74,0.10)', softBg: 'rgba(22,163,74,0.08)', color: '#15803d' }
  return { bar: '#a78bfa', soft: 'rgba(124,58,237,0.08)', softBg: 'rgba(124,58,237,0.06)', color: '#6d28d9' }
}

export default HomeworkCard
