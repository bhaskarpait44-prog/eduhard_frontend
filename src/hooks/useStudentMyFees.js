import { useEffect, useState, useCallback } from 'react'
import * as studentApi from '@/api/studentApi'

const useStudentMyFees = () => {
  const [invoices, setInvoices] = useState([])
  const [carriedForwardInvoices, setCarriedForwardInvoices] = useState([])
  const [summary, setSummary] = useState(null)
  const [schoolUpi, setSchoolUpi] = useState(null)
  const [schoolName, setSchoolName] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    
    try {
      const res = await studentApi.getStudentFees()
      const data = res.data?.data || res.data || {}
      
      const allInvoices = data.invoices || []
      setInvoices(allInvoices.filter(inv => !inv.carry_from_invoice_id))
      setCarriedForwardInvoices(allInvoices.filter(inv => inv.carry_from_invoice_id))
      setSummary(data.summary)
      setSchoolUpi(data.school_upi)
      setSchoolName(data.school_name)
    } catch (err) {
      setError(err?.message || 'Failed to load fee information')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openInvoice = async (invoiceId) => {
    setDetailLoading(true)
    try {
      const res = await studentApi.getStudentFeeInvoiceDetail(invoiceId)
      setSelectedInvoice(res.data?.data || res.data)
    } catch (err) {
      throw err
    } finally {
      setDetailLoading(false)
    }
  }

  const closeInvoice = () => setSelectedInvoice(null)

  const fetchReceipt = async (paymentId) => {
    const res = await studentApi.getStudentFeeReceipt(paymentId)
    return res.data?.data || res.data
  }

  return {
    invoices,
    carriedForwardInvoices,
    summary,
    schoolUpi,
    schoolName,
    loading,
    refreshing,
    error,
    refresh: () => fetchData(true),
    selectedInvoice,
    detailLoading,
    openInvoice,
    closeInvoice,
    fetchReceipt
  }
}

export default useStudentMyFees
