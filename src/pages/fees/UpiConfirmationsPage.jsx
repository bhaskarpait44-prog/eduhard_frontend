import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input as AntInput,
  ConfigProvider,
  Tag,
  Modal as AntModal,
  Segmented,
  theme as antdTheme
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  AlertOutlined,
  QrcodeOutlined
} from '@ant-design/icons'
import useToast from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/utils/helpers'
import * as accountantApi from '@/api/accountantApi'
import useUiStore from '@/store/uiStore'

const STATUS_CONFIG = {
  pending   : { label: 'Pending',   color: 'gold',   icon: ClockCircleOutlined },
  confirmed : { label: 'Confirmed', color: 'green',  icon: CheckCircleOutlined },
  rejected  : { label: 'Rejected',  color: 'red',    icon: CloseCircleOutlined },
}

const UpiConfirmationsPage = () => {
  const { toastSuccess, toastError } = useToast()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const { theme: storeTheme } = useUiStore()

  // Modal states
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState('')
  const [transactionRef, setTransactionRef] = useState('')

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 })

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    fetchRequests()
  }, [status, pagination.page])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const res = await accountantApi.getUpiRequests({ 
        status, 
        page: pagination.page, 
        limit: pagination.limit 
      })
      setRequests(res.data?.requests || [])
      if (res.data?.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }))
      }
    } catch (err) {
      toastError('Failed to load UPI requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setIsProcessing(true)
    try {
      await accountantApi.confirmUpiRequest(confirmTarget.id, { transaction_ref: transactionRef })
      toastSuccess('Payment confirmed and recorded')
      setConfirmTarget(null)
      setTransactionRef('')
      fetchRequests()
    } catch (err) {
      toastError(err.message || 'Failed to confirm payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !reason.trim()) return
    setIsProcessing(true)
    try {
      await accountantApi.rejectUpiRequest(rejectTarget.id, { reason })
      toastSuccess('Request rejected')
      setRejectTarget(null)
      setReason('')
      fetchRequests()
    } catch (err) {
      toastError(err.message || 'Failed to reject request')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredRequests = requests.filter(r => 
    (r.student_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (r.upi_transaction_id?.toLowerCase() || '').includes(search.toLowerCase())
  )

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const tableColumns = [
    {
      title: 'Student / Class',
      key: 'student',
      render: (_, record) => (
        <div>
          <p className="text-sm font-bold text-gray-850 dark:text-gray-100">{record.student_name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {record.class_name} {record.section_name ? ` · ${record.section_name}` : ''}
          </p>
        </div>
      )
    },
    {
      title: 'Fee Details',
      key: 'fee',
      render: (_, record) => (
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{record.fee_name}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Due: {formatDate(record.due_date)}</p>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => (
        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: 'Transaction ID',
      dataIndex: 'upi_transaction_id',
      key: 'upi_transaction_id',
      render: (val) => (
        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg">
          {val === 'PAYMENT_PENDING' ? 'Processing...' : (val || 'N/A')}
        </span>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(val)}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const config = STATUS_CONFIG[val]
        const Icon = config.icon
        return (
          <Tag icon={<Icon />} color={config.color} className="rounded-full font-black text-[10px] uppercase border-0 px-2.5 py-0.5">
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      render: (_, record) => {
        if (record.status === 'pending') {
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => {
                  setConfirmTarget(record)
                  setTransactionRef(record.upi_transaction_id === 'PAYMENT_PENDING' ? '' : record.upi_transaction_id)
                }}
                className="rounded-full font-bold text-xs border-0 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm
              </Button>
              <Button
                type="default"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectTarget(record)}
                className="rounded-full font-bold text-xs"
              >
                Reject
              </Button>
            </div>
          )
        }
        return (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            {record.status === 'confirmed' ? `By ${record.confirmed_by_name}` : 'Rejected'}
          </span>
        )
      }
    }
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4CC0D4',
          borderRadius: 24,
          fontFamily: 'inherit',
        },
      }}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <section
          className="rounded-[32px] p-6 sm:p-7 text-white relative overflow-hidden shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4cc0d4 0%, #0891b2 100%)' }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/12 text-white/90 mb-3">
                <QrcodeOutlined />
                Finance Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">UPI Payment Confirmations</h1>
              <p className="text-xs text-cyan-50/90 mt-1 max-w-xl font-medium leading-relaxed">
                Verify and confirm fee payments made via UPI QR codes from the mobile app.
              </p>
            </div>
            
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              <p className="text-[10px] uppercase tracking-wider text-cyan-50/70 font-black">Pending Requests</p>
              <p className="text-2xl font-black mt-0.5">{pendingCount}</p>
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Segmented
            value={status}
            onChange={(val) => {
              setStatus(val)
              setPagination(p => ({ ...p, page: 1 }))
            }}
            options={[
              { label: 'All Requests', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Rejected', value: 'rejected' }
            ]}
            className="p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-fit font-bold"
          />

          <div className="relative flex-1 max-w-md">
            <AntInput
              placeholder="Search in current page..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              className="rounded-xl font-semibold text-xs h-[38px]"
            />
          </div>
        </div>

        {/* Results Card */}
        <Card
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
          styles={{ body: { padding: '0px' } }}
        >
          <Table
            dataSource={filteredRequests}
            columns={tableColumns}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: (page) => setPagination(prev => ({ ...prev, page })),
              showSizeChanger: false,
              size: 'small',
              className: 'px-6 py-4 mt-0 border-t border-gray-50 dark:border-gray-800'
            }}
            loading={isLoading}
            size="middle"
            className="premium-table"
            rowClassName="hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 transition-colors"
          />
        </Card>

        {/* Confirm Modal */}
        <AntModal
          open={!!confirmTarget}
          onCancel={() => !isProcessing && setConfirmTarget(null)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Confirm UPI Payment</span>}
          footer={[
            <Button key="cancel" disabled={isProcessing} onClick={() => setConfirmTarget(null)} className="rounded-xl font-bold">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={isProcessing}
              onClick={handleConfirm}
              className="rounded-xl font-bold border-0 bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm & Record
            </Button>
          ]}
          className="premium-modal"
          centered
        >
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200/20 flex gap-3">
              <CheckCircleOutlined className="text-green-600 text-lg mt-0.5 shrink-0" />
              <div className="text-xs text-gray-700 dark:text-gray-300">
                <p className="font-bold text-green-700 dark:text-green-400">Verifying Transaction</p>
                <p className="mt-1 leading-relaxed">
                  Please ensure the amount <strong>{formatCurrency(confirmTarget?.amount)}</strong> has been received in the school's bank account for transaction ID <strong>{confirmTarget?.upi_transaction_id}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mt-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Student</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{confirmTarget?.student_name}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Fee Type</p>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{confirmTarget?.fee_name}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Bank Reference / Transaction Ref</label>
              <AntInput
                placeholder="Enter bank reference number (optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="rounded-xl font-semibold text-xs h-[38px]"
              />
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                Defaults to the student-submitted UPI ID if left blank.
              </p>
            </div>
          </div>
        </AntModal>

        {/* Reject Modal */}
        <AntModal
          open={!!rejectTarget}
          onCancel={() => !isProcessing && setRejectTarget(null)}
          title={<span className="text-base font-black text-gray-900 dark:text-white">Reject UPI Payment Request</span>}
          footer={[
            <Button key="cancel" disabled={isProcessing} onClick={() => setRejectTarget(null)} className="rounded-xl font-bold">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger
              loading={isProcessing}
              disabled={!reason.trim()}
              onClick={handleReject}
              className="rounded-xl font-bold border-0 bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Request
            </Button>
          ]}
          className="premium-modal"
          centered
        >
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200/20 flex gap-3">
              <AlertOutlined className="text-red-600 text-lg mt-0.5 shrink-0" />
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Rejecting this request will notify the student. They will be able to re-submit if it was a mistake.
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Reason for Rejection</label>
              <AntInput.TextArea
                placeholder="e.g. Transaction ID not found in bank records, incorrect amount..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="rounded-xl font-semibold text-xs"
              />
            </div>
          </div>
        </AntModal>
      </div>
    </ConfigProvider>
  )
}

export default UpiConfirmationsPage
