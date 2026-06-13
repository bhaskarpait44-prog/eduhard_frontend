import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, BookOpen, ScrollText,
  KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
  Phone, Heart, User, ChevronLeft, ChevronRight as ChevronRIcon,
  ChevronDown, ChevronUp, Book, MapPin, Briefcase, Calendar, ShieldCheck,
  History, LogOut, ArrowRightLeft, UserRound, CheckCircle2, Clock, Pencil,
  Users, Truck, Library, LayoutDashboard, Plus, FileDown, Lock, Info
} from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { getInitials, formatDate, getFileUrl } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import * as studentApi from '@/api/studentsApi'
import useAuth from '@/hooks/useAuth'
import TabAuditLog from './tabs/TabAuditLog'
import TabResults from './tabs/TabResults'
import TabFees from './tabs/TabFees'
import TabDocuments from './tabs/TabDocuments'
import TabEnrolledSubjects from './tabs/TabEnrolledSubjects'
import TabHealth from './tabs/TabHealth'
import TabFamily from './tabs/TabFamily'
import TabServices from './tabs/TabServices'
import TabSummary from './tabs/TabSummary'
import TabIdentity from './tabs/TabIdentity'
import TabProfile from './tabs/TabProfile'
import TabLibrary from './tabs/TabLibrary'
import TabTimeTable from './tabs/TabTimeTable'
import useAttendanceStore from '@/store/attendanceStore'
import StudentIDCardDownload from '@/components/pdf/StudentIDCardDownload'
import TransferCertificateDownload from '@/components/pdf/TransferCertificateDownload'
import MarkAsLeftModal from '@/components/students/MarkAsLeftModal'
import MarkAsGraduatedModal from '@/components/students/MarkAsGraduatedModal'
import ReadmitModal from '@/components/students/ReadmitModal'
import EnrollmentHistoryModal from '@/components/students/EnrollmentHistoryModal'
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar'

/* ─── Tab config ─────────────────────────────────────────── */
const TABS = [
  { key: 'details',    label: 'Student Details',    icon: User },
  { key: 'timetable',  label: 'Time Table',         icon: Clock },
  { key: 'attendance', label: 'Leave & Attendance', icon: CalendarCheck },
  { key: 'fees',       label: 'Fees',               icon: Wallet },
  { key: 'results',    label: 'Exam & Results',     icon: GraduationCap },
  { key: 'library',    label: 'Library',            icon: Library },
  { key: 'audit',      label: 'Audit Log',          icon: ScrollText },
]

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value || '--'}</span>
  </div>
)

const StudentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastSuccess } = useToast()
  const { isAdmin } = useAuth()
  const {
    selectedStudent: student,
    fetchStudent,
    clearSelected,
    deleteStudent,
    toggleStatus,
    fetchIDCardData,
    fetchTCData,
    isSaving,
  } = useAdminStudentStore()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details')
  const [pageLoading, setPageLoading] = useState(true)
  
  /* Modals */
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [graduatedOpen, setGraduatedOpen] = useState(false)
  const [readmitOpen, setReadmitOpen] = useState(false)
  const [resetResult, setResetResult] = useState(null)
  const [parentResetResult, setParentResetResult] = useState(null)
  const [isResettingPass, setIsResettingPass] = useState(false)
  const [isResettingParentPass, setIsResettingParentPass] = useState(false)
  const [manualPassword, setManualPassword] = useState('')
  const [manualParentPassword, setManualParentPassword] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const [fetchingDocs, setFetchingDocs] = useState({ id: false, tc: false })
  const [docs, setDocs] = useState({ id: null, tc: null })

  const handleDownloadIDCard = async () => {
    try {
      setFetchingDocs(p => ({ ...p, id: true }))
      const res = await fetchIDCardData(student.id)
      setDocs(p => ({ ...p, id: res }))
      toastSuccess('ID Card ready')
    } catch (err) {
      toastError(err.message || 'Failed to fetch ID card data')
    } finally {
      setFetchingDocs(p => ({ ...p, id: false }))
    }
  }

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
    setSearchParams(tab === 'details' ? {} : { tab })
  }

  const handleResetPassword = async () => {
    setIsResettingPass(true)
    try {
      const res = await studentApi.resetPassword(id, manualPassword ? { new_password: manualPassword } : {})
      setResetResult(res.data)
      setManualPassword('')
      toastSuccess('Student password reset')
    } catch (err) { toastError(err.message || 'Failed') }
    finally { setIsResettingPass(false) }
  }

  const handleResetParentPassword = async () => {
    setIsResettingParentPass(true)
    try {
      const res = await studentApi.resetParentPassword(id, manualParentPassword ? { new_password: manualParentPassword } : {})
      setParentResetResult(res.data)
      setManualParentPassword('')
      toastSuccess('Parent password reset')
    } catch (err) { toastError(err.message || 'Failed') }
    finally { setIsResettingParentPass(false) }
  }

  const handleCopy = async (v) => {
    if (!v) return
    try { await navigator.clipboard.writeText(v); toastSuccess('Copied') }
    catch { toastError('Unable to copy') }
  }

  if (pageLoading || !student) return <div className="max-w-[1400px] mx-auto p-6 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /><div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6"><div className="h-screen bg-gray-200 rounded-xl" /><div className="h-screen bg-gray-200 rounded-xl" /></div></div>

  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(ROUTES.STUDENTS)}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
            title="Back to Students"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
            <nav className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1">
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate('/')}>Dashboard</span>
              <ChevronRIcon size={10} />
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate(ROUTES.STUDENTS)}>Student</span>
              <ChevronRIcon size={10} />
              <span className="text-indigo-600">Student Details</span>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {student.status === 'active' && (
            <>
              <Button 
                variant="secondary" 
                icon={LogOut} 
                size="sm" 
                className="text-red-600 border-red-100 hover:bg-red-50" 
                onClick={() => setLeftOpen(true)}
              >
                Mark as Left
              </Button>
              <Button 
                variant="secondary" 
                icon={GraduationCap} 
                size="sm" 
                className="text-blue-600 border-blue-100 hover:bg-blue-50" 
                onClick={() => setGraduatedOpen(true)}
              >
                Mark as Graduated
              </Button>
            </>
          )}
          {(student.status === 'left' || student.status === 'graduated') && (
            <Button 
              variant="secondary" 
              icon={ArrowRightLeft} 
              size="sm" 
              className="text-emerald-600 border-emerald-100 hover:bg-emerald-50" 
              onClick={() => setReadmitOpen(true)}
            >
              Re-admit Student
            </Button>
          )}
          {docs.id ? (
            <StudentIDCardDownload data={docs.id} fileName={`ID_${student.admission_no}.pdf`} />
          ) : (
            <Button 
              variant="secondary" 
              icon={IdCard} 
              size="sm" 
              onClick={handleDownloadIDCard} 
              loading={fetchingDocs.id}
            >
              ID Card
            </Button>
          )}
          <Button variant="secondary" icon={Lock} size="sm" onClick={() => setPasswordOpen(true)}>Login Details</Button>
          <Button variant="primary" icon={Pencil} size="sm" onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}/edit`)}>Edit Student</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* ── Left Sidebar ── */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => student.photo_path && setPreviewOpen(true)}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border-4 border-white flex items-center justify-center bg-indigo-600">
                  {student.photo_path ? (
                    <img 
                      src={getFileUrl(student.photo_path)} 
                      alt={fullName} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-3xl font-bold">${getInitials(fullName)}</div>`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials(fullName)}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <div 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-1 shadow-sm border ${
                      student.status === 'active' 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : student.status === 'left' 
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      student.status === 'active' ? 'bg-green-500' : student.status === 'left' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    {student.status || 'Active'}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{fullName}</h2>
                  <p className="text-sm font-bold text-indigo-600 tracking-tight">{student.admission_no}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="space-y-1">
                <InfoItem label="Roll No" value={enrollment?.roll_number} />
                <InfoItem label="Gender" value={student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1)} />
                <InfoItem label="Date Of Birth" value={formatDate(student.date_of_birth)} />
                <InfoItem label="Blood Group" value={student.blood_group} />
                <InfoItem label="Religion" value={student.religion} />
                <InfoItem label="Caste" value={student.caste} />
                <InfoItem label="Mother tongue" value={student.mother_tongue} />
              </div>
              <Button 
                variant="primary" 
                icon={Info} 
                className="w-full py-2.5 rounded-xl shadow-lg shadow-indigo-100" 
                onClick={() => navigate(`${ROUTES.STUDENTS}/${id}/full-details`)}
              >
                Details
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Primary Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900">{student.phone || '--'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{student.email || '--'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Account Management</h3>
            <div className="space-y-2">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={student.is_active ? ShieldCheck : CheckCircle2} 
                className={`w-full justify-start ${student.is_active ? 'text-amber-600' : 'text-emerald-600'}`}
                onClick={async () => {
                  const res = await toggleStatus(student.id)
                  if (res.success) {
                    toastSuccess(`Student ${res.is_active ? 'activated' : 'deactivated'}`)
                  } else {
                    toastError(res.message || 'Failed to toggle status')
                  }
                }}
              >
                {student.is_active ? 'Suspend Account' : 'Activate Account'}
              </Button>
              <Button variant="secondary" size="sm" icon={History} className="w-full justify-start" onClick={() => setHistoryOpen(true)}>Enrollment History</Button>
              <Button variant="danger" size="sm" icon={Trash2} className="w-full justify-start" onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}/delete`)}>Delete Student</Button>
            </div>
          </div>
        </div>

        {/* ── Right Content ── */}
        <div className="min-w-0 space-y-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all transition-colors ${
                    active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'details' && <TabDetails student={student} />}
            {activeTab === 'timetable' && <TabTimeTable studentId={student.id} />}
            {activeTab === 'attendance' && <TabAttendance enrollmentId={enrollment?.id} />}
            {activeTab === 'fees' && <TabFees enrollmentId={enrollment?.id} />}
            {activeTab === 'results' && <TabResults studentId={student.id} />}
            {activeTab === 'library' && <TabLibrary student={student} />}
            {activeTab === 'audit' && <TabAuditLog studentId={student.id} />}
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Access Credentials" size="md">
        <div className="space-y-6 p-1">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
            <ShieldCheck size={20} className="text-indigo-600 mt-0.5" />
            <p className="text-xs text-indigo-800 leading-relaxed">Login credentials allow students and parents to access their respective portals. Keep these secure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Student Access</h4>
              <CredentialRow icon={Mail} label="Login Email" value={student.email} onCopy={handleCopy} />
              
              <div className="space-y-2">
                <Input 
                  label="New Manual Password (Optional)" 
                  type="password" 
                  placeholder="Min 8 characters"
                  value={manualPassword}
                  onChange={e => setManualPassword(e.target.value)}
                />
                <Button icon={KeyRound} className="w-full" onClick={handleResetPassword} loading={isResettingPass}>
                  {manualPassword ? 'Set Manual Password' : 'Reset Random Password'}
                </Button>
              </div>

              {resetResult && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-[10px] font-bold text-green-800 mb-1">Status:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-bold text-green-900">
                      {resetResult.generated_password ? `New Temp: ${resetResult.generated_password}` : 'Password Updated'}
                    </code>
                    {resetResult.generated_password && (
                      <button onClick={() => handleCopy(resetResult.generated_password)} className="text-green-600"><Copy size={14}/></button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">Parent Access</h4>
              <CredentialRow icon={Mail} label="Login Email" value={student.parent_email} onCopy={handleCopy} />
              
              <div className="space-y-2">
                <Input 
                  label="New Manual Password (Optional)" 
                  type="password" 
                  placeholder="Min 8 characters"
                  value={manualParentPassword}
                  onChange={e => setManualParentPassword(e.target.value)}
                />
                <Button variant="secondary" icon={KeyRound} className="w-full" onClick={handleResetParentPassword} loading={isResettingParentPass}>
                  {manualParentPassword ? 'Set Manual Password' : 'Reset Random Password'}
                </Button>
              </div>

              {parentResetResult && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-800 mb-1">Status:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-bold text-amber-900">
                      {parentResetResult.generated_password ? `New Temp: ${parentResetResult.generated_password}` : 'Password Updated'}
                    </code>
                    {parentResetResult.generated_password && (
                      <button onClick={() => handleCopy(parentResetResult.generated_password)} className="text-amber-600"><Copy size={14}/></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <MarkAsLeftModal open={leftOpen} student={student} onClose={() => setLeftOpen(false)} onSuccess={() => { setLeftOpen(false); fetchStudent(id) }} />
      <MarkAsGraduatedModal open={graduatedOpen} student={student} onClose={() => setGraduatedOpen(false)} onSuccess={() => { setGraduatedOpen(false); fetchStudent(id) }} />
      <ReadmitModal open={readmitOpen} student={student} onClose={() => setReadmitOpen(false)} onSuccess={() => { setReadmitOpen(false); fetchStudent(id) }} />
      <EnrollmentHistoryModal open={historyOpen} student={student} onClose={() => setHistoryOpen(false)} />

      {/* Image Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Profile Photo" size="md">
        <div className="flex justify-center p-2">
          <img 
            src={getFileUrl(student.photo_path)} 
            alt={fullName} 
            className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain"
          />
        </div>
      </Modal>
    </div>
  )
}

const TabDetails = ({ student }) => {
  const documents = student.documents || []
  
  return (
    <div className="space-y-6">
      {/* Parents Information */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-6">Parents Information</h3>
        <div className="space-y-4">
          <ParentCard 
            name={student.father_name} 
            role="Father" 
            phone={student.father_phone} 
            email={student.parent_email} 
          />
          <ParentCard 
            name={student.mother_name} 
            role="Mother" 
            phone={student.mother_phone} 
          />
          <ParentCard 
            name={student.guardian_name || student.father_name} 
            role={`Guardian (${student.guardian_relation || 'Father'})`} 
            phone={student.guardian_phone || student.father_phone} 
            email={student.parent_email} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6">Documents</h3>
          {documents.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-50 rounded-xl">
              <ScrollText size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-xs text-gray-400 font-medium">No documents uploaded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <DocumentRow key={doc.id} name={doc.name} path={doc.file_path} />
              ))}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6">Address</h3>
          <div className="space-y-6">
            <AddressRow icon={MapPin} label="Current Address" value={`${student.address || ''}, ${student.city || ''}, ${student.state || ''} ${student.pincode || ''}`.trim() || 'Not Provided'} />
            <AddressRow icon={ArrowRightLeft} label="Permanent Address" value={student.is_permanent_same ? `${student.address || ''}, ${student.city || ''}, ${student.state || ''} ${student.pincode || ''}`.trim() : `${student.perm_address || ''}, ${student.perm_district || ''}, ${student.perm_state || ''} ${student.perm_pincode || ''}`.trim() || 'Not Provided'} />
          </div>
        </div>
      </div>

      {/* Previous School Details */}
      {(student.prev_school_name || student.prev_school_address) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-6 border-b pb-4">Previous School Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Previous School Name</p>
              <p className="text-sm font-semibold text-gray-900">{student.prev_school_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">School Address</p>
              <p className="text-sm font-semibold text-gray-900">{student.prev_school_address || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ParentCard = ({ name, role, phone, email }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-4 flex-1">
      <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm">
        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-bold uppercase text-lg">
          {getInitials(name || role)}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900">{name || 'Not Provided'}</h4>
        <p className="text-xs font-semibold text-indigo-600">{role}</p>
      </div>
    </div>
    <div className="hidden sm:grid grid-cols-2 gap-x-12 flex-[2]">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Phone</p>
        <p className="text-xs font-semibold text-gray-900">{phone || '--'}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Email</p>
        <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{email || '--'}</p>
      </div>
    </div>
    <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Reset Password">
      <KeyRound size={16} />
    </button>
  </div>
)

const DocumentRow = ({ name, path }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded shadow-sm text-red-500">
        <ScrollText size={16} />
      </div>
      <span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{name}</span>
    </div>
    <a href={getFileUrl(path)} target="_blank" rel="noreferrer" className="p-2 rounded bg-indigo-900 text-white hover:bg-indigo-800 shadow-sm transition-colors">
      <FileDown size={14} />
    </a>
  </div>
)

const AddressRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
      <Icon size={16} />
    </div>
    <div className="space-y-1">
      <p className="text-xs font-bold text-gray-900">{label}</p>
      <p className="text-xs font-medium text-gray-500 leading-relaxed">{value}</p>
    </div>
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: studentSummary?.presentCount || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Absent', value: studentSummary?.absentCount || 0, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Late', value: studentSummary?.lateCount || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Percentage', value: studentSummary?.percentage != null ? `${studentSummary.percentage}%` : '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-4 rounded-xl border-b-4 border-black border-opacity-5`}>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)} className="p-2 hover:bg-white rounded-lg transition-colors border shadow-sm"><ChevronLeft size={16} /></button>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500">{MONTHS[month]} {year}</h3>
          <button onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)} className="p-2 hover:bg-white rounded-lg transition-colors border shadow-sm"><ChevronRIcon size={16} /></button>
        </div>
        <AttendanceCalendar year={year} month={month} records={studentRecords} />
      </div>
    </div>
  )
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl p-3 border border-gray-100 bg-gray-50/50">
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0 bg-white shadow-sm text-indigo-600">
        <Icon size={16} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value || '--'}</p>
      </div>
    </div>
    <button onClick={() => onCopy(value)} className="p-2 text-gray-400 hover:text-indigo-600"><Copy size={14} /></button>
  </div>
)

export default StudentDetailPage
