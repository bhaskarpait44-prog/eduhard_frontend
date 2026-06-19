import { useState, useEffect } from 'react'
import { Bell, Calendar, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getLibrarianNotices, markLibrarianNoticeRead } from '@/api/noticesApi'
import usePageTitle from '@/hooks/usePageTitle'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'
import { cn, getFileUrl } from '@/utils/helpers'

const LibrarianNotices = () => {
  usePageTitle('Library Notices')
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNotice, setSelectedNotice] = useState(null)

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const res = await getLibrarianNotices()
      setNotices(res.data?.notices || [])
    } catch (err) {
      console.error('Error fetching librarian notices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleOpenNotice = async (notice) => {
    setSelectedNotice(notice)
    if (!notice.is_read) {
      try {
        await markLibrarianNoticeRead(notice.id, notice.source || 'unified')
        setNotices(prev => prev.map(n => n.id === notice.id ? { ...n, is_read: true } : n))
      } catch (err) {
        console.error('Error marking librarian notice as read:', err)
      }
    }
  }

  const getPriorityColor = (p) => {
    if (p === 'urgent') return '#ef4444'
    if (p === 'info') return '#3b82f6'
    return '#22c55e'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          School Notices
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Stay updated with the latest announcements from administration.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : notices.length > 0 ? (
        <div className="grid gap-4">
          {notices.map((n) => (
            <div
              key={`${n.source || 'unified'}-${n.id}`}
              onClick={() => handleOpenNotice(n)}
              className={cn(
                'group relative p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-md border',
                !n.is_read ? 'shadow-sm' : 'opacity-80'
              )}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: !n.is_read ? 'var(--color-brand)' : 'var(--color-border)'
              }}
            >
              {!n.is_read && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
              )}

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${getPriorityColor(n.priority)}15` }}>
                  <Bell size={18} style={{ color: getPriorityColor(n.priority) }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {n.title}
                    </h3>
                    <Badge variant={n.priority === 'urgent' ? 'danger' : n.priority === 'info' ? 'brand' : 'success'} size="sm">
                      {n.priority}
                    </Badge>
                  </div>

                  <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {n.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(n.created_at), 'dd MMM yyyy, hh:mm a')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      {n.posted_by_name}
                    </div>
                  </div>
                </div>

                <div className="self-center hidden sm:block">
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-brand transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-300">
            <Bell size={32} />
          </div>
          <p className="font-medium text-slate-500">No notices found.</p>
        </div>
      )}

      {/* Notice Detail Modal */}
      <Modal
        open={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title}
        size="lg"
        footer={(
          <Button variant="ghost" onClick={() => setSelectedNotice(null)}>Close</Button>
        )}
      >
        {selectedNotice && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 py-3 border-y" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <Calendar size={14} />
                <span>Posted on {format(new Date(selectedNotice.created_at), 'PPPP')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <User size={14} />
                <span>By {selectedNotice.posted_by_name}</span>
              </div>
              <Badge variant={selectedNotice.priority === 'urgent' ? 'danger' : selectedNotice.priority === 'info' ? 'brand' : 'success'}>
                {selectedNotice.priority} Priority
              </Badge>
            </div>

            <div className="prose prose-sm max-w-none" style={{ color: 'var(--color-text-primary)' }}>
              {selectedNotice.body.split('\n').map((para, i) => (
                <p key={i} className="mb-4 whitespace-pre-wrap leading-relaxed">{para}</p>
              ))}
            </div>

            {selectedNotice.attachment_path && (
              <div className="p-4 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px]">PDF</div>
                  <div>
                    <p className="text-sm font-semibold">Attachment Available</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Notice Annexure.pdf</p>
                  </div>
                </div>
                <button onClick={() => window.open(getFileUrl(selectedNotice.attachment_path), '_blank')}>
                  <Button variant="ghost" size="sm">Download</Button>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-green-600">
              <CheckCircle2 size={12} />
              <span>You have read this notice</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LibrarianNotices
