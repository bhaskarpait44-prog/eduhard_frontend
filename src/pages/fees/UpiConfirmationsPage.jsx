import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Filter, Search, MoreHorizontal, IndianRupee, QrCode, AlertCircle, Loader2 } from 'lucide-react'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { formatCurrency, formatDate } from '@/utils/helpers'
import * as accountantApi from '@/api/accountantApi'

const STATUS_CONFIG = {
  pending   : { label: 'Pending',   variant: 'yellow', icon: Clock },
  confirmed : { label: 'Confirmed', variant: 'green',  icon: CheckCircle },
  rejected  : { label: 'Rejected',  variant: 'red',    icon: XCircle },
}

const UpiConfirmationsPage = () => {
  const { toastSuccess, toastError } = useToast()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')

  // Modal states
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState('')
  const [transactionRef, setTransactionRef] = useState('')

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 1 })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="rounded-[28px] p-6 sm:p-7 text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/12 text-white/90 mb-3">
              <QrCode size={14} />
              Finance Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">UPI Payment Confirmations</h1>
            <p className="text-sm text-purple-100/80 mt-2 max-w-xl">
              Verify and confirm fee payments made via UPI QR codes from the mobile app.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <p className="text-[10px] uppercase tracking-wider text-purple-100/70">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-surface border border-border w-fit">
          {['all', 'pending', 'confirmed', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all capitalize ${
                status === s 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search in current page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="rounded-[24px] bg-surface border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <TableSkeleton cols={7} rows={6} />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title={`No ${status !== 'all' ? status : ''} requests found`}
            description={search ? "No results match your search criteria." : "When students pay via UPI, their requests will appear here."}
            className="py-16"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/50">
                    {['Student / Class', 'Fee Details', 'Amount', 'Transaction ID', 'Submitted', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((req) => {
                    const cfg = STATUS_CONFIG[req.status]
                    return (
                      <tr key={req.id} className="hover:bg-surface-raised/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-text-primary">{req.student_name}</p>
                          <p className="text-xs text-text-muted">{req.class_name} {req.section_name ? ` · ${req.section_name}` : ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-text-primary">{req.fee_name}</p>
                          <p className="text-[11px] text-text-muted">Due: {formatDate(req.due_date)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-brand">
                            <IndianRupee size={14} />
                            {formatCurrency(req.amount).replace('₹', '')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-mono text-text-primary bg-surface-raised px-2 py-1 rounded-lg w-fit">
                            {req.upi_transaction_id === 'PAYMENT_PENDING' ? 'Processing...' : (req.upi_transaction_id || 'N/A')}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={cfg.variant} dot icon={cfg.icon}>
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setConfirmTarget(req)
                                  setTransactionRef(req.upi_transaction_id === 'PAYMENT_PENDING' ? '' : req.upi_transaction_id)
                                }}
                                className="p-2 rounded-xl bg-success/10 text-success hover:bg-success hover:text-white transition-all"
                                title="Confirm Payment"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => setRejectTarget(req)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Reject Request"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-text-muted italic">
                              {req.status === 'confirmed' ? `By ${req.confirmed_by_name}` : 'Rejected'}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-surface-raised/30 border-t border-border flex items-center justify-between">
                <p className="text-xs text-text-secondary font-medium">
                  Showing <span className="text-text-primary">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-text-primary">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-text-primary">{pagination.total}</span> results
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-bold transition-all hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-bold transition-all hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        open={!!confirmTarget}
        onClose={() => !isProcessing && setConfirmTarget(null)}
        title="Confirm UPI Payment"
        maxWidth="sm"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-success/5 border border-success/10 flex gap-3">
            <CheckCircle className="text-success shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-bold text-success">Verifying Transaction</p>
              <p className="text-text-secondary mt-1">
                Please ensure the amount <strong>{formatCurrency(confirmTarget?.amount)}</strong> has been received in the school's bank account for transaction ID <strong>{confirmTarget?.upi_transaction_id}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Student</p>
                <p className="font-semibold text-text-primary">{confirmTarget?.student_name}</p>
              </div>
              <div>
                <p className="text-text-muted">Fee Type</p>
                <p className="font-semibold text-text-primary">{confirmTarget?.fee_name}</p>
              </div>
            </div>

            <Input
              label="Bank Reference / Transaction Ref"
              placeholder="Enter bank reference number (optional)"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              hint="Defaults to the student-submitted UPI ID if left blank."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmTarget(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              loading={isProcessing}
              style={{ backgroundColor: 'var(--color-success)' }}
            >
              Confirm & Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => !isProcessing && setRejectTarget(null)}
        title="Reject UPI Payment Request"
        maxWidth="sm"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="text-sm text-text-secondary">
              Rejecting this request will notify the student. They will be able to re-submit if it was a mistake.
            </div>
          </div>

          <Textarea
            label="Reason for Rejection"
            placeholder="e.g. Transaction ID not found in bank records, incorrect amount..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectTarget(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleReject}
              loading={isProcessing}
              disabled={!reason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UpiConfirmationsPage
