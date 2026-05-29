import React from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AttendanceCalendar({ year, month, records = [] }) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const recordMap = records.reduce((acc, r) => {
    const day = new Date(r.date).getDate()
    acc[day] = r.status
    return acc
  }, {})

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 text-white shadow-emerald-200'
      case 'absent':  return 'bg-red-500 text-white shadow-red-200'
      case 'late':    return 'bg-amber-500 text-white shadow-amber-200'
      case 'half_day': return 'bg-blue-500 text-white shadow-blue-200'
      case 'holiday': return 'bg-gray-100 text-gray-400'
      default:        return 'bg-white text-gray-400 border border-gray-100'
    }
  }

  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] font-black text-gray-400 uppercase text-center py-2 tracking-widest">
            {d}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} className="aspect-square" />
        ))}
        
        {days.map(day => {
          const status = recordMap[day]
          return (
            <div 
              key={day} 
              className={`aspect-square rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-sm ${getStatusColor(status)}`}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center border-t border-gray-100 pt-4 px-2">
        <LegendItem color="bg-emerald-500" label="Pres" />
        <LegendItem color="bg-red-500" label="Abs" />
        <LegendItem color="bg-amber-500" label="Late" />
        <LegendItem color="bg-blue-500" label="Half" />
        <LegendItem color="bg-gray-100" label="None" />
      </div>
    </div>
  )
}

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
  </div>
)
