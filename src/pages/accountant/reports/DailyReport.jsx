import { useEffect, useMemo, useState } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import usePageTitle from '@/hooks/usePageTitle'
import useReports from '@/hooks/useReports'
import useSessionStore from '@/store/sessionStore'
import * as accountantApi from '@/api/accountantApi'
import ReportScaffold from './ReportScaffold'

const todayKey = () => {
  const date = new Date()
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

const DailyReport = () => {
  usePageTitle('Daily Collection Report')
  const [date, setDate] = useState(todayKey())
  const { currentSession, fetchCurrentSession } = useSessionStore()

  useEffect(() => {
    if (!currentSession) fetchCurrentSession().catch(() => {})
  }, [currentSession, fetchCurrentSession])

  const params = useMemo(() => ({
    date,
    ...(currentSession?.id ? { session_id: currentSession.id } : {}),
  }), [date, currentSession?.id])

  const { data, isLoading, error } = useReports(accountantApi.getDailyReport, params)

  return (
    <ReportScaffold
      title="Daily Collection Report"
      data={data}
      rowsKey="transactions"
      isLoading={isLoading}
      error={error}
      actions={(
        <DatePicker
          value={date ? dayjs(date) : null}
          maxDate={dayjs()}
          onChange={(nextDate) => setDate(nextDate ? nextDate.format('YYYY-MM-DD') : todayKey())}
        />
      )}
      columns={[
        { key: 'payment_date', label: 'Date', format: 'date' },
        { key: 'student_name', label: 'Student' },
        { key: 'class_name', label: 'Class' },
        { key: 'fee_name', label: 'Fee Type' },
        { key: 'amount', label: 'Amount', format: 'currency' },
        { key: 'payment_mode', label: 'Mode' },
      ]}
    />
  )
}

export default DailyReport
