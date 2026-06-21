import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, CalendarDays, History } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useAttendance from '@/hooks/useAttendance'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import AttendanceGrid from '@/components/teacher/AttendanceGrid'
import { downloadAttendanceRegisterPdf } from '@/api/attendanceApi'
import useSessionStore from '@/store/sessionStore'

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
  const [downloading, setDownloading] = useState(false)

  const { currentSession, fetchCurrentSession } = useSessionStore()

  useEffect(() => {
    fetchCurrentSession().catch(() => {})
  }, [fetchCurrentSession])

  const sessionLimits = useMemo(() => {
    if (!currentSession?.start_date || !currentSession?.end_date) return null
    const start = new Date(currentSession.start_date)
    const end = new Date(currentSession.end_date)
    return {
      start,
      end,
      startYear: start.getFullYear(),
      startMonth: start.getMonth() + 1, // 1-indexed for teacher view state
      endYear: end.getFullYear(),
      endMonth: end.getMonth() + 1, // 1-indexed for teacher view state
    }
  }, [currentSession])

  // Automatically adjust selected month and year to fall within the session bounds
  useEffect(() => {
    if (!sessionLimits) return
    const curYearNum = parseInt(year)
    const curMonthNum = parseInt(month)
    if (isNaN(curYearNum) || isNaN(curMonthNum)) return
    const dateToCheck = new Date(curYearNum, curMonthNum - 1, 1)
    const startToCheck = new Date(sessionLimits.startYear, sessionLimits.startMonth - 1, 1)
    const endToCheck = new Date(sessionLimits.endYear, sessionLimits.endMonth - 1, 1)
    
    if (dateToCheck < startToCheck || dateToCheck > endToCheck) {
      setYear(String(sessionLimits.startYear))
      setMonth(String(sessionLimits.startMonth))
    }
  }, [sessionLimits, year, month])

  const yearOptions = useMemo(() => {
    if (!sessionLimits) {
      const cur = new Date().getFullYear()
      return [cur - 1, cur, cur + 1].map(y => ({ value: String(y), label: String(y) }))
    }
    const options = []
    for (let y = sessionLimits.startYear; y <= sessionLimits.endYear; y++) {
      options.push({ value: String(y), label: String(y) })
    }
    return options
  }, [sessionLimits])

  const monthOptions = useMemo(() => {
    const allMonths = [...Array(12)].map((_, index) => ({
      value: String(index + 1),
      label: new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' }),
    }))

    if (!sessionLimits || !year) return allMonths

    const selectedYearNum = parseInt(year)
    return allMonths.filter((opt) => {
      const mVal = parseInt(opt.value)
      const dateToCheck = new Date(selectedYearNum, mVal - 1, 1)
      const startToCheck = new Date(sessionLimits.startYear, sessionLimits.startMonth - 1, 1)
      const endToCheck = new Date(sessionLimits.endYear, sessionLimits.endMonth - 1, 1)
      return dateToCheck >= startToCheck && dateToCheck <= endToCheck
    })
  }, [sessionLimits, year])

  // Auto-adjust selected month if year changes and current month is no longer valid
  useEffect(() => {
    if (monthOptions.length > 0) {
      const exists = monthOptions.some((opt) => opt.value === month)
      if (!exists) {
        setMonth(monthOptions[0].value)
      }
    }
  }, [monthOptions, month])

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

  const handleDownloadPdf = async () => {
    if (!registerData?.session_id || !currentAssignment) return
    setDownloading(true)
    try {
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
      const response = await downloadAttendanceRegisterPdf({
        session_id: registerData.session_id,
        class_id: currentAssignment.class_id,
        section_id: currentAssignment.section_id,
        month: parseInt(month),
        year: parseInt(year),
      })
      
      const blob = response.data || response
      if (blob.type === 'application/json') {
        const text = await blob.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_Register_${currentAssignment.class_name}_${currentAssignment.section_name}_${monthName}_${year}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      toastSuccess('Register downloaded successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to download register PDF.')
    } finally { setDownloading(false) }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* ── Header ── */}
      <section 
        className="rounded-[28px] border p-6 overflow-hidden" 
        style={{ 
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(20, 184, 166, 0.05) 55%, var(--color-surface) 100%)'
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: '#0f766e' }}>
              Attendance Records
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Attendance Register
            </h1>
            <p className="mt-2 text-sm sm:text-base opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
              Monthly attendance grid for your assigned sections. View trends, perform quick overrides, and prepare for parent meetings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              size="sm" 
              icon={Download} 
              onClick={handleDownloadPdf}
              loading={downloading}
              disabled={!registerData || loadingRegister}
              className="rounded-2xl font-semibold shadow-lg shadow-primary/20 h-11 px-6"
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-6 items-end border-t border-dashed border-border pt-8">
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Assigned Section</label>
            <Select
              value={assignmentKey}
              onChange={(e) => setAssignmentKey(e.target.value)}
              options={registerAssignments}
              placeholder="Select section"
              className="h-11 px-4 rounded-2xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Month</label>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
              className="h-11 px-4 rounded-2xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Academic Year</label>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={yearOptions}
              className="h-11 px-4 rounded-2xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
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