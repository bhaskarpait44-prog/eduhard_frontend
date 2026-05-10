import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useTransportStore from '@/store/transportStore'
import useStudentStore from '@/store/studentStore'
import { 
  Bus, 
  MapPin, 
  Plus, 
  Search,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatCurrency } from '@/utils/helpers'

export default function TransportManager() {
  usePageTitle('Transport Management')
  const { toastSuccess, toastError } = useToast()
  const { routes, isLoading, fetchRoutes, createRoute, updateRoute, deleteRoute, createStop, updateStop, deleteStop, assignStudent } = useTransportStore()
  const { students, fetchStudents } = useStudentStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRoutes, setExpandedRoutes] = useState([])

  // Modals
  const [routeModalOpen, setRouteModalOpen] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [routeForm, setRouteForm] = useState({ name: '', vehicle_number: '', driver_name: '', driver_phone: '' })

  const [stopModalOpen, setStopModalOpen] = useState(false)
  const [editingStopId, setEditingStopId] = useState(null)
  const [stopForm, setStopForm] = useState({ route_id: '', name: '', pickup_time: '', drop_time: '', fare: '' })

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ student_id: '', transport_stop_id: '' })

  useEffect(() => {
    fetchRoutes()
    fetchStudents()
  }, [fetchRoutes, fetchStudents])

  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return routes
    const q = searchQuery.toLowerCase()
    return routes.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.driver_name?.toLowerCase().includes(q) ||
      r.stops?.some(s => s.name.toLowerCase().includes(q))
    )
  }, [routes, searchQuery])

  const toggleRoute = (id) => setExpandedRoutes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleRouteSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRouteId) await updateRoute(editingRouteId, routeForm)
      else await createRoute(routeForm)
      toastSuccess(`Route ${editingRouteId ? 'updated' : 'created'}`)
      setRouteModalOpen(false)
    } catch (err) { toastError(err.message || 'Operation failed') }
  }

  const handleStopSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStopId) await updateStop(editingStopId, stopForm)
      else await createStop(stopForm.route_id, stopForm)
      toastSuccess(`Stop ${editingStopId ? 'updated' : 'created'}`)
      setStopModalOpen(false)
    } catch (err) { toastError(err.message || 'Operation failed') }
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    try {
      await assignStudent(assignForm)
      toastSuccess('Student assigned to stop')
      setAssignModalOpen(false)
    } catch (err) { toastError(err.message || 'Assignment failed') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl"><Bus className="text-indigo-600 dark:text-indigo-400" size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Transport Management</h1>
            <p className="text-sm font-medium text-gray-500">Manage routes, stops, and assignments</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search routes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64" />
          </div>
          <Button icon={Plus} onClick={() => { setEditingRouteId(null); setRouteForm({name:'',vehicle_number:'',driver_name:'',driver_phone:''}); setRouteModalOpen(true) }} className="rounded-2xl">
            Add Route
          </Button>
          <Button icon={Users} variant="secondary" onClick={() => { setAssignForm({student_id:'',transport_stop_id:''}); setAssignModalOpen(true) }} className="rounded-2xl">
            Assign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoutes.length > 0 ? filteredRoutes.map(route => {
          const isExpanded = expandedRoutes.includes(route.id)
          return (
            <div key={route.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 cursor-pointer" onClick={() => toggleRoute(route.id)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {route.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Vehicle: {route.vehicle_number || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">Driver: {route.driver_name || 'N/A'} {route.driver_phone ? `(${route.driver_phone})` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditingRouteId(route.id); setRouteForm({name:route.name,vehicle_number:route.vehicle_number,driver_name:route.driver_name,driver_phone:route.driver_phone}); setRouteModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={16}/></button>
                    <button onClick={() => { if(window.confirm('Delete this route?')) deleteRoute(route.id) }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                    <button onClick={() => toggleRoute(route.id)} className="p-1.5 text-gray-400">
                      {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Stops ({route.stops?.length || 0})</p>
                    <Button size="sm" variant="secondary" icon={Plus} onClick={() => { setEditingStopId(null); setStopForm({route_id: route.id, name:'', pickup_time:'', drop_time:'', fare:''}); setStopModalOpen(true) }}>Add Stop</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {route.stops?.length > 0 ? route.stops.map((stop, idx) => (
                      <div key={stop.id} className="relative pl-6">
                        {/* Timeline line */}
                        {idx !== route.stops.length - 1 && <div className="absolute left-2 top-6 bottom-[-20px] w-0.5 bg-gray-200 dark:bg-gray-700" />}
                        <div className="absolute left-0.5 top-1 w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-white dark:bg-gray-900 z-10" />

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl flex justify-between items-start group">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {stop.name}
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded-md">{formatCurrency(stop.fare)}/mo</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Pickup: {stop.pickup_time || '--:--'} | Drop: {stop.drop_time || '--:--'}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5"><Users size={10} className="inline mr-1"/> {stop.student_count} Students Assigned</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingStopId(stop.id); setStopForm({route_id: route.id, name: stop.name, pickup_time: stop.pickup_time||'', drop_time: stop.drop_time||'', fare: stop.fare}); setStopModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-indigo-600"><Pencil size={14}/></button>
                            <button onClick={() => { if(window.confirm('Delete this stop?')) deleteStop(stop.id) }} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-500 italic">No stops defined for this route.</p>}
                  </div>
                </div>
              )}
            </div>
          )
        }) : (
          <div className="col-span-full py-12"><EmptyState title="No routes found" description="Create a transport route to get started." /></div>
        )}
      </div>

      <Modal open={routeModalOpen} onClose={() => !isLoading && setRouteModalOpen(false)} title={editingRouteId ? 'Edit Route' : 'Add Route'} size="sm">
        <form onSubmit={handleRouteSubmit} className="space-y-4">
          <Input label="Route Name" value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} required placeholder="e.g. Route A - Downtown" />
          <Input label="Vehicle Number" value={routeForm.vehicle_number} onChange={e => setRouteForm({...routeForm, vehicle_number: e.target.value})} placeholder="e.g. AB 12 C 3456" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Driver Name" value={routeForm.driver_name} onChange={e => setRouteForm({...routeForm, driver_name: e.target.value})} />
            <Input label="Driver Phone" value={routeForm.driver_phone} onChange={e => setRouteForm({...routeForm, driver_phone: e.target.value})} />
          </div>
          <div className="flex justify-end pt-4"><Button type="button" variant="secondary" onClick={() => setRouteModalOpen(false)} className="mr-2">Cancel</Button><Button type="submit" loading={isLoading}>Save Route</Button></div>
        </form>
      </Modal>

      <Modal open={stopModalOpen} onClose={() => !isLoading && setStopModalOpen(false)} title={editingStopId ? 'Edit Stop' : 'Add Stop'} size="sm">
        <form onSubmit={handleStopSubmit} className="space-y-4">
          <Input label="Stop Name" value={stopForm.name} onChange={e => setStopForm({...stopForm, name: e.target.value})} required placeholder="e.g. Central Library" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pickup Time" type="time" value={stopForm.pickup_time} onChange={e => setStopForm({...stopForm, pickup_time: e.target.value})} />
            <Input label="Drop Time" type="time" value={stopForm.drop_time} onChange={e => setStopForm({...stopForm, drop_time: e.target.value})} />
          </div>
          <Input label="Monthly Fare" type="number" step="0.01" min="0" value={stopForm.fare} onChange={e => setStopForm({...stopForm, fare: e.target.value})} required />
          <div className="flex justify-end pt-4"><Button type="button" variant="secondary" onClick={() => setStopModalOpen(false)} className="mr-2">Cancel</Button><Button type="submit" loading={isLoading}>Save Stop</Button></div>
        </form>
      </Modal>

      <Modal open={assignModalOpen} onClose={() => !isLoading && setAssignModalOpen(false)} title="Assign Student to Transport" size="sm">
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select 
            label="Student" 
            value={assignForm.student_id} 
            onChange={e => setAssignForm({...assignForm, student_id: e.target.value})} 
            options={students.map(s => ({value:String(s.id),label:`${s.first_name} ${s.last_name} (${s.admission_no})`}))} 
            required 
          />
          <Select 
            label="Transport Stop" 
            value={assignForm.transport_stop_id} 
            onChange={e => setAssignForm({...assignForm, transport_stop_id: e.target.value})} 
            options={[{value:'',label:'None (Unassign)'}, ...routes.flatMap(r => r.stops.map(s => ({value:String(s.id),label:`${r.name} - ${s.name} (${formatCurrency(s.fare)})`}))) ]} 
          />
          <div className="flex justify-end pt-4"><Button type="button" variant="secondary" onClick={() => setAssignModalOpen(false)} className="mr-2">Cancel</Button><Button type="submit" loading={isLoading}>Save Assignment</Button></div>
        </form>
      </Modal>
    </div>
  )
}
