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
    <div className="space-y-6">
      {/* ── Header ── */}
      <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0f766e' }}>
              Attendance Management
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Mark Attendance
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Record daily student attendance for your assigned sections. Ensure accuracy for session reports and parent notifications.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-raised/50 px-4 py-2 rounded-2xl border border-border/50">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Today</p>
              <p className="text-sm font-black text-text-primary leading-tight mt-0.5">
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={18} />
            </div>
          </div>
        </div>
      </section>

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
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 leading-tight">Great Work!</p>
                <p className="text-xs font-bold text-emerald-700 mt-1">
                  Attendance for <span className="underline">{nextPending.class_name}</span> is still pending.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNextPrompt(false)}
                className="h-10 px-5 text-xs font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
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
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                Mark Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!showNextPrompt && studentPayload?.students?.length > 0 && (
        <section
          className="rounded-2xl border bg-surface p-5 sm:p-6 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised text-text-secondary">
                <Info size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-text-primary tracking-tight">Register & Reports</p>
                <p className="text-xs font-medium text-text-muted mt-0.5">Quick access to management tools</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REGISTER)}
                className="h-10 rounded-xl bg-surface-raised border border-border/50 px-5 text-[11px] font-black uppercase tracking-widest text-text-primary hover:bg-border/20 transition-colors"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE_REPORTS)}
                className="h-10 rounded-xl bg-surface-raised border border-border/50 px-5 text-[11px] font-black uppercase tracking-widest text-text-primary hover:bg-border/20 transition-colors"
              >
                Reports
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-dashed border-border pt-6">
            <StatRow icon={Users} label="Student Count" value={studentPayload.students.length} />
            <StatRow icon={Clock} label="Last Updated" value={new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
            <StatRow icon={ClipboardCheck} label="Filing Status" value={studentPayload.is_submitted ? 'Completed' : 'Draft Mode'} tone={studentPayload.is_submitted ? 'text-success' : 'text-orange-600'} />
          </div>
        </section>
      )}
    </div>
  )
}

const StatRow = ({ icon: Icon, label, value, tone = 'text-text-primary' }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-8 w-8 rounded-full bg-surface-raised flex items-center justify-center text-text-muted">
      <Icon size={14} />
    </div>
    <div className="text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</p>
      <p className={`text-xs font-black mt-0.5 ${tone}`}>{value}</p>
    </div>
  </div>
)

export default MarkAttendance