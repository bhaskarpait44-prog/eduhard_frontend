import { useEffect } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { CalendarCheck } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import WardSelector from '@/components/parent/WardSelector'
import { formatDate } from '@/utils/helpers'

export default function ParentAttendance() {
  usePageTitle('Attendance')
  const { 
    wards, selectedWardId, fetchWards, 
    isDetailsLoading, attendance, attendanceSummary
  } = useParentStore()

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <CalendarCheck className="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Attendance Record</h1>
            <p className="text-sm font-medium text-gray-500">Daily presence and punctuality tracking</p>
          </div>
        </div>
        <WardSelector />
      </div>

      {/* ── Analytical Summary ── */}
      {!isDetailsLoading && attendanceSummary && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              %
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attendance Rate</p>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">{attendanceSummary.percentage}%</h3>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              G
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Letter Grade</p>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">{attendanceSummary.grade}</h3>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              W
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Working Days</p>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">
                {attendanceSummary.presentCount} / {attendanceSummary.workingDays} Days
              </h3>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Absences</p>
              <h3 className="text-xl font-black text-gray-900 mt-0.5">{attendanceSummary.absentCount} Days</h3>
            </div>
          </div>
        </section>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        {isDetailsLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching records...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No records" description="No attendance records found for the selected ward." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Day</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-gray-900">{formatDate(record.date)}</td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">{formatDate(record.date, 'EEEE')}</td>
                    <td className="px-8 py-5 text-center">
                      <Badge
                        variant={
                          record.status === 'present' ? 'green' :
                          record.status === 'absent' ? 'red' :
                          record.status === 'late' ? 'yellow' :
                          record.status === 'half_day' ? 'blue' :
                          record.status === 'holiday' ? 'grey' : 'grey'
                        }
                        className="rounded-lg"
                      >
                        {record.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500 italic">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
