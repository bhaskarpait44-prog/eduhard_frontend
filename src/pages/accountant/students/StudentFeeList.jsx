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
import * as classApi from '@/api/classApi'

const StudentFeeList = () => {
  usePageTitle('Student Fees')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [classes, setClasses] = useState([])
  
  const { students, isLoading, error } = useStudentFees({ 
    search, 
    class_id: classId,
    sort: 'due' 
  })

  useEffect(() => {
    classApi.getClasses().then(res => {
      setClasses(classApi.getClassOptions(res))
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-6" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Student Fee Positions</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Review and manage fee accounts for all active students.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <UserRound size={24} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              onChange={(e) => setClassId(e.target.value)}
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
              <Button variant="secondary" onClick={() => { setSearch(''); setClassId('') }}>Clear Filters</Button>
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
                <tr key={student.id} className="group transition-colors hover:bg-orange-50/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{student.admission_no}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-[11px] font-bold text-orange-700">
                        {student.student_name.charAt(0)}
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
                      backgroundColor: student.fee_status === 'fully_paid' ? '#dcfce7' : '#fef2f2', 
                      color: student.fee_status === 'fully_paid' ? '#15803d' : '#b91c1c' 
                    }}>
                      {String(student.fee_status || '').replace('_', ' ')}
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
          </table>
        )}
      </div>
    </div>
  )
}

export default StudentFeeList
