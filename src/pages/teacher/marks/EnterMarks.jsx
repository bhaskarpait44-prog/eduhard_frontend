import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, BookOpen, GraduationCap, Layout, Lock, Info, CheckCircle2 } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import MarksEntryTable from '@/components/teacher/MarksEntryTable'

const normalizeMarksError = (error) => {
  const message = error?.message || ''
  if (message.includes('Only the assigned subject teacher can enter or review marks for this subject')) {
    return 'This subject is not assigned to you for marks entry. Choose one of your assigned subjects.'
  }
  if (message.includes('Selected exam does not belong to this class or active session')) {
    return 'This exam does not match the selected section. Choose the section from the same class as the exam.'
  }
  return message || 'Failed to load marks entry.'
}

const EnterMarks = () => {
  usePageTitle('Enter Marks')

  const { toastError, toastSuccess } = useToast()
  const location = useLocation()
  const {
    uniqueSections,
    exams,
    baseError,
    loadingBase,
    loadingEntry,
    saving,
    entryPayload,
    getAvailableSubjects,
    loadEntry,
    saveEntry,
    submitForReview,
  } = useMarksEntry()

  const [examId, setExamId] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjectOptions, setSubjectOptions] = useState([])
  const [state, setState] = useState({})
  const [lastSavedAt, setLastSavedAt] = useState('')
  const autoSaveRef = useRef(null)
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
    loadEntry({
      exam_id: examId,
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: subjectId,
    }).then((data) => {
      const next = {}
      ;(data?.rows || []).forEach((row) => {
        next[row.enrollment_id] = {
          marks_obtained: row.marks_obtained ?? '',
          theory_marks_obtained: row.theory_marks_obtained ?? '',
          practical_marks_obtained: row.practical_marks_obtained ?? '',
          is_absent: !!row.is_absent,
        }
      })
      setState(next)
    }).catch((error) => {
      toastError(normalizeMarksError(error))
    })
  }, [examId, selectedSection, subjectId, loadEntry, toastError, selectionMismatch])

  const currentSubject = useMemo(() => {
    if (!entryPayload?.rows?.length) return subjectOptions.find((subject) => String(subject.id) === String(subjectId)) || null
    const row = entryPayload.rows[0]
    return {
      id: Number(subjectId),
      name: row.subject_name,
      code: row.subject_code,
      subject_type: row.subject_type,
      combined_total_marks: row.combined_total_marks,
      combined_passing_marks: row.combined_passing_marks,
      theory_total_marks: row.theory_total_marks,
      theory_passing_marks: row.theory_passing_marks,
      practical_total_marks: row.practical_total_marks,
      practical_passing_marks: row.practical_passing_marks,
    }
  }, [entryPayload, subjectId, subjectOptions])

  const persistAll = async () => {
    if (!selectedSection || !subjectId || !examId || !entryPayload?.rows?.length) return

    const entries = entryPayload.rows.map((row) => {
      const record = state[row.enrollment_id] || {}
      return {
        exam_id: Number(examId),
        class_id: Number(selectedSection.class_id),
        section_id: Number(selectedSection.section_id),
        subject_id: Number(subjectId),
        enrollment_id: Number(row.enrollment_id),
        is_absent: !!record.is_absent,
        marks_obtained: currentSubject?.subject_type === 'both'
          ? null
          : (record.marks_obtained === '' ? null : Number(record.marks_obtained)),
        theory_marks_obtained: currentSubject?.subject_type === 'both'
          ? (record.theory_marks_obtained === '' ? null : Number(record.theory_marks_obtained))
          : null,
        practical_marks_obtained: currentSubject?.subject_type === 'both'
          ? (record.practical_marks_obtained === '' ? null : Number(record.practical_marks_obtained))
          : null,
      }
    })

    await saveEntry({ entries }, true)
    setLastSavedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
  }

  useEffect(() => {
    if (entryPayload?.rows?.length) {
      if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
      autoSaveRef.current = window.setInterval(() => {
        persistAll().catch(() => {})
      }, 30000)
    }

    return () => {
      if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
    }
  }, [entryPayload, state, currentSubject, examId, selectedSection, subjectId])

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header
        className="rounded-2xl border bg-surface p-6 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layout size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Enter Marks
              </h1>
              <p className="text-xs text-text-secondary">
                Submit performance records
              </p>
            </div>
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

      {baseError && !loadingBase ? (
        <section className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-red-900">Error: {baseError}</p>
        </section>
      ) : !loadingBase && !uniqueSections.length ? (
        <section className="rounded-2xl border border-orange-100 bg-orange-50 p-6 text-center">
          <p className="text-sm font-bold text-orange-900">No Assignments Found</p>
        </section>
      ) : entryPayload?.locked && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-3 shadow-sm">
          <Lock size={16} className="text-teal-600" />
          <p className="text-xs font-semibold text-teal-900">Marks are locked (Submitted for review)</p>
        </div>
      )}

      {!examId || !sectionKey || !subjectId ? (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-16 text-center">
          <p className="text-sm text-text-secondary">Select details to begin</p>
        </section>
      ) : selectionMismatch ? (
        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
          <p className="text-sm font-bold text-amber-900">Exam/Section Mismatch</p>
        </section>
      ) : loadingBase || loadingEntry ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : entryPayload?.rows?.length ? (
        <MarksEntryTable
          rows={entryPayload.rows}
          subject={currentSubject}
          state={state}
          locked={entryPayload.locked}
          reviewStatus={entryPayload.review_status}
          saving={saving}
          lastSavedAt={lastSavedAt}
          onChange={(enrollmentId, field, value) => {
            setState((prev) => ({
              ...prev,
              [enrollmentId]: {
                ...prev[enrollmentId],
                ...(field === 'is_absent'
                  ? value
                    ? { is_absent: true, marks_obtained: '', theory_marks_obtained: '', practical_marks_obtained: '' }
                    : { ...prev[enrollmentId], is_absent: false }
                  : { [field]: value }),
              },
            }))
          }}
          onSaveAll={async () => {
            try {
              await persistAll()
              toastSuccess('Saved.')
            } catch (error) {
              toastError(error?.message || 'Failed to save.')
            }
          }}
          onSubmit={async () => {
            try {
              await persistAll()
              await submitForReview({
                exam_id: Number(examId),
                class_id: Number(selectedSection.class_id),
                section_id: Number(selectedSection.section_id),
                subject_id: Number(subjectId),
              })
              toastSuccess('Submitted.')
              const refreshed = await loadEntry({
                exam_id: examId,
                class_id: selectedSection.class_id,
                section_id: selectedSection.section_id,
                subject_id: subjectId,
              })
              setState(Object.fromEntries((refreshed?.rows || []).map((row) => [row.enrollment_id, {
                marks_obtained: row.marks_obtained ?? '',
                theory_marks_obtained: row.theory_marks_obtained ?? '',
                practical_marks_obtained: row.practical_marks_obtained ?? '',
                is_absent: !!row.is_absent,
              }])))
            } catch (error) {
              toastError(error?.message || 'Failed to submit.')
            }
          }}
        />
      ) : (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-16 text-center">
          <p className="text-sm text-text-secondary">No students found</p>
        </section>
      )}

      {currentSubject && (
        <section
          className="rounded-2xl border bg-surface p-5 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-text-secondary">
                <Info size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Subject Info</h4>
                <div className="mt-0.5 flex gap-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  <span>Type: <span className="text-primary">{currentSubject.subject_type || 'theory'}</span></span>
                  <span>Total: {currentSubject.combined_total_marks || '--'}</span>
                  <span>Pass: {currentSubject.combined_passing_marks || '--'}</span>
                </div>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${entryPayload?.review_status?.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
              {entryPayload?.review_status?.label || 'Pending'}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default EnterMarks
