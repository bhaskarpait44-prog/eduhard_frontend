import { useEffect, useRef, useState } from 'react'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import * as accountantApi from '@/api/accountantApi'
import { getStudents } from '@/api/studentsApi'
import { formatCurrency, getInitials } from '@/utils/helpers'

const normalizeStudent = (student = {}) => ({
  ...student,
  first_name: student.first_name || student.student_name?.split(' ')?.[0] || '',
  last_name: student.last_name || student.student_name?.split(' ')?.slice(1).join(' ') || '',
  class_name: student.class_name || student.current_enrollment?.class || '',
  section_name: student.section_name || student.current_enrollment?.section || '',
  pending_amount: student.pending_amount || 0,
})

const StudentSearchBox = ({ onSelect, autoFocus = false }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await accountantApi.searchStudents({ q: query })
        const primaryResults = (response.data?.students || []).map(normalizeStudent)

        if (primaryResults.length > 0) {
          setResults(primaryResults)
          setActiveIndex(0)
          return
        }

        const fallback = await getStudents({ search: query, perPage: 12 })
        setResults((fallback.data?.students || []).map(normalizeStudent))
        setActiveIndex(0)
      } catch {
        try {
          const fallback = await getStudents({ search: query, perPage: 12 })
          setResults((fallback.data?.students || []).map(normalizeStudent))
          setActiveIndex(0)
        } catch {
          setResults([])
        }
      }
    }, 180)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      onSelect(results[activeIndex])
      setQuery(`${results[activeIndex].first_name} ${results[activeIndex].last_name}`)
      setResults([])
    }
  }

  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 px-5 py-3.5 focus-within:border-[#4CC0D4] focus-within:shadow-md transition-all bg-white dark:bg-gray-800"
      >
        <SearchOutlined className="text-gray-400 dark:text-gray-500 text-base" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by student name or admission number..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-semibold"
        />
        <span className="hidden sm:inline-block rounded-lg px-2 py-0.5 text-[10px] font-black bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 select-none">
          Ctrl + F
        </span>
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]) }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <CloseCircleOutlined className="text-base" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl max-h-[380px] overflow-y-auto"
        >
          {results.map((student, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  onSelect(student)
                  setQuery(`${student.first_name} ${student.last_name}`)
                  setResults([])
                }}
                className={`flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors ${
                  isActive 
                    ? 'bg-cyan-50/50 dark:bg-cyan-950/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <Avatar 
                  className="bg-cyan-100 text-cyan-700 font-extrabold dark:bg-cyan-950/40 dark:text-cyan-300 shadow-sm border border-cyan-200/20"
                >
                  {getInitials(`${student.first_name} ${student.last_name}`)}
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                    {student.first_name} {student.last_name}
                  </div>
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5 flex flex-wrap gap-x-2 items-center">
                    <span>{student.admission_no}</span>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span>{student.class_name || '-'} {student.section_name ? `Sec ${student.section_name}` : ''}</span>
                    {student.parent_name && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold">Guardian: {student.parent_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-full px-3.5 py-1 text-[11px] font-black tracking-wide ${
                    Number(student.pending_amount || 0) > 0 
                      ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400' 
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(student.pending_amount || 0)}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentSearchBox
