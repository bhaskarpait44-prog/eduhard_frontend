import { useEffect, useState } from 'react'
import { GraduationCap, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '@/api/axios'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatPercent } from '@/utils/helpers'

const TabResults = ({ studentId }) => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedExam, setExpandedExam] = useState(null)
  const [examDetails, setExamDetails] = useState({})

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Use admin-facing endpoint instead of student portal
        const res = await api.get(`/students/${studentId}/results`)
        setExams(res.data?.exams || [])
      } catch (err) {
        console.error('Failed to fetch exams', err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [studentId])

  const toggleExam = async (examId) => {
    if (expandedExam === examId) {
      setExpandedExam(null)
      return
    }

    if (!examDetails[examId]) {
      try {
        const res = await api.get(`/students/${studentId}/results/${examId}`)
        setExamDetails(prev => ({ ...prev, [examId]: res.data }))
      } catch (err) {
        console.error('Failed to fetch exam details', err)
      }
    }
    setExpandedExam(examId)
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
    </div>
  )

  if (exams.length === 0) return (
    <EmptyState
      icon={GraduationCap}
      title="No results found"
      description="Exam results will appear here once they are published."
      className="py-12"
    />
  )

  return (
    <div className="space-y-4">
      {exams.map(exam => {
        const isOpen = expandedExam === exam.id
        const details = examDetails[exam.id]
        
        return (
          <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all">
            <button 
              onClick={() => toggleExam(exam.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${exam.student_status === 'published' ? 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 text-left">{exam.name}</h4>
                  <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">{exam.exam_type?.replace('_', ' ')}</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-4 sm:p-6 bg-gray-50/30 dark:bg-gray-900/40 space-y-6 animate-in slide-in-from-top-2 duration-300">
                {!details ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/60 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Max Marks</th>
                            <th className="px-4 py-3 text-center">Min Marks</th>
                            <th className="px-4 py-3 text-right">Marks Obtained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                          {details.subjects.map(sub => (
                            <tr key={sub.subject_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">{sub.subject_name}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{sub.combined_total_marks || sub.total_marks}</td>
                              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-medium">{sub.combined_passing_marks || sub.passing_marks}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-black ${sub.status === 'fail' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                  {sub.is_absent ? 'ABSENT' : sub.total_obtained ?? '--'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-indigo-900 dark:bg-indigo-950 rounded-xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-100 dark:shadow-none border border-indigo-800/40">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">Rank</p>
                          <p className="text-sm font-black">Rank : {details.summary?.rank || '--'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">Total Marks</p>
                          <p className="text-sm font-black">Total : {details.subjects.reduce((sum, s) => sum + (s.combined_total_marks || s.total_marks || 0), 0)}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">Marks Obtained</p>
                          <p className="text-sm font-black">Marks Obtained : {details.subjects.reduce((sum, s) => sum + (s.total_obtained || 0), 0)}</p>
                        </div>
                        <div className="h-8 w-px bg-white/20 hidden sm:block" />
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">Overall</p>
                          <p className="text-sm font-black">Percentage : {details.summary?.percentage}%  <span className="ml-2 text-indigo-300">Result : {details.summary?.result_status?.toUpperCase()}</span></p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TabResults
