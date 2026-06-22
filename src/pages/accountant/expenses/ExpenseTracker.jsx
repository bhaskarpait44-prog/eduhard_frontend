import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Select as AntSelect,
  Input as AntInput,
  ConfigProvider,
  Tag,
  Modal as AntModal,
  theme as antdTheme
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
  CalculatorOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useExpenseStore from '@/store/expenseStore'
import { formatDate, formatCurrency } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'

const CATEGORY_MAP = {
  salary:      { label: 'Salary',        icon: BankOutlined,        tagColor: 'green',  bgGradient: 'from-green-500/10 to-green-600/5' },
  maintenance: { label: 'Maintenance',   icon: ToolOutlined,        tagColor: 'orange', bgGradient: 'from-orange-500/10 to-orange-600/5' },
  utilities:   { label: 'Utilities',     icon: ThunderboltOutlined, tagColor: 'blue',   bgGradient: 'from-blue-500/10 to-blue-600/5' },
  supplies:    { label: 'Supplies',      icon: ContainerOutlined,   tagColor: 'blue',   bgGradient: 'from-indigo-500/10 to-indigo-600/5' },
  events:      { label: 'Events',        icon: CalendarOutlined,    tagColor: 'purple', bgGradient: 'from-purple-500/10 to-purple-600/5' },
  misc:        { label: 'Miscellaneous', icon: EllipsisOutlined,    tagColor: 'default',bgGradient: 'from-gray-500/10 to-gray-600/5' }
}

const STATUS_BADGE = {
  submitted: 'processing',
  approved: 'warning',
  paid: 'success',
  rejected: 'error'
}

