import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useExpenseStore from '@/store/expenseStore'
import { 
  Receipt, 
  Plus, 
  Search, 
  Calendar,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  Wrench,
  Zap,
  Package,
  CalendarDays,
  MoreHorizontal
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatDate, formatCurrency } from '@/utils/helpers'

const CATEGORY_MAP = {
  salary:      { label: 'Salary',      icon: Banknote,   color: 'emerald' },
  maintenance: { label: 'Maintenance', icon: Wrench,     color: 'amber' },
  utilities:   { label: 'Utilities',   icon: Zap,        color: 'blue' },
  supplies:    { label: 'Supplies',    icon: Package,    color: 'indigo' },
  events:      { label: 'Events',      icon: CalendarDays, color: 'purple' },
  misc:        { label: 'Miscellaneous',icon: MoreHorizontal, color: 'gray' }
}

const STATUS_BADGE = {
  submitted: 'blue',
  approved: 'amber',
  paid: 'green',
  rejected: 'red'
}

export default function ExpenseTracker() {
  usePageTitle('Expense Tracker')
  const { toastSuccess, toastError } = useToast()
  const { expenses, summary, fetchExpenses, fetchSummary, createExpense, updateStatus, deleteExpense, isLoading } = useExpenseStore()

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    category: 'supplies',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    payment_mode: 'Cash'
  })

  useEffect(() => {
    fetchExpenses({ month: selectedMonth, year: selectedYear })
    fetchSummary({ month: selectedMonth, year: selectedYear })
  }, [selectedMonth, selectedYear, fetchExpenses, fetchSummary])

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses
    const query = searchQuery.toLowerCase()
    return expenses.filter(e => 
      e.description?.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.payment_mode?.toLowerCase().includes(query)
    )
  }, [expenses, searchQuery])

  const totalExpense = useMemo(() => 
    summary.reduce((acc, curr) => acc + parseFloat(curr.total), 0)
  , [summary])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) return toastError('Please enter a valid amount')
    try {
      await createExpense(form)
      toastSuccess('Expense recorded successfully')
      setModalOpen(false)
      setForm({
        category: 'supplies',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        payment_mode: 'Cash'
      })
      fetchSummary({ month: selectedMonth, year: selectedYear })
    } catch (err) {
      toastError(err.message || 'Failed to record expense')
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus(id, status)
      toastSuccess(`Expense marked as ${status}`)
      fetchSummary({ month: selectedMonth, year: selectedYear })
    } catch (err) {
      toastError('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await deleteExpense(id)
      toastSuccess('Expense deleted')
      fetchSummary({ month: selectedMonth, year: selectedYear })
    } catch (err) {
      toastError(err.message || 'Failed to delete expense')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
            <Receipt className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Expense Tracker</h1>
            <p className="text-sm font-medium text-gray-500">Manage school expenses and approvals</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button icon={Plus} onClick={() => setModalOpen(true)} className="rounded-2xl">
            Record Expense
          </Button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[28px] text-white shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Total Expenses</p>
          <p className="text-3xl font-black tracking-tight">{formatCurrency(totalExpense)}</p>
          <p className="text-xs text-indigo-200 mt-2 font-medium">For {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
        </div>

        {Object.entries(CATEGORY_MAP).slice(0, 3).map(([key, config]) => {
          const sum = summary.find(s => s.category === key)?.total || 0
          return (
            <div key={key} className={`p-5 rounded-[28px] border bg-${config.color}-50/50 border-${config.color}-100 dark:bg-${config.color}-500/5 dark:border-${config.color}-500/10`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-${config.color}-100 dark:bg-${config.color}-500/20`}>
                  <config.icon className={`text-${config.color}-600 dark:text-${config.color}-400`} size={18} />
                </div>
                <p className={`text-[11px] font-black uppercase tracking-widest text-${config.color}-600 dark:text-${config.color}-400`}>
                  {config.label}
                </p>
              </div>
              <p className={`text-2xl font-black tracking-tighter text-${config.color}-700 dark:text-${config.color}-300`}>
                {formatCurrency(sum)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white px-2">Expense Records</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Date & Desc</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{exp.description || 'No description'}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                        <Calendar size={12} /> {formatDate(exp.date, 'short')}
                        {exp.payment_mode && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                            <CreditCard size={12} /> {exp.payment_mode}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {CATEGORY_MAP[exp.category] && (() => {
                          const conf = CATEGORY_MAP[exp.category]
                          return (
                            <Badge variant={conf.color} size="sm" className="gap-1 rounded-md">
                              <conf.icon size={10} /> {conf.label}
                            </Badge>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(exp.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_BADGE[exp.status]} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
                        {exp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {exp.status === 'submitted' && (
                          <>
                            <button onClick={() => handleStatusUpdate(exp.id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                              <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => handleStatusUpdate(exp.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {exp.status === 'approved' && (
                          <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(exp.id, 'paid')} className="py-1 h-7">
                            Mark Paid
                          </Button>
                        )}
                        {exp.status !== 'paid' && (
                          <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12">
                    <EmptyState title="No expenses found" description="Record a new expense to get started." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => !isLoading && setModalOpen(false)} title="Record Expense" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
              required
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
            <Select
              label="Payment Mode"
              value={form.payment_mode}
              onChange={e => setForm({ ...form, payment_mode: e.target.value })}
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Card', label: 'Card' }
              ]}
              required
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the expense..."
            required
          />
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isLoading}>Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
