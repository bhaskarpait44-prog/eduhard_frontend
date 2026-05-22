import { useMemo, useState } from 'react'
import {
  BellPlus,
  BellRing,
  Edit3,
  Eye,
  Filter,
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

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'homework', label: 'Homework' },
  { value: 'exam', label: 'Exam' },
  { value: 'event', label: 'Event' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_BADGE_VARIANT = {
  general: 'blue',
  homework: 'purple',
  exam: 'red',
  event: 'green',
  holiday: 'teal',
  other: 'grey',
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
    category: '',
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
        const matchesCategory = !filters.category || notice.priority === filters.category // Map category to priority if needed, or just skip category filter if not in unified
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
    <div className="space-y-5">
      {/* ── Header ── */}
      <section
        className="rounded-[24px] border px-4 py-3 sm:px-5 sm:py-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}>
            <BellRing size={16} style={{ color: '#0f766e' }} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Notices</h1>
            <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>View school announcements and manage notices you posted</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="primary" icon={BellPlus} size="sm" onClick={() => navigate(ROUTES.TEACHER_NOTICE_NEW)}>
              <span className="hidden sm:inline">Post Notice</span>
            </Button>
          </div>
        </div>

        <div className="my-3 h-px" style={{ backgroundColor: 'var(--color-border)' }} />

        <div className="grid grid-cols-3 gap-2">
          <CompactStat label="Total" value={stats.total} color="#0f766e" />
          <CompactStat label="Unread" value={stats.unread} color="#f59e0b" />
          <CompactStat label="Urgent" value={stats.urgent} color="#ef4444" />
        </div>
      </section>

      {/* ── Filters ── */}
      <section
        className="rounded-[18px] border px-3 py-3"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[130px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search notices..."
              className="w-full rounded-[10px] border py-1.5 pl-7 pr-3 text-xs outline-none transition-colors"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </section>

      {/* ── Notice Cards ── */}
      <section className="space-y-4">
        {loadingBase || loadingNotices ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[22px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          ))
        ) : filteredNotices.length === 0 ? (
          <EmptyState icon={BellRing} title="No notices found" description="Announcements and notices you post will appear here." />
        ) : (
          filteredNotices.map((notice) => (
            <NoticeCard
              key={`${notice.source || 'unified'}-${notice.id}`}
              notice={notice}
              onOpen={() => handleOpenNotice(notice)}
              onEdit={() => navigate(ROUTES.TEACHER_NOTICE_NEW, { state: { notice } })}
              onDelete={() => setIsDeleteConfirmOpen(notice.id)}
            />
          ))
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
