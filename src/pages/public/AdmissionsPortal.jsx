import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { 
  User, Users, BookOpen, CheckCircle2, ChevronRight, 
  ChevronLeft, AlertCircle, GraduationCap, Loader2,
  Camera, FileText, Upload, Copy, Check, ExternalLink,
  ShieldCheck, Info, Mail, Phone, ArrowRight
} from 'lucide-react'
import { APP_NAME } from '@/constants/app'
import './AdmissionsPortal.css'

// ── Validation Schema ───────────────────────────────────────────────────────
const applicationSchema = z.object({
  first_name: z.string().min(2, 'Required'),
  last_name: z.string().min(2, 'Required'),
  date_of_birth: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  aadhar_no: z.string().optional(),
  nationality: z.string().min(2, 'Required').default('Indian'),
  religion: z.string().min(2, 'Required'),
  caste: z.string().min(1, 'Required'),
  mother_tongue: z.string().min(2, 'Required'),
  identification_marks: z.string().optional(),
  medium: z.string().min(1, 'Required'),
  pen_no: z.string().optional(),
  apaar_id: z.string().optional(),

  class_id: z.string().min(1, 'Required'),
  stream: z.string().min(1, 'Required'),
  joining_type: z.string().min(1, 'Required'),
  is_hostel: z.string().optional(),
  distance_km: z.string().optional(),
  prev_attendance_days: z.string().optional(),

  address: z.string().min(10, 'Too short'),
  village: z.string().optional(),
  police_station: z.string().optional(),
  post_office: z.string().optional(),
  district: z.string().optional(),
  state: z.string().min(2, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid'),

  // Permanent Address
  is_permanent_same: z.boolean().optional().default(false),
  perm_address: z.string().optional(),
  perm_village: z.string().optional(),
  perm_police_station: z.string().optional(),
  perm_post_office: z.string().optional(),
  perm_district: z.string().optional(),
  perm_state: z.string().optional(),
  perm_pincode: z.string().optional(),

  phone: z.string().regex(/^\d{10}$/, 'Invalid'),
  whatsapp_no: z.string().optional(),
  email: z.string().email('Invalid'),

  father_name: z.string().min(2, 'Required'),
  father_phone: z.string().regex(/^\d{10}$/, 'Invalid'),
  father_qualification: z.string().optional(),
  father_aadhar: z.string().optional(),
  father_annual_income: z.string().optional(),

  mother_name: z.string().min(2, 'Required'),
  mother_phone: z.string().regex(/^\d{10}$/, 'Invalid'),
  mother_qualification: z.string().optional(),
  mother_aadhar: z.string().optional(),
  mother_annual_income: z.string().optional(),

  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_relation: z.string().optional(),
  guardian_qualification: z.string().optional(),
  guardian_occupation: z.string().optional(),
  guardian_aadhar: z.string().optional(),
  guardian_annual_income: z.string().optional(),

  blood_group: z.string().min(1, 'Required'),
  emergency_contact: z.string().regex(/^\d{10}$/, 'Invalid'),

  prev_school_name: z.string().optional(),
  prev_class: z.string().optional(),

  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'Please accept terms' }),
  }),
})

const STEPS = [
  { id: 1, title: 'Identity' },
  { id: 2, title: 'Family' },
  { id: 3, title: 'Academic' },
  { id: 4, title: 'Review' },
]

