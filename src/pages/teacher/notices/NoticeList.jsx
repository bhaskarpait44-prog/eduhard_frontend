import { useMemo, useState } from 'react'
import {
  BellPlus,
  BellRing,
  Edit3,
  Eye,
  Search,
  CalendarDays,
  User2,
  Users,
  Clock,
  Trash2,
  Paperclip,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useTeacherNotices from '@/hooks/useTeacherNotices'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'
import { formatDate, getFileUrl } from '@/utils/helpers'

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

const NoticeList = () => {
  usePageTitle('Teacher Notices')

  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { can } = usePermissions()
  const { toastSuccess, toastError } = useToast()
  const { notices, loadingBase, loadingNotices, deleteNotice, markAsRead } = useTeacherNotices()

  const [filters, setFilters] = useState({
    search: '',
  })
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(null)

  const handleOpenNotice = (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      markAsRead(notice.id, notice.source || 'unified')
    }
  }

  const canPost = can('notices.post')

  const filteredNotices = useMemo(
    () =>
      notices.filter((notice) => {
        const haystack = `${notice.title} ${notice.body}`.toLowerCase()
        const matchesSearch = !filters.search.trim() || haystack.includes(filters.search.trim().toLowerCase())
        return matchesSearch
      }),
    [filters, notices],
  )

  const stats = useMemo(
    () => ({
      total: notices.length,
      unread: notices.filter(n => !n.is_read).length,
      urgent: notices.filter(n => n.priority === 'urgent').length,
    }),
    [notices],
  )

  const handleDelete = async () => {
    try {
      await deleteNotice(isDeleteConfirmOpen)
      toastSuccess('Notice deleted.')
      setIsDeleteConfirmOpen(null)
    } catch (err) {
      toastError('Failed to delete notice.')
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex justify-end">
        <Button variant="primary" icon={BellPlus} size="sm" onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}>
          Post Notice
        </Button>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-3 gap-4">
        <CompactStat label="Total" value={stats.total} color="#00bc7d" />
        <CompactStat label="Unread" value={stats.unread} color="#f59e0b" />
        <CompactStat label="Urgent" value={stats.urgent} color="#ef4444" />
      </div>

      {/* ── Filters ── */}
      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search notices..."
              className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Notice Cards ── */}
      <section className="space-y-4">
        {loadingBase || loadingNotices ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[22px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))
        ) : filteredNotices.length === 0 ? (
          <EmptyState icon={BellRing} title="No notices found" description="Announcements and notices you post will appear here." />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotices.map((notice) => (
                <motion.div
                  key={`${notice.source || 'unified'}-${notice.id}`}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <NoticeCard
                    notice={notice}
                    onOpen={() => handleOpenNotice(notice)}
                    onEdit={() => navigate(ROUTES.TEACHER_NOTICE_NEW, { state: { notice } })}
                    onDelete={() => setIsDeleteConfirmOpen(notice.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ── Detail Modal ── */}
      <Modal open={Boolean(selectedNotice)} onClose={() => setSelectedNotice(null)} title="Notice Detail" size="xl">
        {selectedNotice && <NoticeDetail notice={selectedNotice} />}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(null)} title="Delete Notice" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Delete this notice permanently?</p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const NoticeCard = ({ notice, onOpen, onEdit, onDelete }) => {
  const canManage = notice.can_manage === true

  return (
    <article className="relative rounded-[22px] border p-5 transition-all hover:shadow-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {!notice.is_read && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand shadow-sm animate-pulse" />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={notice.priority === 'urgent' ? 'red' : notice.priority === 'info' ? 'blue' : 'green'}>{notice.priority}</Badge>
            <Badge variant="blue" className="capitalize">{notice.audience}</Badge>
            {notice.attachment_path && <Paperclip size={14} className="text-slate-400" />}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{notice.title}</h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{notice.body}</p>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(notice.created_at, 'long')}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {notice.read_count || 0} Views</span>
            {notice.class_name && <span className="font-bold text-brand">{notice.class_name} {notice.section_name}</span>}
          </div>
        </div>
        
        {canManage && (
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" icon={Edit3} onClick={onEdit}>Edit</Button>
            <Button variant="outline" size="sm" icon={Trash2} className="!text-red-500 hover:!bg-red-50" onClick={onDelete}>Delete</Button>
          </div>
        )}
      </div>
      <button onClick={onOpen} className="mt-3 w-full text-center text-[10px] font-bold text-brand uppercase tracking-wider py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:opacity-70 transition-all">
        View Full Notice
      </button>
    </article>
  )
}

const NoticeDetail = ({ notice }) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={notice.priority === 'urgent' ? 'red' : 'green'}>{notice.priority}</Badge>
        <Badge variant="blue" className="capitalize">{notice.audience}</Badge>
      </div>
      <h2 className="text-2xl font-bold">{notice.title}</h2>
      <p className="text-xs text-slate-400">Posted on {formatDate(notice.created_at, 'long')}</p>
    </div>
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{notice.body}</p>
    </div>
    {notice.attachment_path && (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand/5 border border-brand/10">
        <div className="p-2 rounded-xl bg-brand text-white">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Attachment Document</div>
          <div className="text-[10px] text-slate-500">PDF Document</div>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => window.open(getFileUrl(notice.attachment_path), '_blank')}
        >
          View PDF
        </Button>

      </div>
    )}
  </div>
)

const CompactStat = ({ label, value, color }) => (
  <div className="flex flex-col items-center justify-center rounded-[14px] py-2 bg-slate-50/50 dark:bg-slate-900/20">
    <p className="text-lg font-bold" style={{ color }}>{value}</p>
    <p className="text-[10px] font-medium uppercase text-slate-400 tracking-wider">{label}</p>
  </div>
)

export default NoticeList
