import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Search, RefreshCw, X, Users, ArrowRightLeft, ChevronLeft, ChevronRight, FileDown } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as leavingApi from '@/api/studentLeavingApi'
import { getClasses } from '@/api/classApi'
import { getSessions } from '@/api/sessionsApi'
import useSessionStore from '@/store/sessionStore'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatPercent, getFileUrl } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import ReadmitModal from '@/components/students/ReadmitModal'
import { downloadBlob } from '@/utils/downloadBlob'

export default function GraduatedStudentsPage() {
  usePageTitle('Graduated Students')
  const { toastError, toastSuccess } = useToast()
  const navigate = useNavigate()
  const { currentSession, fetchCurrentSession } = useSessionStore()

  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    class_id: '',
    session_id: '',
  })
  
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [readmitTarget, setReadmitTarget] = useState(null)

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
      // clsRes.data is { classes: [...], stats: {...} }
      // sessRes.data is [...]
      setClasses((clsRes.data?.classes || []).map(c => ({ value: String(c.id), label: c.name })))
      setSessions((sessRes.data || []).map(s => ({ value: String(s.id), label: s.name })))
    } catch (err) { toastError('Failed to load filter metadata.') }
  }

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await leavingApi.getGraduatedStudents({ ...filters, page })
      setStudents(res.data.students)
      setPagination(res.data.pagination)
    } catch (err) {
      toastError(err.message || 'Failed to load students.')
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await leavingApi.downloadGraduatedStudentsPdf(filters)
      // With axios responseType: 'blob' and interceptor returning response.data,
      // 'res' is already the blob.
      downloadBlob(res, `Graduated_Students_${filters.session_id || 'All'}.pdf`)
      toastSuccess('PDF downloaded successfully.')
    } catch (err) {
      toastError('Failed to download PDF.')
    } finally { setDownloading(false) }
  }

  useEffect(() => { fetchMeta() }, [])
  useEffect(() => { loadData(1) }, [filters.class_id, filters.session_id])

  const handleSearch = (e) => {
    if (e.key === 'Enter') loadData(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', class_id: '', session_id: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Graduated Students</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage students who have completed their final class.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FileDown} onClick={handleDownload} loading={downloading}>Export PDF</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadData(pagination.page)}>Refresh</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[28px] border p-5 flex flex-wrap items-end gap-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or admission no..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
            style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={handleSearch}
          />
        </div>
        <div className="w-[180px]">
          <Select
            options={classes}
            placeholder="Graduated Class"
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
          />
        </div>
        <div className="w-[180px]">
          <Select
            options={sessions}
            placeholder="Graduated Session"
            value={filters.session_id}
            onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
          />
        </div>
        {(filters.search || filters.class_id || filters.session_id) && (
          <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[28px] border overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Student</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Admission No</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Graduated From</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Session</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Percentage</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Grade</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading graduated students...</td></tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10">
                    <EmptyState icon={GraduationCap} title="No students found" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border border-indigo-100">
                        {student.photo_url ? (
                          <img src={getFileUrl(student.photo_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={16} className="text-indigo-400" />
                        )}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.first_name} {student.last_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{student.admission_no}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {student.class_name} {student.section_name && `(${student.section_name})`}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{student.session_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-bold" style={{ color: '#16a34a' }}>{formatPercent(student.percentage)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{student.grade || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
    </div>
  )
}
