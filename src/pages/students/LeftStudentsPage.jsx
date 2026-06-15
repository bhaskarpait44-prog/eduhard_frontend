import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Filter, RefreshCw, X, GraduationCap, LogOut, ArrowRightLeft, Download, FileText, FileDown } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as leavingApi from '@/api/studentLeavingApi'
import { getTCData } from '@/api/studentsApi'
import { getClasses } from '@/api/classApi'
import { getSessions } from '@/api/sessionsApi'
import useSessionStore from '@/store/sessionStore'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import TransferCertificateDownload from '@/components/pdf/TransferCertificateDownload'
import { formatDate, labelFromKey, getFileUrl } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import ReadmitModal from '@/components/students/ReadmitModal'
import { downloadBlob } from '@/utils/downloadBlob'

const REASON_OPTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'family_relocation', label: 'Family Relocation' },
  { value: 'fee_default', label: 'Fee Default' },
  { value: 'result_failure', label: 'Result Failure' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

export default function LeftStudentsPage() {
  usePageTitle('Alumni & Leavers')
  const { toastError, toastSuccess } = useToast()
  const navigate = useNavigate()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [students, setStudents] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    leaving_reason: '',
    class_id: '',
    session_id: '',
    from_date: '',
    to_date: '',
  })
  
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [readmitTarget, setReadmitTarget] = useState(null)
  const [selectedTcStudent, setSelectedTcStudent] = useState(null)
  const [tcModalOpen, setTcModalOpen] = useState(false)

  /* auto-select current session */
  useEffect(() => {
    if (!filters.session_id && currentSession?.id) {
      setFilters((p) => ({ ...p, session_id: String(currentSession.id) }))
    }
  }, [currentSession, filters.session_id])

  const fetchMeta = async () => {
    try {
      const [clsRes, sessRes] = await Promise.all([getClasses(), getSessions()])
      fetchCurrentSession().catch(() => {})
      
      const classes = clsRes.data?.classes || clsRes.data || []
      const sessions = sessRes.data?.sessions || sessRes.data || []
      
      setClasses(classes.map(c => ({ value: String(c.id), label: c.name })))
      setSessions(sessions.map(s => ({ value: String(s.id), label: s.name })))
    } catch (err) { toastError('Failed to load filter metadata.') }
  }

  const loadSummary = async () => {
    try {
      const res = await leavingApi.getLeavingSummary()
      setSummary(res.data)
    } catch (err) { console.error('Failed to load summary', err) }
  }

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await leavingApi.getLeftStudents({ ...filters, search, page })
      setStudents(res.data.students)
      setPagination(res.data.pagination)
    } catch (err) {
      toastError(err.message || 'Failed to load students.')
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await leavingApi.downloadLeftStudentsPdf({ ...filters, search })
      // With axios responseType: 'blob' and interceptor returning response.data,
      // 'res' is already the blob.
      downloadBlob(res, `Leavers_List_${filters.session_id || 'All'}.pdf`)
      toastSuccess('PDF downloaded successfully.')
    } catch (err) {
      toastError('Failed to download PDF.')
    } finally { setDownloading(false) }
  }

  useEffect(() => { fetchMeta(); loadSummary() }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => { loadData(1) }, [search, filters.leaving_reason, filters.class_id, filters.session_id, filters.from_date, filters.to_date])

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setFilters({ leaving_reason: '', class_id: '', session_id: '', from_date: '', to_date: '' })
  }

  const handleTcDownload = async (studentId) => {
    try {
      const res = await getTCData(studentId)
      setSelectedTcStudent(res.data)
      setTcModalOpen(true)
    } catch (err) {
      toastError(err.message || 'Failed to load TC data')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Left Students</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage students who have officially left the institution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FileDown} onClick={handleDownload} loading={downloading}>Export PDF</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadData(pagination.page)}>Refresh</Button>
        </div>
      </div>

      {/* Stats Strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Students', value: summary.total_active, icon: Users, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Left This Session', value: summary.left_this_session, icon: LogOut, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Graduated', value: summary.graduated_this_session, icon: GraduationCap, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Re-admissions', value: summary.readmissions_this_session, icon: ArrowRightLeft, color: '#9333ea', bg: '#f5f3ff' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, color: stat.color }}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-[28px] border p-5 space-y-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            options={REASON_OPTIONS}
            placeholder="Leaving Reason"
            value={filters.leaving_reason}
            onChange={(e) => setFilters({ ...filters, leaving_reason: e.target.value })}
          />
          <Select
            options={classes}
            placeholder="Class (at time of leaving)"
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
          />
          <Select
            options={sessions}
            placeholder="Session"
            value={filters.session_id}
            onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
          />
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Date Range:</span>
            <input
              type="date"
              className="px-3 py-1.5 rounded-lg border text-xs outline-none"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>to</span>
            <input
              type="date"
              className="px-3 py-1.5 rounded-lg border text-xs outline-none"
              style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
            />
          </div>
          <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>Clear Filters</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[28px] border overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Student</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Admission No</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Class & Section</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Left Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Reason</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10">
                    <EmptyState icon={LogOut} title="No students found" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {student.photo_url ? (
                          <img src={getFileUrl(student.photo_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.first_name} {student.last_name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{student.session_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{student.admission_no}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {student.class_name} {student.section_name && `(${student.section_name})`}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(student.left_date)}</td>
                  <td className="px-6 py-4">
                    <Badge variant="grey" size="sm">{labelFromKey(student.leaving_reason)}</Badge>
                    {student.leaving_remarks && (
                      <p className="text-[10px] mt-1 truncate max-w-[160px]"
                         title={student.leaving_remarks}
                         style={{ color: 'var(--color-text-muted)' }}>
                        {student.leaving_remarks}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Download TC"
                        onClick={() => handleTcDownload(student.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Download size={16} />
                      </button>
                      <Button variant="ghost" size="xs" onClick={() => navigate(`${ROUTES.STUDENTS}/${student.id}`)}>Profile</Button>
                      <Button variant="primary" size="xs" icon={ArrowRightLeft} onClick={() => setReadmitTarget(student)}>Re-admit</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Showing {students.length} of {pagination.total} students
            </span>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="xs"
                disabled={pagination.page === 1}
                onClick={() => loadData(pagination.page - 1)}
                icon={ChevronLeft}
              />
              <Button
                variant="secondary"
                size="xs"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => loadData(pagination.page + 1)}
                icon={ChevronRight}
              />
            </div>
          </div>
        )}
      </div>

      {readmitTarget && (
        <ReadmitModal
          open
          student={readmitTarget}
          onClose={() => setReadmitTarget(null)}
          onSuccess={() => {
            setReadmitTarget(null)
            loadData(pagination.page)
            toastSuccess('Student re-admitted successfully.')
          }}
        />
      )}
      {/* TC Modal */}
      <Modal
        open={tcModalOpen}
        onClose={() => setTcModalOpen(false)}
        title="Download Transfer Certificate"
        size="lg"
      >
        {selectedTcStudent && (
          <div className="p-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-6">Preview and download the Transfer Certificate for {selectedTcStudent.first_name} {selectedTcStudent.last_name}.</p>
            <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 flex justify-center">
               <TransferCertificateDownload data={selectedTcStudent} />
            </div>
            <div className="mt-8 w-full flex justify-end">
              <Button onClick={() => setTcModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ChevronLeft({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg> }
function ChevronRight({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg> }
