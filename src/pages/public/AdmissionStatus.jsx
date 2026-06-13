import { useState } from 'react'
import api from '@/api/axios'
import {
  Search, ClipboardList, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronLeft, GraduationCap, Loader2, ArrowRight,
  ShieldCheck, Info, User, Mail, Calendar, ExternalLink,
  MapPin, Phone, FileText, Printer, Download
} from 'lucide-react'
import { APP_NAME, ROUTES } from '@/constants/app'
import { formatDate } from '@/utils/helpers'
import './AdmissionsPortal.css'

const AdmissionStatus = () => {
  const [referenceNo, setReferenceNo] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [application, setApplication] = useState(null)
  const [error, setError] = useState(null)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!referenceNo || !email) return

    setLoading(true)
    setError(null)
    setApplication(null)

    try {
      const res = await api.get('/public/applications/status', {
        params: { reference_no: referenceNo, email: email }
      })
      setApplication(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find application. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'admitted':
        return {
          icon: <CheckCircle2 size={56} className="text-emerald-500" />,
          title: 'Admission Finalized',
          color: 'bg-emerald-50 text-emerald-700',
          borderColor: 'border-emerald-100',
          message: 'Welcome to the school! Your admission process is complete. You can now access the student portal using your credentials sent via email.',
          step: 3
        }
      case 'approved':
        return {
          icon: <CheckCircle2 size={56} className="text-blue-500" />,
          title: 'Application Approved',
          color: 'bg-blue-50 text-blue-700',
          borderColor: 'border-blue-100',
          message: 'Congratulations! Your application has been approved. Please visit the school office with original documents to finalize admission.',
          step: 2
        }
      case 'rejected':
        return {
          icon: <XCircle size={56} className="text-rose-500" />,
          title: 'Application Rejected',
          color: 'bg-rose-50 text-rose-700',
          borderColor: 'border-rose-100',
          message: application?.rejection_reason || 'We regret to inform you that your application was not successful at this time. Thank you for your interest.',
          step: 2
        }
      default:
        return {
          icon: <Clock size={56} className="text-amber-500" />,
          title: 'Under Review',
          color: 'bg-amber-50 text-amber-700',
          borderColor: 'border-amber-100',
          message: 'Your application is currently being reviewed by our admissions team. We will notify you once a decision is made.',
          step: 1
        }
    }
  }

  const statusConfig = application ? getStatusConfig(application.status) : null

  return (
    <div className="admissions-portal min-h-screen bg-slate-50">
      <header className="admissions-header shadow-sm">
        <div className="logo-group">
          <div className="school-logo bg-primary text-white p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <h1 className="school-name font-serif text-xl md:text-2xl">{APP_NAME}</h1>
          <span className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
          <span className="text-xs font-black uppercase tracking-tighter text-slate-400 hidden md:block">Admissions Board</span>
        </div>
        <a href={ROUTES.ADMISSIONS} className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>Return to Portal</span>
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {!application ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-4xl font-serif text-slate-900 mb-4">Track Your Application</h2>
              <p className="text-slate-600">Enter your application details below to view your current status and next steps.</p>
            </div>

            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-lg mx-auto">
              <form onSubmit={handleTrack} className="space-y-8">
                <div className="space-y-6">
                  <div className="form-field">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Reference Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <ClipboardList size={18} />
                      </div>
                      <input 
                        type="text"
                        placeholder="e.g. APP-2025-123456"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all outline-none font-mono text-sm font-bold tracking-wider"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Registered Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email"
                        placeholder="Your registered email address"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-bold leading-relaxed">{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Retrieving Application...
                    </>
                  ) : (
                    <>
                      Verify Status <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-slate-400 py-8">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Secure Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Confidential Data</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Timeline Header */}
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                <div className="text-center md:text-left">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Application Status</span>
                  <h2 className="text-3xl font-serif text-slate-900 capitalize">{application.status}</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                    <Printer size={20} />
                  </button>
                  <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                    <Search size={18} /> New Search
                  </button>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="relative pt-8 pb-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${(statusConfig.step / 3) * 100}%` }}
                  />
                </div>

                <div className="relative flex justify-between">
                  {[
                    { label: 'Applied', icon: <FileText size={18} />, sub: formatDate(application.applied_at) },
                    { label: 'Review', icon: <Search size={18} />, sub: 'Verification' },
                    { label: 'Decision', icon: <GraduationCap size={18} />, sub: application.status === 'admitted' ? 'Enrolled' : 'Outcome' }
                  ].map((s, i) => {
                    const active = statusConfig.step >= i + 1
                    const current = statusConfig.step === i + 1
                    return (
                      <div key={i} className="flex flex-col items-center group">
                        <div className={`h-12 w-12 rounded-2xl border-4 border-white flex items-center justify-center transition-all duration-500 shadow-sm z-10 ${
                          active ? 'bg-primary text-white scale-110' : 'bg-slate-100 text-slate-400'
                        } ${current ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}>
                          {s.icon}
                        </div>
                        <div className="mt-4 text-center">
                          <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${active ? 'text-primary' : 'text-slate-400'}`}>{s.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{s.sub}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Decision Result */}
            <div className={`bg-white rounded-[2rem] overflow-hidden border-t-8 ${statusConfig.borderColor} shadow-sm border-x border-b border-slate-100`}>
              <div className={`p-10 text-center border-b border-slate-50 ${statusConfig.color.split(' ')[0]}`}>
                <div className="flex justify-center mb-6">{statusConfig.icon}</div>
                <h3 className="text-2xl font-serif mb-4">{statusConfig.title}</h3>
                <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {statusConfig.message}
                </p>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Application Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><User size={20} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Applicant Name</p>
                        <p className="font-bold text-slate-700">{application.student_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><ShieldCheck size={20} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reference ID</p>
                        <p className="font-mono font-bold text-primary">{application.reference_no}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Placement Information</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Search size={20} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Applying For</p>
                        <p className="font-bold text-slate-700">{application.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Calendar size={20} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Academic Session</p>
                        <p className="font-bold text-slate-700">{application.session_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps / Contact */}
            <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-8">
              <div className="h-16 w-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0">
                <Info size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h5 className="font-bold text-slate-800 mb-2 tracking-tight">Need Assistance?</h5>
                <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                  If you have questions regarding your application or the admission process, please contact our help desk.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a href="tel:+1234567890" className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <Phone size={14} /> Call Support
                </a>
                <a href="mailto:admissions@school.edu" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <Mail size={14} /> Email Office
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 text-center">
        <div className="h-px w-24 bg-slate-200 mx-auto mb-8" />
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} {APP_NAME} Institutional Admissions Board</p>
      </footer>
    </div>
  )
}

export default AdmissionStatus

