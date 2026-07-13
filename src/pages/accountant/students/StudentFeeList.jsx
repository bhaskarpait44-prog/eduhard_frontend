import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserRound, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentFees from '@/hooks/useStudentFees'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { feeStatusBadge } from '@/utils/feeStatus'
import TableSkeleton from '@/components/ui/TableSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import * as classApi from '@/api/classApi'

const getFeeStatusLabel = (status) => {
  const labels = { pending: 'Up to date', fully_paid: 'Paid', waived: 'Waived' }
  return labels[status] || String(status || '').replace('_', ' ')
}

const StudentFeeList = () => {
  usePageTitle('Student Fees')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState([])
  const [page, setPage] = useState(1)
  
  const { students, pagination, isLoading, error } = useStudentFees({ 
    search, 
    class_id: classId,
    sort: 'due',
    page,
    limit: 10
  })

  useEffect(() => {
    classApi.getClasses().then(res => {
      setClasses(classApi.getClassOptions(res))
    }).catch(() => {})
  }, [])

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Student Fee Positions</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Review and manage fee accounts for all active students.</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-brand)' }}>
            <UserRound size={22} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); resetPage() }}
              placeholder="Search by student name or admission number..."
              className="w-full rounded-2xl border pl-12 pr-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="w-full sm:w-[240px]">
            <Select
              icon={GraduationCap}
              placeholder="All Classes"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); resetPage() }}
              options={classes}
              containerClassName="!gap-0"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[28px] border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={9} /></div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm font-medium" style={{ color: '#dc2626' }}>
            <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
            {error}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description={search || classId ? "No students match your current search or filter criteria." : "There are no students registered in the current session."}
            icon={UserRound}
            action={search || classId ? (
              <Button variant="secondary" onClick={() => { setSearch(''); setClassId(''); resetPage() }}>Clear Filters</Button>
            ) : null}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                {['Adm No', 'Student Name', 'Class / Section', 'Total Due', 'Total Paid', 'Balance', 'Last Payment', 'Status', 'Actions'].map((head) => (
                  <th key={head} className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="group transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{student.admission_no}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-medium flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                        {(student.student_name || '?').charAt(0)}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.student_name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {student.class_name} <span className="opacity-50">{student.section_name ? `• Section ${student.section_name}` : ''}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(student.total_due)}</td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: 'var(--color-success)' }}>{formatCurrency(student.total_paid)}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: Number(student.balance || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatCurrency(student.balance)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>{student.last_payment_date ? formatDate(student.last_payment_date) : '--'}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={feeStatusBadge(student.fee_status)}>
                      {getFeeStatusLabel(student.fee_status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENT_FEES.replace(':id', student.id))}
                      className="group flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-white transition-all hover:opacity-80"
                      style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                      Details
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)' }}>
                <td colSpan={4} className="px-5 py-4">
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
                  </span>
                </td>
                <td colSpan={5} className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <button 
                      type="button" 
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >‹</button>
                    
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx-1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) => p === '...' ? (
                        <span key={`ell-${idx}`} className="px-2 text-xs text-muted">...</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all"
                          style={{ 
                            borderColor: p === page ? 'var(--color-brand)' : 'var(--color-border)',
                            backgroundColor: p === page ? 'var(--color-brand)' : 'transparent',
                            color: p === page ? '#fff' : 'var(--color-text-primary)'
                          }}
                        >{p}</button>
                      ))
                    }

                    <button 
                      type="button" 
                      disabled={page === pagination.pages} 
                      onClick={() => setPage(p => p + 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border disabled:opacity-30 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >›</button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

export default StudentFeeList
