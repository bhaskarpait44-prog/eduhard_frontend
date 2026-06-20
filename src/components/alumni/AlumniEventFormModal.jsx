import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Calendar, MapPin, Clock } from 'lucide-react'

import { alumniApi } from '@/api'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  title:       z.string().min(3, 'Title is too short').max(200),
  description: z.string().optional().or(z.literal('')),
  event_date:  z.string().min(1, 'Date is required'),
  event_time:  z.string().optional().or(z.literal('')),
  venue:       z.string().max(300).optional().or(z.literal('')),
  type:        z.enum(['reunion','seminar','felicitation','networking','other']),
  status:      z.enum(['upcoming','completed','cancelled']).default('upcoming'),
})

const AlumniEventFormModal = ({ event, onClose, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEdit = !!event

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'other',
      status: 'upcoming'
    }
  })

  useEffect(() => {
    if (event) {
      reset({
        ...event,
        event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : ''
      })
    }
  }, [event, reset])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (isEdit) {
        await alumniApi.updateAlumniEvent(event.id, data)
        toastSuccess('Event updated successfully')
      } else {
        await alumniApi.createAlumniEvent(data)
        toastSuccess('Event created successfully')
      }
      onSuccess?.()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border-base">
        {/* Header */}
        <div className="p-6 border-b border-border-base flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{isEdit ? 'Edit Alumni Event' : 'Create Alumni Event'}</h2>
            <p className="text-xs text-text-secondary">Plan and schedule engagement activities.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-raised rounded-xl transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Body */}
        <form id="event-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary ml-1">Event Title *</label>
            <input
              {...register('title')}
              placeholder="e.g. Annual Alumni Reunion 2026"
              className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            {errors.title && <p className="text-[10px] text-red-500 ml-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Input
                type="date"
                label={<span className="flex items-center gap-1 text-xs font-bold text-text-secondary"><Calendar size={12} /> Date *</span>}
                error={errors.event_date?.message}
                {...register('event_date')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary ml-1 flex items-center gap-1">
                <Clock size={12} /> Time
              </label>
              <input
                type="time"
                {...register('event_time')}
                className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary ml-1 flex items-center gap-1">
              <MapPin size={12} /> Venue
            </label>
            <input
              {...register('venue')}
              placeholder="Location details"
              className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary ml-1">Type</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="reunion">Reunion</option>
                <option value="seminar">Seminar</option>
                <option value="felicitation">Felicitation</option>
                <option value="networking">Networking</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary ml-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary ml-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Provide more details about the event..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border-base bg-surface-raised flex items-center justify-end gap-3 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-form"
            variant="primary"
            icon={Save}
            loading={isSubmitting}
          >
            {isEdit ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AlumniEventFormModal
