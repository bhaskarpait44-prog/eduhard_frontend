import useParentStore from '@/store/parentStore'

const WardSelector = () => {
  const { wards, selectedWardId, selectWard } = useParentStore()

  if (wards.length <= 1) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {wards.map(w => (
        <button
          key={w.id}
          onClick={() => selectWard(w.id)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 border ${
            selectedWardId === w.id 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none' 
              : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm'
          }`}
        >
          {w.first_name}
        </button>
      ))}
    </div>
  )
}

export default WardSelector
