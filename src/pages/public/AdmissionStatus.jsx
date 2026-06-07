import { useState } from 'react'
import axios from 'axios'
import { 
  Search, ClipboardList, CheckCircle2, Clock, XCircle, 
  AlertCircle, ChevronLeft, GraduationCap, Loader2, ArrowRight,
  ShieldCheck, Info, User, Mail, Calendar, ExternalLink
} from 'lucide-react'
import { APP_NAME } from '@/constants/app'
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
      const res = await axios.get('/api/public/applications/status', {
        params: { reference_no: referenceNo, email: email }
      })
      setApplication(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find application. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={48} className="text-success" />
      case 'rejected': return <XCircle size={48} className="text-error" />
      default: return <Clock size={48} className="text-brand" />
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved': 
        return "Congratulations! Your application has been approved. Please visit the school office with original documents to finalize admission."
      case 'rejected': 
        return "We regret to inform you that your application was not successful at this time. Thank you for your interest."
      default: 
        return "Your application is currently under review by our admissions board. We will notify you once a final decision is reached."
    }
  }

  return (
    <div className="admissions-portal">
      <header className="admissions-header">
        <div className="logo-group">
          <div className="school-logo"><GraduationCap size={28} /></div>
          <h1 className="school-name font-serif">{APP_NAME}</h1>
          <span className="badge">Status</span>
        </div>
        <a href="/apply" className="track-link">
          <ChevronLeft size={16} /> <span className="text-brand">Back to Portal</span>
        </a>
      </header>

      <section className="admissions-hero">
        <h1 className="font-serif">Track Application</h1>
        <p>Enter your application credentials to check your current admission status.</p>
      </section>

      <main className="admissions-content">
        {!application ? (
          <div className="admissions-card max-w-lg mx-auto">
            <span className="card-label">Verification</span>
            <h2 className="card-title font-serif">Credential Check</h2>
            <p className="card-subtitle">Use the reference number sent to your email.</p>

            <form onSubmit={handleTrack} className="space-y-6">
              <div className="form-field">
                <label>Reference Number</label>
                <input 
                  type="text"
                  placeholder="e.g. APP-2025-123456"
                  className="font-mono"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-field">
                <label>Registered Email</label>
                <input 
                  type="email"
                  placeholder="The email used during application"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="btn-continue w-full justify-center bg-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Locating Record...
                  </>
                ) : (
                  <>
                    Verify & Track <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="admissions-card p-0 overflow-hidden text-center">
              <div className={`p-12 ${
                application.status === 'approved' ? 'bg-emerald-50' : 
                application.status === 'rejected' ? 'bg-red-50' : 'bg-indigo-50'
              }`}>
                <div className="mb-6 flex justify-center">{getStatusIcon(application.status)}</div>
                <h2 className="text-3xl font-serif text-slate-900 mb-3 capitalize">
                  {application.status}
                </h2>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                  {getStatusMessage(application.status)}
                </p>
              </div>

              <div className="p-10">
                <div className="summary-grid text-left">
                  <div className="summary-section">
                    <h4>Applicant</h4>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Full Name</p>
                          <p className="font-bold text-slate-800">{application.student_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Reference</p>
                          <p className="font-mono font-bold text-brand">{application.reference_no}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h4>Program</h4>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Class / Session</p>
                          <p className="font-bold text-slate-800">{application.class_name} ({application.session_name})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Date Applied</p>
                          <p className="font-bold text-slate-800">{formatDate(application.applied_at, 'long')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                  <button 
                    onClick={() => setApplication(null)}
                    className="track-link mx-auto justify-center"
                  >
                    <Search size={18} /> Track another application
                  </button>
                </div>
              </div>
            </div>

            <div className="admissions-card flex items-start gap-6 border-brand/20 bg-brand-light/30">
              <div className="h-12 w-12 bg-white text-brand rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Info size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-1 uppercase text-xs tracking-widest">Administrative Note</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our team reviews applications in the order they are received. Typical processing time is 2-3 business days. Please keep your reference number confidential.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">© {new Date().getFullYear()} {APP_NAME} Institutional Admissions Board</p>
      </footer>
    </div>
  )
}

export default AdmissionStatus
