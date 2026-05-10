import { Pin, Eye, CalendarDays, User2, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import Badge from '@/components/ui/Badge'

const NoticeCard = ({ notice, onOpen, onTogglePin, loading = false }) => {
  const isUnread = !notice.is_read

  return (
    <article
      className="relative overflow-hidden rounded-[24px] border p-4 sm:p-5 transition-all hover:shadow-md"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        borderLeft: isUnread ? '4px solid #3b82f6' : '1px solid var(--color-border)',
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isUnread && <Badge variant="blue">New</Badge>}
            {notice.priority === 'urgent' && <Badge variant="red">Urgent</Badge>}
            {notice.priority === 'info' && <Badge variant="blue">Info</Badge>}
            <Badge variant="teal" className="capitalize">{notice.posted_by_role}</Badge>
            {notice.is_pinned && <Badge variant="yellow">Pinned</Badge>}
          </div>

          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={`text-lg font-bold leading-tight`} style={{ color: 'var(--color-text-primary)' }}>
                {notice.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {notice.body}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[18px] px-4 py-3 text-[11px]" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <span className="flex items-center gap-1.5">
            <User2 size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-semibold text-[var(--color-text-secondary)]">From:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{notice.posted_by_name || 'School'}</span>
          </span>
          <span className="flex items-center gap-1.5 border-l pl-4 border-slate-200 dark:border-slate-800">
            <CalendarDays size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="font-semibold text-[var(--color-text-secondary)]">Date:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{formatDate(notice.created_at, 'long')}</span>
          </span>
          {notice.expires_at && (
            <span className="flex items-center gap-1.5 border-l pl-4 border-slate-200 dark:border-slate-800 text-orange-600 font-medium">
              <Clock size={12} />
              <span>Expires: {formatDate(notice.expires_at, 'short')}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onOpen?.(notice)}
          className="min-h-11 flex-[2] flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition-transform active:scale-[0.98]"
          style={{ backgroundColor: 'var(--student-accent)' }}
        >
          <Eye size={16} />
          View Details
        </button>
        <button
          type="button"
          onClick={() => onTogglePin?.(notice)}
          disabled={loading}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', opacity: loading ? 0.7 : 1 }}
        >
          <Pin size={15} className={notice.is_pinned ? 'fill-current' : ''} />
          {notice.is_pinned ? 'Unpin' : 'Pin'}
        </button>
      </div>
    </article>
  )
}

export default NoticeCard
