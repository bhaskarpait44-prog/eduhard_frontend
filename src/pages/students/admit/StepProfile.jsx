// src/pages/students/admit/StepProfile.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState, useRef } from 'react'
import api from '@/api/axios'
import Input    from '@/components/ui/Input'
import Select   from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button   from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'
import { studentProfileSchema } from '@/utils/validations'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown']
  .map(v => ({ value: v, label: v }))

const StepProfile = ({ defaultValues, onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(studentProfileSchema),
    mode: 'onBlur',
  })

  const [parentWarnings, setParentWarnings] = useState({})
  const checkTimeouts = useRef({})

  const handleUniqueCheck = async (field, label, value) => {
    if (!value || value.trim() === '') {
      clearErrors(field)
      setParentWarnings(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
      return
    }
    try {
      const res = await api.get('/public/check-uniqueness', {
        params: { field, value }
      })
      const isParentField = ['parent_email', 'father_phone', 'mother_phone', 'guardian_phone', 'mother_email', 'father_aadhar', 'mother_aadhar', 'guardian_aadhar'].includes(field);
      if (!res.data.isUnique) {
        if (isParentField) {
          setParentWarnings(prev => ({ ...prev, [field]: 'Matches an existing parent record. This student will be linked to that family account.' }))
          clearErrors(field)
        } else {
          setError(field, { type: 'manual', message: `${label} is already taken` })
        }
      } else {
        clearErrors(field)
        if (isParentField) {
          setParentWarnings(prev => {
            const next = { ...prev }
            delete next[field]
            return next
          })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUniqueCheckDebounced = (field, label, value) => {
    if (checkTimeouts.current[field]) {
      clearTimeout(checkTimeouts.current[field])
    }
    checkTimeouts.current[field] = setTimeout(() => {
      handleUniqueCheck(field, label, value)
    }, 500)
  }

  const isPermanentSame = watch('is_permanent_same')
  const currentAddress = watch(['address', 'village', 'police_station', 'post_office', 'district', 'city', 'state', 'pincode'])

  // Sync permanent address if toggle is active
  useEffect(() => {
    if (isPermanentSame) {
      setValue('perm_address',        currentAddress[0])
      setValue('perm_village',        currentAddress[1])
      setValue('perm_police_station', currentAddress[2])
      setValue('perm_post_office',    currentAddress[3])
      setValue('perm_district',       currentAddress[4])
      setValue('perm_city',           currentAddress[5])
      setValue('perm_state',          currentAddress[6])
      setValue('perm_pincode',        currentAddress[7])
    }
  }, [isPermanentSame, ...currentAddress, setValue])

  const fatherPhone = watch('father_phone')
  const emergencyContact = watch('emergency_contact')
  const [lastFatherPhone, setLastFatherPhone] = useState(defaultValues.father_phone || '')

  // Sync emergency contact with father's phone if it was empty or matched the old number
  useEffect(() => {
    const fPhone = fatherPhone || ''
    if (fPhone !== lastFatherPhone) {
      setLastFatherPhone(fPhone)
      if (!emergencyContact || emergencyContact === lastFatherPhone) {
        setValue('emergency_contact', fPhone)
      }
    }
  }, [fatherPhone, lastFatherPhone, emergencyContact, setValue])

  const fatherName = watch('father_name')
  const parentEmail = watch('parent_email')

  const guardianName = watch('guardian_name')
  const guardianRelation = watch('guardian_relation')
  const guardianPhone = watch('guardian_phone')
  const guardianEmail = watch('guardian_email')

  const hasFatherInfo = fatherName?.trim() || fatherPhone?.trim() || parentEmail?.trim()
  const hasGuardianInfo = guardianName?.trim() || guardianRelation?.trim() || guardianPhone?.trim() || guardianEmail?.trim()

  const isFatherRequired = !hasGuardianInfo
  const isGuardianRequired = !hasFatherInfo

  const [checking, setChecking] = useState(false)
  const handleProceed = async (data) => {
    setChecking(true)
    try {
      const checkFields = [
        { key: 'phone', label: 'Student Phone Number', val: data.phone },
        { key: 'email', label: 'Student Email', val: data.email },
      ]

      for (const field of checkFields) {
        if (field.val && field.val.trim() !== '') {
          const res = await api.get('/public/check-uniqueness', {
            params: { field: field.key, value: field.val }
          })
          if (!res.data.isUnique) {
            setError(field.key, { type: 'manual', message: `${field.label} is already taken` })
            setChecking(false)
            return
          }
        }
      }

      onNext(data)
    } catch (err) {
      console.error(err)
      onNext(data)
    } finally {
      setChecking(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleProceed)}>
      <div
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/5"
      >
        {/* Identity Expansion */}
        <SectionHeading title="Identity Details" subtitle="Additional personal information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nationality" required placeholder="Indian" error={errors.nationality?.message} {...register('nationality')} />
          <Select
            label="Religion"
            required
            error={errors.religion?.message}
            options={[
              { value: 'Hinduism', label: 'Hinduism' },
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
          <Input label="Mother Tongue" required placeholder="e.g. Assamese, Bodo, etc." error={errors.mother_tongue?.message} {...register('mother_tongue')} />
          <Input 
            label="PEN No. (Optional)" 
            placeholder="Permanent Education Number" 
            hint="Permanent Education Number assigned by the government (optional)"
            {...register('pen_no')} 
          />
          <Input 
            label="APAAR ID (Optional)" 
            placeholder="Automated Permanent Academic Account Registry" 
            hint="Automated Permanent Academic Account Registry ID (optional)"
            {...register('apaar_id')} 
          />
          <Input 
            label="Identification Marks (Optional)" 
            placeholder="e.g. Mole on left cheek" 
            containerClassName="col-span-2" 
            {...register('identification_marks')} 
          />
        </div>

        {/* Current Address */}
        <SectionHeading title="Current Address" subtitle="Student's current residential address" />
        <Textarea label="House No. / Street / Locality" required placeholder="House/Flat No, Street, Locality" rows={2} error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Village / Town" required placeholder="Village or Town name" error={errors.village?.message} {...register('village')} />
          <Input label="Police Station (P.S.)" required placeholder="P.S." error={errors.police_station?.message} {...register('police_station')} />
          <Input label="Post Office (P.O.)" required placeholder="P.O." error={errors.post_office?.message} {...register('post_office')} />
          <Input label="District" required placeholder="District" error={errors.district?.message} {...register('district')} />
          <Input label="City" required placeholder="City/Town" error={errors.city?.message} {...register('city')} />
          <Input label="State" required placeholder="State" error={errors.state?.message} {...register('state')} />
          <Input label="Pincode" required placeholder="781001" type="text" error={errors.pincode?.message} {...register('pincode')} />
        </div>

        {/* Permanent Address */}
        <div className="pt-2">
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

            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea label="House No. / Street / Locality" required placeholder="House/Flat No, Street, Locality" rows={2} error={errors.perm_address?.message} disabled={isPermanentSame} {...register('perm_address')} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input label="Village / Town" required placeholder="Village or Town name" error={errors.perm_village?.message} disabled={isPermanentSame} {...register('perm_village')} />
                <Input label="Police Station (P.S.)" required placeholder="P.S." error={errors.perm_police_station?.message} disabled={isPermanentSame} {...register('perm_police_station')} />
                <Input label="Post Office (P.O.)" required placeholder="P.O." error={errors.perm_post_office?.message} disabled={isPermanentSame} {...register('perm_post_office')} />
                <Input label="District" required placeholder="District" error={errors.perm_district?.message} disabled={isPermanentSame} {...register('perm_district')} />
                <Input label="City" required placeholder="City/Town" error={errors.perm_city?.message} disabled={isPermanentSame} {...register('perm_city')} />
                <Input label="State" required  placeholder="State" error={errors.perm_state?.message} disabled={isPermanentSame} {...register('perm_state')} />
                <Input label="Pincode" required placeholder="781001" type="text" error={errors.perm_pincode?.message} disabled={isPermanentSame} {...register('perm_pincode')} />
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Phone Number (Optional)"  type="text" placeholder="9876543210" error={errors.phone?.message} {...register('phone', {
            onChange: (e) => handleUniqueCheckDebounced('phone', 'Student Phone Number', e.target.value)
          })} />
          <Input
            label="Student Email (Optional)"
            type="email"
            placeholder="student@email.com"
            error={errors.email?.message}
            {...register('email', {
              onChange: (e) => handleUniqueCheckDebounced('email', 'Student Email', e.target.value)
            })}
          />
        </div>

        {/* Parents */}
        <SectionHeading title="Parents Profile" subtitle="Detailed information of Mother and Father" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Mother's Name (Optional)" placeholder="Sunita Sharma" error={errors.mother_name?.message} {...register('mother_name')} />
          <Input label="Mother's Qualification (Optional)" placeholder="e.g. B.A., M.Sc." {...register('mother_qualification')} />
          <Input 
            label="Mother's Phone (Optional)" 
            type="text" 
            placeholder="9876543212" 
            error={errors.mother_phone?.message} 
            warning={parentWarnings.mother_phone}
            {...register('mother_phone', {
              onChange: (e) => handleUniqueCheckDebounced('mother_phone', "Mother's Phone", e.target.value)
            })} 
          />
          <Input 
            label="Mother's Email (Optional)" 
            type="email" 
            placeholder="mother@email.com" 
            error={errors.mother_email?.message} 
            warning={parentWarnings.mother_email}
            {...register('mother_email', {
              onChange: (e) => handleUniqueCheckDebounced('mother_email', "Mother's Email", e.target.value)
            })} 
          />
          <Input 
            label="Mother's Occupation (Optional)" 
            placeholder="e.g. Doctor, Homemaker" 
            {...register('mother_occupation')} 
          />
          <Input 
            label="Mother's Aadhar (Optional)" 
            placeholder="12-digit number" 
            type="text" 
            maxLength={12} 
            hint="12-digit Aadhaar number printed on the card (optional)"
            error={errors.mother_aadhar?.message}
            warning={parentWarnings.mother_aadhar}
            {...register('mother_aadhar', {
              onChange: (e) => handleUniqueCheckDebounced('mother_aadhar', "Mother's Aadhaar", e.target.value)
            })} 
          />
          <Input label="Mother's Annual Income (Optional)" placeholder="e.g. 8,00,000" error={errors.mother_annual_income?.message} {...register('mother_annual_income')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Input 
            label={isFatherRequired ? "Father's Name" : "Father's Name (Optional)"} 
            required={isFatherRequired} 
            placeholder="Rajesh Sharma" 
            error={errors.father_name?.message} 
            {...register('father_name')} 
          />
          <Input label="Father's Occupation (Optional)" placeholder="e.g. Engineer, Farmer" {...register('father_occupation')} />
          <Input label="Father's Qualification (Optional)" placeholder="e.g. B.Tech, M.A." {...register('father_qualification')} />
          <Input 
            label={isFatherRequired ? "Father's Phone" : "Father's Phone (Optional)"} 
            required={isFatherRequired} 
            type="text" 
            placeholder="9876543211" 
            hint="10-digit mobile number"
            error={errors.father_phone?.message} 
            warning={parentWarnings.father_phone}
            {...register('father_phone', {
              onChange: (e) => handleUniqueCheckDebounced('father_phone', "Father's Phone", e.target.value)
            })} 
          />
          <Input 
            label={isFatherRequired ? "Father's Email" : "Father's Email (Optional)"} 
            hint="This email becomes the parent's login ID for the portal"
            required={isFatherRequired} 
            type="email" 
            placeholder="father@email.com" 
            error={errors.parent_email?.message} 
            warning={parentWarnings.parent_email}
            {...register('parent_email', {
              onChange: (e) => handleUniqueCheckDebounced('parent_email', "Parent Email Login", e.target.value)
            })} 
          />
          <Input 
            label="Father's Aadhar (Optional)" 
            placeholder="12-digit number" 
            type="text" 
            maxLength={12} 
            hint="12-digit Aadhaar number printed on the card (optional)"
            error={errors.father_aadhar?.message}
            warning={parentWarnings.father_aadhar}
            {...register('father_aadhar', {
              onChange: (e) => handleUniqueCheckDebounced('father_aadhar', "Father's Aadhaar", e.target.value)
            })} 
          />
          <Input 
            label="Father's Annual Income (Optional)" 
            placeholder="e.g. 8,00,000" 
            error={errors.father_annual_income?.message}
            {...register('father_annual_income')} 
          />
        </div>

        {/* Guardian Expansion */}
        <SectionHeading title="Guardian Details" subtitle="If applicable, or secondary contact" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input 
            label={isGuardianRequired ? "Guardian's Name" : "Guardian's Name (Optional)"} 
            required={isGuardianRequired} 
            placeholder="Guardian Name" 
            error={errors.guardian_name?.message} 
            {...register('guardian_name')} 
          />
          <Input 
            label={isGuardianRequired ? "Relation" : "Relation (Optional)"} 
            required={isGuardianRequired} 
            placeholder="Relation to student" 
            error={errors.guardian_relation?.message} 
            {...register('guardian_relation')} 
          />
          <Input 
            label={isGuardianRequired ? "Guardian's Phone" : "Guardian's Phone (Optional)"} 
            required={isGuardianRequired} 
            type="text" 
            placeholder="9876543213" 
            error={errors.guardian_phone?.message}
            warning={parentWarnings.guardian_phone}
            {...register('guardian_phone', {
              onChange: (e) => handleUniqueCheckDebounced('guardian_phone', "Guardian's Phone", e.target.value)
            })} 
          />
          <Input label="Qualification (Optional)" placeholder="Qualification" {...register('guardian_qualification')} />
          <Input label="Occupation (Optional)" placeholder="Occupation" {...register('guardian_occupation')} />
          <Input 
            label="Guardian's Aadhar (Optional)" 
            placeholder="12-digit number" 
            type="text" 
            maxLength={12} 
            hint="12-digit Aadhaar number printed on the card (optional)"
            error={errors.guardian_aadhar?.message}
            warning={parentWarnings.guardian_aadhar}
            {...register('guardian_aadhar', {
              onChange: (e) => handleUniqueCheckDebounced('guardian_aadhar', "Guardian's Aadhaar", e.target.value)
            })} 
          />
          <Input 
            label={isGuardianRequired ? "Guardian's Email" : "Guardian's Email (Optional)"} 
            required={isGuardianRequired} 
            type="email" 
            placeholder="guardian@email.com" 
            error={errors.guardian_email?.message}
            warning={parentWarnings.guardian_email}
            {...register('guardian_email', {
              onChange: (e) => handleUniqueCheckDebounced('guardian_email', "Guardian's Email", e.target.value)
            })} 
          />
        </div>

        {/* Medical */}
        <SectionHeading title="Medical Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Emergency Contact" 
            required 
            type="text" 
            placeholder="9876543213" 
            hint="Someone we can call immediately if there's an emergency"
            error={errors.emergency_contact?.message} 
            {...register('emergency_contact')} 
          />
          <Select label="Blood Group" required options={BLOOD_GROUPS} placeholder="Select…" error={errors.blood_group?.message} {...register('blood_group')} />
        </div>
        <Textarea
          label="Medical Notes (Optional)"
          placeholder="Allergies, conditions, medications…"
          hint="Optional — visible to staff only"
          rows={2}
          {...register('medical_notes')}
        />
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <Button type="submit" loading={checking} className="shadow-lg shadow-indigo-500/20">
          {checking ? 'Checking uniqueness...' : 'Continue to Enrollment →'}
        </Button>
      </div>
    </form>
  )
}

export default StepProfile
