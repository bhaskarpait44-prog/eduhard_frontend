// src/pages/admin/CertificatesPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Award, Plus, FileText, Shield,
  ArrowRightLeft, BookOpen, Trophy, GraduationCap,
  Briefcase, RefreshCw, XCircle, Search, Eye,
  AlertTriangle, CheckCircle, ChevronLeft,
  ChevronRight, Sparkles, Users, UserCheck, BookMarked,
  Settings2, SlidersHorizontal, ScrollText,
  BadgeCheck, Hash
} from 'lucide-react'
import { PDFViewer } from '@react-pdf/renderer'
import { certificateApi, studentsApi, adminTeacherControlApi, classApi } from '@/api'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import { cn } from '@/utils/helpers'
import CertificateDownloadButton from '@/components/pdf/certificates/CertificateDownloadButton'
import TransferCertificatePDF   from '@/components/pdf/certificates/TransferCertificatePDF'
import BonafideCertificatePDF   from '@/components/pdf/certificates/BonafideCertificatePDF'
import CharacterCertificatePDF  from '@/components/pdf/certificates/CharacterCertificatePDF'
import MigrationCertificatePDF  from '@/components/pdf/certificates/MigrationCertificatePDF'
import MarksheetCertificatePDF  from '@/components/pdf/certificates/MarksheetCertificatePDF'
import SportsCertificatePDF     from '@/components/pdf/certificates/SportsCertificatePDF'
import StudyCertificatePDF      from '@/components/pdf/certificates/StudyCertificatePDF'
import ExperienceCertificatePDF from '@/components/pdf/certificates/ExperienceCertificatePDF'

/* ─── Constants ─────────────────────────────────────────────────────────── */
const PAGE_SIZE = 20

const CERTIFICATE_TYPES = [
  {
    value: 'transfer', label: 'Transfer Certificate', shortLabel: 'TC',
    icon: ArrowRightLeft,
    description: 'Issued when a student leaves or transfers to another school.',
    recipient: 'student', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    fields: [
      { name: 'leaving_date', label: 'Leaving Date',       type: 'date', required: true },
      { name: 'reason',       label: 'Reason for Leaving', type: 'text', required: true },
      { name: 'last_class',   label: 'Last Class Studied', type: 'text', required: true },
      { name: 'conduct',      label: 'General Conduct',    type: 'text', defaultValue: 'Good' },
    ],
  },
  {
    value: 'bonafide', label: 'Bonafide Certificate', shortLabel: 'BC',
    icon: Shield,
    description: 'Confirms current enrollment for scholarships, banks, visa, etc.',
    recipient: 'student', color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    fields: [{ name: 'purpose', label: 'Purpose', type: 'text', required: true }],
  },
  {
    value: 'character', label: 'Character Certificate', shortLabel: 'CC',
    icon: Award,
    description: "Certifies the student's conduct and moral character.",
    recipient: 'student', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    fields: [
      { name: 'conduct_grade', label: 'Conduct Grade', type: 'text', required: true },
      { name: 'remarks',       label: 'Remarks',       type: 'text' },
    ],
  },
  {
    value: 'migration', label: 'Migration Certificate', shortLabel: 'MC',
    icon: BookOpen,
    description: 'Required when a student moves between education boards.',
    recipient: 'student', color: '#06b6d4', gradient: 'linear-gradient(135deg,#06b6d4,#0284c7)',
    fields: [
      { name: 'from_board',     label: 'From Board',     type: 'text', required: true },
      { name: 'to_board',       label: 'To Board',       type: 'text', required: true },
      { name: 'last_exam_year', label: 'Last Exam Year', type: 'text', required: true },
    ],
  },
  {
    value: 'marksheet', label: 'Mark Sheet', shortLabel: 'MS',
    icon: FileText,
    description: 'Official record of examination marks or grades.',
    recipient: 'student', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#047857)',
    fields: [
      { name: 'exam_name', label: 'Examination Name', type: 'text', required: true },
      { name: 'session',   label: 'Academic Session', type: 'text', required: true },
    ],
  },
  {
    value: 'sports', label: 'Sports Certificate', shortLabel: 'SC',
    icon: Trophy,
    description: 'Awarded for sports or co-curricular achievements.',
    recipient: 'student', color: '#f97316', gradient: 'linear-gradient(135deg,#f97316,#c2410c)',
    fields: [
      { name: 'achievement', label: 'Achievement Level', type: 'text', required: true },
      { name: 'event_name',  label: 'Event Name',        type: 'text', required: true },
      { name: 'event_date',  label: 'Event Date',        type: 'date', required: true },
      { name: 'position',    label: 'Position Secured',  type: 'text' },
    ],
  },
  {
    value: 'study', label: 'Study Certificate', shortLabel: 'ST',
    icon: GraduationCap,
    description: 'Confirms study details for scholarships or government schemes.',
    recipient: 'student', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#be185d)',
    fields: [
      { name: 'scheme_name', label: 'Scheme Name',       type: 'text', required: true },
      { name: 'class',       label: 'Studying in Class', type: 'text', required: true },
      { name: 'year',        label: 'Year',              type: 'text', required: true },
    ],
  },
  {
    value: 'experience', label: 'Experience Certificate', shortLabel: 'EC',
    icon: Briefcase,
    description: 'Issued to staff or teachers leaving the school.',
    recipient: 'staff', color: '#64748b', gradient: 'linear-gradient(135deg,#64748b,#334155)',
    fields: [
      { name: 'designation',  label: 'Designation',       type: 'text', required: true },
      { name: 'join_date',    label: 'Date of Joining',   type: 'date', required: true },
      { name: 'leaving_date', label: 'Date of Leaving',   type: 'date', required: true },
      { name: 'reason',       label: 'Reason for Leaving', type: 'text' },
    ],
  },
]

