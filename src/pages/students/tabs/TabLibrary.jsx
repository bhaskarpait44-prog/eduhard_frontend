import { useState, useEffect } from 'react'
import { Library, BookOpen, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import Select from '@/components/ui/Select'
import libraryApi from '@/api/libraryApi'

const YEAR_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: new Date().getFullYear().toString(), label: 'This Year' },
  { value: (new Date().getFullYear() - 1).toString(), label: 'Last Year' },
]

export default function TabLibrary({ student }) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    if (!student?.id) return
    fetchIssues()
  }, [student?.id, selectedYear])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      let params = {
        borrower_type: 'student',
        borrower_id: student.id,
        limit: 50,
      }
      if (selectedYear !== 'all') {
        params.start_date = `${selectedYear}-01-01`
        params.end_date = `${selectedYear}-12-31`
      }
      const { data } = await libraryApi.getIssues(params)
      setIssues(data.issues || [])
    } catch (err) {
      console.error('Failed to fetch student library issues', err)
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Library size={16} className="text-indigo-600" /> Library
        </h3>
        <Select
          size="sm"
          options={YEAR_OPTIONS}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          containerClassName="w-32"
        />
      </div>

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 animate-pulse h-32" />
            ))}
          </div>
        ) : issues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <BookCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
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
  const isOverdue = issue.status === 'overdue' || (new Date(issue.due_date) < new Date() && issue.status === 'issued')
  const isReturned = issue.status === 'returned'

  const statusConfig = {
    returned: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Returned' },
    overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Overdue' },
    issued: { icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Issued' },
  }
  const cfg = statusConfig[issue.status] || statusConfig.issued
  const StatusIcon = cfg.icon

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow group ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="p-4 flex gap-4">
        <div className="h-24 w-16 rounded shadow-sm shrink-0 overflow-hidden relative border border-gray-50 bg-gradient-to-br from-indigo-50 to-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <BookOpen size={24} className="text-indigo-200" />
            <p className="text-[6px] font-black text-indigo-300 uppercase tracking-tighter text-center mt-1">LIBRARY</p>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600/10 border-r border-indigo-600/5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-tight">{issue.book_title}</h4>

          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
            <StatusIcon size={9} />
            {cfg.label}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Issued</p>
              <p className="text-[10px] font-bold text-gray-700">{formatDate(issue.issue_date)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                {isReturned ? 'Returned' : 'Due Date'}
              </p>
              <p className={`text-[10px] font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                {isReturned ? formatDate(issue.return_date) : formatDate(issue.due_date)}
              </p>
            </div>
          </div>

          {issue.fine_amount > 0 && (
            <div className={`flex items-center gap-1 text-[9px] font-black ${issue.fine_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
              Fine: ₹{issue.fine_amount}
              <span className="opacity-70 normal-case font-medium">({issue.fine_status})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
