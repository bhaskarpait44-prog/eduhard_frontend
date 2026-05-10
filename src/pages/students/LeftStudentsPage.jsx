import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Filter, RefreshCw, X, GraduationCap, LogOut, ArrowRightLeft } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import * as leavingApi from '@/api/studentLeavingApi'
import { getClasses } from '@/api/classApi'
import { getSessions } from '@/api/sessions'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, labelFromKey } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import ReadmitModal from '@/components/students/ReadmitModal'

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

  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    leaving_reason: '',
    class_id: '',
    session_id: '',
    from_date: '',
    to_date: '',
  })
  
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [readmitTarget, setReadmitTarget] = useState(null)

  const fetchMeta = async () => {
    try {
      const [clsRes, sessRes] = await Promise.all([getClasses(), getSessions()])
      setClasses((clsRes.data || []).map(c => ({ value: String(c.id), label: c.name })))
      setSessions((sessRes.data || []).map(s => ({ value: String(s.id), label: s.name })))
    } catch (err) { toastError('Failed to load filter metadata.') }
  }

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await leavingApi.getLeftStudents({ ...filters, page })
      setStudents(res.data.students)
      setPagination(res.data.pagination)
    } catch (err) {
      toastError(err.message || 'Failed to load students.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchMeta() }, [])
  useEffect(() => { loadData(1) }, [filters.leaving_reason, filters.class_id, filters.session_id, filters.from_date, filters.to_date])

  const handleSearch = (e) => {
    if (e.key === 'Enter') loadData(1)
  }

  const clearFilters = () => {
    setFilters({ search: '', leaving_reason: '', class_id: '', session_id: '', from_date: '', to_date: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Left Students</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage students who have officially left the institution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadData(pagination.page)}>Refresh</Button>
        </div>
      </div>

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
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={handleSearch}
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
                          <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
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
                  </td>
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

function ChevronLeft({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg> }
function ChevronRight({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg> }
