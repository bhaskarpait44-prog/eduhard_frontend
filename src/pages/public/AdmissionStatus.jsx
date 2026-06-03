import { useState } from 'react'
import axios from 'axios'
import { 
  Search, ClipboardList, CheckCircle2, Clock, XCircle, 
  AlertCircle, ChevronLeft, GraduationCap, Loader2, ArrowRight
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
      case 'approved': return <CheckCircle2 className="text-emerald-500" size={48} />
      case 'rejected': return <XCircle className="text-red-500" size={48} />
      default: return <Clock className="text-amber-500" size={48} />
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved': 
        return "Congratulations! Your application has been approved. Please visit the school office with original documents to finalize admission."
      case 'rejected': 
        return "We regret to inform you that your application was not successful at this time. Thank you for your interest."
      default: 
        return "Your application is currently under review by our admissions team. We will notify you once a decision is made."
    }
  }

  return (
    <div className="admissions-portal min-h-screen bg-slate-50">
      <header className="admissions-header shadow-sm bg-white">
        <div className="logo-group">
          <div className="school-logo"><GraduationCap size={24} /></div>
          <h1 className="school-name">{APP_NAME}</h1>
          <span className="badge">Status Tracker</span>
        </div>
        <a href="/admissions" className="track-link flex items-center gap-1">
          <ChevronLeft size={16} /> Back to Portal
        </a>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {!application ? (
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={32} />
              </div>
              <h2 className="text-3xl font-serif text-slate-900 mb-2">Track Application</h2>
              <p className="text-slate-500">Enter your details to check the current status of your admission.</p>
            </div>

            <form onSubmit={handleTrack} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Reference Number</label>
                <input 
                  type="text"
                  placeholder="e.g. APP-2025-123456"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Registered Email</label>
                <input 
                  type="email"
                  placeholder="The email used during application"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Tracking...
                  </>
                ) : (
                  <>
                    Check Status <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-xl">
              <div className={`p-10 text-center ${
                application.status === 'approved' ? 'bg-emerald-50' : 
                application.status === 'rejected' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                <div className="mb-4 flex justify-center">{getStatusIcon(application.status)}</div>
                <h3 className="text-2xl font-serif text-slate-900 mb-2 capitalize">
                  Status: {application.status}
                </h3>
                <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                  {getStatusMessage(application.status)}
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</p>
                    <p className="font-bold text-slate-800">{application.student_name}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference No</p>
                    <p className="font-mono font-bold text-indigo-600">{application.reference_no}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class / Session</p>
                    <p className="font-bold text-slate-800">{application.class_name} ({application.session_name})</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Applied</p>
                    <p className="font-bold text-slate-800">{formatDate(application.applied_at, 'long')}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-center">
                  <button 
                    onClick={() => setApplication(null)}
                    className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
                  >
                    <Search size={16} /> Track another application
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-start gap-4">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardList size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Next Steps</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If your status is approved, please ensure you have your original Birth Certificate, Previous Marksheets, and Aadhar copies ready for verification at the campus.
                </p>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} {APP_NAME} Institutional Admissions. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}

export default AdmissionStatus
