import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { Users, GraduationCap, ArrowRight, ShieldCheck, MapPin } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'

export default function ParentWards() {
  usePageTitle('My Wards')
  const navigate = useNavigate()
  const { wards, selectedWardId, fetchWards, isLoading, selectWard } = useParentStore()

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  const handleSelectWard = (id) => {
    selectWard(id)
    navigate(ROUTES.PARENT_DASHBOARD)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <Users className="text-indigo-600" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Family Wards</h1>
          <p className="text-sm font-medium text-gray-500">Students linked to your guardian account</p>
        </div>
      </div>

      {isLoading && wards.length === 0 ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        </div>
      ) : wards.length === 0 ? (
        <EmptyState title="No students linked" description="Please contact the school administration to link your children." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wards.map(ward => (
            <div 
              key={ward.id} 
              onClick={() => handleSelectWard(ward.id)}
              className={`bg-white rounded-[32px] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedWardId === ward.id 
                  ? 'border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                  : 'border-gray-100 shadow-sm hover:border-indigo-200'
              }`}
            >
              {selectedWardId === ward.id && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                    <ShieldCheck size={14} />
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-5 mb-8">
                  <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-3xl font-black transition-transform group-hover:scale-105 ${
                    selectedWardId === ward.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {ward.first_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{ward.first_name} {ward.last_name}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{ward.admission_no}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest border border-green-100">Active Student</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-50 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <GraduationCap size={12} /> Class
                    </p>
                    <p className="text-sm font-black text-gray-900">{ward.class_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-50 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={12} /> Section
                    </p>
                    <p className="text-sm font-black text-gray-900">{ward.section_name || 'General'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrollment ID: {ward.enrollment_id}</span>
                  <div className="flex items-center gap-2 text-sm font-black text-indigo-600 group-hover:gap-4 transition-all">
                    Switch To Portal <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
