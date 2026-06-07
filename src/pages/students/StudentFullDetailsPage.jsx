import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  User, MapPin, Phone, Mail, GraduationCap, 
  ArrowLeft, FileText, Info, ShieldCheck, 
  Heart, Users, BookOpen, Clock, Printer
} from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import { SectionHeading } from './admit/StepIdentity'

const DataField = ({ label, value, highlight, uppercase, capitalize, colSpan = '' }) => (
  <div className={colSpan}>
    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
    <p className={`text-sm font-bold truncate ${highlight ? 'text-indigo-600' : 'text-text-primary'} ${uppercase ? 'uppercase' : ''} ${capitalize ? 'capitalize' : ''}`}>
      {value || '—'}
    </p>
  </div>
)

const StudentFullDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { selectedStudent: student, fetchStudent } = useAdminStudentStore()
  const [loading, setLoading] = useState(true)

  usePageTitle(student ? `${student.first_name} ${student.last_name} - Full Details` : 'Student Full Details')

  useEffect(() => {
    setLoading(true)
    fetchStudent(id)
      .catch(() => {
        toastError('Student not found')
        navigate(ROUTES.STUDENTS)
      })
      .finally(() => setLoading(false))
  }, [id, fetchStudent, navigate, toastError])

  if (loading || !student) return <div className="max-w-5xl mx-auto p-6 animate-pulse"><div className="h-8 w-48 bg-gray-200 rounded mb-6" /><div className="space-y-6"><div className="h-64 bg-gray-100 rounded-2xl" /><div className="h-64 bg-gray-100 rounded-2xl" /></div></div>

  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${ROUTES.STUDENTS}/${id}`)}
            className="p-2 rounded-xl bg-surface border border-border text-text-secondary hover:bg-surface-raised transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Full Admission Profile</h1>
            <p className="text-sm text-text-muted">Comprehensive record for {fullName}</p>
          </div>
        </div>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print Profile</Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* 01. Personal Identity */}
        <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
          <SectionHeading title="01. Student Identity" subtitle="Primary identification and personal markers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-12">
            <DataField label="Admission No" value={student.admission_no} highlight />
            <DataField label="Aadhar No" value={student.aadhar_no} />
            <DataField label="Full Name" value={fullName} uppercase />
            <DataField label="Date of Birth" value={formatDate(student.date_of_birth)} />
            <DataField label="Gender" value={student.gender} capitalize />
            <DataField label="Nationality" value={student.nationality} />
            <DataField label="Religion" value={student.religion} />
            <DataField label="Caste / Category" value={`${student.caste || ''} ${student.category ? `(${student.category})` : ''}`} />
            <DataField label="Mother Tongue" value={student.mother_tongue} />
            <DataField label="Blood Group" value={student.blood_group} />
            <DataField label="Student Email" value={student.email} />
            <DataField label="Parent Login Email" value={student.parent_email} />
            <DataField label="PEN No" value={student.pen_no} />
            <DataField label="APAAR ID" value={student.apaar_id} />
            <DataField label="Identification Marks" value={student.identification_marks} colSpan="sm:col-span-2 md:col-span-4" />
          </div>
        </section>

        {/* 02. Academic Enrollment */}
        <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
          <SectionHeading title="02. Current Enrollment" subtitle="Class assignment and school logistics" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-12">
            <DataField label="Class" value={enrollment?.class} highlight />
            <DataField label="Section" value={enrollment?.section} />
            <DataField label="Roll Number" value={enrollment?.roll_number} />
            <DataField label="Stream" value={enrollment?.stream} capitalize />
            <DataField label="Medium" value={student.medium} />
            <DataField label="Joining Type" value={enrollment?.joining_type?.replace('_', ' ')} capitalize />
            <DataField label="Joined Date" value={formatDate(enrollment?.joined_date)} />
            <DataField label="Hostel Required" value={student.is_hostel ? 'Yes' : 'No'} />
            <DataField label="Distance from School" value={student.distance_km ? `${student.distance_km} km` : 'N/A'} />
            <DataField label="Prev. Year Attendance" value={student.prev_attendance_days ? `${student.prev_attendance_days} days` : 'N/A'} />
            <DataField label="Account Status" value={student.is_active ? 'Active' : 'Suspended'} />
            <DataField label="Enrollment Status" value={student.status} capitalize />
          </div>
        </section>

        {/* 03. Contact & Address */}
        <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
          <SectionHeading title="03. Contact & Address" subtitle="Residential and communication details" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Current Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataField label="Village/Locality" value={student.address} colSpan="sm:col-span-2" />
                <DataField label="Police Station" value={student.police_station} />
                <DataField label="Post Office" value={student.post_office} />
                <DataField label="District" value={student.district} />
                <DataField label="City/Town" value={student.city} />
                <DataField label="State" value={student.state} />
                <DataField label="PIN Code" value={student.pincode} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">Permanent Address</h4>
              {student.is_permanent_same ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-gray-50">
                   <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Same as Current Address</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DataField label="Village/Locality" value={student.perm_address} colSpan="sm:col-span-2" />
                  <DataField label="Police Station" value={student.perm_police_station} />
                  <DataField label="Post Office" value={student.perm_post_office} />
                  <DataField label="District" value={student.perm_district} />
                  <DataField label="City/Town" value={student.city} />
                  <DataField label="State" value={student.perm_state} />
                  <DataField label="PIN Code" value={student.perm_pincode} />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <DataField label="Phone Number" value={student.phone} />
            <DataField label="WhatsApp Number" value={student.whatsapp_no} />
            <DataField label="Student Email" value={student.email} />
            <DataField label="Emergency Contact" value={student.emergency_contact} />
          </div>
        </section>

        {/* 04. Parents Profile */}
        <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-8 print:border-none print:shadow-none">
          <SectionHeading title="04. Family Details" subtitle="Information of Mother, Father and Guardian" />
          
          <div className="space-y-8">
            {/* Mother */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg text-indigo-700 font-bold text-[10px] uppercase tracking-wider">Mother's Particulars</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <DataField label="Name" value={student.mother_name} />
                <DataField label="Phone" value={student.mother_phone} />
                <DataField label="Email" value={student.mother_email} />
                <DataField label="Qualification" value={student.mother_qualification} />
                <DataField label="Aadhar No" value={student.mother_aadhar} />
                <DataField label="Annual Income" value={student.mother_annual_income} />
              </div>
            </div>

            {/* Father */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg text-blue-700 font-bold text-[10px] uppercase tracking-wider">Father's Particulars</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <DataField label="Name" value={student.father_name} />
                <DataField label="Phone" value={student.father_phone} />
                <DataField label="Qualification" value={student.father_qualification} />
                <DataField label="Aadhar No" value={student.father_aadhar} />
                <DataField label="Annual Income" value={student.father_annual_income} />
              </div>
            </div>

            {/* Guardian */}
            {(student.guardian_name || student.guardian_phone) && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-bold text-[10px] uppercase tracking-wider">Guardian Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <DataField label="Guardian Name" value={student.guardian_name} />
                  <DataField label="Relation" value={student.guardian_relation} />
                  <DataField label="Phone" value={student.guardian_phone} />
                  <DataField label="Qualification" value={student.guardian_qualification} />
                  <DataField label="Occupation" value={student.guardian_occupation} />
                  <DataField label="Aadhar No" value={student.guardian_aadhar} />
                  <DataField label="Annual Income" value={student.guardian_annual_income} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 05. Previous Academic Record */}
        {student.previous_academic_records?.length > 0 && (
          <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6 print:border-none print:shadow-none">
            <SectionHeading title="05. Previous Academic Record" subtitle="Details of last schools attended" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-3">School & Location</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-center">Year</th>
                    <th className="px-4 py-3 text-right">Percentage/Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.previous_academic_records.map((rec, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-700">{rec.school_name}{rec.location ? `, ${rec.location}` : ''}</td>
                      <td className="px-4 py-3 text-gray-500 font-medium">{rec.class_name}</td>
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">{rec.year_of_study || '—'}</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-600">{rec.percentage_grade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 06. Digital Documents */}
        <section className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6 print:hidden">
          <SectionHeading title="06. Digital Documents" subtitle="Uploaded files and certificates" />
          {student.documents?.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {student.documents.map(doc => (
                  <div key={doc.id} className="p-3 rounded-xl border border-border bg-gray-50/50 flex items-center justify-between group hover:border-brand transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm"><FileText size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate max-w-[150px]">{doc.name}</p>
                        <p className="text-[9px] font-bold text-text-muted uppercase">{doc.document_type?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <a href={`/${doc.file_path}`} target="_blank" rel="noreferrer" className="p-2 text-text-muted hover:text-brand transition-colors">
                      <Printer size={14} />
                    </a>
                  </div>
                ))}
             </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
               <FileText size={40} className="mx-auto text-gray-200 mb-2" />
               <p className="text-sm font-medium text-gray-400">No documents found for this student.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default StudentFullDetailsPage
