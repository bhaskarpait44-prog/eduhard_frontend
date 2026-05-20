import { useEffect, useMemo, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import AttendanceGrid from '@/components/teacher/AttendanceGrid'

const AttendanceRegister = () => {
  usePageTitle('Attendance Register')

  const { toastError, toastSuccess } = useToast()
  const {
    assignmentOptions,
    loadingAssignments,
    loadRegister,
    registerData,
    loadingRegister,
    overrideAttendance,
  } = useAttendance()
  const [assignmentKey, setAssignmentKey] = useState('')
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear]   = useState(String(new Date().getFullYear()))

  const registerAssignments = useMemo(
    () => dedupeAssignmentsForRegister(assignmentOptions),
    [assignmentOptions]
  )

  useEffect(() => {
    if (loadingAssignments || !registerAssignments.length) return

    const exists = registerAssignments.some((o) => o.value === assignmentKey)
    if (!assignmentKey || !exists) {
      setAssignmentKey(registerAssignments[0].value)
    }
  }, [loadingAssignments, registerAssignments, assignmentKey])

  const currentAssignment = useMemo(() => {
    if (!assignmentKey) return null
    const [classId, sectionId] = assignmentKey.split(':')
    return (
      assignmentOptions.find(
        (a) =>
          a.is_class_teacher &&
          String(a.class_id) === String(classId) &&
          String(a.section_id) === String(sectionId)
      ) ||
      assignmentOptions.find(
        (a) =>
          String(a.class_id) === String(classId) &&
          String(a.section_id) === String(sectionId)
      ) ||
      null
    )
  }, [assignmentOptions, assignmentKey])

  useEffect(() => {
    if (!currentAssignment || !month || !year) return

    loadRegister({
      class_id: currentAssignment.class_id,
      section_id: currentAssignment.section_id,
      month,
      year,
    }).catch((error) => {
      toastError(error?.message || 'Failed to load attendance register.')
    })
  }, [currentAssignment, month, year, loadRegister, toastError])

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0f766e' }}>
              Attendance Management
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Attendance Register
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Monthly attendance grid for your assigned sections. View trends, perform quick overrides, and prepare for parent meetings.
            </p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Assigned Section</label>
            <Select
              value={assignmentKey}
              onChange={(e) => setAssignmentKey(e.target.value)}
              options={registerAssignments}
              placeholder="Select section"
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Month</label>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[...Array(12)].map((_, index) => ({
                value: String(index + 1),
                label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }),
              }))}
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Year</label>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={buildYearOptions()}
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Grid — no height/overflow constraints, page scrolls naturally */}
      <AttendanceGrid
        registerData={registerData}
        loading={loadingAssignments || loadingRegister}
        canEdit={!!currentAssignment?.is_class_teacher}
        onOverride={async (id, payload) => {
          try {
            await overrideAttendance(id, payload)
            toastSuccess('Attendance updated.')
            if (currentAssignment) {
              await loadRegister({
                class_id: currentAssignment.class_id,
                section_id: currentAssignment.section_id,
                month,
                year,
              })
            }
          } catch (error) {
            toastError(error?.message || 'Failed to update attendance.')
          }
        }}
      />
    </div>
  )
}

const dedupeAssignmentsForRegister = (assignments) => {
  const grouped = {}
  assignments.forEach((a) => {
    const key = `${a.class_id}:${a.section_id}`
    if (!grouped[key]) {
      grouped[key] = {
        class_name: a.class_name,
        section_name: a.section_name,
        subjects: [],
        is_class_teacher: false,
      }
    }
    if (a.is_class_teacher) grouped[key].is_class_teacher = true
    if (a.subject_name && !grouped[key].subjects.includes(a.subject_name)) {
      grouped[key].subjects.push(a.subject_name)
    }
  })

  return Object.entries(grouped).map(([key, info]) => {
    let label = `${info.class_name} ${info.section_name}`
    const details = []
    if (info.is_class_teacher) details.push('Class Teacher')
    if (info.subjects.length > 0) details.push(...info.subjects)

    if (details.length > 0) {
      label += ` | ${details.join(', ')}`
    }

    return { value: key, label }
  })
}

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }))
}

export default AttendanceRegister