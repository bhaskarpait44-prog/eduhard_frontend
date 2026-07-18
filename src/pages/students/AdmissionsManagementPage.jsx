import { useState, useEffect, useCallback } from 'react'
import { 
  ClipboardList, Search, Filter, Eye, CheckCircle, XCircle, 
  Calendar, User, BookOpen, GraduationCap, ArrowRight,
  Info, AlertTriangle, Loader2, Mail
} from 'lucide-react'
import api from '@/api/axios'
import { getApplications, updateApplicationStatus } from '@/api/applicationsApi'
import { getClasses } from '@/api/classApi'
import PageHeader from '@/components/ui/PageHeader'
import DataTable from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/helpers'

const AdmissionsManagementPage = () => {
  const { toastSuccess, toastError } = useToast()
  const [applications, setApplications] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [admissionOpen, setAdmissionOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    class_id: '',
    page: 1,
    perPage: 10
  })

  // Modal Visibility States
  const [detailModal, setDetailModal] = useState(false)
  const [approvalModal, setApprovalModal] = useState(false)
  const [admitModal, setAdmitModal] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  // Data States
  const [selectedApp, setSelectedApp] = useState(null)
  const [approving, setApproving] = useState(false)
  const [admitting, setAdmitting] = useState(false)
  const [admissionData, setAdmissionData] = useState({
    admission_no: '',
    section_id: '',
    roll_number: ''
  })
  const [emailData, setEmailData] = useState({ subject: '', message: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getApplications(filters)
      setApplications(res.data.applications)
      setMeta(res.data.meta)
    } catch (err) {
      toastError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [filters, toastError])

  const fetchSections = async (classId) => {
    if (!classId) return
    setLoadingSections(true)
    try {
      const res = await api.get(`/classes/${classId}/sections`)
      setSections(res.data || [])
    } catch (err) {
      toastError('Failed to load sections for this class')
    } finally {
      setLoadingSections(false)
    }
  }

  const fetchAdmissionStatus = async () => {
    try {
      const res = await api.get('/settings')
      setAdmissionOpen(!!res.data.data.online_admission_open)
    } catch (e) { /* ignore */ }
  }

  const handleToggleAdmission = async () => {
    setToggling(true)
    try {
      const next = !admissionOpen
      await api.put('/settings', { online_admission_open: next })
      setAdmissionOpen(next)
      toastSuccess(`Online admission portal ${next ? 'OPENED' : 'CLOSED'}`)
    } catch (err) {
      toastError('Failed to update admission status')
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  useEffect(() => {
    getClasses().then(res => setClasses(res.data.classes))
    fetchAdmissionStatus()
  }, [])

  const handleShowDetails = (app) => {
    setSelectedApp(app)
    setDetailModal(true)
  }

  const handleStartEmail = (app) => {
    setSelectedApp(app)
    setDetailModal(false)
    setEmailModal(true)
  }

  const handleApproveOnly = (app) => {
    setSelectedApp(app)
    setDetailModal(false)
    setApprovalModal(true)
  }

  const handleStartAdmission = (app) => {
    setSelectedApp(app)
    setDetailModal(false)
    
    // Fetch next sequential admission number from server
    setAdmissionData({ admission_no: 'Loading...', section_id: '', roll_number: '' })
    api.get('/applications/next-admission-no')
      .then(res => setAdmissionData(prev => ({ ...prev, admission_no: res.data.next_admission_no })))
      .catch(() => {
        setAdmissionData(prev => ({ ...prev, admission_no: `ADM-${new Date().getFullYear()}-XXXX` }))
        toastError('Failed to fetch next admission number')
      })

    fetchSections(app.class_id)
    setAdmitModal(true)
  }

  const handleStartRejection = (app) => {
    setSelectedApp(app)
    setDetailModal(false)
    setRejectionReason('')
    setRejectModal(true)
  }

  const onRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectionReason.trim()) return toastError('Please provide a reason')
    
    setRejecting(true)
    try {
      await updateApplicationStatus(selectedApp.id, { 
        status: 'rejected',
        remarks: rejectionReason 
      })
      toastSuccess('Application rejected and notification sent.')
      setRejectModal(false)
      setSelectedApp(null)
      fetchApplications()
    } catch (err) {
      toastError(err.response?.data?.message || 'Rejection failed')
    } finally {
      setRejecting(false)
    }
  }

  const onApproveSubmit = async (e) => {
    e.preventDefault()
    setApproving(true)
    try {
      await updateApplicationStatus(selectedApp.id, {
        status: 'approved',
        remarks: 'Application Approved'
      })
      toastSuccess('Application approved! Applicant has been notified to visit the school.')
      setApprovalModal(false)
      setSelectedApp(null)
      fetchApplications()
    } catch (err) {
      toastError(err.response?.data?.message || 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  const onAdmitSubmit = async (e, override = false) => {
    if (e) e.preventDefault()
    setAdmitting(true)
    try {
      const payload = override ? { ...admissionData, override_capacity: true } : admissionData
      await api.post(`/applications/${selectedApp.id}/admit`, payload)
      toastSuccess('Student admitted successfully!')
      setAdmitModal(false)
      setSelectedApp(null)
      fetchApplications()
    } catch (err) {
      const isCapacityWarning = err.response?.data?.errors?.[0]?.capacityWarning
      if (isCapacityWarning) {
        const confirmOverride = window.confirm(
          `${err.response?.data?.message || 'Section is at full capacity.'}\n\nDo you want to override and admit anyway?`
        )
        if (confirmOverride) {
          // Re-trigger submission with override_capacity set to true
          onAdmitSubmit(null, true)
          return
        }
      } else {
        toastError(err.response?.data?.message || 'Admission failed')
      }
    } finally {
      setAdmitting(false)
    }
  }

  const handleSendEmail = async (e) => {
    e.preventDefault()
    setSendingEmail(true)
    try {
      await api.post(`/applications/${selectedApp.id}/email`, emailData)
      toastSuccess('Email sent to applicant!')
      setEmailModal(false)
      setSelectedApp(null)
      setEmailData({ subject: '', message: '' })
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const columns = [
    {
      header: 'Reference',
      accessor: 'reference_no',
      render: (val) => <span className="font-mono text-xs font-bold text-primary">{val}</span>
    },
    {
      header: 'Student Name',
      accessor: 'student_data',
      render: (data) => (
        <div className="flex flex-col">
          <span className="font-medium text-text-primary">{data.first_name} {data.last_name}</span>
          <span className="text-xs text-text-muted">{data.email}</span>
        </div>
      )
    },
    {
      header: 'Applying For',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.class_name}</span>
          <span className="text-xs text-text-muted">{row.session_name}</span>
        </div>
      )
    },
    {
      header: 'Date Applied',
      accessor: 'created_at',
      render: (val) => <span className="text-sm text-text-secondary">{formatDate(val)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant={
          val === 'pending' ? 'warning' : 
          val === 'approved' ? 'primary' : 
          val === 'admitted' ? 'success' : 'danger'
        }>
          {val.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="xs" 
            icon={Mail} 
            onClick={() => handleStartEmail(row)}
            title="Send Email"
          />
          {row.status === 'pending' && (
            <>
              <Button 
                variant="primary" 
                size="xs" 
                icon={CheckCircle}
                onClick={() => handleApproveOnly(row)}
              >
                Approve
              </Button>
              <Button 
                variant="danger" 
                size="xs" 
                icon={XCircle}
                onClick={() => handleStartRejection(row)}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'approved' && (
            <Button 
              variant="success" 
              size="xs" 
              icon={GraduationCap}
              onClick={() => handleStartAdmission(row)}
            >
              Admit
            </Button>
          )}
          <Button variant="ghost" size="xs" icon={Eye} onClick={() => handleShowDetails(row)}>
            Details
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Admission Applications" 
          subtitle="Manage public online applications"
          icon={ClipboardList}
          className="flex-1"
        />
        
        <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Portal Status</span>
            <span className={`text-xs font-bold ${admissionOpen ? 'text-success' : 'text-danger'}`}>
              {admissionOpen ? 'OPEN FOR PUBLIC' : 'CLOSED TO PUBLIC'}
            </span>
          </div>
          <button
            onClick={handleToggleAdmission}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${admissionOpen ? 'bg-success' : 'bg-slate-200'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${admissionOpen ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative col-span-1">
          <Input 
            placeholder="Search ref, name, email..." 
            icon={Search}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>
        <Select 
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Admitted', value: 'admitted' },
            { label: 'Rejected', value: 'rejected' },
          ]}
        />
        <Select 
          placeholder="All Classes"
          value={filters.class_id}
          onChange={(e) => setFilters(f => ({ ...f, class_id: e.target.value, page: 1 }))}
          options={classes.map(c => {
            const streamPart = c.stream && c.stream !== 'regular'
              ? ` (${c.stream.charAt(0).toUpperCase() + c.stream.slice(1)})`
              : ''
            return { value: c.id, label: `${c.display_name || c.name}${streamPart}` }
          })}
        />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => setFilters({ status: 'pending', search: '', class_id: '', page: 1, perPage: 10 })}>
            Reset
          </Button>
          {meta.total > 0 && (
            <div className="text-[10px] font-black uppercase text-text-muted bg-surface-raised px-2 py-1 rounded-lg border border-border">
              {meta.total} Records
            </div>
          )}
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={applications}
        loading={loading}
        pagination={{
          currentPage: meta.page,
          totalPages: meta.totalPages,
          total: meta.total, // Added total
          onPageChange: (p) => setFilters(f => ({ ...f, page: p }))
        }}
        emptyMessage="No applications found matching your filters."
      />

      {/* Detail Modal */}
      <Modal 
        open={detailModal} 
        onClose={() => { setDetailModal(false); setSelectedApp(null); }}
        title="Application Details"
        size="lg"
      >
        {selectedApp && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between p-4 bg-surface-alt rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    {selectedApp.student_data.first_name} {selectedApp.student_data.last_name}
                  </h3>
                  <span className="text-sm text-text-muted">Ref: {selectedApp.reference_no}</span>
                </div>
              </div>
              <Badge variant={
                selectedApp.status === 'pending' ? 'warning' : 
                selectedApp.status === 'approved' ? 'primary' : 
                selectedApp.status === 'admitted' ? 'success' : 'danger'
              }>
                {selectedApp.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Student Identity" icon={User}>
                <InfoRow label="Gender" value={selectedApp.student_data.gender} />
                <InfoRow label="Date of Birth" value={selectedApp.student_data.date_of_birth} />
                <InfoRow label="Aadhar No" value={selectedApp.student_data.aadhar_no} />
                <InfoRow label="Nationality" value={selectedApp.student_data.nationality} />
                <InfoRow label="Religion" value={selectedApp.student_data.religion} />
                <InfoRow label="Caste" value={selectedApp.student_data.caste} />
                <InfoRow label="Mother Tongue" value={selectedApp.student_data.mother_tongue} />
                <InfoRow label="Blood Group" value={selectedApp.student_data.blood_group} />
                <InfoRow label="Stream" value={selectedApp.student_data.stream} />
                <InfoRow label="Medium" value={selectedApp.student_data.medium} />
                <InfoRow label="Hostel" value={selectedApp.student_data.is_hostel} />
                <InfoRow label="Distance" value={`${selectedApp.student_data.distance_km} km`} />
                <InfoRow label="PEN No" value={selectedApp.student_data.pen_no} />
                <InfoRow label="APAAR ID" value={selectedApp.student_data.apaar_id} />
                <InfoRow label="ID Marks" value={selectedApp.student_data.identification_marks} colSpan="col-span-2" />
              </Section>

              <Section title="Applying For" icon={GraduationCap}>
                <InfoRow label="Class" value={selectedApp.class_name} />
                <InfoRow label="Session" value={selectedApp.session_name} />
                <InfoRow label="Type" value={selectedApp.student_data.joining_type} />
              </Section>

              <Section title="Contact & Address" icon={Info}>
                <InfoRow label="Email" value={selectedApp.student_data.email} colSpan="col-span-2" />
                <InfoRow label="Phone" value={selectedApp.student_data.phone} />
                <InfoRow label="WhatsApp" value={selectedApp.student_data.whatsapp_no} />
                <InfoRow label="Village" value={selectedApp.student_data.address} colSpan="col-span-2" />
                <InfoRow label="P.S." value={selectedApp.student_data.police_station} />
                <InfoRow label="P.O." value={selectedApp.student_data.post_office} />
                <InfoRow label="District" value={selectedApp.student_data.district} />
                <InfoRow label="State" value={selectedApp.student_data.state} />
                <InfoRow label="PIN" value={selectedApp.student_data.pincode} />
              </Section>

              <Section title="Family Details" icon={UsersIcon}>
                <InfoRow label="Mother" value={selectedApp.student_data.mother_name} />
                <InfoRow label="M-Qual" value={selectedApp.student_data.mother_qualification} />
                <InfoRow label="M-Phone" value={selectedApp.student_data.mother_phone} />
                <InfoRow label="Father" value={selectedApp.student_data.father_name} />
                <InfoRow label="F-Qual" value={selectedApp.student_data.father_qualification} />
                <InfoRow label="F-Phone" value={selectedApp.student_data.father_phone} />
                <InfoRow label="F-Aadhar" value={selectedApp.student_data.father_aadhar} />
                <InfoRow label="Guardian" value={selectedApp.student_data.guardian_name} />
                <InfoRow label="G-Rel" value={selectedApp.student_data.guardian_relation} />
                <InfoRow label="G-Phone" value={selectedApp.student_data.guardian_phone} />
                <InfoRow label="Annual Income" value={selectedApp.student_data.father_annual_income} />
              </Section>

              <Section title="Previous Education" icon={BookOpen}>
                <InfoRow label="School" value={selectedApp.student_data.prev_school_name} colSpan="col-span-2" />
                <InfoRow label="Last Class" value={selectedApp.student_data.prev_class} />
                <InfoRow label="Prev Attendance" value={selectedApp.student_data.prev_attendance_days} />
              </Section>

              {selectedApp.student_data.documents && (
                <Section title="Documents" icon={ClipboardList}>
                  {Object.entries(selectedApp.student_data.documents).map(([key, path]) => (
                    <div key={key} className="col-span-2 flex items-center justify-between p-2 bg-surface rounded-lg border border-border">
                      <span className="text-xs font-bold text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                      <a 
                        href={`/api/applications/${selectedApp.id}/documents/${key}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        View <ArrowRight size={12} />
                      </a>
                    </div>
                  ))}
                </Section>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="ghost" icon={Mail} onClick={() => handleStartEmail(selectedApp)}>Message</Button>
              {selectedApp.status === 'pending' && (
                <>
                  <Button variant="danger" onClick={() => handleStartRejection(selectedApp)}>Reject</Button>
                  <Button variant="primary" onClick={() => handleApproveOnly(selectedApp)}>Approve Application</Button>
                </>
              )}
              {selectedApp.status === 'approved' && (
                <Button variant="success" onClick={() => handleStartAdmission(selectedApp)}>Finalize Admission</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        open={emailModal}
        onClose={() => { setEmailModal(false); setSelectedApp(null); }}
        title="Send Email to Applicant"
        size="md"
      >
        <form onSubmit={handleSendEmail} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              To: <span className="font-bold">{selectedApp?.student_data.first_name} {selectedApp?.student_data.last_name}</span> ({selectedApp?.student_data.email})
            </p>
            <Input 
              label="Subject"
              required
              value={emailData.subject}
              onChange={(e) => setEmailData(d => ({ ...d, subject: e.target.value }))}
              placeholder="e.g. Interview Schedule"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Message</label>
              <textarea 
                className="w-full p-4 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-[150px] text-sm"
                required
                value={emailData.message}
                onChange={(e) => setEmailData(d => ({ ...d, message: e.target.value }))}
                placeholder="Type your message here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setEmailModal(false); setSelectedApp(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" loading={sendingEmail} icon={Mail}>
              Send Email
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approval Modal */}
      <Modal
        open={approvalModal}
        onClose={() => { setApprovalModal(false); setSelectedApp(null); }}
        title="Approve Application"
        size="md"
      >
        <form onSubmit={onApproveSubmit} className="flex flex-col gap-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <Info className="text-blue-500 mt-0.5" size={20} />
            <p className="text-sm text-blue-800 leading-relaxed">
              Are you sure you want to approve this application? The applicant will be notified via email to visit the school for document verification and final admission.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setApprovalModal(false); setSelectedApp(null); }} disabled={approving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={approving} icon={CheckCircle}>
              Confirm Approval
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admission Modal */}
      <Modal
        open={admitModal}
        onClose={() => { setAdmitModal(false); setSelectedApp(null); }}
        title="Finalize Admission"
        size="md"
      >
        <form onSubmit={onAdmitSubmit} className="flex flex-col gap-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <GraduationCap className="text-emerald-500 mt-0.5" size={20} />
            <p className="text-sm text-emerald-800 leading-relaxed">
              Student has arrived at the school. Proceed to create the official student record and enrollment.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Input 
              label="Admission Number"
              required
              value={admissionData.admission_no}
              onChange={(e) => setAdmissionData(d => ({ ...d, admission_no: e.target.value }))}
              placeholder="e.g. ADM-2024-0001"
            />

            <Select 
              label="Assign Section"
              required
              value={admissionData.section_id}
              onChange={(e) => setAdmissionData(d => ({ ...d, section_id: e.target.value }))}
              options={sections.map(s => ({
                label: `${s.name} (${s.enrolled_count}/${s.capacity})`,
                value: s.id
              }))}
              placeholder={loadingSections ? 'Loading sections...' : 'Select section'}
              disabled={loadingSections}
            />

            <Input 
              label="Roll Number (Optional)"
              value={admissionData.roll_number}
              onChange={(e) => setAdmissionData(d => ({ ...d, roll_number: e.target.value }))}
              placeholder="Leave blank for auto-assign"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setAdmitModal(false); setSelectedApp(null); }} disabled={admitting}>Cancel</Button>
            <Button type="submit" variant="success" loading={admitting} icon={CheckCircle}>
              Admit Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={rejectModal}
        onClose={() => { setRejectModal(false); setSelectedApp(null); }}
        title="Reject Application"
        size="md"
      >
        <form onSubmit={onRejectSubmit} className="flex flex-col gap-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <XCircle className="text-red-500 mt-0.5" size={20} />
            <p className="text-sm text-red-800 leading-relaxed">
              Are you sure you want to reject this application? This will notify the applicant and they will no longer be able to track it as pending.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Reason for Rejection <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full p-4 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[120px] text-sm"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete documentation, Seat unavailable, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => { setRejectModal(false); setSelectedApp(null); }} disabled={rejecting}>Cancel</Button>
            <Button type="submit" variant="danger" loading={rejecting} icon={XCircle}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const Section = ({ title, icon: Icon, children }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={16} className="text-primary" />
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">{title}</h4>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {children}
    </div>
  </div>
)

const InfoRow = ({ label, value, colSpan = 'col-span-1' }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{label}</span>
    <span className="text-sm font-medium text-text-primary truncate">{value || '--'}</span>
  </div>
)

const UsersIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export default AdmissionsManagementPage
