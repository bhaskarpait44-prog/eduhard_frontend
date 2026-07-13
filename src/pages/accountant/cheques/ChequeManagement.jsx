import { useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useCheques from '@/hooks/useCheques'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { feeStatusBadge } from '@/utils/feeStatus'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import UIButton from '@/components/ui/Button'

const ChequeManagement = () => {
  usePageTitle('Cheque Management')
  const { cheques } = useCheques()
  const [statusFilter, setStatusFilter] = useState('all')
  const rows = cheques.filter((row) => statusFilter === 'all' ? true : row.status === statusFilter)

  const selectStyle = {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    borderRadius: 10,
    padding: '4px 12px',
    fontSize: 13,
    border: '1px solid var(--color-border)',
    outline: 'none',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cheque Management"
        subtitle="Track submitted cheques and manage clearance"
        action={
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
            <option value="bounced">Bounced</option>
          </select>
        }
      />
      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
            No cheques found
          </div>
        ) : rows.map((row) => (
          <div key={row.id} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {row.cheque_number} · {row.student_name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {row.bank_name} · Cheque date {formatDate(row.cheque_date)} · Received {formatDate(row.received_date)}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(row.amount)}</span>
                <Badge variant={feeStatusBadge(row.status)} dot>{row.status}</Badge>
                {row.status === 'pending' && (
                  <>
                    <UIButton size="xs" variant="primary" onClick={() => accountantApi.clearCheque(row.id, {}).catch(() => {})}>Clear</UIButton>
                    <UIButton size="xs" variant="danger" onClick={() => accountantApi.bounceCheque(row.id, {}).catch(() => {})}>Bounce</UIButton>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChequeManagement
