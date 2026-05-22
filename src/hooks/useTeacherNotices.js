import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'
import { noticesApi } from '@/api'

const useTeacherNotices = () => {
  const [assignments, setAssignments] = useState([])
  const [notices, setNotices] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [loadingNotices, setLoadingNotices] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadAssignments = useCallback(async () => {
    const res = await teacherApi.getTeacherMyClasses()
    const rows = [...(res?.data?.my_class || []), ...(res?.data?.subject_classes || [])]
    setAssignments(rows)
    return rows
  }, [])

  const loadNotices = useCallback(async (params = {}) => {
    setLoadingNotices(true)
    try {
      const res = await noticesApi.teacherListNotices(params)
      const rows = res?.data?.notices || res?.data || []
      setNotices(rows)
      return rows
    } finally {
      setLoadingNotices(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoadingBase(true)
      try {
        const [assignmentRows, noticeRows] = await Promise.all([
          loadAssignments(),
          loadNotices(),
        ])
        if (!active) return
        setAssignments(assignmentRows)
        setNotices(noticeRows)
      } finally {
        if (active) setLoadingBase(false)
      }
    }

    load().catch(() => {
      if (active) {
        setLoadingBase(false)
        setLoadingNotices(false)
      }
    })

    return () => { active = false }
  }, [loadAssignments, loadNotices])

  const classTeacherSections = useMemo(() => {
    const map = new Map()
    assignments
      .filter((assignment) => assignment.is_class_teacher)
      .forEach((assignment) => {
        const key = `${assignment.class_id}:${assignment.section_id}`
        if (!map.has(key)) {
          map.set(key, {
            value: key,
            label: `${assignment.class_name} ${assignment.section_name}`,
            class_id: assignment.class_id,
            section_id: assignment.section_id,
          })
        }
      })
    return [...map.values()]
  }, [assignments])

  const assignedSections = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      const key = `${assignment.class_id}:${assignment.section_id}`
      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: `${assignment.class_name} ${assignment.section_name}`,
          class_id: assignment.class_id,
          section_id: assignment.section_id,
        })
      }
    })
    return [...map.values()]
  }, [assignments])

  const saveNotice = useCallback(async (payload, noticeId = null) => {
    setSaving(true)
    try {
      const res = noticeId
        ? await noticesApi.teacherUpdateNotice(noticeId, payload)
        : await noticesApi.teacherCreateNotice(payload)
      await loadNotices()
      return res?.data
    } finally {
      setSaving(false)
    }
  }, [loadNotices])

  const deleteNotice = useCallback(async (noticeId) => {
    await noticesApi.teacherDeleteNotice(noticeId)
    await loadNotices()
  }, [loadNotices])

  const markAsRead = useCallback(async (noticeId, source = 'unified') => {
    try {
      await teacherApi.markTeacherNoticeRead(noticeId, source)
      // Optimistic update
      setNotices(prev => prev.map(n => 
        n.id === noticeId && (n.source || 'unified') === source 
          ? { ...n, is_read: true } 
          : n
      ))
    } catch (err) {
      console.error('Failed to mark notice as read', err)
    }
  }, [])

  const assignedSubjects = useMemo(() => {
    const map = new Map()
    assignments
      .filter((a) => a.subject_id)
      .forEach((a) => {
        if (!map.has(a.subject_id)) {
          map.set(a.subject_id, {
            value: String(a.subject_id),
            label: `${a.subject_name} (${a.class_name} ${a.section_name})`,
            class_id: a.class_id,
          })
        }
      })
    return [...map.values()]
  }, [assignments])

  return {
    assignments,
    notices,
    loadingBase,
    loadingNotices,
    saving,
    classTeacherSections,
    assignedSections,
    assignedSubjects,
    loadNotices,
    saveNotice,
    deleteNotice,
    markAsRead,
  }
}

export default useTeacherNotices
