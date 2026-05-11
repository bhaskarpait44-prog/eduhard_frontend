import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import { getWards, getWardAttendance } from '@/api/parentApi'
import { CalendarCheck, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/helpers'

export default function ParentAttendance() {
  usePageTitle('Attendance')
  const [wards, setWards] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getWards().then(res => {
      setWards(res.data)
      if (res.data.length > 0) setSelectedWard(res.data[0])
    })
  }, [])

  useEffect(() => {
    if (selectedWard) {
      setIsLoading(true)
      getWardAttendance(selectedWard.id)
        .then(res => setAttendance(res.data))
        .finally(() => setIsLoading(false))
    }
  }, [selectedWard])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
            <CalendarCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Attendance</h1>
            <p className="text-sm font-medium text-gray-500">Track daily attendance records</p>
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

      <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No records" description="No attendance records found for the selected ward." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Day</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {attendance.map((record, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold">{formatDate(record.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(record.date, 'EEEE')}</td>
                    <td className="px-6 py-4">
                      <Badge variant={record.status === 'present' ? 'green' : record.status === 'absent' ? 'red' : 'amber'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.remarks || '-'}</td>
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
