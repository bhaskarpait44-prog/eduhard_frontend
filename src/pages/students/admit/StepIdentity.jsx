// src/pages/students/admit/StepIdentity.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shuffle } from 'lucide-react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { studentAdmitSchema } from '@/utils/validations'

const genAdmissionNo = () => {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ADM-${year}-${rand}`
}

const StepIdentity = ({ defaultValues, onNext }) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver     : zodResolver(studentAdmitSchema),
    defaultValues: { ...defaultValues, admission_no: defaultValues.admission_no || genAdmissionNo() },
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <SectionHeading title="Basic Identity" subtitle="Student's legal name and personal details" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" placeholder="Priya" error={errors.first_name?.message} required {...register('first_name')} />
          <Input label="Last Name"  placeholder="Sharma" error={errors.last_name?.message} required {...register('last_name')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date of Birth" type="date"
            max={new Date().toISOString().split('T')[0]}
            error={errors.date_of_birth?.message} required
            {...register('date_of_birth')}
          />
          <Select
            label="Gender" required
            error={errors.gender?.message}
            options={[
              { value: 'male',   label: 'Male'   },
              { value: 'female', label: 'Female' },
              { value: 'other',  label: 'Other'  },
            ]}
            {...register('gender')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Aadhar No." placeholder="12-digit number" maxLength={12} error={errors.aadhar_no?.message} {...register('aadhar_no')} />
          <div className="hidden sm:block" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
            Admission Number <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="ADM-2024-0001"
              error={errors.admission_no?.message}
              containerClassName="flex-1"
              {...register('admission_no')}
            />
            <button
              type="button"
              onClick={() => setValue('admission_no', genAdmissionNo())}
              className="px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5 shrink-0"
              style={{ backgroundColor: 'var(--color-surface-raised)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              title="Auto-generate"
            >
              <Shuffle size={14} /> Auto
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button type="submit">Continue to Profile →</Button>
      </div>
    </form>
  )
}

export const SectionHeading = ({ title, subtitle }) => (
  <div className="pb-2 border-b border-border mb-4 mt-2">
    <h3 className="text-base font-extrabold uppercase tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
  </div>
)

export default StepIdentity