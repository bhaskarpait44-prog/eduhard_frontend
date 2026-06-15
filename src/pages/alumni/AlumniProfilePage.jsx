import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Link,
  Heart,
  MessageSquareQuote,
  FileText,
  Calendar,
  ExternalLink,
  Edit,
} from 'lucide-react'

import { alumniApi } from '@/api'
import { ROUTES, ROLES } from '@/constants/app'
import useAuth from '@/hooks/useAuth'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { getFileUrl, getInitials, cn } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AlumniProfileFormModal from '@/components/alumni/AlumniProfileFormModal'

const AlumniProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await alumniApi.getAlumniProfile(id)
      setData(res.data)
    } catch (err) {
      toastError('Failed to fetch alumni profile')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [id, toastError])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  usePageTitle(data ? `${data.student.first_name} ${data.student.last_name} | Alumni Profile` : 'Alumni Profile')

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (!data) return null

  const { student, alumniProfile: profile } = data
  const fullName = `${student.first_name} ${student.last_name || ''}`.trim()
  const batchYear = student.left_date ? new Date(student.left_date).getFullYear() : '--'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-brand transition-colors font-medium text-sm"
        >
          <ChevronLeft size={18} /> Back to Directory
        </button>
        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            icon={Edit}
            onClick={() => setShowEditModal(true)}
          >
            Edit Alumni Data
          </Button>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface border border-border-base rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="h-32 w-32 rounded-3xl bg-surface-raised flex items-center justify-center text-text-muted font-bold text-4xl overflow-hidden shrink-0 border-4 border-white shadow-xl">
            {student.photo_url ? (
              <img src={getFileUrl(student.photo_url)} alt="" className="h-full w-full object-cover" />
            ) : getInitials(fullName)}
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">{fullName}</h1>
              <div className="flex gap-2">
                <Badge variant={student.status === 'graduated' ? 'green' : 'grey'} className="capitalize">
                  {student.status}
                </Badge>
                {profile?.is_mentor_volunteer && (
                  <Badge variant="blue">
                    <Heart size={12} className="mr-1.5" />
                    Mentor Volunteer
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-text-secondary mt-2 flex items-center justify-center md:justify-start gap-2">
              <GraduationCap size={18} className="text-brand" />
              Batch of {batchYear} • Admission No: {student.admission_no}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
              {profile?.contact_email && (
                <a href={`mailto:${profile.contact_email}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors">
                  <Mail size={16} /> {profile.contact_email}
                </a>
              )}
              {profile?.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone size={16} /> {profile.contact_phone}
                </div>
              )}
              {profile?.current_city && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={16} /> {profile.current_city}, {profile.current_country}
                </div>
              )}
              {profile?.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand font-bold hover:underline">
                  <Link size={16} /> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Career Section */}
          <SectionCard title="Career & Occupation" icon={Briefcase}>
            {profile?.current_occupation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem label="Current Status" value={profile.current_occupation.replace(/_/g, ' ')} capitalize />
                  <DetailItem label="Industry" value={profile.industry} />
                  <DetailItem label="Job Title" value={profile.job_title} />
                  <DetailItem label="Company / Institution" value={profile.company_or_institution} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No career information provided.</p>
            )}
          </SectionCard>

          {/* Higher Education Section */}
          <SectionCard title="Higher Education" icon={GraduationCap}>
            {profile?.higher_edu_institution ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Institution" value={profile.higher_edu_institution} />
                <DetailItem label="Course/Degree" value={profile.higher_edu_course} />
                <DetailItem label="Graduation Year" value={profile.higher_edu_year} />
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No higher education information provided.</p>
            )}
          </SectionCard>

          {/* Testimonial Section */}
          <SectionCard title="Testimonial" icon={MessageSquareQuote}>
            {profile?.testimonial ? (
              <div className="relative p-6 bg-surface-raised rounded-2xl border-l-4 border-brand italic text-text-primary text-sm leading-relaxed">
                <MessageSquareQuote size={48} className="absolute -top-2 -right-2 text-brand/5 -rotate-12" />
                "{profile.testimonial}"
                {profile.is_testimonial_public && (
                  <div className="mt-4 flex justify-end">
                    <Badge variant="green" size="xs">Publicly Visible</Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No testimonial provided.</p>
            )}
          </SectionCard>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* School Record */}
          <div className="bg-surface border border-border-base rounded-2xl p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <FileText size={18} className="text-brand" />
              School Record
            </h3>
            <div className="space-y-3">
              <DetailItem label="Admission No" value={student.admission_no} vertical />
              <DetailItem label="Left/Graduated Date" value={student.left_date} vertical />
              <DetailItem label="Leaving Reason" value={student.leaving_reason} vertical />
              <DetailItem label="Leaving Remarks" value={student.leaving_remarks} vertical />
            </div>
          </div>

          {/* Engagement Status */}
          <div className="bg-surface border border-border-base rounded-2xl p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <Heart size={18} className="text-brand" />
              Engagement
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Mentor Volunteer</span>
                <Badge variant={profile?.is_mentor_volunteer ? 'blue' : 'grey'}>
                  {profile?.is_mentor_volunteer ? 'Active' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Profile Updated</span>
                <span className="text-xs font-bold text-text-primary">
                  {profile?.profile_updated_at ? new Date(profile.profile_updated_at).toLocaleDateString() : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-amber-800 mb-3 text-sm">Internal Admin Notes</h3>
              <p className="text-xs text-amber-700 whitespace-pre-wrap leading-relaxed">
                {profile?.admin_notes || 'No internal notes for this alumni.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <AlumniProfileFormModal
          id={id}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchProfile()
          }}
        />
      )}
    </div>
  )
}

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-surface border border-border-base rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="h-9 w-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
        <Icon size={18} />
      </div>
      <h3 className="font-bold text-text-primary">{title}</h3>
    </div>
    {children}
  </div>
)

const DetailItem = ({ label, value, vertical = false, capitalize = false }) => (
  <div className={cn("flex", vertical ? "flex-col gap-0.5" : "items-center justify-between py-2 border-b border-border-base/50 last:border-0")}>
    <span className="text-[11px] text-text-secondary">{label}</span>
    <span className={cn("text-xs font-bold text-text-primary", capitalize && "capitalize")}>
      {value || '--'}
    </span>
  </div>
)

export default AlumniProfilePage
