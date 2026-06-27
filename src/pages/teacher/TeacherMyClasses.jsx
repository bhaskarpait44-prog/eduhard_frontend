import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpenCheck, BookOpen, ClipboardCheck, CheckCircle2,
  Layers, RefreshCw, School2, UserCheck, Users, XCircle,
} from 'lucide-react'
import * as teacherApi from '@/api/teacherApi'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

// ─── Page ────────────────────────────────────────────────────────────────────

const TeacherMyClasses = () => {
  usePageTitle('My Classes')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payload, setPayload] = useState({ my_class: [], subject_classes: [] })

  const loadClasses = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await teacherApi.getTeacherMyClasses()
      setPayload({
        my_class: res?.data?.my_class || [],
        subject_classes: res?.data?.subject_classes || [],
      })
    } catch (error) {
      toastError(error?.response?.data?.message || 'Unable to load assigned classes.')
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => { loadClasses() }, [])

  const myClassAssignments = payload.my_class || []
  const subjectAssignments = payload.subject_classes || []

  const subjectSectionMap = useMemo(() => {
    const map = new Map()
    subjectAssignments.forEach((a) => {
      const key = `${a.class_id}:${a.section_id}`
      if (!map.has(key)) map.set(key, [])
      if (a.subject_id) map.get(key).push({ id: a.subject_id, name: a.subject_name, code: a.subject_code })
    })
    return map
  }, [subjectAssignments])

  const classAssignmentsWithSubjects = useMemo(() =>
    myClassAssignments.map((a) => ({
      ...a,
      subjects: subjectSectionMap.get(`${a.class_id}:${a.section_id}`) || [],
    })),
  [myClassAssignments, subjectSectionMap])

  const subjectSections = useMemo(() => {
    const map = new Map()
    subjectAssignments.forEach((a) => {
      const key = `${a.class_id}:${a.section_id}`
      if (!map.has(key)) map.set(key, { ...a, subjects: [] })
      if (a.subject_id) map.get(key).subjects.push({ id: a.subject_id, name: a.subject_name, code: a.subject_code })
    })
    return [...map.values()].sort((a, b) => {
      const cc = String(a.class_name || '').localeCompare(String(b.class_name || ''))
      return cc !== 0 ? cc : String(a.section_name || '').localeCompare(String(b.section_name || ''))
    })
  }, [subjectAssignments])

  const summary = useMemo(() => ({
    totalSections: myClassAssignments.length + subjectSections.length,
    classTeacherSections: myClassAssignments.length,
    subjectTeacherSections: subjectSections.length,
    totalSubjects: subjectAssignments.length,
  }), [myClassAssignments.length, subjectSections.length, subjectAssignments.length])

  const hasAssignments = summary.totalSections > 0

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-12">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          icon={RefreshCw}
          loading={refreshing}
          onClick={() => loadClasses(true)}
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned sections"  value={summary.totalSections}            icon={Layers}       color="#00bc7d" />
        <StatCard label="Class teacher"       value={summary.classTeacherSections}     icon={UserCheck}    color="#00bc7d" />
        <StatCard label="Subject sections"    value={summary.subjectTeacherSections}   icon={BookOpenCheck} color="#0284c7" />
        <StatCard label="Assigned subjects"   value={summary.totalSubjects}            icon={BookOpen}     color="#0284c7" />
      </section>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : !hasAssignments ? (
        <EmptyState
          icon={School2}
          title="No class assignments found"
          description="You don't have any active class or subject assignments in the current session yet."
        />
      ) : (
        <>
          <ClassSection
            title="Class teacher sections"
            description="Full responsibility — attendance, student follow-up, and section overview."
            badgeVariant="green"
            count={myClassAssignments.length}
            emptyIcon={Users}
            emptyTitle="No class teacher assignment"
            emptyDesc="You are not marked as class teacher for any section right now."
          >
            {classAssignmentsWithSubjects.map((a) => (
              <AssignmentCard key={a.id} assignment={a} variant="class_teacher" navigate={navigate} />
            ))}
          </ClassSection>

          <ClassSection
            title="Subject teacher sections"
            description="Sections where you teach one or more assigned subjects."
            badgeVariant="blue"
            count={subjectSections.length}
            emptyIcon={BookOpenCheck}
            emptyTitle="No subject assignments"
            emptyDesc="You are not assigned to any section as a subject teacher right now."
          >
            {subjectSections.map((a) => (
              <AssignmentCard
                key={`${a.class_id}-${a.section_id}`}
                assignment={a}
                variant="subject_teacher"
                navigate={navigate}
              />
            ))}
          </ClassSection>
        </>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const ClassSection = ({ title, description, badgeVariant, count, emptyIcon, emptyTitle, emptyDesc, children }) => {
  const isGreen = badgeVariant === 'green'
  const accentColor = isGreen ? '#00bc7d' : '#0284c7'

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div
        className="flex items-center justify-between gap-4 pb-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
          >
            {isGreen ? <School2 size={16} /> : <BookOpenCheck size={16} />}
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
          </div>
        </div>
        <Badge variant={badgeVariant} className="shrink-0">
          {count} {count !== 1 ? 'sections' : 'section'}
        </Badge>
      </div>

      {count === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {children}
        </div>
      )}
    </section>
  )
}

// ─── Assignment card ──────────────────────────────────────────────────────────

const AssignmentCard = ({ assignment, variant, navigate }) => {
  const isClassTeacher = variant === 'class_teacher'
  const attendanceMarked = assignment.today_attendance_marked
  const canMarkAttendance = isClassTeacher
  const canEnterMarks = Boolean(assignment.subjects?.length)

  const openAttendance = () =>
    navigate(ROUTES.TEACHER_ATTENDANCE_MARK, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
        subject_id: '',
        assignment_role: 'class_teacher',
      },
    })

  const openMarks = () =>
    navigate(ROUTES.TEACHER_MARKS_ENTER, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
        subject_id: assignment.subjects?.length ? String(assignment.subjects[0].id) : '',
        assignment_role: canEnterMarks ? 'subject_teacher' : variant,
      },
    })

  const openStudents = () =>
    navigate(ROUTES.TEACHER_STUDENTS, {
      state: {
        class_id: String(assignment.class_id),
        section_id: String(assignment.section_id),
      },
    })

  const roleColor = isClassTeacher ? '#00bc7d' : '#0284c7'

  return (
    <article
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Role color strip */}
      <div className="h-[3px] shrink-0" style={{ backgroundColor: roleColor }} />

      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* ── Card header ── */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <Badge variant={isClassTeacher ? 'green' : 'blue'}>
                {isClassTeacher ? 'Class teacher' : 'Subject teacher'}
              </Badge>
            </div>
            <h3 className="text-lg font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {assignment.class_name}
              <span
                className="ml-2 text-base font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Section {assignment.section_name}
              </span>
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {isClassTeacher
                ? 'Full section oversight — attendance and student management'
                : 'Subject marks entry and subject-specific tasks'}
            </p>
          </div>

          {/* Attendance pill */}
          <div
            className="shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 text-center"
            style={{
              backgroundColor: attendanceMarked
                ? 'rgba(16,185,129,0.10)'
                : 'rgba(239,68,68,0.08)',
              minWidth: '74px',
            }}
          >
            {attendanceMarked
              ? <CheckCircle2 size={15} color="#10b981" />
              : <XCircle size={15} color="#ef4444" />}
            <p
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Today
            </p>
            <p
              className="text-xs font-bold"
              style={{ color: attendanceMarked ? '#10b981' : '#ef4444' }}
            >
              {attendanceMarked ? 'Marked' : 'Pending'}
            </p>
          </div>
        </div>

        {/* ── Subject chips ── */}
        {assignment.subjects?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {assignment.subjects.map((s) => (
              <span
                key={s.id || `${s.name}-${s.code}`}
                className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: 'rgba(2,132,199,0.09)', color: '#0284c7' }}
              >
                {s.name}
                {s.code
                  ? <span style={{ opacity: 0.65, marginLeft: '4px' }}>· {s.code}</span>
                  : null}
              </span>
            ))}
          </div>
        ) : null}

        {/* ── Divider ── */}
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Students"  value={assignment.student_count}                                   color="#00bc7d" />
          <MiniStat label="Att. rate" value={`${Number(assignment.attendance_rate || 0).toFixed(0)}%`}   color="#0284c7" />
          <MiniStat label="Below 75%" value={assignment.below_75_count}                                   color="#ef4444" />
          <MiniStat label="Fee due"   value={assignment.fee_defaulters_count}                             color="#f59e0b" />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-wrap gap-2">
          <ActionBtn
            icon={ClipboardCheck}
            label="Mark attendance"
            onClick={openAttendance}
            disabled={!canMarkAttendance}
            color="#00bc7d"
            primary
          />
          {!isClassTeacher && (
            <ActionBtn
              icon={BookOpenCheck}
              label="Enter marks"
              onClick={openMarks}
              disabled={!canEnterMarks}
              color="#0284c7"
            />
          )}
          <ActionBtn
            icon={Users}
            label="Students"
            onClick={openStudents}
            color="#00bc7d"
          />
        </div>

      </div>
    </article>
  )
}

// ─── Small components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div
    className="rounded-xl border p-4 flex items-center gap-4"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}14`, color }}
    >
      <Icon size={19} />
    </div>
    <div className="min-w-0">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-2xl font-bold tabular-nums"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value ?? 0}
      </p>
    </div>
  </div>
)

const MiniStat = ({ label, value, color }) => (
  <div
    className="rounded-xl p-3 flex flex-col gap-1.5"
    style={{ backgroundColor: 'var(--color-surface-raised)' }}
  >
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.1em] leading-none"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {label}
    </p>
    <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>
      {value ?? 0}
    </p>
  </div>
)

const ActionBtn = ({ icon: Icon, label, onClick, disabled = false, primary = false, color }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center gap-2 rounded-xl px-4 py-2.5',
      'text-xs font-semibold transition-all duration-150',
      'hover:-translate-y-0.5 active:translate-y-0',
      'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0',
      primary ? 'flex-1 justify-center' : '',
    ].join(' ')}
    style={{
      backgroundColor: disabled
        ? 'var(--color-surface-raised)'
        : primary
          ? `${color}12`
          : 'var(--color-surface-raised)',
      color: disabled
        ? 'var(--color-text-muted)'
        : primary ? color : 'var(--color-text-secondary)',
      border: `1px solid ${
        disabled
          ? 'var(--color-border)'
          : primary
            ? `${color}28`
            : 'var(--color-border)'
      }`,
    }}
  >
    <Icon size={13} />
    {label}
  </button>
)

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        {/* Role strip */}
        <div className="h-[3px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
              <div className="h-5 w-44 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
              <div className="h-3 w-52 rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            </div>
            <div className="h-16 w-[74px] rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          </div>
          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          {/* Mini stats */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-14 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            <div className="h-9 w-28 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default TeacherMyClasses