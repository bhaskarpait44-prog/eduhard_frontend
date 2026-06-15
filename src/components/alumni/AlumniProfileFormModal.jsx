import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'

import { alumniApi } from '@/api'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'

const schema = z.object({
  current_occupation:      z.enum(['employed','self_employed','higher_studies','unemployed','other']).optional().or(z.literal('')),
  company_or_institution:  z.string().max(200).optional().or(z.literal('')),
  job_title:               z.string().max(150).optional().or(z.literal('')),
  industry:                z.string().max(100).optional().or(z.literal('')),
  higher_edu_course:       z.string().max(150).optional().or(z.literal('')),
  higher_edu_institution:  z.string().max(200).optional().or(z.literal('')),
  higher_edu_year:         z.coerce.number().int().min(1990).max(2099).optional().or(z.literal(0)).or(z.null()),
  contact_email:           z.string().email().optional().or(z.literal('')),
  contact_phone:           z.string().max(20).optional().or(z.literal('')),
  current_city:            z.string().max(100).optional().or(z.literal('')),
  current_state:           z.string().max(100).optional().or(z.literal('')),
  current_country:         z.string().max(100).optional().or(z.literal('')),
  linkedin_url:            z.string().url().optional().or(z.literal('')),
  is_mentor_volunteer:     z.boolean().default(false),
  testimonial:             z.string().optional().or(z.literal('')),
  is_testimonial_public:   z.boolean().default(false),
  admin_notes:             z.string().optional().or(z.literal('')),
})

const AlumniProfileFormModal = ({ id, onClose, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      is_mentor_volunteer: false,
      is_testimonial_public: false,
      higher_edu_year: 0
    }
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await alumniApi.getAlumniProfile(id)
        if (res.data.alumniProfile) {
          const profile = res.data.alumniProfile
          reset({
            ...profile,
            higher_edu_year: profile.higher_edu_year || 0,
            current_occupation: profile.current_occupation || ''
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [id, reset])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Clean up optional numbers/fields
      const submission = { ...data }
      if (submission.higher_edu_year === 0) submission.higher_edu_year = null
      if (submission.current_occupation === '') submission.current_occupation = null
      
      await alumniApi.upsertAlumniProfile(id, submission)
      toastSuccess('Alumni profile updated successfully')
      onSuccess?.()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border-base">
        {/* Header */}
        <div className="p-6 border-b border-border-base flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Update Alumni Profile</h2>
            <p className="text-xs text-text-secondary">Enter post-graduation details for this student.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-raised rounded-xl transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Body */}
        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Career Information */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-4 border-b border-brand/10 pb-1">Career & Occupation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Current Status</label>
                    <select
                      {...register('current_occupation')}
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self Employed</option>
                      <option value="higher_studies">Higher Studies</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.current_occupation && <p className="text-[10px] text-red-500 ml-1">{errors.current_occupation.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Job Title</label>
                    <input
                      {...register('job_title')}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Company / Institution</label>
                    <input
                      {...register('company_or_institution')}
                      placeholder="Current organization name"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Industry</label>
                    <input
                      {...register('industry')}
                      placeholder="e.g. Technology, Healthcare"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Higher Education */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-4 border-b border-brand/10 pb-1">Higher Education</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Institution</label>
                    <input
                      {...register('higher_edu_institution')}
                      placeholder="University name"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Course / Degree</label>
                    <input
                      {...register('higher_edu_course')}
                      placeholder="e.g. B.Tech Computer Science"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Graduation Year</label>
                    <input
                      type="number"
                      {...register('higher_edu_year')}
                      placeholder="YYYY"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-4 border-b border-brand/10 pb-1">Contact & Social</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Personal Email</label>
                    <input
                      {...register('contact_email')}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Phone Number</label>
                    <input
                      {...register('contact_phone')}
                      placeholder="Current phone"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Current City</label>
                    <input
                      {...register('current_city')}
                      placeholder="e.g. Mumbai"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">LinkedIn URL</label>
                    <input
                      {...register('linkedin_url')}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Engagement & Feedback */}
              <div>
                <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-4 border-b border-brand/10 pb-1">Engagement & Testimonial</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...register('is_mentor_volunteer')}
                        className="rounded border-border-base text-brand focus:ring-brand h-4 w-4"
                      />
                      <span className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">Available as Mentor / Volunteer</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...register('is_testimonial_public')}
                        className="rounded border-border-base text-brand focus:ring-brand h-4 w-4"
                      />
                      <span className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">Make Testimonial Public</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary ml-1">Testimonial</label>
                    <textarea
                      {...register('testimonial')}
                      placeholder="Alumni's feedback or message to current students..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1.5 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <label className="text-xs font-bold text-amber-800 ml-1">Internal Admin Notes (Private)</label>
                    <textarea
                      {...register('admin_notes')}
                      placeholder="Confidential notes about this alumni..."
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border-base bg-surface-raised flex items-center justify-end gap-3 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-form"
            variant="primary"
            icon={Save}
            loading={isSubmitting}
          >
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AlumniProfileFormModal
