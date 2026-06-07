import { Library, BookOpen, Calendar, AlertCircle, Clock } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import Select from '@/components/ui/Select'

export default function TabLibrary({ student }) {
  const issues = student?.library_issues || [
    { id: 1, title: 'The Small-Town Library', issue_date: '2024-01-25', due_date: '2024-01-25', status: 'returned' },
    { id: 2, title: 'Apex Time', issue_date: '2024-01-22', due_date: '2024-01-25', status: 'returned' },
    { id: 3, title: 'The Cobalt Guitar', issue_date: '2024-01-30', due_date: '2024-02-10', status: 'returned' },
    { id: 4, title: 'Shard and the Tomb', issue_date: '2024-02-10', due_date: '2024-02-20', status: 'returned' },
    { id: 5, title: 'Shard and the Tomb 2', issue_date: '2024-02-12', due_date: '2024-02-22', status: 'returned' },
    { id: 6, title: 'Plague of Fear', issue_date: '2024-02-15', due_date: '2024-02-25', status: 'returned' },
  ]
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Library size={16} className="text-indigo-600" /> Library
        </h3>
        <Select size="sm" options={[{ value: 'this', label: 'This Year' }]} defaultValue="this" containerClassName="w-32" />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => (
            <BookCard key={issue.id} issue={issue} />
          ))}
        </div>

        {issues.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No library records found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const BookCard = ({ issue }) => {
  const isOverdue = new Date(issue.due_date) < new Date() && issue.status === 'issued'
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-4 flex gap-4">
        <div className="h-24 w-16 bg-gray-100 rounded shadow-sm shrink-0 overflow-hidden relative border border-gray-50">
          {/* Placeholder for book cover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1 bg-gradient-to-br from-indigo-50 to-white">
            <BookOpen size={24} className="text-indigo-200" />
            <p className="text-[6px] font-black text-indigo-300 uppercase tracking-tighter text-center mt-1">LIBRARY BOOK</p>
          </div>
          {/* Decorative spine */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600/10 border-r border-indigo-600/5" />
        </div>
        
        <div className="min-w-0 flex-1 space-y-3">
          <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-tight h-8">{issue.title}</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Book taken on</p>
              <p className="text-[10px] font-bold text-gray-700">{formatDate(issue.issue_date)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Last Date</p>
              <p className={`text-[10px] font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(issue.due_date)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
