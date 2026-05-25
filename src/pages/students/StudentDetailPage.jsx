import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, BookOpen, ScrollText,
  KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
  Phone, Heart, User, ChevronLeft, ChevronRight as ChevronRIcon,
  ChevronDown, ChevronUp, Book, MapPin, Briefcase, Calendar, ShieldCheck,
  History, LogOut, ArrowRightLeft, UserRound, CheckCircle2, Clock, Pencil
} from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { getInitials, formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import * as studentApi from '@/api/studentsApi'
import useAuth from '@/hooks/useAuth'
import TabAuditLog from './tabs/TabAuditLog'
import TabResults from './tabs/TabResults'
import TabFees from './tabs/TabFees'
import TabIdentity from './tabs/TabIdentity'
import TabProfile from './tabs/TabProfile'
import TabDocuments from './tabs/TabDocuments'
import TabEnrolledSubjects from './tabs/TabEnrolledSubjects'
import TabHealth from './tabs/TabHealth'
import useAttendanceStore from '@/store/attendanceStore'
import StudentIDCardDownload from '@/components/pdf/StudentIDCardDownload'
import TransferCertificateDownload from '@/components/pdf/TransferCertificateDownload'
import MarkAsLeftModal from '@/components/students/MarkAsLeftModal'
import MarkAsGraduatedModal from '@/components/students/MarkAsGraduatedModal'
import ReadmitModal from '@/components/students/ReadmitModal'
import EnrollmentHistoryModal from '@/components/students/EnrollmentHistoryModal'

/* ─── Tab config ─────────────────────────────────────────── */
const TABS = [
  { key: 'identity',   label: 'Identity',   icon: IdCard },
  { key: 'profile',    label: 'Profile',    icon: User },
  { key: 'parent',     label: 'Parents',    icon: Heart },
  { key: 'health',     label: 'Health',     icon: Heart },
  { key: 'subjects',   label: 'Subjects',   icon: Book },
  { key: 'documents',  label: 'Documents',  icon: ScrollText },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'results',    label: 'Results',    icon: GraduationCap },
  { key: 'fees',       label: 'Fees',       icon: Wallet },
  { key: 'audit',      label: 'Audit Log',  icon: ScrollText },
]

/* ─── Standard Styles ────────────────────────────────────── */
const css = {
  card:    { background: 'var(--color-surface)',        border: '1px solid var(--color-border)', borderRadius: 16 },
  raised:  { background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 12 },
  primary:   { color: 'var(--color-text-primary)' },
  secondary: { color: 'var(--color-text-secondary)' },
  muted:     { color: 'var(--color-text-muted)' },
  successBg: { background: '#ecfdf5', border: '1px solid #bbf7d0' },
  dangerBg:  { background: '#fef2f2', border: '1px solid #fecaca' },
}

/* ─── Components ─────────────────────────────────────────── */
const Field = ({ icon: Icon, label, value, full = false }) => (
  <div className={`rounded-xl p-4 ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`} style={css.raised}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5 mb-2" style={css.muted}>
      <Icon size={11} strokeWidth={2.2} />
      {label}
    </p>
    <p className="text-sm font-medium leading-snug" style={value ? css.primary : css.muted}>
      {value || 'Not provided'}
    </p>
  </div>
)

const StatPill = ({ icon: Icon, label, value, color = '#4338ca', bg = '#eef2ff' }) => (
  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: bg, border: `1px solid ${bg === '#eef2ff' ? '#c7d2fe' : 'transparent'}` }}>
    <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: color + '18' }}>
      <Icon size={16} style={{ color }} />
    </div>
    <div>
      <p className="text-xs font-semibold" style={{ color: color + 'cc' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  </div>
)

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={css.raised}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: '#eef2ff', color: '#4338ca' }}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const StudentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastSuccess, toastWarning } = useToast()
  const { isAdmin } = useAuth()
  const {
    selectedStudent: student,
    fetchStudent,
    clearSelected,
    deleteStudent,
    toggleStatus,
    fetchIDCardData,
    fetchTCData,
    updateIdentity,
    isSaving,
  } = useAdminStudentStore()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'identity')
  const [pageLoading, setPageLoading] = useState(true)
  
  /* Modals */
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [graduatedOpen, setGraduatedOpen] = useState(false)
  const [readmitOpen, setReadmitOpen] = useState(false)
  const [fetchingDocs, setFetchingDocs] = useState({ id: false, tc: false })
  const [docs, setDocs] = useState({ id: null, tc: null })

  /* Form States */
  const [confirmName, setConfirmName] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [resetResult, setResetResult] = useState(null)
  const [isResettingPass, setIsResettingPass] = useState(false)
  const [editForm, setEditForm] = useState({})

  usePageTitle(student ? `${student.first_name} ${student.last_name}` : 'Student Detail')

  useEffect(() => {
    setPageLoading(true)
    fetchStudent(id)
      .catch(() => { toastError('Student not found'); navigate(ROUTES.STUDENTS) })
      .finally(() => setPageLoading(false))
    return () => clearSelected()
  }, [id, fetchStudent, clearSelected, navigate, toastError])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (TABS.some(item => item.key === tab)) setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'identity' ? {} : { tab })
  }

  const syncEditForm = () => {
    if (!student) return
    setEditForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || 'male',
      date_of_birth: student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : '',
      blood_group: student.blood_group || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      father_name: student.father_name || '',
      father_phone: student.father_phone || '',
      mother_name: student.mother_name || '',
      mother_phone: student.mother_phone || '',
      mother_email: student.mother_email || '',
      father_occupation: student.father_occupation || '',
      emergency_contact: student.emergency_contact || '',
      medical_notes: student.medical_notes || '',
    })
  }

  const handleSaveEdit = async () => {
    try {
      await updateIdentity(id, editForm)
      toastSuccess('Student updated successfully')
      setEditOpen(false)
      await fetchStudent(id)
    } catch (err) {
      toastError(err.message || 'Failed to update student')
    }
  }

  const handleDelete = async () => {
    const fullName = `${student.first_name} ${student.last_name}`.trim()
    if (confirmName.trim() !== fullName) return
    const r = await deleteStudent(id, { confirm_name: confirmName.trim() })
    if (r.success) { toastSuccess('Student deleted'); navigate(ROUTES.STUDENTS) }
    else toastError(r.message || 'Failed to delete')
  }

  const handleToggleStatus = async () => {
    if (!window.confirm(`Are you sure you want to ${student.is_active ? 'deactivate' : 'activate'} this student?`)) return
    const res = await toggleStatus(id)
    if (res.success) toastSuccess(`Student ${res.is_active ? 'activated' : 'deactivated'}`)
    else toastError(res.message || 'Failed')
  }

  const handleResetPassword = async () => {
    setIsResettingPass(true)
    try {
      const res = await studentApi.resetPassword(id, { new_password: tempPassword.trim() || undefined })
      setResetResult(res.data)
      setTempPassword('')
      toastSuccess('Password reset')
    } catch (err) { toastError(err.message || 'Failed') }
    finally { setIsResettingPass(false) }
  }

  const handleCopy = async (v) => {
    if (!v) return
    try { await navigator.clipboard.writeText(v); toastSuccess('Copied') }
    catch { toastError('Unable to copy') }
  }

  if (pageLoading || !student) return <div className="max-w-4xl mx-auto space-y-4 animate-pulse"><div className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800" /><div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800" /></div>

  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20">
      {/* ── Back button ── */}
      <button
        onClick={() => navigate(ROUTES.STUDENTS)}
        className="inline-flex items-center gap-2 text-sm rounded-xl px-3 py-2 transition-colors"
        style={{ ...css.secondary, background: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* ── Hero Card ── */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-5" style={css.card}>
        {/* avatar */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {getInitials(fullName)}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold" style={css.primary}>{fullName}</h1>
            <Badge variant={student.is_active ? 'green' : 'grey'} dot>{student.is_active ? 'Active' : 'Inactive'}</Badge>
            <Badge variant="blue">Student</Badge>
          </div>
          <p className="text-sm mb-0.5" style={css.secondary}>{student.email}</p>
          <p className="text-xs" style={css.muted}>
            Adm: {student.admission_no} 
            {enrollment ? ` · ${enrollment.class} ${enrollment.section} · Roll ${enrollment.roll_number || '--'}` : ' · No enrollment'}
          </p>

          {/* quick stats row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {enrollment && <StatPill icon={BookOpen} label="Class" value={enrollment.class} />}
            {student.gender && <StatPill icon={User} label="Gender" value={student.gender} color="#0891b2" bg="#ecfeff" />}
            <StatPill icon={CheckCircle2} label="Account" value={student.is_active ? 'Active' : 'Locked'} color={student.is_active ? '#15803d' : '#991b1b'} bg={student.is_active ? '#dcfce7' : '#fef2f2'} />
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => { syncEditForm(); setEditOpen(true) }}>Edit</Button>
          <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => { setTempPassword(''); setResetResult(null); setPasswordOpen(true) }}>Credentials</Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => { setConfirmName(''); setDeleteOpen(true) }}>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        {/* ── Main Tabbed Content ── */}
        <div className="space-y-5">
          <div className="rounded-2xl overflow-hidden" style={css.card}>
            <div className="flex overflow-x-auto no-scrollbar border-b" style={{ borderColor: 'var(--color-border)' }}>
              {TABS.map(tab => {
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className="flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors uppercase tracking-widest"
                    style={{
                      borderBottomColor: active ? 'var(--color-brand)' : 'transparent',
                      color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <tab.icon size={13} /> {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6">
              {activeTab === 'identity' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field icon={Calendar} label="Date of Birth" value={formatDate(student.date_of_birth, 'long')} />
                  <Field icon={User}     label="Gender"        value={student.gender} />
                  <Field icon={Heart}    label="Blood Group"   value={student.blood_group} />
                  <Field icon={Clock}    label="Joining Date"  value={formatDate(student.joined_date, 'long')} />
                  <Field icon={Briefcase}label="Joining Type"  value={student.joining_type} />
                  <Field icon={Phone}    label="Emergency Contact" value={student.emergency_contact} />
                  <Field icon={ScrollText} label="Medical Notes" value={student.medical_notes} full />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field icon={Phone}    label="Student Phone" value={student.phone} />
                  <Field icon={Mail}     label="Student Email" value={student.email} />
                  <Field icon={MapPin}   label="City"          value={student.city} />
                  <Field icon={MapPin}   label="State"         value={student.state} />
                  <Field icon={IdCard}   label="Pincode"       value={student.pincode} />
                  <Field icon={MapPin}   label="Address"       value={student.address} full />
                </div>
              )}

              {activeTab === 'parent' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field icon={UserRound} label="Father Name"   value={student.father_name} />
                  <Field icon={Phone}     label="Father Phone"  value={student.father_phone} />
                  <Field icon={Briefcase} label="Father Job"    value={student.father_occupation} />
                  <Field icon={UserRound} label="Mother Name"   value={student.mother_name} />
                  <Field icon={Phone}     label="Mother Phone"  value={student.mother_phone} />
                  <Field icon={Mail}      label="Mother Email"  value={student.mother_email} />
                </div>
              )}

              {activeTab === 'health'     && <TabHealth   studentId={student.id} isAdmin={isAdmin} />}
              {activeTab === 'subjects'   && <TabEnrolledSubjects studentId={student.id} isAdmin={isAdmin} />}
              {activeTab === 'documents'  && <TabDocuments studentId={student.id} />}
              {activeTab === 'attendance' && <TabAttendance enrollmentId={enrollment?.id} />}
              {activeTab === 'results'    && <TabResults  studentId={student.id} />}
              {activeTab === 'fees'       && <TabFees     enrollmentId={enrollment?.id} />}
              {activeTab === 'audit'      && <TabAuditLog studentId={student.id} />}
            </div>
          </div>
        </div>

        {/* ── Sidebar Actions ── */}
        <div className="space-y-5">
          <section className="rounded-2xl p-5 space-y-4" style={css.card}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={css.muted}>Official Documents</h3>
            <div className="space-y-2">
              <DocBtn
                label="ID Card"
                icon={IdCard}
                loading={fetchingDocs.id}
                onClick={async () => {
                  setFetchingDocs(p => ({ ...p, id: true }))
                  const res = await fetchIDCardData(student.id)
                  setDocs(p => ({ ...p, id: res }))
                  setFetchingDocs(p => ({ ...p, id: false }))
                }}
                download={docs.id ? <StudentIDCardDownload data={docs.id} fileName={`ID_${student.admission_no}.pdf`} /> : null}
              />
              <DocBtn
                label="Transfer Certificate"
                icon={ScrollText}
                loading={fetchingDocs.tc}
                onClick={async () => {
                  setFetchingDocs(p => ({ ...p, tc: true }))
                  const res = await fetchTCData(student.id)
                  setDocs(p => ({ ...p, tc: res }))
                  setFetchingDocs(p => ({ ...p, tc: false }))
                }}
                download={docs.tc ? <TransferCertificateDownload data={docs.tc} fileName={`TC_${student.admission_no}.pdf`} /> : null}
              />
              <Button variant="secondary" size="sm" icon={History} className="w-full justify-start" onClick={() => setHistoryOpen(true)}>Enrollment History</Button>
            </div>
          </section>

          <section className="rounded-2xl p-5 space-y-4" style={css.card}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest" style={css.muted}>Enrollment Status</h3>
            <div className="space-y-2">
              {student.status === 'active' ? (
                <>
                  <Button variant="secondary" size="sm" icon={LogOut} className="w-full justify-start text-red-600" onClick={() => setLeftOpen(true)}>Mark as Left</Button>
                  <Button variant="secondary" size="sm" icon={GraduationCap} className="w-full justify-start text-indigo-600" onClick={() => setGraduatedOpen(true)}>Mark as Graduated</Button>
                </>
              ) : (
                <Button variant="primary" size="sm" icon={ArrowRightLeft} className="w-full" onClick={() => setReadmitOpen(true)}>Re-admit Student</Button>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                icon={student.is_active ? ShieldCheck : CheckCircle2} 
                className={`w-full justify-start ${student.is_active ? 'text-amber-600' : 'text-emerald-600'}`}
                onClick={handleToggleStatus}
              >
                {student.is_active ? 'Suspend Account' : 'Activate Account'}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal open={editOpen} onClose={() => !isSaving && setEditOpen(false)} title="Edit Student Details" size="lg" footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button icon={Pencil} onClick={handleSaveEdit} loading={isSaving}>Save Changes</Button></>}>
        <EditForm form={editForm} setForm={setEditForm} />
      </Modal>

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Reset Student Credentials" size="sm" footer={<><Button variant="secondary" onClick={() => setPasswordOpen(false)}>Close</Button><Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPass}>Reset Access</Button></>}>
        <div className="space-y-4">
          <Input label="Temporary Password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="Leave blank for auto-gen" />
          {resetResult && (
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl mb-2" style={css.successBg}><p className="text-xs font-bold text-emerald-700">Credentials reset successfully.</p></div>
              <CredentialRow icon={Mail} label="Login Email" value={resetResult.email} onCopy={handleCopy} />
              <CredentialRow icon={KeyRound} label="Temp Password" value={resetResult.generated_password} onCopy={handleCopy} />
            </div>
          )}
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Record" size="sm" footer={<><Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" icon={Trash2} onClick={handleDelete} disabled={confirmName !== fullName}>Confirm Delete</Button></>}>
        <div className="space-y-4">
          <div className="p-4 rounded-xl flex gap-3" style={css.dangerBg}>
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <p className="text-xs text-red-800 leading-relaxed font-medium">Permanently deletes student and all history. Cannot be undone.</p>
          </div>
          <Input label={`Type "${fullName}" to confirm`} value={confirmName} onChange={e => setConfirmName(e.target.value)} autoFocus />
        </div>
      </Modal>

      <EnrollmentHistoryModal open={historyOpen} student={student} onClose={() => setHistoryOpen(false)} />
      <MarkAsLeftModal open={leftOpen} student={student} onClose={() => setLeftOpen(false)} onSuccess={() => { setLeftOpen(false); fetchStudent(id) }} />
      <MarkAsGraduatedModal open={graduatedOpen} student={student} onClose={() => setGraduatedOpen(false)} onSuccess={() => { setGraduatedOpen(false); fetchStudent(id) }} />
      <ReadmitModal open={readmitOpen} student={student} onClose={() => setReadmitOpen(false)} onSuccess={() => { setReadmitOpen(false); fetchStudent(id) }} />
    </div>
  )
}

const EditForm = ({ form, setForm }) => {
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Identity & Contact</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" value={form.first_name} onChange={e => update('first_name', e.target.value)} />
          <Input label="Last Name" value={form.last_name} onChange={e => update('last_name', e.target.value)} />
          <Select label="Gender" value={form.gender} onChange={e => update('gender', e.target.value)} options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} />
          <Input label="DOB" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} />
          <Input label="Email" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
      </section>
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Contact Address</h4>
        <div className="grid gap-4 sm:grid-cols-2">
           <Input label="City" value={form.city} onChange={e => update('city', e.target.value)} />
           <Input label="State" value={form.state} onChange={e => update('state', e.target.value)} />
           <Input label="Pincode" value={form.pincode} onChange={e => update('pincode', e.target.value)} />
           <div className="sm:col-span-2">
             <Input label="Full Address" value={form.address} onChange={e => update('address', e.target.value)} />
           </div>
        </div>
      </section>
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Parent Details</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Father Name" value={form.father_name} onChange={e => update('father_name', e.target.value)} />
          <Input label="Mother Name" value={form.mother_name} onChange={e => update('mother_name', e.target.value)} />
          <Input label="Emergency Contact" value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)} />
        </div>
      </section>
    </div>
  )
}

