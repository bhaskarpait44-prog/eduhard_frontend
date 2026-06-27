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
      const rows = res?.data?.notices || []
      setNotices(rows)
      setUnreadCount(res?.data?.unread_count ?? rows.filter(n => !n.is_read).length)
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

  const markRead = useCallback(async (noticeId, source = 'unified') => {
    setActionId(noticeId)
    try {
      await noticesApi.markNoticeRead(noticeId, source)
      setNotices((prev) => prev.map((notice) => (
        Number(notice.id) === Number(noticeId) && (notice.source || 'unified') === source 
          ? { ...notice, is_read: true } 
          : notice
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
    const source = notice.source || 'unified'
    try {
      if (notice.is_pinned) await noticesApi.unpinNotice(notice.id, source)
      else await noticesApi.pinNotice(notice.id, source)

      setNotices((prev) => prev
        .map((row) => Number(row.id) === Number(notice.id) && (row.source || 'unified') === source
          ? { ...row, is_pinned: !row.is_pinned } 
          : row
        )
      )
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
