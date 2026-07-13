import { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Table,
  Select as AntSelect,
  Input as AntInput,
  Modal as AntModal,
} from 'antd'
import {
  BankOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  ContainerOutlined,
  CalendarOutlined,
  EllipsisOutlined,
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  CreditCardOutlined,
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useExpenseStore from '@/store/expenseStore'
import { formatDate, formatCurrency } from '@/utils/helpers'
import { feeStatusBadge, expenseCategoryBadge } from '@/utils/feeStatus'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import UIButton from '@/components/ui/Button'

const CATEGORY_MAP = {
  salary:      { label: 'Salary',        icon: BankOutlined },
  maintenance: { label: 'Maintenance',   icon: ToolOutlined },
  utilities:   { label: 'Utilities',     icon: ThunderboltOutlined },
  supplies:    { label: 'Supplies',      icon: ContainerOutlined },
  events:      { label: 'Events',        icon: CalendarOutlined },
  misc:        { label: 'Miscellaneous', icon: EllipsisOutlined },
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
    payment_mode: 'Cash',
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
      e.payment_mode?.toLowerCase().includes(query),
    )
  }, [expenses, searchQuery])

  const totalExpense = useMemo(() =>
    summary.reduce((acc, curr) => acc + parseFloat(curr.total), 0),
  [summary])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) return toastError('Please enter a valid amount')
    try {
      await createExpense(form)
      toastSuccess('Expense recorded successfully')
      setModalOpen(false)
      setForm({ category: 'supplies', amount: '', date: new Date().toISOString().split('T')[0], description: '', payment_mode: 'Cash' })
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

  const tableColumns = [
    {
      title: 'Date & Description',
      key: 'description',
      render: (_, record) => (
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {record.description || 'No description'}
          </p>
          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <CalendarOutlined /> {formatDate(record.date, 'short')}
            {record.payment_mode && (
              <>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
                <CreditCardOutlined /> {record.payment_mode}
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const conf = CATEGORY_MAP[cat] || CATEGORY_MAP.misc
        return <Badge variant={expenseCategoryBadge(cat)}>{conf.label}</Badge>
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Badge variant={feeStatusBadge(status)} dot>{status}</Badge>,
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          {record.status === 'submitted' && (
            <>
              <button
                type="button"
                onClick={() => handleStatusUpdate(record.id, 'approved')}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-success)' }}
                title="Approve"
              >
                <CheckCircleOutlined />
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-danger)' }}
                title="Reject"
              >
                <CloseCircleOutlined />
              </button>
            </>
          )}
          {record.status === 'approved' && (
            <UIButton size="xs" variant="outline" onClick={() => handleStatusUpdate(record.id, 'paid')}>
              Mark Paid
            </UIButton>
          )}
          {record.status !== 'paid' && (
            <button
              type="button"
              onClick={() => handleDelete(record.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--color-danger)' }}
              title="Delete"
            >
              <DeleteOutlined />
            </button>
          )}
        </div>
      ),
    },
  ]

  const monthLabel = new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expense Tracker"
        subtitle="Track school expenditures, categories, and vendor approvals"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <AntSelect
              value={selectedMonth}
              onChange={val => setSelectedMonth(val)}
              className="min-w-[120px]"
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(0, i).toLocaleString('default', { month: 'long' }),
              }))}
            />
            <AntSelect
              value={selectedYear}
              onChange={val => setSelectedYear(val)}
              className="min-w-[90px]"
              options={[2024, 2025, 2026].map(y => ({ value: y, label: String(y) }))}
            />
            <UIButton variant="primary" icon={PlusOutlined} onClick={() => setModalOpen(true)}>
              Record Expense
            </UIButton>
          </div>
        }
      />

      {/* Summary Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            label="Total Expenses"
            value={formatCurrency(totalExpense)}
            sub={`${monthLabel} ${selectedYear}`}
            color="var(--color-brand)"
          />
        </Col>
        {Object.entries(CATEGORY_MAP).slice(0, 3).map(([key, config]) => {
          const sum = summary.find(s => s.category === key)?.total || 0
          return (
            <Col xs={24} sm={12} lg={6} key={key}>
              <StatCard
                label={config.label}
                value={formatCurrency(sum)}
                color={`var(--color-${key === 'salary' ? 'success' : key === 'maintenance' ? 'warning' : 'info'})`}
              />
            </Col>
          )
        })}
      </Row>

      {/* Records Table */}
      <Card
        title="Expense Records"
        headerAction={
          <AntInput
            placeholder="Search descriptions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
            allowClear
            style={{ width: 220, borderRadius: 10, height: 32, fontSize: 12 }}
          />
        }
      >
        <div className="-mx-5 -mb-5">
          <Table
            dataSource={filteredExpenses}
            columns={tableColumns}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            loading={isLoading}
            size="small"
            rowClassName="transition-colors"
          />
        </div>
      </Card>

      {/* Record Expense Modal */}
      <AntModal
        open={modalOpen}
        onCancel={() => !isLoading && setModalOpen(false)}
        title={<span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Record Expense</span>}
        footer={null}
        centered
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <Row gutter={16}>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Category</label>
              <AntSelect
                value={form.category}
                onChange={val => setForm({ ...form, category: val })}
                className="w-full"
                style={{ height: 36 }}
                options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </Col>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Amount</label>
              <AntInput
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
                style={{ height: 36 }}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Date</label>
              <AntInput
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                style={{ height: 36 }}
              />
            </Col>
            <Col span={12}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Payment Mode</label>
              <AntSelect
                value={form.payment_mode}
                onChange={val => setForm({ ...form, payment_mode: val })}
                className="w-full"
                style={{ height: 36 }}
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Bank Transfer', label: 'Bank Transfer' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Cheque', label: 'Cheque' },
                  { value: 'Card', label: 'Card' },
                ]}
              />
            </Col>
          </Row>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Description</label>
            <AntInput
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the expense..."
              required
              style={{ height: 36 }}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <UIButton variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </UIButton>
            <UIButton variant="primary" type="submit" loading={isLoading}>
              Save Expense
            </UIButton>
          </div>
        </form>
      </AntModal>
    </div>
  )
}
