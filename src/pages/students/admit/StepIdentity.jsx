// src/pages/students/admit/StepIdentity.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shuffle, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'
import api from '@/api/axios'
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
  const [checking, setChecking] = useState(false)
  const { register, handleSubmit, setValue, watch, setError, clearErrors, formState: { errors } } = useForm({
    resolver     : zodResolver(studentAdmitSchema),
    defaultValues: { ...defaultValues, admission_no: defaultValues.admission_no || genAdmissionNo() },
    mode         : 'onBlur',
  })

  const checkTimeouts = useRef({})
  const handleUniqueCheck = async (field, label, value) => {
    if (!value || value.trim() === '') {
      clearErrors(field)
      return
    }
    try {
      const res = await api.get('/public/check-uniqueness', {
        params: { field, value }
      })
      if (!res.data.isUnique) {
        setError(field, { type: 'manual', message: `${label} is already taken` })
      } else {
        clearErrors(field)
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

  const handleProceed = async (data) => {
    setChecking(true)
    try {
      // Pre-check against dedicated uniqueness check API to prevent collisions
      const res = await api.get('/public/check-uniqueness', { params: { field: 'admission_no', value: data.admission_no } })
      if (!res.data.isUnique) {
        setError('admission_no', { message: 'This admission number is already taken — please generate a new one' })
        return
      }
      onNext(data)
    } catch (err) {
      console.error('Uniqueness check failed', err)
      onNext(data) // Fallback: allow proceed, backend will catch it anyway
    } finally {
      setChecking(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleProceed)}>
      <div
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/5"
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
          <Input 
            label="Aadhar No. (Optional)" 
            placeholder="12-digit number" 
            type="text" 
            hint="12-digit Aadhaar number printed on the card (optional)"
            error={errors.aadhar_no?.message} 
            {...register('aadhar_no', {
              onChange: (e) => handleUniqueCheckDebounced('aadhar_no', 'Aadhar Card No.', e.target.value)
            })} 
          />
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
              hint="Auto-generated or enter manually. Format: ADM-2024-0001"
              containerClassName="flex-1"
              autoComplete="off"
              {...register('admission_no', {
                onChange: (e) => handleUniqueCheckDebounced('admission_no', 'Admission number', e.target.value)
              })}
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

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <div />
        <Button type="submit" loading={checking} className="shadow-lg shadow-indigo-500/20">
          {checking ? 'Checking uniqueness...' : 'Continue to Profile →'}
        </Button>
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
