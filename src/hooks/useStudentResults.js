import { useCallback, useEffect, useMemo, useState } from 'react'
import * as studentApi from '@/api/studentApi'
import { isStudentPortalSetupError } from '@/utils/studentPortal'

const getDefaultSelection = (exams) => {
  if (!Array.isArray(exams) || exams.length === 0) return null
  return (
    exams.find((exam) => exam.student_status === 'published')?.id ||
    exams[0]?.id ||
    null
  )
}

const useStudentResults = () => {
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [result, setResult] = useState(null)
  const [isWithheld, setIsWithheld] = useState(false)
  const [totalPending, setTotalPending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchExamDetail = useCallback(async (examId, examList = exams) => {
    const exam = examList.find((item) => Number(item.id) === Number(examId))
    setSelectedExamId(Number(examId))

    const nextIsWithheld = exam?.is_withheld || false
    const nextTotalPending = exam?.pending_balance || 0
    setIsWithheld(nextIsWithheld)
    setTotalPending(nextTotalPending)

    if (!exam || exam.student_status !== 'published' || nextIsWithheld) {
      setResult(null)
      return null
    }

    setResult(null)
    setDetailLoading(true)
    try {
      const response = await studentApi.getStudentResultByExam(examId)
      setResult(response?.data || null)
      setDetailLoading(false)
      return response?.data || null
    } catch (err) {
      setDetailLoading(false)
      throw err
    }
  }, [exams])

  const load = useCallback(async ({ silent = false, examId } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await studentApi.getStudentResults()
      const nextExams = response?.data?.exams || []
      const nextExamId = examId || selectedExamId || getDefaultSelection(nextExams)
      
      const currentSelected = nextExams.find((item) => Number(item.id) === Number(nextExamId))
      const nextIsWithheld = currentSelected?.is_withheld || false
      const nextTotalPending = currentSelected?.pending_balance || 0

      setExams(nextExams)
      setIsWithheld(nextIsWithheld)
      setTotalPending(nextTotalPending)
      setSelectedExamId(nextExamId ? Number(nextExamId) : null)

      if (nextExamId && !nextIsWithheld) {
        const selectedExam = nextExams.find((item) => Number(item.id) === Number(nextExamId))
        if (selectedExam?.student_status === 'published') {
          setResult(null)
          const detail = await studentApi.getStudentResultByExam(nextExamId)
          setResult(detail?.data || null)
        } else {
          setResult(null)
        }
      } else {
        setResult(null)
      }

      setLoading(false)
      setRefreshing(false)
      return response?.data || null
    } catch (err) {
      if (isStudentPortalSetupError(err)) {
        setExams([])
        setSelectedExamId(null)
        setResult(null)
        setIsWithheld(false)
        setTotalPending(0)
        setLoading(false)
        setRefreshing(false)
        return null
      }

      setError(err?.message || 'Unable to load exam results.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [selectedExamId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => {})
  }, [load])

  return {
    exams,
    selectedExamId,
    selectedExam: useMemo(
      () => exams.find((exam) => Number(exam.id) === Number(selectedExamId)) || null,
      [exams, selectedExamId]
    ),
    result,
    isWithheld,
    totalPending,
    loading,
    detailLoading,
    refreshing,
    error,
    selectExam: (examId) => fetchExamDetail(examId).catch((err) => {
      setError(err?.message || 'Unable to open that exam result.')
    }),
    refresh: () => load({ silent: true }),
  }
}

export default useStudentResults
