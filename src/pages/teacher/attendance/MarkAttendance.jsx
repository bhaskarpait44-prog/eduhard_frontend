import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import AttendanceMarker from '@/components/teacher/AttendanceMarker'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

const MarkAttendance = () => {
  usePageTitle('Mark Attendance')

  const location = useLocation()
  const { toastSuccess, toastError } = useToast()
  const {
    assignments,
    todaySchedule,
    loadingAssignments,
    markingContext,
    setMarkingContext,
    studentPayload,
    loadingStudents,
    savingAttendance,
    studentError,
    loadStudents,
    submitAttendance,
  } = useAttendance()
  const [showNextPrompt, setShowNextPrompt] = useState(false)
  const autoLoadKeyRef = useRef('')

  const markableAssignments = useMemo(() => {
    return assignments.filter((a) => a.is_class_teacher)
  }, [assignments])

  useEffect(() => {
    const incoming = location.state
    if (!incoming?.class_id || !incoming?.section_id || loadingAssignments) return

    const match = markableAssignments.find(
      (a) =>
        String(a.class_id) === String(incoming.class_id) &&
        String(a.section_id) === String(incoming.section_id)
    )
    if (!match) return

    setMarkingContext((prev) => ({
      ...prev,
      class_id: String(match.class_id),
      section_id: String(match.section_id),
      subject_id: match.subject_id ? String(match.subject_id) : '',
      assignment_role: match.is_class_teacher ? 'class_teacher' : 'subject_teacher',
    }))
  }, [location.state, loadingAssignments, markableAssignments, setMarkingContext])

  useEffect(() => {
    if (loadingAssignments) return
    if (!markingContext.class_id || !markingContext.section_id || !markingContext.date) return

    const match = markableAssignments.find(
      (a) =>
        String(a.class_id) === String(markingContext.class_id) &&
        String(a.section_id) === String(markingContext.section_id) &&
        (markingContext.assignment_role === 'class_teacher' ? a.is_class_teacher : String(a.subject_id || '') === String(markingContext.subject_id || ''))
    )
    if (!match) return

    const nextKey = `${markingContext.class_id}:${markingContext.section_id}:${markingContext.subject_id || ''}:${markingContext.date}`
    if (autoLoadKeyRef.current === nextKey) return

    autoLoadKeyRef.current = nextKey
    loadStudents({
      class_id: String(markingContext.class_id),
      section_id: String(markingContext.section_id),
      subject_id: markingContext.subject_id ? String(markingContext.subject_id) : undefined,
      date: markingContext.date,
    }).catch((error) => {
      autoLoadKeyRef.current = ''
      toastError(error?.message || 'Failed to load students.')
    })
  }, [
    loadingAssignments,
    markableAssignments,
    markingContext.assignment_role,
    markingContext.class_id,
    markingContext.section_id,
    markingContext.subject_id,
    markingContext.date,
    loadStudents,
    toastError,
  ])

  const nextPending = useMemo(() => {
    const pendingSchedule = todaySchedule.find(
      (item) =>
        item.status !== 'done' &&
        !(
          String(item.class_id) === String(markingContext.class_id) &&
          String(item.section_id) === String(markingContext.section_id)
        )
    )
    if (!pendingSchedule) return null

    return (
      markableAssignments.find(
        (a) =>
          String(a.class_id) === String(pendingSchedule.class_id) &&
          String(a.section_id) === String(pendingSchedule.section_id)
      ) || null
    )
  }, [todaySchedule, markableAssignments, markingContext.class_id, markingContext.section_id])

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">

      {/* Empty state */}
      {!loadingAssignments && markableAssignments.length === 0 && (
        <EmptyState
          title="No assigned classes"
          description="You can view attendance reports once assigned."
        />
      )}

      {/* Attendance Marker */}
      {(loadingAssignments || markableAssignments.length > 0) && (
        <AttendanceMarker
          assignments={markableAssignments}
          context={markingContext}
          setContext={setMarkingContext}
          payload={studentPayload}
          loadingStudents={loadingStudents || loadingAssignments}
          savingAttendance={savingAttendance}
          error={studentError}
          onLoad={async (params) => {
            try {
              await loadStudents(params)
            } catch (error) {
              toastError(error?.message || 'Failed to load.')
            }
          }}
          onSubmit={async (payload) => {
            try {
              await submitAttendance(payload)
              await loadStudents({
                class_id: String(markingContext.class_id),
                section_id: String(markingContext.section_id),
                subject_id: markingContext.subject_id ? String(markingContext.subject_id) : undefined,
                date: markingContext.date,
              })
              toastSuccess('Attendance submitted successfully.')
              setShowNextPrompt(true)
            } catch (error) {
              toastError(error?.message || 'Failed to submit.')
            }
          }}
        />
      )}

      {/* Next pending — slim inline banner */}
      {showNextPrompt && nextPending && (
        <div className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50/60 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-900 truncate">
              Attendance saved.{' '}
              <span className="font-bold underline underline-offset-2">{nextPending.class_name} {nextPending.section_name}</span>{' '}
              still needs attendance.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNextPrompt(false)}
              className="text-emerald-700 hover:bg-emerald-100 rounded-lg"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMarkingContext((prev) => ({
                  ...prev,
                  class_id: String(nextPending.class_id),
                  section_id: String(nextPending.section_id),
                  subject_id: nextPending.subject_id ? String(nextPending.subject_id) : '',
                  assignment_role: nextPending.is_class_teacher ? 'class_teacher' : 'subject_teacher',
                }))
                setShowNextPrompt(false)
              }}
              className="bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
              iconRight={<ArrowRight size={14} />}
            >
              Mark Now
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}

export default MarkAttendance
