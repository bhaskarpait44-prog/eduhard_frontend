import { useEffect, useState } from 'react'
import { Clock, Calendar, GraduationCap } from 'lucide-react'
import { getInitials } from '@/utils/helpers'
import api from '@/api/axios'
import EmptyState from '@/components/ui/EmptyState'

const TabTimeTable = ({ studentId }) => {
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.get(`/students/${studentId}/timetable`)
        setTimetable(res.data?.timetable || [])
      } catch (err) {
        console.error('Failed to fetch timetable', err)
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetchTimetable()
  }, [studentId])

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-64 bg-gray-50 rounded-xl border border-gray-100" />
      ))}
    </div>
  )

  if (timetable.length === 0) return (
    <EmptyState
      icon={Calendar}
      title="No timetable found"
      description="The weekly schedule for this student hasn't been set up yet."
      className="py-12"
    />
  )

  // Group by day
  const grouped = days.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day_of_week === day)
    return acc
  }, {})

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Clock size={16} className="text-indigo-600" /> Weekly Schedule
        </h3>
      </div>

      <div className="flex overflow-x-auto divide-x divide-gray-100 no-scrollbar">
        {days.map(day => {
          const slots = grouped[day]
          if (slots.length === 0) return null

          return (
            <div key={day} className="space-y-4 p-4 min-w-[220px] flex-1">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest text-center border-b pb-3 mb-6">
                {day}
              </h4>
              <div className="space-y-4">
                {slots.map(slot => (
                  <Slot 
                    key={slot.id}
                    subject={slot.subject_name} 
                    time={`${slot.start_time} - ${slot.end_time}`} 
                    teacher={slot.teacher_name} 
                    room={slot.room_number}
                    color={getSlotColor(slot.period_number)} 
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const getSlotColor = (period) => {
  const colors = [
    'bg-rose-50 border-rose-100 text-rose-700 shadow-rose-100/50',
    'bg-sky-50 border-sky-100 text-sky-700 shadow-sky-100/50',
    'bg-orange-50 border-orange-100 text-orange-700 shadow-orange-100/50',
    'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100/50',
    'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-indigo-100/50',
    'bg-purple-50 border-purple-100 text-purple-700 shadow-purple-100/50',
    'bg-amber-50 border-amber-100 text-amber-700 shadow-amber-100/50',
  ]
  return colors[(period - 1) % colors.length]
}

const Slot = ({ subject, time, teacher, room, color }) => (
  <div className={`p-3 rounded-xl border shadow-sm transition-transform hover:scale-[1.02] cursor-default ${color} space-y-3`}>
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 opacity-70">
        <Clock size={12} strokeWidth={2.5} />
        <span className="text-[10px] font-black uppercase tracking-tighter">{time}</span>
      </div>
      <p className="text-xs font-black">Subject : {subject}</p>
      {room && <p className="text-[10px] font-bold opacity-80 uppercase tracking-wide">Room: {room}</p>}
    </div>
    <div className="flex items-center gap-2 pt-2 border-t border-current border-dashed border-opacity-20">
      <div className="h-6 w-6 rounded-lg overflow-hidden bg-white/50 border border-current border-opacity-20 flex items-center justify-center font-black text-[10px]">
        {getInitials(teacher)}
      </div>
      <span className="text-[10px] font-black tracking-tight">{teacher}</span>
    </div>
  </div>
)

export default TabTimeTable
