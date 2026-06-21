import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, BookOpen, GraduationCap, Layout, Lock, Info, Search, FilterX, Users, ChevronRight, RefreshCw } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useMarksEntry from '@/hooks/useMarksEntry'
import Select from '@/components/ui/Select'
import MarksEntryTable from '@/components/teacher/MarksEntryTable'
import { cn } from '@/utils/helpers'

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
    assignments,
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

  const visibleSections = uniqueSections

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

  // Compute subject options based on the selected section and teacher assignments
  const subjectOptions = useMemo(() => {
    if (!selectedSection || !assignments.length) return []
    const map = new Map()
    assignments.forEach((assignment) => {
      if (
        String(assignment.class_id) === String(selectedSection.class_id) &&
        String(assignment.section_id) === String(selectedSection.section_id) &&
        assignment.subject_id
      ) {
        const key = String(assignment.subject_id)
        if (!map.has(key)) {
          map.set(key, {
            id: Number(assignment.subject_id),
            name: assignment.subject_name,
            code: assignment.subject_code,
          })
        }
      }
    })
    return Array.from(map.values())
  }, [selectedSection, assignments])

  // Automatically select a subject when subjectOptions changes
  useEffect(() => {
    if (!subjectOptions.length) {
      setSubjectId('')
      return
    }

    const hasCurrentSubject = subjectOptions.some((sub) => String(sub.id) === String(subjectId))
    if (hasCurrentSubject) return

    const preferredSubject = subjectOptions.find((sub) => String(sub.id) === String(preferredAssignment.subject_id || ''))
    if (preferredSubject) {
      setSubjectId(String(preferredSubject.id))
    } else {
      setSubjectId(String(subjectOptions[0].id))
    }
  }, [subjectOptions, subjectId, preferredAssignment.subject_id])

  // Automatically resolve the examId when selectedSection and subjectId change
  useEffect(() => {
    if (!selectedSection || !subjectId || !exams.length) {
      setExamId('')
      return
    }

    const matched = exams.find((slot) =>
      String(slot.class_id) === String(selectedSection.class_id) &&
      String(slot.section_id) === String(selectedSection.section_id) &&
      String(slot.subject_id) === String(subjectId)
    )

    if (matched) {
      setExamId(String(matched.id))
    } else {
      setExamId('')
    }
  }, [selectedSection, subjectId, exams])

  useEffect(() => {
    if (!examId || !selectedSection || !subjectId) return
    loadEntry({
      exam_id: examId,
      class_id: selectedSection.class_id,
      section_id: selectedSection.section_id,
      subject_id: subjectId,
    }).then((data) => {
      const next = {}
      ;(data?.students || []).forEach((row) => {
        const isAbsentDay = row.attendance_status === 'absent'
        next[row.enrollment_id] = {
          marks_obtained: isAbsentDay ? '' : (row.marks_obtained ?? ''),
          theory_marks_obtained: isAbsentDay ? '' : (row.theory_marks_obtained ?? ''),
          practical_marks_obtained: isAbsentDay ? '' : (row.practical_marks_obtained ?? ''),
          is_absent: isAbsentDay || !!row.is_absent,
        }
      })
      setState(next)
    }).catch((error) => {
      toastError(normalizeMarksError(error))
    })
  }, [examId, selectedSection, subjectId, loadEntry, toastError])

  const currentSubject = useMemo(() => {
    if (!entryPayload?.students?.length) return subjectOptions.find((subject) => String(subject.id) === String(subjectId)) || null
    const row = entryPayload.students[0]
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

  const persistAll = useCallback(async () => {
    if (!selectedSection || !subjectId || !examId || !entryPayload?.students?.length) return

    const entries = entryPayload.students.map((row) => {
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
  }, [selectedSection, subjectId, examId, entryPayload, state, currentSubject, saveEntry])

  useEffect(() => {
    if (entryPayload?.students?.length && !entryPayload.locked) {
      if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
      autoSaveRef.current = window.setInterval(() => {
        persistAll().catch(() => {})
      }, 30000)
    }

    return () => {
      if (autoSaveRef.current) window.clearInterval(autoSaveRef.current)
    }
  }, [entryPayload?.students?.length, entryPayload?.locked, persistAll])

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
              Enter Marks
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Record and manage student examination marks for your assigned classes and subjects.
            </p>
          </div>
          {entryPayload?.locked && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-amber-700 ring-1 ring-amber-200">
              <Lock size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Locked</span>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-3">
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
          <div className="space-y-1.5 xl:col-span-3">
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
            <p className="mt-1 text-sm text-text-muted">You are not assigned to any subjects for marks entry.</p>
          </div>
        ) : !sectionKey || !subjectId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-24 text-center">
            <Search size={48} className="text-primary/30 mb-4" />
            <h3 className="text-xl font-bold text-text-primary">Select Configuration</h3>
            <p className="mt-2 text-sm text-text-muted max-w-xs mx-auto">
              Choose a section and subject from the filters above to start entering marks.
            </p>
          </div>
        ) : !examId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface-raised/20 py-24 text-center">
            <AlertTriangle size={48} className="text-amber-500/50 mb-4" />
            <h3 className="text-xl font-bold text-text-primary">No Active Examination</h3>
            <p className="mt-2 text-sm text-text-muted max-w-xs mx-auto">
              There is no published examination configured for the selected class, section, and subject.
            </p>
          </div>
        ) : loadingBase || loadingEntry ? (
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw size={32} className="animate-spin text-primary mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Fetching Records...</p>
          </div>
        ) : entryPayload?.students?.length ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MarksEntryTable
              rows={entryPayload.students}
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
                  toastSuccess('Draft saved.')
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
                  toastSuccess('Marks submitted.')
                  const refreshed = await loadEntry({
                    exam_id: examId,
                    class_id: selectedSection.class_id,
                    section_id: selectedSection.section_id,
                    subject_id: subjectId,
                  })
                  setState(Object.fromEntries((refreshed?.students || []).map((row) => {
                    const isAbsentDay = row.attendance_status === 'absent'
                    return [row.enrollment_id, {
                      marks_obtained: isAbsentDay ? '' : (row.marks_obtained ?? ''),
                      theory_marks_obtained: isAbsentDay ? '' : (row.theory_marks_obtained ?? ''),
                      practical_marks_obtained: isAbsentDay ? '' : (row.practical_marks_obtained ?? ''),
                      is_absent: isAbsentDay || !!row.is_absent,
                    }]
                  })))
                } catch (error) {
                  toastError(error?.message || 'Failed to submit.')
                }
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <Users size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-bold text-text-primary">No Students Found</h3>
            <p className="mt-1 text-sm text-text-muted">No enrolled students found in this section.</p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      {currentSubject && (
        <section
          className="rounded-2xl border bg-surface p-5 shadow-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised text-text-secondary">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Subject Scheme</h4>
                <p className="text-xs text-text-secondary">Criteria for {currentSubject.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Type</p>
                <p className="text-xs font-bold text-primary uppercase">{currentSubject.subject_type || 'Theory'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total</p>
                <p className="text-xs font-bold text-text-primary">{currentSubject.combined_total_marks || '--'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Pass</p>
                <p className="text-xs font-bold text-red-600">{currentSubject.combined_passing_marks || '--'}</p>
              </div>
            </div>

            <div className={cn(
              "rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest",
              entryPayload?.review_status?.status === 'completed' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
            )}>
              {entryPayload?.review_status?.label || 'Draft'}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default EnterMarks
