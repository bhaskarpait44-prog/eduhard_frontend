import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  Copy,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScrollText,
  School2,
  Trash2,
  User,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { TeacherDetailPDF } from '@/pdf/TeacherDetailPDF'
import * as userApi from '@/api/userManagementApi'
import api from '@/api/axios'
import { getSettings } from '@/api/settingsApi'
import {
  createTeacherControlAssignment,
  getTeacherControlAssignments,
  getTeacherControlTimetable,
  updateTeacherControlAssignment,
} from '@/api/adminTeacherControlApi'
import { getClasses, getClassList, getSections, getSubjectList, getSubjects } from '@/api/classApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import TimetableGrid from '@/components/teacher/TimetableGrid'
import { formatDate, getInitials } from '@/utils/helpers'

/* ─── Tab config ─────────────────────────────────────────── */
const TABS = [
  { key: 'identity',     label: 'Identity',    icon: User },
  { key: 'professional', label: 'Professional', icon: GraduationCap },
  { key: 'assignments',  label: 'Assignments', icon: School2 },
  { key: 'timetable',   label: 'Timetable',    icon: CalendarDays },
  { key: 'audit',       label: 'Audit Log',    icon: ScrollText },
]

/* ─── Tiny style helpers (no Tailwind specificity fights) ─── */
const css = {
  /* cards / surfaces */
  card:    { background: 'var(--color-surface)',        border: '1px solid var(--color-border)', borderRadius: 16 },
  raised:  { background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 12 },

  /* text */
  primary:   { color: 'var(--color-text-primary)' },
  secondary: { color: 'var(--color-text-secondary)' },
  muted:     { color: 'var(--color-text-muted)' },

  /* semantic fills */
  infoBg:    { background: '#eef2ff', color: '#4338ca' },
  successBg: { background: '#ecfdf5', border: '1px solid #bbf7d0' },
  dangerBg:  { background: '#fef2f2', border: '1px solid #fecaca' },
  warnBg:    { background: '#fffbeb', border: '1px solid #fed7aa' },
}

/* ─── Field tile ─────────────────────────────────────────── */
const Field = ({ icon: Icon, label, value, full = false }) => (
  <div
    className={`rounded-xl p-4 ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`}
    style={css.raised}
  >
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5 mb-2"
      style={css.muted}
    >
      <Icon size={11} strokeWidth={2.2} />
      {label}
    </p>
    <p className="text-sm font-medium leading-snug" style={value ? css.primary : css.muted}>
      {value || 'Not provided'}
    </p>
  </div>
)

/* ─── Stat pill ──────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color = '#4338ca', bg = '#eef2ff' }) => (
  <div
    className="flex items-center gap-3 rounded-xl px-4 py-3"
    style={{ background: bg, border: `1px solid ${bg === '#eef2ff' ? '#c7d2fe' : 'transparent'}` }}
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: color + '18' }}>
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <p className="text-xs font-semibold" style={{ color: color + 'cc' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  </div>
)

/* ─── Credential row ─────────────────────────────────────── */
const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={css.raised}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={css.infoBg}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={css.muted}>{label}</p>
        <p className="text-sm font-medium font-mono truncate" style={css.primary}>{value || '--'}</p>
      </div>
    </div>
    <Button variant="secondary" size="sm" icon={Copy} onClick={() => onCopy(value)}>Copy</Button>
  </div>
)

/* ─── Audit tab ──────────────────────────────────────────── */
const TeacherAuditTab = ({ userId }) => {
  const { toastError } = useToast()
  const [logs, setLogs]         = useState([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    userApi.getUserAudit(userId, { page: 1, limit: 30 })
      .then(r => setLogs(r?.data?.logs || []))
      .catch(e => { setLogs([]); toastError(e.message || 'Failed to load audit logs') })
      .finally(() => setLoading(false))
  }, [userId, toastError])

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  if (!logs.length) return (
    <div className="py-14 text-center">
      <ScrollText size={28} className="mx-auto mb-3 opacity-25" />
      <p className="text-sm" style={css.muted}>No audit records found</p>
    </div>
  )

  return (
    <div className="space-y-2.5">
      {logs.map(log => (
        <div key={log.id} className="rounded-xl p-4" style={css.raised}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-sm font-semibold" style={css.primary}>{log.field_name}</p>
            <p className="text-xs tabular-nums" style={css.muted}>{formatDate(log.created_at, 'short')}</p>
          </div>
          <p className="text-xs font-mono" style={css.secondary}>
            <span className="opacity-60">Before:</span> {log.old_value || '—'}
            <span className="mx-2 opacity-40">→</span>
            <span className="opacity-60">After:</span> {log.new_value || '—'}
          </p>
          {log.reason && (
            <p className="mt-1.5 text-xs italic" style={css.muted}>"{log.reason}"</p>
          )}
        </div>
      ))}
    </div>
  )
}

