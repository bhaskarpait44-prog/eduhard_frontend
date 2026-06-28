import { useEffect, useState, useRef } from 'react'
import { Book, ShieldCheck, ShieldAlert, Trash2, Plus } from 'lucide-react'
import * as studentSubjectsApi from '@/api/studentSubjectsApi'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import useSessionStore from '@/store/sessionStore'
import EmptyState from '@/components/ui/EmptyState'

const TabEnrolledSubjects = ({ studentId, isAdmin }) => {
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentSession } = useSessionStore()
  const { toastError, toastSuccess } = useToast()
  const autoAssignAttempted = useRef(false)

  useEffect(() => {
    if (studentId && currentSession?.id) {
      autoAssignAttempted.current = false
      fetchSubjects()
    }
  }, [studentId, currentSession?.id])

  const fetchSubjects = async () => {
    setIsLoading(true)
    try {
      const res = await studentSubjectsApi.getStudentSubjects(studentId, currentSession.id)
      const data = res.data || []
      setSubjects(data)
      if (data.length === 0 && isAdmin && !autoAssignAttempted.current) {
        autoAssignAttempted.current = true
        await handleAutoAssignSilent()
      }
    } catch (err) {
      toastError('Failed to load enrolled subjects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSubject = async (subjectId) => {
    try {
      await studentSubjectsApi.removeSubject(studentId, currentSession.id, subjectId)
      toastSuccess('Subject removed')
      fetchSubjects()
    } catch (err) {
      toastError(err.message || 'Failed to remove subject')
    }
  }

  const handleAutoAssignSilent = async () => {
    try {
      await studentSubjectsApi.autoAssignCoreSubjects({ student_id: studentId, session_id: currentSession.id })
      toastSuccess('Core subjects assigned automatically')
      const res = await studentSubjectsApi.getStudentSubjects(studentId, currentSession.id)
      setSubjects(res.data || [])
    } catch (err) {
      toastError(err.message || 'Failed to auto-assign subjects')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Enrolled Subjects
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {subjects.length} subjects assigned for {currentSession?.name}
          </p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={Book}
          title="No subjects assigned"
          description="This student has not been assigned any subjects for the current session."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {subjects.map(sub => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 group transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sub.assigned_is_core ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-gray-50 text-gray-500 dark:bg-gray-800'}`}>
                  <Book size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{sub.subject_name}</p>
                    <Badge variant={sub.assigned_is_core ? 'blue' : 'grey'} className="text-[10px] uppercase">
                      {sub.assigned_is_core ? 'Core' : 'Elective'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Code: {sub.code} • Type: <span className="capitalize">{sub.subject_type}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Combined Marks</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {Number(sub.combined_total_marks).toFixed(0)}
                  </p>
                </div>
                
                {isAdmin && (
                  <button
                    onClick={() => handleRemoveSubject(sub.subject_id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Subject"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
        <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          Subject assignments are specific to the <strong>{currentSession?.name}</strong> session. 
          Core subjects are usually assigned automatically based on the student's class and stream.
        </p>
      </div>
    </div>
  )
}

export default TabEnrolledSubjects
