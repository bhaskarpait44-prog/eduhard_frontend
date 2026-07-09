import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import { createEnrollment } from '@/api/enrollmentsApi'
import { assignSubjects } from '@/api/studentSubjectsApi'
import { ROUTES } from '@/constants/app'
import Button from '@/components/ui/Button'
import StepIdentity from './admit/StepIdentity'
import StepProfile from './admit/StepProfile'
import StepEnrollment from './admit/StepEnrollment'
import StepDocuments from './admit/StepDocuments'
import StepAccess from './admit/StepAccess'
import StepPreview from './admit/StepPreview'
import StepSuccess from './admit/StepSuccess'

const STEPS = [
  { id: 1, label: 'Identity', desc: 'Basic details' },
  { id: 2, label: 'Profile', desc: 'Contact & family' },
  { id: 3, label: 'Enrollment', desc: 'Class assignment' },
  { id: 4, label: 'Documents', desc: 'Upload scans' },
  { id: 5, label: 'Access', desc: 'Login details' },
  { id: 6, label: 'Review', desc: 'Preview & confirm' },
  { id: 7, label: 'Done', desc: 'Admission complete' },
]

const AdmitStudentPage = () => {
  usePageTitle('Admit New Student')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { createStudent } = useAdminStudentStore()
  const { currentSession, fetchCurrentSession, isLoading } = useSessionStore()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [admittedStudent, setAdmitted] = useState(null)
  const [admittedEnrollmentId, setAdmittedEnrollmentId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!currentSession && !isLoading) {
      fetchCurrentSession()
    }
  }, [currentSession, isLoading, fetchCurrentSession])

  // Save wizard state to sessionStorage when partial success occurs
  useEffect(() => {
    if (admittedStudent) {
      const { files, ...formDataWithoutFiles } = formData
      sessionStorage.setItem('partial_admission_state:v1', JSON.stringify({
        formData: formDataWithoutFiles,
        admittedStudent,
        admittedEnrollmentId,
        step
      }))
    } else {
      sessionStorage.removeItem('partial_admission_state:v1')
    }
  }, [admittedStudent, formData, admittedEnrollmentId, step])

  // Restore wizard state on load if present
  useEffect(() => {
    const saved = sessionStorage.getItem('partial_admission_state:v1')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.admittedStudent) {
          const confirmResume = window.confirm(
            `An incomplete admission for ${parsed.admittedStudent.first_name} ${parsed.admittedStudent.last_name} was found. Do you want to resume?`
          )
          if (confirmResume) {
            setFormData(parsed.formData || {})
            setAdmitted(parsed.admittedStudent)
            setAdmittedEnrollmentId(parsed.admittedEnrollmentId || null)
            setStep(parsed.step || 3)
          } else {
            sessionStorage.removeItem('partial_admission_state')
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const goNext = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (admittedStudent && step === 3) return
    setStep(s => s - 1)
  }

  const handleSubmit = async (reviewData) => {
    const allData = { ...formData, ...reviewData }

    // ── Final guard ────────────────────────────────────────────────────
    if (!allData.admission_no?.trim() || !allData.first_name?.trim()) {
      toastError('Critical student data is missing. Please go back and review.')
      return
    }
    if (!allData.class_id || !allData.section_id || !allData.session_id) {
      toastError('Enrollment details are incomplete. Please go back to Step 3.')
      return
    }
    // ── End guard ──────────────────────────────────────────────────────

    setIsSubmitting(true)

    try {
      // Prepare FormData for file uploads
      const payload = new FormData()
      payload.append('admission_no', allData.admission_no)
      payload.append('first_name', allData.first_name)
      payload.append('last_name', allData.last_name)
      payload.append('date_of_birth', allData.date_of_birth)
      payload.append('gender', allData.gender)
      payload.append('aadhar_no', allData.aadhar_no || '')
      
      const profileData = {
        address: allData.address,
        city: allData.city,
        state: allData.state,
        pincode: allData.pincode,
        phone: allData.phone,
        email: allData.email,
        village: allData.village,
        police_station: allData.police_station,
        post_office: allData.post_office,
        district: allData.district,
        nationality: allData.nationality,
        religion: allData.religion,
        caste: allData.caste,
        mother_tongue: allData.mother_tongue,
        identification_marks: allData.identification_marks,
        pen_no: allData.pen_no,
        apaar_id: allData.apaar_id,
        
        father_name: allData.father_name,
        father_phone: allData.father_phone,
        parent_email: allData.parent_email,
        father_occupation: allData.father_occupation,
        father_qualification: allData.father_qualification,
        father_aadhar: allData.father_aadhar,
        father_annual_income: allData.father_annual_income,
        
        mother_name: allData.mother_name,
        mother_phone: allData.mother_phone,
        mother_email: allData.mother_email,
        mother_qualification: allData.mother_qualification,
        mother_aadhar: allData.mother_aadhar,
        mother_annual_income: allData.mother_annual_income,

        mother_occupation: allData.mother_occupation,

        guardian_name: allData.guardian_name,
        guardian_relation: allData.guardian_relation,
        guardian_phone: allData.guardian_phone,
        guardian_qualification: allData.guardian_qualification,
        guardian_occupation: allData.guardian_occupation,
        guardian_aadhar: allData.guardian_aadhar,
        guardian_email: allData.guardian_email,
        medium: allData.medium,
        is_hostel: allData.is_hostel,
        distance_km: allData.distance_km,
        prev_attendance_days: allData.prev_attendance_days,

        is_permanent_same: allData.is_permanent_same,
        perm_address: allData.perm_address,
        perm_village: allData.perm_village,
        perm_police_station: allData.perm_police_station,
        perm_post_office: allData.perm_post_office,
        perm_district: allData.perm_district,
        perm_city: allData.perm_city,
        perm_state: allData.perm_state,
        perm_pincode: allData.perm_pincode,

        emergency_contact: allData.emergency_contact,
        blood_group: allData.blood_group,
        medical_notes: allData.medical_notes,
      }
      payload.append('profile', JSON.stringify(profileData))

      // Append files
      if (allData.files) {
        Object.entries(allData.files).forEach(([key, file]) => {
          if (file) payload.append(key, file)
        })
      }

      let currentStudent = admittedStudent

      if (!currentStudent) {
        const studentResult = await createStudent(payload)

        if (!studentResult.success) {
          toastError(studentResult.message || 'Failed to admit student')
          return
        }
        currentStudent = studentResult.data
        setAdmitted(currentStudent)
      }

      if (!admittedEnrollmentId) {
        const enrollmentResult = await createEnrollment({
          student_id: currentStudent.id,
          session_id: parseInt(allData.session_id, 10),
          class_id: parseInt(allData.class_id, 10),
          section_id: parseInt(allData.section_id, 10),
          stream: allData.stream || null,
          medium: allData.medium,
          is_hostel: allData.is_hostel,
          distance_km: allData.distance_km,
          prev_attendance_days: allData.prev_attendance_days,
          joining_type: allData.joining_type,
          joined_date: allData.joined_date,
          roll_number: allData.roll_number?.trim() || '',
        }).catch(err => ({ error: err }))

        if (enrollmentResult?.error) {
          toastError(enrollmentResult.error.message || 'Student created, but enrollment failed. Please try again.')
          return
        }
        
        // Handle both direct result and result.data depending on API wrapper behavior
        const enrollmentId = enrollmentResult?.id || enrollmentResult?.data?.id
        if (enrollmentId) setAdmittedEnrollmentId(enrollmentId)
      }

      // Assign subjects if selected
      const subjectIds = allData.subject_ids || []
      if (subjectIds.length > 0) {
        const subjectResult = await assignSubjects({
          student_id: currentStudent.id,
          session_id: parseInt(allData.session_id, 10),
          subject_ids: subjectIds,
        }).catch(err => ({ error: err }))

        if (subjectResult?.error) {
          toastError(subjectResult.error.message || 'Subject assignment failed. Please retry or skip and add subjects later.')
          return // STAY ON STEP 6 to allow retry
        }
      }

      setStep(7)
      sessionStorage.removeItem('partial_admission_state')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !currentSession && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Initializing admission portal...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {step < 7 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (admittedStudent && step === 3) return
              step > 1 ? goBack() : navigate(ROUTES.STUDENTS)
            }}
            disabled={admittedStudent && step === 3}
            className={`p-2 rounded-xl transition-colors ${admittedStudent && step === 3 ? 'opacity-30 cursor-not-allowed' : ''}`}
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => { if (!(admittedStudent && step === 3)) e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Admit New Student
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Step {step} of 6 - {STEPS[Math.min(step - 1, 5)]?.desc}
            </p>
          </div>
        </div>
      )}

      {step === 6 && admittedStudent && (
        <div 
          className="p-4 rounded-2xl border flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ 
            backgroundColor: 'var(--color-surface-raised)', 
            borderColor: 'var(--color-brand)',
            color: 'var(--color-text-primary)'
          }}
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-bold">Partial Admission Saved</p>
            <p className="text-xs opacity-80">
              {admittedEnrollmentId 
                ? "Student and enrollment records are saved. Only subject assignment is pending."
                : "Student record is saved, but enrollment is pending."}
              {" "}Back-navigation past Step 3 is disabled to maintain data integrity.
            </p>
          </div>
        </div>
      )}

      {step < 7 && (
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 6).map((s, i) => {
              const isDone = step > s.id
              const isCurrent = step === s.id
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2 group relative z-10">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 transform ${
                        isCurrent ? 'scale-110 shadow-lg shadow-indigo-500/30' : isDone ? 'shadow-md shadow-emerald-500/20' : ''
                      }`}
                      style={{
                        backgroundColor: isDone ? '#10b981' : isCurrent ? 'var(--color-brand)' : 'var(--color-surface-raised)',
                        color: isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                        border: isCurrent ? '2.5px solid #fff' : '1px solid var(--color-border)',
                      }}
                    >
                      {isDone ? <Check size={16} className="text-white" /> : s.id}
                    </div>
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wider hidden md:block text-center transition-colors duration-300"
                      style={{ color: isCurrent ? 'var(--color-brand)' : isDone ? '#10b981' : 'var(--color-text-muted)' }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {i < 5 && (
                    <div
                      className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden relative"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-700 ease-in-out"
                        style={{ width: isDone ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {step === 1 && <StepIdentity defaultValues={formData} onNext={goNext} />}
      {step === 2 && <StepProfile defaultValues={formData} onNext={goNext} onBack={goBack} />}
      {step === 3 && (
        <StepEnrollment
          defaultValues={formData}
          currentSession={currentSession}
          onSubmit={goNext}
          onBack={goBack}
          isPartialSuccess={!!admittedStudent}
        />
      )}
      {step === 4 && (
        <StepDocuments
          defaultValues={formData}
          onBack={goBack}
          onNext={goNext}
          isResuming={!!admittedStudent}
        />
      )}
      {step === 5 && (
        <StepAccess
          defaultValues={formData}
          onBack={goBack}
          onNext={goNext}
        />
      )}
      {step === 6 && (
        <StepPreview
          formData={formData}
          onBack={goBack}
          onSubmit={handleSubmit}
          isSaving={isSubmitting}
        />
      )}
      {step === 7 && (
        <StepSuccess
          student={admittedStudent}
          onViewStudent={() => navigate(`${ROUTES.STUDENTS}/${admittedStudent?.id}`)}
          onAdmitAnother={() => {
            setStep(1)
            setFormData({})
            setAdmitted(null)
            setAdmittedEnrollmentId(null)
            sessionStorage.removeItem('partial_admission_state')
          }}
        />
      )}
    </div>
  )
}

export default AdmitStudentPage
