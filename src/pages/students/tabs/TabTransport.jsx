import { Truck, MapPin, Map, Navigation } from 'lucide-react'

export default function TabTransport({ student }) {
  const hasTransport = !!student.transport_stop_id
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
          <Truck size={18} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Transport Details</h3>
      </div>

      {!hasTransport ? (
        <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
          <Truck size={40} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400 font-medium">Student is not assigned to any school transport route.</p>
          <p className="text-xs text-gray-300 mt-1 max-w-xs">You can assign a route from the Transport management section.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Map size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Route</p>
              <p className="text-sm font-bold text-gray-900 truncate">{student.transport_route || 'Not Specified'}</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pick-up/Drop Stop</p>
              <p className="text-sm font-bold text-gray-900 truncate">{student.transport_stop || 'Not Specified'}</p>
            </div>
          </div>

          <div className="sm:col-span-2 p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <Navigation size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Live Tracking</p>
              <p className="text-xs text-emerald-700 font-medium">Tracking is available for this route via the Parent App.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