const SAMPLE_DATA = {
  school: {
    name: 'Demo School', address: '123 School Lane, City - 123456',
    phone: '+91 98765 43210', email: 'school@demo.com',
    logo_url: null, principal_name: 'Mr. Principal Name'
  },
  recipient: {
    name: 'Sample Recipient', father_name: 'Sample Parent Name',
    admission_no: 'ADM-2024-001', class_name: 'Class X - A',
    employee_id: 'EMP-001', designation: 'Teacher'
  },
  certificate_no: 'CERT-2026-0001',
  issued_date: format(new Date(), 'yyyy-MM-dd'),
  status: 'active',
  extra_data: {
    leaving_date: '2026-05-23', reason: 'Transfer', last_class: 'X', conduct: 'Good',
    purpose: 'Bank Account Opening',
    conduct_grade: 'Excellent', remarks: 'A sincere and hardworking student.',
    from_board: 'CBSE', to_board: 'SEBA', last_exam_year: '2025',
    exam_name: 'Annual Examination 2026', session: '2025-2026',
    achievement: 'Gold Medal', event_name: 'District Sports Meet', event_date: '2026-03-15', position: '1st',
    scheme_name: 'Post Matric Scholarship', class: 'XI', year: '2026',
    designation: 'PGT Physics', join_date: '2020-06-01',
  }
}