const AdmissionsPortal = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [isClosed, setIsClosed] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [files, setFiles] = useState({
    photo: null, birth_certificate: null, marksheet: null, transfer_certificate: null,
    admit_card: null, pass_certificate: null, registration_certificate: null,
    character_certificate: null, prc: null, caste_certificate: null,
    blood_group_doc: null, aadhar_student: null, aadhar_father: null, aadhar_mother: null
  })

  const {
    register, handleSubmit, trigger, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      gender: '', class_id: '', stream: 'Regular', nationality: 'Indian',
      joining_type: 'New Admission', blood_group: '', terms_accepted: false,
      medium: 'English', caste: 'Gen', is_permanent_same: false
    }
  })

  const formData = watch()
  const isPermanentSame = watch('is_permanent_same')
  const currentAddress = watch(['address', 'village', 'police_station', 'post_office', 'district', 'state', 'pincode'])

  // Sync permanent address if toggle is active
  useEffect(() => {
    if (isPermanentSame) {
      setValue('perm_address', currentAddress[0])
      setValue('perm_village', currentAddress[1])
      setValue('perm_police_station', currentAddress[2])
      setValue('perm_post_office', currentAddress[3])
      setValue('perm_district', currentAddress[4])
      setValue('perm_state', currentAddress[5])
      setValue('perm_pincode', currentAddress[6])
    }
  }, [isPermanentSame, ...currentAddress, setValue])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [sessionRes, classesRes] = await Promise.all([
          axios.get('/api/public/sessions/current'),
          axios.get('/api/public/classes')
        ])
        const sessionData = sessionRes.data?.data
        if (sessionData) {
          setSessions([sessionData])
          if (!sessionData.online_admission_open) setIsClosed(true)
        } else {
          setIsClosed(true)
        }
        setClasses(classesRes.data?.data || [])
      } catch (err) {
        if (import.meta.env.MODE === 'development') {
          setSessions([{ id: 1, name: '2025–26', online_admission_open: true }])
          setClasses([{ id: 1, name: 'Class 1' }, { id: 2, name: 'Class 2' }])
        } else {
          setIsClosed(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const nextStep = async () => {
    let fields = []
    if (currentStep === 1) fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'class_id', 'stream', 'joining_type', 'nationality', 'religion', 'caste', 'mother_tongue', 'medium']
    if (currentStep === 2) fields = ['address', 'state', 'pincode', 'phone', 'email', 'father_name', 'father_phone', 'mother_name', 'mother_phone', 'blood_group', 'emergency_contact']
    if (currentStep === 3) fields = ['prev_school_name', 'prev_class']

    const isValid = await trigger(fields)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      window.scrollTo(0, 0)
    }
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }))
    }
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setApiError(null)
    try {
      const payload = new FormData()
      payload.append('student_data', JSON.stringify(data))
      Object.keys(files).forEach(key => { if (files[key]) payload.append(key, files[key]) })
      const res = await axios.post('/api/applications', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSubmittedData({ ...data, reference: res.data?.data?.reference_no })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="admissions-portal flex items-center justify-center p-20 font-bold">Loading...</div>

  if (isClosed && !submittedData) return (
    <div className="admissions-portal flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Admissions Closed</h1>
        <p className="text-slate-500 mb-8">Please check back later or contact the school office.</p>
        <a href="/status" className="font-bold text-blue-600 underline">Track existing application</a>
      </div>
    </div>
  )

  if (submittedData) return (
    <div className="admissions-portal">
      <div className="success-minimal">
        <CheckCircle2 className="success-icon mx-auto" size={64} />
        <h1 className="text-3xl font-bold">Application Received</h1>
        <p className="mt-4 text-slate-500">Your reference number for future tracking:</p>
        <div className="ref-code">{submittedData.reference}</div>
        <div className="flex flex-col gap-4">
          <button className="btn-primary-clean" onClick={() => window.location.href = '/'}>Back to Home</button>
          <a href="/status" className="text-sm font-bold text-slate-400">TRACK STATUS</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="admissions-portal">
      <header className="admissions-header">
        <div className="logo-group">
          <GraduationCap size={24} className="text-blue-600" />
          <h1 className="school-name">{APP_NAME}</h1>
        </div>
        <a href="/status" className="track-link">TRACK STATUS</a>
      </header>

      <div className="admissions-progress-container">
        <div className="admissions-progress">
          {STEPS.map((step) => (
            <div key={step.id} className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
              <div className="step-circle">{currentStep > step.id ? <Check size={18} /> : step.id}</div>
              <span className="step-label">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <main className="admissions-content">
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">01. Student Identity</h2>
                  <p className="card-subtitle-simple">Basic identification and personal details</p>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field">
                    <label>Name of pupil (In capital letters)</label>
                    <input {...register('first_name')} placeholder="First name" className="uppercase" />
                    {errors.first_name && <span className="error-message">{errors.first_name.message}</span>}
                  </div>
                  <div className="form-field">
                    <label>Last Name (Surname)</label>
                    <input {...register('last_name')} placeholder="Last name" className="uppercase" />
                  </div>
                  <div className="form-field">
                    <label>Date of Birth</label>
                    <input type="date" {...register('date_of_birth')} />
                  </div>
                  <div className="form-field">
                    <label>Aadhar No.</label>
                    <input {...register('aadhar_no')} maxLength={12} placeholder="12-digit number" />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select {...register('gender')}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Nationality</label>
                    <input {...register('nationality')} />
                  </div>
                  <div className="form-field">
                    <label>Religion</label>
                    <select {...register('religion')}>
                      <option value="">Select Religion</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Buddhist">Buddhist</option>
                      <option value="Jain">Jain</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Caste</label>
                    <select {...register('caste')}>
                      <option value="Gen">General</option>
                      <option value="OBC">OBC</option>
                      <option value="ST">ST</option>
                      <option value="SC">SC</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Mother Tongue</label>
                    <input {...register('mother_tongue')} />
                  </div>
                  <div className="form-field">
                    <label>Identification Marks</label>
                    <input {...register('identification_marks')} placeholder="e.g. Mole on left cheek" />
                  </div>
                  <div className="form-field">
                    <label>PEN No.</label>
                    <input {...register('pen_no')} />
                  </div>
                  <div className="form-field">
                    <label>APAAR ID</label>
                    <input {...register('apaar_id')} />
                  </div>
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">02. Academic Program</h2>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field">
                    <label>Admission Sought For Class</label>
                    <select {...register('class_id')}>
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Stream / Category</label>
                    <select {...register('stream')}>
                      <option value="Regular">Regular</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Medium</label>
                    <select {...register('medium')}>
                      <option value="English">English</option>
                      <option value="Assamese">Assamese</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Hostel Facility</label>
                    <select {...register('is_hostel')}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">03. Current Address</h2>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field full-width">
                    <label>Village/Town/Street</label>
                    <input {...register('address')} placeholder="Vill/Locality" />
                  </div>
                  <div className="form-field">
                    <label>Police Station (P.S.)</label>
                    <input {...register('police_station')} />
                  </div>
                  <div className="form-field">
                    <label>Post Office (P.O.)</label>
                    <input {...register('post_office')} />
                  </div>
                  <div className="form-field">
                    <label>District</label>
                    <input {...register('district')} />
                  </div>
                  <div className="form-field">
                    <label>State</label>
                    <input {...register('state')} />
                  </div>
                  <div className="form-field">
                    <label>PIN Code</label>
                    <input {...register('pincode')} maxLength={6} />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="card-header-simple px-0">
                    <h2 className="card-title-simple text-blue-600">04. Permanent Address</h2>
                  </div>
                  <div className="flex items-center gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <input type="checkbox" id="is_permanent_same" {...register('is_permanent_same')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <label htmlFor="is_permanent_same" className="text-sm font-semibold text-slate-700 cursor-pointer">Same as Current Address</label>
                  </div>

                  {!isPermanentSame && (
                    <div className="form-grid-horizontal animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="form-field full-width">
                        <label>Village/Town/Street</label>
                        <input {...register('perm_address')} placeholder="Vill/Locality" />
                      </div>
                      <div className="form-field">
                        <label>Police Station (P.S.)</label>
                        <input {...register('perm_police_station')} />
                      </div>
                      <div className="form-field">
                        <label>Post Office (P.O.)</label>
                        <input {...register('perm_post_office')} />
                      </div>
                      <div className="form-field">
                        <label>District</label>
                        <input {...register('perm_district')} />
                      </div>
                      <div className="form-field">
                        <label>State</label>
                        <input {...register('perm_state')} />
                      </div>
                      <div className="form-field">
                        <label>PIN Code</label>
                        <input {...register('perm_pincode')} maxLength={6} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-grid-horizontal mt-8 pt-6 border-t border-slate-100">
                  <div className="form-field">
                    <label>Contact No.</label>
                    <input {...register('phone')} maxLength={10} />
                  </div>
                  <div className="form-field">
                    <label>WhatsApp No.</label>
                    <input {...register('whatsapp_no')} maxLength={10} />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input {...register('email')} type="email" placeholder="For updates" />
                  </div>
                  <div className="form-field">
                    <label>Blood Group</label>
                    <select {...register('blood_group')}>
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Emergency Contact</label>
                    <input {...register('emergency_contact')} maxLength={10} />
                  </div>
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">05. Parents' Profile</h2>
                </div>
                <div className="form-grid-horizontal border-b pb-4 mb-4">
                  <div className="form-field">
                    <label>Mother's Name</label>
                    <input {...register('mother_name')} />
                  </div>
                  <div className="form-field">
                    <label>Mother's Qualification</label>
                    <input {...register('mother_qualification')} />
                  </div>
                  <div className="form-field">
                    <label>Mother's Phone</label>
                    <input {...register('mother_phone')} maxLength={10} />
                  </div>
                  <div className="form-field">
                    <label>Mother's Aadhar</label>
                    <input {...register('mother_aadhar')} maxLength={12} />
                  </div>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field">
                    <label>Father's Name</label>
                    <input {...register('father_name')} />
                  </div>
                  <div className="form-field">
                    <label>Father's Qualification</label>
                    <input {...register('father_qualification')} />
                  </div>
                  <div className="form-field">
                    <label>Father's Phone</label>
                    <input {...register('father_phone')} maxLength={10} />
                  </div>
                  <div className="form-field">
                    <label>Father's Aadhar</label>
                    <input {...register('father_aadhar')} maxLength={12} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">06. Previous Academic Record</h2>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field full-width">
                    <label>Name of the previous school & location</label>
                    <input {...register('prev_school_name')} />
                  </div>
                  <div className="form-field">
                    <label>Class</label>
                    <input {...register('prev_class')} />
                  </div>
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">07. Documents to be Submitted</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <FileField label="Latest Passport Photo" name="photo" files={files} onChange={handleFileChange} />
                  <FileField label="Birth Certificate" name="birth_certificate" files={files} onChange={handleFileChange} />
                  <FileField label="HSLC Mark Sheet" name="marksheet" files={files} onChange={handleFileChange} />
                  <FileField label="PRC" name="prc" files={files} onChange={handleFileChange} />
                  <FileField label="Caste Certificate" name="caste_certificate" files={files} onChange={handleFileChange} />
                  <FileField label="Student Aadhar Card" name="aadhar_student" files={files} onChange={handleFileChange} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple text-blue-600">08. Review & Submit</h2>
                </div>
                <div className="summary-list mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <SummaryRow label="Student" value={`${formData.first_name} ${formData.last_name}`} />
                  <SummaryRow label="Class" value={classes.find(c => String(c.id) === formData.class_id)?.name} />
                  <SummaryRow label="Gender" value={formData.gender} />
                  <SummaryRow label="DOB" value={formData.date_of_birth} />
                  <SummaryRow label="Aadhar" value={formData.aadhar_no} />
                  <SummaryRow label="Address" value={`${formData.address}, ${formData.district}, ${formData.state}`} />
                  <SummaryRow label="Father" value={formData.father_name} />
                  <SummaryRow label="Mother" value={formData.mother_name} />
                </div>
                
                <div className="mt-10 pt-6 border-t border-slate-100 bg-slate-50 p-6 rounded-xl">
                  <h3 className="font-bold text-slate-800 mb-2">DECLARATION</h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register('terms_accepted')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">I acknowledge and accept the declaration.</span>
                  </label>
                  {errors.terms_accepted && <p className="text-red-500 text-xs mt-2 font-bold">{errors.terms_accepted.message}</p>}
                </div>
                {apiError && <p className="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm font-bold border border-red-100">{apiError}</p>}
              </div>
            </div>
          )}
        </form>
      </main>

      <footer className="admissions-footer">
        {currentStep > 1 ? (
          <button type="button" className="btn-secondary-clean flex items-center gap-2" onClick={() => setCurrentStep(s => s - 1)}>
            <ChevronLeft size={18} /> BACK
          </button>
        ) : <div />}
        
        {currentStep < 4 ? (
          <button type="button" className="btn-primary-clean" onClick={nextStep}>
            CONTINUE <ChevronRight size={18} />
          </button>
        ) : (
          <button type="button" className="btn-primary-clean flex items-center gap-2" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> PROCESSING...</> : <><ShieldCheck size={18} /> SUBMIT APPLICATION</>}
          </button>
        )}
      </footer>
    </div>
  )
}

const FileField = ({ label, name, files, onChange }) => (
  <div className="file-input-wrapper">
    <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">{label}</label>
    <div className={`file-drop-zone ${files[name] ? 'has-file' : ''}`}>
      <input type="file" name={name} onChange={onChange} accept="image/*,application/pdf" id={`file-${name}`} className="hidden" />
      <label htmlFor={`file-${name}`} className="cursor-pointer flex items-center justify-between w-full p-2 text-sm border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 transition-colors">
        <span className="truncate flex-1 pr-2">{files[name]?.name || 'Select file'}</span>
        {files[name] ? <Check size={14} className="text-green-500 shrink-0" /> : <Upload size={14} className="text-slate-400 shrink-0" />}
      </label>
    </div>
  </div>
)

const SummaryRow = ({ label, value }) => (
  <div className="summary-row py-2 border-b border-slate-50 flex justify-between">
    <span className="summary-label text-slate-400 text-sm">{label}</span>
    <span className="summary-value text-slate-700 font-semibold text-sm truncate ml-4">{value || '--'}</span>
  </div>
)

export default AdmissionsPortal
