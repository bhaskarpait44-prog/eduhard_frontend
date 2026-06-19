import { formatCurrency } from '@/utils/helpers'

const CollectionChart = ({ items = [] }) => {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">No collection data yet.</p>
      ) : items.map((item) => {
        const percentage = total > 0 ? (Number(item.amount || 0) / total) * 100 : 0
        return (
          <div key={item.payment_mode || item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-700 dark:text-gray-300">{item.payment_mode || item.label}</span>
              <span className="text-gray-500 dark:text-gray-400 font-extrabold">{formatCurrency(item.amount || 0)} • {percentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-cyan-100/50 dark:bg-cyan-950/20 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out" 
                style={{ 
                  width: `${percentage}%`, 
                  background: 'linear-gradient(90deg, #22d3ee 0%, #4cc0d4 100%)' 
                }} 
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CollectionChart

