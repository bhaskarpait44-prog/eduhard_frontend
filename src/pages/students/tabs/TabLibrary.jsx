import { Library, BookOpen, Calendar, AlertCircle } from 'lucide-react'
import { formatDate } from '@/utils/helpers'

export default function TabLibrary({ student }) {
  const issues = student?.library_issues || []
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
          <Library size={18} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Library Records</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Currently Issued Books</h4>
        
        {issues.length === 0 ? (
          <div className="p-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <BookOpen size={40} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No books are currently issued to this student.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => {
              const isOverdue = new Date(issue.due_date) < new Date() && issue.status === 'issued'
              
              return (
                <div key={issue.id} className={`p-4 rounded-2xl border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`h-10 w-10 sm:h-12 sm:w-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isOverdue ? 'bg-red-500 text-white' : 'bg-violet-500 text-white'}`}>
                      <BookOpen size={18} className="sm:size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{issue.title}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">ISBN: {issue.isbn || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center sm:justify-end">
                    <div className="flex flex-col">
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Issued On</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <Calendar size={12} className="text-gray-400" />
                        {formatDate(issue.issue_date)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>Due Date</p>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        <AlertCircle size={12} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                        {formatDate(issue.due_date)}
                        {isOverdue && <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-[8px] text-white uppercase rounded-md font-black">Overdue</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/60 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-white shadow-sm text-gray-400">
          <AlertCircle size={16} />
        </div>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Full reading history and fine details are available in the <span className="text-violet-600 font-bold">Library Module</span>.
        </p>
      </div>
    </div>
  )
}
