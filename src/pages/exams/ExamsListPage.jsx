import { useEffect, useState, useMemo } from 'react'
import { Plus, ClipboardList, PenLine, Trash2, ShieldCheck, Send, BookOpen, AlertCircle, BarChart3, CalendarDays, Printer, Copy, ChevronDown, ChevronUp, Check, Wand2, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useExamStore from '@/store/examStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import CreateExamModal from './CreateExamModal'
import ReviewExamSubjectsModal from './ReviewExamSubjectsModal'
import AdmitCardModal from './AdmitCardModal'
import TimePicker12h from '@/components/shared/TimePicker12h'
import { getExamSubjects, updateExamTimetable, downloadExamTimetablePdf, downloadClassTimetablePdf } from '@/api/examsApi'
import { getUsers } from '@/api/userManagementApi'
import { formatDate, getExamTypeLabel, formatTime } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'

/* ─── Config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  draft:      { label: 'Draft',     variant: 'grey'  },
  published:  { label: 'Published', variant: 'green' },
  upcoming:   { label: 'Upcoming',  variant: 'blue'  },
  ongoing:    { label: 'Ongoing',   variant: 'green' },
  completed:  { label: 'Completed', variant: 'grey'  },
}

const TYPE_CFG = {
  term:        { bg: '#eff6ff', color: '#1d4ed8' },
  midterm:     { bg: '#fefce8', color: '#a16207' },
  final:       { bg: '#f0fdf4', color: '#15803d' },
  compartment: { bg: '#fef2f2', color: '#b91c1c' },
}

/* ─── Tiny helpers ───────────────────────────────────────── */
const TypePill = ({ examType, examName }) => {
  const cfg = TYPE_CFG[examType] || { bg: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {getExamTypeLabel(examType, examName)}
    </span>
  )
}

const ActionBtn = ({ icon: Icon, onClick, children, danger = false, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
    style={{ color: danger ? '#b91c1c' : 'var(--color-text-secondary)', background: 'transparent' }}
    onMouseEnter={e => {
      e.currentTarget.style.background = danger ? '#fef2f2' : 'var(--color-surface-raised)'
      e.currentTarget.style.color      = danger ? '#991b1b' : 'var(--color-text-primary)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.color      = danger ? '#b91c1c' : 'var(--color-text-secondary)'
    }}
  >
    <Icon size={12} strokeWidth={2} />
    {children}
  </button>
)

/* ─── Single exam row inside a class card ────────────────── */
const ExamRow = ({ exam, isLast, onReview, onMarks, onTimetable, onAdmitCard, onToggleStatus, onDelete, onDownloadTimetable }) => {
  const navigate = useNavigate()
  const statusCfg = STATUS_CFG[exam.status] || { label: exam.status, variant: 'grey' }
  const pending   = Number(exam.pending_review_count || 0)

  return (
    <div
      className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 transition-colors"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* left: name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {exam.name}
          </p>
          <div className="flex items-center gap-2">
            <TypePill examType={exam.exam_type} examName={exam.name} />
            <Badge variant={statusCfg.variant} dot className="text-[10px] uppercase tracking-wider">{statusCfg.label}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {formatDate(exam.start_date)} → {formatDate(exam.end_date)}
          </span>
          <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {exam.subject_count || 0} subjects
            <span style={{ color: '#15803d' }}> · {exam.approved_subject_count || 0} approved</span>
            {pending > 0 && <span style={{ color: '#d97706' }}> · {pending} pending</span>}
          </span>
        </div>
      </div>

      {/* right: actions */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:justify-end">
        <ActionBtn icon={BarChart3} onClick={() => navigate(`/exams/${exam.id}/analytics`)} title="View Analytics">Stats</ActionBtn>
        <ActionBtn icon={CalendarDays} onClick={() => onTimetable(exam)} title="Add timetable">Timetable</ActionBtn>
        <ActionBtn icon={ShieldCheck} onClick={() => onReview(exam)} title="Review subjects">Review</ActionBtn>
        {exam.status !== 'draft' && (
          <ActionBtn icon={PenLine} onClick={onMarks} title="Enter marks">Marks</ActionBtn>
        )}
        <ActionBtn icon={Printer} onClick={() => onAdmitCard(exam)} title="Generate Admit Cards">Cards</ActionBtn>
        <ActionBtn
          icon={Send}
          onClick={() => onToggleStatus(exam)}
          title={exam.status === 'published' ? 'Move to draft' : 'Publish'}
        >
          {exam.status === 'published' ? 'Unpublish' : 'Publish'}
        </ActionBtn>
        <ActionBtn icon={Trash2} onClick={() => onDelete(exam)} danger title="Delete">Delete</ActionBtn>
      </div>
    </div>
  )
}


/* ─── Class card ─────────────────────────────────────────── */
const ClassCard = ({ className, exams, onReview, onMarks, onTimetable, onAdmitCard, onToggleStatus, onDelete, onCreateForClass, onDownloadTimetable, onDownloadClassTimetable }) => {
  const total     = exams.length
  const published = exams.filter(e => ['published', 'ongoing'].includes(e.status)).length
  const draft     = exams.filter(e => e.status === 'draft').length
  const pending   = exams.reduce((acc, e) => acc + Number(e.pending_review_count || 0), 0)

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* card header */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ background: '#e0e7ff', color: '#4338ca' }}
          >
            <BookOpen size={14} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {className || 'Unassigned'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {total} exam{total !== 1 ? 's' : ''}
              {published > 0 && <span style={{ color: '#15803d' }}> · {published} published</span>}
              {draft > 0     && <span style={{ color: 'var(--color-text-muted)' }}> · {draft} draft</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ background: '#fef9c3', color: '#a16207' }}
            >
              <AlertCircle size={11} strokeWidth={2} />
              {pending} pending
            </span>
          )}
          <button
            onClick={() => onCreateForClass(className)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-text-secondary)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#e0e7ff'
              e.currentTarget.style.color      = '#4338ca'
              e.currentTarget.style.borderColor= '#c7d2fe'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'var(--color-surface)'
              e.currentTarget.style.color       = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add Exam
          </button>
        </div>
      </div>

      {/* exam rows */}
      <div>
        {exams.map((exam, idx) => (
          <ExamRow
            key={exam.id}
            exam={exam}
            isLast={idx === exams.length - 1}
            onReview={onReview}
            onMarks={onMarks}
            onTimetable={onTimetable}
            onAdmitCard={onAdmitCard}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
            onDownloadTimetable={onDownloadTimetable}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Summary strip ──────────────────────────────────────── */
const SummaryStrip = ({ exams, classCount }) => {
  const total     = exams.length
  const published = exams.filter(e => ['published', 'ongoing'].includes(e.status)).length
  const pending   = exams.reduce((acc, e) => acc + Number(e.pending_review_count || 0), 0)

  const items = [
    { label: 'Classes',   value: classCount },
    { label: 'Exams',     value: total },
    { label: 'Published', value: published, color: '#15803d' },
    { label: 'Pending',   value: pending,   color: pending > 0 ? '#d97706' : undefined },
  ]

  return (
    <div
      className="flex items-center gap-0 rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex-1 px-5 py-3.5"
          style={{ borderRight: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {item.label}
          </p>
          <p className="text-xl font-bold" style={{ color: item.color || 'var(--color-text-primary)' }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════ */
const ExamsListPage = ({ onNavigate }) => {
  const { toastError, toastSuccess } = useToast()
  const { exams, isLoading, isSaving, fetchExams, deleteExam, changeExamStatus } = useExamStore()
  const { sessions, currentSession, fetchSessions } = useSessionStore()

  const [sessionId,       setSessionId]       = useState('')
  const [createOpen,      setCreateOpen]       = useState(false)
  const [prefillClass,    setPrefillClass]     = useState(null)
  const [deleteTarget,    setDeleteTarget]     = useState(null)
  const [reviewTarget,    setReviewTarget]     = useState(null)
  const [timetableTarget, setTimetableTarget]  = useState(null)
  const [admitCardTarget, setAdmitCardTarget]  = useState(null)

  useEffect(() => { fetchSessions().catch(() => {}) }, [fetchSessions])

  useEffect(() => {
    if (currentSession && !sessionId) {
      setSessionId(String(currentSession.id))
    }
  }, [currentSession, sessionId])

  useEffect(() => {
    if (!sessionId) return
    fetchExams({ session_id: sessionId }).catch(() => toastError('Failed to load exams'))
  }, [sessionId, fetchExams, toastError])

  /* ── group by class_name + stream, sort naturally ── */
  const { groupKeys, examsByGroup } = useMemo(() => {
    const groups = {}
    for (const exam of exams) {
      const streamLabel = exam.class_stream ? ` (${exam.class_stream.charAt(0).toUpperCase() + exam.class_stream.slice(1)})` : ''
      const key = exam.class_name ? `${exam.class_name}${streamLabel}` : 'Unassigned'
      if (!groups[key]) groups[key] = []
      groups[key].push(exam)
    }
    const sorted = Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1
      if (b === 'Unassigned') return -1
      const na = parseInt(a.replace(/\D/g, ''), 10)
      const nb = parseInt(b.replace(/\D/g, ''), 10)
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b)
    })
    return { groupKeys: sorted, examsByGroup: groups }
  }, [exams])

  /* ── actions ── */
  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteExam(deleteTarget.id)
    if (result.success) {
      toastSuccess('Exam deleted successfully')
      setDeleteTarget(null)
    } else {
      toastError(result.message || 'Failed to delete exam')
    }
  }

  const handleToggleStatus = async (exam) => {
    const next = exam.status === 'published' ? 'draft' : 'published'
    const result = await changeExamStatus(exam.id, { status: next })
    if (result.success) {
      toastSuccess(next === 'published' ? 'Exam published' : 'Exam moved to draft')
    } else {
      toastError(result.message || 'Failed to update status')
    }
  }

  const handleCreateForClass = (groupKey) => {
    const examsInGroup = examsByGroup[groupKey]
    if (examsInGroup && examsInGroup.length > 0) {
      setPrefillClass(examsInGroup[0].class_id)
    } else {
      setPrefillClass(null)
    }
    setCreateOpen(true)
  }

  const handleDownloadTimetable = async (exam) => {
    try {
      const res = await downloadExamTimetablePdf(exam.id)
      downloadBlob(res, `${exam.name.replace(/\s+/g, '_')}_Timetable.pdf`)
    } catch (err) {
      toastError('Failed to download exam timetable')
    }
  }

  const handleDownloadClassTimetable = async (groupKey) => {
    const examsInGroup = examsByGroup[groupKey]
    if (!examsInGroup || examsInGroup.length === 0) return
    const firstExam = examsInGroup[0]
    try {
      const res = await downloadClassTimetablePdf({ 
        class_id: firstExam.class_id, 
        session_id: sessionId 
      })
      downloadBlob(res, `${groupKey.replace(/\s+/g, '_')}_Class_Exam_Timetable.pdf`)
    } catch (err) {
      toastError('Failed to download class exam timetable')
    }
  }

  /* ────────────────────────── render ─────────────────────── */
  return (
    <div className="space-y-4">

      {/* toolbar */}
      <div
        className="flex flex-col gap-3 rounded-2xl px-4 py-3.5 sm:flex-row sm:items-end"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Select
          label="Academic session"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          options={(sessions || []).map(s => ({ 
            value: String(s.id), 
            label: `${s.name}${s.is_current ? ' (Current)' : ''}` 
          }))}
          containerClassName="flex-1"
        />
        <Button icon={Plus} onClick={() => { setPrefillClass(null); setCreateOpen(true) }}>
          Create Exam
        </Button>
      </div>

      {/* content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-raised)' }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description="Create your first subject-linked exam for this session."
            action={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Exam</Button>}
            className="border-0 rounded-none"
          />
        </div>
      ) : (
        <div className="space-y-4">

          {/* summary */}
          <SummaryStrip exams={exams} classCount={groupKeys.length} />

          {/* one card per class/stream group */}
          {groupKeys.map(gk => (
            <ClassCard
              key={gk}
              className={gk}
              exams={examsByGroup[gk]}
              onReview={setReviewTarget}
              onMarks={() => onNavigate('marks')}
              onTimetable={setTimetableTarget}
              onAdmitCard={setAdmitCardTarget}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeleteTarget}
              onCreateForClass={handleCreateForClass}
              onDownloadTimetable={handleDownloadTimetable}
            />
          ))}
        </div>
      )}

      {/* modals */}
      <CreateExamModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setPrefillClass(null) }}
        onCreated={(createdExam) => setTimetableTarget(createdExam)}
        sessionId={sessionId}
        prefillClassId={prefillClass}
      />
      <ReviewExamSubjectsModal exam={reviewTarget} open={!!reviewTarget} onClose={() => setReviewTarget(null)} />
      <ExamTimetableModal 
        exam={timetableTarget} 
        open={!!timetableTarget} 
        onClose={() => setTimetableTarget(null)} 
        onDownloadTimetable={handleDownloadTimetable}
      />
      <AdmitCardModal exam={admitCardTarget} open={!!admitCardTarget} onClose={() => setAdmitCardTarget(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exam"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone. Exams with entered marks cannot be deleted.`
            : ''
        }
        confirmLabel={isSaving ? 'Deleting…' : 'Delete'}
        loading={isSaving}
        variant="danger"
      />
    </div>
  )
}

