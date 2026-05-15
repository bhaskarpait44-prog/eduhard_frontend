import { useEffect } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { Wallet } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import WardSelector from '@/components/parent/WardSelector'
import { formatDate, formatCurrency } from '@/utils/helpers'

export default function ParentFees() {
  usePageTitle('Fees & Dues')
  const { 
    wards, selectedWardId, fetchWards, 
    isDetailsLoading, fees 
  } = useParentStore()

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Wallet className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Fees & Ledger</h1>
            <p className="text-sm font-medium text-gray-500">View invoices and payment history</p>
          </div>
        </div>
        <WardSelector />
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        {isDetailsLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Ledger...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No invoices" description="No fee records found for the selected ward." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Fee Description</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-900">{fee.fee_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fee.invoice_no}</p>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">{formatDate(fee.due_date)}</td>
                    <td className="px-8 py-5 text-sm font-black text-right">{formatCurrency(fee.amount_due)}</td>
                    <td className="px-8 py-5 text-center">
                      <Badge variant={fee.status === 'paid' ? 'green' : fee.status === 'overdue' ? 'red' : 'amber'} className="rounded-lg">
                        {fee.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
