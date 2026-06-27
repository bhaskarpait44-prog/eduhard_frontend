import { useCallback, useEffect, useMemo, useState } from 'react'
import * as teacherApi from '@/api/teacherApi'

const useTeacherStudents = () => {
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classTeacherSections, setClassTeacherSections] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [detailCache, setDetailCache] = useState({})
  const [attendanceCache, setAttendanceCache] = useState({})
  const [resultsCache, setResultsCache] = useState({})
  const [remarksCache, setRemarksCache] = useState({})
  const [loadingStudentId, setLoadingStudentId] = useState(null)

  const fetchStudents = useCallback(async (params = {}) => {
    setLoadingList(true)
    try {
      const res = await teacherApi.getTeacherStudents(params)
      const rows = res?.data?.students || []
      setStudents(rows)
      setSubjects(res?.data?.available_subjects || [])
      setClassTeacherSections(res?.data?.class_teacher_sections || [])
      return rows
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents().catch(() => {
      setLoadingList(false)
    })
  }, [fetchStudents])

  const loadStudentBundle = useCallback(async (studentId) => {
    setLoadingStudentId(studentId)
    try {
      const [detailRes, attendanceRes, resultsRes, remarksRes] = await Promise.allSettled([
        teacherApi.getTeacherStudentDetail(studentId),
        teacherApi.getTeacherStudentAttendance(studentId),
        teacherApi.getTeacherStudentResults(studentId),
        teacherApi.getTeacherStudentRemarks(studentId),
      ])

      const detail = detailRes.status === 'fulfilled' ? (detailRes.value?.data || null) : null
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value?.data?.attendance || []) : []
      const results = resultsRes.status === 'fulfilled' ? (resultsRes.value?.data?.results || []) : []
      const remarks = remarksRes.status === 'fulfilled' ? (remarksRes.value?.data?.remarks || []) : []

      setDetailCache((prev) => ({ ...prev, [studentId]: detail }))
      setAttendanceCache((prev) => ({ ...prev, [studentId]: attendance }))
      setResultsCache((prev) => ({ ...prev, [studentId]: results }))
      setRemarksCache((prev) => ({ ...prev, [studentId]: remarks }))

      return { detail, attendance, results, remarks }
    } finally {
      setLoadingStudentId(null)
    }
  }, [])

  const getStudentBundle = useCallback((studentId) => ({
    detail: detailCache[studentId] || null,
    attendance: attendanceCache[studentId] || [],
    results: resultsCache[studentId] || [],
    remarks: remarksCache[studentId] || [],
  }), [detailCache, attendanceCache, resultsCache, remarksCache])

  const sections = useMemo(() => {
    const classTeacherOptions = []
    const subjectTeacherOptions = []
    const map = new Map()

    students.forEach((student) => {
      const key = `${student.class_id}:${student.section_id}`
      if (!map.has(key)) {
        const isClassTeacher = classTeacherSections.includes(key)
        const option = {
          value: key,
          label: `${student.class_name} ${student.section_name}`,
        }
        map.set(key, option)
        if (isClassTeacher) {
          classTeacherOptions.push(option)
        } else {
          subjectTeacherOptions.push(option)
        }
      }
    })

    const result = []
    if (classTeacherOptions.length > 0) {
      result.push({
        label: 'Class Teacher Sections',
        options: classTeacherOptions,
      })
    }
    if (subjectTeacherOptions.length > 0) {
      result.push({
        label: 'Subject Teacher Sections',
        options: subjectTeacherOptions,
      })
    }
    return result
  }, [students, classTeacherSections])

  return {
    students,
    sections,
    subjects,
    loadingList,
    loadingStudentId,
    fetchStudents,
    loadStudentBundle,
    getStudentBundle,
  }
}

export default useTeacherStudents
