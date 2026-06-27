import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, CreditCard, FileText, ReceiptText, WalletCards } from 'lucide-react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate, getFeeMonthLabel } from '@/utils/helpers'
import Badge from '@/components/ui/Badge'

const STATUS_CONFIG = {
  pending         : { label: 'Pending',         variant: 'red' },
  partial         : { label: 'Partial',         variant: 'yellow' },
  paid            : { label: 'Paid',            variant: 'green' },
  fully_paid      : { label: 'Paid',            variant: 'green' },
  carried_forward : { label: 'Carried Forward', variant: 'blue' },
  waived          : { label: 'Waived',          variant: 'grey' },
  overdue         : { label: 'Overdue',         variant: 'red' },
}

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || { label: String(status || 'Unknown').replace('_', ' '), variant: 'grey' }
}

const StudentFeeDetail = () => {
  usePageTitle('Student Fee Details')
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    accountantApi.getStudentFeesDetail(id).then((response) => setData(response.data)).catch(() => {})
  }, [id])

  const summary = data?.summary || {}
  const student = data?.student || {}
  const invoices = data?.invoices || []
  const payments = data?.payments || []

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Student account</p>
            <h1 className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{student.name || 'Student'}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {student.admission_no} | {student.class_name} {student.section_name ? `Section ${student.section_name}` : ''} | {student.session_name}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300">
            <WalletCards size={24} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Fee" value={formatCurrency(summary.total_fee || 0)} />
          <SummaryCard label="Paid" value={formatCurrency(summary.total_paid || 0)} tone="#15803d" />
          <SummaryCard label="Balance" value={formatCurrency(summary.balance || 0)} tone={Number(summary.balance || 0) > 0 ? '#dc2626' : '#15803d'} />
          <SummaryCard label="Concession" value={formatCurrency(summary.concession || 0)} tone="#2563eb" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]">
        <SectionCard
          icon={FileText}
          title="Invoices"
          subtitle={`${invoices.length} invoice${invoices.length === 1 ? '' : 's'} in this account`}
        >
          {invoices.length === 0 ? (
            <EmptyPanel icon={FileText} title="No invoices found" description="Generated invoices for this student will appear here." />
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={ReceiptText}
          title="Payment History"
          subtitle={`${payments.length} payment${payments.length === 1 ? '' : 's'} recorded`}
        >
          {payments.length === 0 ? (
            <EmptyPanel icon={ReceiptText} title="No payments yet" description="Receipts and payment references will be listed here." />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <PaymentItem key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

const SummaryCard = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
    <div className="mt-2 text-xl font-bold" style={{ color: tone }}>{value}</div>
  </div>
)

const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
  <section className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </section>
)

const InvoiceCard = ({ invoice }) => {
  const status = getStatusConfig(invoice.status)
  const amountDue = Number(invoice.amount_due || invoice.total_amount || 0)
  const paid = Number(invoice.amount_paid || 0)
  const balance = Number(invoice.balance || 0)

  return (
    <article className="rounded-[20px] border p-4 transition-colors hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {invoice.fee_name || invoice.fee_type_name || 'Fee invoice'} {invoice.due_date ? `(${getFeeMonthLabel(invoice.due_date)})` : ''}
            </h3>
            <Badge variant={status.variant} dot>{status.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Due {invoice.due_date ? formatDate(invoice.due_date) : '--'}</span>
            {invoice.invoice_no && <span>Invoice {invoice.invoice_no}</span>}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>Balance</p>
          <p className="mt-1 text-lg font-black" style={{ color: balance > 0 ? '#dc2626' : '#15803d' }}>{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl p-3" style={{ backgroundColor: 'var(--color-bg)' }}>
        <MiniAmount label="Due" value={formatCurrency(amountDue)} />
        <MiniAmount label="Paid" value={formatCurrency(paid)} tone="#15803d" />
        <MiniAmount label="Balance" value={formatCurrency(balance)} tone={balance > 0 ? '#dc2626' : '#15803d'} />
      </div>
    </article>
  )
}

const PaymentItem = ({ payment }) => (
  <article className="rounded-[20px] border p-4" style={{ borderColor: 'var(--color-border)' }}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {payment.fee_name || 'Fee payment'} {payment.due_date ? `(${getFeeMonthLabel(payment.due_date)})` : ''}
        </h3>
        <div className="mt-2 space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <p className="flex items-center gap-1.5"><CalendarDays size={13} /> {payment.payment_date ? formatDate(payment.payment_date) : '--'}</p>
          <p className="flex items-center gap-1.5"><CreditCard size={13} /> {String(payment.payment_mode || 'Payment').toUpperCase()}</p>
          {payment.receipt_no && <p className="font-mono" style={{ color: 'var(--color-text-muted)' }}>Receipt {payment.receipt_no}</p>}
        </div>
      </div>
      <p className="shrink-0 text-sm font-black text-green-700 dark:text-green-400">{formatCurrency(payment.amount || 0)}</p>
    </div>
  </article>
)

const MiniAmount = ({ label, value, tone = 'var(--color-text-primary)' }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    <p className="mt-1 text-sm font-bold" style={{ color: tone }}>{value}</p>
  </div>
)

const EmptyPanel = ({ icon: Icon, title, description }) => (
  <div className="rounded-[20px] border border-dashed px-4 py-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
    <Icon className="mx-auto opacity-30" size={34} style={{ color: 'var(--color-text-muted)' }} />
    <p className="mt-3 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
    <p className="mx-auto mt-1 max-w-xs text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
  </div>
)

export default StudentFeeDetail
