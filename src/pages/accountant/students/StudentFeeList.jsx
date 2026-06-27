import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, UserRound, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentFees from '@/hooks/useStudentFees'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate } from '@/utils/helpers'
import TableSkeleton from '@/components/ui/TableSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import * as classApi from '@/api/classApi'

const STATUS_STYLES = {
  fully_paid: { bg: '#dcfce7', text: '#15803d' },
  partial:    { bg: '#fef9c3', text: '#a16207' },
  pending:    { bg: '#dcfce7', text: '#15803d' },
  overdue:    { bg: '#fef2f2', text: '#b91c1c' },
  waived:     { bg: '#f1f5f9', text: '#64748b' },
}

const STATUS_LABELS = {
  pending: 'Up to date',
}

const getFeeStatusStyle = (status) => {
  return STATUS_STYLES[status] || { bg: '#fef9c3', text: '#a16207' }
}

const getFeeStatusLabel = (status) => {
  return STATUS_LABELS[status] || String(status || '').replace('_', ' ')
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <UserRound size={24} />
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
                <tr key={student.id} className="group transition-colors hover:bg-indigo-50/15 dark:hover:bg-indigo-950/10" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{student.admission_no}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {(student.student_name || '?').charAt(0)}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{student.student_name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {student.class_name} <span className="opacity-50">{student.section_name ? `• Section ${student.section_name}` : ''}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(student.total_due)}</td>
                  <td className="px-5 py-4 text-sm font-medium text-green-700">{formatCurrency(student.total_paid)}</td>
                  <td className="px-5 py-4 text-sm font-bold" style={{ color: Number(student.balance || 0) > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(student.balance)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>{student.last_payment_date ? formatDate(student.last_payment_date) : '--'}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{ 
                      backgroundColor: getFeeStatusStyle(student.fee_status).bg, 
                      color: getFeeStatusStyle(student.fee_status).text 
                    }}>
                      {getFeeStatusLabel(student.fee_status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.ACCOUNTANT_STUDENT_FEES.replace(':id', student.id))}
                      className="group flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                      style={{ backgroundColor: 'var(--color-brand)' }}
                    >
                      Details
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
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
