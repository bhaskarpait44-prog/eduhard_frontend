import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, LayoutList, BarChart3, CalendarDays, ClipboardCheck, Info, Users, Clock, ChevronRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import AttendanceMarker from '@/components/teacher/AttendanceMarker'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'
import { cn } from '@/utils/helpers'

const MarkAttendance = () => {
  usePageTitle('Mark Attendance')

  const navigate = useNavigate()
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

  useEffect(() => {
    const incoming = location.state
    if (!incoming?.class_id || !incoming?.section_id || loadingAssignments) return

    const match = assignments.find(
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
  }, [location.state, loadingAssignments, assignments, setMarkingContext])

  useEffect(() => {
    if (loadingAssignments) return
    if (!markingContext.class_id || !markingContext.section_id || !markingContext.date) return

    const match = assignments.find(
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
    assignments,
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
      assignments.find(
        (a) =>
          String(a.class_id) === String(pendingSchedule.class_id) &&
          String(a.section_id) === String(pendingSchedule.section_id)
      ) || null
    )
  }, [todaySchedule, assignments, markingContext.class_id, markingContext.section_id])

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">

      {/* Empty state */}
      {!loadingAssignments && assignments.length === 0 && (
        <EmptyState
          title="No assigned classes"
          description="You can view attendance reports once assigned."
        />
      )}

      {/* Attendance Marker */}
      {(loadingAssignments || assignments.length > 0) && (
        <AttendanceMarker
          assignments={assignments}
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

      {/* Next pending prompt */}
      {showNextPrompt && nextPending && (
        <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-100 text-emerald-600 shadow-inner border border-emerald-200">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-base font-bold text-emerald-900 leading-tight">Great Work!</p>
                <p className="text-sm font-medium text-emerald-700 mt-1">
                  Attendance for <span className="font-bold underline">{nextPending.class_name}</span> is still pending.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNextPrompt(false)}
                className="h-11 px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 rounded-2xl transition-all active:scale-95"
              >
                Later
              </button>
              <button
                type="button"
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
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                Mark Now <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNextPrompt && studentPayload?.students?.length > 0 && (
        <section
          className="rounded-[28px] border bg-surface p-6 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-raised text-text-secondary shadow-sm">
                <Info size={24} />
              </div>
              <div>
                <p className="text-base font-bold text-text-primary tracking-tight">Register & Reports</p>
                <p className="text-sm font-medium text-text-muted mt-0.5">Quick access to management tools</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REGISTER)}
                className="h-11 rounded-2xl bg-surface-raised border border-border/50 px-6 text-sm font-semibold text-text-primary hover:bg-border/20 transition-all active:scale-95 shadow-sm"
              >
                View Register
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REPORTS)}
                className="h-11 rounded-2xl bg-surface-raised border border-border/50 px-6 text-sm font-semibold text-text-primary hover:bg-border/20 transition-all active:scale-95 shadow-sm"
              >
                Full Reports
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-dashed border-border pt-8">
            <StatRow icon={Users} label="Class Strength" value={studentPayload.students.length} />
            <StatRow icon={Clock} label="Timestamp" value={new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
            <StatRow 
              icon={ClipboardCheck} 
              label="Record Status" 
              value={studentPayload.is_submitted ? 'Published' : 'Draft'} 
              tone={studentPayload.is_submitted ? 'text-emerald-600' : 'text-amber-600'} 
            />
          </div>
        </section>
      )}
    </div>
  )
}

const StatRow = ({ icon: Icon, label, value, tone = 'text-text-primary' }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="h-10 w-10 rounded-2xl bg-surface-raised flex items-center justify-center text-text-muted shadow-sm">
      <Icon size={18} />
    </div>
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">{label}</p>
      <p className={`text-base font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  </div>
)

export default MarkAttendance
