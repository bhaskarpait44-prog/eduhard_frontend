import { useEffect, useState } from 'react'
import { LayoutDashboard, CalendarCheck, Wallet, Heart, Info, ArrowRight } from 'lucide-react'
import { getSummary } from '@/api/studentsApi'

const SummaryCard = ({ icon: Icon, label, value, colorClass, bgClass, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border bg-white shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group`}
  >
    <div className={`h-12 w-12 rounded-2xl ${bgClass} ${colorClass} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg font-black text-gray-900 truncate">{value}</p>
    </div>
    <ArrowRight size={16} className="text-gray-200 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
  </div>
)

export default function TabSummary({ student, onTabChange }) {
  const enrollment = student?.current_enrollment
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getSummary(student.id)
        setSummary(res.data)
      } catch (err) {
        console.error('Failed to fetch student summary', err)
      } finally {
        setLoading(false)
      }
    }
    if (student.id) fetchSummary()
  }, [student.id])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-100 rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl border border-gray-100" />)}
      </div>
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 bg-gray-50 rounded-2xl" />
        <div className="h-24 bg-gray-50 rounded-2xl" />
      </div>
    </div>
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
          <LayoutDashboard size={18} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Quick Overview</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard 
          icon={CalendarCheck} 
          label="Attendance" 
          value={`${summary?.attendance?.percentage || 0}%`}
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50"
          onClick={() => onTabChange('attendance')}
        />
        <SummaryCard 
          icon={Wallet} 
          label="Pending Fees" 
          value={formatCurrency(summary?.fees?.total_pending || 0)}
          colorClass="text-amber-600" 
          bgClass="bg-amber-50"
          onClick={() => onTabChange('fees')}
        />
        <SummaryCard 
          icon={Heart} 
          label="Blood Group" 
          value={student.blood_group || 'Not Set'} 
          colorClass="text-red-600" 
          bgClass="bg-red-50"
        />
        <SummaryCard 
          icon={Info} 
          label="Current Class" 
          value={enrollment ? `${enrollment.class} - ${enrollment.section}` : 'N/A'} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50"
          onClick={() => onTabChange('identity')}
        />
      </div>

      <section className="p-5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 overflow-hidden relative">
        <div className="relative z-10">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">Academic Status</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black tracking-tighter mb-1">{summary?.academic?.status || 'N/A'}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Latest Exam Result</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black mb-1">{summary?.academic?.percentage || 0}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Average Grade</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <LayoutDashboard size={120} />
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Recent Remarks</p>
          {summary?.remark ? (
            <>
              <p className="text-sm italic text-gray-600 font-medium leading-relaxed">
                "{summary.remark.remark_text}"
              </p>
              <p className="text-[10px] font-bold text-indigo-600 mt-3">— {summary.remark.teacher_name}</p>
            </>
          ) : (
            <p className="text-xs font-medium text-gray-500 italic">No remarks recorded yet.</p>
          )}
        </div>
        <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Next Event</p>
          {summary?.next_event ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] font-black uppercase text-red-500 leading-none">
                  {new Date(summary.next_event.start_date).toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-sm font-black text-gray-900 leading-none">
                  {new Date(summary.next_event.start_date).getDate()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{summary.next_event.title}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  {summary.next_event.start_time ? summary.next_event.start_time.slice(0, 5) : '9:00 AM'} onwards
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-gray-500 italic">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  )
}
