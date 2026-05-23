// src/pages/admin/CertificatesPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  Award, Download, Eye, Plus, FileText, Shield, 
  ArrowRightLeft, BookOpen, Trophy, GraduationCap, 
  Briefcase, RefreshCw, XCircle, Search, Filter, CheckCircle
} from 'lucide-react'
import { certificateApi, studentsApi, adminTeacherControlApi, classApi } from '@/api'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { cn } from '@/utils/helpers'
import CertificateDownloadButton from '@/components/pdf/certificates/CertificateDownloadButton'

const CERTIFICATE_TYPES = [
  {
    value: 'transfer',
    label: 'Transfer Certificate (TC)',
    icon: ArrowRightLeft,
    description: 'Issued when a student leaves or transfers to another school.',
    recipient: 'student',
    color: '#f59e0b',
    fields: [
      { name: 'leaving_date', label: 'Leaving Date', type: 'date', required: true },
      { name: 'reason', label: 'Reason for Leaving', type: 'text', required: true },
      { name: 'last_class', label: 'Last Class Studied', type: 'text', required: true },
      { name: 'conduct', label: 'General Conduct', type: 'text', defaultValue: 'Good' },
    ],
  },
  {
    value: 'bonafide',
    label: 'Bonafide Certificate',
    icon: Shield,
    description: 'Confirms current enrollment for scholarships, banks, visa, etc.',
    recipient: 'student',
    color: '#3b82f6',
    fields: [
      { name: 'purpose', label: 'Purpose', type: 'text', required: true },
    ],
  },
  {
    value: 'character',
    label: 'Character Certificate',
    icon: Award,
    description: "Certifies the student's conduct and moral character.",
    recipient: 'student',
    color: '#8b5cf6',
    fields: [
      { name: 'conduct_grade', label: 'Conduct Grade', type: 'text', required: true },
      { name: 'remarks', label: 'Remarks', type: 'text' },
    ],
  },
  {
    value: 'migration',
    label: 'Migration Certificate',
    icon: BookOpen,
    description: 'Required when a student moves between education boards.',
    recipient: 'student',
    color: '#06b6d4',
    fields: [
      { name: 'from_board', label: 'From Board', type: 'text', required: true },
      { name: 'to_board', label: 'To Board', type: 'text', required: true },
      { name: 'last_exam_year', label: 'Last Exam Year', type: 'text', required: true },
    ],
  },
  {
    value: 'marksheet',
    label: 'Mark Sheet / Result Certificate',
    icon: FileText,
    description: 'Official record of examination marks or grades.',
    recipient: 'student',
    color: '#10b981',
    fields: [
      { name: 'exam_name', label: 'Examination Name', type: 'text', required: true },
      { name: 'session', label: 'Academic Session', type: 'text', required: true },
    ],
  },
  {
    value: 'sports',
    label: 'Sports / Achievement Certificate',
    icon: Trophy,
    description: 'Awarded for sports or co-curricular achievements.',
    recipient: 'student',
    color: '#f97316',
    fields: [
      { name: 'achievement', label: 'Achievement Level', type: 'text', required: true },
      { name: 'event_name', label: 'Event Name', type: 'text', required: true },
      { name: 'event_date', label: 'Event Date', type: 'date', required: true },
      { name: 'position', label: 'Position Secured', type: 'text' },
    ],
  },
  {
    value: 'study',
    label: 'Study Certificate',
    icon: GraduationCap,
    description: 'Confirms study details for scholarships or government schemes.',
    recipient: 'student',
    color: '#ec4899',
    fields: [
      { name: 'scheme_name', label: 'Scheme Name', type: 'text', required: true },
      { name: 'class', label: 'Studying in Class', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'text', required: true },
    ],
  },
  {
    value: 'experience',
    label: 'Experience / Service Certificate',
    icon: Briefcase,
    description: 'Issued to staff or teachers leaving the school.',
    recipient: 'staff',
    color: '#64748b',
    fields: [
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'join_date', label: 'Date of Joining', type: 'date', required: true },
      { name: 'leaving_date', label: 'Date of Leaving', type: 'date', required: true },
      { name: 'reason', label: 'Reason for Leaving', type: 'text' },
    ],
  },
]

