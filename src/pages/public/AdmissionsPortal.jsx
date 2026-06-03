import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { 
  User, Users, BookOpen, CheckCircle2, ChevronRight, 
  ChevronLeft, AlertCircle, Info, Copy, Check, ExternalLink,
  MapPin, Phone, Mail, Heart, Calendar, GraduationCap, Loader2
} from 'lucide-react'
import { APP_NAME } from '@/constants/app'
import './AdmissionsPortal.css'

// ── Validation Schema ───────────────────────────────────────────────────────
const applicationSchema = z.object({
  // Step 1: Student Info
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Please select a gender'),
  class_id: z.string().min(1, 'Please select a class'),
  stream: z.string().min(1, 'Please select a stream'),
  joining_type: z.string().min(1, 'Please select joining type'),

  // Step 2: Family & Contact
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode (6 digits)'),
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone number (10 digits)'),
  email: z.string().email('Invalid email address'),
  
  father_name: z.string().min(2, 'Father\'s name is required'),
  father_phone: z.string().regex(/^\d{10}$/, 'Invalid phone number (10 digits)'),
  father_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  
  mother_name: z.string().min(2, 'Mother\'s name is required'),
  mother_phone: z.string().regex(/^\d{10}$/, 'Invalid phone number (10 digits)'),
  mother_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  
  blood_group: z.string().min(1, 'Please select blood group'),
  emergency_contact: z.string().regex(/^\d{10}$/, 'Invalid emergency contact'),
  medical_notes: z.string().optional(),

  // Step 3: Academic Details
  prev_school_name: z.string().min(2, 'Previous school name is required'),
  prev_class: z.string().min(1, 'Last class attended is required'),
  academic_notes: z.string().optional(),
  preferred_section: z.string().optional(),

  // Step 4: Final
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
})

const STEPS = [
  { id: 1, title: 'Student Info', icon: User },
  { id: 2, title: 'Family & Contact', icon: Users },
  { id: 3, title: 'Academic Details', icon: BookOpen },
  { id: 4, title: 'Review', icon: CheckCircle2 },
]

