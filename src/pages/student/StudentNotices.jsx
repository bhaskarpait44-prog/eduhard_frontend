import { useEffect, useMemo, useState } from 'react'
import { BellRing, RefreshCw, CalendarDays, User2, Clock, FileText } from 'lucide-react'
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
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(37,99,235,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">School Notice Board</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
              Stay updated with the latest announcements, urgent alerts, and event info from school.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl border px-4 py-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unread</p>
              <p className="text-lg font-black text-blue-600">{unreadCount}</p>
            </div>
            <Button variant="secondary" onClick={() => refresh()} loading={refreshing} icon={RefreshCw}>
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface)' }} />
          ))
        ) : sortedNotices.length ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
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

      <Modal
        open={Boolean(selectedNotice)}
        onClose={() => setSelectedNotice(null)}
        title="Notice Detail"
        size="lg"
      >
        {selectedNotice && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedNotice.priority === 'urgent' ? 'red' : selectedNotice.priority === 'info' ? 'blue' : 'green'}>
                  {selectedNotice.priority}
                </Badge>
                <Badge variant="teal" className="capitalize">{selectedNotice.posted_by_role}</Badge>
              </div>
              <h2 className="text-2xl font-bold leading-tight">{selectedNotice.title}</h2>
            </div>

            <div className="grid gap-3 rounded-[24px] border p-4 sm:grid-cols-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <User2 size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posted By</p>
                  <p className="text-sm font-semibold">{selectedNotice.posted_by_name || 'School'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <CalendarDays size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Published Date</p>
                  <p className="text-sm font-semibold">{formatDate(selectedNotice.created_at, 'long')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] bg-slate-50 dark:bg-slate-900/40 p-6 border border-slate-100 dark:border-slate-800">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-[var(--color-text-primary)]">
                {selectedNotice.body}
              </p>
            </div>

            {selectedNotice.attachment_path && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-md">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">Attachment Document</div>
                  <div className="text-[10px] font-bold text-brand uppercase tracking-wider">PDF File</div>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="shadow-sm"
                  onClick={() => window.open(getFileUrl(selectedNotice.attachment_path), '_blank')}
                >
                  View PDF
                </Button>
              </div>
            )}

            {selectedNotice.expires_at && (
              <div className="flex items-center gap-2 text-xs text-orange-600 font-bold bg-orange-50 dark:bg-orange-950/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <Clock size={14} />
                <span>Expires on: {formatDate(selectedNotice.expires_at, 'long')}</span>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedNotice(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default StudentNotices
