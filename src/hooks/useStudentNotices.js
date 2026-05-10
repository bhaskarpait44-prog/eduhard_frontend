import { useCallback, useEffect, useState } from 'react'
import { noticesApi } from '@/api'

const useStudentNotices = () => {
  const [notices, setNotices] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async ({ silent = false, category } = {}) => {
    setError(null)
    if (silent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await noticesApi.getStudentNotices(category && category !== 'all' ? { category } : {})
      const rows = res?.data || []
      setNotices(rows)
      setUnreadCount(rows.filter(n => !n.is_read).length)
      setLoading(false)
      setRefreshing(false)
      return rows
    } catch (err) {
      setError(err?.message || 'Unable to load notices.')
      setLoading(false)
      setRefreshing(false)
      throw err
    }
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const markRead = useCallback(async (noticeId) => {
    setActionId(noticeId)
    try {
      await noticesApi.markNoticeRead(noticeId)
      setNotices((prev) => prev.map((notice) => (
        Number(notice.id) === Number(noticeId) ? { ...notice, is_read: true } : notice
      )))
      setUnreadCount((prev) => Math.max(prev - 1, 0))
      setActionId(null)
    } catch (err) {
      setActionId(null)
      throw err
    }
  }, [])

  const togglePin = useCallback(async (notice) => {
    setActionId(notice.id)
    try {
      if (notice.is_pinned) await noticesApi.unpinNotice(notice.id)
      else await noticesApi.pinNotice(notice.id)

      setNotices((prev) => prev
        .map((row) => Number(row.id) === Number(notice.id) ? { ...row, is_pinned: !row.is_pinned } : row))
      setActionId(null)
    } catch (err) {
      setActionId(null)
      throw err
    }
  }, [])

  return {
    notices,
    unreadCount,
    loading,
    refreshing,
    actionId,
    error,
    refresh: (category) => load({ silent: true, category }),
    loadCategory: (category) => load({ category }),
    markRead,
    togglePin,
  }
}

export default useStudentNotices
