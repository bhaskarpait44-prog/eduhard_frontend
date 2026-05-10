import { BookOpenText, CalendarClock, CheckCheck, Clock3, MessageSquareMore, Pencil, Send, XCircle, ChevronRight } from 'lucide-react'
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
  isTeacher = false
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

  // Student view
  const tone = urgencyTone(item.student_status)
  const canSubmit = ['online', 'both'].includes(item.submission_type)

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className="w-full rounded-[26px] border p-4 text-left transition hover:-translate-y-0.5"
      style={{
        borderColor: tone.border,
        backgroundColor: 'var(--color-surface)',
        boxShadow: '0 14px 34px rgba(76,29,149,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ backgroundColor: tone.soft, color: tone.color }}>
              {item.student_status.replace(/_/g, ' ')}
            </span>
            <span className="rounded-full bg-[rgba(124,58,237,0.10)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--student-accent)]">
              {item.subject_name}
            </span>
          </div>
          <p className="mt-3 text-base font-semibold text-[var(--color-text-primary)]">{item.title}</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-2">{item.description}</p>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniCell label="Due" value={formatDate(item.due_date, 'long')} />
        <MiniCell label="Type" value={item.submission_type} />
        <MiniCell label="Teacher" value={item.teacher_name} />
        <MiniCell label="Action" value={canSubmit ? 'Submit online' : 'Submit physically'} tone={canSubmit ? '#16a34a' : '#d97706'} />
      </div>
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

const MiniCell = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-[18px] border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p>
    <p className="mt-2 text-sm font-semibold" style={{ color: tone }}>{value || '--'}</p>
  </div>
)

function urgencyTone(status) {
  if (status === 'overdue') return { border: '#fca5a5', soft: 'rgba(239,68,68,0.10)', color: '#dc2626' }
  if (status === 'due_today') return { border: '#fcd34d', soft: 'rgba(245,158,11,0.10)', color: '#b45309' }
  if (status === 'submitted' || status === 'graded') return { border: '#86efac', soft: 'rgba(22,163,74,0.10)', color: '#15803d' }
  return { border: 'var(--color-border)', soft: 'rgba(124,58,237,0.10)', color: '#6d28d9' }
}

export default HomeworkCard
