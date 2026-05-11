import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import { getStudentNotices } from '@/api/noticesApi'
import { Bell, Calendar } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

export default function ParentNotices() {
  usePageTitle('School Notices')
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getStudentNotices()
      .then(res => setNotices(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
          <Bell className="text-amber-600 dark:text-amber-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Notices & Announcements</h1>
          <p className="text-sm font-medium text-gray-500">Stay updated with school events and news</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <EmptyState title="No notices" description="There are no active notices at the moment." />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{notice.title}</h3>
                  <div className="flex items-center gap-2 text-gray-500 mt-2">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">{formatDate(notice.created_at)}</span>
                  </div>
                </div>
                {notice.is_important && (
                  <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest w-fit">
                    Important
                  </span>
                )}
              </div>
              <div 
                className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
