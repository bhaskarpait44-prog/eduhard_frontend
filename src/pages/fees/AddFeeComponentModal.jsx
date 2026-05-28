import { useEffect, useState, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Info, LayoutGrid, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import { getClasses, getClassOptions } from '@/api/classApi'
import * as feesApi from '@/api/feesApi'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency } from '@/utils/helpers'

const schema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name too long'),
  amount: z.string().min(1, 'Amount is required')
    .refine(
      (value) => !Number.isNaN(parseFloat(value)) && parseFloat(value) > 0,
      'Enter a valid amount',
    )
    .refine(v => parseFloat(v) <= 100000, 'Amount cannot exceed ₹1,00,000'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time'], {
    required_error: 'Frequency is required',
  }),
  due_day: z.string().refine((value) => {
    const day = parseInt(value, 10)
    return day >= 1 && day <= 28
  }, 'Due day must be between 1 and 28'),
  class_id: z.string().optional(),
  is_optional: z.boolean().optional(),
  remarks: z.string().max(255, 'Remarks too long').optional(),
})

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly - charged every month' },
  { value: 'quarterly', label: 'Quarterly - every 3 months' },
  { value: 'annual', label: 'Annual - once per session' },
  { value: 'one_time', label: 'One Time - admission or exam fee' },
]

const HINT_MAP = {
  monthly: '12 invoices will be generated per student (one per month)',
  quarterly: '4 invoices will be generated per student',
  annual: '1 invoice will be generated per student for the full year',
  one_time: '1 invoice will be generated — typically used for admission or exam fees',
}

