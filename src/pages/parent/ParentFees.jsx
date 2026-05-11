import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import { getWards, getWardFees } from '@/api/parentApi'
import { Wallet } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, formatCurrency } from '@/utils/helpers'

export default function ParentFees() {
  usePageTitle('Fees & Dues')
  const [wards, setWards] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [fees, setFees] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getWards().then(res => {
      setWards(res.data)
      if (res.data.length > 0) setSelectedWard(res.data[0])
    })
  }, [])

  useEffect(() => {
    if (selectedWard) {
      setIsLoading(true)
      getWardFees(selectedWard.id)
        .then(res => setFees(res.data))
        .finally(() => setIsLoading(false))
    }
  }, [selectedWard])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Fees & Dues</h1>
            <p className="text-sm font-medium text-gray-500">Manage fee payments and history</p>
          </div>
        </div>

        {wards.length > 1 && (
          <div className="flex items-center gap-2">
            {wards.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWard(w)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedWard?.id === w.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {w.first_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        ) : fees.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No invoices" description="No fee records found for the selected ward." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice / Fee Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{fee.fee_name}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fee.invoice_no}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(fee.due_date)}</td>
                    <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(fee.amount_due)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={fee.status === 'paid' ? 'green' : fee.status === 'overdue' ? 'red' : 'amber'} size="sm" className="uppercase tracking-widest text-[9px] rounded-md">
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
