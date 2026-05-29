import { Users, User, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/app'

const SiblingCard = ({ sibling }) => {
  const navigate = useNavigate()
  
  return (
    <div 
      onClick={() => navigate(`${ROUTES.STUDENTS}/${sibling.id}`)}
      className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer group min-w-0"
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
          {sibling.first_name[0]}{sibling.last_name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
            {sibling.first_name} {sibling.last_name}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
            {sibling.class_name} {sibling.section_name} • {sibling.admission_no}
          </p>
        </div>
      </div>
      <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
    </div>
  )
}

export default function TabFamily({ student }) {
  const siblings = student?.siblings || []
  
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Siblings in School</h3>
        </div>
        
        {siblings.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
            <User size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No siblings registered in the system.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {siblings.map(sibling => (
              <SiblingCard key={sibling.id} sibling={sibling} />
            ))}
          </div>
        )}
      </section>

      <section className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-100">
        <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 mb-3">Family Information</h4>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Primary Parent Email</p>
            <p className="text-sm font-bold text-amber-900 break-all">{student.parent_email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Family ID</p>
            <p className="text-sm font-bold text-amber-900">FAM-{String(student.family_id).padStart(5, '0')}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
