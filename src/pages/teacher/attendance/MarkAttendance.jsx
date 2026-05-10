import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, LayoutList, BarChart3, CalendarDays, ClipboardCheck, Info, Users, Clock } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import AttendanceMarker from '@/components/teacher/AttendanceMarker'
import EmptyState from '@/components/ui/EmptyState'
import { ROUTES } from '@/constants/app'

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
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header
        className="rounded-2xl border bg-surface p-6 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Mark Attendance
              </h1>
              <p className="text-xs text-text-secondary">
                Track daily presence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Today</p>
              <p className="text-xs font-bold text-text-primary">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-raised text-primary">
              <CalendarDays size={16} />
            </div>
          </div>
        </div>
      </header>

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
              toastSuccess('Submitted.')
              setShowNextPrompt(true)
            } catch (error) {
              toastError(error?.message || 'Failed.')
            }
          }}
        />
      )}

      {/* Next pending prompt */}
      {showNextPrompt && nextPending && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm animate-in fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm font-bold text-emerald-900">
                Attendance for <span className="underline">{nextPending.class_name}</span> is pending.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNextPrompt(false)}
                className="h-9 px-4 text-xs font-bold text-emerald-700"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm"
              >
                Mark Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNextPrompt && studentPayload?.students?.length > 0 && (
        <section
          className="rounded-2xl border bg-surface p-5 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-text-secondary">
                <Info size={16} />
              </div>
              <p className="text-sm font-bold text-text-primary">Management</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REGISTER)}
                className="h-9 rounded-lg bg-surface-raised px-4 text-xs font-bold text-text-primary"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REPORTS)}
                className="h-9 rounded-lg bg-surface-raised px-4 text-xs font-bold text-text-primary"
              >
                Reports
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-dashed pt-6">
            <StatRow icon={Users} label="Total" value={studentPayload.students.length} />
            <StatRow icon={Clock} label="Time" value={new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
            <StatRow icon={ClipboardCheck} label="Status" value={studentPayload.is_submitted ? 'Done' : 'Pending'} tone={studentPayload.is_submitted ? 'text-success' : 'text-warning'} />
          </div>
        </section>
      )}
    </div>
  )
}

const StatRow = ({ icon: Icon, label, value, tone = 'text-text-primary' }) => (
  <div className="flex flex-col items-center gap-1">
    <Icon size={14} className="text-text-muted" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
    <span className={`text-xs font-bold ${tone}`}>{value}</span>
  </div>
)

export default MarkAttendance