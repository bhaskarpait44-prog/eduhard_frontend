import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import * as accountantApi from '@/api/accountantApi'
import { LockedView } from '@/pages/accountant/concessions/ConcessionList'
import { formatCurrency, formatDate } from '@/utils/helpers'
import PageHeader from '@/components/ui/PageHeader'

const RefundList = () => {
  usePageTitle('Refunds')
  const { can } = usePermissions()
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!can('fees.refund')) return
    accountantApi.getRefunds().then((response) => setRows(response.data?.refunds || [])).catch(() => {})
  }, [can])

  if (!can('fees.refund')) return <LockedView title="Refund Management" />

  return (
    <div className="space-y-5">
      <PageHeader title="Refund List" subtitle="Processed fee refund records" />
      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            No refunds found.
          </div>
        ) : rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-2xl border px-4 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{row.student_name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{row.reason} · {formatDate(row.processed_at)}</div>
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--color-danger)' }}>{formatCurrency(row.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RefundList
