import { useEffect, useState } from 'react'
import * as accountantApi from '@/api/accountantApi'
const useStudentFees = (params = {}) => {
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)

    accountantApi.getStudentFeesList(params)
      .then((res) => {
        if (active) {
          setStudents(res.data?.students || [])
          setPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 })
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Failed to load students')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => { active = false }
  }, [JSON.stringify(params)])

  return { students, pagination, isLoading, error }
}

export default useStudentFees
