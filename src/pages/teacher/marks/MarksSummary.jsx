import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, BookOpen, GraduationCap, Layout, Info, BarChart3, TrendingUp, TrendingDown, Users, Download, Star, CheckCircle2 } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const normalizeMarksError = (error) => {
  const message = error?.message || ''
  if (message.includes('Only the assigned subject teacher can enter or review marks for this subject')) {
    return 'This subject is not assigned to you for marks review. Choose one of your assigned subjects.'
  }
  if (message.includes('Selected exam does not belong to this class or active session')) {
    return 'This exam does not match the selected section. Choose the section from the same class as the exam.'
  }
  return message || 'Failed to load marks summary.'
}

const MarksSummary = () => {
  usePageTitle('Marks Summary')

  const { toastError } = useToast()
  const location = useLocation()
  const {
    uniqueSections,
    exams,
    baseError,
    loadingBase,
    summaryLoading,
    summaryPayload,
    getAvailableSubjects,
    loadSummary,
  } = useMarksEntry()
  const [examId, setExamId] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjectOptions, setSubjectOptions] = useState([])
  const preferredAssignment = location.state || {}

  const selectedSection = useMemo(() => {
    const [classId, sectionId] = sectionKey.split(':')
    return uniqueSections.find((section) =>
      String(section.class_id) === String(classId) &&
      String(section.section_id) === String(sectionId)
    ) || null
  }, [sectionKey, uniqueSections])

  const selectedExam = useMemo(() => (
    exams.find((exam) => String(exam.id) === String(examId)) || null
  ), [examId, exams])

  const visibleSections = useMemo(() => (
    selectedExam
      ? uniqueSections.filter((section) => String(section.class_id) === String(selectedExam.class_id))
      : uniqueSections
  ), [selectedExam, uniqueSections])

  const selectionMismatch = useMemo(() => {
    if (!selectedExam || !selectedSection) return false
    return String(selectedExam.class_id) !== String(selectedSection.class_id)
  }, [selectedExam, selectedSection])

  useEffect(() => {
    if (baseError) toastError(baseError)
  }, [baseError, toastError])

  useEffect(() => {
    if (!uniqueSections.length || sectionKey) return
    const matched = uniqueSections.find((section) =>
      String(section.class_id) === String(preferredAssignment.class_id || '') &&
      String(section.section_id) === String(preferredAssignment.section_id || '') &&
      (
        !preferredAssignment.assignment_role ||
        (preferredAssignment.assignment_role === 'class_teacher' && section.is_class_teacher) ||
        preferredAssignment.assignment_role === 'subject_teacher'
      )
    )
    const first = matched || uniqueSections[0]
    setSectionKey(`${first.class_id}:${first.section_id}:${first.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`)
  }, [preferredAssignment.assignment_role, preferredAssignment.class_id, preferredAssignment.section_id, uniqueSections, sectionKey])

  useEffect(() => {
    if (!exams.length) return
    const hasCurrentExam = exams.some((exam) => String(exam.id) === String(examId))
    if (hasCurrentExam) return

    const preferredExam = exams.find((exam) => String(exam.id) === String(preferredAssignment.exam_id || ''))
    setExamId(String((preferredExam || exams[0]).id))
  }, [examId, exams, preferredAssignment.exam_id])

  useEffect(() => {
    if (!visibleSections.length) {
      if (sectionKey) setSectionKey('')
      return
    }

    const hasCurrentSection = visibleSections.some((section) => (
      `${section.class_id}:${section.section_id}:${section.is_class_teacher ? 'class_teacher' : 'subject_teacher'}` === sectionKey
    ))
    if (hasCurrentSection) return

    const preferredSection = visibleSections.find((section) =>
      String(section.class_id) === String(preferredAssignment.class_id || '') &&
      String(section.section_id) === String(preferredAssignment.section_id || '')
    )
    const nextSection = preferredSection || visibleSections[0]
    setSectionKey(`${nextSection.class_id}:${nextSection.section_id}:${nextSection.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`)
  }, [preferredAssignment.class_id, preferredAssignment.section_id, sectionKey, visibleSections])

  useEffect(() => {
    if (!selectedSection || !examId) {
      setSubjectOptions([])
      setSubjectId('')
      return
    }

    getAvailableSubjects({
      examId,
      classId: selectedSection.class_id,
      sectionId: selectedSection.section_id,
    }).then((subjects) => {
      setSubjectOptions(subjects)
      if (!subjects.length) {
        setSubjectId('')
        return
      }

      const hasCurrentSubject = subjects.some((subject) => String(subject.id) === String(subjectId))
      if (hasCurrentSubject) return

      const preferredSubject = subjects.find((subject) => String(subject.id) === String(preferredAssignment.subject_id || ''))
      if (preferredSubject) {
        setSubjectId(String(preferredSubject.id))
        return
      }

      setSubjectId(String(subjects[0].id))
    }).catch(() => {
      setSubjectOptions([])
      setSubjectId('')
    })
  }, [selectedSection, getAvailableSubjects, subjectId, examId, preferredAssignment.subject_id])

  useEffect(() => {
    if (!examId || !selectedSection || !subjectId || selectionMismatch) return
    loadSummary({
      exam_id: examId,
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: subjectId,
    }).catch((error) => {
      toastError(normalizeMarksError(error))
    })
  }, [examId, selectedSection, subjectId, loadSummary, toastError, selectionMismatch])

  const distribution = useMemo(() => buildDistribution(summaryPayload?.students || []), [summaryPayload])
  const gradeDistribution = useMemo(() => buildGradeDistribution(summaryPayload?.students || []), [summaryPayload])

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header
        className="rounded-2xl border bg-surface p-6 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Marks Summary
            </h1>
            <p className="text-xs text-text-secondary">
              Performance analytics
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <GraduationCap size={12} className="text-primary" />
              Exam
            </label>
            <Select
              value={examId}
              onChange={(event) => setExamId(event.target.value)}
              options={exams.map((exam) => ({ value: String(exam.id), label: `${exam.name} | ${exam.class_name}` }))}
              placeholder="Choose exam"
              className="h-10 rounded-lg bg-surface-raised"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <Layout size={12} className="text-primary" />
              Section
            </label>
            <Select
              value={sectionKey}
              onChange={(event) => setSectionKey(event.target.value)}
              options={visibleSections.map((section) => ({
                value: `${section.class_id}:${section.section_id}:${section.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`,
                label: `${section.class_name} ${section.section_name}`,
              }))}
              placeholder="Choose section"
              className="h-10 rounded-lg bg-surface-raised"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <BookOpen size={12} className="text-primary" />
              Subject
            </label>
            <Select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              options={subjectOptions.map((subject) => ({ value: String(subject.id), label: `${subject.name}` }))}
              placeholder="Choose subject"
              className="h-10 rounded-lg bg-surface-raised"
            />
          </div>
        </div>
      </header>

      {!loadingBase && baseError ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-900">Error: {baseError}</p>
        </section>
      ) : !loadingBase && !uniqueSections.length ? (
        <section className="rounded-2xl border border-orange-100 bg-orange-50 p-6 text-center">
          <p className="text-sm font-bold text-orange-900">No Assignments Found</p>
        </section>
      ) : !examId || !sectionKey || !subjectId ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-16 text-center">
          <p className="text-sm text-text-secondary">Select details for summary</p>
        </section>
      ) : selectionMismatch ? (
        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
          <p className="text-sm font-bold text-amber-900">Mismatch</p>
        </section>
      ) : loadingBase || summaryLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          <section
            className="rounded-2xl border bg-surface p-4 flex items-center justify-between shadow-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-primary">
                <Star size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Review Status</h4>
                <p className={`text-sm font-bold ${summaryPayload?.review_status?.status === 'completed' ? 'text-success' : 'text-warning'}`}>
                  {summaryPayload?.review_status?.label || 'Pending'}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Stat icon={TrendingUp} title="Highest" value={summaryPayload?.summary?.highest ?? '--'} sub={summaryPayload?.summary?.highest_student || '—'} tone="var(--color-primary)" />
            <Stat icon={TrendingDown} title="Lowest" value={summaryPayload?.summary?.lowest ?? '--'} sub={summaryPayload?.summary?.lowest_student || '—'} tone="var(--color-error)" />
            <Stat icon={Star} title="Average" value={summaryPayload?.summary?.average ?? '--'} sub="Class Performance" tone="var(--color-text-primary)" />
            <Stat icon={Users} title="Passed" value={summaryPayload?.summary?.pass_count ?? 0} sub="Students" tone="var(--color-success)" />
            <Stat icon={Users} title="Failed" value={summaryPayload?.summary?.fail_count ?? 0} sub="Students" tone="var(--color-error)" />
            <Stat icon={Info} title="Absent" value={summaryPayload?.summary?.absent_count ?? 0} sub="Students" tone="var(--color-text-muted)" />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ChartCard title="Marks Dist." icon={BarChart3} onExport={() => exportStudents(summaryPayload?.students || [])}>
              <div className="space-y-3">
                {distribution.map((item) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...distribution.map((row) => row.count), 1)} tone="var(--color-primary)" />
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Grade Dist." icon={GraduationCap} onExport={() => exportStudents(summaryPayload?.students || [])}>
              <div className="space-y-3">
                {gradeDistribution.map((item) => (
                  <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...gradeDistribution.map((row) => row.count), 1)} tone="var(--color-success)" />
                ))}
              </div>
            </ChartCard>
          </section>

          <section
            className="overflow-hidden rounded-2xl border bg-surface shadow-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between border-b bg-surface-raised/30 p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h2 className="text-sm font-bold text-text-primary">Detailed Performance</h2>
              </div>
              <Button 
                variant="secondary" 
                icon={Download}
                onClick={() => exportStudents(summaryPayload?.students || [])}
                className="h-8 rounded-lg px-3 text-[10px]"
              >
                Export
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-raised/10">
                    {['Roll', 'Name', 'Marks', 'Grade', 'Status'].map((head) => (
                      <th key={head} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(summaryPayload?.students || []).map((student) => (
                    <tr key={`${student.roll_number}-${student.first_name}`} className="hover:bg-surface-raised/20">
                      <td className="px-4 py-3 text-xs font-mono text-text-muted">{student.roll_number || '--'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-sm font-bold">{student.is_absent ? 'AB' : (student.marks_obtained ?? '--')}</td>
                      <td className="px-4 py-3 text-sm">{student.grade || '--'}</td>
                      <td className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider ${student.is_absent ? 'text-text-muted' : student.is_pass ? 'text-success' : 'text-error'}`}>
                        {student.is_absent ? 'Absent' : student.is_pass ? 'Pass' : 'Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

const Stat = ({ icon: Icon, title, value, sub, tone }) => (
  <div
    className="rounded-xl border bg-surface p-4 shadow-sm"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between opacity-70">
      <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
      <Icon size={12} style={{ color: tone }} />
    </div>
    <p className="mt-1 text-xl font-bold tracking-tight" style={{ color: tone }}>{value}</p>
    <p className="mt-0.5 truncate text-[9px] font-semibold text-text-secondary">{sub}</p>
  </div>
)

const ChartCard = ({ title, icon: Icon, children, onExport }) => (
  <section
    className="rounded-2xl border bg-surface p-5 shadow-sm"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between border-b border-dashed pb-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      </div>
      <Button variant="ghost" size="sm" onClick={onExport} className="text-[9px] font-bold uppercase">Export</Button>
    </div>
    <div className="mt-4">{children}</div>
  </section>
)

const BarRow = ({ label, value, max, tone }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
      <span className="text-text-primary">{label}</span>
      <span className="text-text-secondary">{value}</span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-surface-raised">
      <div className="h-full rounded-full" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: tone }} />
    </div>
  </div>
)

const buildDistribution = (students) => {
  const buckets = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 1000, count: 0 },
  ]
  students.forEach((student) => {
    if (student.is_absent || student.marks_obtained == null) return
    const mark = Number(student.marks_obtained)
    const bucket = buckets.find((item) => mark >= item.min && mark <= item.max)
    if (bucket) bucket.count += 1
  })
  return buckets
}

const buildGradeDistribution = (students) => {
  const map = new Map()
  students.forEach((student) => {
    const key = student.grade || 'NA'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return [...map.entries()].map(([label, count]) => ({ label, count }))
}

const exportStudents = (students) => {
  const rows = [
    ['Roll', 'Name', 'Marks', 'Grade', 'Status'],
    ...students.map((student) => [
      student.roll_number || '',
      `${student.first_name} ${student.last_name}`,
      student.is_absent ? 'AB' : (student.marks_obtained ?? ''),
      student.grade || '',
      student.is_absent ? 'Absent' : student.is_pass ? 'Pass' : 'Fail',
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'marks-summary.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default MarksSummary
