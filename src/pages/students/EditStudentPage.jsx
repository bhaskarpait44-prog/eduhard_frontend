import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  User, MapPin, Phone, Mail, Heart, IdCard, GraduationCap, 
  ArrowLeft, Save, AlertCircle, Clock, ShieldCheck, KeyRound,
  Trash2, Plus, X, Upload, FileText, CheckCircle2
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '@/api/axios'
import useAdminStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import { ROUTES } from '@/constants/app'
import { studentUpdateSchema } from '@/utils/validations'
import { SectionHeading } from './admit/StepIdentity'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
  .map(v => ({ value: v, label: v }))

const EditStudentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const { selectedStudent: student, fetchStudent, updateProfile, isSaving } = useAdminStudentStore()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])

  usePageTitle(student ? `Edit: ${student.first_name} ${student.last_name}` : 'Edit Student')

  useEffect(() => {
    setLoading(true)
    fetchStudent(id)
      .then(data => {
        setDocuments(data.documents || [])
      })
      .catch(() => {
        toastError('Student not found')
        navigate(ROUTES.STUDENTS)
      })
      .finally(() => setLoading(false))
  }, [id, fetchStudent, navigate, toastError])

  const defaultValues = useMemo(() => {
    if (!student) return {}
    return {
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      gender: student.gender || '',
      date_of_birth: student.date_of_birth || '',
      admission_no: student.admission_no || '',
      aadhar_no: student.aadhar_no || '',
      
      address: student.address || '',
      village: student.village || '',
      police_station: student.police_station || '',
      post_office: student.post_office || '',
      district: student.district || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      
      is_permanent_same: student.is_permanent_same || false,
      perm_address: student.perm_address || '',
      perm_village: student.perm_village || '',
      perm_police_station: student.perm_police_station || '',
      perm_post_office: student.perm_post_office || '',
      perm_district: student.perm_district || '',
      perm_state: student.perm_state || '',
      perm_pincode: student.perm_pincode || '',

      phone: student.phone || '',
      whatsapp_no: student.whatsapp_no || '',
      email: student.email || '',
      parent_email: student.parent_email || '',
      emergency_contact: student.emergency_contact || '',
      
      nationality: student.nationality || 'Indian',
      religion: student.religion || '',
      caste: student.caste || 'Gen',
      mother_tongue: student.mother_tongue || '',
      identification_marks: student.identification_marks || '',
      pen_no: student.pen_no || '',
      apaar_id: student.apaar_id || '',
      
      father_name: student.father_name || '',
      father_phone: student.father_phone || '',
      father_qualification: student.father_qualification || '',
      father_aadhar: student.father_aadhar || '',
      father_annual_income: student.father_annual_income || '',
      
      mother_name: student.mother_name || '',
      mother_phone: student.mother_phone || '',
      mother_qualification: student.mother_qualification || '',

      guardian_name: student.guardian_name || '',
      guardian_relation: student.guardian_relation || '',
      guardian_phone: student.guardian_phone || '',
      guardian_qualification: student.guardian_qualification || '',
      guardian_occupation: student.guardian_occupation || '',
      guardian_aadhar: student.guardian_aadhar || '',
      guardian_annual_income: student.guardian_annual_income || '',

      blood_group: student.blood_group || '',
      medical_notes: student.medical_notes || '',
      change_reason: '',
    }
  }, [student])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues,
    resolver: zodResolver(studentUpdateSchema)
  })

  useEffect(() => {
    if (student) reset(defaultValues)
  }, [student, defaultValues, reset])

  const isPermanentSame = watch('is_permanent_same')
  const currentAddr = watch(['address', 'village', 'police_station', 'post_office', 'district', 'city', 'state', 'pincode'])

  useEffect(() => {
    if (isPermanentSame) {
      setValue('perm_address', currentAddr[0])
      setValue('perm_village', currentAddr[1])
      setValue('perm_police_station', currentAddr[2])
      setValue('perm_post_office', currentAddr[3])
      setValue('perm_district', currentAddr[4])
      setValue('perm_city', currentAddr[5])
      setValue('perm_state', currentAddr[6])
      setValue('perm_pincode', currentAddr[7])
    }
  }, [isPermanentSame, ...currentAddr, setValue])

  const onSave = async (data) => {
    const res = await updateProfile(id, data)
    if (res.success) {
      toastSuccess('Student profile updated successfully')
      navigate(`${ROUTES.STUDENTS}/${id}`)
    } else {
      toastError(res.message || 'Failed to update student')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toastError('File too large (Max 5MB)')

    setUploading(true)
    const formData = new FormData()
    formData.append('document', file)
    formData.append('document_type', 'manual_edit')

    try {
      const res = await api.post(`/api/students/${id}/documents`, formData)
      setDocuments(prev => [res.data, ...prev])
      toastSuccess('Document uploaded')
    } catch (err) {
      toastError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/api/students/${id}/documents/${docId}`)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      toastSuccess('Document removed')
    } catch (err) {
      toastError(err.message || 'Failed to delete')
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto p-6 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /><div className="space-y-4"><div className="h-32 bg-gray-100 rounded-xl" /><div className="h-64 bg-gray-100 rounded-xl" /></div></div>

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${ROUTES.STUDENTS}/${id}`)}
            className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-surface-raised transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Edit Student Profile</h1>
            <p className="text-sm text-text-muted">ID: {student?.admission_no} • {student?.first_name} {student?.last_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate(`${ROUTES.STUDENTS}/${id}`)}>Cancel</Button>
          <Button 
            icon={Save} 
            onClick={handleSubmit(onSave)} 
            loading={isSaving}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        
        {/* Login & Access Details */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-5 shadow-sm">
          <SectionHeading title="Login & Access Details" subtitle="Credentials for student and parent portals" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-xl border border-indigo-200">
               <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Student Portal ID</p>
               <p className="text-sm font-bold text-indigo-900">{student?.admission_no || '--'}</p>
            </div>
            <Input label="Student Login Email (Optional)" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Parent Login Email" type="email" required error={errors.parent_email?.message} {...register('parent_email')} />
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/50 rounded-xl text-[11px] text-indigo-700 font-medium">
             <KeyRound size={14} />
             <span>Passwords can be reset from the student profile page. Admission number acts as the primary login ID for students.</span>
          </div>
        </div>

        {/* Identity & Basic Info */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <SectionHeading title="Identity & Basic Information" subtitle="Primary identifiers and personal details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="First Name" required error={errors.first_name?.message} {...register('first_name')} />
            <Input label="Last Name" required error={errors.last_name?.message} {...register('last_name')} />
            <Input label="Admission Number" required error={errors.admission_no?.message} {...register('admission_no')} />
            <Input label="Date of Birth" type="date" required error={errors.date_of_birth?.message} {...register('date_of_birth')} />
            <Select 
              label="Gender" required 
              error={errors.gender?.message}
              options={[{value:'male', label:'Male'}, {value:'female', label:'Female'}, {value:'other', label:'Other'}]}
              {...register('gender')}
            />
            <Input label="Aadhar Number" maxLength={12} error={errors.aadhar_no?.message} {...register('aadhar_no')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Nationality" required error={errors.nationality?.message} {...register('nationality')} />
            <Select
              label="Religion"
              required
              error={errors.religion?.message}
              options={[
                { value: 'Hindu', label: 'Hindu' },
                { value: 'Muslim', label: 'Muslim' },
                { value: 'Christian', label: 'Christian' },
                { value: 'Sikh', label: 'Sikh' },
                { value: 'Buddhist', label: 'Buddhist' },
                { value: 'Jain', label: 'Jain' },
                { value: 'Others', label: 'Others' },
              ]}
              {...register('religion')}
            />
            <Select
              label="Caste"
              required
              error={errors.caste?.message}
              options={[
                { value: 'Gen', label: 'General' },
                { value: 'OBC', label: 'OBC' },
                { value: 'ST', label: 'ST' },
                { value: 'SC', label: 'SC' },
              ]}
              {...register('caste')}
            />
            <Input label="Mother Tongue" required error={errors.mother_tongue?.message} {...register('mother_tongue')} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="PEN Number" {...register('pen_no')} />
            <Input label="APAAR ID" {...register('apaar_id')} />
            <Input label="Identification Marks" containerClassName="md:col-span-2" {...register('identification_marks')} />
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <SectionHeading title="Contact Information" subtitle="Student and emergency contact data" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Phone Number" error={errors.phone?.message} {...register('phone')} />
            <Input label="WhatsApp Number" error={errors.whatsapp_no?.message} {...register('whatsapp_no')} />
            <Input label="Emergency Contact" required error={errors.emergency_contact?.message} {...register('emergency_contact')} />
            <Select label="Blood Group" required error={errors.blood_group?.message} options={BLOOD_GROUPS} {...register('blood_group')} />
            <div className="md:col-span-2">
               <Input label="Medical Notes" placeholder="Allergies, chronic conditions, etc." {...register('medical_notes')} />
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Address */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5 shadow-sm">
            <SectionHeading title="Current Address" subtitle="Where the student currently resides" />
            <Textarea label="Village/Town/Street" required error={errors.address?.message} rows={2} {...register('address')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Police Station" required error={errors.police_station?.message} {...register('police_station')} />
              <Input label="Post Office" required error={errors.post_office?.message} {...register('post_office')} />
              <Input label="District" required error={errors.district?.message} {...register('district')} />
              <Input label="City" required error={errors.city?.message} {...register('city')} />
              <Input label="State" required error={errors.state?.message} {...register('state')} />
              <Input label="PIN Code" required error={errors.pincode?.message} {...register('pincode')} />
            </div>
          </div>

          {/* Permanent Address */}
          <div className="bg-surface rounded-2xl border border-border p-6 space-y-5 shadow-sm">
            <SectionHeading title="Permanent Address" subtitle="Legal permanent residence" />
            
            <div className="flex items-center gap-2 mb-4 bg-surface-raised p-3 rounded-xl border border-border">
              <input 
                type="checkbox" 
                id="is_permanent_same" 
                className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                {...register('is_permanent_same')} 
              />
              <label htmlFor="is_permanent_same" className="text-sm font-semibold text-text-primary cursor-pointer">
                Same as Current Address
              </label>
            </div>

            {!isPermanentSame && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Textarea label="Village/Town/Street" required error={errors.perm_address?.message} rows={2} {...register('perm_address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Police Station" required error={errors.perm_police_station?.message} {...register('perm_police_station')} />
                  <Input label="Post Office" required error={errors.perm_post_office?.message} {...register('perm_post_office')} />
                  <Input label="District" required error={errors.perm_district?.message} {...register('perm_district')} />
                  <Input label="City" required error={errors.perm_city?.message} {...register('perm_city')} />
                  <Input label="State" required error={errors.perm_state?.message} {...register('perm_state')} />
                  <Input label="PIN Code" required error={errors.perm_pincode?.message} {...register('perm_pincode')} />
                </div>
              </div>
            )}
            {isPermanentSame && (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-surface-raised/50">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Permanent Address Synchronized</p>
              </div>
            )}
          </div>
        </div>

        {/* Parents Details */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <SectionHeading title="Parents Profile" subtitle="Mother and Father's detailed information" />
          
          <div className="space-y-6">
            {/* Mother */}
            <div className="p-4 rounded-xl border border-border bg-gray-50/30 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Badge variant="blue">Mother's Particulars</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <Input label="Name" required error={errors.mother_name?.message} {...register('mother_name')} />
                <Input label="Phone" error={errors.mother_phone?.message} {...register('mother_phone')} />
                <Input label="Qualification" {...register('mother_qualification')} />
              </div>
            </div>

            {/* Father */}
            <div className="p-4 rounded-xl border border-border bg-gray-50/30 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Badge variant="indigo">Father's Particulars</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Input label="Name" required error={errors.father_name?.message} {...register('father_name')} />
                <Input label="Phone" required error={errors.father_phone?.message} {...register('father_phone')} />
                <Input label="Qualification" {...register('father_qualification')} />
                <Input label="Aadhar No" {...register('father_aadhar')} />
                <Input label="Annual Income" {...register('father_annual_income')} />
              </div>
            </div>

            {/* Guardian */}
            <div className="p-4 rounded-xl border border-border bg-gray-50/30 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Badge variant="grey">Guardian Details</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="Guardian Name" {...register('guardian_name')} />
                <Input label="Relation" {...register('guardian_relation')} />
                <Input label="Phone" {...register('guardian_phone')} />
                <Input label="Qualification" {...register('guardian_qualification')} />
                <Input label="Occupation" {...register('guardian_occupation')} />
                <Input label="Aadhar No" {...register('guardian_aadhar')} />
                <Input label="Annual Income" {...register('guardian_annual_income')} />
              </div>
            </div>
          </div>
        </div>

        {/* Digital Documents */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <SectionHeading title="Digital Documents" subtitle="Manage certificates and scanned files" />
            <div className="relative">
              <input type="file" id="doc-upload" className="hidden" onChange={handleFileUpload} />
              <Button 
                variant="secondary" 
                icon={uploading ? Clock : Upload} 
                onClick={() => document.getElementById('doc-upload').click()}
                disabled={uploading}
                size="sm"
              >
                {uploading ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 rounded-xl border border-border bg-gray-50/50 flex items-center justify-between group hover:border-brand transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm"><FileText size={16} /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate max-w-[120px]">{doc.name}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">{doc.document_type?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <a href={`/${doc.file_path}`} target="_blank" rel="noreferrer" className="p-2 text-text-muted hover:text-brand transition-colors">
                      <FileText size={14} />
                   </a>
                   <button 
                     type="button" 
                     onClick={() => handleDeleteDoc(doc.id)} 
                     className="p-2 text-text-muted hover:text-red-600 transition-colors"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && !uploading && (
              <div className="sm:col-span-2 md:col-span-3 py-10 text-center border-2 border-dashed border-border rounded-xl">
                 <FileText size={32} className="mx-auto text-gray-200 mb-2" />
                 <p className="text-xs font-medium text-gray-400 font-bold uppercase tracking-wider">No documents managed yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Change Reason */}
        <div className="bg-amber-50/50 rounded-2xl border border-amber-200 p-6 space-y-4 shadow-sm">
          <SectionHeading title="Finalize Changes" subtitle="Audit trail and confirmation" />
          <Textarea 
            label="Reason for update" 
            required 
            placeholder="Please provide a brief reason for these changes (e.g., 'Corrected spelling of father's name', 'Permanent address updated')"
            error={errors.change_reason?.message}
            {...register('change_reason')}
          />
          <div className="pt-2 flex items-center justify-end gap-3">
             <Button variant="secondary" type="button" onClick={() => navigate(`${ROUTES.STUDENTS}/${id}`)}>Discard Changes</Button>
             <Button 
               type="submit" 
               icon={Save} 
               loading={isSaving}
               disabled={!isDirty}
               className="shadow-lg shadow-indigo-200"
             >
               Save All Profile Updates
             </Button>
          </div>
        </div>

      </form>
    </div>
  )
}

export default EditStudentPage
