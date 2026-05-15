import { useEffect } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useParentStore from '@/store/parentStore'
import { LineChart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import WardSelector from '@/components/parent/WardSelector'

export default function ParentResults() {
  usePageTitle('Academic Results')
  const { 
    wards, selectedWardId, fetchWards, 
    isDetailsLoading, results 
  } = useParentStore()

  useEffect(() => {
    fetchWards()
  }, [fetchWards])

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-2xl">
            <LineChart className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Academic Performance</h1>
            <p className="text-sm font-medium text-gray-500">Examination results and session progress</p>
          </div>
        </div>
        <WardSelector />
      </div>

      {isDetailsLoading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="w-10 h-10 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compiling Results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-12">
          <EmptyState title="No results" description="No academic results have been published yet for the selected ward." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm group hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">{result.session_name}</p>
                  <h3 className="text-xl font-black text-gray-900">{result.exam_name || 'Final Result'}</h3>
                </div>
                <Badge variant={result.is_promoted ? 'green' : 'red'} className="rounded-lg py-1 uppercase tracking-widest text-[9px]">
                  {result.is_promoted ? 'Promoted' : 'Not Promoted'}
                </Badge>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-5xl font-black text-purple-900">{result.percentage}%</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate</p>
                  </div>
                  <p className="text-sm font-bold text-gray-500 mt-2">Overall Grade: <span className="text-purple-600 text-lg font-black">{result.grade}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Class Rank</p>
                  <p className="text-2xl font-black text-gray-900">{result.rank || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                <button className="text-xs font-bold text-purple-600 hover:underline uppercase tracking-widest">
                  View Detailed Report →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