const AssignmentRow = ({ item, type, isSaving, handleToggle }) => (
  <div className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between" style={css.raised}>
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold" style={css.primary}>
          {type === 'class_teacher' ? 'Class Teacher' : item.subject_name || 'Subject'}
        </p>
        <Badge variant={item.is_active ? 'green' : 'grey'} dot>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <p className="text-xs" style={css.secondary}>
        {[item.class_name, item.section_name].filter(Boolean).join(' - ')}
        {!item.is_class_teacher && item.subject_code ? ` · ${item.subject_code}` : ''}
      </p>
    </div>
    <Button
      type="button"
      variant={item.is_active ? 'secondary' : 'primary'}
      size="sm"
      onClick={() => handleToggle(item)}
      disabled={isSaving}
    >
      {item.is_active ? 'Deactivate' : 'Activate'}
    </Button>
  </div>
)

/* ─── Assignments tab ────────────────────────────────────── */
const TeacherAssignmentsTab = ({ teacherId }) => {
  const { toastError, toastSuccess } = useToast()
  const teacherRecordId = String(teacherId || '').replace(/^teacher-/, '')

  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [sectionsByClass, setSectionsByClass] = useState({})
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [isLoading, setLoading] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [form, setForm] = useState({
    class_id: '',
    section_id: '',
    subject_id: '',
    is_class_teacher: false,
  })

  const loadAssignments = async () => {
    const res = await getTeacherControlAssignments({ teacher_id: teacherRecordId })
    setAssignments(res?.data?.assignments || [])
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadAssignments(),
      getClasses().then(res => setClasses(getClassList(res))),
    ])
      .catch(e => toastError(e.message || 'Failed to load teacher assignments'))
      .finally(() => setLoading(false))
  }, [teacherRecordId, toastError])

  useEffect(() => {
    const classId = form.class_id
    if (!classId) return

    const loadClassMeta = async () => {
      try {
        if (!sectionsByClass[classId]) {
          const res = await getSections(classId)
          setSectionsByClass(prev => ({
            ...prev,
            [classId]: Array.isArray(res?.data) ? res.data : (res?.data?.sections || []),
          }))
        }
        if (!subjectsByClass[classId]) {
          const res = await getSubjects(classId)
          setSubjectsByClass(prev => ({ ...prev, [classId]: getSubjectList(res) }))
        }
      } catch (e) {
        toastError(e.message || 'Failed to load class details')
      }
    }

    loadClassMeta()
  }, [form.class_id, sectionsByClass, subjectsByClass, toastError])

  const teacherAssignments = useMemo(() => (
    assignments
      .sort((a, b) =>
        (a.class_name || '').localeCompare(b.class_name || '') ||
        (a.section_name || '').localeCompare(b.section_name || '') ||
        Number(b.is_class_teacher) - Number(a.is_class_teacher) ||
        (a.subject_name || '').localeCompare(b.subject_name || '')
      )
  ), [assignments])

  const classTeacherAssignments = teacherAssignments.filter(item => item.is_class_teacher)
  const subjectAssignments = teacherAssignments.filter(item => !item.is_class_teacher)

  const classOptions = classes.map(item => ({ value: String(item.id), label: item.name }))
  const sectionOptions = (sectionsByClass[form.class_id] || []).map(item => ({ value: String(item.id), label: item.name }))
  const subjectOptions = (subjectsByClass[form.class_id] || []).map(item => ({ value: String(item.id), label: item.name }))

  const resetForm = () => setForm({ class_id: '', section_id: '', subject_id: '', is_class_teacher: false })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.class_id || !form.section_id || (!form.is_class_teacher && !form.subject_id)) {
      toastError(form.is_class_teacher ? 'Please select class and section' : 'Please select class, section and subject')
      return
    }

    setSaving(true)
    try {
      await createTeacherControlAssignment({
        teacher_id: Number(teacherRecordId),
        class_id: Number(form.class_id),
        section_id: Number(form.section_id),
        subject_id: form.is_class_teacher ? null : Number(form.subject_id),
        is_class_teacher: form.is_class_teacher,
      })
      toastSuccess(form.is_class_teacher ? 'Class teacher assigned' : 'Subject assigned')
      resetForm()
      await loadAssignments()
    } catch (e) {
      toastError(e.message || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (assignment) => {
    setSaving(true)
    try {
      await updateTeacherControlAssignment(assignment.id, { is_active: !assignment.is_active })
      toastSuccess('Assignment updated')
      await loadAssignments()
    } catch (e) {
      toastError(e.message || 'Failed to update assignment')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <form className="rounded-xl p-4" style={css.raised} onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={css.primary}>Add Assignment</p>
            <p className="text-xs mt-0.5" style={css.muted}>Assign subject or class teacher responsibility.</p>
          </div>
          <Button
            type="button"
            variant={form.is_class_teacher ? 'primary' : 'secondary'}
            size="sm"
            icon={School2}
            onClick={() => setForm(prev => ({ ...prev, is_class_teacher: !prev.is_class_teacher, subject_id: '' }))}
          >
            {form.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Class"
            value={form.class_id}
            onChange={e => setForm(prev => ({ ...prev, class_id: e.target.value, section_id: '', subject_id: '' }))}
            options={classOptions}
            required
          />
          <Select
            label="Section"
            value={form.section_id}
            onChange={e => setForm(prev => ({ ...prev, section_id: e.target.value }))}
            options={sectionOptions}
            disabled={!form.class_id}
            required
          />
          <Select
            label="Subject"
            value={form.subject_id}
            onChange={e => setForm(prev => ({ ...prev, subject_id: e.target.value }))}
            options={subjectOptions}
            disabled={!form.class_id || form.is_class_teacher}
            placeholder={form.is_class_teacher ? 'Not needed' : 'Select subject'}
            required={!form.is_class_teacher}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full" loading={isSaving}>
              Assign
            </Button>
          </div>
        </div>
      </form>

      <div>
        <SectionHeading>Class Teacher</SectionHeading>
        {classTeacherAssignments.length ? (
          <div className="space-y-2">
            {classTeacherAssignments.map(item => (
              <AssignmentRow key={item.id} item={item} type="class_teacher" isSaving={isSaving} handleToggle={handleToggle} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl py-8 text-center" style={css.raised}>
            <p className="text-sm" style={css.muted}>No class teacher assignment yet</p>
          </div>
        )}
      </div>

      <div>
        <SectionHeading>Subjects</SectionHeading>
        {subjectAssignments.length ? (
          <div className="space-y-2">
            {subjectAssignments.map(item => (
              <AssignmentRow key={item.id} item={item} type="subject" isSaving={isSaving} handleToggle={handleToggle} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl py-8 text-center" style={css.raised}>
            <p className="text-sm" style={css.muted}>No subject assignment yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Timetable tab ──────────────────────────────────────── */
const TeacherTimetableTab = ({ teacherId }) => {
  const { toastError } = useToast()
  const [slots, setSlots]       = useState([])
  const [isLoading, setLoading] = useState(false)
  const teacherRecordId = String(teacherId || '').replace(/^teacher-/, '')

  useEffect(() => {
    setLoading(true)
    getTeacherControlTimetable({ teacher_id: teacherRecordId })
      .then(r => {
        const rows = r?.data?.timetable || []
        setSlots(rows.filter(s => s.is_active !== false))
      })
      .catch(e => { setSlots([]); toastError(e.message || 'Failed to load timetable') })
      .finally(() => setLoading(false))
  }, [teacherRecordId, toastError])

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
      ))}
    </div>
  )

  if (!slots.length) return (
    <div className="rounded-xl py-12 text-center" style={css.raised}>
      <CalendarDays size={28} className="mx-auto mb-3 opacity-25" />
      <p className="text-sm font-medium" style={css.primary}>No timetable assigned yet</p>
      <p className="text-xs mt-1" style={css.muted}>Admin has not assigned a final weekly schedule for this teacher.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm" style={css.secondary}>Final weekly timetable assigned by admin.</p>
      <TimetableGrid slots={slots} />
    </div>
  )
}

/* ─── Section heading ────────────────────────────────────── */
const SectionHeading = ({ children }) => (
  <h3
    className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3 mt-1"
    style={css.muted}
  >
    {children}
  </h3>
)

/* ─── Edit modal body ────────────────────────────────────── */
const EditModalBody = ({ form, setForm }) => {
  const field = (key, label, type = 'text', extra = {}) => (
    <Input
      label={label}
      type={type}
      value={form[key]}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      {...extra}
    />
  )

  return (
    <div className="space-y-5">
      <div>
        <SectionHeading>Basic info</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('name',       'Full name')}
          {field('email',      'Email address', 'email')}
          {field('phone',      'Phone number')}
          {field('employee_id','Employee ID')}
          {field('department', 'Department')}
          {field('designation','Designation')}
          {field('joining_date','Joining date', 'date')}
          <div className="sm:col-span-2">{field('address', 'Address')}</div>
        </div>
      </div>

      <div>
        <SectionHeading>Academic background</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('highest_qualification', 'Highest qualification')}
          {field('specialization',        'Specialization')}
          {field('university_name',       'University / college')}
          {field('graduation_year',       'Graduation year', 'number')}
          {field('years_of_experience',   'Years of experience', 'number', { step: '0.5' })}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Main page
═══════════════════════════════════════════════════════════ */
const TeacherDetailPage = () => {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { toastError, toastSuccess } = useToast()

  const [teacher,   setTeacher]   = useState(null)
  const [isLoading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('identity')

  /* modals */
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  /* action states */
  const [isSavingEdit,       setSavingEdit]       = useState(false)
  const [isDeleting,         setDeleting]         = useState(false)
  const [isResettingPassword,setResettingPassword]= useState(false)
  const [exportingPDF,       setExportingPDF]     = useState(false)

  /* form values */
  const [confirmName, setConfirmName] = useState('')
  const [tempPassword,setTempPassword]= useState('')
  const [resetResult, setResetResult] = useState(null)

  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', employee_id: '', department: '', designation: '',
    joining_date: '', address: '', highest_qualification: '', specialization: '',
    university_name: '', graduation_year: '', years_of_experience: '', internal_notes: '',
  })

  usePageTitle(teacher ? teacher.name : 'Teacher Detail')

  /* ── data loading ── */
  const loadTeacher = async () => {
    try {
      const res = await userApi.getUser(id)
      if (res?.data?.role !== 'teacher') {
        toastError('Selected user is not a teacher')
        navigate(ROUTES.TEACHERS)
        return
      }
      setTeacher(res.data)
    } catch (e) {
      toastError(e.message || 'Failed to load teacher details')
      navigate(ROUTES.TEACHERS)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadTeacher().finally(() => setLoading(false))
  }, [id])

  /* ── sync edit form ── */
  const syncEditForm = () => {
    if (!teacher) return
    setEditForm({
      name:                  teacher.name                  || '',
      email:                 teacher.email                 || '',
      phone:                 teacher.phone                 || '',
      employee_id:           teacher.employee_id           || '',
      department:            teacher.department            || '',
      designation:           teacher.designation           || '',
      joining_date:          teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : '',
      address:               teacher.address               || '',
      highest_qualification: teacher.highest_qualification || '',
      specialization:        teacher.specialization        || '',
      university_name:       teacher.university_name       || '',
      graduation_year:       teacher.graduation_year       ? String(teacher.graduation_year) : '',
      years_of_experience:   teacher.years_of_experience   ? String(teacher.years_of_experience) : '',
      internal_notes:        teacher.internal_notes        || '',
    })
  }

  /* ── actions ── */
  const handleDownloadDetail = async () => {
    setExportingPDF(true)
    const teacherRecordId = String(id || '').replace(/^teacher-/, '')
    try {
      const [settingsRes, assignRes, timetableRes, leaveRes] = await Promise.all([
        getSettings(),
        getTeacherControlAssignments({ teacher_id: teacherRecordId }),
        getTeacherControlTimetable({ teacher_id: teacherRecordId }),
        api.get(`/admin/teacher-control/leave?teacher_id=${teacherRecordId}`),
      ])

      const schoolData = {
        name: settingsRes.data?.school_name,
        email: settingsRes.data?.school_email,
        phone: settingsRes.data?.school_phone,
        address: settingsRes.data?.school_address,
        logo_url: settingsRes.data?.logo_url,
      }

      const blob = await pdf(
        <TeacherDetailPDF
          teacher={teacher}
          school={schoolData}
          assignments={assignRes?.data?.assignments || []}
          timetable={timetableRes?.data?.timetable || []}
          leaves={leaveRes?.data?.applications || []}
          />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Teacher_${teacher.name.replace(/\s+/g, '_')}_Report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toastError('Failed to download PDF.')
    } finally {
      setExportingPDF(false)
    }
  }

  const handleSaveEdit = async () => {
    const phoneRegex = /^[6-9]\d{9}$/
    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      return toastError('Enter a valid 10-digit mobile number')
    }

    setSavingEdit(true)
    try {
      await userApi.updateUser(id, {
        ...editForm,
        graduation_year:     editForm.graduation_year     ? Number(editForm.graduation_year)     : null,
        years_of_experience: editForm.years_of_experience ? Number(editForm.years_of_experience) : null,
        reason: 'Updated from teacher detail page',
      })
      toastSuccess('Teacher updated successfully')
      setEditOpen(false)
      await loadTeacher()
    } catch (e) {
      toastError(e.message || 'Failed to update teacher')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await userApi.deleteUser(id)
      toastSuccess('Teacher deleted successfully')
      navigate(ROUTES.TEACHERS)
    } catch (e) {
      toastError(e.message || 'Failed to delete teacher')
    } finally {
      setDeleting(false)
    }
  }

  const handleResetPassword = async () => {
    setResettingPassword(true)
    try {
      const res = await userApi.resetUserPassword(id, {
        new_password: tempPassword.trim() || undefined,
        force_change: true,
      })
      setResetResult(res?.data || null)
      setTempPassword('')
      toastSuccess('Password reset successfully')
    } catch (e) {
      toastError(e.message || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toastSuccess('Copied to clipboard')
    } catch {
      toastError('Unable to copy')
    }
  }

  /* ── loading skeleton ── */
  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-9 w-40 rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
      <div className="h-32 rounded-2xl"    style={{ background: 'var(--color-surface-raised)' }} />
      <div className="h-64 rounded-2xl"    style={{ background: 'var(--color-surface-raised)' }} />
    </div>
  )

  if (!teacher) return null

  const canDelete = confirmName.trim() === teacher.name

  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">

      {/* ── back ── */}
      <button
        onClick={() => navigate(ROUTES.TEACHERS)}
        className="inline-flex items-center gap-2 text-sm rounded-xl px-3 py-2 transition-colors"
        style={{ ...css.secondary, background: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ArrowLeft size={16} />
        Back to Teachers
      </button>

      {/* ── hero card ── */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-5" style={css.card}>

        {/* avatar */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shrink-0"
          style={{ background: 'var(--color-brand)' }}
        >
          {getInitials(teacher.name)}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold" style={css.primary}>{teacher.name}</h1>
            <Badge variant={teacher.is_active ? 'green' : 'grey'} dot>
              {teacher.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="blue">Teacher</Badge>
          </div>
          <p className="text-sm mb-0.5" style={css.secondary}>{teacher.email}</p>
          <p className="text-xs" style={css.muted}>
            {teacher.employee_id || 'No Employee ID'}
            {teacher.department ? ` · ${teacher.department}` : ''}
            {teacher.designation ? ` · ${teacher.designation}` : ''}
          </p>

          {/* quick stats row */}
          {(teacher.years_of_experience || teacher.joining_date) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.years_of_experience && (
                <StatPill
                  icon={BookOpen}
                  label="Experience"
                  value={`${teacher.years_of_experience} yrs`}
                  color="#4338ca" bg="#eef2ff"
                />
              )}
              {teacher.joining_date && (
                <StatPill
                  icon={Clock}
                  label="Joined"
                  value={String(teacher.joining_date).slice(0, 10)}
                  color="#0369a1" bg="#e0f2fe"
                />
              )}
              {teacher.is_active && (
                <StatPill
                  icon={CheckCircle2}
                  label="Status"
                  value="Active"
                  color="#15803d" bg="#dcfce7"
                />
              )}
            </div>
          )}
        </div>

        {/* action buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="secondary" size="sm" icon={FileText}
            onClick={handleDownloadDetail}
            loading={exportingPDF}
          >
            Download PDF
          </Button>
          <Button
            variant="secondary" size="sm" icon={Pencil}
            onClick={() => { syncEditForm(); setEditOpen(true) }}
          >
            Edit
          </Button>
          <Button
            variant="secondary" size="sm" icon={KeyRound}
            onClick={() => { setTempPassword(''); setResetResult(null); setPasswordOpen(true) }}
          >
            Reset Password
          </Button>
          <Button
            variant="danger" size="sm" icon={Trash2}
            onClick={() => { setConfirmName(''); setDeleteOpen(true) }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* ── tab card ── */}
      <div className="rounded-2xl overflow-hidden" style={css.card}>

        {/* tab bar */}
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderBottomColor: active ? 'var(--color-brand)' : 'transparent',
                  color:             active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                }}
              >
                <tab.icon size={14} strokeWidth={2} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* tab body */}
        <div className="p-6">

          {/* identity */}
          {activeTab === 'identity' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field icon={Mail}     label="Email"        value={teacher.email} />
              <Field icon={Phone}    label="Phone"        value={teacher.phone} />
              <Field icon={Briefcase}label="Employee ID"  value={teacher.employee_id} />
              <Field icon={Briefcase}label="Department"   value={teacher.department} />
              <Field icon={Briefcase}label="Designation"  value={teacher.designation} />
              <Field icon={Calendar} label="Joining Date" value={teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : ''} />
              <Field icon={MapPin}   label="Address"      value={teacher.address} full />
            </div>
          )}

          {/* professional */}
          {activeTab === 'professional' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field icon={GraduationCap} label="Highest Qualification" value={teacher.highest_qualification} />
              <Field icon={GraduationCap} label="Specialization"        value={teacher.specialization} />
              <Field icon={GraduationCap} label="University / College"  value={teacher.university_name} />
              <Field icon={GraduationCap} label="Graduation Year"       value={teacher.graduation_year} />
              <Field icon={GraduationCap} label="Experience (Years)"    value={teacher.years_of_experience} />
            </div>
          )}

          {activeTab === 'assignments' && <TeacherAssignmentsTab teacherId={id} />}
          {activeTab === 'timetable'   && <TeacherTimetableTab   teacherId={id} />}
          {activeTab === 'audit'       && <TeacherAuditTab       userId={id}    />}
        </div>
      </div>

      {/* ══════════════ EDIT MODAL ══════════════ */}
      <Modal
        open={editOpen}
        onClose={() => !isSavingEdit && setEditOpen(false)}
        title="Edit Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={isSavingEdit}>Cancel</Button>
            <Button icon={Pencil} onClick={handleSaveEdit} loading={isSavingEdit}>Save Changes</Button>
          </>
        }
      >
        <EditModalBody form={editForm} setForm={setEditForm} />
      </Modal>

      {/* ══════════════ DELETE MODAL ══════════════ */}
      <Modal
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        title="Delete Teacher"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={isDeleting} disabled={!canDelete}>
              Delete Teacher
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* warning banner */}
          <div className="flex gap-3 rounded-xl p-3.5" style={css.dangerBg}>
            <AlertTriangle size={17} className="shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <div className="text-sm leading-relaxed" style={{ color: '#991b1b' }}>
              <p className="font-semibold mb-0.5">This action cannot be undone.</p>
              <p style={{ opacity: .85 }}>The teacher account will be deactivated and removed from all active lists.</p>
            </div>
          </div>

          {/* name display */}
          <div className="rounded-xl px-4 py-3 text-sm" style={css.raised}>
            <span style={css.secondary}>Type exactly: </span>
            <span className="font-semibold" style={css.primary}>{teacher.name}</span>
          </div>

          <Input
            label="Confirm teacher name"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={teacher.name}
            autoFocus
            error={confirmName && !canDelete ? 'Name does not match' : undefined}
          />
        </div>
      </Modal>

      {/* ══════════════ PASSWORD MODAL ══════════════ */}
      <Modal
        open={passwordOpen}
        onClose={() => !isResettingPassword && setPasswordOpen(false)}
        title="Reset Login Password"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)} disabled={isResettingPassword}>Close</Button>
            <Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPassword}>Reset Password</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl px-4 py-3 text-sm" style={css.raised}>
            <span style={css.muted}>Leave blank to auto-generate a secure temporary password.</span>
          </div>

          <Input
            label="New Password (optional)"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Leave blank for auto-generated password"
          />

          {resetResult && (
            <div className="space-y-3">
              <div className="rounded-xl px-4 py-3" style={css.successBg}>
                <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                  ✓ Password reset — share these credentials now.
                </p>
              </div>
              <CredentialRow icon={Mail}    label="Login Email"        value={resetResult.email || teacher.email} onCopy={handleCopy} />
              <CredentialRow icon={KeyRound} label="Temporary Password" value={resetResult.generated_password || tempPassword || 'Custom password set'} onCopy={handleCopy} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default TeacherDetailPage