const SAMPLE_DATA = {
  school: {
    name: 'Demo School',
    address: '123 School Lane, City - 123456',
    phone: '+91 98765 43210',
    email: 'school@demo.com',
    logo_url: null,
    principal_name: 'Mr. Principal Name'
  },
  recipient: {
    name: 'Sample Student / Staff',
    father_name: 'Sample Father Name',
    admission_no: 'ADM-2024-001',
    class_name: 'Class X - A',
    employee_id: 'EMP-001',
    designation: 'Teacher'
  },
  certificate_no: 'TC-2026-0001',
  issued_date: '23 May 2026',
  extra_data: {
    leaving_date: '2026-05-23', reason: 'Transfer', last_class: 'X', conduct: 'Good',
    purpose: 'Bank Account Opening',
    conduct_grade: 'Excellent', remarks: 'A sincere and hardworking student.',
    from_board: 'CBSE', to_board: 'SEBA', last_exam_year: '2025',
    exam_name: 'Annual Examination 2026', session: '2025-2026',
    achievement: 'Gold Medal', event_name: 'District Sports Meet', event_date: '2026-03-15', position: '1st',
    scheme_name: 'Post Matric Scholarship', class: 'XI', year: '2026',
    designation: 'PGT Physics', join_date: '2020-06-01', leaving_date: '2026-05-23',
  }
}

