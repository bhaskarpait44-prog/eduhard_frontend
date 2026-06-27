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
import Badge from '@/components/ui/Badge'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 15 
    } 
  }
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

  return (
    <div className="space-y-5">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(59,130,246,0.06) 52%, var(--color-surface) 100%)',
          boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#2563eb' }}
            >
              <Bell size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#2563eb' }}>
                Notice Board
              </p>
              <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">School Notices</h1>
              <p className="mt-1.5 max-w-2xl text-[13px] text-[var(--color-text-secondary)] sm:text-[15px]">
                Stay updated with the latest announcements, urgent alerts, and event info from school.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Unread pill */}
            {unreadCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-2xl border px-4 py-2"
                style={{ borderColor: 'rgba(37,99,235,0.25)', backgroundColor: 'rgba(37,99,235,0.08)' }}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>Unread</p>
                  <p className="text-[15px] font-black" style={{ color: '#2563eb' }}>{unreadCount}</p>
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={() => refresh()} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* ── Notices list ── */}
      <section className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl"
              style={{ backgroundColor: 'var(--color-surface)' }}
            />
          ))
        ) : sortedNotices.length ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {sortedNotices.map((notice) => (
                <motion.div
                  key={`${notice.source || 'unified'}-${notice.id}`}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
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

      {/* ── Notice detail modal ── */}
      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title="Notice Detail"
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-5">
            {/* Priority & role badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selectedNotice.priority === 'urgent' ? 'red' : selectedNotice.priority === 'info' ? 'blue' : 'green'}>
                {selectedNotice.priority}
              </Badge>
              <Badge variant="teal" className="capitalize">{selectedNotice.posted_by_role}</Badge>
              {selectedNotice.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <Pin size={10} /> Pinned
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold leading-tight">{selectedNotice.title}</h2>

            {/* Meta grid */}
            <div
              className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(124,58,237,0.10)', color: 'var(--student-accent)' }}
                >
                  <User2 size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Posted By</p>
                  <p className="text-sm font-semibold">{selectedNotice.posted_by_name || 'School'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(37,99,235,0.10)', color: '#2563eb' }}
                >
                  <CalendarDays size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Published</p>
                  <p className="text-sm font-semibold">{formatDate(selectedNotice.created_at, 'long')}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div
              className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
            >
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--color-text-primary)]">
                {selectedNotice.body}
              </p>
            </div>

            {/* Attachment */}
            {selectedNotice.attachment_path && (
              <div
                className="flex items-center gap-3 rounded-2xl border p-4"
                style={{ borderColor: 'rgba(124,58,237,0.20)', backgroundColor: 'rgba(124,58,237,0.06)' }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--student-accent)', color: '#fff' }}
                >
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold truncate">Attachment Document</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--student-accent)' }}>PDF File</div>
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

            {/* Expiry */}
            {selectedNotice.expires_at && (
              <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-600 dark:border-orange-900/30 dark:bg-orange-950/20">
                <Clock size={14} />
                <span>Expires on: {formatDate(selectedNotice.expires_at, 'long')}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StudentNotices
