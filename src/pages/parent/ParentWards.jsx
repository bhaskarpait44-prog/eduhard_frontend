import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import { getWards } from '@/api/parentApi'
import { Users, GraduationCap, ArrowRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

export default function ParentWards() {
  usePageTitle('My Wards')
  const [wards, setWards] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getWards()
      .then(res => setWards(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
          <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">My Wards</h1>
          <p className="text-sm font-medium text-gray-500">List of students linked to your account</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : wards.length === 0 ? (
        <EmptyState title="No students linked" description="Please contact the school administration to link your children." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wards.map(ward => (
            <div key={ward.id} className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {ward.first_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">{ward.first_name} {ward.last_name}</h2>
                  <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                    {ward.admission_no}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <GraduationCap size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Class</span>
                  </div>
                  <span className="text-sm font-black">{ward.class_name} - {ward.section_name}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                <button className="flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                  View Profile <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
