// src/pages/students/tabs/TabProfile.jsx
import { useEffect, useMemo, useState } from 'react'
import { Pencil, Clock, KeyRound, ShieldCheck } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import useAdminStudentStore from '@/store/studentStore'
import useToast from '@/hooks/useToast'
import { useForm } from 'react-hook-form'
import { studentUpdateSchema } from '@/utils/validations'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
  .map(v => ({ value: v, label: v }))

const formatStream = (stream) => {
  if (!stream) return ''
  return `${stream.charAt(0).toUpperCase()}${stream.slice(1)}`
}

const PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'address',
  'city',
  'state',
  'pincode',
  'phone',
  'email',
  'parent_email',
  'father_name',
  'father_phone',
  'mother_name',
  'mother_phone',
  'emergency_contact',
  'blood_group',
  'medical_notes',
]

const InfoRow = ({ label, value }) => (
  <div className="py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <p className="text-sm" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
      {value || '—'}
    </p>
  </div>
)

const TabProfile = ({ student, studentId }) => {
  const [editOpen,     setEditOpen]     = useState(false)
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [resetModal,   setResetModal]   = useState(null) // 'student' or 'parent'
  const [newPass,      setNewPass]      = useState('')
  const { updateProfile, resetPassword, resetParentPassword, isSaving } = useAdminStudentStore()
  const { toastSuccess, toastError, toastWarning } = useToast()

  const defaultValues = useMemo(
    () => PROFILE_FIELDS.reduce((acc, field) => {
      acc[field] = student?.[field] ?? ''
      return acc
    }, { change_reason: '' }),
    [student]
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ 
    defaultValues,
    resolver: zodResolver(studentUpdateSchema)
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const onSave = async (data) => {
    const { change_reason, ...profileData } = data
    const sanitizedProfileData = PROFILE_FIELDS.reduce((acc, field) => {
      acc[field] = profileData[field] ?? ''
      return acc
    }, {})

    const result = await updateProfile(studentId, { ...sanitizedProfileData, change_reason })
    if (result.success) {
      toastSuccess('Profile updated')
      setEditOpen(false)
    } else {
      toastError(result.message || 'Failed to update profile')
    }
  }

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
      if (result.data?.generated_password) {
        // In a real app, maybe show a temporary success modal with the password
        console.log('Generated Password:', result.data.generated_password)
      }
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
            Current Profile
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Version active since {formatDate(student.valid_from || student.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Clock}
            onClick={() => {
              if (student.is_active === false) {
                toastWarning('Please activate the student to view history.');
                return;
              }
              setHistoryOpen(true);
            }}
          >
            History
          </Button>
          <Button
            size="sm"
            icon={Pencil}
            onClick={() => {
              if (student.is_active === false) {
                toastWarning('Please activate the student to edit profile.');
                return;
              }
              setEditOpen(true);
            }}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <InfoRow label="Class Name"       value={student.current_enrollment?.class} />
        <InfoRow label="Section"          value={student.current_enrollment?.section} />
        <InfoRow label="Stream"           value={formatStream(student.current_enrollment?.stream)} />
        <InfoRow label="Address"          value={[student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ')} />
        <InfoRow label="Phone"            value={student.phone} />
        <InfoRow label="Student Email"    value={student.email} />
        <InfoRow label="Emergency Contact"value={student.emergency_contact} />
        <InfoRow label="Father's Name"    value={student.father_name} />
        <InfoRow label="Father's Phone"   value={student.father_phone} />
        <InfoRow label="Mother's Name"    value={student.mother_name} />
        <InfoRow label="Mother's Phone"   value={student.mother_phone} />
        <InfoRow label="Parent Login Email" value={student.parent_email} />
        <InfoRow label="Blood Group"      value={student.blood_group} />
        <InfoRow label="Medical Notes"    value={student.medical_notes} />
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

      {/* Edit profile modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSubmit(onSave)} loading={isSaving}>Save Profile</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.first_name?.message} {...register('first_name')} />
            <Input label="Last Name"  error={errors.last_name?.message}  {...register('last_name')} />
          </div>
          <Textarea label="Address" rows={2} {...register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City"    {...register('city')} />
            <Input label="State"   {...register('state')} />
            <Input label="Pincode" error={errors.pincode?.message} {...register('pincode')} />
            <Input label="Phone"   error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Student Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Parent Login Email" type="email" error={errors.parent_email?.message} {...register('parent_email')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Father Name"  {...register('father_name')} />
            <Input label="Father Phone" error={errors.father_phone?.message} {...register('father_phone')} />
            <Input label="Mother Name"  {...register('mother_name')} />
            <Input label="Mother Phone" error={errors.mother_phone?.message} {...register('mother_phone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Emergency Contact" error={errors.emergency_contact?.message} {...register('emergency_contact')} />
            <Select label="Blood Group" options={BLOOD_GROUPS} {...register('blood_group')} />
          </div>
          <Textarea label="Medical Notes" rows={2} {...register('medical_notes')} />
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Textarea
              label="Reason for change"
              placeholder="Why is this profile being updated? (required)"
              rows={2}
              required
              error={errors.change_reason?.message}
              {...register('change_reason')}
            />
          </div>
        </form>
      </Modal>

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
