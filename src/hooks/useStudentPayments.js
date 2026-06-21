import { useEffect, useState, useCallback } from 'react'
import * as studentApi from '@/api/studentApi'

const useStudentPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [receiptLoadingId, setReceiptLoadingId] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await studentApi.getStudentFeePayments()
      const data = Array.isArray(res.data) ? res.data : (res.data?.payments || res.data?.data || [])
      setPayments(data)
    } catch (err) {
      setError(err?.message || 'Failed to load payment history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchReceipt = async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      const res = await studentApi.getStudentFeeReceipt(paymentId)
      return res.data?.data || res.data
    } catch (err) {
      throw err
    } finally {
      setReceiptLoadingId(null)
    }
  }

  return {
    payments,
    loading,
    refreshing,
    receiptLoadingId,
    error,
    refresh: () => fetchData(true),
    fetchReceipt
  }
}

export default useStudentPayments
