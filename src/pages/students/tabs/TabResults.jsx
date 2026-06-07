import { useEffect, useState } from 'react'
import { GraduationCap, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'
import axios from 'axios'
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
        // We use the public/portal API to get student-specific exam list
        // Note: Admin might need a specific endpoint, but usually we can reuse the portal logic
        const res = await axios.get(`/api/student-portal/results`, { params: { studentId } })
        setExams(res.data?.data?.exams || [])
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
        const res = await axios.get(`/api/student-portal/results/${examId}`, { params: { studentId } })
        setExamDetails(prev => ({ ...prev, [examId]: res.data?.data }))
      } catch (err) {
        console.error('Failed to fetch exam details', err)
      }
    }
    setExpandedExam(examId)
  }

  if (loading) return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>

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
          <div key={exam.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all">
            <button 
              onClick={() => toggleExam(exam.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${exam.student_status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 text-left">{exam.name}</h4>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{exam.exam_type?.replace('_', ' ')}</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-50 p-4 sm:p-6 bg-gray-50/30 space-y-6 animate-in slide-in-from-top-2 duration-300">
                {!details ? (
                  <div className="flex items-center justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Max Marks</th>
                            <th className="px-4 py-3 text-center">Min Marks</th>
                            <th className="px-4 py-3 text-right">Marks Obtained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {details.subjects.map(sub => (
                            <tr key={sub.subject_id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-700">{sub.subject_name}</td>
                              <td className="px-4 py-3 text-gray-500 font-medium">{sub.combined_total_marks || sub.total_marks}</td>
                              <td className="px-4 py-3 text-center text-gray-500 font-medium">{sub.combined_passing_marks || sub.passing_marks}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-black ${sub.status === 'fail' ? 'text-red-600' : 'text-indigo-600'}`}>
                                  {sub.is_absent ? 'ABSENT' : sub.total_obtained ?? '--'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-indigo-900 rounded-xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-100">
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
