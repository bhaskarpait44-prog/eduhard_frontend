import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, BookOpen, GraduationCap, Layout, Info, BarChart3, TrendingUp, TrendingDown, Users, Download, Star, CheckCircle2, RefreshCw, FilterX, Search, ChevronRight } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/helpers'

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
    if (first) {
      setSectionKey(`${first.class_id}:${first.section_id}:${first.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`)
    }
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
    <div className="space-y-6">
      {/* ── Header ── */}
      <section className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#0f766e' }}>
              Academic Performance
            </p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Marks Summary
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              View performance analytics, grade distributions, and student-wise result summaries.
            </p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Examination</label>
            <Select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              options={exams.map((ex) => ({ value: String(ex.id), label: ex.name }))}
              placeholder="Choose Exam"
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Class & Section</label>
            <Select
              value={sectionKey}
              onChange={(e) => setSectionKey(e.target.value)}
              options={visibleSections.map((s) => ({
                value: `${s.class_id}:${s.section_id}:${s.is_class_teacher ? 'class_teacher' : 'subject_teacher'}`,
                label: `${s.class_name} ${s.section_name}`,
              }))}
              placeholder="Choose Section"
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Subject</label>
            <Select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={subjectOptions.map((s) => ({ value: String(s.id), label: s.name }))}
              placeholder="Choose Subject"
              className="h-9 px-3 py-1 rounded-xl bg-surface-raised border border-border/50 text-xs font-semibold focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="min-h-[400px]">
        {baseError && !loadingBase ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 py-20 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900">Configuration Error</h3>
            <p className="mt-1 text-sm text-red-700 max-w-md">{baseError}</p>
          </div>
        ) : !loadingBase && !uniqueSections.length ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <FilterX size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-bold text-text-primary">No Assignments Found</h3>
            <p className="mt-1 text-sm text-text-muted">You are not assigned to any subjects for marks review.</p>
          </div>
        ) : !examId || !sectionKey || !subjectId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-24 text-center">
            <Search size={48} className="text-primary/30 mb-4" />
            <h3 className="text-xl font-bold text-text-primary">Select Configuration</h3>
            <p className="mt-2 text-sm text-text-muted max-w-xs mx-auto">
              Choose an exam, section, and subject from the filters above to view the performance summary.
            </p>
          </div>
        ) : selectionMismatch ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/50 py-20 text-center">
            <AlertTriangle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-amber-900">Mismatched Selection</h3>
            <p className="mt-1 text-sm text-amber-700">The selected exam and section classes do not match.</p>
          </div>
        ) : loadingBase || summaryLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw size={32} className="animate-spin text-primary mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Fetching Records...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Status Banner ── */}
            <div
              className="rounded-2xl border bg-surface p-4 flex items-center justify-between shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Star size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Current Review Status</h4>
                  <p className={cn(
                    "text-sm font-bold mt-0.5",
                    summaryPayload?.review_status?.status === 'completed' ? 'text-success' : 'text-orange-600'
                  )}>
                    {summaryPayload?.review_status?.label || 'Draft / In Progress'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Analytics Grid ── */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat icon={TrendingUp} title="Highest" value={summaryPayload?.summary?.highest ?? '--'} sub={summaryPayload?.summary?.highest_student || '—'} tone="var(--color-primary)" />
              <Stat icon={TrendingDown} title="Lowest" value={summaryPayload?.summary?.lowest ?? '--'} sub={summaryPayload?.summary?.lowest_student || '—'} tone="var(--color-error)" />
              <Stat icon={Star} title="Average" value={summaryPayload?.summary?.average ?? '--'} sub="Class Performance" tone="var(--color-text-primary)" />
              <Stat icon={Users} title="Passed" value={summaryPayload?.summary?.pass_count ?? 0} sub="Students" tone="var(--color-success)" />
              <Stat icon={Users} title="Failed" value={summaryPayload?.summary?.fail_count ?? 0} sub="Students" tone="var(--color-error)" />
              <Stat icon={Info} title="Absent" value={summaryPayload?.summary?.absent_count ?? 0} sub="Students" tone="var(--color-text-muted)" />
            </section>

            {/* ── Visual Distributions ── */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartCard title="Marks Distribution" icon={BarChart3} onExport={() => exportStudents(summaryPayload?.students || [])}>
                <div className="space-y-4">
                  {distribution.map((item) => (
                    <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...distribution.map((row) => row.count), 1)} tone="var(--color-primary)" />
                  ))}
                </div>
              </ChartCard>
              <ChartCard title="Grade Distribution" icon={GraduationCap} onExport={() => exportStudents(summaryPayload?.students || [])}>
                <div className="space-y-4">
                  {gradeDistribution.map((item) => (
                    <BarRow key={item.label} label={item.label} value={item.count} max={Math.max(...gradeDistribution.map((row) => row.count), 1)} tone="var(--color-success)" />
                  ))}
                </div>
              </ChartCard>
            </section>

            {/* ── Detailed Table ── */}
            <section
              className="overflow-hidden rounded-2xl border bg-surface shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center justify-between border-b bg-surface-raised/30 p-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layout size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-text-primary">Student-wise Performance</h2>
                </div>
                <Button 
                  variant="outline" 
                  icon={Download}
                  onClick={() => exportStudents(summaryPayload?.students || [])}
                  className="h-9 rounded-xl px-4 text-xs font-bold"
                >
                  Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-surface-raised/10" style={{ borderColor: 'var(--color-border)' }}>
                      {[
                        { label: 'Roll', width: '70px', align: 'center' },
                        { label: 'Student Information', width: 'auto', align: 'left' },
                        { label: 'Marks', width: '100px', align: 'center' },
                        { label: 'Grade', width: '80px', align: 'center' },
                        { label: 'Status', width: '100px', align: 'center' }
                      ].map((col) => (
                        <th 
                          key={col.label} 
                          className={cn(
                            "px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted",
                            col.align === 'center' ? 'text-center' : 'text-left'
                          )}
                          style={{ width: col.width }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {(summaryPayload?.students || []).map((student) => (
                      <tr key={`${student.roll_number}-${student.first_name}`} className="hover:bg-surface-raised/40 transition-colors group">
                        <td className="px-4 py-3 text-center text-xs font-mono font-bold text-text-muted">{student.roll_number || '--'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                              {student.first_name} {student.last_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">ID: {student.student_id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-black">
                          {student.is_absent ? (
                            <span className="text-text-muted/50">AB</span>
                          ) : (
                            <span className={cn(student.is_pass ? 'text-success' : 'text-error')}>
                              {student.marks_obtained ?? '--'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-xs font-bold text-text-primary">
                            {student.grade || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            student.is_absent 
                              ? 'bg-slate-100 text-slate-500' 
                              : student.is_pass 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                          )}>
                            {student.is_absent ? 'Absent' : student.is_pass ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

const Stat = ({ icon: Icon, title, value, sub, tone }) => (
  <div
    className="rounded-2xl border bg-surface p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-raised" style={{ color: tone }}>
        <Icon size={16} />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{title}</p>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-black tracking-tight leading-none" style={{ color: tone }}>{value}</p>
      <p className="mt-1.5 truncate text-[10px] font-bold text-text-muted uppercase tracking-tighter">{sub}</p>
    </div>
  </div>
)

const ChartCard = ({ title, icon: Icon, children, onExport }) => (
  <section
    className="rounded-2xl border bg-surface p-5 sm:p-6 shadow-sm"
    style={{ borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center justify-between border-b border-dashed pb-4 mb-5" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={18} />
        </div>
        <h2 className="text-sm font-bold text-text-primary tracking-tight">{title}</h2>
      </div>
      <Button variant="ghost" onClick={onExport} className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">Export</Button>
    </div>
    <div>{children}</div>
  </section>
)

const BarRow = ({ label, value, max, tone }) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
      <span className="text-text-primary">{label}</span>
      <span className="text-text-muted">{value} Students</span>
    </div>
    <div className="h-2 w-full rounded-full bg-surface-raised overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: tone }} 
      />
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