const CertificatesPage = () => {
  usePageTitle('Certificates')
  const { toastSuccess, toastError } = useToast()
  const toastErrorRef = useRef(toastError)
  useEffect(() => { toastErrorRef.current = toastError }, [toastError])

  const [activeTab, setActiveTab] = useState('issue')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ type: '', status: '', search: '', page: 1 })
  const [searchInput, setSearchInput] = useState('')

  // Modal State
  const [issueModal, setIssueModal] = useState({ open: false, type: null })
  const [successModal, setSuccessModal] = useState({ open: false, data: null })
  const [templatePreview, setTemplatePreview] = useState({ open: false, type: null })
  const [formData, setFormData] = useState({ recipient_id: '', extra_data: {} })
  const [recipients, setRecipients] = useState([])
  
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [modalFilters, setModalFilters] = useState({ class_id: '', section_id: '' })

  const loadCertificates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await certificateApi.getCertificates(filters)
      setCertificates(res.data.certificates)
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total
      })
    } catch (err) {
      toastErrorRef.current('Failed to load certificates.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(p => ({ ...p, search: searchInput, page: 1 }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (activeTab === 'register') {
      loadCertificates()
    }
  }, [activeTab, loadCertificates])

  useEffect(() => {
    classApi.getClasses().then(res => setClasses(classApi.getClassOptions(res))).catch(console.error)
  }, [])

  useEffect(() => {
    if (modalFilters.class_id) {
      classApi.getSections(modalFilters.class_id).then(res => {
        const data = res.data?.sections || res.data || []
        setSections(data.map(s => ({ value: String(s.id), label: s.name })))
      }).catch(console.error)
    } else {
      setSections([])
    }
    setModalFilters(p => ({ ...p, section_id: '' }))
  }, [modalFilters.class_id])

  const fetchRecipients = useCallback(async (type, query, class_id, section_id) => {
    try {
      if (type === 'student') {
        const res = await studentsApi.getStudents({ 
          search: query, 
          class_id: class_id || undefined,
          section_id: section_id || undefined,
          perPage: 100 
        })
        const data = res.data?.students || res.data?.data || []
        setRecipients(data.map(s => ({
          value: String(s.id),
          label: `${s.first_name} ${s.last_name} (${s.admission_no})`,
          sub: `Class: ${s.enrollments?.[0]?.class?.name || 'N/A'}`
        })))
      } else {
        const res = await adminTeacherControlApi.getTeacherControlTeachers()
        const data = res.data?.teachers || res.data || []
        setRecipients(data.map(t => ({
          value: String(t.id),
          label: `${t.first_name} ${t.last_name} (${t.employee_id || 'Staff'})`,
          sub: t.designation || 'Teacher'
        })))
      }
    } catch (err) {
      console.error('Failed to fetch recipients', err)
    }
  }, [])

  useEffect(() => {
    if (issueModal.open && issueModal.type) {
      fetchRecipients(
        issueModal.type.recipient, 
        '', 
        modalFilters.class_id, 
        modalFilters.section_id
      )
    }
  }, [issueModal.open, issueModal.type, modalFilters, fetchRecipients])

  const handleOpenIssueModal = (certType) => {
    setModalFilters({ class_id: '', section_id: '' })
    setFormData({ recipient_id: '', extra_data: {} })
    setIssueModal({ open: true, type: certType })
  }

  const handleIssueSubmit = async (e) => {
    e.preventDefault()
    if (!formData.recipient_id) return toastError('Please select a recipient.')

    setSubmitting(true)
    try {
      const payload = {
        type: issueModal.type.value,
        recipient_type: issueModal.type.recipient,
        extra_data: formData.extra_data,
        [issueModal.type.recipient === 'student' ? 'student_id' : 'teacher_id']: formData.recipient_id
      }
      
      const res = await certificateApi.generateCertificate(payload)
      toastSuccess('Certificate generated successfully!')
      setIssueModal({ open: false, type: null })
      
      if (res.data.certificate) {
        setSuccessModal({ open: true, data: res.data.certificate })
      }

      if (activeTab === 'register') loadCertificates()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to generate certificate.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) return
    try {
      await certificateApi.revokeCertificate(id)
      toastSuccess('Certificate revoked.')
      loadCertificates()
    } catch (err) {
      toastError('Failed to revoke certificate.')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'revoked': return <Badge variant="danger">Revoked</Badge>
      default: return <Badge variant="warning">{status}</Badge>
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Certificate Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Issue, track and manage official school certificates.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
        {['issue', 'register', 'templates'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize",
              activeTab === tab 
                ? "shadow-sm" 
                : "hover:opacity-75"
            )}
            style={{
              backgroundColor: activeTab === tab ? 'var(--color-surface-card)' : 'transparent',
              color: activeTab === tab ? 'var(--color-brand)' : 'var(--color-text-muted)'
            }}
          >
            {tab === 'issue' ? 'Issue New' : tab === 'register' ? 'Issued Register' : 'Templates'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CERTIFICATE_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <div 
                key={type.value}
                onClick={() => handleOpenIssueModal(type)}
                className="group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border-subtle)'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${type.color}15`, color: type.color }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {type.label}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  {type.description}
                </p>
                <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-wider" style={{ color: type.color }}>
                  <span>Issue Now</span>
                  <Plus size={14} className="ml-1" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex-1 min-w-[200px]">
              <Input 
                placeholder="Search by Certificate No or Name..." 
                icon={Search}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select 
                placeholder="All Types"
                options={[{ label: 'All Types', value: '' }, ...CERTIFICATE_TYPES.map(t => ({ label: t.label, value: t.value }))]}
                value={filters.type}
                onChange={(e) => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))}
              />
            </div>
            <div className="w-40">
              <Select 
                placeholder="Status"
                options={[
                  { label: 'All Status', value: '' },
                  { label: 'Active', value: 'active' },
                  { label: 'Revoked', value: 'revoked' },
                ]}
                value={filters.status}
                onChange={(e) => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border-subtle)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Cert No</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Type</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Issued To</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Issue Date</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--color-border-subtle)' }}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-brand)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10">
                      <EmptyState 
                        icon={Award}
                        title="No Certificates Found"
                        description="Try adjusting your filters or issue a new certificate."
                      />
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm">{cert.certificate_no}</td>
                      <td className="px-4 py-3 text-sm capitalize">{cert.type.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {cert.recipient?.name}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {cert.recipient_type === 'student' ? `Roll: ${cert.recipient?.admission_no}` : cert.recipient?.employee_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{format(new Date(cert.issued_date + 'T00:00:00'), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3">{getStatusBadge(cert.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CertificateDownloadButton 
                            certType={cert.type}
                            data={cert}
                            fileName={`${cert.certificate_no}.pdf`}
                          />
                          {cert.status === 'active' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Revoke Certificate"
                              onClick={() => handleRevoke(cert.id)}
                            >
                              <XCircle size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Showing {(filters.page - 1) * 20 + 1} to {Math.min(filters.page * 20, pagination.total)} of {pagination.total} records
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={filters.page === 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFilters(p => ({ ...p, page: i + 1 }))}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                        filters.page === i + 1 ? "bg-brand text-white" : "hover:bg-black/5"
                      )}
                      style={{
                        backgroundColor: filters.page === i + 1 ? 'var(--color-brand)' : 'transparent',
                        color: filters.page === i + 1 ? '#fff' : 'var(--color-text-muted)'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={filters.page === pagination.pages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CERTIFICATE_TYPES.map((type) => (
            <div key={type.value} className="p-6 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${type.color}15`, color: type.color }}
                >
                  <type.icon size={20} />
                </div>
                <Badge variant="outline">Standard Template</Badge>
              </div>
              <h4 className="font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{type.label}</h4>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{type.description}</p>
              
              <div className="space-y-3 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Fields Included:</p>
                <div className="flex flex-wrap gap-2">
                  {['Name', 'ID', 'School Name', ...type.fields.map(f => f.label)].map(field => (
                    <span key={field} className="px-2 py-1 rounded-md text-[10px] bg-black/5" style={{ color: 'var(--color-text-muted)' }}>
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                variant="outline" size="sm" fullWidth className="gap-2"
                onClick={() => setTemplatePreview({ open: true, type })}
              >
                <Eye size={14} />
                Preview Template
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Issue Modal */}
      <Modal
        open={issueModal.open}
        onClose={() => setIssueModal({ open: false, type: null })}
        title={`Issue ${issueModal.type?.label}`}
        size="lg"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issueModal.type?.recipient === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Filter by Class
                  </label>
                  <Select 
                    options={classes}
                    value={modalFilters.class_id}
                    onChange={(e) => setModalFilters(p => ({ ...p, class_id: e.target.value }))}
                    placeholder="All Classes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Filter by Section
                  </label>
                  <Select 
                    options={sections}
                    value={modalFilters.section_id}
                    onChange={(e) => setModalFilters(p => ({ ...p, section_id: e.target.value }))}
                    placeholder="All Sections"
                    disabled={!modalFilters.class_id}
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Select {issueModal.type?.recipient === 'student' ? 'Student' : 'Staff'} <span className="text-red-500">*</span>
              </label>
              <Select 
                options={recipients}
                value={formData.recipient_id}
                onChange={(e) => setFormData(p => ({ ...p, recipient_id: e.target.value }))}
                placeholder={issueModal.type?.recipient === 'student' ? "Select Student..." : "Select Staff..."}
              />
            </div>

            {issueModal.type?.fields?.map((field) => (
              <div key={field.name} className={cn(field.type === 'textarea' ? "col-span-2" : "")}>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input 
                  type={field.type}
                  required={field.required}
                  value={formData.extra_data[field.name] || ''}
                  onChange={(e) => setFormData(p => ({ 
                    ...p, 
                    extra_data: { ...p.extra_data, [field.name]: e.target.value } 
                  }))}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <button 
              type="button" 
              onClick={() => setIssueModal({ open: false, type: null })}
              className="px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-black/5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={18} />}
              {submitting ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, data: null })}
        title="Certificate Generated"
        size="sm"
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">Success!</h3>
          <p className="text-sm text-gray-500 mb-6">
            Certificate <span className="font-mono font-bold text-gray-900">{successModal.data?.certificate_no}</span> has been generated successfully.
          </p>
          
          <div className="w-full space-y-3">
            <div className="flex justify-center">
              <CertificateDownloadButton 
                certType={successModal.data?.type}
                data={successModal.data}
                fileName={`${successModal.data?.certificate_no}.pdf`}
              />
            </div>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setSuccessModal({ open: false, data: null })}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={templatePreview.open}
        onClose={() => setTemplatePreview({ open: false, type: null })}
        title={`Preview: ${templatePreview.type?.label}`}
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 p-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${templatePreview.type?.color}15`, color: templatePreview.type?.color }}
          >
            {templatePreview.type && <templatePreview.type.icon size={32} />}
          </div>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
            This is a sample preview using placeholder data. The actual certificate will contain real student/staff information.
          </p>
          <div className="w-full pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <CertificateDownloadButton
              certType={templatePreview.type?.value}
              data={{ ...SAMPLE_DATA, type: templatePreview.type?.value }}
              fileName={`sample-${templatePreview.type?.value}-certificate.pdf`}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CertificatesPage