const AdmissionsPortal = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [isClosed, setIsClosed] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      gender: '',
      class_id: '',
      stream: 'Regular',
      joining_type: 'New Admission',
      blood_group: '',
      terms_accepted: false
    }
  })

  useEffect(() => {
    // Fetch sessions and classes
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
          if (!sessionData.online_admission_open) {
            setIsClosed(true)
          }
        } else {
          setIsClosed(true)
        }

        setClasses(classesRes.data?.data || [])
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
        // Mock data for development if needed, but in production we should show closed
        if (import.meta.env.MODE === 'development') {
          setSessions([{ id: 1, name: '2025–26', online_admission_open: true }])
          setClasses([
            { id: 1, name: 'Class 1' },
            { id: 2, name: 'Class 2' },
          ])
        } else {
          setIsClosed(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const stepTitles = {
      1: 'Student Info',
      2: 'Family & Contact',
      3: 'Academic Details',
      4: 'Review & Submit'
    }
    document.title = `Step ${currentStep} – ${stepTitles[currentStep]} | ${APP_NAME} Admissions`
  }, [currentStep])

  const nextStep = async () => {
    let fieldsToValidate = []
    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'date_of_birth', 'gender', 'class_id', 'stream', 'joining_type']
    } else if (currentStep === 2) {
      fieldsToValidate = ['address', 'city', 'state', 'pincode', 'phone', 'email', 'father_name', 'father_phone', 'mother_name', 'mother_phone', 'blood_group', 'emergency_contact']
    } else if (currentStep === 3) {
      fieldsToValidate = ['prev_school_name', 'prev_class']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setApiError(null)
    try {
      const res = await axios.post('/api/applications', data)
      const reference = res.data?.data?.reference_no || `APP-2025-${Math.floor(1000 + Math.random() * 9000)}`
      setSubmittedData({ ...data, reference })
      window.scrollTo(0, 0)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    if (!submittedData?.reference) return
    navigator.clipboard.writeText(submittedData.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="admissions-portal flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="admissions-portal">
        <header className="admissions-header">
          <div className="logo-group">
            <div className="school-logo"><GraduationCap size={24} /></div>
            <h1 className="school-name">{APP_NAME}</h1>
            <span className="badge">Admissions Closed</span>
          </div>
        </header>

        <main className="admissions-content flex flex-col items-center justify-center text-center py-20">
          <div className="h-20 w-20 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-6">
            <AlertCircle size={40} />
          </div>
          <h1 className="font-serif text-3xl mb-4 text-primary">Admissions are Currently Closed</h1>
          <p className="text-text-secondary max-w-md leading-relaxed mb-8">
            Thank you for your interest in {APP_NAME}. Online applications for the upcoming academic session are not being accepted at this moment.
          </p>
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm max-w-sm">
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Contact Us</p>
            <p className="text-sm text-text-secondary">Please visit our campus or contact the administration office for more information about the next admission cycle.</p>
          </div>
          <a href="/" className="btn-ghost mt-10">
            Back to School Website
          </a>
        </main>
      </div>
    )
  }

  if (submittedData) {
    return (
      <div className="admissions-portal">
        <header className="admissions-header">
          <div className="logo-group">
            <div className="school-logo"><GraduationCap size={24} /></div>
            <h1 className="school-name">{APP_NAME}</h1>
            <span className="badge">Admissions 2025–26</span>
          </div>
        </header>

        <main className="admissions-content">
          <div className="success-screen">
            <div className="checkmark-wrapper">
              <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="font-serif">Application Submitted!</h1>
            <p>
              We've received your application for <strong>{submittedData.first_name} {submittedData.last_name}</strong> and will contact you at <strong>{submittedData.email}</strong> within 3–5 working days.
            </p>

            <div className="reference-box">
              <span className="ref-label">Your Application Reference</span>
              <div className="ref-value font-mono">{submittedData.reference}</div>
              <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </div>

            <div className="divider" />

            <div className="success-actions">
              <button onClick={() => window.location.reload()} className="btn-ghost">
                Submit Another Application
              </button>
              <a href="/" className="btn-ghost">
                Back to School Website <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="admissions-portal">
      <header className="admissions-header">
        <div className="logo-group">
          <div className="school-logo"><GraduationCap size={24} /></div>
          <h1 className="school-name">{APP_NAME}</h1>
          <span className="badge">Admissions 2025–26</span>
        </div>
        <a href="/status" className="track-link">Already applied? Track Status →</a>
      </header>

      <div className="admissions-hero">
        <h1 className="font-serif">Online Admission Application</h1>
        <p>Step-by-step. Takes under 5 minutes.</p>
      </div>

      <div className="admissions-progress-wrapper">
        <div className="admissions-progress">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((step) => {
            const Icon = step.icon
            const isCompleted = currentStep > step.id
            const isActive = currentStep === step.id
            
            return (
              <div 
                key={step.id} 
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? <Check size={16} /> : step.id}
                </div>
                <span className="step-label">{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <main className="admissions-content">
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <div className="step-container">
              <div className="admissions-card" style={{ animationDelay: '0ms' }}>
                <span className="card-label">Basic Identity</span>
                <h2 className="card-title font-serif">Student Information</h2>
                <p className="card-subtitle">Please enter the student's legal name as per birth certificate.</p>
                
                <div className="form-grid">
                  <div className={`form-field col-6 ${errors.first_name ? 'error' : ''}`}>
                    <label>First Name <span className="required">*</span></label>
                    <input {...register('first_name')} placeholder="Enter first name" />
                    {errors.first_name && <span className="error-message"><AlertCircle size={12} /> {errors.first_name.message}</span>}
                  </div>
                  <div className={`form-field col-6 ${errors.last_name ? 'error' : ''}`}>
                    <label>Last Name <span className="required">*</span></label>
                    <input {...register('last_name')} placeholder="Enter last name" />
                    {errors.last_name && <span className="error-message"><AlertCircle size={12} /> {errors.last_name.message}</span>}
                  </div>
                  <div className={`form-field col-6 ${errors.date_of_birth ? 'error' : ''}`}>
                    <label>Date of Birth <span className="required">*</span></label>
                    <input type="date" {...register('date_of_birth')} />
                    {errors.date_of_birth && <span className="error-message"><AlertCircle size={12} /> {errors.date_of_birth.message}</span>}
                  </div>
                  <div className={`form-field col-6 ${errors.gender ? 'error' : ''}`}>
                    <label>Gender <span className="required">*</span></label>
                    <select {...register('gender')}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className="error-message"><AlertCircle size={12} /> {errors.gender.message}</span>}
                  </div>
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '100ms' }}>
                <span className="card-label">Applying For</span>
                <h2 className="card-title font-serif">Admission Details</h2>
                
                <div className="form-grid">
                  <div className="form-field col-6">
                    <label>Academic Session</label>
                    <input value={sessions[0]?.name || '2025–26'} readOnly />
                  </div>
                  <div className={`form-field col-6 ${errors.class_id ? 'error' : ''}`}>
                    <label>Class Applying For <span className="required">*</span></label>
                    <select {...register('class_id')}>
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.class_id && <span className="error-message"><AlertCircle size={12} /> {errors.class_id.message}</span>}
                  </div>
                  <div className={`form-field col-6 ${errors.stream ? 'error' : ''}`}>
                    <label>Stream <span className="required">*</span></label>
                    <select {...register('stream')}>
                      <option value="Regular">Regular</option>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                  <div className={`form-field col-6 ${errors.joining_type ? 'error' : ''}`}>
                    <label>Joining Type <span className="required">*</span></label>
                    <select {...register('joining_type')}>
                      <option value="New Admission">New Admission</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-container">
              <div className="admissions-card" style={{ animationDelay: '0ms' }}>
                <span className="card-label">Guardian Contact</span>
                <h2 className="card-title font-serif">Address & Contact</h2>
                
                <div className="form-grid">
                  <div className={`form-field col-12 ${errors.address ? 'error' : ''}`}>
                    <label>Current Address <span className="required">*</span></label>
                    <textarea {...register('address')} rows={2} placeholder="Full street address, locality" />
                    {errors.address && <span className="error-message"><AlertCircle size={12} /> {errors.address.message}</span>}
                  </div>
                  <div className={`form-field col-6 ${errors.city ? 'error' : ''}`}>
                    <label>City <span className="required">*</span></label>
                    <input {...register('city')} />
                  </div>
                  <div className={`form-field col-6 ${errors.state ? 'error' : ''}`}>
                    <label>State <span className="required">*</span></label>
                    <input {...register('state')} />
                  </div>
                  <div className={`form-field col-4 ${errors.pincode ? 'error' : ''}`}>
                    <label>Pincode <span className="required">*</span></label>
                    <input {...register('pincode')} maxLength={6} />
                  </div>
                  <div className={`form-field col-8 ${errors.phone ? 'error' : ''}`}>
                    <label>Phone Number <span className="required">*</span></label>
                    <input {...register('phone')} maxLength={10} />
                  </div>
                  <div className={`form-field col-12 ${errors.email ? 'error' : ''}`}>
                    <label>Student/Primary Email <span className="required">*</span></label>
                    <input {...register('email')} placeholder="email@example.com" />
                    {errors.email && <span className="error-message"><AlertCircle size={12} /> {errors.email.message}</span>}
                  </div>
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '80ms' }}>
                <span className="card-label">Father's Details</span>
                <h2 className="card-title font-serif">Father's Information</h2>
                <div className="form-grid">
                  <div className={`form-field col-6 ${errors.father_name ? 'error' : ''}`}>
                    <label>Father Name <span className="required">*</span></label>
                    <input {...register('father_name')} />
                  </div>
                  <div className={`form-field col-6 ${errors.father_phone ? 'error' : ''}`}>
                    <label>Father Phone <span className="required">*</span></label>
                    <input {...register('father_phone')} maxLength={10} />
                  </div>
                  <div className={`form-field col-12 ${errors.father_email ? 'error' : ''}`}>
                    <label>Father Email</label>
                    <input {...register('father_email')} />
                  </div>
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '160ms' }}>
                <span className="card-label">Mother's Details</span>
                <h2 className="card-title font-serif">Mother's Information</h2>
                <div className="form-grid">
                  <div className={`form-field col-6 ${errors.mother_name ? 'error' : ''}`}>
                    <label>Mother Name <span className="required">*</span></label>
                    <input {...register('mother_name')} />
                  </div>
                  <div className={`form-field col-6 ${errors.mother_phone ? 'error' : ''}`}>
                    <label>Mother Phone <span className="required">*</span></label>
                    <input {...register('mother_phone')} maxLength={10} />
                  </div>
                  <div className={`form-field col-12 ${errors.mother_email ? 'error' : ''}`}>
                    <label>Mother Email</label>
                    <input {...register('mother_email')} />
                  </div>
                </div>
                <div className="info-banner">
                  <Info size={18} className="icon" />
                  <p>At least one parent email is required for portal access and future communication.</p>
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '240ms' }}>
                <span className="card-label">Health & Emergency</span>
                <h2 className="card-title font-serif">Medical Information</h2>
                <div className="form-grid">
                  <div className={`form-field col-4 ${errors.blood_group ? 'error' : ''}`}>
                    <label>Blood Group <span className="required">*</span></label>
                    <select {...register('blood_group')}>
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className={`form-field col-8 ${errors.emergency_contact ? 'error' : ''}`}>
                    <label>Emergency Contact <span className="required">*</span></label>
                    <input {...register('emergency_contact')} maxLength={10} />
                  </div>
                  <div className="form-field col-12">
                    <label>Medical Notes (Optional)</label>
                    <textarea {...register('medical_notes')} rows={2} placeholder="Any allergies, medications, or chronic conditions" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-container">
              <div className="admissions-card" style={{ animationDelay: '0ms' }}>
                <span className="card-label">Previous Education</span>
                <h2 className="card-title font-serif">Academic Background</h2>
                <div className="form-grid">
                  <div className={`form-field col-7 ${errors.prev_school_name ? 'error' : ''}`}>
                    <label>Previous School Name <span className="required">*</span></label>
                    <input {...register('prev_school_name')} />
                  </div>
                  <div className={`form-field col-5 ${errors.prev_class ? 'error' : ''}`}>
                    <label>Last Class Attended <span className="required">*</span></label>
                    <input {...register('prev_class')} />
                  </div>
                  <div className="form-field col-12">
                    <label>Additional Notes</label>
                    <textarea {...register('academic_notes')} rows={3} placeholder="Achievements, special interests, or any gaps in education" />
                  </div>
                  <div className="form-field col-6">
                    <label>Preferred Section (Optional)</label>
                    <input {...register('preferred_section')} />
                  </div>
                </div>
              </div>

              <div className="admissions-card checklist-card" style={{ animationDelay: '80ms' }}>
                <span className="card-label">Required Documents</span>
                <h2 className="card-title font-serif" style={{ color: 'var(--primary)' }}>Document Checklist</h2>
                <p className="card-subtitle" style={{ color: 'var(--primary-light)' }}>Please bring original and copies of these documents during your campus visit.</p>
                
                <div className="checklist-items">
                  {[
                    'Birth Certificate',
                    'Previous Marksheet / Report Card',
                    'Transfer Certificate (Original)',
                    'Passport Photo (2 copies)',
                    'Aadhar Card (Student + Both Parents)'
                  ].map((item, i) => (
                    <div key={i} className="checklist-item">
                      <div className="check-box"><Check size={12} /></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-container">
              <div className="admissions-card" style={{ animationDelay: '0ms' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="card-label">Review Step 1</span>
                    <h2 className="card-title font-serif">Student Info</h2>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(1)} className="btn-ghost">Edit</button>
                </div>
                <div className="form-grid">
                  <SummaryItem label="Full Name" value={`${watch('first_name')} ${watch('last_name')}`} />
                  <SummaryItem label="Gender" value={watch('gender')} />
                  <SummaryItem label="DOB" value={watch('date_of_birth')} />
                  <SummaryItem label="Applying For" value={classes.find(c => c.id == watch('class_id'))?.name || '--'} />
                  <SummaryItem label="Stream" value={watch('stream')} />
                  <SummaryItem label="Joining Type" value={watch('joining_type')} />
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '80ms' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="card-label">Review Step 2</span>
                    <h2 className="card-title font-serif">Family & Contact</h2>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(2)} className="btn-ghost">Edit</button>
                </div>
                <div className="form-grid">
                  <SummaryItem label="Email" value={watch('email')} col="col-12" />
                  <SummaryItem label="Father Name" value={watch('father_name')} />
                  <SummaryItem label="Father Phone" value={watch('father_phone')} />
                  <SummaryItem label="Mother Name" value={watch('mother_name')} />
                  <SummaryItem label="Mother Phone" value={watch('mother_phone')} />
                  <SummaryItem label="City" value={watch('city')} />
                  <SummaryItem label="Pincode" value={watch('pincode')} />
                </div>
              </div>

              <div className="admissions-card" style={{ animationDelay: '160ms' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="card-label">Review Step 3</span>
                    <h2 className="card-title font-serif">Academic History</h2>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(3)} className="btn-ghost">Edit</button>
                </div>
                <div className="form-grid">
                  <SummaryItem label="Prev School" value={watch('prev_school_name')} col="col-8" />
                  <SummaryItem label="Last Class" value={watch('prev_class')} col="col-4" />
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4" style={{ animation: 'cardEnter 0.4s ease-out both', animationDelay: '240ms' }}>
                <label className={`flex items-start gap-3 p-4 rounded-xl border-1.5 transition-all cursor-pointer ${watch('terms_accepted') ? 'border-accent bg-accent-soft' : 'border-border bg-white'}`}>
                  <input 
                    type="checkbox" 
                    {...register('terms_accepted')}
                    className="mt-1 accent-accent"
                  />
                  <span className="text-sm text-text-secondary leading-relaxed">
                    I confirm that all information provided is accurate and true to the best of my knowledge. I understand that any false declaration may lead to cancellation of the application. I agree to the school's admission terms and privacy policy.
                  </span>
                </label>
                {errors.terms_accepted && <span className="error-message px-4"><AlertCircle size={12} /> {errors.terms_accepted.message}</span>}
              </div>

              {apiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-error text-sm mt-4">
                  <AlertCircle size={18} />
                  {apiError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-continue btn-submit mt-6 flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing Application...
                  </>
                ) : 'Submit Final Application'}
              </button>
            </div>
          )}

          <div className="admissions-footer">
            <div className="step-info">
              Step {currentStep} of 4 — {STEPS[currentStep - 1].title}
            </div>
            <div className="nav-buttons">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-back flex items-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
              )}
              {currentStep < 4 && (
                <button type="button" onClick={nextStep} className="btn-continue flex items-center gap-2">
                  Continue <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

const SummaryItem = ({ label, value, col = 'col-6' }) => (
  <div className={`flex flex-col gap-1 ${col}`}>
    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-text-primary">{value || '--'}</span>
  </div>
)

export default AdmissionsPortal