const ExamTimetableModal = ({ exam, open, onClose, onDownloadTimetable }) => {
  const { toastError, toastSuccess } = useToast()
  const [rows, setRows] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showQuickFill, setShowQuickFill] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // Quick fill state
  const [bulkStart, setBulkStart] = useState('')
  const [bulkEnd, setBulkEnd] = useState('')
  const [bulkTeacher, setBulkTeacher] = useState('')

  /* ── Utility: Duration & Dates ── */
  const calcDuration = (start, end) => {
    if (!start || !end) return '—'
    try {
      const [sh, sm] = start.split(':').map(Number)
      const [eh, em] = end.split(':').map(Number)
      const diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff <= 0) return '—'
      const h = Math.floor(diff / 60), m = diff % 60
      return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
    } catch (e) { return '—' }
  }

  const addWorkingDays = (startDate, count) => {
    const dates = []
    const d = new Date(startDate)
    if (isNaN(d.getTime())) return []
    while (dates.length < count) {
      if (d.getDay() !== 0) dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
    return dates
  }

  useEffect(() => {
    if (!open || !exam?.id) return
    setLoading(true)
    Promise.all([
      getExamSubjects(exam.id),
      getUsers({ role: 'teacher', status: 'active', page: 1, perPage: 200 }),
    ])
      .then(([subjectResponse, teacherResponse]) => {
        const subjects = subjectResponse.data?.subjects || []
        setRows(subjects.map((row) => ({
          subject_id: row.subject_id,
          name: row.name,
          code: row.code,
          exam_date: row.exam_date || '',
          start_time: row.start_time ? String(row.start_time).slice(0, 5) : '',
          end_time: row.end_time ? String(row.end_time).slice(0, 5) : '',
          invigilator_teacher_id: row.invigilator_teacher_id ? String(row.invigilator_teacher_id) : '',
        })))
        setTeachers(teacherResponse.data?.users || [])
      })
      .catch((error) => {
        setRows([])
        toastError(error.message || 'Failed to load exam timetable')
      })
      .finally(() => setLoading(false))
  }, [open, exam?.id, toastError])

  const teacherOptions = useMemo(
    () => teachers.map((teacher) => ({
      value: String(teacher.source_id || teacher.id).replace(/^teacher-/, ''),
      label: teacher.name,
    })),
    [teachers]
  )

  const stats = useMemo(() => {
    const total = rows.length
    const scheduled = rows.filter(r => r.exam_date && r.start_time && r.end_time).length
    return { total, scheduled, incomplete: total - scheduled, percent: total > 0 ? (scheduled / total) * 100 : 0 }
  }, [rows])

  const updateRow = (subjectId, patch) => {
    setRows((prev) => prev.map((row) => (
      Number(row.subject_id) === Number(subjectId) ? { ...row, ...patch } : row
    )))
  }

  const handleAutoFillDates = () => {
    if (!exam?.start_date) return toastError('Exam start date is missing.')
    const emptyRows = rows.filter(r => !r.exam_date)
    if (!emptyRows.length) return
    const newDates = addWorkingDays(exam.start_date, emptyRows.length)
    let dateIdx = 0
    setRows(prev => prev.map(row => {
      if (!row.exam_date) return { ...row, exam_date: newDates[dateIdx++] }
      return row
    }))
    toastSuccess(`Assigned dates to ${newDates.length} subjects`)
  }

  const handleBulkFill = () => {
    let count = 0
    setRows(prev => prev.map(row => {
      const patch = {}
      if (!row.start_time && bulkStart) patch.start_time = bulkStart
      if (!row.end_time && bulkEnd)     patch.end_time = bulkEnd
      if (!row.invigilator_teacher_id && bulkTeacher) patch.invigilator_teacher_id = bulkTeacher
      if (Object.keys(patch).length > 0) {
        count++
        return { ...row, ...patch }
      }
      return row
    }))
    toastSuccess(`Updated ${count} empty rows`)
    setShowQuickFill(false)
  }

  const handleCopyRow = (idx) => {
    if (idx >= rows.length - 1) return
    const current = rows[idx]
    const next = rows[idx + 1]
    updateRow(next.subject_id, {
      start_time: current.start_time,
      end_time: current.end_time,
      invigilator_teacher_id: current.invigilator_teacher_id
    })
    setCopiedId(current.subject_id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDownload = async () => {
    if (!exam?.id) return
    setDownloading(true)
    try {
      await onDownloadTimetable(exam)
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    if (!exam?.id) return
    
    // Validation
    for (const row of rows) {
      if ((row.start_time && !row.end_time) || (!row.start_time && row.end_time)) {
        return toastError(`Please set both start and end time for ${row.name}`)
      }
      if (row.start_time && row.end_time) {
        const [sh, sm] = row.start_time.split(':').map(Number)
        const [eh, em] = row.end_time.split(':').map(Number)
        if ((eh * 60 + em) <= (sh * 60 + sm)) {
          return toastError(`${row.name}: end time must be after start time`)
        }
      }
    }

    setSaving(true)
    try {
      await updateExamTimetable(exam.id, {
        subjects: rows.map((row) => ({
          subject_id: Number(row.subject_id),
          exam_date: row.exam_date || null,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          invigilator_teacher_id: row.invigilator_teacher_id ? Number(row.invigilator_teacher_id) : null,
        })),
      })
      toastSuccess('Exam timetable saved')
      onClose()
    } catch (error) {
      toastError(error.message || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={exam ? `Exam Timetable - ${exam.name} (${exam.class_name}${exam.class_stream ? ` ${exam.class_stream.charAt(0).toUpperCase() + exam.class_stream.slice(1)}` : ''})` : 'Exam Timetable'}
      size="xl"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving || downloading}>Cancel</Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              icon={Download} 
              onClick={handleDownload} 
              loading={downloading}
              disabled={loading || rows.length === 0}
            >
              Download PDF
            </Button>
            <Button 
              icon={CalendarDays} 
              onClick={handleSave} 
              loading={saving} 
              disabled={loading || rows.length === 0 || downloading}
            >
              Save Timetable
            </Button>
          </div>
        </>
      )}
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--color-surface-raised)' }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl px-4 py-8 text-sm" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
          No subjects found for this exam.
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* ── Progress Header ── */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span style={{ color: stats.percent === 100 ? '#15803d' : 'var(--color-text-primary)' }}>
                {stats.percent === 100 ? '✓ All subjects scheduled' : `✓ ${stats.scheduled} of ${stats.total} subjects scheduled`}
              </span>
              {stats.incomplete > 0 && <span style={{ color: '#b45309' }}>⚠ {stats.incomplete} incomplete</span>}
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-surface-raised)' }}>
              <div 
                className="h-full transition-all duration-500" 
                style={{ 
                  width: `${stats.percent}%`, 
                  background: stats.percent === 100 ? '#22c55e' : '#f59e0b' 
                }} 
              />
            </div>
          </div>

          {/* ── Tools Toolbar ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickFill(!showQuickFill)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ 
                background: showQuickFill ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              {showQuickFill ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Quick Fill Tools
            </button>
            <button
              onClick={handleAutoFillDates}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#4338ca' }}
            >
              <Wand2 size={14} />
              Auto-fill Dates
            </button>
          </div>

          {/* ── Quick Fill Panel ── */}
          {showQuickFill && (
            <div className="p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-end gap-4 animate-in slide-in-from-top-2" style={{ borderColor: 'var(--color-border)', background: 'rgba(67, 56, 202, 0.03)' }}>
              <TimePicker12h label="Bulk Start" value={bulkStart} onChange={setBulkStart} />
              <TimePicker12h label="Bulk End"   value={bulkEnd}   onChange={setBulkEnd} />
              <Select 
                label="Bulk Invigilator" 
                value={bulkTeacher} 
                onChange={e => setBulkTeacher(e.target.value)} 
                options={teacherOptions} 
                placeholder="Select teacher"
                containerClassName="min-w-[180px]"
              />
              <Button 
                variant="primary" 
                size="sm" 
                className="h-10 px-6 rounded-xl"
                onClick={handleBulkFill}
                disabled={!bulkStart && !bulkEnd && !bulkTeacher}
              >
                Apply to Empty Rows
              </Button>
            </div>
          )}

          {/* ── Timetable Table ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10" style={{ background: 'var(--color-surface-raised)' }}>
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)', width: 40 }}>#</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>Subject</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>Date</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>Start</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>End</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>Dur.</th>
                    <th className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>Invigilator</th>
                    <th className="px-3 py-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted border-b" style={{ borderColor: 'var(--color-border)', width: 80 }}>Status</th>
                    <th className="px-3 py-3 border-b" style={{ borderColor: 'var(--color-border)', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody style={{ background: 'var(--color-surface)' }}>
                  {rows.map((row, idx) => {
                    const isSet = row.exam_date && row.start_time && row.end_time
                    const isPartial = !isSet && (row.exam_date || row.start_time || row.end_time)
                    const duration = calcDuration(row.start_time, row.end_time)

                    return (
                      <tr 
                        key={row.subject_id}
                        className="transition-colors group"
                        style={{ background: idx % 2 === 1 ? 'var(--color-surface-raised)' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(67, 56, 202, 0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? 'var(--color-surface-raised)' : 'transparent'}
                      >
                        <td className="px-3 py-2 text-xs font-mono text-muted">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-[13px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>{row.name}</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{row.code || '—'}</p>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            min={exam?.start_date}
                            max={exam?.end_date}
                            value={row.exam_date}
                            onChange={(e) => updateRow(row.subject_id, { exam_date: e.target.value })}
                            className="w-full min-w-[120px] rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <TimePicker12h value={row.start_time} onChange={(val) => updateRow(row.subject_id, { start_time: val })} />
                        </td>
                        <td className="px-3 py-2">
                          <TimePicker12h value={row.end_time} onChange={(val) => updateRow(row.subject_id, { end_time: val })} />
                        </td>
                        <td className="px-3 py-2 text-xs font-bold text-muted">{duration}</td>
                        <td className="px-3 py-2">
                          <Select
                            value={row.invigilator_teacher_id}
                            onChange={(e) => updateRow(row.subject_id, { invigilator_teacher_id: e.target.value })}
                            options={teacherOptions}
                            placeholder="Assign"
                            containerClassName="min-w-[140px]"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {isSet ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-700">Set</span>
                          ) : isPartial ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-700">Partial</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-500">Empty</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            {idx < rows.length - 1 && (
                              <button
                                onClick={() => handleCopyRow(idx)}
                                title="Copy time & invigilator to next row"
                                className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-brand/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Copy size={12} />
                              </button>
                            )}
                            {copiedId === row.subject_id && (
                              <span className="absolute right-12 text-[10px] font-bold text-green-600 animate-out fade-out duration-1000">Copied!</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-muted leading-relaxed font-medium">
            * Sundays are automatically skipped when using Auto-fill Dates. Duration is calculated based on start and end times.
            Partial timetables can be saved, but both times must be set for a subject if one is provided.
          </p>
        </div>
      )}
    </Modal>
  )
}

export default ExamsListPage
