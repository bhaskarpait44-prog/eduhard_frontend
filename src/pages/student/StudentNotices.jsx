import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, CalendarDays, Clock, FileText, Pin, RefreshCw, User2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import NoticeCard from '@/components/student/NoticeCard'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentNotices from '@/hooks/useStudentNotices'
import useToast from '@/hooks/useToast'
import { formatDate, getFileUrl } from '@/utils/helpers'

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
}

const PRIORITY_META = {
  urgent: { label: 'Urgent', bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  info:   { label: 'Info',   bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  normal: { label: 'Normal', bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
}

const StudentNotices = () => {
  usePageTitle('Notice Board')

  const { toastError, toastSuccess } = useToast()
  const {
    notices,
    unreadCount,
    loading,
    refreshing,
    actionId,
    error,
    refresh,
    markRead,
    togglePin,
  } = useStudentNotices()

  const [selectedNotice, setSelectedNotice] = useState(null)

  useEffect(() => {
    if (error) toastError(error)
  }, [error, toastError])

  const sortedNotices = useMemo(
    () => [...notices].sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
      if (a.priority !== b.priority) {
        if (a.priority === 'urgent') return -1
        if (b.priority === 'urgent') return 1
      }
      return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    }),
    [notices]
  )

  const handleOpen = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        await markRead(notice.id, notice.source || 'unified')
        setSelectedNotice((prev) => prev ? { ...prev, is_read: true } : prev)
      } catch (err) {
        toastError(err?.message || 'Unable to mark notice as read.')
      }
    }
  }

  const handleTogglePin = async (notice) => {
    try {
      await togglePin(notice)
      toastSuccess(notice.is_pinned ? 'Notice unpinned.' : 'Notice pinned.')
    } catch (err) {
      toastError(err?.message || 'Unable to update notice pin.')
    }
  }

  const pm = selectedNotice ? (PRIORITY_META[selectedNotice.priority] || PRIORITY_META.normal) : null

  return (
    <div className="space-y-5 pb-8">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Notice Board
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {unreadCount > 0
              ? <><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />{unreadCount} unread notice{unreadCount !== 1 ? 's' : ''}</span></>
              : 'All caught up · No unread notices'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refresh()} loading={refreshing} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* ── Notices list ── */}
      <section className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl"
              style={{ height: '110px', backgroundColor: 'var(--color-surface)' }}
            />
          ))
        ) : sortedNotices.length ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2.5"
          >
            <AnimatePresence mode="popLayout">
              {sortedNotices.map((notice) => (
                <motion.div
                  key={`${notice.source || 'unified'}-${notice.id}`}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <NoticeCard
                    notice={notice}
                    onOpen={handleOpen}
                    onTogglePin={handleTogglePin}
                    loading={actionId === notice.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState
            icon={BellRing}
            title="No notices right now"
            description="All clear! We'll notify you when there's something new."
          />
        )}
      </section>

      {/* ── Notice Detail Modal ── */}
      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title=""
        size="lg"
      >
        {selectedNotice && pm && (
          <div className="space-y-0">

            {/* ── Modal header band ── */}
            <div
              className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl px-6 py-5"
              style={{ backgroundColor: pm.bg }}
            >
              {/* Priority dot bar */}
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: pm.dot }}
              />
              <div className="flex flex-wrap items-start justify-between gap-3 pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Priority pill */}
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ backgroundColor: pm.dot + '22', color: pm.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pm.dot }} />
                    {pm.label}
                  </span>
                  {/* Role pill */}
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest capitalize"
                    style={{
                      backgroundColor: 'rgba(124,58,237,0.12)',
                      color: 'var(--student-accent)',
                    }}
                  >
                    {selectedNotice.posted_by_role}
                  </span>
                  {/* Pinned */}
                  {selectedNotice.is_pinned && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
                    >
                      <Pin size={9} />
                      Pinned
                    </span>
                  )}
                </div>
                {/* Unread dot */}
                {!selectedNotice.is_read && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Unread
                  </span>
                )}
              </div>
              {/* Title in band */}
              <h2 className="mt-3 pl-3 text-lg font-bold leading-snug" style={{ color: pm.color }}>
                {selectedNotice.title}
              </h2>
            </div>

            {/* ── Meta row ── */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mb-4">
              <MetaCell icon={User2} label="Posted by" value={selectedNotice.posted_by_name || 'School'} iconColor="var(--student-accent)" />
              <MetaCell icon={CalendarDays} label="Published" value={formatDate(selectedNotice.created_at, 'long')} iconColor="#2563eb" />
            </div>

            {/* ── Body ── */}
            <div
              className="rounded-xl border p-4 mb-4"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
                Message
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {selectedNotice.body}
              </p>
            </div>

            {/* ── Expiry ── */}
            {selectedNotice.expires_at && (
              <div
                className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5 mb-4"
                style={{ borderColor: '#fed7aa', backgroundColor: '#fff7ed' }}
              >
                <Clock size={14} style={{ color: '#c2410c', flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: '#9a3412' }}>
                  Expires on {formatDate(selectedNotice.expires_at, 'long')}
                </span>
              </div>
            )}

            {/* ── Attachment ── */}
            {selectedNotice.attachment_path && (
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3 mb-4"
                style={{ borderColor: 'rgba(124,58,237,0.20)', backgroundColor: 'rgba(124,58,237,0.05)' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--student-accent)', color: '#fff' }}
                >
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Attachment</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--student-accent)' }}>PDF Document</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open(getFileUrl(selectedNotice.attachment_path), '_blank')}
                >
                  View PDF
                </Button>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ── Modal meta cell ─────────────────────────────────────────────────────── */
const MetaCell = ({ icon: Icon, label, value, iconColor }) => (
  <div
    className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
  >
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: iconColor + '18', color: iconColor }}
    >
      <Icon size={15} />
    </div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  </div>
)

export default StudentNotices