const getCertificateComponent = (type, data = {}, settings = {}) => {
  const props = {
    data: {
      ...SAMPLE_DATA, ...data, type,
      school: {
        ...SAMPLE_DATA.school,
        name:           settings.school_name    || SAMPLE_DATA.school.name,
        principal_name: settings.principal_name || SAMPLE_DATA.school.principal_name,
        address:        settings.address        || SAMPLE_DATA.school.address,
        phone:          settings.phone          || SAMPLE_DATA.school.phone,
        email:          settings.email          || SAMPLE_DATA.school.email,
      }
    }
  }
  switch (type) {
    case 'transfer':   return <TransferCertificatePDF   {...props} />
    case 'bonafide':   return <BonafideCertificatePDF   {...props} />
    case 'character':  return <CharacterCertificatePDF  {...props} />
    case 'migration':  return <MigrationCertificatePDF  {...props} />
    case 'marksheet':  return <MarksheetCertificatePDF  {...props} />
    case 'sports':     return <SportsCertificatePDF     {...props} />
    case 'study':      return <StudyCertificatePDF      {...props} />
    case 'experience': return <ExperienceCertificatePDF {...props} />
    default:           return null
  }
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const PreviewSkeleton = () => (
  <div className="w-full h-full p-8 space-y-6 animate-pulse bg-white">
    <div className="flex items-center gap-4 border-b pb-6 border-gray-100">
      <div className="w-14 h-14 rounded-xl bg-gray-100" />
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
      </div>
    </div>
    <div className="h-8 bg-gray-100 rounded w-1/2 mx-auto" />
    <div className="space-y-3 pt-2">
      {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-50 rounded" style={{ width: `${90 - i*10}%` }} />)}
    </div>
    <div className="h-20 bg-gray-50 rounded-2xl w-full border border-gray-100" />
    <div className="flex justify-between pt-8">
      <div className="w-36 h-1 bg-gray-100 rounded" />
      <div className="w-36 h-1 bg-gray-100 rounded" />
    </div>
  </div>
)

const CertTypeCard = ({ type, onIssue }) => {
  const Icon = type.icon
  return (
    <div
      onClick={() => onIssue(type)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="h-1 w-full transition-all duration-300 group-hover:h-1.5" style={{ background: type.gradient }} />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
            style={{ background: type.gradient }}>
            <Icon size={22} />
          </div>
          <span className="rounded-lg px-2 py-0.5 text-[10px] font-black tracking-widest"
            style={{ backgroundColor: `${type.color}15`, color: type.color }}>
            {type.shortLabel}
          </span>
        </div>
        <h3 className="text-sm font-bold mb-1.5 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {type.label}
        </h3>
        <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--color-text-secondary)' }}>
          {type.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}>
            {type.recipient === 'student'
              ? <><Users size={11} /> Student</>
              : <><UserCheck size={11} /> Staff</>}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2"
            style={{ color: type.color }}>
            Issue <Plus size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}

const StatusPill = ({ status }) => {
  const map = {
    active:  { bg: 'rgba(16,185,129,0.1)', color: '#059669', icon: BadgeCheck, label: 'Active'  },
    revoked: { bg: 'rgba(239,68,68,0.1)',  color: '#dc2626', icon: XCircle,    label: 'Revoked' },
  }
  const m = map[status] || { bg: '#f3f4f6', color: '#6b7280', icon: Hash, label: status }
  const Icon = m.icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
      style={{ backgroundColor: m.bg, color: m.color }}>
      <Icon size={10} />{m.label}
    </span>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const CertificatesPage = () => {
  usePageTitle('Certificates')
  const { toastSuccess, toastError } = useToast()
  const toastErrorRef = useRef(toastError)
  useEffect(() => { toastErrorRef.current = toastError }, [toastError])

  const [activeTab, setActiveTab]           = useState('issue')
  const [loading, setLoading]               = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [certificates, setCertificates]     = useState([])
  const [pagination, setPagination]         = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters]               = useState({ type: '', status: '', search: '', page: 1 })
  const [searchInput, setSearchInput]       = useState('')
  const [templates, setTemplates]           = useState(CERTIFICATE_TYPES)
  const [editTemplateModal, setEditTemplateModal] = useState({ open: false, type: null, label: '', description: '', color: '' })
  const [certSettings, setCertSettings]     = useState({
    school_name: SAMPLE_DATA.school.name, principal_name: SAMPLE_DATA.school.principal_name,
    address: SAMPLE_DATA.school.address,  phone: SAMPLE_DATA.school.phone, email: SAMPLE_DATA.school.email,
  })
  const [issueModal, setIssueModal]           = useState({ open: false, type: null })
  const [successModal, setSuccessModal]       = useState({ open: false, data: null })
  const [templatePreview, setTemplatePreview] = useState({ open: false, type: null })
  const [revokeModal, setRevokeModal]         = useState({ open: false, id: null })
  const [formData, setFormData]               = useState({ recipient_id: '', extra_data: {} })
  const [recipients, setRecipients]           = useState([])
  const [classes, setClasses]                 = useState([])
  const [sections, setSections]               = useState([])
  const [modalFilters, setModalFilters]       = useState({ class_id: '', section_id: '' })

  useEffect(() => {
    certificateApi.getSettings().then(res => {
      if (res.data) setCertSettings({
        school_name:    res.data.name           || SAMPLE_DATA.school.name,
        principal_name: res.data.principal_name || SAMPLE_DATA.school.principal_name,
        address:        res.data.address        || SAMPLE_DATA.school.address,
        phone:          res.data.phone          || SAMPLE_DATA.school.phone,
        email:          res.data.email          || SAMPLE_DATA.school.email,
      })
    }).catch(console.error)
  }, [])

  const handleSaveSettings = async () => {
    setSubmitting(true)
    try { await certificateApi.updateSettings(certSettings); toastSuccess('Branding settings updated.') }
    catch { toastErrorRef.current('Failed to update branding settings.') }
    finally { setSubmitting(false) }
  }

  const loadCertificates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await certificateApi.getCertificates(filters)
      setCertificates(res.data.certificates)
      setPagination({ page: res.data.page, pages: res.data.pages, total: res.data.total })
    } catch { toastErrorRef.current('Failed to load certificates.') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => {
    const t = setTimeout(() => setFilters(p => ({ ...p, search: searchInput, page: 1 })), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { if (activeTab === 'register') loadCertificates() }, [activeTab, loadCertificates])

  useEffect(() => {
    classApi.getClasses().then(res => setClasses(classApi.getClassOptions(res))).catch(console.error)
  }, [])

  useEffect(() => {
    if (modalFilters.class_id) {
      classApi.getSections(modalFilters.class_id).then(res => {
        const data = res.data?.sections || res.data || []
        setSections(data.map(s => ({ value: String(s.id), label: s.name })))
      }).catch(console.error)
    } else { setSections([]) }
    setModalFilters(p => ({ ...p, section_id: '' }))
  }, [modalFilters.class_id])

  const fetchRecipients = useCallback(async (type, query, class_id, section_id) => {
    try {
      if (type === 'student') {
        const res = await studentsApi.getStudents({ search: query, class_id: class_id || undefined, section_id: section_id || undefined, perPage: 100 })
        const data = res.data?.students || res.data?.data || []
        setRecipients(data.map(s => ({ value: String(s.id), label: `${s.first_name} ${s.last_name} (${s.admission_no})`, sub: `Class: ${s.enrollments?.[0]?.class?.name || 'N/A'}` })))
      } else {
        const res = await adminTeacherControlApi.getTeacherControlTeachers()
        const data = res.data?.teachers || res.data || []
        setRecipients(data.map(t => ({ value: String(t.id), label: `${t.first_name} ${t.last_name} (${t.employee_id || 'Staff'})`, sub: t.designation || 'Teacher' })))
      }
    } catch (err) { console.error('Failed to fetch recipients', err) }
  }, [])

  useEffect(() => {
    if (issueModal.open && issueModal.type) fetchRecipients(issueModal.type.recipient, '', modalFilters.class_id, modalFilters.section_id)
  }, [issueModal.open, issueModal.type, modalFilters, fetchRecipients])

  const handleOpenIssueModal = (certType) => {
    setModalFilters({ class_id: '', section_id: '' })
    const def = {}
    certType.fields?.forEach(f => { if (f.defaultValue) def[f.name] = f.defaultValue })
    setFormData({ recipient_id: '', extra_data: def })
    setIssueModal({ open: true, type: certType })
  }

  const handleIssueSubmit = async (e) => {
    e.preventDefault()
    if (!formData.recipient_id) return toastErrorRef.current('Please select a recipient.')
    setSubmitting(true)
    try {
      const payload = {
        type: issueModal.type.value, recipient_type: issueModal.type.recipient,
        extra_data: formData.extra_data,
        [issueModal.type.recipient === 'student' ? 'student_id' : 'teacher_id']: formData.recipient_id
      }
      const res = await certificateApi.generateCertificate(payload)
      toastSuccess('Certificate generated successfully!')
      setIssueModal({ open: false, type: null })
      if (res.data.certificate) setSuccessModal({ open: true, data: res.data.certificate })
      if (activeTab === 'register') loadCertificates()
    } catch (err) { toastErrorRef.current(err.response?.data?.message || 'Failed to generate certificate.') }
    finally { setSubmitting(false) }
  }

  const handleRevoke  = (id) => setRevokeModal({ open: true, id })
  const confirmRevoke = async () => {
    try {
      await certificateApi.revokeCertificate(revokeModal.id)
      toastSuccess('Certificate revoked.')
      setRevokeModal({ open: false, id: null })
      loadCertificates()
    } catch { toastErrorRef.current('Failed to revoke certificate.') }
  }

  const handleEditTemplate = (e) => {
    e.preventDefault()
    setTemplates(prev => prev.map(t => t.value === editTemplateModal.type.value
      ? { ...t, label: editTemplateModal.label, description: editTemplateModal.description, color: editTemplateModal.color } : t))
    toastSuccess('Template updated.')
    setEditTemplateModal({ open: false, type: null, label: '', description: '', color: '' })
  }

  const handleOpenPreview = (type) => {
    setPreviewLoading(true); setTemplatePreview({ open: true, type })
    setTimeout(() => setPreviewLoading(false), 1000)
  }

  const getPageNumbers = () => {
    const { page, pages } = pagination
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
    const nums = []
    if (page <= 4) { for (let i = 1; i <= 5; i++) nums.push(i); nums.push('...'); nums.push(pages) }
    else if (page >= pages - 3) { nums.push(1); nums.push('...'); for (let i = pages - 4; i <= pages; i++) nums.push(i) }
    else { nums.push(1); nums.push('...'); nums.push(page - 1); nums.push(page); nums.push(page + 1); nums.push('...'); nums.push(pages) }
    return nums
  }

  const studentTypes = templates.filter(t => t.recipient === 'student')
  const staffTypes   = templates.filter(t => t.recipient === 'staff')

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#0f766e 0%,#0d9488 50%,#14b8a6 100%)' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />
        <div className="pointer-events-none absolute -bottom-8 right-32 h-32 w-32 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <ScrollText size={18} />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Certificate Management</h1>
            </div>
            <p className="text-sm opacity-75 ml-11">Issue, track, and manage official school certificates</p>
          </div>
          <div className="flex items-center gap-3 ml-11 md:ml-0">
            {[
              { label: 'Total Issued', value: activeTab === 'register' ? (pagination.total || '—') : '—', icon: Hash },
              { label: 'Cert Types',   value: templates.length, icon: BookMarked },
            ].map(({ label, value, icon: Ic }) => (
              <div key={label} className="rounded-2xl px-4 py-3 text-center min-w-[90px]"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <p className="text-2xl font-black">{value}</p>
                <p className="text-[10px] opacity-70 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
        {[
          { key: 'issue',     label: 'Issue New',       icon: Plus       },
          { key: 'register',  label: 'Issued Register', icon: ScrollText },
          { key: 'templates', label: 'Templates',       icon: Settings2  },
        ].map(({ key, label, icon: Ic }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn('flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200', activeTab === key ? 'shadow-sm' : 'opacity-60 hover:opacity-90')}
            style={{ backgroundColor: activeTab === key ? 'var(--color-surface)' : 'transparent', color: activeTab === key ? '#0f766e' : 'var(--color-text-secondary)' }}>
            <Ic size={14} />{label}
          </button>
        ))}
      </div>

      {/* TAB: ISSUE NEW */}
      {activeTab === 'issue' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff' }}>
                <Users size={14} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Student Certificates</h2>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: 'rgba(15,118,110,0.1)', color: '#0f766e' }}>{studentTypes.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {studentTypes.map(type => <CertTypeCard key={type.value} type={type} onIssue={handleOpenIssueModal} />)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#64748b,#334155)', color: '#fff' }}>
                <UserCheck size={14} />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Staff Certificates</h2>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b' }}>{staffTypes.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffTypes.map(type => <CertTypeCard key={type.value} type={type} onIssue={handleOpenIssueModal} />)}
            </div>
          </div>
        </div>
      )}

      {/* TAB: REGISTER */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
              <SlidersHorizontal size={13} />Filters
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input placeholder="Search certificate no., name..." icon={Search} value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            </div>
            <div className="w-52">
              <Select placeholder="All Types" options={templates.map(t => ({ label: t.label, value: t.value }))} value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))} />
            </div>
            <div className="w-40">
              <Select placeholder="All Status" options={[{ label: 'Active', value: 'active' }, { label: 'Revoked', value: 'revoked' }]} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))} />
            </div>
            {(filters.type || filters.status || filters.search) && (
              <button onClick={() => { setFilters({ type: '', status: '', search: '', page: 1 }); setSearchInput('') }}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                <XCircle size={13} />Clear
              </button>
            )}
          </div>

          {!loading && pagination.total > 0 && (
            <p className="text-xs px-1" style={{ color: 'var(--color-text-secondary)' }}>
              Showing{' '}
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{(filters.page - 1) * PAGE_SIZE + 1}–{Math.min(filters.page * PAGE_SIZE, pagination.total)}</span>
              {' '}of{' '}
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{pagination.total}</span> records
            </p>
          )}

          <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Cert No', 'Type', 'Issued To', 'Issued By', 'Date', 'Status', ''].map((h, i) => (
                    <th key={i} className={cn('px-4 py-3 text-[10px] font-black uppercase tracking-widest', i === 6 && 'text-right')}
                      style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7"><TableSkeleton rows={5} cols={7} /></td></tr>
                ) : certificates.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-16"><EmptyState icon={ScrollText} title="No Certificates Found" description="Try adjusting your filters or issue a new certificate." /></td></tr>
                ) : certificates.map(cert => {
                  const certType = templates.find(t => t.value === cert.type)
                  const isRevoked = cert.status === 'revoked'
                  return (
                    <tr key={cert.id}
                      className={cn('border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]', isRevoked && 'opacity-50')}
                      style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-white text-[9px] font-black"
                            style={{ background: certType?.gradient || '#6b7280' }}>{certType?.shortLabel || '?'}</div>
                          <span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{cert.certificate_no}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize"
                          style={{ backgroundColor: certType ? `${certType.color}12` : '#f3f4f6', color: certType?.color || '#6b7280' }}>
                          {cert.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{cert.recipient?.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          {cert.recipient_type === 'student' ? `#${cert.recipient?.admission_no}` : cert.recipient?.employee_id}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cert.issuer?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{cert.issued_date}</td>
                      <td className="px-4 py-3"><StatusPill status={cert.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <CertificateDownloadButton certType={cert.type} data={cert} fileName={`${cert.certificate_no}.pdf`} disabled={isRevoked} />
                          {!isRevoked && (
                            <button onClick={() => handleRevoke(cert.id)} title="Revoke"
                              className="flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95"
                              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                              <XCircle size={12} />Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              <button disabled={filters.page === 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)' }}><ChevronLeft size={14} /></button>
              {getPageNumbers().map((n, idx) =>
                n === '...' ? (
                  <span key={`d${idx}`} className="px-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>…</span>
                ) : (
                  <button key={n} onClick={() => setFilters(p => ({ ...p, page: n }))}
                    className="h-8 w-8 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: filters.page === n ? '#0f766e' : 'transparent', color: filters.page === n ? '#fff' : 'var(--color-text-secondary)', border: filters.page === n ? 'none' : '1px solid var(--color-border)' }}>
                    {n}
                  </button>
                )
              )}
              <button disabled={filters.page === pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)' }}><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      )}

      {/* TAB: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff' }}><Shield size={18} /></div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Branding &amp; School Info</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>These details appear on every generated certificate</p>
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={submitting} className="gap-2">
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <BadgeCheck size={14} />}Save Branding
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="School Name"          value={certSettings.school_name}    onChange={e => setCertSettings(p => ({ ...p, school_name: e.target.value }))} />
              <Input label="Principal / Signatory" value={certSettings.principal_name} onChange={e => setCertSettings(p => ({ ...p, principal_name: e.target.value }))} />
              <Input label="Contact Phone"         value={certSettings.phone}          onChange={e => setCertSettings(p => ({ ...p, phone: e.target.value }))} />
              <div className="md:col-span-2"><Input label="School Address" value={certSettings.address} onChange={e => setCertSettings(p => ({ ...p, address: e.target.value }))} /></div>
              <Input label="School Email" value={certSettings.email} onChange={e => setCertSettings(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-secondary)' }}>All Templates ({templates.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map(type => {
                const Icon = type.icon
                return (
                  <div key={type.value} className="group relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                    <div className="h-1" style={{ background: type.gradient }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: type.gradient }}><Icon size={18} /></div>
                        <button onClick={() => setEditTemplateModal({ open: true, type, label: type.label, description: type.description, color: type.color })}
                          className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/5">
                          <Settings2 size={13} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{type.label}</h4>
                      <p className="text-[11px] mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{type.description}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {['Name', 'ID', ...type.fields.map(f => f.label)].slice(0, 4).map(f => (
                          <span key={f} className="rounded-md px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>{f}</span>
                        ))}
                        {type.fields.length > 3 && (
                          <span className="rounded-md px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>+{type.fields.length - 3} more</span>
                        )}
                      </div>
                      <button onClick={() => handleOpenPreview(type)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all hover:shadow-sm active:scale-[0.98]"
                        style={{ borderColor: type.color, color: type.color, backgroundColor: `${type.color}08` }}>
                        <Eye size={13} />Preview Template
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      <Modal open={issueModal.open} onClose={() => setIssueModal({ open: false, type: null })} title="" size="lg">
        {issueModal.type && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white" style={{ background: issueModal.type.gradient }}>
                <issueModal.type.icon size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Issue {issueModal.type.label}</h2>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{issueModal.type.description}</p>
              </div>
            </div>
            <form onSubmit={handleIssueSubmit} className="space-y-5">
              {issueModal.type.recipient === 'student' && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Filter by Class</label>
                    <Select options={classes} value={modalFilters.class_id} onChange={e => setModalFilters(p => ({ ...p, class_id: e.target.value }))} placeholder="All Classes" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Filter by Section</label>
                    <Select options={sections} value={modalFilters.section_id} onChange={e => setModalFilters(p => ({ ...p, section_id: e.target.value }))} placeholder="All Sections" disabled={!modalFilters.class_id} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Select {issueModal.type.recipient === 'student' ? 'Student' : 'Staff Member'} <span className="text-red-500">*</span>
                </label>
                <Select options={recipients} value={formData.recipient_id} onChange={e => setFormData(p => ({ ...p, recipient_id: e.target.value }))} placeholder={issueModal.type.recipient === 'student' ? 'Select student...' : 'Select staff member...'} />
              </div>
              {issueModal.type.fields?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-secondary)' }}>Certificate Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {issueModal.type.fields.map(field => (
                      <div key={field.name}>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Input type={field.type} required={field.required} value={formData.extra_data[field.name] || ''}
                          onChange={e => setFormData(p => ({ ...p, extra_data: { ...p.extra_data, [field.name]: e.target.value } }))}
                          placeholder={`Enter ${field.label.toLowerCase()}...`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button type="button" onClick={() => setIssueModal({ open: false, type: null })}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-colors hover:bg-black/5"
                  style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: issueModal.type.gradient, boxShadow: `0 4px 14px ${issueModal.type.color}40` }}>
                  {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {submitting ? 'Generating...' : 'Generate Certificate'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal open={successModal.open} onClose={() => setSuccessModal({ open: false, data: null })} title="" size="sm">
        <div className="flex flex-col items-center text-center p-2">
          <div className="relative mb-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <CheckCircle size={36} className="text-white" />
            </div>
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400">
              <Sparkles size={14} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-black mb-1" style={{ color: 'var(--color-text-primary)' }}>Certificate Generated!</h3>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>Successfully issued certificate</p>
          <code className="text-sm font-mono font-bold px-3 py-1 rounded-lg mb-6" style={{ backgroundColor: 'var(--color-surface-raised)', color: '#0f766e' }}>
            {successModal.data?.certificate_no}
          </code>
          <div className="w-full space-y-2">
            <CertificateDownloadButton certType={successModal.data?.type} data={successModal.data} fileName={`${successModal.data?.certificate_no}.pdf`} />
            <Button variant="outline" fullWidth onClick={() => setSuccessModal({ open: false, data: null })}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirm */}
      <ConfirmDialog open={revokeModal.open} onClose={() => setRevokeModal({ open: false, id: null })} onConfirm={confirmRevoke}
        title="Revoke Certificate"
        description="This will permanently mark the certificate as Revoked. The record is kept for audit purposes but downloads will be disabled. This action cannot be undone."
        confirmLabel="Yes, Revoke Certificate" variant="danger" icon={AlertTriangle} />

      {/* Preview Modal */}
      <Modal open={templatePreview.open} onClose={() => setTemplatePreview({ open: false, type: null })} title={`Preview: ${templatePreview.type?.label}`} size="lg">
        <div className="flex flex-col gap-4">
          <div className="w-full h-[560px] border rounded-2xl overflow-hidden shadow-inner relative" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            {previewLoading ? <PreviewSkeleton /> : templatePreview.type && (
              <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                {getCertificateComponent(templatePreview.type.value, { status: 'active' }, certSettings)}
              </PDFViewer>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Live preview using sample data</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTemplatePreview({ open: false, type: null })}>Close</Button>
              <CertificateDownloadButton certType={templatePreview.type?.value}
                data={{ ...SAMPLE_DATA, type: templatePreview.type?.value, school: { ...SAMPLE_DATA.school, name: certSettings.school_name, principal_name: certSettings.principal_name, address: certSettings.address, phone: certSettings.phone, email: certSettings.email } }}
                fileName={`sample-${templatePreview.type?.value}-certificate.pdf`} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Template Modal */}
      <Modal open={editTemplateModal.open} onClose={() => setEditTemplateModal({ open: false, type: null, label: '', description: '', color: '' })} title="Edit Template" size="sm">
        <form onSubmit={handleEditTemplate} className="space-y-4">
          <Input label="Display Label" required value={editTemplateModal.label} onChange={e => setEditTemplateModal(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Transfer Certificate (TC)" />
          <Input label="Description" required value={editTemplateModal.description} onChange={e => setEditTemplateModal(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Branding Colour (HEX)</label>
            <div className="flex items-center gap-3">
              <Input required value={editTemplateModal.color} onChange={e => setEditTemplateModal(p => ({ ...p, color: e.target.value }))} placeholder="#000000" />
              <div className="h-10 w-10 flex-shrink-0 rounded-xl border shadow-sm" style={{ backgroundColor: editTemplateModal.color, borderColor: 'var(--color-border)' }} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button type="button" onClick={() => setEditTemplateModal({ open: false, type: null, label: '', description: '', color: '' })}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-colors hover:bg-black/5" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <Button type="submit">Update Template</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CertificatesPage