const AddFeeComponentModal = ({ open, onClose, sessionId, classId: preSelectedClass, apiMode = 'default', onCreated, editTarget }) => {
  const { toastSuccess, toastError } = useToast()
  const [classes, setClasses] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Bulk Selection State
  const [isBulk, setIsBulk] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState([])

  useEffect(() => {
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      amount: '',
      frequency: 'monthly',
      due_day: '10',
      class_id: preSelectedClass || '',
      is_optional: false,
      remarks: '',
    },
  })

  const watchValues = useWatch({ control, name: ['amount', 'frequency'] })
  const amount = parseFloat(watchValues[0]) || 0
  const frequency = watchValues[1]

  useEffect(() => {
    if (frequency === 'one_time') {
      setValue('due_day', '1')
    }
  }, [frequency, setValue])

  const annualCost = useMemo(() => {
    if (frequency === 'monthly') return amount * 12
    if (frequency === 'quarterly') return amount * 4
    return amount
  }, [amount, frequency])

  useEffect(() => {
    if (open) {
      setSubmitSuccess(false)
      setIsBulk(false)
      setSelectedClasses(preSelectedClass ? [preSelectedClass] : [])
      
      if (editTarget) {
        reset({
          name: editTarget.name,
          amount: String(editTarget.amount),
          frequency: editTarget.frequency,
          due_day: String(editTarget.due_day),
          class_id: String(editTarget.class_id),
          is_optional: !!editTarget.is_optional,
          remarks: editTarget.remarks || '',
        })
      } else {
        reset({
          name: '',
          amount: '',
          frequency: 'monthly',
          due_day: '10',
          class_id: preSelectedClass || '',
          is_optional: false,
          remarks: '',
        })
      }
    }
  }, [open, editTarget, preSelectedClass, reset])

  const onSubmit = async (data) => {
    const targetClassIds = isBulk ? selectedClasses : [data.class_id]
    
    if (targetClassIds.length === 0) {
      toastError('Please select at least one class')
      return
    }

    setIsSaving(true)
    try {
      const client = apiMode === 'accountant' ? accountantApi : feesApi
      
      let lastRes = null
      for (let i = 0; i < targetClassIds.length; i++) {
        if (isBulk) setSaveProgress(`Saving ${i + 1}/${targetClassIds.length}...`)
        
        const payload = {
          session_id: parseInt(sessionId, 10),
          class_id: parseInt(targetClassIds[i], 10),
          name: data.name,
          amount: data.amount,
          frequency: data.frequency,
          due_day: parseInt(data.due_day, 10),
          is_optional: !!data.is_optional,
          remarks: data.remarks || null,
        }

        if (editTarget) {
          lastRes = await client.updateFeeStructure(editTarget.id, payload)
        } else {
          lastRes = await client.createFeeStructure(payload)
        }
      }

      setSubmitSuccess(true)
      onCreated?.(lastRes.data)
      
      setTimeout(() => {
        onClose()
        setSubmitSuccess(false)
        setSaveProgress(null)
      }, 1000)
    } catch (error) {
      toastError(error?.message || 'Failed to save component')
    } finally {
      setIsSaving(false)
      setSaveProgress(null)
    }
  }

  const toggleClass = (id) => {
    setSelectedClasses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? 'Edit Fee Component' : 'Add Fee Component'}
      size="sm"
      footer={!submitSuccess && (
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>
            {saveProgress || (editTarget ? 'Update Component' : 'Save Component')}
          </Button>
        </>
      )}
    >
      {submitSuccess ? (
        <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-primary">Component {editTarget ? 'Updated' : 'Added'}!</h3>
          <p className="text-sm text-text-muted mt-1">Returning to structure list...</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Class Selection Logic */}
          {!editTarget && (
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Target Class</span>
                <div 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-raised border border-border hover:border-brand/30 transition-all"
                  onClick={() => setIsBulk(!isBulk)}
                >
                  <LayoutGrid size={12} className={isBulk ? 'text-brand' : 'text-text-muted'} />
                  <span className={`text-[10px] font-bold uppercase ${isBulk ? 'text-brand' : 'text-text-muted'}`}>
                    Apply to multiple
                  </span>
                  <div className={`w-6 h-3.5 rounded-full relative transition-colors ${isBulk ? 'bg-brand' : 'bg-border'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${isBulk ? 'left-3' : 'left-0.5'}`} />
                  </div>
                </div>
              </label>

              {isBulk ? (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-surface-raised/30 max-h-[150px] overflow-y-auto">
                  {classes.map(c => (
                    <label key={c.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20 w-4 h-4"
                        checked={selectedClasses.includes(c.value)}
                        onChange={() => toggleClass(c.value)}
                      />
                      <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{c.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <Select
                  required
                  options={classes}
                  error={errors.class_id?.message}
                  {...register('class_id')}
                />
              )}
            </div>
          )}

          <Input
            label="Fee Name"
            placeholder="e.g. Tuition Fee, Transport Fee"
            required
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-2">
            <Input
              label="Amount (INR)"
              type="number"
              placeholder="1200.00"
              required
              min="1"
              step="0.01"
              error={errors.amount?.message}
              hint="Base amount per billing period"
              {...register('amount')}
            />
            {amount > 0 && (
              <div className="rounded-xl p-3 flex justify-between items-center bg-brand/5 border border-brand/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-[11px] font-semibold text-brand/70 uppercase tracking-wider">Estimated Annual Cost</span>
                <span className="text-sm font-bold text-brand">{formatCurrency(annualCost)}</span>
              </div>
            )}
          </div>

          <Select
            label="Frequency"
            required
            options={FREQUENCY_OPTIONS}
            error={errors.frequency?.message}
            {...register('frequency')}
          />

          {frequency !== 'one_time' && (
            <Input
              label="Due Day of Month"
              type="number"
              min="1"
              max="28"
              placeholder="10"
              required
              error={errors.due_day?.message}
              hint="Day of month payment is due (1-28)."
              {...register('due_day')}
            />
          )}

          <label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-surface-raised/50 transition-all group">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-text-primary">Optional Fee</p>
              <p className="text-[11px] text-text-muted leading-tight">Students/Parents can choose to skip this fee</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('is_optional')} />
              <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
            </div>
          </label>

          <Input
            label="Remarks (Optional)"
            placeholder="e.g. For academic year 2024"
            error={errors.remarks?.message}
            {...register('remarks')}
          />

          <div
            className="rounded-xl p-3 flex items-start gap-3 border border-border"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <Info size={16} className="text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {HINT_MAP[frequency] || 'Add the fee component for the selected class and session.'}
            </p>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default AddFeeComponentModal
