import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import { getWards, getWardResults } from '@/api/parentApi'
import { LineChart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'

export default function ParentResults() {
  usePageTitle('Academic Results')
  const [wards, setWards] = useState([])
  const [selectedWard, setSelectedWard] = useState(null)
  const [results, setResults] = useState([])
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
      getWardResults(selectedWard.id)
        .then(res => setResults(res.data))
        .finally(() => setIsLoading(false))
    }
  }, [selectedWard])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl">
            <LineChart className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Academic Results</h1>
            <p className="text-sm font-medium text-gray-500">View examination results and progress</p>
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

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="p-12">
          <EmptyState title="No results" description="No academic results have been published yet for the selected ward." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 mb-1">{result.session_name}</p>
                  <h3 className="text-lg font-black">{result.exam_name || 'Final Examination'}</h3>
                </div>
                <Badge variant={result.is_promoted ? 'green' : 'red'} className="uppercase tracking-widest text-[9px]">
                  {result.is_promoted ? 'Promoted' : 'Not Promoted'}
                </Badge>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{result.percentage}%</p>
                  <p className="text-sm font-bold text-gray-500 mt-1">Overall Grade: <span className="text-purple-600">{result.grade}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Rank in Class</p>
                  <p className="text-lg font-black">{result.rank || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
