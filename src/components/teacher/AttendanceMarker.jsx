import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3, Loader2, Search, Send, Users, ChevronDown, Activity, RefreshCw, ClipboardCheck, Info, BookOpen
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { key: 'present', label: 'P', full: 'Present', tone: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' },
  { key: 'absent', label: 'A', full: 'Absent', tone: '#ef4444', bg: 'rgba(239, 68, 68, 0.14)' },
  { key: 'late', label: 'L', full: 'Late', tone: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' },
  { key: 'half_day', label: 'H', full: 'Half Day', tone: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)' },
]

const AttendanceMarker = ({
  assignments = [],
  context,
  setContext,
  payload,
  loadingStudents,
  savingAttendance,
  onLoad,
  onSubmit,
}) => {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState({})
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submittingConfirm, setSubmittingConfirm] = useState(false)

  useEffect(() => {
    const next = {}
    ;(payload?.students || []).forEach((student) => {
      next[student.enrollment_id] = {
        status: student.status || 'present',
        note: '',
        name: `${student.first_name} ${student.last_name}`,
        roll_number: student.roll_number,
      }
    })
    setRecords(next)
    setReason('')
    setQuery('')
    setSubmittingConfirm(false)
  }, [payload])

  const selectedAssignment = useMemo(() => (
    assignments.find((assignment) =>
      String(assignment.class_id) === String(context.class_id) &&
      String(assignment.section_id) === String(context.section_id) &&
      String(assignment.subject_id || '') === String(context.subject_id || '') &&
      (assignment.is_class_teacher ? 'class_teacher' : 'subject_teacher') === context.assignment_role
    ) || null
  ), [assignments, context])

  const filteredStudents = useMemo(() => {
    const students = payload?.students || []
    if (!query.trim()) return students
    const q = query.trim().toLowerCase()
    return students.filter((student) => (
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
      String(student.roll_number || '').toLowerCase().includes(q)
    ))
  }, [payload, query])

  const counts = useMemo(() => {
    const initial = { present: 0, absent: 0, late: 0, half_day: 0 }
    Object.values(records).forEach((record) => {
      initial[record.status] = (initial[record.status] || 0) + 1
    })
    return initial
  }, [records])

  const assignmentChoices = assignments.map((assignment) => ({
    value: `${assignment.is_class_teacher ? 'class_teacher' : 'subject_teacher'}:${assignment.class_id}:${assignment.section_id}:${assignment.subject_id || ''}`,
    label: assignment.is_class_teacher
      ? `${assignment.class_name} ${assignment.section_name} | Class Teacher`
      : `${assignment.class_name} ${assignment.section_name} | ${assignment.subject_name}`,
  }))

  const hasStudents = (payload?.students || []).length > 0
  const hasLoadedPayload = !!payload
  const needsReason = !!payload?.requires_reason
  const canSubmit = hasStudents && (!needsReason || reason.trim())

  const handleAssignmentChange = (value) => {
    const [role, classId, sectionId, subjectId] = value.split(':')
    setContext((prev) => ({
      ...prev,
      assignment_role: role,
      class_id: classId,
      section_id: sectionId,
      subject_id: role === 'class_teacher' ? '' : subjectId || '',
    }))
  }

  const handleLoad = () => {
    const params = {
      class_id: context.class_id,
      section_id: context.section_id,
      date: context.date,
    }
    if (context.assignment_role !== 'class_teacher' && context.subject_id) {
      params.subject_id = context.subject_id
    }
    onLoad(params)
  }

  const setStatusForStudent = (enrollmentId, status) => {
    setRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
      },
    }))
  }

  const bulkSet = (status) => {
    setRecords((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status }
      })
      return next
    })
  }

  const resetToDefaults = () => {
    const next = {}
    ;(payload?.students || []).forEach((student) => {
      next[student.enrollment_id] = {
        status: student.status || 'present',
        note: '',
        name: `${student.first_name} ${student.last_name}`,
        roll_number: student.roll_number,
      }
    })
    setRecords(next)
  }

  const submitPayload = () => ({
    class_id: Number(context.class_id),
    section_id: Number(context.section_id),
    date: context.date,
    ...(context.assignment_role !== 'class_teacher' && context.subject_id ? { subject_id: Number(context.subject_id) } : {}),
    ...(reason.trim() ? { reason: reason.trim() } : {}),
    records: Object.entries(records).map(([enrollmentId, record]) => ({
      enrollment_id: Number(enrollmentId),
      status: record.status,
    })),
  })

  return (
    <div className="space-y-6">
      {/* ── Selection Panel ── */}
      <section 
        className="rounded-[28px] border bg-surface p-6 shadow-sm" 
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-6 items-end">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Assigned Class</label>
            <Select
              value={`${context.assignment_role}:${context.class_id}:${context.section_id}:${context.subject_id || ''}`}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              options={assignmentChoices}
              className="h-11 px-4 rounded-2xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Attendance Date</label>
            <input
              type="date"
              value={context.date}
              onChange={(e) => setContext((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full h-11 bg-surface-raised border border-border/50 rounded-2xl px-4 text-sm text-text-primary outline-none focus:border-primary font-semibold transition-all"
            />
          </div>

          <div className="xl:col-span-2">
            <Button
              fullWidth
              icon={RefreshCw}
              loading={loadingStudents}
              disabled={!context.class_id || !context.section_id || (context.assignment_role !== 'class_teacher' && !context.subject_id)}
              onClick={handleLoad}
              className="h-11 rounded-2xl font-semibold uppercase tracking-[0.12em] text-xs shadow-sm shadow-primary/10"
            >
              Fetch Students
            </Button>
          </div>
        </div>

        {selectedAssignment && (
          <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-dashed border-border">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {selectedAssignment.is_class_teacher ? 'Full Day Attendance' : 'Subject Attendance'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-raised border border-border text-text-secondary shadow-sm">
              <Users size={13} className="text-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {selectedAssignment.student_count || 0} Students
              </span>
            </div>
            {selectedAssignment.subject_name && !selectedAssignment.is_class_teacher && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-raised border border-border text-text-secondary shadow-sm">
                <BookOpen size={13} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {selectedAssignment.subject_name}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {payload?.already_marked && (
        <Banner
          tone="warning"
          icon={AlertTriangle}
          title="Records Found"
          message="Attendance has already been marked for this selection. Updating will log an audit trail entry."
        />
      )}

      {payload?.is_holiday && (
        <Banner
          tone="error"
          icon={CalendarDays}
          title={`Holiday: ${payload?.holiday?.name || 'School Holiday'}`}
          message="Submission is allowed but please verify if mandatory reporting is required today."
        />
      )}

      {needsReason && (
        <section className="rounded-[28px] border p-6 shadow-sm border-orange-200 bg-orange-50/20">
          <div className="flex items-center gap-2 mb-4 text-orange-700">
            <Info size={18} />
            <label className="text-xs font-bold uppercase tracking-widest">Modification Reason Required</label>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Explain why you are editing or marking attendance for a past date..."
            className="w-full rounded-[20px] px-5 py-4 text-sm outline-none border border-orange-200 focus:ring-2 focus:ring-orange-200 transition-all bg-white shadow-inner font-medium"
          />
        </section>
      )}

      {!loadingStudents && hasLoadedPayload && !hasStudents && (
        <EmptyState
          icon={Users}
          title="No Students Enrolled"
          description="We couldn't find any active students for the selected section and date."
        />
      )}

      {hasStudents && (
        <>
          {/* ── Summary Counters ── */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATUS_OPTIONS.map((option) => (
              <div
                key={option.key}
                className="rounded-[28px] border bg-surface p-5 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md group"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-2 group-hover:text-text-primary transition-colors">
                  {option.full}
                </p>
                <p className="text-4xl font-bold tracking-tighter" style={{ color: option.tone }}>
                  {counts[option.key] || 0}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-[28px] border bg-surface p-6 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between pb-8 border-b border-dashed border-border mb-8">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => bulkSet('present')}
                  className="h-10 px-5 rounded-2xl bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-600"
                >
                  <CheckCircle2 size={16} /> Mark All Present
                </button>
                <button
                  onClick={() => bulkSet('absent')}
                  className="h-10 px-5 rounded-2xl bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all hover:bg-rose-600"
                >
                  <AlertTriangle size={16} /> Mark All Absent
                </button>
                <button 
                  onClick={resetToDefaults}
                  className="h-10 px-5 rounded-2xl text-[11px] font-bold uppercase tracking-wider text-text-muted hover:bg-surface-raised transition-all border border-transparent hover:border-border active:scale-95"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="relative w-full lg:max-w-xs group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by name or roll..."
                  className="h-11 w-full rounded-2xl pl-11 pr-5 text-sm font-semibold bg-surface-raised border border-border/50 outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>
            </div>

            {/* ── Student Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredStudents.map((student) => {
                const currentStatus = records[student.enrollment_id]?.status || 'present'
                const config = STATUS_OPTIONS.find((option) => option.key === currentStatus) || STATUS_OPTIONS[0]

                return (
                  <div
                    key={student.enrollment_id}
                    className="rounded-[24px] border bg-surface p-5 transition-all hover:shadow-md"
                    style={{
                      borderColor: currentStatus === 'present' ? 'var(--color-border)' : `${config.tone}44`,
                      backgroundColor: currentStatus === 'present' ? 'var(--color-surface)' : `${config.tone}05`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-xs font-bold font-mono shadow-inner border border-border/50"
                        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
                      >
                        {student.roll_number ? `#${student.roll_number}` : '--'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary truncate uppercase tracking-tight leading-tight">
                          {student.first_name} {student.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em]">
                            ID: {student.student_id}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            student.attendance_id ? 'text-primary' : 'text-text-muted/40'
                          )}>
                            {student.attendance_id ? 'Modified' : 'New'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const selected = currentStatus === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setStatusForStudent(student.enrollment_id, option.key)}
                            className={cn(
                              'h-11 rounded-[14px] border text-xs font-bold transition-all active:scale-90 flex items-center justify-center',
                              selected ? 'shadow-lg text-white' : 'opacity-60 hover:opacity-100 hover:bg-surface-raised'
                            )}
                            style={{
                              borderColor: selected ? option.tone : 'var(--color-border)',
                              backgroundColor: selected ? option.tone : 'transparent',
                              color: selected ? '#fff' : option.tone,
                              boxShadow: selected ? `0 8px 16px ${option.tone}33` : 'none'
                            }}
                            title={option.full}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {!filteredStudents.length && (
              <div className="rounded-[28px] border border-dashed p-16 text-center flex flex-col items-center gap-5 bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
                <div className="h-14 w-14 rounded-[22px] bg-surface-raised flex items-center justify-center text-text-muted/40 shadow-inner">
                  <Search size={28} />
                </div>
                <div>
                  <p className="text-base font-bold text-text-primary tracking-tight">No match found</p>
                  <p className="mt-1 text-sm font-medium text-text-muted uppercase tracking-[0.15em]">Refine your search parameters</p>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Sticky Submission Bar ── */}
      {hasStudents && (
        <div className="sticky bottom-4 z-20">
          <div
            className="rounded-[28px] border bg-surface/80 p-5 shadow-2xl backdrop-blur-xl border-white/50"
            style={{ boxShadow: '0 -20px 40px -15px rgba(0,0,0,0.1), 0 25px 50px -12px rgba(0,0,0,0.25)' }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2">
                <Counter label="Present" count={counts.present} color="#10b981" />
                <Counter label="Absent" count={counts.absent} color="#ef4444" />
                <Counter label="Late" count={counts.late} color="#f59e0b" className="hidden md:flex" />
                <Counter label="Half Day" count={counts.half_day} color="#3b82f6" className="hidden md:flex" />
              </div>

              <Button
                icon={savingAttendance ? Loader2 : Send}
                loading={savingAttendance}
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
                className="h-12 px-12 text-sm font-bold uppercase tracking-[0.15em] shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 rounded-[20px]"
              >
                File Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Overlay ── */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="md">
        <div className="p-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10 text-primary mb-8 shadow-inner border border-primary/10">
            <ClipboardCheck size={32} />
          </div>
          <h3 className="text-3xl font-bold text-text-primary tracking-tight leading-tight">Ready to File?</h3>
          <p className="mt-4 text-base font-medium text-text-muted leading-relaxed">
            You are submitting attendance for <span className="font-bold text-text-primary decoration-primary/30 underline underline-offset-4">{selectedAssignment?.class_name} {selectedAssignment?.section_name}</span>. 
            <br className="hidden sm:block" /> This will trigger automated reporting and notifications.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-14 rounded-[22px] bg-surface-raised text-xs font-bold uppercase tracking-widest text-text-primary border border-border hover:bg-border/20 transition-all active:scale-95 shadow-sm"
            >
              Wait, Review
            </button>
            <button
              type="button"
              onClick={async () => {
                setSubmittingConfirm(true)
                try {
                  await onSubmit(submitPayload())
                  setConfirmOpen(false)
                } catch (error) {
                  setSubmittingConfirm(false)
                }
              }}
              disabled={submittingConfirm}
              className="h-14 rounded-[22px] bg-primary text-xs font-bold uppercase tracking-widest text-white shadow-2xl shadow-primary/40 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {submittingConfirm ? <Loader2 size={20} className="animate-spin" /> : 'Confirm & File'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const Counter = ({ label, count, color, className }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{count || 0} {label}</span>
  </div>
)

const Banner = ({ tone, icon: Icon, title, message }) => {
  const styles = {
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }
  const iconStyles = {
    warning: 'bg-white text-orange-600 shadow-sm border border-orange-100',
    error: 'bg-white text-rose-600 shadow-sm border border-rose-100',
    success: 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
  }
  
  return (
    <div className={cn("rounded-[28px] border p-5 flex items-start gap-5 shadow-sm", styles[tone])}>
      <div className={cn("h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center", iconStyles[tone])}>
        <Icon size={24} />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-sm font-bold tracking-tight uppercase tracking-[0.05em]">{title}</p>
        <p className="text-sm font-medium opacity-90 mt-1 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

export default AttendanceMarker