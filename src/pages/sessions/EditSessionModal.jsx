import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import { cn } from '@/utils/helpers'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const schema = z.object({
  name: z.string().min(1, 'Session name is required').max(100, 'Max 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  monday: z.boolean().default(true),
  tuesday: z.boolean().default(true),
  wednesday: z.boolean().default(true),
  thursday: z.boolean().default(true),
  friday: z.boolean().default(true),
  saturday: z.boolean().default(false),
  sunday: z.boolean().default(false),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export default function EditSessionModal({ open, onClose, session }) {
  const { updateSession, isSaving } = useSessionStore()
  const { toastSuccess, toastError } = useToast()
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    }
  })

  useEffect(() => {
    if (session && open) {
      reset({
        name: session.name,
        start_date: session.start_date?.slice(0, 10) || '',
        end_date: session.end_date?.slice(0, 10) || '',
        monday: session.monday ?? session.working_days?.monday ?? true,
        tuesday: session.tuesday ?? session.working_days?.tuesday ?? true,
        wednesday: session.wednesday ?? session.working_days?.wednesday ?? true,
        thursday: session.thursday ?? session.working_days?.thursday ?? true,
        friday: session.friday ?? session.working_days?.friday ?? true,
        saturday: session.saturday ?? session.working_days?.saturday ?? false,
        sunday: session.sunday ?? session.working_days?.sunday ?? false,
      })
    }
  }, [session, open, reset])

  const onSubmit = async (data) => {
    // Extract working days for the backend which expects working_days object
    const working_days = {
      monday: data.monday,
      tuesday: data.tuesday,
      wednesday: data.wednesday,
      thursday: data.thursday,
      friday: data.friday,
      saturday: data.saturday,
      sunday: data.sunday,
    }

    const payload = {
      ...data,
      working_days
    }

    const result = await updateSession(session.id, payload)
    if (result.success) {
      toastSuccess('Session updated successfully')
      onClose()
    } else {
      toastError(result.message || 'Failed to update session')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Session" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Session Name"
            placeholder="e.g. Academic Year 2024-25"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              error={errors.start_date?.message}
              required
              {...register('start_date')}
            />
            <Input
              type="date"
              label="End Date"
              error={errors.end_date?.message}
              required
              {...register('end_date')}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Working Days</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Select the days of the week that are considered working days.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <Controller
                key={day}
                name={day}
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all min-w-[60px]",
                      field.value 
                        ? "bg-blue-50 border-blue-200 text-blue-700" 
                        : "bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-tight">{day.slice(0, 3)}</span>
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                        field.value ? "bg-blue-600 text-white" : "bg-[var(--color-border)]"
                      )}
                    >
                      {field.value ? '✓' : '–'}
                    </div>
                  </button>
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
