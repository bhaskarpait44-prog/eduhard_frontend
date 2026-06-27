import { Pin, Eye, CalendarDays, User2, Clock, Paperclip } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

const PRIORITY_STYLE = {
  urgent: { dot: '#ef4444', bar: '#fee2e2', label: 'Urgent',  text: '#dc2626' },
  info:   { dot: '#3b82f6', bar: '#dbeafe', label: 'Info',    text: '#1d4ed8' },
  normal: { dot: '#22c55e', bar: '#dcfce7', label: 'Normal',  text: '#15803d' },
}

const NoticeCard = ({ notice, onOpen, onTogglePin, loading = false }) => {
  const isUnread = !notice.is_read
  const ps = PRIORITY_STYLE[notice.priority] || PRIORITY_STYLE.normal

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border transition-all duration-150 hover:shadow-sm"
      style={{
        borderColor:     isUnread ? '#93c5fd' : 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Left priority bar */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: ps.dot }}
      />

      <div className="pl-4 pr-4 py-4 sm:pr-5 sm:py-4">
        {/* ── Top row: badges + actions ── */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: labels */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Unread dot */}
            {isUnread && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                New
              </span>
            )}
            {/* Priority (only urgent/info shown) */}
            {notice.priority !== 'normal' && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: ps.bar, color: ps.text }}
              >
                {ps.label}
              </span>
            )}
            {/* Pinned */}
            {notice.is_pinned && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
              >
                <Pin size={9} className="fill-current" />
                Pinned
              </span>
            )}
            {/* Attachment indicator */}
            {notice.attachment_path && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                <Paperclip size={11} />
                PDF
              </span>
            )}
          </div>

          {/* Right: role chip */}
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {notice.posted_by_role}
          </span>
        </div>

        {/* ── Title + body preview ── */}
        <div className="mt-2.5">
          <h3
            className="text-[15px] font-bold leading-snug line-clamp-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {notice.title}
          </h3>
          <p
            className="mt-1 text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {notice.body}
          </p>
        </div>

        {/* ── Meta row ── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          <span className="flex items-center gap-1">
            <User2 size={11} />
            {notice.posted_by_name || 'School'}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            {formatDate(notice.created_at, 'short')}
          </span>
          {notice.expires_at && (
            <span className="flex items-center gap-1" style={{ color: '#ea580c' }}>
              <Clock size={11} />
              Expires {formatDate(notice.expires_at, 'short')}
            </span>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(notice)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: 'var(--student-accent)' }}
          >
            <Eye size={13} />
            View Notice
          </button>
          <button
            type="button"
            onClick={() => onTogglePin?.(notice)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
            style={{
              backgroundColor: notice.is_pinned ? '#fef3c7' : 'var(--color-surface-raised)',
              color:           notice.is_pinned ? '#b45309' : 'var(--color-text-secondary)',
              border:          `1px solid ${notice.is_pinned ? '#fde68a' : 'var(--color-border)'}`,
              opacity:         loading ? 0.6 : 1,
            }}
          >
            <Pin size={13} className={notice.is_pinned ? 'fill-current' : ''} />
            {notice.is_pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default NoticeCard