export default function ExpenseTracker() {
  usePageTitle('Expense Tracker')
  const { toastSuccess, toastError } = useToast()
  const { theme: storeTheme } = useUiStore()
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

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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

  const tableColumns = [
    {
      title: 'Date & Description',
      key: 'description',
      render: (_, record) => (
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-0.5">{record.description || 'No description'}</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
            <CalendarOutlined /> {formatDate(record.date, 'short')}
            {record.payment_mode && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                <CreditCardOutlined /> {record.payment_mode}
              </>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const conf = CATEGORY_MAP[cat] || CATEGORY_MAP.misc
        const Icon = conf.icon
        return (
          <Tag icon={<Icon />} color={conf.tagColor} className="rounded-md font-bold uppercase text-[10px] border-0 px-2 py-0.5">
            {conf.label}
          </Tag>
        )
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val) => <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(val)}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_BADGE[status]} className="rounded-full font-black text-[10px] uppercase border-0 px-2.5 py-0.5">
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          {record.status === 'submitted' && (
            <>
              <Button
                type="text"
                size="small"
                onClick={() => handleStatusUpdate(record.id, 'approved')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                icon={<CheckCircleOutlined />}
                title="Approve"
              />
              <Button
                type="text"
                size="small"
                danger
                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                className="hover:bg-red-50 dark:hover:bg-red-950/20"
                icon={<CloseCircleOutlined />}
                title="Reject"
              />
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStatusUpdate(record.id, 'paid')}
              className="rounded-full font-bold text-[10px] border-0 bg-green-600 hover:bg-green-700"
            >
              Mark Paid
            </Button>
          )}
          {record.status !== 'paid' && (
            <Button
              type="text"
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
              className="hover:bg-red-50 dark:hover:bg-red-950/20"
              icon={<DeleteOutlined />}
              title="Delete"
            />
          )}
        </div>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4361ee',
          borderRadius: 10,
          fontFamily: 'Roboto, system-ui, sans-serif',
        },
      }}
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(67, 97, 238, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #eef2ff 0%, #fffdf9 100%)',
            borderColor: isDark ? 'rgba(67, 97, 238, 0.3)' : '#c7d2fe'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Expense Tracker</h1>
              <Tag color="blue" className="font-extrabold uppercase text-[9px] border-0 px-2 rounded-full">Outflow</Tag>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
              Track school expenditures, organize categories, and manage vendor/payroll approvals.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-3">
            <AntSelect
              value={selectedMonth}
              onChange={val => setSelectedMonth(val)}
              className="min-w-[120px] rounded-xl font-bold"
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(0, i).toLocaleString('default', { month: 'long' })
              }))}
            />
            <AntSelect
              value={selectedYear}
              onChange={val => setSelectedYear(val)}
              className="min-w-[90px] rounded-xl font-bold"
              options={[2024, 2025, 2026].map(y => ({ value: y, label: String(y) }))}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
              className="rounded-xl font-bold flex items-center justify-center border-0"
              style={{ height: '40px', padding: '0 20px', background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}
            >
              Record Expense
            </Button>
          </div>
        </div>

        {/* Summary Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="rounded-[24px] text-white border-0 overflow-hidden shadow-sm flex flex-col justify-center h-full"
              style={{ background: 'linear-gradient(135deg, #4361ee 0%, #1d4ed8 100%)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">Total Expenses</p>
              <p className="text-2xl font-black mt-2 tracking-tight">{formatCurrency(totalExpense)}</p>
              <p className="text-[10px] opacity-70 mt-3 font-bold uppercase tracking-wide">
                For {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </p>
            </Card>
          </Col>

          {Object.entries(CATEGORY_MAP).slice(0, 3).map(([key, config]) => {
            const sum = summary.find(s => s.category === key)?.total || 0
            const Icon = config.icon
            return (
              <Col xs={24} sm={12} lg={6} key={key}>
                <Card
                  className={`rounded-[24px] border border-indigo-200/10 shadow-sm h-full bg-gradient-to-b ${config.bgGradient}`}
                  styles={{ body: { padding: '20px' } }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Icon className="text-lg" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700 dark:text-orange-300">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                    {formatCurrency(sum)}
                  </p>
                </Card>
              </Col>
            )
          })}
        </Row>

        {/* Main Records Block */}
        <Card
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
          styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
          title={
            <div className="flex flex-wrap items-center justify-between gap-4 py-1">
              <div>
                <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">Expense Records</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
                  Monthly expense ledgers and vendor receipts
                </span>
              </div>
              <div className="relative min-w-[240px]">
                <AntInput
                  placeholder="Search descriptions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  prefix={<SearchOutlined className="text-gray-400" />}
                  allowClear
                  className="rounded-xl font-semibold text-xs h-[36px]"
                />
              </div>
            </div>
          }
        >
          <Table
            dataSource={filteredExpenses}
            columns={tableColumns}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            loading={isLoading}
            size="middle"
            className="premium-table"
            rowClassName="hover:bg-orange-50/10 dark:hover:bg-orange-950/10 transition-colors"
          />
        </Card>

        {/* Record Expense Modal */}
        <AntModal
          open={modalOpen}
          onCancel={() => !isLoading && setModalOpen(false)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Record Expense</span>}
          footer={null}
          className="premium-modal"
          centered
        >
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <Row gutter={16}>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                <AntSelect
                  value={form.category}
                  onChange={val => setForm({ ...form, category: val })}
                  className="w-full rounded-xl text-xs h-[38px]"
                  options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
                />
              </Col>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Amount</label>
                <AntInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <AntInput
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                  className="rounded-xl font-semibold text-xs h-[38px]"
                />
              </Col>
              <Col span={12}>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Payment Mode</label>
                <AntSelect
                  value={form.payment_mode}
                  onChange={val => setForm({ ...form, payment_mode: val })}
                  className="w-full rounded-xl text-xs h-[38px]"
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Bank Transfer', label: 'Bank Transfer' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'Cheque', label: 'Cheque' },
                    { value: 'Card', label: 'Card' }
                  ]}
                />
              </Col>
            </Row>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <AntInput
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the expense..."
                required
                className="rounded-xl font-semibold text-xs h-[38px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-2">
              <Button type="button" onClick={() => setModalOpen(false)} className="rounded-xl font-bold h-[38px]">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading} className="rounded-xl font-bold h-[38px] border-0" style={{ background: 'linear-gradient(90deg, #4361ee 0%, #1d4ed8 100%)' }}>
                Save Expense
              </Button>
            </div>
          </form>
        </AntModal>
      </div>
    </ConfigProvider>
  )
}
