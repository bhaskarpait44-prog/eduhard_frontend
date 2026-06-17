import { User, MapPin, GraduationCap, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const PreviewGroup = ({ icon: Icon, title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-1 border-b border-dashed border-gray-200 dark:border-gray-700">
      <Icon size={16} className="text-brand" />
      <h4 className="text-sm font-extrabold uppercase tracking-tight text-text-primary">
        {title}
      </h4>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {children}
    </div>
  </div>
)

const PreviewField = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">{label}</p>
    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
      {value || <span className="text-gray-400 italic font-normal">Not provided</span>}
    </p>
  </div>
)

const StepPreview = ({ formData, onBack, onSubmit, isSaving }) => {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-6 space-y-6"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <SectionHeading
          title="Review Admission Details"
          subtitle="Please verify all information before final submission"
        />

        {/* Identity */}
        <PreviewGroup icon={User} title="Student Identity">
          <PreviewField label="Full Name" value={`${formData.first_name} ${formData.last_name}`} />
          <PreviewField label="Admission No" value={formData.admission_no} />
          <PreviewField label="Date of Birth" value={formData.date_of_birth} />
          <PreviewField label="Gender" value={formData.gender?.toUpperCase()} />
          <PreviewField label="Aadhar No" value={formData.aadhar_no} />
          <PreviewField label="Nationality" value={formData.nationality} />
          <PreviewField label="Religion" value={formData.religion} />
          <PreviewField label="Caste" value={formData.caste} />
        </PreviewGroup>

        {/* Enrollment */}
        <PreviewGroup icon={GraduationCap} title="Enrollment & Logistics">
          <PreviewField label="Joining Type" value={formData.joining_type?.replace('_', ' ').toUpperCase()} />
          <PreviewField label="Joining Date" value={formData.joined_date} />
          <PreviewField label="Roll Number" value={formData.roll_number || 'Auto-assign'} />
          <PreviewField label="Medium" value={formData.medium} />
          <PreviewField label="Hostel" value={formData.is_hostel ? 'Yes' : 'No'} />
          <PreviewField label="Distance" value={formData.distance_km ? `${formData.distance_km} km` : null} />
          <PreviewField label="Subjects" value={`${formData.subject_ids?.length || 0} selected`} />
        </PreviewGroup>

        {/* Profile & Contact */}
        <PreviewGroup icon={MapPin} title="Contact & Address">
          <PreviewField label="Email" value={formData.email} />
          <PreviewField label="Phone" value={formData.phone} />
          <PreviewField label="Address" value={formData.address} />
          <PreviewField label="District" value={formData.district} />
          <PreviewField label="PIN" value={formData.pincode} />
        </PreviewGroup>

        {/* Family */}
        <PreviewGroup icon={User} title="Family Details">
          <PreviewField label="Father's Name" value={formData.father_name} />
          <PreviewField label="Father's Occupation" value={formData.father_occupation} />
          <PreviewField label="Father's Phone" value={formData.father_phone} />
          <PreviewField label="Father's Email" value={formData.father_email} />
          <PreviewField label="Mother's Name" value={formData.mother_name} />
          <PreviewField label="Mother's Email" value={formData.mother_email} />
          <PreviewField label="Mother's Phone" value={formData.mother_phone} />
          <PreviewField label="Mother's Aadhaar" value={formData.mother_aadhar} />
          <PreviewField label="Mother's Annual Income" value={formData.mother_annual_income} />
          <PreviewField label="Guardian Name" value={formData.guardian_name} />
        </PreviewGroup>

        {/* Documents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-dashed border-gray-200 dark:border-gray-700">
            <CheckCircle2 size={16} className="text-brand" />
            <h4 className="text-sm font-extrabold uppercase tracking-tight text-text-primary">
              Uploaded Documents
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.files && Object.keys(formData.files).length > 0 ? (
              Object.keys(formData.files).map(key => (
                <div key={key} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                  {key.replace(/_/g, ' ').toUpperCase()}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No documents uploaded</p>
            )}
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex gap-3"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
          <CheckCircle2 className="text-green-600 shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-green-700">Ready to admit</p>
            <p className="text-xs text-green-600 mt-0.5">
              Confirming will create the student record, enrollment, and generate login credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <Button variant="secondary" onClick={onBack}>
          ← Edit Details
        </Button>
        <Button
          onClick={() => onSubmit(formData)}
          loading={isSaving}
          className="shadow-lg shadow-indigo-500/20"
        >
          Confirm & Admit Student
        </Button>
      </div>
    </div>
  )
}

export default StepPreview
