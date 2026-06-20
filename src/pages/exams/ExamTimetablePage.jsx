// src/pages/exams/ExamTimetablePage.jsx
import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, CalendarDays, Wand2, ChevronUp, ChevronDown, Copy, 
  Loader2, AlertCircle, CalendarRange
} from 'lucide-react'
import useToast from '@/hooks/useToast'
import { getExamSubjects, updateExamTimetable, downloadExamTimetablePdf } from '@/api/examsApi'
import { getUsers } from '@/api/userManagementApi'
import { formatDate } from '@/utils/helpers'
import { downloadBlob } from '@/utils/downloadBlob'
import { ROUTES } from '@/constants/app'
import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'

const parseTimeInput = (inputStr) => {
  if (!inputStr) return null
  const str = inputStr.trim().toLowerCase()
  
  // 1. Match hh:mm or h:mm or hh.mm with optional am/pm/a/p suffix
  const timeMatch = str.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm|a|p)?$/)
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    const ampm = timeMatch[3]
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    
    if (ampm) {
      if (ampm.startsWith('p') && hours < 12) {
        hours += 12
      } else if (ampm.startsWith('a') && hours === 12) {
        hours = 0
      }
    } else {
      if (hours >= 1 && hours < 8) {
        hours += 12
      }
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // 2. Match hh or h with explicit am/pm/a/p suffix (e.g. 10am, 2pm)
  const hourSuffixMatch = str.match(/^(\d{1,2})\s*(am|pm|a|p)$/)
  if (hourSuffixMatch) {
    let hours = parseInt(hourSuffixMatch[1], 10)
    const ampm = hourSuffixMatch[2]
    
    if (hours < 1 || hours > 12) return null
    
    if (ampm.startsWith('p') && hours < 12) {
      hours += 12
    } else if (ampm.startsWith('a') && hours === 12) {
      hours = 0
    }
    return `${String(hours).padStart(2, '0')}:00`
  }
  
  // 3. Match 3 or 4 digits (e.g. 1030, 930) with optional am/pm/a/p suffix
  const digitsMatch = str.match(/^(\d{3,4})\s*(am|pm|a|p)?$/)
  if (digitsMatch) {
    const val = digitsMatch[1]
    const ampm = digitsMatch[2]
    let hours, minutes
    if (val.length === 3) {
      hours = parseInt(val.slice(0, 1), 10)
      minutes = parseInt(val.slice(1), 10)
    } else {
      hours = parseInt(val.slice(0, 2), 10)
      minutes = parseInt(val.slice(2), 10)
    }
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    
    if (ampm) {
      if (ampm.startsWith('p') && hours < 12) {
        hours += 12
      } else if (ampm.startsWith('a') && hours === 12) {
        hours = 0
      }
    } else {
      if (hours >= 1 && hours < 8) {
        hours += 12
      }
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // 4. Match single or double digit hour (e.g. 10, 9, 14) without suffix
  const hourMatch = str.match(/^(\d{1,2})$/)
  if (hourMatch) {
    let hours = parseInt(hourMatch[1], 10)
    if (hours < 0 || hours > 23) return null
    
    if (hours >= 1 && hours < 8) {
      hours += 12
    }
    return `${String(hours).padStart(2, '0')}:00`
  }
  
  return null
}

const formatTime24to12 = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  if (isNaN(hours) || isNaN(minutes)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  const minStr = String(minutes).padStart(2, '0')
  const hrStr = String(hours).padStart(2, '0')
  return `${hrStr}:${minStr} ${ampm}`
}

const ExamTimetablePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const { user } = useAuthStore()
  const isTeacher = user?.role === 'teacher'

  const [exam, setExam] = useState(null)
  const [rows, setRows] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showQuickFill, setShowQuickFill] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Quick fill state
  const [bulkStartInput, setBulkStartInput] = useState('')
  const [bulkEndInput, setBulkEndInput] = useState('')
  const [bulkTeacher, setBulkTeacher] = useState('')

  const initialRowsRef = useRef([])

  const isDirty = useMemo(() => {
    if (isTeacher) return false
    if (initialRowsRef.current.length === 0) return false
    return JSON.stringify(rows) !== JSON.stringify(initialRowsRef.current)
  }, [rows, isTeacher])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleBackClick = () => {
    if (isDirty) {
      setShowBackConfirm(true)
    } else {
      navigate(ROUTES.EXAMS)
    }
  }

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
    if (!id) return
    setLoading(true)
    Promise.all([
      getExamSubjects(id),
      getUsers({ role: 'teacher', status: 'active', page: 1, perPage: 200 }),
    ])
      .then(([subjectResponse, teacherResponse]) => {
        const examData = subjectResponse.data?.exam || null
        setExam(examData)
        
        const subjects = subjectResponse.data?.subjects || []
        const mapped = subjects.map((row) => {
          const startTime = row.start_time ? String(row.start_time).slice(0, 5) : ''
          const endTime = row.end_time ? String(row.end_time).slice(0, 5) : ''
          return {
            subject_id: row.subject_id,
            name: row.name,
            code: row.code,
            exam_date: row.exam_date || '',
            start_time: startTime,
            start_time_input: startTime ? formatTime24to12(startTime) : '',
            end_time: endTime,
            end_time_input: endTime ? formatTime24to12(endTime) : '',
            invigilator_teacher_id: row.invigilator_teacher_id ? String(row.invigilator_teacher_id) : '',
          }
        })
        setRows(mapped)
        initialRowsRef.current = JSON.parse(JSON.stringify(mapped))
        setTeachers(teacherResponse.data?.users || [])
      })
      .catch((error) => {
        setRows([])
        setErrorMsg(error.message || 'Failed to load exam timetable')
      })
      .finally(() => setLoading(false))
  }, [id, toastError])

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
    const parsedStart = bulkStartInput ? parseTimeInput(bulkStartInput) : ''
    const parsedEnd = bulkEndInput ? parseTimeInput(bulkEndInput) : ''
    
    if (bulkStartInput && !parsedStart) {
      return toastError('Bulk start time is invalid')
    }
    if (bulkEndInput && !parsedEnd) {
      return toastError('Bulk end time is invalid')
    }
    if (parsedStart && parsedEnd) {
      const [sh, sm] = parsedStart.split(':').map(Number)
      const [eh, em] = parsedEnd.split(':').map(Number)
      if ((eh * 60 + em) <= (sh * 60 + sm)) {
        return toastError('Bulk end time must be after start time')
      }
    }

    let count = 0
    setRows(prev => prev.map(row => {
      const patch = {}
      if (!row.start_time && parsedStart) {
        patch.start_time = parsedStart
        patch.start_time_input = formatTime24to12(parsedStart)
      }
      if (!row.end_time && parsedEnd) {
        patch.end_time = parsedEnd
        patch.end_time_input = formatTime24to12(parsedEnd)
      }
      if (!row.invigilator_teacher_id && bulkTeacher) {
        patch.invigilator_teacher_id = bulkTeacher
      }
      if (Object.keys(patch).length > 0) {
        count++
        return { ...row, ...patch }
      }
      return row
    }))
    toastSuccess(`Updated ${count} empty rows`)
    setBulkStartInput('')
    setBulkEndInput('')
    setBulkTeacher('')
    setShowQuickFill(false)
  }

  const handleCopyRow = (idx) => {
    if (idx >= rows.length - 1) return
    const current = rows[idx]
    const next = rows[idx + 1]
    updateRow(next.subject_id, {
      start_time: current.start_time,
      start_time_input: current.start_time_input,
      end_time: current.end_time,
      end_time_input: current.end_time_input,
      invigilator_teacher_id: current.invigilator_teacher_id
    })
    setCopiedId(current.subject_id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDownload = async () => {
    if (!id || !exam) return
    setDownloading(true)
    try {
      const res = await downloadExamTimetablePdf(id)
      downloadBlob(res, `${(exam?.name || 'Exam').replace(/\s+/g, '_')}_Timetable.pdf`)
    } catch (error) {
      console.error('[Download PDF Error]', error)
      toastError(error.message || 'Failed to download exam timetable')
    } finally {
      setDownloading(false)
    }
  }

  const handleSave = async () => {
    if (!id) return
    
    // Validation
    for (const row of rows) {
      if (row.exam_date && exam) {
        const ed = row.exam_date.split('T')[0]
        const sd = exam.start_date.split('T')[0]
        const nd = exam.end_date.split('T')[0]
        if (ed < sd || ed > nd) {
          return toastError(`${row.name}: date must be between ${formatDate(exam.start_date)} and ${formatDate(exam.end_date)}`)
        }
      }
      if (row.start_time_input && !row.start_time) {
        return toastError(`${row.name}: start time is invalid (e.g. use "10:30 AM" or "10:30")`)
      }
      if (row.end_time_input && !row.end_time) {
        return toastError(`${row.name}: end time is invalid (e.g. use "12:30 PM" or "12:30")`)
      }
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
      await updateExamTimetable(id, {
        subjects: rows.map((row) => ({
          subject_id: Number(row.subject_id),
          exam_date: row.exam_date || null,
          start_time: row.start_time || null,
          end_time: row.end_time || null,
          invigilator_teacher_id: row.invigilator_teacher_id ? Number(row.invigilator_teacher_id) : null,
        })),
      })
      toastSuccess('Exam timetable saved')
      navigate(ROUTES.EXAMS)
    } catch (error) {
      toastError(error.message || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm text-gray-500 font-medium">Loading exam timetable details...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-850 rounded-[28px] border border-red-100 dark:border-red-950 p-8 text-center shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-gray-950 dark:text-white mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
          <Button variant="secondary" onClick={() => navigate(ROUTES.EXAMS)}>Go to Exams</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all dark:bg-slate-800 dark:border-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarRange className="text-brand" size={20} />
              Exam Timetable - {exam?.name}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Class: {exam?.class_name}{exam?.class_stream ? ` ${exam?.class_stream.charAt(0).toUpperCase() + exam?.class_stream.slice(1)}` : ''} 
              {exam?.start_date && ` | Duration: ${formatDate(exam.start_date, 'medium')} to ${formatDate(exam.end_date, 'medium')}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            icon={Download} 
            onClick={handleDownload} 
            loading={downloading}
            disabled={rows.length === 0}
          >
            Download PDF
          </Button>
          {!isTeacher && (
            <Button 
              icon={CalendarDays} 
              onClick={handleSave} 
              loading={saving} 
              disabled={rows.length === 0 || downloading}
            >
              Save Timetable
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-850 rounded-[28px] border border-gray-100 dark:border-slate-800 p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No subjects found for this exam.</p>
            <p className="text-xs text-gray-400">Configure subjects in the exam details screen before setting up the timetable.</p>
            <Button variant="secondary" onClick={() => navigate(ROUTES.EXAMS)}>Go Back</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ── Progress Header ── */}
          <div className="bg-white dark:bg-slate-850 rounded-[28px] border border-gray-100 dark:border-slate-800 p-5 space-y-3 shadow-sm">
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
          {!isTeacher && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickFill(!showQuickFill)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#4338ca' }}
              >
                <Wand2 size={14} />
                Auto-fill Dates
              </button>
            </div>
          )}

          {/* ── Quick Fill Panel ── */}
          {showQuickFill && !isTeacher && (
            <div className="p-5 rounded-3xl border-2 border-dashed flex flex-wrap items-end gap-4 animate-in slide-in-from-top-2" style={{ borderColor: 'var(--color-border)', background: 'rgba(67, 56, 202, 0.03)' }}>
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Bulk Start</label>
                <input
                  type="text"
                  value={bulkStartInput}
                  onChange={(e) => setBulkStartInput(e.target.value)}
                  onBlur={() => {
                    const parsed = parseTimeInput(bulkStartInput)
                    if (parsed) setBulkStartInput(formatTime24to12(parsed))
                  }}
                  placeholder="e.g. 09:30 AM"
                  className="text-xs px-3 border outline-none"
                  style={{ 
                    height: '36px', 
                    borderRadius: '12px',
                    borderColor: 'var(--color-border)', 
                    backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text-primary)',
                    width: '120px'
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Bulk End</label>
                <input
                  type="text"
                  value={bulkEndInput}
                  onChange={(e) => setBulkEndInput(e.target.value)}
                  onBlur={() => {
                    const parsed = parseTimeInput(bulkEndInput)
                    if (parsed) setBulkEndInput(formatTime24to12(parsed))
                  }}
                  placeholder="e.g. 12:30 PM"
                  className="text-xs px-3 border outline-none"
                  style={{ 
                    height: '36px', 
                    borderRadius: '12px',
                    borderColor: 'var(--color-border)', 
                    backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text-primary)',
                    width: '120px'
                  }}
                />
              </div>
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
                disabled={!bulkStartInput && !bulkEndInput && !bulkTeacher}
              >
                Apply to Empty Rows
              </Button>
            </div>
          )}

          {/* ── Timetable Table ── */}
          <div className="bg-white dark:bg-slate-850 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead style={{ background: 'var(--color-surface-raised)' }}>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 60 }}>#</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted">Subject</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 180 }}>Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 140 }}>Start</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 140 }}>End</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 100 }}>Dur.</th>
                    <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 200 }}>Invigilator</th>
                    <th className="px-6 py-4 text-center text-[10px] font-extrabold uppercase tracking-widest text-muted" style={{ width: 100 }}>Status</th>
                    <th className="px-6 py-4" style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody style={{ background: 'var(--color-surface)' }}>
                  {rows.map((row, idx) => {
                    const isSet = row.exam_date && row.start_time && row.end_time
                    const isPartial = !isSet && (row.exam_date || row.start_time || row.end_time)
                    const duration = calcDuration(row.start_time, row.end_time)

                    const isStartError = (() => {
                      if (row.start_time_input && !row.start_time) return true
                      if (!row.start_time && row.end_time) return true
                      if (row.start_time && row.end_time) {
                        const [sh, sm] = row.start_time.split(':').map(Number)
                        const [eh, em] = row.end_time.split(':').map(Number)
                        return (eh * 60 + em) <= (sh * 60 + sm)
                      }
                      return false
                    })()

                    const isEndError = (() => {
                      if (row.end_time_input && !row.end_time) return true
                      if (row.start_time && !row.end_time) return true
                      if (row.start_time && row.end_time) {
                        const [sh, sm] = row.start_time.split(':').map(Number)
                        const [eh, em] = row.end_time.split(':').map(Number)
                        return (eh * 60 + em) <= (sh * 60 + sm)
                      }
                      return false
                    })()

                    return (
                      <tr 
                        key={row.subject_id}
                        className="transition-colors group border-b"
                        style={{ background: idx % 2 === 1 ? 'var(--color-surface-raised)' : 'transparent', borderColor: 'var(--color-border)' }}
                        onMouseEnter={e => { if (!isTeacher) e.currentTarget.style.background = 'rgba(67, 56, 202, 0.05)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 1 ? 'var(--color-surface-raised)' : 'transparent' }}
                      >
                        <td className="px-6 py-4 text-xs font-mono text-muted">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-[13px] leading-tight" style={{ color: 'var(--color-text-primary)' }}>{row.name}</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{row.code || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <DatePicker
                            value={row.exam_date ? dayjs(row.exam_date) : null}
                            onChange={(date) => {
                              updateRow(row.subject_id, { exam_date: date ? date.format('YYYY-MM-DD') : '' })
                            }}
                            disabled={isTeacher}
                            disabledDate={(current) => {
                              if (!current) return false;
                              if (exam?.start_date) {
                                const minDay = dayjs(exam.start_date).startOf('day');
                                if (current.isBefore(minDay)) return true;
                              }
                              if (exam?.end_date) {
                                const maxDay = dayjs(exam.end_date).endOf('day');
                                if (current.isAfter(maxDay)) return true;
                              }
                              return false;
                            }}
                            format="DD-MM-YYYY"
                            placeholder="Select date"
                            className="w-full text-xs"
                            style={{ 
                              height: '36px', 
                              borderRadius: '12px',
                              borderColor: 'var(--color-border)', 
                              backgroundColor: isTeacher ? 'var(--color-surface-raised)' : 'var(--color-surface)', 
                              color: 'var(--color-text-primary)',
                              width: '100%',
                              minWidth: '150px',
                              cursor: isTeacher ? 'not-allowed' : 'pointer'
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={row.start_time_input !== undefined ? row.start_time_input : (row.start_time ? formatTime24to12(row.start_time) : '')}
                            onChange={(e) => {
                              const val = e.target.value
                              updateRow(row.subject_id, { 
                                start_time_input: val,
                                start_time: parseTimeInput(val) || ''
                              })
                            }}
                            onBlur={() => {
                              const parsed = parseTimeInput(row.start_time_input || '')
                              if (parsed) {
                                updateRow(row.subject_id, {
                                  start_time_input: formatTime24to12(parsed),
                                  start_time: parsed
                                })
                              } else if (!(row.start_time_input || '').trim()) {
                                updateRow(row.subject_id, {
                                  start_time_input: '',
                                  start_time: ''
                                })
                              }
                            }}
                            disabled={isTeacher}
                            placeholder="e.g. 09:30 AM"
                            className="w-full text-xs px-3 border outline-none"
                            style={{ 
                              height: '36px', 
                              borderRadius: '12px',
                              borderColor: isStartError ? '#dc2626' : 'var(--color-border)', 
                              backgroundColor: isTeacher ? 'var(--color-surface-raised)' : 'var(--color-surface)', 
                              color: 'var(--color-text-primary)',
                              width: '100%',
                              minWidth: '120px',
                              boxShadow: isStartError ? '0 0 0 1px #dc2626' : 'none',
                              cursor: isTeacher ? 'not-allowed' : 'text'
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={row.end_time_input !== undefined ? row.end_time_input : (row.end_time ? formatTime24to12(row.end_time) : '')}
                            onChange={(e) => {
                              const val = e.target.value
                              updateRow(row.subject_id, { 
                                end_time_input: val,
                                end_time: parseTimeInput(val) || ''
                              })
                            }}
                            onBlur={() => {
                              const parsed = parseTimeInput(row.end_time_input || '')
                              if (parsed) {
                                updateRow(row.subject_id, {
                                  end_time_input: formatTime24to12(parsed),
                                  end_time: parsed
                                })
                              } else if (!(row.end_time_input || '').trim()) {
                                updateRow(row.subject_id, {
                                  end_time_input: '',
                                  end_time: ''
                                })
                              }
                            }}
                            disabled={isTeacher}
                            placeholder="e.g. 12:30 PM"
                            className="w-full text-xs px-3 border outline-none"
                            style={{ 
                              height: '36px', 
                              borderRadius: '12px',
                              borderColor: isEndError ? '#dc2626' : 'var(--color-border)', 
                              backgroundColor: isTeacher ? 'var(--color-surface-raised)' : 'var(--color-surface)', 
                              color: 'var(--color-text-primary)',
                              width: '100%',
                              minWidth: '120px',
                              boxShadow: isEndError ? '0 0 0 1px #dc2626' : 'none',
                              cursor: isTeacher ? 'not-allowed' : 'text'
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-muted">{duration}</td>
                        <td className="px-6 py-4">
                          <Select
                            value={row.invigilator_teacher_id}
                            onChange={(e) => updateRow(row.subject_id, { invigilator_teacher_id: e.target.value })}
                            options={teacherOptions}
                            placeholder="Assign"
                            disabled={isTeacher}
                            className="w-full text-xs"
                            style={{
                              height: '36px',
                              borderRadius: '12px',
                              borderColor: 'var(--color-border)',
                              backgroundColor: isTeacher ? 'var(--color-surface-raised)' : 'var(--color-surface)',
                              color: 'var(--color-text-primary)',
                              minWidth: '160px',
                              paddingTop: '0px',
                              paddingBottom: '0px',
                              cursor: isTeacher ? 'not-allowed' : 'pointer'
                            }}
                            containerClassName="w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isSet ? (
                            <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">Set</span>
                          ) : isPartial ? (
                            <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">Partial</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-gray-400">Empty</span>
                          )}
                        </td>
                        <td className="px-6 py-4 relative">
                          <div className="flex items-center gap-1">
                            {idx < rows.length - 1 && !isTeacher && (
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

      {/* ── Unsaved Changes Back-Confirm Modal ── */}
      <Modal
        open={showBackConfirm}
        onClose={() => setShowBackConfirm(false)}
        title="Unsaved Changes"
        size="md"
        footer={(
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowBackConfirm(false)
                navigate(ROUTES.EXAMS)
              }}
            >
              Discard Changes
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBackConfirm(false)}
              >
                Keep Editing
              </Button>
              <Button 
                variant="primary" 
                onClick={async () => {
                  // Perform same validation as handleSave
                  for (const row of rows) {
                    if (row.exam_date && exam) {
                      const ed = row.exam_date.split('T')[0]
                      const sd = exam.start_date.split('T')[0]
                      const nd = exam.end_date.split('T')[0]
                      if (ed < sd || ed > nd) {
                        return toastError(`${row.name}: date must be between ${formatDate(exam.start_date)} and ${formatDate(exam.end_date)}`)
                      }
                    }
                    if (row.start_time_input && !row.start_time) {
                      return toastError(`${row.name}: start time is invalid (e.g. use "10:30 AM" or "10:30")`)
                    }
                    if (row.end_time_input && !row.end_time) {
                      return toastError(`${row.name}: end time is invalid (e.g. use "12:30 PM" or "12:30")`)
                    }
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
                  setShowBackConfirm(false)
                  await handleSave()
                }}
                loading={saving}
              >
                Save & Leave
              </Button>
            </div>
          </div>
        )}
      >
        <div className="flex gap-4 py-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">You have unsaved changes</p>
            <p className="text-xs text-gray-500">Do you want to save your changes before leaving this page?</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ExamTimetablePage
