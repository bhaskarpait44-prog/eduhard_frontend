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
  Play
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatCurrency, formatDate } from '@/utils/helpers'

export default function PayrollDashboard() {
  usePageTitle('Salary & Payroll')
  const { toastSuccess, toastError } = useToast()
  const { 
    structures, payrolls, isLoading, 
    fetchStructures, updateStructure, 
    fetchPayrolls, generatePayroll, markPaid 
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

  useEffect(() => {
    if (activeTab === 'structures') fetchStructures()
    if (activeTab === 'payroll') fetchPayrolls(selectedMonth, selectedYear)
  }, [activeTab, selectedMonth, selectedYear, fetchStructures, fetchPayrolls])

  const filteredStructures = useMemo(() => {
    if (!searchQuery) return structures
    return structures.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [structures, searchQuery])

  const filteredPayrolls = useMemo(() => {
    if (!searchQuery) return payrolls
    return payrolls.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [payrolls, searchQuery])

  // Handlers
  const handleStructSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateStructure(editingStruct.user_id, editingStruct)
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

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'payroll' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Monthly Payroll
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'structures' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Salary Structures
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Monthly Payroll View */}
      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                <Banknote className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Payroll</h2>
                <p className="text-sm text-gray-500">Generate and process staff salaries</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Button icon={Play} onClick={handleGenerate} loading={isLoading} className="rounded-xl">
                Generate
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Staff</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Basic</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Allowances</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Deductions</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Net Salary</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredPayrolls.length > 0 ? (
                  filteredPayrolls.map(p => {
                    const totalAllow = Number(p.hra) + Number(p.da) + Number(p.allowances)
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{p.employee_id} • {p.designation || p.role}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.basic)}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">{formatCurrency(totalAllow)}</td>
                        <td className="px-6 py-4 text-right font-medium text-red-600">{formatCurrency(p.deductions)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-gray-900 dark:text-white">
                            {formatCurrency(p.net_salary)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={p.status === 'paid' ? 'green' : 'amber'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
                            {p.status}
                          </Badge>
                          {p.payment_date && <p className="text-[10px] text-gray-500 mt-1">{formatDate(p.payment_date, 'short')}</p>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === 'generated' && (
                              <Button size="sm" variant="secondary" onClick={() => { setPayingRecord(p); setPayModalOpen(true) }} className="h-7 py-1 px-3">
                                Mark Paid
                              </Button>
                            )}
                            {p.status === 'paid' && (
                              <button onClick={() => window.open(`/api/payroll/${p.id}/payslip`, '_blank')} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download Payslip">
                                <FileText size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12">
                      <EmptyState title="No payroll records" description="Click Generate to calculate salaries for this month." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Structures View */}
      {activeTab === 'structures' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                <Settings2 className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Salary Structures</h2>
                <p className="text-sm text-gray-500">Define fixed salary components per staff</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Staff</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Basic</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">HRA</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">DA</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Other Allw.</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Deductions</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredStructures.map(s => (
                  <tr key={s.user_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.employee_id} • {s.designation || s.role}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.basic || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.hra || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.da || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.allowances || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500">{formatCurrency(s.deductions || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => {
                        setEditingStruct({
                          user_id: s.user_id,
                          name: s.name,
                          basic: s.basic || 0,
                          hra: s.hra || 0,
                          da: s.da || 0,
                          allowances: s.allowances || 0,
                          deductions: s.deductions || 0
                        })
                        setStructModalOpen(true)
                      }} className="h-7 py-1 px-3">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Structure Modal */}
      <Modal open={structModalOpen} onClose={() => !isLoading && setStructModalOpen(false)} title={`Edit Salary Structure`} size="sm">
        {editingStruct && (
          <form onSubmit={handleStructSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{editingStruct.name}</p>
            </div>
            <Input label="Basic Salary" type="number" step="0.01" min="0" value={editingStruct.basic} onChange={e => setEditingStruct({ ...editingStruct, basic: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="HRA" type="number" step="0.01" min="0" value={editingStruct.hra} onChange={e => setEditingStruct({ ...editingStruct, hra: e.target.value })} required />
              <Input label="DA" type="number" step="0.01" min="0" value={editingStruct.da} onChange={e => setEditingStruct({ ...editingStruct, da: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Other Allowances" type="number" step="0.01" min="0" value={editingStruct.allowances} onChange={e => setEditingStruct({ ...editingStruct, allowances: e.target.value })} required />
              <Input label="Deductions" type="number" step="0.01" min="0" value={editingStruct.deductions} onChange={e => setEditingStruct({ ...editingStruct, deductions: e.target.value })} required />
            </div>
            <div className="pt-4 flex justify-end gap-3">
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
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl mb-4 text-center">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Net Amount to Pay</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(payingRecord.net_salary)}</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">To: {payingRecord.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Payment Mode" value={payForm.payment_mode} onChange={e => setPayForm({ ...payForm, payment_mode: e.target.value })} options={[{value:'Bank Transfer',label:'Bank Transfer'},{value:'Cheque',label:'Cheque'},{value:'Cash',label:'Cash'},{value:'UPI',label:'UPI'}]} required />
              <Input label="Payment Date" type="date" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required />
            </div>
            <Input label="Remarks / Ref No" value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} placeholder="Transaction ID, Cheque No, etc." />
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isLoading} icon={CheckCircle2}>Confirm Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
