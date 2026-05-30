import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'

const schema = z.object({
  name      : z.string().min(1, 'Session name is required').max(100, 'Max 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date  : z.string().min(1, 'End date is required'),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export default function EditSessionModal({ open, onClose, session }) {
  const { updateSession, isSaving } = useSessionStore()
  const { toastSuccess, toastError } = useToast()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
    }
  })

  useEffect(() => {
    if (session && open) {
      reset({
        name: session.name,
        start_date: session.start_date?.slice(0, 10) || '',
        end_date: session.end_date?.slice(0, 10) || '',
      })
    }
  }, [session, open, reset])

  const onSubmit = async (data) => {
    const result = await updateSession(session.id, data)
    if (result.success) {
      toastSuccess('Session updated successfully')
      onClose()
    } else {
      toastError(result.message || 'Failed to update session')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Session">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Session Name"
          placeholder="e.g. Academic Year 2024-25"
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />
          <Input
            type="date"
            label="End Date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
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
