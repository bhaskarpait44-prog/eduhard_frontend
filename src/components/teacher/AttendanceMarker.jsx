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
      <section className="rounded-2xl border bg-surface p-5 sm:p-6 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6 items-end">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium ml-1" style={{ color: 'var(--color-text-primary)' }}>Assigned Class</label>
            <Select
              value={`${context.assignment_role}:${context.class_id}:${context.section_id}:${context.subject_id || ''}`}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              options={assignmentChoices}
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>

          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium ml-1" style={{ color: 'var(--color-text-primary)' }}>Date</label>
            <input
              type="date"
              value={context.date}
              onChange={(e) => setContext((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full bg-surface-raised border border-border/50 rounded-xl px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary h-9 font-semibold"
            />
          </div>

          <div className="xl:col-span-2">
            <Button
              fullWidth
              icon={RefreshCw}
              loading={loadingStudents}
              disabled={!context.class_id || !context.section_id || (context.assignment_role !== 'class_teacher' && !context.subject_id)}
              onClick={handleLoad}
              className="h-9 rounded-xl font-black uppercase tracking-widest text-[11px]"
            >
              Fetch Students
            </Button>
          </div>
        </div>

        {selectedAssignment && (
          <div className="mt-6 flex flex-wrap gap-2 pt-5 border-t border-dashed border-border">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {selectedAssignment.is_class_teacher ? 'Full Day Attendance' : 'Subject Attendance'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-text-secondary">
              <Users size={12} />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {selectedAssignment.student_count || 0} Students
              </span>
            </div>
            {selectedAssignment.subject_name && !selectedAssignment.is_class_teacher && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-border text-text-secondary">
                <BookOpen size={12} />
                <span className="text-[10px] font-black uppercase tracking-wider">
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
        <section className="rounded-2xl border p-5 shadow-sm border-orange-200 bg-orange-50/20">
          <div className="flex items-center gap-2 mb-3 text-orange-700">
            <Info size={16} />
            <label className="text-[10px] font-black uppercase tracking-widest">Modification Reason Required</label>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Explain why you are editing or marking attendance for a past date..."
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-orange-200 focus:ring-2 focus:ring-orange-200 transition-all bg-white"
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATUS_OPTIONS.map((option) => (
              <div
                key={option.key}
                className="rounded-2xl border bg-surface p-4 sm:p-5 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">
                  {option.full}
                </p>
                <p className="text-3xl font-black tracking-tight" style={{ color: option.tone }}>
                  {counts[option.key] || 0}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border bg-surface p-5 sm:p-6 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            {/* ── Toolbar ── */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-dashed border-border mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => bulkSet('present')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <CheckCircle2 size={14} /> Mark All Present
                </button>
                <button
                  onClick={() => bulkSet('absent')}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                >
                  <AlertTriangle size={14} /> Mark All Absent
                </button>
                <button 
                  onClick={() => bulkSet('present')}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-surface-raised transition-colors border border-transparent hover:border-border"
                >
                  Reset Defaults
                </button>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students..."
                  className="min-h-11 w-full rounded-xl pl-10 pr-4 text-xs font-bold bg-surface-raised border border-border/50 outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>
            </div>

            {/* ── Student Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => {
                const currentStatus = records[student.enrollment_id]?.status || 'present'
                const config = STATUS_OPTIONS.find((option) => option.key === currentStatus) || STATUS_OPTIONS[0]

                return (
                  <div
                    key={student.enrollment_id}
                    className="rounded-2xl border bg-surface p-4 transition-all hover:shadow-md"
                    style={{
                      borderColor: currentStatus === 'present' ? 'var(--color-border)' : `${config.tone}66`,
                      backgroundColor: currentStatus === 'present' ? 'var(--color-surface)' : `${config.tone}05`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xs font-black font-mono shadow-inner border border-border"
                        style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
                      >
                        {student.roll_number || '--'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-text-primary truncate uppercase tracking-tight">
                          {student.first_name} {student.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                            ID: {student.student_id}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            student.attendance_id ? 'text-primary' : 'text-text-muted/40'
                          )}>
                            {student.attendance_id ? 'Modified' : 'New'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const selected = currentStatus === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setStatusForStudent(student.enrollment_id, option.key)}
                            className={cn(
                              'h-10 rounded-xl border text-[11px] font-black transition-all active:scale-95 flex items-center justify-center',
                              selected ? 'shadow-lg text-white' : 'opacity-60 hover:opacity-100 hover:bg-surface-raised'
                            )}
                            style={{
                              borderColor: selected ? option.tone : 'var(--color-border)',
                              backgroundColor: selected ? option.tone : 'transparent',
                              color: selected ? '#fff' : option.tone,
                              boxShadow: selected ? `0 6px 16px ${option.tone}44` : 'none'
                            }}
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
              <div className="rounded-2xl border border-dashed p-12 text-center flex flex-col items-center gap-4 bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
                <div className="h-12 w-12 rounded-full bg-surface-raised flex items-center justify-center text-text-muted/40">
                  <Search size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-text-primary tracking-tight">No match found</p>
                  <p className="mt-1 text-xs font-medium text-text-muted uppercase tracking-widest">Refine your search parameters</p>
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
            className="rounded-2xl border bg-surface/90 p-4 shadow-2xl backdrop-blur-md"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">{counts.present || 0} Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-red-600">{counts.absent || 0} Absent</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">{counts.late || 0} Late</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">{counts.half_day || 0} Half Day</span>
                </div>
              </div>

              <Button
                icon={savingAttendance ? Loader2 : Send}
                loading={savingAttendance}
                disabled={!canSubmit}
                onClick={() => setConfirmOpen(true)}
                className="h-11 px-10 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                File Attendance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Overlay ── */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-inner">
          <Activity size={28} />
        </div>
        <h3 className="text-2xl font-black text-text-primary tracking-tight leading-tight">Ready to File?</h3>
        <p className="mt-3 text-sm font-medium text-text-muted leading-relaxed">
          You are submitting attendance for <span className="font-bold text-text-primary whitespace-nowrap">{selectedAssignment?.class_name} {selectedAssignment?.section_name}</span>. This will trigger automated reporting and parent notifications for absent students.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="h-12 rounded-2xl bg-surface-raised text-[11px] font-black uppercase tracking-widest text-text-primary border border-border hover:bg-border/20 transition-colors"
          >
            Go Back
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
            className="h-12 rounded-2xl bg-primary text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {submittingConfirm ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & File'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

const Banner = ({ tone, icon: Icon, title, message }) => {
  const styles = {
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  }
  const iconStyles = {
    warning: 'bg-orange-100 text-orange-600',
    error: 'bg-red-100 text-red-600',
    success: 'bg-emerald-100 text-emerald-600'
  }
  
  return (
    <div className={cn("rounded-2xl border p-4 flex items-start gap-4 shadow-sm", styles[tone])}>
      <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-inner", iconStyles[tone])}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black tracking-tight">{title}</p>
        <p className="text-xs font-medium opacity-80 mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

export default AttendanceMarker