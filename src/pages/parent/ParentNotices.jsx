import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import usePageTitle from '@/hooks/usePageTitle'
import { getParentNotices, markParentNoticeRead } from '@/api/noticesApi'
import { Bell, Calendar, User, ShieldCheck, ChevronRight, FileText, Paperclip } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, getFileUrl } from '@/utils/helpers'
import Button from '@/components/ui/Button'

export default function ParentNotices() {
  usePageTitle('School Notices')
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getParentNotices()
      setNotices(res.data?.notices || [])
    } catch (e) {
      console.error('Failed to fetch notices', e)
      setError('Unable to load notices. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await markParentNoticeRead(id)
      setNotices(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error('Failed to mark notice as read', e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl">
            <Bell className="text-amber-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Announcements</h1>
            <p className="text-sm font-medium text-gray-500">Official updates and notices from school</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-amber-100 border-t-amber-600 animate-spin mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Updates...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-red-50/50 rounded-[32px] border border-red-100/50 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <Bell size={24} className="rotate-12 animate-pulse text-red-600" />
          </div>
          <h3 className="text-lg font-black text-red-950 mb-2">Connection Problem</h3>
          <p className="text-sm font-medium text-red-600/80 mb-6">{error}</p>
          <Button variant="secondary" onClick={fetchNotices}>
            Try Again
          </Button>
        </div>
      ) : !Array.isArray(notices) || notices.length === 0 ? (
        <EmptyState title="All clear!" description="You're all caught up. No new notices at this time." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => !notice.is_read && handleMarkRead(notice.id)}
              className={`bg-white rounded-[32px] border transition-all overflow-hidden ${
                !notice.is_read ? 'border-amber-200 shadow-xl shadow-amber-50 ring-2 ring-amber-50' : 'border-gray-100 shadow-sm opacity-90'
              }`}
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        notice.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-100' :
                        notice.priority === 'normal' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {notice.priority}
                      </span>
                      {!notice.is_read && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest">New</span>
                      )}
                      {notice.attachment_path && (
                        <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                          <Paperclip size={12} />
                        </div>
                      )}
                      {notice.target_ward_name && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                          <User size={12} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">For {notice.target_ward_name}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">{notice.title}</h3>
                    <div className="flex items-center gap-4 text-gray-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{formatDate(notice.created_at, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={13} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Posted by {notice.posted_by_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {notice.audience !== 'school_wide' && (
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Audience</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                        <ShieldCheck size={12} />
                        <span className="text-[11px] font-bold capitalize">{notice.audience}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className="text-sm text-gray-600 leading-relaxed prose max-w-none prose-p:mb-4 prose-strong:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.body || notice.content || '') }}
                />

                {notice.attachment_path && (
                  <div className="mt-6 flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 group hover:bg-indigo-50 transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(notice.attachment_path), '_blank'); }}>
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-indigo-900 truncate">Attachment Document</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Official PDF Resource</p>
                    </div>
                    <ChevronRight size={20} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                    Reference ID: #{notice.id.toString().padStart(6, '0')}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    Marked as viewed <ShieldCheck size={14} className={notice.is_read ? 'text-green-500' : 'text-gray-300'} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
