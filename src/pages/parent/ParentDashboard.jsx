import { useEffect, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { 
  Users, CalendarCheck, Wallet, BookOpen, 
  LineChart, ChevronRight, ClipboardList, Activity
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import WardSelector from '@/components/parent/WardSelector'
import { formatDate, formatCurrency } from '@/utils/helpers'

const DashboardCard = ({ title, icon: Icon, color, children, badge }) => (
  <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl" style={{ backgroundColor: `${color}10`, color }}>
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      {badge}
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
)

export default function ParentDashboard() {
  usePageTitle('Parent Portal')
  const { 
    wards, selectedWardId, fetchWards, 
    isLoading, isDetailsLoading, 
    attendance, fees, results, homework 
  } = useParentStore()

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  const selectedWard = useMemo(() => 
    wards.find(w => w.id === selectedWardId), 
    [wards, selectedWardId]
  )

  if (isLoading && wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Portal...</p>
      </div>
    )
  }

  if (wards.length === 0) {
    return <EmptyState title="No students linked" description="Please contact the school administration to link your children to this account." />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Parent Portal</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Real-time tracking for your children</p>
        </div>
        <WardSelector />
      </div>

      {selectedWard && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl">
                  {selectedWard.first_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Selected Ward</p>
                  <p className="text-base font-black truncate">{selectedWard.first_name} {selectedWard.last_name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <span className="text-xs font-bold text-indigo-100">Admission No</span>
                <span className="text-xs font-mono font-bold bg-white/10 px-2 py-1 rounded-lg">{selectedWard.admission_no}</span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Activity size={18} className="text-emerald-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance</span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {attendance.filter(a => a.status === 'present').length}/{Math.max(attendance.length, 1)}
              </p>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">Last 60 days overview</p>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={18} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Fees</span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(fees.filter(f => f.status !== 'paid').reduce((acc, f) => acc + Number(f.amount_due), 0))}
              </p>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">{fees.filter(f => f.status !== 'paid').length} unpaid invoices</p>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <LineChart size={18} className="text-purple-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Result</span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {results[0]?.percentage ? `${results[0].percentage}%` : 'N/A'}
              </p>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">{results[0]?.session_name || 'No records'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <DashboardCard title="Fee Ledger" icon={Wallet} color="#f59e0b">
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-y border-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {fees.length > 0 ? fees.slice(0, 5).map(f => (
                        <tr key={f.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{f.fee_name}</p>
                            <p className="text-[10px] text-gray-400">Due {formatDate(f.due_date, 'short')}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(f.amount_due)}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={f.status === 'paid' ? 'green' : f.status === 'overdue' ? 'red' : 'amber'} size="sm">
                              {f.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" className="px-6 py-10 text-center text-sm text-gray-400 italic">No fee history found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>

              <DashboardCard title="Academic Performance" icon={LineChart} color="#8b5cf6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.length > 0 ? results.map(r => (
                    <div key={r.id} className="p-5 rounded-[24px] bg-purple-50/50 border border-purple-100">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-2">{r.session_name}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-black text-purple-900">{r.percentage}%</p>
                          <p className="text-xs font-bold text-purple-600 mt-1 uppercase">Grade {r.grade}</p>
                        </div>
                        <Badge variant={r.is_promoted ? 'green' : 'red'} className="rounded-lg py-1">
                          {r.is_promoted ? 'Promoted' : 'Held Back'}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-10 text-center text-sm text-gray-400 italic bg-gray-50 rounded-[24px]">
                      No results published yet.
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <DashboardCard title="Homework" icon={ClipboardList} color="#ec4899">
                <div className="space-y-4">
                  {homework.length > 0 ? homework.slice(0, 5).map(h => (
                    <div key={h.id} className="p-4 rounded-[24px] bg-pink-50/50 border border-pink-100 group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500">{h.subject_name}</span>
                        <span className="text-[10px] font-bold text-pink-700 bg-white px-2 py-0.5 rounded-full border border-pink-100 shadow-sm">
                          {formatDate(h.due_date, 'short')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2">{h.title || 'Assignment'}</p>
                      <p className="text-[11px] text-gray-500 italic">By {h.teacher_name}</p>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-sm text-gray-400 italic bg-gray-50 rounded-[24px]">
                      No active homework.
                    </div>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard title="Recent Attendance" icon={CalendarCheck} color="#10b981">
                <div className="space-y-2">
                  {attendance.length > 0 ? attendance.slice(0, 7).map(a => (
                    <div key={a.date} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{formatDate(a.date, 'short')}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{formatDate(a.date, 'EEEE')}</span>
                      </div>
                      <Badge variant={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'amber'} size="sm" className="rounded-lg">
                        {a.status}
                      </Badge>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-sm text-gray-400 italic bg-gray-50 rounded-[24px]">
                      No attendance data.
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
