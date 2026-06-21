// src/pages/sessions/AddHolidayModal.jsx
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatDate } from '@/utils/helpers'

const schema = z.object({
  holiday_date : z.string().min(1, 'Start Date is required'),
  end_date     : z.string().optional().or(z.literal('')),
  name         : z.string().min(1, 'Holiday name is required').max(150),
  type         : z.enum(['national', 'regional', 'school'], {
    required_error: 'Please select a type',
  }),
}).refine((data) => {
  if (data.end_date && data.holiday_date) {
    return new Date(data.end_date) >= new Date(data.holiday_date);
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["end_date"],
});

const AddHolidayModal = ({ open, onClose, sessionId, existingHolidays = [] }) => {
  const { toastSuccess, toastError } = useToast()
  const { addHoliday, isSaving } = useSessionStore()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const selectedDate = watch('holiday_date')
  const watchEndDate = watch('end_date')

  // Check for date conflict
  const conflictingDates = useMemo(() => {
    if (!selectedDate) return []
    const start = new Date(selectedDate)
    const end = watchEndDate ? new Date(watchEndDate) : start
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return []

    const dates = []
    let curr = new Date(start)
    while (curr <= end) {
      dates.push(curr.toISOString().slice(0, 10))
      curr.setUTCDate(curr.getUTCDate() + 1)
    }

    return dates.filter(d => 
      existingHolidays.some(h => h && String(h.holiday_date).slice(0, 10) === d)
    )
  }, [selectedDate, watchEndDate, existingHolidays])

  const isDateConflict = conflictingDates.length > 0

  // Reset form when modal opens
  useEffect(() => {
    if (open) reset()
  }, [open])

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      end_date: data.end_date || undefined
    }
    const result = await addHoliday(sessionId, payload)
    if (result.success) {
      toastSuccess(`Holiday "${data.name}" added`)
      onClose()
    } else {
      toastError(result.message || 'Failed to add holiday')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Holiday"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSaving}
            disabled={isDateConflict}
          >
            Save Holiday
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Date */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            error={errors.holiday_date?.message}
            required
            {...register('holiday_date')}
          />
          <Input
            label="End Date (Optional)"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>

        {/* Date conflict warning */}
        {isDateConflict && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={{
              backgroundColor : '#fffbeb',
              border          : '1px solid #fde68a',
              color           : '#92400e',
            }}
          >
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              A holiday is already declared on: {conflictingDates.map(d => formatDate(d)).join(', ')}. Choose a different range.
            </span>
          </div>
        )}

        {/* Name */}
        <Input
          label="Holiday Name"
          placeholder="e.g. Republic Day, Diwali"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Holiday Type <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            {...register('type')}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              backgroundColor : 'var(--color-surface)',
              border          : `1.5px solid ${errors.type ? '#dc2626' : 'var(--color-border)'}`,
              color           : 'var(--color-text-primary)',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e   => e.target.style.borderColor = errors.type ? '#dc2626' : 'var(--color-border)'}
          >
            <option value="">Select type…</option>
            <option value="national">National — Gazetted government holiday</option>
            <option value="regional">Regional — State or district level</option>
            <option value="school">School — Institution specific</option>
          </select>
          {errors.type && (
            <p className="text-xs" style={{ color: '#dc2626' }}>{errors.type.message}</p>
          )}
        </div>

        {/* Type info */}
        <div
          className="p-3 rounded-xl text-xs"
          style={{
            backgroundColor : 'var(--color-surface-raised)',
            color           : 'var(--color-text-muted)',
          }}
        >
          Adding a holiday will retroactively update attendance records for that date.
          Students marked present on this date will be moved to "Holiday" status.
        </div>
      </form>
    </Modal>
  )
}

export default AddHolidayModal