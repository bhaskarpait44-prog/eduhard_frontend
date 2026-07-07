// src/pages/academicCalendar/EventFormModal.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Calendar, Clock, Palette, Info, Users, GraduationCap, Send, Globe } from 'lucide-react'
import useAcademicCalendarStore from '@/store/academicCalendarStore'
import useClasses from '@/hooks/useClasses'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { toast } from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const schema = z.object({
  title: z.string().min(3, 'Title is too short').max(200),
  event_type: z.enum(['exam', 'holiday', 'fee_deadline', 'meeting', 'sports', 'cultural', 'result', 'other']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  is_all_day: z.boolean().default(true),
  description: z.string().optional().nullable(),
  audience: z.enum(['everyone', 'students', 'teachers', 'parents', 'staff']).default('everyone'),
  target_class_id: z.any().optional().nullable(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional().nullable(),
  is_published: z.boolean().default(false),
  notify_on_publish: z.boolean().default(false),
}).refine(data => new Date(data.end_date) >= new Date(data.start_date), {
  message: "End date cannot be before start date",
  path: ["end_date"]
}).refine(data => {
  if (data.is_all_day || !data.start_time || !data.end_time) return true
  if (data.start_date === data.end_date) {
    return data.end_time >= data.start_time
  }
  return true
}, {
  message: "End time cannot be before start time on the same day",
  path: ["end_time"]
})

const EVENT_TYPES = [
  { value: 'exam', label: 'Exam' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'fee_deadline', label: 'Fee Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'result', label: 'Result' },
  { value: 'other', label: 'Other' },
]

const AUDIENCE_TYPES = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'parents', label: 'Parents' },
  { value: 'staff', label: 'Staff' },
]

const PRESET_COLORS = [
  '#dc2626', '#16a34a', '#d97706', '#2563eb', 
  '#7c3aed', '#db2777', '#0891b2', '#64748b'
]

const EventFormModal = ({ isOpen, onClose, event, sessionId }) => {
  const { createEvent, updateEvent, isSaving } = useAcademicCalendarStore()
  const { classes, fetchClasses } = useClasses()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      is_all_day: true,
      audience: 'everyone',
      is_published: false,
      notify_on_publish: false,
      color: '#2563eb'
    }
  })

  const isAllDay = watch('is_all_day')
  const audience = watch('audience')
  const isPublished = watch('is_published')
  const currentColor = watch('color')

  // Reset target class if audience changes from students
  useEffect(() => {
    if (audience !== 'students') {
      setValue('target_class_id', '')
    }
  }, [audience, setValue])

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
      if (event) {
        reset({
          ...event,
          target_class_id: event.target_class_id || '',
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          color: event.color || '#2563eb'
        })
      } else {
        reset({
          is_all_day: true,
          audience: 'everyone',
          is_published: false,
          notify_on_publish: false,
          color: '#2563eb',
          start_date: format(new Date(), 'yyyy-MM-dd'),
          end_date: format(new Date(), 'yyyy-MM-dd'),
        })
      }
    }
  }, [isOpen, event, reset])

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      session_id: sessionId,
      target_class_id: data.audience === 'students' && data.target_class_id !== '' ? Number(data.target_class_id) : null,
      start_time: data.is_all_day ? null : data.start_time,
      end_time: data.is_all_day ? null : data.end_time,
    }

    const res = event 
      ? await updateEvent(event.id, payload)
      : await createEvent(payload)

    if (res.success) {
      toast.success(event ? 'Event updated' : 'Event created')
      onClose()
    } else {
      toast.error(res.message)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={event ? 'Edit Academic Event' : 'Create Academic Event'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Event Title"
              placeholder="e.g. Annual Sports Meet 2026"
              error={errors.title?.message}
              {...register('title')}
              autoFocus
            />
          </div>

          <Select
            label="Event Type"
            options={EVENT_TYPES}
            error={errors.event_type?.message}
            {...register('event_type')}
          />

          <Select
            label="Audience"
            options={AUDIENCE_TYPES}
            error={errors.audience?.message}
            {...register('audience')}
          />

          {audience === 'students' && (
            <Select
              label="Target Class (Optional)"
              options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
              error={errors.target_class_id?.message}
              {...register('target_class_id')}
            />
          )}

          <Input
            label="Start Date"
            type="date"
            error={errors.start_date?.message}
            {...register('start_date')}
          />

          <Input
            label="End Date"
            type="date"
            error={errors.end_date?.message}
            {...register('end_date')}
          />

          <div className="sm:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]">
              <input 
                type="checkbox" 
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
                {...register('is_all_day')}
              />
              All Day Event
            </label>
          </div>

          {!isAllDay && (
            <>
              <Input
                label="Start Time"
                type="time"
                error={errors.start_time?.message}
                {...register('start_time')}
              />
              <Input
                label="End Time"
                type="time"
                error={errors.end_time?.message}
                {...register('end_time')}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
              Event Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${currentColor === color ? 'border-black scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input 
                type="color" 
                className="h-8 w-8 rounded-full border-none p-0 cursor-pointer overflow-hidden"
                value={currentColor}
                onChange={(e) => setValue('color', e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
              Description (Optional)
            </label>
            <textarea
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              rows={3}
              placeholder="Provide more details about the event..."
              {...register('description')}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface-raised)] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[var(--color-brand)]" />
              <span className="text-sm font-bold">Publication & Notifications</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" {...register('is_published')} />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-slate-700"></div>
              <span className="ml-3 text-xs font-bold text-[var(--color-text-secondary)]">{isPublished ? 'Published' : 'Draft'}</span>
            </label>
          </div>

          {isPublished && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                <Send size={16} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] cursor-pointer">
                  <input type="checkbox" {...register('notify_on_publish')} className="rounded border-[var(--color-border)] text-[var(--color-brand)]" />
                  Send Push Notification to Audience
                </label>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                  Recipients will be notified immediately upon saving.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {event ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EventFormModal
