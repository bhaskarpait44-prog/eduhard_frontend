// src/pages/students/admit/StepProfile.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
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
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(studentProfileSchema),
  })

  const isPermanentSame = watch('is_permanent_same')
  const currentAddress = watch(['address', 'village', 'police_station', 'post_office', 'district', 'city', 'state', 'pincode'])

  // Sync permanent address if toggle is active
  useEffect(() => {
    if (isPermanentSame) {
      setValue('perm_address', currentAddress[0])
      setValue('perm_village', currentAddress[1])
      setValue('perm_police_station', currentAddress[2])
      setValue('perm_post_office', currentAddress[3])
      setValue('perm_district', currentAddress[4])
      setValue('perm_state', currentAddress[6])
      setValue('perm_pincode', currentAddress[7])
    }
  }, [isPermanentSame, ...currentAddress, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
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
          <Input label="Mother Tongue" required placeholder="e.g. Assamese, Bodo, etc." error={errors.mother_tongue?.message} {...register('mother_tongue')} />
          <Input label="PEN No." placeholder="Permanent Education Number" {...register('pen_no')} />
          <Input label="APAAR ID" placeholder="Automated Permanent Academic Account Registry" {...register('apaar_id')} />
          <Input label="Identification Marks" placeholder="e.g. Mole on left cheek" containerClassName="col-span-2" {...register('identification_marks')} />
        </div>

        {/* Current Address */}
        <SectionHeading title="Current Address" subtitle="Student's current residential address" />
        <Textarea label="Village/Town/Street" required placeholder="House/Flat No, Street, Locality" rows={2} error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input label="Police Station (P.S.)" required placeholder="P.S." error={errors.police_station?.message} {...register('police_station')} />
          <Input label="Post Office (P.O.)" required placeholder="P.O." error={errors.post_office?.message} {...register('post_office')} />
          <Input label="District" required placeholder="District" error={errors.district?.message} {...register('district')} />
          <Input label="City" required placeholder="City/Town" error={errors.city?.message} {...register('city')} />
          <Input label="State" required placeholder="State" error={errors.state?.message} {...register('state')} />
          <Input label="Pincode" required placeholder="781001" type="number" error={errors.pincode?.message} {...register('pincode')} />
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

          {!isPermanentSame && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea label="Village/Town/Street" required placeholder="House/Flat No, Street, Locality" rows={2} error={errors.perm_address?.message} {...register('perm_address')} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input label="Police Station (P.S.)" required placeholder="P.S." error={errors.perm_police_station?.message} {...register('perm_police_station')} />
                <Input label="Post Office (P.O.)" required placeholder="P.O." error={errors.perm_post_office?.message} {...register('perm_post_office')} />
                <Input label="District" required placeholder="District" error={errors.perm_district?.message} {...register('perm_district')} />
                <Input label="State" required  placeholder="State" error={errors.perm_state?.message} {...register('perm_state')} />
                <Input label="Pincode" required placeholder="781001" type="number" error={errors.perm_pincode?.message} {...register('perm_pincode')} />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Phone"  type="tel" placeholder="+91-9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="WhatsApp No." type="tel" placeholder="+91-9876543210" error={errors.whatsapp_no?.message} {...register('whatsapp_no')} />
          <Input
            label="Student Email"
            type="email"
            placeholder="student@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Parents */}
        <SectionHeading title="Parents Profile" subtitle="Detailed information of Mother and Father" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Mother's Name" required placeholder="Sunita Sharma" error={errors.mother_name?.message} {...register('mother_name')} />
          <Input label="Mother's Qualification" placeholder="e.g. B.A., M.Sc." {...register('mother_qualification')} />
          <Input label="Mother's Phone" type="tel" placeholder="+91-9876543212" error={errors.mother_phone?.message} {...register('mother_phone')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Input label="Father's Name" required placeholder="Rajesh Sharma" error={errors.father_name?.message} {...register('father_name')} />
          <Input label="Father's Qualification" placeholder="e.g. B.Tech, M.A." {...register('father_qualification')} />
          <Input label="Father's Phone" required type="tel" placeholder="+91-9876543211" error={errors.father_phone?.message} {...register('father_phone')} />
          <Input label="Father's Email (Login)" required type="email" placeholder="father@email.com" error={errors.father_email?.message} {...register('father_email')} />
          <Input label="Father's Aadhar" placeholder="12-digit number" {...register('father_aadhar')} />
          <Input label="Father's Annual Income" placeholder="e.g. 8,00,000" {...register('father_annual_income')} />
        </div>

        {/* Guardian Expansion */}
        <SectionHeading title="Guardian Details" subtitle="If applicable, or secondary contact" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Guardian's Name" placeholder="Guardian Name" {...register('guardian_name')} />
          <Input label="Relation" placeholder="Relation to student" {...register('guardian_relation')} />
          <Input label="Guardian's Phone" type="tel" placeholder="+91-9876543213" {...register('guardian_phone')} />
          <Input label="Qualification" placeholder="Qualification" {...register('guardian_qualification')} />
          <Input label="Occupation" placeholder="Occupation" {...register('guardian_occupation')} />
          <Input label="Guardian's Aadhar" placeholder="12-digit number" {...register('guardian_aadhar')} />
        </div>

        {/* Medical */}
        <SectionHeading title="Medical Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Emergency Contact" required type="tel" placeholder="+91-9876543213" error={errors.emergency_contact?.message} {...register('emergency_contact')} />
          <Select label="Blood Group" required options={BLOOD_GROUPS} placeholder="Select…" error={errors.blood_group?.message} {...register('blood_group')} />
        </div>
        <Textarea
          label="Medical Notes"
          placeholder="Allergies, conditions, medications…"
          hint="Optional — visible to staff only"
          rows={2}
          {...register('medical_notes')}
        />
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <Button type="submit">Continue to Enrollment →</Button>
      </div>
    </form>
  )
}

export default StepProfile
