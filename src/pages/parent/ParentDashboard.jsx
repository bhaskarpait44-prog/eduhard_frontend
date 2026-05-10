import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  Wallet,
  BookOpen,
  LineChart,
  ChevronRight,
  ClipboardList
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, formatCurrency } from '@/utils/helpers'

export default function ParentDashboard() {
  usePageTitle('Parent Portal')
  const { wards, fetchWards, isLoading, fetchWardDetails, attendance, fees, results, homework } = useParentStore()
  const [selectedWard, setSelectedWard] = useState(null)

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  useEffect(() => {
    if (wards.length > 0 && !selectedWard) {
      setSelectedWard(wards[0])
    }
  }, [wards, selectedWard])

  useEffect(() => {
    if (selectedWard) {
      fetchWardDetails(selectedWard.id)
    }
  }, [selectedWard, fetchWardDetails])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Parent Portal</h1>
            <p className="text-sm font-medium text-gray-500">Monitor your children's progress and activities</p>
          </div>
        </div>

        {wards.length > 1 && (
          <div className="flex items-center gap-2">
            {wards.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWard(w)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedWard?.id === w.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {w.first_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && !selectedWard && (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {!isLoading && wards.length === 0 && (
        <div className="py-12">
          <EmptyState title="No students linked" description="Please contact the school administration to link your children to this account." />
        </div>
      )}

      {selectedWard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile & Attendance */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {selectedWard.first_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{selectedWard.first_name} {selectedWard.last_name}</h2>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">Class {selectedWard.class_name} {selectedWard.section_name}</p>
                <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block mt-2">
                  {selectedWard.admission_no}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="text-emerald-500" size={20} />
                  <h3 className="text-base font-bold">Recent Attendance</h3>
                </div>
              </div>
              <div className="space-y-2">
                {attendance.length > 0 ? attendance.slice(0, 5).map(a => (
                  <div key={a.date} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                    <span className="text-sm font-medium">{formatDate(a.date, 'short')}</span>
                    <Badge variant={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'amber'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
                      {a.status}
                    </Badge>
                  </div>
                )) : <p className="text-sm text-gray-500 italic">No attendance records found.</p>}
              </div>
            </div>
          </div>

          {/* Right Column: Fees, Results & Homework */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-amber-500" size={20} />
                  <h3 className="text-base font-bold">Pending Homework</h3>
                </div>
              </div>
              <div className="space-y-3">
                {homework.length > 0 ? homework.slice(0, 5).map(h => (
                  <div key={h.id} className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{h.subject_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{h.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Due {formatDate(h.due_date, 'short')}</p>
                        <p className="text-[9px] text-gray-500 mt-1">By {h.teacher_name}</p>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500 italic">No homework assigned yet.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="text-blue-500" size={20} />
                  <h3 className="text-base font-bold">Fee Dues & Invoices</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount Due</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {fees.length > 0 ? fees.map(f => (
                      <tr key={f.id}>
                        <td className="px-4 py-3 text-sm font-bold">{f.fee_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(f.due_date, 'short')}</td>
                        <td className="px-4 py-3 text-sm font-black text-right">{formatCurrency(f.amount_due)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={f.status === 'paid' ? 'green' : f.status === 'overdue' ? 'red' : 'amber'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
                            {f.status}
                          </Badge>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="4" className="py-6 text-center text-sm text-gray-500 italic">No fee invoices found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LineChart className="text-purple-500" size={20} />
                  <h3 className="text-base font-bold">Academic Results</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.length > 0 ? results.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">{r.session_name}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-black text-purple-700 dark:text-purple-300">{r.percentage}%</p>
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">Grade {r.grade}</p>
                      </div>
                      <Badge variant={r.is_promoted ? 'green' : 'red'}>{r.is_promoted ? 'Promoted' : 'Not Promoted'}</Badge>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500 italic col-span-2">No academic results published yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