const DocBtn = ({ label, icon: Icon, onClick, loading, download }) => (
  <div className="w-full">
    {download ? download : (
      <button onClick={onClick} disabled={loading} className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 disabled:opacity-50">
        <div className="flex items-center gap-2"><Icon size={14} className="text-indigo-500" /> {label}</div>
        <ChevronRIcon size={14} className="opacity-40" />
      </button>
    )}
  </div>
)

const TabAttendance = ({ enrollmentId }) => {
  const { fetchStudentAttendance, studentRecords, studentSummary, isLoading } = useAttendanceStore()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    if (!enrollmentId) return
    const from = new Date(year, month, 1).toISOString().split('T')[0]
    const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
    fetchStudentAttendance(enrollmentId, { from, to })
  }, [year, month, enrollmentId, fetchStudentAttendance])

  const STATS = [
    { label: 'Present', value: studentSummary?.presentCount || 0, color: 'emerald' },
    { label: 'Absent',  value: studentSummary?.absentCount || 0, color: 'red' },
    { label: 'Late',    value: studentSummary?.lateCount || 0, color: 'amber' },
    { label: 'Rate',    value: studentSummary?.percentage != null ? `${studentSummary.percentage}%` : '—', color: 'blue' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border bg-white shadow-sm`} style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={css.muted}>{s.label}</p>
            <p className="text-2xl font-black tracking-tighter" style={css.primary}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border p-4 bg-gray-50/50" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)} className="p-2 hover:bg-white rounded-lg transition-colors border"><ChevronLeft size={16} /></button>
          <h3 className="text-sm font-bold uppercase tracking-widest">{MONTHS[month]} {year}</h3>
          <button onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)} className="p-2 hover:bg-white rounded-lg transition-colors border"><ChevronRIcon size={16} /></button>
        </div>
        <div className="text-center py-8 opacity-40 italic text-sm">Interactive calendar loading...</div>
      </div>
    </div>
  )
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default StudentDetailPage
