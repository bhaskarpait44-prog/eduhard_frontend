import { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertTriangle, Search, TrendingUp, X, Download, FileText } from 'lucide-react'
import { getStudents } from '@/api/studentsApi'
import { getClasses, getClassOptions, getSections } from '@/api/classApi'
import { downloadAttendanceSummaryPdf, downloadStudentAttendanceCard } from '@/api/attendanceApi'
import { downloadBlob } from '@/utils/downloadBlob'
import useAttendanceStore from '@/store/attendanceStore'
import useSessionStore from '@/store/sessionStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import ProgressBar from '@/components/ui/ProgressBar'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { AttendanceHero, AttendanceMetric, AttendanceSection } from './AttendanceShell'
import { debounce, formatDate, getInitials } from '@/utils/helpers'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const firstOfMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}
const today = () => new Date().toISOString().slice(0, 10)

const AttendanceReportPage = () => {
  usePageTitle('Attendance Report')
  const { toastError } = useToast()
  const { studentSummary, studentRecords, isLoading, fetchStudentAttendance, clearStudentData } = useAttendanceStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [searching, setSearching] = useState(false)

  // Class-wide report filters
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [fromDate, setFromDate] = useState(firstOfMonth())
  const [toDate, setToDate] = useState(today())
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloadingCard, setIsDownloadingCard] = useState(false)

  useEffect(() => {
    fetchSessions().catch(() => {})
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => {})
  }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) {
      setSessionId(String(currentSession.id))
    }
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!classId) {
      setSections([])
      setSectionId('')
      return
    }
    getSections(classId)
      .then((response) => setSections((response.data || []).map((s) => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
  }, [classId])

  const doSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setSearching(true)
      try {
        const response = await getStudents({ search: query, perPage: 10 })
        const data = Array.isArray(response.data) ? response.data : (response.data?.students || [])
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400),
    [],
  )



  useEffect(() => {
    if (selected?.current_enrollment?.id) {
      fetchStudentAttendance(selected.current_enrollment.id, { from: fromDate, to: toDate })
        .catch(() => toastError('Failed to load attendance'))
    }
  }, [selected?.current_enrollment?.id, fromDate, toDate, fetchStudentAttendance, toastError])

  const selectStudent = (student) => {
    setSelected(student)
    setResults([])
    setSearch(`${student.first_name} ${student.last_name}`)
  }

  const resetSearch = () => {
    setSearch('')
    setSelected(null)
    setResults([])
    clearStudentData()
  }

  const handleDownloadSummary = async () => {
    if (!sessionId || !classId || !sectionId) return
    setIsDownloading(true)
    try {
      const className = classes.find(c => c.value === classId)?.label || 'Class'
      const sectionName = sections.find(s => s.value === sectionId)?.label || 'Section'
      const response = await downloadAttendanceSummaryPdf({
        session_id: sessionId,
        class_id: classId,
        section_id: sectionId,
        from_date: fromDate,
        to_date: toDate
      })

      const blob = response.data || response
      if (blob.type === 'application/json') {
        const text = await blob.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      downloadBlob(blob, `Attendance_Report_${className.replace(/\s+/g,'_')}_${sectionName.replace(/\s+/g,'_')}_${fromDate}_to_${toDate}.pdf`)
    } catch (err) {
      toastError(err.message || 'Failed to download attendance summary.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadCard = async () => {
    if (!selected?.current_enrollment?.id) return
    setIsDownloadingCard(true)
    try {
      const response = await downloadStudentAttendanceCard({
        enrollment_id: selected.current_enrollment.id,
        from_date: fromDate,
        to_date: toDate
      })

      const blob = response.data || response
      if (blob.type === 'application/json') {
        const text = await blob.text()
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      downloadBlob(blob, `Attendance_${selected.first_name}_${fromDate}_to_${toDate}.pdf`)
    } catch (err) {
      toastError(err.message || 'Failed to download student attendance card.')
    } finally {
      setIsDownloadingCard(false)
    }
  }
  const breakdown = useMemo(() => {
    const monthMap = {}

    studentRecords.forEach((record) => {
      const month = parseInt(record.date.split('-')[1], 10) - 1
      if (!monthMap[month]) {
        monthMap[month] = { present: 0, absent: 0, late: 0, half_day: 0, holiday: 0, total: 0 }
      }

      monthMap[month][record.status] = (monthMap[month][record.status] || 0) + 1
      if (record.status !== 'holiday') {
        monthMap[month].total += 1
      }
    })

    return monthMap
  }, [studentRecords])

  const atRisk = (studentSummary?.percentage || 0) < 75

  return (
    <div className="space-y-6">
      <AttendanceHero
        title={selected ? `${selected.first_name} ${selected.last_name}` : 'Attendance Report'}
        description={selected ? `Viewing attendance details for ${selected.admission_no}. Joined on ${formatDate(studentSummary?.joinedDate)}.` : 'Search for a student or select a class to download attendance summary reports for the current session.'}
        actions={selected ? (
          <div className="flex items-center gap-3">
            {atRisk ? (
              <div className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-medium" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                <AlertTriangle size={14} />
                Attendance is below 75%
              </div>
            ) : (
              <Badge variant="green" size="md">Attendance is within safe range</Badge>
            )}
            <Button variant="secondary" size="sm" icon={FileText} onClick={handleDownloadCard} loading={isDownloadingCard}>
              Download Card
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" icon={Download} onClick={handleDownloadSummary} loading={isDownloading} disabled={!sessionId || !classId || !sectionId}>
            Download PDF
          </Button>
        )}
        meta={selected && studentSummary ? [
          { label: 'Session', value: currentSession?.name || '--' },
          { label: 'Working Days', value: studentSummary.workingDays || 0 },
          { label: 'Present', value: studentSummary.presentCount || 0 },
          { label: 'Absent', value: studentSummary.absentCount || 0 },
        ] : []}
      >
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="relative lg:col-span-4">
            <Input
              label="Student Search"
              type="text"
              value={search}
              onChange={(event) => {
                const val = event.target.value
                setSearch(val)
                if (!val) {
                  setSelected(null)
                  clearStudentData()
                }
                doSearch(val)
              }}
              placeholder="Search by name or admission no"
              icon={Search}
              className="pr-10"
            />
            {search ? (
              <button
                onClick={resetSearch}
                className="absolute right-3 top-[38px] rounded-full p-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={15} />
              </button>
            ) : null}

            {results.length > 0 ? (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-xl"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                {results.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                      {getInitials(`${student.first_name || ''} ${student.last_name || ''}`)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {student.admission_no}
                        {student.current_enrollment ? ` | ${student.current_enrollment.class}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-5">
            <Select
              label="Session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              options={(sessions || []).map(s => ({ 
                value: String(s.id), 
                label: `${s.name}${s.is_current ? ' (Current)' : ''}` 
              }))}
            />
            <Select
              label="Class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              options={classes}
              placeholder="Select class"
            />
            <Select
              label="Section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              options={sections}
              disabled={!classId}
              placeholder="Select section"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">From</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">To</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)}
                className="w-full rounded-2xl border px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              />
            </div>
          </div>
        </div>

        {searching ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Searching students...
          </p>
        ) : null}
      </AttendanceHero>

      {selected && studentSummary ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <AttendanceSection title="Overall Attendance">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Percentage
                  </p>
                  <p className="text-sm font-semibold" style={{ color: atRisk ? '#dc2626' : '#15803d' }}>
                    {(studentSummary.percentage || 0).toFixed(1)}%
                  </p>
                </div>
                <ProgressBar value={studentSummary.percentage || 0} size="lg" />
              </div>
            </AttendanceSection>

            {Object.keys(breakdown).length > 0 ? (
              <AttendanceSection title="Monthly List">
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {['Month', 'Working Days', 'Present', 'Absent', 'Late', 'Half Day', '%'].map((heading) => (
                            <th
                              key={heading}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(breakdown).map(([month, data], index, array) => {
                          const effective = (data.present || 0) + (data.late || 0) + (data.half_day || 0) * 0.5
                          const pct = data.total > 0 ? (effective / data.total) * 100 : null
                          const pctColor = (pct || 0) >= 75 ? '#16a34a' : (pct || 0) >= 50 ? '#d97706' : '#dc2626'

                          return (
                            <tr
                              key={month}
                              style={{ borderBottom: index < array.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                            >
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                {MONTHS[month]}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {data.total}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#16a34a' }}>
                                {data.present || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#dc2626' }}>
                                {data.absent || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#d97706' }}>
                                {data.late || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#2563eb' }}>
                                {data.half_day || 0}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold" style={{ color: pctColor }}>
                                {pct === null ? '--' : `${pct.toFixed(1)}%`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AttendanceSection>
            ) : null}
          </div>
        </>
      ) : null}

      {!selected ? (
        <AttendanceSection>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-20 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <TrendingUp size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.45 }} />
            <p className="mt-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Search student or select a class for summary report</p>
          </div>
        </AttendanceSection>
      ) : null}

      {selected && isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading attendance report...
        </p>
      ) : null}
    </div>
  )
}

export default AttendanceReportPage
