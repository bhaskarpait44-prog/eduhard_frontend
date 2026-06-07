import { useEffect, useMemo, useState } from 'react'
import { Pencil, Clock, KeyRound, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import useAdminStudentStore from '@/store/studentStore'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const formatStream = (stream) => {
  if (!stream) return ''
  return `${stream.charAt(0).toUpperCase()}${stream.slice(1)}`
}

const InfoRow = ({ label, value }) => (
  <div className="py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <p className="text-sm font-semibold" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
      {value || '—'}
    </p>
  </div>
)

const TabProfile = ({ student, studentId }) => {
  const navigate = useNavigate()
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [resetModal,   setResetModal]   = useState(null) // 'student' or 'parent'
  const [newPass,      setNewPass]      = useState('')
  const { resetPassword, resetParentPassword, isSaving } = useAdminStudentStore()
  const { toastSuccess, toastError, toastWarning } = useToast()

  const handleResetPassword = async () => {
    const data = newPass ? { new_password: newPass } : {}
    let result;
    
    if (resetModal === 'student') {
      result = await resetPassword(studentId, data)
    } else {
      result = await resetParentPassword(studentId, data)
    }

    if (result.success) {
      toastSuccess(`${resetModal === 'student' ? 'Student' : 'Parent'} portal password reset successfully`)
      setResetModal(null)
      setNewPass('')
    } else {
      toastError(result.message || 'Reset failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Profile Snapshot
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Last updated {formatDate(student.updated_at || student.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Clock}
            onClick={() => setHistoryOpen(true)}
          >
            Version History
          </Button>
          <Button
            size="sm"
            icon={Pencil}
            onClick={() => navigate(`${ROUTES.STUDENTS}/${studentId}/edit`)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <InfoRow label="Aadhar Number"    value={student.aadhar_no} />
        <InfoRow label="Nationality"      value={student.nationality} />
        <InfoRow label="Religion"         value={student.religion} />
        <InfoRow label="Caste / Category" value={`${student.caste || ''} ${student.category ? `(${student.category})` : ''}`} />
        <InfoRow label="Address"          value={[student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ')} />
        <InfoRow label="Phone"            value={student.phone} />
        <InfoRow label="Student Email"    value={student.email} />
        <InfoRow label="Mother tongue"    value={student.mother_tongue} />
        <InfoRow label="Father's Name"    value={student.father_name} />
        <InfoRow label="Mother's Name"    value={student.mother_name} />
        <InfoRow label="Parent Login Email" value={student.parent_email} />
        <InfoRow label="Blood Group"      value={student.blood_group} />
      </div>

      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white shadow-sm">
              <KeyRound size={16} className="text-indigo-600" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-900">Student Portal</h4>
          </div>
          <p className="text-[11px] text-indigo-600 mb-4 leading-relaxed font-medium">Reset password for student's personal account and mobile app access.</p>
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full shadow-md shadow-indigo-200/50"
            onClick={() => setResetModal('student')}
          >
            Reset Student Password
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white shadow-sm">
              <ShieldCheck size={16} className="text-amber-600" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-900">Parent Portal</h4>
          </div>
          <p className="text-[11px] text-amber-600 mb-4 leading-relaxed font-medium">Reset password for the parent portal login (shared by all siblings).</p>
          <Button 
            variant="warning" 
            size="sm" 
            className="w-full shadow-md shadow-amber-200/50"
            onClick={() => setResetModal('parent')}
          >
            Reset Parent Password
          </Button>
        </div>
      </div>

      {/* Reset password modal */}
      <Modal
        open={!!resetModal}
        onClose={() => setResetModal(null)}
        title={`Reset ${resetModal === 'student' ? 'Student' : 'Parent'} Password`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModal(null)}>Cancel</Button>
            <Button variant={resetModal === 'student' ? 'primary' : 'warning'} onClick={handleResetPassword} loading={isSaving}>
              Confirm Reset
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {resetModal === 'student' 
              ? 'Resetting the student portal password. They can change it after logging in.'
              : 'Resetting the parent portal password. This affects all students linked to this parent email.'}
          </p>
          <Input 
            label="New Password (optional)" 
            type="password" 
            placeholder="Leave blank to auto-generate" 
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
          />
        </div>
      </Modal>

      {/* Version history modal — simplified */}
      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Profile Version History"
        size="md"
      >
        <div
          className="flex flex-col items-center py-8 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Clock size={28} className="mb-3 opacity-30" />
          <p className="text-sm">Version history loads from the enrollment history tab.</p>
        </div>
      </Modal>
    </div>
  )
}

export default TabProfile
