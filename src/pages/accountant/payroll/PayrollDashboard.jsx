import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import usePayrollStore from '@/store/payrollStore'
import { 
  Banknote, 
  Settings2, 
  Search,
  CheckCircle2,
  CalendarDays,
  FileText,
  Play,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Printer
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import PayslipPrint from '@/components/accountant/PayslipPrint'
import { formatCurrency, formatDate } from '@/utils/helpers'

const StatCard = ({ label, value, sub, accent, icon: Icon }) => (
  <div className="rounded-[24px] border p-4 flex flex-col gap-1" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      {Icon && <Icon size={14} style={{ color: accent || 'var(--color-text-muted)' }} />}
    </div>
    <span className="text-xl font-bold leading-tight truncate" style={{ color: accent || 'var(--color-text-primary)' }}>{value}</span>
    {sub && <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>}
  </div>
)

export default function PayrollDashboard() {
  usePageTitle('Salary & Payroll')
  const { toastSuccess, toastError } = useToast()
  const { 
    structures, payrolls, isLoading, 
    fetchStructures, updateStructure, 
    fetchPayrolls, generatePayroll, markPaid,
    fetchPayslip
  } = usePayrollStore()

  const [activeTab, setActiveTab] = useState('payroll') // 'payroll' | 'structures'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [structModalOpen, setStructModalOpen] = useState(false)
  const [editingStruct, setEditingStruct] = useState(null)
  
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payingRecord, setPayingRecord] = useState(null)
  const [payForm, setPayForm] = useState({ payment_mode: 'Bank Transfer', payment_date: new Date().toISOString().split('T')[0], remarks: '' })

  const [viewPayslip, setViewPayslip] = useState(null)

  useEffect(() => {
    if (activeTab === 'structures') fetchStructures()
    if (activeTab === 'payroll') fetchPayrolls(selectedMonth, selectedYear)
  }, [activeTab, selectedMonth, selectedYear, fetchStructures, fetchPayrolls])

  const filteredStructures = useMemo(() => {
    if (!searchQuery) return structures
    const q = searchQuery.toLowerCase()
    return structures.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.employee_id?.toLowerCase().includes(q)
    )
  }, [structures, searchQuery])

  const filteredPayrolls = useMemo(() => {
    if (!searchQuery) return payrolls
    const q = searchQuery.toLowerCase()
    return payrolls.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.employee_id?.toLowerCase().includes(q) ||
      p.receipt_no?.toLowerCase().includes(q)
    )
  }, [payrolls, searchQuery])

  const summary = useMemo(() => {
    const total = payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const paid = payrolls.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_salary || 0), 0)
    const pending = total - paid
    return { total, paid, pending, count: payrolls.length, paidCount: payrolls.filter(p => p.status === 'paid').length }
  }, [payrolls])

  // Handlers
  const handleStructSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateStructure(editingStruct.staff_id, {
        ...editingStruct,
        type: editingStruct.type
      })
      toastSuccess('Salary structure updated')
      setStructModalOpen(false)
    } catch (err) {
      toastError(err.message || 'Failed to update structure')
    }
  }

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${selectedMonth}/${selectedYear}?`)) return
    try {
      await generatePayroll(selectedMonth, selectedYear)
      toastSuccess('Payroll generated successfully')
    } catch (err) {
      toastError(err.message || 'Failed to generate payroll')
    }
  }

  const handlePaySubmit = async (e) => {
    e.preventDefault()
    try {
      await markPaid(payingRecord.id, payForm, selectedMonth, selectedYear)
      toastSuccess('Salary marked as paid')
      setPayModalOpen(false)
    } catch (err) {
      toastError(err.message || 'Failed to mark as paid')
    }
  }

  const handleViewPayslip = async (id) => {
    try {
      const data = await fetchPayslip(id)
      setViewPayslip(data)
    } catch (err) {
      toastError(err.message || 'Failed to load payslip')
    }
  }

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1]
  }, [])

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[28px] border p-4 shadow-sm" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex p-1 bg-surface-raised rounded-2xl w-fit border" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'payroll' 
                ? 'bg-surface shadow-sm' 
                : 'text-text-muted hover:text-text-primary'
            }`}
            style={activeTab === 'payroll' ? { color: 'var(--color-brand)' } : {}}
          >
            Monthly Payroll
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'structures' 
                ? 'bg-surface shadow-sm' 
                : 'text-text-muted hover:text-text-primary'
            }`}
            style={activeTab === 'structures' ? { color: 'var(--color-brand)' } : {}}
          >
            Salary Structures
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} size={16} />
            <input
              type="text"
              placeholder="Search staff or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-brand/20 w-full sm:w-64"
              style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {activeTab === 'payroll' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Monthly Budget" value={formatCurrency(summary.total)} sub={`${summary.count} records generated`} icon={Banknote} accent="var(--color-brand)" />
            <StatCard label="Disbursed" value={formatCurrency(summary.paid)} sub={`${summary.paidCount} salaries paid`} icon={CheckCircle2} accent="#15803d" />
            <StatCard label="Pending" value={formatCurrency(summary.pending)} sub={`${summary.count - summary.paidCount} to be processed`} icon={Clock} accent="#b91c1c" />
            <StatCard label="Avg Salary" value={formatCurrency(summary.total / (summary.count || 1))} sub="Per staff member" icon={TrendingUp} />
          </div>

          <div className="rounded-[28px] border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-wrap items-center justify-between p-6 border-b border-dashed" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Monthly Disbursal</h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select month and process payments</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(Number(e.target.value))} 
                  className="rounded-xl px-3 py-2 text-sm font-bold border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(Number(e.target.value))} 
                  className="rounded-xl px-3 py-2 text-sm font-bold border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <Button 
                  icon={Play} 
                  onClick={handleGenerate} 
                  loading={isLoading} 
                  className="rounded-full px-6 shadow-sm shadow-brand/20"
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading && !viewPayslip ? (
                <div className="p-6"><TableSkeleton rows={6} cols={7} /></div>
              ) : filteredPayrolls.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead style={{ backgroundColor: 'var(--color-bg)' }}>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Staff Member</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Basic</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Allowances</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Deductions</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Net Salary</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredPayrolls.map(p => {
                      const totalAllow = Number(p.hra) + Number(p.da) + Number(p.allowances)
                      return (
                        <tr key={p.id} className="group hover:bg-brand/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                                {p.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                                <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-muted)' }}>{p.employee_id} • {p.designation || p.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(p.basic)}</td>
                          <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalAllow)}</td>
                        <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-danger)' }}>{formatCurrency(p.deductions)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-3 py-1.5 rounded-xl font-black text-sm shadow-sm border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
                              {formatCurrency(p.net_salary)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={p.status === 'paid' ? 'green' : 'yellow'} size="sm" className="font-black">
                              {p.status}
                            </Badge>
                            {p.payment_date && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.payment_date, 'short')}</p>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === 'generated' && (
                                <button
                                  onClick={() => { setPayingRecord(p); setPayModalOpen(true) }}
                                  className="group inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                                  style={{ backgroundColor: 'var(--color-brand)' }}
                                >
                                  Mark Paid
                                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                                </button>
                              )}
                              {p.status === 'paid' && (
                                <button 
                                  onClick={() => handleViewPayslip(p.id)} 
                                  className="p-2 rounded-xl transition-all border hover:shadow-sm" 
                                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                                  title="View Payslip"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{ backgroundColor: 'var(--color-surface-2)' }}>
                    <tr>
                      <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Total Monthly Disbursal</td>
                      <td colSpan={3} />
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-black" style={{ color: 'var(--color-brand)' }}>{formatCurrency(summary.total)}</span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="py-16">
                  <EmptyState 
                    title="No payroll records" 
                    description={searchQuery ? "No staff records match your current search." : "Salaries for this month haven't been calculated yet."} 
                    icon={Banknote}
                    action={searchQuery ? (
                      <Button variant="secondary" onClick={() => setSearchQuery('')}>Clear Search</Button>
                    ) : (
                      <Button onClick={handleGenerate}>Generate Now</Button>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Salary Structures View */}
      {activeTab === 'structures' && (
        <div className="rounded-[28px] border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between p-6 border-b border-dashed" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                <Settings2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Salary Templates</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Configure recurring pay components for staff</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6"><TableSkeleton rows={8} cols={7} /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead style={{ backgroundColor: 'var(--color-bg)' }}>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Staff</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Basic</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>HRA</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>DA</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Others</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Deductions</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {filteredStructures.length > 0 ? filteredStructures.map(s => (
                    <tr key={s.staff_id} className="hover:bg-brand/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.name}</p>
                            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-muted)' }}>{s.employee_id} • {s.designation || s.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(s.basic || 0)}</td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(s.hra || 0)}</td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(s.da || 0)}</td>
                      <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(s.allowances || 0)}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(s.deductions || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setEditingStruct({
                              staff_id: s.staff_id,
                              type: s.type,
                              name: s.name,
                              basic: s.basic || 0,
                              hra: s.hra || 0,
                              da: s.da || 0,
                              allowances: s.allowances || 0,
                              deductions: s.deductions || 0
                            })
                            setStructModalOpen(true)
                          }} 
                          className="px-4 py-1.5 rounded-full text-xs font-bold border transition-all hover:bg-surface-raised active:scale-95 shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-16">
                        <EmptyState title="No staff records found" description="Try a different search term." icon={Search} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Edit Structure Modal */}
      <Modal open={structModalOpen} onClose={() => !isLoading && setStructModalOpen(false)} title={`Edit Salary Structure`} size="sm">
        {editingStruct && (
          <form onSubmit={handleStructSubmit} className="space-y-4">
            <div className="p-4 rounded-[20px] mb-4 text-center border-2 border-dashed" style={{ backgroundColor: 'var(--color-accent-subtle)', borderColor: 'var(--color-accent-muted)' }}>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-accent-emphasis)' }}>Staff Member</p>
              <p className="text-base font-black mt-1" style={{ color: 'var(--color-accent-emphasis)' }}>{editingStruct.name}</p>
            </div>
            <Input label="Basic Salary" icon={Banknote} type="number" step="0.01" min="0" value={editingStruct.basic} onChange={e => setEditingStruct({ ...editingStruct, basic: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="HRA" type="number" step="0.01" min="0" value={editingStruct.hra} onChange={e => setEditingStruct({ ...editingStruct, hra: e.target.value })} required />
              <Input label="DA" type="number" step="0.01" min="0" value={editingStruct.da} onChange={e => setEditingStruct({ ...editingStruct, da: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Other Allowances" type="number" step="0.01" min="0" value={editingStruct.allowances} onChange={e => setEditingStruct({ ...editingStruct, allowances: e.target.value })} required />
              <Input label="Deductions" type="number" step="0.01" min="0" value={editingStruct.deductions} onChange={e => setEditingStruct({ ...editingStruct, deductions: e.target.value })} required />
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="button" variant="secondary" onClick={() => setStructModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isLoading}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Mark Paid Modal */}
      <Modal open={payModalOpen} onClose={() => !isLoading && setPayModalOpen(false)} title="Process Salary Payment" size="sm">
        {payingRecord && (
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div className="p-6 rounded-[24px] mb-4 text-center border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-muted)' }}>Net Amount to Pay</p>
              <p className="text-3xl font-black mt-2" style={{ color: '#15803d' }}>{formatCurrency(payingRecord.net_salary)}</p>
              <div className="mt-4 pt-4 border-t flex items-center justify-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent-emphasis)' }}>
                  {payingRecord.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{payingRecord.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Payment Mode" value={payForm.payment_mode} onChange={e => setPayForm({ ...payForm, payment_mode: e.target.value })} options={[{value:'Bank Transfer',label:'Bank Transfer'},{value:'Cheque',label:'Cheque'},{value:'Cash',label:'Cash'},{value:'UPI',label:'UPI'}]} required />
              <Input label="Payment Date" type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required />
            </div>
            <Input label="Remarks / Ref No" icon={FileText} value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Transaction ID, Cheque No, etc." />
            <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isLoading} icon={CheckCircle2}>Confirm Payment</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payslip View Modal */}
      <Modal 
        open={!!viewPayslip} 
        onClose={() => setViewPayslip(null)} 
        title="Payslip Preview"
        size="md"
      >
        <div className="space-y-6">
          <PayslipPrint payslip={viewPayslip} />
          <div className="flex justify-center gap-3">
            <Button 
              variant="secondary" 
              icon={Printer} 
              onClick={() => window.print()}
              className="rounded-full px-8"
            >
              Print Payslip
            </Button>
            <Button 
              onClick={() => setViewPayslip(null)}
              className="rounded-full px-8"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
