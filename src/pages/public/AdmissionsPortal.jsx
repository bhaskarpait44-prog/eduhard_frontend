import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/api/axios'
import { 
  User, Users, BookOpen, CheckCircle2, ChevronRight, 
  ChevronLeft, AlertCircle, GraduationCap, Loader2,
  Camera, FileText, Upload, Copy, Check, ExternalLink,
  ShieldCheck, Info, Mail, Phone, ArrowRight, Search, X
} from 'lucide-react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/utils/imageUtils'
import { APP_NAME } from '@/constants/app'
import './AdmissionsPortal.css'

// ── Validation Schema ───────────────────────────────────────────────────────
const phoneRegex = /^[6-9]\d{9}$/
const aadharRegex = /^\d{12}$/
const pincodeRegex = /^\d{6}$/

const applicationSchema = z.object({
  // Step 1: Identity
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  aadhar_no: z.string().regex(aadharRegex, 'Enter valid 12-digit Aadhar').optional().or(z.literal('')),
  nationality: z.string().min(1, 'Nationality is required'),
  religion: z.string().min(1, 'Religion is required'),
  caste: z.enum(['Gen', 'OBC', 'ST', 'SC'], { required_error: 'Caste is required' }),
  mother_tongue: z.string().min(1, 'Mother tongue is required'),
  identification_marks: z.string().optional(),
  medium: z.enum(['English', 'Assamese'], { required_error: 'Medium is required' }),
  pen_no: z.string().optional(),
  apaar_id: z.string().optional(),

  // Enrollment
  class_id: z.string().min(1, 'Please select a class'),
  stream: z.string().min(1, 'Please select a stream'),
  joining_type: z.string().min(1, 'Joining type is required'),
  is_hostel: z.enum(['yes', 'no']).default('no'),

  // Step 2: Contact & Family
  address: z.string().min(5, 'Full address is required'),
  village: z.string().min(1, 'Village/Town is required'),
  police_station: z.string().min(1, 'Police station is required'),
  post_office: z.string().min(1, 'Post office is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(pincodeRegex, 'Enter valid 6-digit pincode'),

  // Permanent Address
  is_permanent_same: z.boolean().default(false),
  perm_address: z.string().optional(),
  perm_village: z.string().optional(),
  perm_police_station: z.string().optional(),
  perm_post_office: z.string().optional(),
  perm_district: z.string().optional(),
  perm_state: z.string().optional(),
  perm_pincode: z.string().optional(),

  phone: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile'),
  whatsapp_no: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile').optional().or(z.literal('')),
  email: z.string().email('Invalid student email').optional().or(z.literal('')),

  father_name: z.string().min(1, "Father's name is required"),
  father_phone: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile'),
  father_email: z.string().email('Valid father email is required (for portal access)'),
  father_qualification: z.string().optional(),
  father_aadhar: z.string().regex(aadharRegex, 'Enter valid 12-digit Aadhar').optional().or(z.literal('')),
  father_annual_income: z.string().optional(),

  mother_name: z.string().min(1, "Mother's name is required"),
  mother_phone: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile').optional().or(z.literal('')),
  mother_qualification: z.string().optional(),

  guardian_name: z.string().optional(),
  guardian_phone: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile').optional().or(z.literal('')),
  guardian_relation: z.string().optional(),
  guardian_qualification: z.string().optional(),
  guardian_occupation: z.string().optional(),

  blood_group: z.string().min(1, 'Blood group is required'),
  emergency_contact: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile'),

  // Step 3: Academic
  prev_school_name: z.string().optional(),
  prev_class: z.string().optional(),
  prev_year: z.string().optional(),
  prev_percentage: z.string().optional(),

  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).superRefine((data, ctx) => {
  if (!data.is_permanent_same) {
    if (!data.perm_address) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_address'] });
    if (!data.perm_village) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_village'] });
    if (!data.perm_police_station) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_police_station'] });
    if (!data.perm_post_office) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_post_office'] });
    if (!data.perm_district) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_district'] });
    if (!data.perm_city) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_city'] });
    if (!data.perm_state) ctx.addIssue({ code: 'custom', message: 'Required', path: ['perm_state'] });
    if (!data.perm_pincode || !pincodeRegex.test(data.perm_pincode)) ctx.addIssue({ code: 'custom', message: 'Invalid', path: ['perm_pincode'] });
  }
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
  
  // Cropping
  const [cropModal, setCropModal] = useState(false)
  const [tempPhotoUrl, setTempPhotoUrl] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // Honeypot
  const [hpValue, setHpValue] = useState('')

  const [files, setFiles] = useState({
    photo: null, birth_certificate: null, marksheet: null, transfer_certificate: null,
    admit_card: null, pass_certificate: null, registration_certificate: null,
    character_certificate: null, prc: null, caste_certificate: null,
    blood_group_doc: null, aadhar_student: null, aadhar_father: null
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
          api.get('/public/sessions/current'),
          api.get('/public/classes')
        ])
        const sessionData = sessionRes.data
        if (sessionData) {
          setSessions([sessionData])
          if (!sessionData.online_admission_open) setIsClosed(true)
        } else {
          setIsClosed(true)
        }
        setClasses(classesRes.data || [])
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
    if (currentStep === 1) {
      fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'class_id', 'stream', 'joining_type', 'nationality', 'religion', 'caste', 'mother_tongue', 'medium']
    }
    if (currentStep === 2) {
      fields = [
        'address', 'village', 'police_station', 'post_office', 'district', 'state', 'pincode',
        'phone', 'email', 'father_name', 'father_phone', 'father_email', 'mother_name', 
        'blood_group', 'emergency_contact'
      ]
      if (!isPermanentSame) {
        fields.push('perm_address', 'perm_village', 'perm_police_station', 'perm_post_office', 'perm_district', 'perm_state', 'perm_pincode')
      }
    }
    if (currentStep === 3) {
      fields = ['prev_school_name', 'prev_class']
    }

    const isValid = await trigger(fields)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    if (!selectedFiles || !selectedFiles[0]) return

    const file = selectedFiles[0]
    
    // Passport Photo Special Handling (Crop)
    if (name === 'photo') {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        setTempPhotoUrl(reader.result)
        setCropModal(true)
      }
      return
    }

    // Standard Validation (3MB)
    if (file.size > 3 * 1024 * 1024) {
       return alert(`${file.name} is too large. Max limit is 3MB.`)
    }

    setFiles(prev => ({ ...prev, [name]: file }))
  }

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleSaveCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(tempPhotoUrl, croppedAreaPixels, 50)
      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], 'passport_photo.jpg', { type: 'image/jpeg' })
        setFiles(prev => ({ ...prev, photo: croppedFile }))
        setCropModal(false)
        setTempPhotoUrl(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const onSubmit = async (data) => {
    // Honeypot Check
    if (hpValue) {
      console.warn('Bot detected via honeypot');
      return;
    }

    setIsSubmitting(true)
    setApiError(null)
    try {
      // Structure academic records for backend approval flow
      const studentData = {
        ...data,
        previous_academic_records: data.prev_school_name ? [
          {
            school_name: data.prev_school_name,
            class_name: data.prev_class,
            year_of_study: data.prev_year,
            percentage_grade: data.prev_percentage
          }
        ] : []
      }

      const payload = new FormData()
      payload.append('student_data', JSON.stringify(studentData))
      
      // Auto-Rename and Append Files
      Object.keys(files).forEach(key => { 
        if (files[key]) {
          const ext = files[key].name.split('.').pop()
          const safeName = `${data.first_name}_${data.last_name}_${key}.${ext}`.toUpperCase()
          payload.append(key, files[key], safeName) 
        } 
      })

      const res = await api.post('/applications', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSubmittedData({ ...data, reference: res.data?.reference_no })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Submission failed. Please check all fields.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="admissions-portal flex items-center justify-center p-20 font-bold">Loading Admission Portal...</div>

  if (isClosed && !submittedData) return (
    <div className="admissions-portal flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4 font-serif">Admissions Closed</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">The online admission portal is currently closed for the academic session {sessions[0]?.name}. Please contact the school office for inquiries.</p>
        <div className="flex flex-col gap-4">
          <a href="/status" className="btn-primary-clean w-full">Track Application Status</a>
          <button className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors" onClick={() => window.location.href = '/'}>Return to Home</button>
        </div>
      </div>
    </div>
  )

  if (submittedData) return (
    <div className="admissions-portal flex items-center justify-center p-6">
      <div className="success-minimal max-w-xl bg-white p-12 rounded-3xl shadow-2xl border border-emerald-100">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="text-emerald-500" size={56} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 font-serif">Application Received</h1>
        <p className="mt-6 text-slate-500 leading-relaxed text-lg">Thank you for choosing {APP_NAME}. Your application has been submitted successfully for review.</p>
        
        <div className="mt-10 p-8 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Tracking Reference Number</p>
          <div className="ref-code m-0 font-mono text-3xl font-black text-emerald-600 tracking-wider uppercase">{submittedData.reference}</div>
          <p className="mt-4 text-xs text-slate-400">Please save this reference number. It is required to track your application status.</p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary-clean px-10 py-4 text-base" onClick={() => window.location.href = '/'}>Return to Home</button>
          <a href="/status" className="btn-secondary-clean border border-slate-200 px-10 py-4 text-base flex items-center gap-2 justify-center">
            <Search size={18} /> Track Application
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="admissions-portal">
      {/* Honeypot field - Hidden from users */}
      <input 
        type="text" 
        style={{ display: 'none' }} 
        tabIndex="-1" 
        autoComplete="off"
        value={hpValue}
        onChange={e => setHpValue(e.target.value)}
      />

      <header className="admissions-header">
        <div className="logo-group">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <GraduationCap size={24} className="text-blue-600" />
          </div>
          <h1 className="school-name font-serif text-xl">{APP_NAME} <span className="text-xs font-sans text-slate-400 font-bold ml-2">Admissions {sessions[0]?.name}</span></h1>
        </div>
        <a href="/admissions/status" className="track-link flex items-center gap-2 font-bold text-xs tracking-widest uppercase py-2 px-4 bg-slate-50 rounded-full border border-slate-100 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
          <Search size={14} /> Track Status
        </a>
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
                  <h2 className="card-title-simple font-serif">Student Identity</h2>
                  <p className="card-subtitle-simple">Please enter the details exactly as per official documents.</p>
                </div>
                <div className="form-grid-horizontal">
                  <div className={`form-field ${errors.first_name ? 'error' : ''}`}>
                    <label>Student Name <span className="text-red-500">*</span></label>
                    <input {...register('first_name')} placeholder="Enter student's first name" className="uppercase" />
                    {errors.first_name && <span className="error-message">{errors.first_name.message}</span>}
                  </div>
                  <div className={`form-field ${errors.last_name ? 'error' : ''}`}>
                    <label>Student Surname <span className="text-red-500">*</span></label>
                    <input {...register('last_name')} placeholder="Enter student's surname" className="uppercase" />
                    {errors.last_name && <span className="error-message">{errors.last_name.message}</span>}
                  </div>
                  <div className={`form-field ${errors.date_of_birth ? 'error' : ''}`}>
                    <label>Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" {...register('date_of_birth')} />
                    {errors.date_of_birth && <span className="error-message">{errors.date_of_birth.message}</span>}
                  </div>
                  <div className={`form-field ${errors.gender ? 'error' : ''}`}>
                    <label>Gender <span className="text-red-500">*</span></label>
                    <select {...register('gender')}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className="error-message">{errors.gender.message}</span>}
                  </div>
                  <div className={`form-field ${errors.aadhar_no ? 'error' : ''}`}>
                    <label>Student Aadhar No.</label>
                    <input {...register('aadhar_no')} maxLength={12} placeholder="12-digit UID" />
                    {errors.aadhar_no && <span className="error-message">{errors.aadhar_no.message}</span>}
                  </div>
                  <div className={`form-field ${errors.nationality ? 'error' : ''}`}>
                    <label>Nationality <span className="text-red-500">*</span></label>
                    <input {...register('nationality')} placeholder="e.g. Indian" />
                    {errors.nationality && <span className="error-message">{errors.nationality.message}</span>}
                  </div>
                  <div className={`form-field ${errors.religion ? 'error' : ''}`}>
                    <label>Religion <span className="text-red-500">*</span></label>
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
                    {errors.religion && <span className="error-message">{errors.religion.message}</span>}
                  </div>
                  <div className={`form-field ${errors.caste ? 'error' : ''}`}>
                    <label>Category / Caste <span className="text-red-500">*</span></label>
                    <select {...register('caste')}>
                      <option value="Gen">General</option>
                      <option value="OBC">OBC</option>
                      <option value="ST">ST</option>
                      <option value="SC">SC</option>
                    </select>
                    {errors.caste && <span className="error-message">{errors.caste.message}</span>}
                  </div>
                  <div className={`form-field ${errors.mother_tongue ? 'error' : ''}`}>
                    <label>Mother Tongue <span className="text-red-500">*</span></label>
                    <input {...register('mother_tongue')} placeholder="e.g. Assamese, Bodo, Hindi" />
                    {errors.mother_tongue && <span className="error-message">{errors.mother_tongue.message}</span>}
                  </div>
                  <div className="form-field">
                    <label>Identification Marks</label>
                    <input {...register('identification_marks')} placeholder="e.g. Mole on left cheek" />
                  </div>
                  <div className="form-field">
                    <label>PEN No. (If available)</label>
                    <input {...register('pen_no')} placeholder="Permanent Education Number" />
                  </div>
                  <div className="form-field">
                    <label>APAAR ID (If available)</label>
                    <input {...register('apaar_id')} placeholder="Academic Account Registry" />
                  </div>
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple font-serif">Academic Choice</h2>
                </div>
                <div className="form-grid-horizontal">
                  <div className={`form-field ${errors.class_id ? 'error' : ''}`}>
                    <label>Admission Sought For Class <span className="text-red-500">*</span></label>
                    <select 
                      {...register('class_id')} 
                      onChange={(e) => {
                        const selectedCls = classes.find(c => String(c.id) === e.target.value)
                        if (selectedCls?.stream && selectedCls.stream !== 'regular') {
                          const s = selectedCls.stream.charAt(0).toUpperCase() + selectedCls.stream.slice(1)
                          setValue('stream', s)
                        } else if (selectedCls) {
                          setValue('stream', 'Regular')
                        }
                        register('class_id').onChange(e)
                      }}
                    >
                      <option value="">Select Target Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name} {c.stream && c.stream !== 'regular' ? `(${c.stream.charAt(0).toUpperCase() + c.stream.slice(1)})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.class_id && <span className="error-message">{errors.class_id.message}</span>}
                  </div>
                  <div className={`form-field ${errors.stream ? 'error' : ''}`}>
                    <label>Stream / Category <span className="text-red-500">*</span></label>
                    <select {...register('stream')}>
                      <option value="Regular">Regular</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                    {errors.stream && <span className="error-message">{errors.stream.message}</span>}
                  </div>
                  <div className={`form-field ${errors.medium ? 'error' : ''}`}>
                    <label>Instruction Medium <span className="text-red-500">*</span></label>
                    <select {...register('medium')}>
                      <option value="English">English</option>
                      <option value="Assamese">Assamese</option>
                    </select>
                    {errors.medium && <span className="error-message">{errors.medium.message}</span>}
                  </div>
                  <div className={`form-field ${errors.is_hostel ? 'error' : ''}`}>
                    <label>Hostel Accommodation <span className="text-red-500">*</span></label>
                    <select {...register('is_hostel')}>
                      <option value="no">No, Residential only</option>
                      <option value="yes">Yes, Request Hostel</option>
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
                  <h2 className="card-title-simple font-serif">Residential Details</h2>
                </div>
                <div className="form-grid-horizontal">
                  <div className={`form-field full-width ${errors.address ? 'error' : ''}`}>
                    <label>House No / Street / Locality <span className="text-red-500">*</span></label>
                    <input {...register('address')} placeholder="Complete residential address" />
                    {errors.address && <span className="error-message">{errors.address.message}</span>}
                  </div>
                  <div className={`form-field ${errors.village ? 'error' : ''}`}>
                    <label>Village / Town <span className="text-red-500">*</span></label>
                    <input {...register('village')} placeholder="Village or Town name" />
                    {errors.village && <span className="error-message">{errors.village.message}</span>}
                  </div>
                  <div className={`form-field ${errors.police_station ? 'error' : ''}`}>
                    <label>Police Station (P.S.) <span className="text-red-500">*</span></label>
                    <input {...register('police_station')} placeholder="Local P.S." />
                    {errors.police_station && <span className="error-message">{errors.police_station.message}</span>}
                  </div>
                  <div className={`form-field ${errors.post_office ? 'error' : ''}`}>
                    <label>Post Office (P.O.) <span className="text-red-500">*</span></label>
                    <input {...register('post_office')} placeholder="Local P.O." />
                    {errors.post_office && <span className="error-message">{errors.post_office.message}</span>}
                  </div>
                  <div className={`form-field ${errors.district ? 'error' : ''}`}>
                    <label>District <span className="text-red-500">*</span></label>
                    <input {...register('district')} placeholder="Home District" />
                    {errors.district && <span className="error-message">{errors.district.message}</span>}
                  </div>
                  <div className={`form-field ${errors.state ? 'error' : ''}`}>
                    <label>State <span className="text-red-500">*</span></label>
                    <input {...register('state')} placeholder="e.g. Assam" />
                    {errors.state && <span className="error-message">{errors.state.message}</span>}
                  </div>
                  <div className={`form-field ${errors.pincode ? 'error' : ''}`}>
                    <label>PIN Code <span className="text-red-500">*</span></label>
                    <input {...register('pincode')} maxLength={6} placeholder="6-digit PIN" />
                    {errors.pincode && <span className="error-message">{errors.pincode.message}</span>}
                  </div>
                </div>

                <div className="mt-12">
                  <div className="card-header-simple px-0">
                    <h2 className="card-title-simple font-serif text-lg">Permanent Address</h2>
                  </div>
                  <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-sm">
                    <input type="checkbox" id="is_permanent_same" {...register('is_permanent_same')} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="is_permanent_same" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Permanent address is same as current address</label>
                  </div>

                  {!isPermanentSame && (
                    <div className="form-grid-horizontal animate-in fade-in slide-in-from-top-2 duration-400">
                      <div className={`form-field full-width ${errors.perm_address ? 'error' : ''}`}>
                        <label>House No / Street / Locality <span className="text-red-500">*</span></label>
                        <input {...register('perm_address')} placeholder="Legal permanent address" />
                        {errors.perm_address && <span className="error-message">{errors.perm_address.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_village ? 'error' : ''}`}>
                        <label>Village / Town <span className="text-red-500">*</span></label>
                        <input {...register('perm_village')} placeholder="Permanent village/town" />
                        {errors.perm_village && <span className="error-message">{errors.perm_village.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_police_station ? 'error' : ''}`}>
                        <label>Police Station (P.S.) <span className="text-red-500">*</span></label>
                        <input {...register('perm_police_station')} />
                        {errors.perm_police_station && <span className="error-message">{errors.perm_police_station.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_post_office ? 'error' : ''}`}>
                        <label>Post Office (P.O.) <span className="text-red-500">*</span></label>
                        <input {...register('perm_post_office')} />
                        {errors.perm_post_office && <span className="error-message">{errors.perm_post_office.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_district ? 'error' : ''}`}>
                        <label>District <span className="text-red-500">*</span></label>
                        <input {...register('perm_district')} />
                        {errors.perm_district && <span className="error-message">{errors.perm_district.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_state ? 'error' : ''}`}>
                        <label>State <span className="text-red-500">*</span></label>
                        <input {...register('perm_state')} />
                        {errors.perm_state && <span className="error-message">{errors.perm_state.message}</span>}
                      </div>
                      <div className={`form-field ${errors.perm_pincode ? 'error' : ''}`}>
                        <label>PIN Code <span className="text-red-500">*</span></label>
                        <input {...register('perm_pincode')} maxLength={6} />
                        {errors.perm_pincode && <span className="error-message">{errors.perm_pincode.message}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple font-serif">Parents & Emergency Contact</h2>
                </div>
                <div className="space-y-10">
                  {/* Father */}
                  <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-600 mb-6 flex items-center gap-2">
                      <User size={14} /> Father's Information
                    </h3>
                    <div className="form-grid-horizontal">
                      <div className={`form-field ${errors.father_name ? 'error' : ''}`}>
                        <label>Father's Full Name <span className="text-red-500">*</span></label>
                        <input {...register('father_name')} placeholder="Name as per documents" />
                        {errors.father_name && <span className="error-message">{errors.father_name.message}</span>}
                      </div>
                      <div className={`form-field ${errors.father_phone ? 'error' : ''}`}>
                        <label>Father's Phone No <span className="text-red-500">*</span></label>
                        <input {...register('father_phone')} maxLength={10} placeholder="10-digit mobile" />
                        {errors.father_phone && <span className="error-message">{errors.father_phone.message}</span>}
                      </div>
                      <div className={`form-field ${errors.father_email ? 'error' : ''}`}>
                        <label>Father's Email <span className="text-red-500">*</span></label>
                        <input {...register('father_email')} type="email" placeholder="Required for portal access" />
                        {errors.father_email && <span className="error-message">{errors.father_email.message}</span>}
                      </div>
                      <div className="form-field">
                        <label>Father's Aadhar</label>
                        <input {...register('father_aadhar')} maxLength={12} placeholder="12-digit UID" />
                        {errors.father_aadhar && <span className="error-message">{errors.father_aadhar.message}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Mother */}
                  <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-600 mb-6 flex items-center gap-2">
                      <User size={14} /> Mother's Information
                    </h3>
                    <div className="form-grid-horizontal">
                      <div className={`form-field ${errors.mother_name ? 'error' : ''}`}>
                        <label>Mother's Full Name <span className="text-red-500">*</span></label>
                        <input {...register('mother_name')} placeholder="Legal name" />
                        {errors.mother_name && <span className="error-message">{errors.mother_name.message}</span>}
                      </div>
                      <div className={`form-field ${errors.mother_phone ? 'error' : ''}`}>
                        <label>Mother's Phone No</label>
                        <input {...register('mother_phone')} maxLength={10} placeholder="Optional" />
                        {errors.mother_phone && <span className="error-message">{errors.mother_phone.message}</span>}
                      </div>
                      <div className="form-field">
                        <label>Qualification</label>
                        <input {...register('mother_qualification')} placeholder="e.g. B.A., M.Sc." />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className={`form-field ${errors.phone ? 'error' : ''}`}>
                      <label>Student Phone <span className="text-red-500">*</span></label>
                      <input {...register('phone')} maxLength={10} placeholder="Mobile number" />
                      {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                    </div>
                    <div className={`form-field ${errors.email ? 'error' : ''}`}>
                      <label>Student Email</label>
                      <input type="email" {...register('email')} placeholder="Student email address (optional)" />
                      {errors.email && <span className="error-message">{errors.email.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`form-field ${errors.whatsapp_no ? 'error' : ''}`}>
                      <label>WhatsApp Number</label>
                      <input {...register('whatsapp_no')} maxLength={10} placeholder="WhatsApp number" />
                      {errors.whatsapp_no && <span className="error-message">{errors.whatsapp_no.message}</span>}
                    </div>
                    <div className={`form-field ${errors.blood_group ? 'error' : ''}`}>
                      <label>Blood Group <span className="text-red-500">*</span></label>
                      <select {...register('blood_group')}>
                        <option value="">Select</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                        <option value="Unknown">Don't Know</option>
                      </select>
                      {errors.blood_group && <span className="error-message">{errors.blood_group.message}</span>}
                    </div>
                    <div className={`form-field ${errors.emergency_contact ? 'error' : ''}`}>
                      <label>Emergency Contact <span className="text-red-500">*</span></label>
                      <input {...register('emergency_contact')} maxLength={10} placeholder="Secondary mobile" />
                      {errors.emergency_contact && <span className="error-message">{errors.emergency_contact.message}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple font-serif">Academic Background</h2>
                  <p className="card-subtitle-simple">Information about student's previous education (if any).</p>
                </div>
                <div className="form-grid-horizontal">
                  <div className="form-field full-width">
                    <label>Previous School Name & Location</label>
                    <input {...register('prev_school_name')} placeholder="Enter school name and city" />
                  </div>
                  <div className="form-field">
                    <label>Last Class Attended</label>
                    <input {...register('prev_class')} placeholder="e.g. Class 10" />
                  </div>
                  <div className="form-field">
                    <label>Year of Study</label>
                    <input {...register('prev_year')} placeholder="e.g. 2024" />
                  </div>
                  <div className="form-field">
                    <label>Final % / Grade</label>
                    <input {...register('prev_percentage')} placeholder="e.g. 85% or A+" />
                  </div>
                </div>
              </div>

              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple font-serif">Supporting Documents</h2>
                  <p className="card-subtitle-simple">Upload digital copies for faster processing. Max 3MB per file.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <FileField label="Latest Passport Photo" name="photo" files={files} onChange={handleFileChange} required />
                  <FileField label="Birth Certificate" name="birth_certificate" files={files} onChange={handleFileChange} required />
                  <FileField label="Marksheet / Report Card" name="marksheet" files={files} onChange={handleFileChange} />
                  <FileField label="PRC / Residence Proof" name="prc" files={files} onChange={handleFileChange} />
                  <FileField label="Category Certificate" name="caste_certificate" files={files} onChange={handleFileChange} />
                  <FileField label="Student Aadhar Card" name="aadhar_student" files={files} onChange={handleFileChange} />
                  <FileField label="Father's Aadhar Card" name="aadhar_father" files={files} onChange={handleFileChange} />
                </div>
                <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4 items-start">
                   <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-blue-700 leading-relaxed font-medium">Original documents must be produced at the time of final admission. Please ensure the uploaded scans are clear and legible.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-container">
              <div className="admissions-card">
                <div className="card-header-simple">
                  <h2 className="card-title-simple font-serif text-3xl">Review & Confirmation</h2>
                  <p className="card-subtitle-simple">Please verify all information before final submission.</p>
                </div>
                
                <div className="mt-8 space-y-10">
                  <div className="summary-group">
                    <h3 className="summary-heading">Personal Information</h3>
                    <div className="summary-grid-v2">
                      <SummaryItem label="Full Name" value={`${formData.first_name} ${formData.last_name}`} />
                      <SummaryItem label="Target Class" value={classes.find(c => String(c.id) === formData.class_id)?.name} />
                      <SummaryItem label="Stream" value={formData.stream} />
                      <SummaryItem label="DOB" value={formData.date_of_birth} />
                      <SummaryItem label="Gender" value={formData.gender} />
                      <SummaryItem label="Nationality" value={formData.nationality} />
                    </div>
                  </div>

                  <div className="summary-group">
                    <h3 className="summary-heading">Family & Contact</h3>
                    <div className="summary-grid-v2">
                      <SummaryItem label="Father's Name" value={formData.father_name} />
                      <SummaryItem label="Mother's Name" value={formData.mother_name} />
                      <SummaryItem label="Primary Phone" value={formData.phone} />
                      <SummaryItem label="Contact Email" value={formData.email || 'N/A'} />
                      <SummaryItem label="Blood Group" value={formData.blood_group} />
                    </div>
                  </div>

                  <div className="summary-group">
                    <h3 className="summary-heading">Address</h3>
                    <div className="summary-grid-v2">
                      <SummaryItem label="Current" value={`${formData.address}, ${formData.village}, ${formData.district}, ${formData.state} - ${formData.pincode}`} />
                      <SummaryItem label="Permanent" value={isPermanentSame ? 'Same as Current' : `${formData.perm_address}, ${formData.perm_village}, ${formData.perm_district}, ${formData.perm_state} - ${formData.perm_pincode}`} />
                    </div>
                  </div>

                  <div className="summary-group">
                    <h3 className="summary-heading">Documents Uploaded</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(files).filter(k => files[k]).map(k => (
                        <div key={k} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-2">
                          <Check size={12} /> {k.replace(/_/g, ' ')}
                        </div>
                      ))}
                      {Object.values(files).every(f => !f) && <p className="text-slate-400 text-sm italic">No documents attached</p>}
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
                  <h3 className="text-xl font-serif mb-4 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400" /> Declaration
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    I hereby declare that the information furnished in this application is true, complete and correct to the best of my knowledge and belief. I understand that any false or misleading information will result in the rejection of my application.
                  </p>
                  <label className="flex items-center gap-4 cursor-pointer group p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <input type="checkbox" {...register('terms_accepted')} className="h-6 w-6 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">I acknowledge and accept this declaration <span className="text-red-400">*</span></span>
                  </label>
                  {errors.terms_accepted && <p className="text-red-400 text-xs mt-3 font-bold flex items-center gap-1.5"><AlertCircle size={12} /> {errors.terms_accepted.message}</p>}
                </div>
                {apiError && <p className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake"><AlertCircle size={20} /> {apiError}</p>}
              </div>
            </div>
          )}
        </form>
      </main>

      <footer className="admissions-footer py-8 border-t border-slate-100 bg-slate-50/30">
        {currentStep > 1 ? (
          <button type="button" className="btn-secondary-clean flex items-center gap-3 px-8 py-3 rounded-xl hover:bg-white hover:text-blue-600 transition-all" onClick={() => setCurrentStep(s => s - 1)}>
            <ChevronLeft size={20} /> BACK
          </button>
        ) : <div />}
        
        {currentStep < 4 ? (
          <button type="button" className="btn-primary-clean flex items-center gap-3 px-10 py-4 text-sm tracking-[0.1em]" onClick={nextStep}>
            CONTINUE TO {STEPS[currentStep].title.toUpperCase()} <ChevronRight size={20} />
          </button>
        ) : (
          <button type="button" className="btn-primary-clean flex items-center gap-3 px-10 py-4 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> SUBMITTING...</> : <><ShieldCheck size={20} /> FINALIZE & SUBMIT</>}
          </button>
        )}
      </footer>

      {/* Photo Crop Modal */}
      {cropModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Adjust Passport Photo</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Drag to position, scroll to zoom. Will be auto-compressed to 50KB.</p>
              </div>
              <button onClick={() => { setCropModal(false); setTempPhotoUrl(null) }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative h-[400px] bg-slate-50">
              <Cropper
                image={tempPhotoUrl}
                crop={crop}
                zoom={zoom}
                aspect={3/4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                  onClick={() => { setCropModal(false); setTempPhotoUrl(null) }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="flex-[2] py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  onClick={handleSaveCrop}
                >
                  <Check size={20} /> Apply & Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FileField = ({ label, name, files, onChange, required }) => (
  <div className="file-input-wrapper space-y-2">
    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-widest ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className={`file-drop-zone ${files[name] ? 'has-file' : ''}`}>
      <input type="file" name={name} onChange={onChange} accept="image/*,application/pdf" id={`file-${name}`} className="hidden" />
      <label htmlFor={`file-${name}`} className={`cursor-pointer flex items-center justify-between w-full h-14 px-4 border-2 border-dashed rounded-2xl transition-all group ${files[name] ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:shadow transition-all">
            {files[name] ? <FileText size={16} className="text-emerald-500" /> : <Upload size={16} className="text-slate-400 group-hover:text-blue-500" />}
          </div>
          <span className={`truncate text-xs font-bold ${files[name] ? 'text-emerald-700' : 'text-slate-600 group-hover:text-blue-600'}`}>{files[name]?.name || 'Choose file…'}</span>
        </div>
        {files[name] && <CheckCircle2 size={16} className="text-emerald-500 shrink-0 animate-in zoom-in duration-300" />}
      </label>
    </div>
  </div>
)

const SummaryItem = ({ label, value }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{label}</p>
    <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed">{value || '--'}</p>
  </div>
)

export default AdmissionsPortal
