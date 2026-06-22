import { useEffect, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import useSessionStore from '@/store/sessionStore'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const MonthlyReport = () => {
  usePageTitle('Monthly Collection Report')
  const { currentSession, fetchCurrentSession } = useSessionStore()

  useEffect(() => {
    if (!currentSession) fetchCurrentSession().catch(() => {})
  }, [currentSession, fetchCurrentSession])

  const params = useMemo(() => ({
    ...(currentSession?.id ? { session_id: currentSession.id } : {}),
  }), [currentSession?.id])

  const { data, isLoading, error } = useReports(accountantApi.getMonthlyReport, params)

  return (
    <ReportScaffold
      title="Monthly Collection Report"
      data={data}
      rowsKey="days"
      isLoading={isLoading}
      error={error}
      columns={[
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'collection', label: 'Collection', format: 'currency' },
        { key: 'transactions', label: 'Transactions' },
      ]}
    />
  )
}

export default MonthlyReport
