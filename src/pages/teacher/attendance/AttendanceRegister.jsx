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
  } = useAttendance()
  const [assignmentKey, setAssignmentKey] = useState('')
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date()
    return `${d.getMonth() + 1}:${d.getFullYear()}`
  })
  const [month, year] = useMemo(() => {
    if (!monthYear) return ['', '']
    return monthYear.split(':')
  }, [monthYear])
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

  const monthYearOptions = useMemo(() => {
    if (!sessionLimits) {
      const curYear = new Date().getFullYear()
      const options = []
      for (let y = curYear - 1; y <= curYear + 1; y++) {
        for (let m = 1; m <= 12; m++) {
          options.push({
            value: `${m}:${y}`,
            label: `${new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long' })} ${y}`,
          })
        }
      }
      return options
    }

    const options = []
    const start = new Date(sessionLimits.startYear, sessionLimits.startMonth - 1, 1)
    const end = new Date(sessionLimits.endYear, sessionLimits.endMonth - 1, 1)

    let current = new Date(start)
    while (current <= end) {
      const m = current.getMonth() + 1
      const y = current.getFullYear()
      options.push({
        value: `${m}:${y}`,
        label: `${current.toLocaleString('en-IN', { month: 'long' })} ${y}`,
      })
      current.setMonth(current.getMonth() + 1)
    }

    return options
  }, [sessionLimits])

  useEffect(() => {
    if (monthYearOptions.length > 0) {
      const exists = monthYearOptions.some((opt) => opt.value === monthYear)
      if (!exists) {
        const today = new Date()
        const defaultVal = `${today.getMonth() + 1}:${today.getFullYear()}`
        const todayExists = monthYearOptions.some((opt) => opt.value === defaultVal)
        setMonthYear(todayExists ? defaultVal : monthYearOptions[0].value)
      }
    }
  }, [monthYearOptions, monthYear])

  const registerAssignments = useMemo(
    () => dedupeAssignmentsForRegister(assignmentOptions),
    [assignmentOptions]
  )

  useEffect(() => {
    if (loadingAssignments || !registerAssignments.length) return

    const flatOptions = registerAssignments.flatMap(g => g.options || [g])
    const exists = flatOptions.some((o) => o.value === assignmentKey)
    if (!assignmentKey || !exists) {
      setAssignmentKey(flatOptions[0]?.value || '')
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
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Attendance Register
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monthly attendance grid for your assigned sections. View trends, perform quick overrides, and prepare for parent meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            size="sm" 
            icon={Download} 
            onClick={handleDownloadPdf}
            loading={downloading}
            disabled={!registerData || loadingRegister}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div 
        className="rounded-2xl border p-6"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-6 items-end">
          <div className="space-y-2 xl:col-span-3">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Assigned Section</label>
            <Select
              value={assignmentKey}
              onChange={(e) => setAssignmentKey(e.target.value)}
              options={registerAssignments}
              placeholder="Select section"
              className="h-11 px-4 rounded-xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2 xl:col-span-3">
            <label className="text-sm font-semibold ml-1" style={{ color: 'var(--color-text-primary)' }}>Select Month & Year</label>
            <Select
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              options={monthYearOptions}
              className="h-11 px-4 rounded-xl bg-surface-raised border border-border/50 text-sm font-semibold focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Grid — no height/overflow constraints, page scrolls naturally */}
      <AttendanceGrid
        registerData={registerData}
        loading={loadingAssignments || loadingRegister}
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

  const classTeacherOptions = []
  const subjectTeacherOptions = []

  Object.entries(grouped).forEach(([key, info]) => {
    let label = `${info.class_name} ${info.section_name}`
    const details = []
    if (info.is_class_teacher) details.push('Class Teacher')
    if (info.subjects.length > 0) details.push(...info.subjects)

    if (details.length > 0) {
      label += ` | ${details.join(', ')}`
    }

    const option = { value: key, label }
    if (info.is_class_teacher) {
      classTeacherOptions.push(option)
    } else {
      subjectTeacherOptions.push(option)
    }
  })

  const result = []
  if (classTeacherOptions.length > 0) {
    result.push({
      label: 'Class Teacher Sections',
      options: classTeacherOptions,
    })
  }
  if (subjectTeacherOptions.length > 0) {
    result.push({
      label: 'Subject Teacher Sections',
      options: subjectTeacherOptions,
    })
  }

  return result
}

const buildYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }))
}

export default AttendanceRegister
