import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenText, CalendarRange, ChevronDown, ChevronRight, Clock,
  Grid3x3, School2, ShieldCheck, UserRoundCheck, Zap,
  Pencil, Trash2, FileDown, Copy, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, TrendingUp, BarChart2, FileText
} from 'lucide-react'
import * as teacherControlApi from '@/api/adminTeacherControlApi'
import { pdf } from '@react-pdf/renderer'
import { TeacherAssignmentListPDF } from '@/pdf/TeacherAssignmentListPDF'
import { TimetablePDF } from '@/pdf/TimetablePDF'
import { getSettings } from '@/api/settingsApi'
import { getClasses, getClassList, getSections, getSubjects } from '@/api/classApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatTime } from '@/utils/helpers'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import TimePicker12h from '@/components/shared/TimePicker12h'
import Modal from '@/components/ui/Modal'

const DAY_OPTIONS = [
  { value: 'monday',    label: 'Mon' },
  { value: 'tuesday',   label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday',  label: 'Thu' },
  { value: 'friday',    label: 'Fri' },
  { value: 'saturday',  label: 'Sat' },
]

const DAY_FULL = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

const PERIOD_TIMES = {
  1: '08:00 AM – 08:45 AM', 2: '08:45 AM – 09:30 AM', 3: '09:30 AM – 10:15 AM',
  4: '10:30 AM – 11:15 AM', 5: '11:15 AM – 12:00 PM', 6: '12:30 PM – 01:15 PM', 7: '01:15 PM – 02:00 PM',
}

const SUBJECT_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16',
]

const STREAM_OPTIONS = [
  { value: '', label: 'All Streams' },
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'science', label: 'Science' },
]

/* ─── helpers ─── */
const subjectColor = (id) => SUBJECT_COLORS[(id || 0) % SUBJECT_COLORS.length]

/* ════════════════════════════════════════════════════════════════════════════
   Main page
════════════════════════════════════════════════════════════════════════════ */
const AdminTeacherControlPage = () => {
  usePageTitle('Teacher Control')
  const { toastSuccess, toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [session, setSession] = useState(null)
  const [overview, setOverview]     = useState({})
  const [teachers, setTeachers]     = useState([])
  const [classes,  setClasses]      = useState([])
  const [sectionsByClass, setSectionsByClass] = useState({})
  const [subjectsByClass, setSubjectsByClass] = useState({})
  const [assignments, setAssignments] = useState([])
  const [timetable,   setTimetable]   = useState([])
  const [leaves,      setLeaves]      = useState([])
  const [corrections, setCorrections] = useState([])
  const [studentCorrections, setStudentCorrections] = useState([])
  const [homework,    setHomework]    = useState([])
  const [selectedLeave, setSelectedLeave] = useState(null)

  const [tab, setTab] = useState('assignments')

  /* timetable view mode */
  const [ttView, setTtView]       = useState('grid') // 'grid' | 'list'
  const [ttFilterClass, setTtFilterClass]     = useState('')
  const [ttFilterSection, setTtFilterSection] = useState('')
  const [ttFilterTeacher, setTtFilterTeacher] = useState('')
  const [ttFilterStream, setTtFilterStream]   = useState('')

  /* assignment filter */
  const [aFilterClass, setAFilterClass]     = useState('')
  const [aFilterSection, setAFilterSection] = useState('')
  const [aFilterStream, setAFilterStream]   = useState('')

  /* ── auto-clear filters ── */
  useEffect(() => {
    if (aFilterStream && aFilterClass) {
      const cls = classes.find((c) => String(c.id) === aFilterClass)
      if (cls && cls.stream && cls.stream !== aFilterStream) setAFilterClass('')
    }
  }, [aFilterStream, aFilterClass, classes])

  useEffect(() => {
    if (ttFilterStream && ttFilterClass) {
      const cls = classes.find((c) => String(c.id) === ttFilterClass)
      if (cls && cls.stream && cls.stream !== ttFilterStream) setTtFilterClass('')
    }
  }, [ttFilterStream, ttFilterClass, classes])

  /* forms */
  const [assignmentForm, setAssignmentForm] = useState({
    id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '', is_class_teacher: false,
  })
  const [slotForm, setSlotForm] = useState({
    id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '',
    day_of_week: 'monday', period_number: '1',
    start_time: '08:00', end_time: '08:45', room_number: '',
  })
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [showSlotForm,   setShowSlotForm]   = useState(false)

  const [periodTimes, setPeriodTimes] = useState(() => {
    const saved = localStorage.getItem('timetable_period_times:v1')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Fallback below
      }
    }
    return {
      1: { start: '08:00', end: '08:45' },
      2: { start: '08:45', end: '09:30' },
      3: { start: '09:30', end: '10:15' },
      4: { start: '10:30', end: '11:15' },
      5: { start: '11:15', end: '12:00' },
      6: { start: '12:30', end: '13:15' },
      7: { start: '13:15', end: '14:00' },
    }
  })
  const [showPeriodConfig, setShowPeriodConfig] = useState(false)

  const handlePeriodTimeChange = (periodNum, field, value) => {
    const updated = {
      ...periodTimes,
      [periodNum]: {
        ...periodTimes[periodNum],
        [field]: value
      }
    }
    setPeriodTimes(updated)
    localStorage.setItem('timetable_period_times:v1', JSON.stringify(updated))
  }

  const handleAddPeriod = () => {
    const nextPeriod = Object.keys(periodTimes).length + 1
    const lastPeriod = periodTimes[nextPeriod - 1]
    const defaultStart = lastPeriod ? lastPeriod.end : '08:00'
    const [h, m] = defaultStart.split(':')
    // Bug #9 fix: guard midnight rollover by capping total minutes within a day
    const totalMinutes = (parseInt(h, 10) * 60 + parseInt(m, 10) + 45) % (24 * 60)
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    const defaultEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`

    const updated = {
      ...periodTimes,
      [nextPeriod]: { start: defaultStart, end: defaultEnd }
    }
    setPeriodTimes(updated)
    localStorage.setItem('timetable_period_times:v1', JSON.stringify(updated))
  }

  const handleDeleteLastPeriod = () => {
    const keys = Object.keys(periodTimes).map(Number).sort((a, b) => a - b)
    if (keys.length <= 1) return // Keep at least 1 period
    const lastKey = keys[keys.length - 1]
    const updated = { ...periodTimes }
    delete updated[lastKey]
    setPeriodTimes(updated)
    localStorage.setItem('timetable_period_times:v1', JSON.stringify(updated))
  }

  const handlePeriodNumberChange = (num) => {
    const pTimes = periodTimes[num]
    setSlotForm((prev) => ({
      ...prev,
      period_number: num,
      start_time: pTimes ? pTimes.start : prev.start_time,
      end_time: pTimes ? pTimes.end : prev.end_time,
    }))
  }

  /* ── load ── */
  const load = async () => {
    setLoading(true)
    try {
      // Bug #4 fix: use Promise.allSettled so one failing API doesn't wipe all other data
      const [
        overviewRes, assignmentsRes, timetableRes, homeworkRes,
        leaveRes, correctionsRes, studentCorrectionsRes, teachersRes, classesRes,
      ] = await Promise.allSettled([
        teacherControlApi.getTeacherControlOverview(),
        teacherControlApi.getTeacherControlAssignments(),
        teacherControlApi.getTeacherControlTimetable(),
        teacherControlApi.getTeacherControlHomework(),
        teacherControlApi.getTeacherControlLeave(),
        teacherControlApi.getTeacherControlCorrections(),
        teacherControlApi.getStudentControlCorrections(),
        teacherControlApi.getTeacherControlTeachers(),
        getClasses(),
      ])
      const val = (r, path) => {
        if (r.status !== 'fulfilled') return undefined
        return path.split('.').reduce((o, k) => o?.[k], r.value)
      }
      if (overviewRes.status === 'fulfilled') {
        setSession(overviewRes.value?.data?.session || null)
        setOverview(overviewRes.value?.data?.counts  || {})
      } else { toastError('Failed to load overview.') }
      setAssignments(val(assignmentsRes,  'data.assignments') || [])
      setTimetable(  val(timetableRes,    'data.timetable')   || [])
      setHomework(   val(homeworkRes,     'data.homework')     || [])
      setLeaves(     val(leaveRes,        'data.applications') || [])
      setCorrections(val(correctionsRes,  'data.requests')     || [])
      setStudentCorrections(val(studentCorrectionsRes, 'data.requests') || [])
      setTeachers(   val(teachersRes,     'data.teachers')     || [])
      if (classesRes.status === 'fulfilled') setClasses(getClassList(classesRes.value))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => toastError('Failed to load teacher control data.')) }, [])

  /* ── lazy load sections/subjects ── */
  const ensureClassMeta = async (classId) => {
    if (!classId) return
    if (!sectionsByClass[classId]) {
      const r = await getSections(classId)
      setSectionsByClass((p) => ({ ...p, [classId]: Array.isArray(r?.data) ? r.data : (r?.data?.sections || []) }))
    }
    if (!subjectsByClass[classId]) {
      const r = await getSubjects(classId)
      setSubjectsByClass((p) => ({ ...p, [classId]: Array.isArray(r?.data) ? r.data : (r?.data?.subjects || []) }))
    }
  }
  // Bug #5 fix: only call ensureClassMeta when class_id is non-empty
  useEffect(() => { if (assignmentForm.class_id) ensureClassMeta(assignmentForm.class_id).catch(() => {}) }, [assignmentForm.class_id])
  useEffect(() => { if (slotForm.class_id)       ensureClassMeta(slotForm.class_id).catch(() => {}) },       [slotForm.class_id])

  /* ── derived options ── */
  const classOptions   = useMemo(() => classes.map((r) => ({
    value: String(r.id),
    label: r.stream ? `${r.name} (${r.stream.charAt(0).toUpperCase() + r.stream.slice(1)})` : r.name
  })), [classes])

  const aClassOptionsFiltered = useMemo(() => {
    let list = classes
    if (aFilterStream) list = list.filter((c) => c.stream === aFilterStream)
    return list.map((r) => ({
      value: String(r.id),
      label: r.stream ? `${r.name} (${r.stream.charAt(0).toUpperCase() + r.stream.slice(1)})` : r.name
    }))
  }, [classes, aFilterStream])

  const ttClassOptionsFiltered = useMemo(() => {
    let list = classes
    if (ttFilterStream) list = list.filter((c) => c.stream === ttFilterStream)
    return list.map((r) => ({
      value: String(r.id),
      label: r.stream ? `${r.name} (${r.stream.charAt(0).toUpperCase() + r.stream.slice(1)})` : r.name
    }))
  }, [classes, ttFilterStream])

  const teacherOptions = useMemo(() => teachers.map((r) => ({ value: String(r.id), label: r.name })), [teachers])

  const aSection = useMemo(() => (sectionsByClass[assignmentForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, assignmentForm.class_id])
  const aSubject = useMemo(() => (subjectsByClass[assignmentForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [subjectsByClass, assignmentForm.class_id])

  const slotSectionOpts  = useMemo(() => (sectionsByClass[slotForm.class_id] || []).map((r) => ({ value: String(r.id), label: r.name })), [sectionsByClass, slotForm.class_id])
  // Bug #6 fix: deduplicate by subject_id — same subject assigned across multiple sections
  // would otherwise produce duplicate options in the slot form dropdown
  const slotSubjectOpts = useMemo(() => {
    const seen = new Set()
    return assignments
      .filter((a) =>
        !a.is_class_teacher && a.is_active &&
        (!slotForm.teacher_id || String(a.teacher_id) === String(slotForm.teacher_id)) &&
        (!slotForm.class_id   || String(a.class_id)   === String(slotForm.class_id))   &&
        (!slotForm.section_id || String(a.section_id) === String(slotForm.section_id))
      )
      .reduce((acc, a) => {
        const key = String(a.subject_id)
        if (!seen.has(key)) { seen.add(key); acc.push({ value: key, label: a.subject_name }) }
        return acc
      }, [])
  }, [assignments, slotForm])

  /* ── assignment groups ── */
  const assignmentsByClass = useMemo(() => {
    const groups = new Map()
    assignments.forEach((item) => {
      const key = `${item.class_id}:${item.section_id}`
      if (!groups.has(key)) groups.set(key, { 
        key, 
        class_id: item.class_id,
        section_id: item.section_id,
        class_name: item.class_name, 
        class_stream: item.class_stream,
        section_name: item.section_name, 
        session_name: item.session_name, 
        classTeacher: null, 
        subjectTeachers: [], 
        inactiveCount: 0 
      })
      const g = groups.get(key)
      if (!item.is_active) g.inactiveCount++  // kept: counts all inactives incl. classTeacher for total badge
      if (item.is_class_teacher) g.classTeacher = item
      else {
        g.subjectTeachers.push(item)
        // Bug #7 fix: only count inactive SUBJECT teachers — class teacher being inactive
        // shouldn't inflate the "X inactive" subjects badge on the card
        if (!item.is_active) g.inactiveCount++
      }
    })
    return Array.from(groups.values())
      .map((g) => ({ ...g, subjectTeachers: g.subjectTeachers.sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || '')) }))
      .sort((a, b) => (a.class_name || '').localeCompare(b.class_name || '') || (a.section_name || '').localeCompare(b.section_name || ''))
  }, [assignments])

  const filteredGroups = useMemo(() => assignmentsByClass.filter((g) =>
    (!aFilterClass   || String(g.class_id)   === aFilterClass) &&
    (!aFilterSection || String(g.section_id) === aFilterSection) &&
    (!aFilterStream  || g.class_stream       === aFilterStream)
  ), [assignmentsByClass, aFilterClass, aFilterSection, aFilterStream])

  /* ── timetable grid ── */
  const filteredSlots = useMemo(() => timetable.filter((s) =>
    (!ttFilterClass   || String(s.class_id)   === ttFilterClass)   &&
    (!ttFilterSection || String(s.section_id) === ttFilterSection) &&
    (!ttFilterTeacher || String(s.teacher_id) === ttFilterTeacher) &&
    (!ttFilterStream  || s.class_stream       === ttFilterStream)
  ), [timetable, ttFilterClass, ttFilterSection, ttFilterTeacher, ttFilterStream])

  /* grid: day × period matrix */
  const ttMatrix = useMemo(() => {
    const matrix = {}
    filteredSlots.forEach((s) => {
      const day = s.day_of_week
      const p   = s.period_number
      if (!matrix[day]) matrix[day] = {}
      if (!matrix[day][p]) matrix[day][p] = []
      matrix[day][p].push(s)
    })
    return matrix
  }, [filteredSlots])

  /* ── actions ── */
  const handleExportAssignments = async () => {
    try {
      const settingsRes = await getSettings()
      const schoolData = {
        name: settingsRes.data?.school_name,
        email: settingsRes.data?.school_email,
        phone: settingsRes.data?.school_phone,
        address: settingsRes.data?.school_address,
        logo_url: settingsRes.data?.logo_url,
      }

      const blob = await pdf(
        <TeacherAssignmentListPDF
          groups={filteredGroups}
          school={schoolData}
          session={session}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Teacher_Assignments_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toastError('Failed to export PDF.')
    }
  }

  const handleExportTimetable = async () => {
    try {
      const settingsRes = await getSettings()
      const schoolData = {
        name: settingsRes.data?.school_name,
        email: settingsRes.data?.school_email,
        phone: settingsRes.data?.school_phone,
        address: settingsRes.data?.school_address,
        logo_url: settingsRes.data?.logo_url,
      }

      const activeClass = classes.find((c) => String(c.id) === ttFilterClass);
      const activeTeacher = teachers.find((t) => String(t.id) === ttFilterTeacher);

      const filterClassName = activeClass 
        ? `${activeClass.name}${activeClass.stream ? ` (${activeClass.stream.toUpperCase()})` : ''} - ${ttFilterSection ? (sectionsByClass[ttFilterClass]?.find(s => String(s.id) === ttFilterSection)?.name || 'All Sections') : 'All Sections'}` 
        : '';
      const filterTeacherName = activeTeacher ? activeTeacher.name : '';

      // If both are unfiltered, export all classes/sections
      const isAllClasses = !ttFilterClass && !ttFilterTeacher;

      let pdfDoc;
      if (isAllClasses) {
        // Collect all sections
        const classSectionTargets = []
        classes.forEach((c) => {
          if (Array.isArray(c.sections)) {
            c.sections.forEach((s) => {
              classSectionTargets.push({
                class_id: c.id,
                section_id: s.id,
                class_name: c.name,
                section_name: s.name,
                class_stream: c.stream,
              })
            })
          }
        })

        pdfDoc = (
          <TimetablePDF
            mode="all_classes"
            slots={timetable}
            periodTimes={periodTimes}
            school={schoolData}
            session={session}
            sections={classSectionTargets}
          />
        );
      } else {
        pdfDoc = (
          <TimetablePDF
            slots={filteredSlots}
            periodTimes={periodTimes}
            school={schoolData}
            session={session}
            filterClassName={filterClassName}
            filterTeacherName={filterTeacherName}
          />
        );
      }

      const blob = await pdf(pdfDoc).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = isAllClasses 
        ? `All_Classes_Weekly_Timetable_${new Date().toISOString().slice(0, 10)}.pdf` 
        : `Weekly_Timetable_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toastError('Failed to export PDF.')
    }
  }


  const handleAssignmentSave = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!assignmentForm.teacher_id) return toastError('Please select a teacher.')
    if (!assignmentForm.class_id)   return toastError('Please select a class.')
    if (!assignmentForm.section_id) return toastError('Please select a section.')
    if (!assignmentForm.is_class_teacher && !assignmentForm.subject_id) {
      return toastError('Subject must be selected for subject teacher assignments.')
    }

    setSaving(true)
    try {
      const data = {
        teacher_id: Number(assignmentForm.teacher_id),
        class_id:   Number(assignmentForm.class_id),
        section_id: Number(assignmentForm.section_id),
        subject_id: assignmentForm.is_class_teacher ? null : Number(assignmentForm.subject_id),
        is_class_teacher: assignmentForm.is_class_teacher,
      }
      if (assignmentForm.id) {
        await teacherControlApi.updateTeacherControlAssignment(assignmentForm.id, data)
        toastSuccess('Assignment updated.')
      } else {
        await teacherControlApi.createTeacherControlAssignment(data)
        toastSuccess('Assignment created.')
      }
      setAssignmentForm({ id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '', is_class_teacher: false })
      setShowAssignForm(false)
      await load()
    } catch (err) { toastError(err?.message || 'Unable to save.') }
    finally { setSaving(false) }
  }

  const editAssignment = (item) => {
    setAssignmentForm({
      id: item.id,
      teacher_id: String(item.teacher_id),
      class_id: String(item.class_id),
      section_id: String(item.section_id),
      subject_id: item.subject_id ? String(item.subject_id) : '',
      is_class_teacher: item.is_class_teacher,
    })
    setShowAssignForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return
    setSaving(true)
    try {
      await teacherControlApi.deleteTeacherControlAssignment(id)
      toastSuccess('Assignment deleted.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed to delete.') }
    finally { setSaving(false) }
  }

  const toggleAssignment = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlAssignment(item.id, { is_active: !item.is_active })
      toastSuccess('Updated.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const handleSlotSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        teacher_id:    Number(slotForm.teacher_id),
        class_id:      Number(slotForm.class_id),
        section_id:    Number(slotForm.section_id),
        subject_id:    Number(slotForm.subject_id),
        day_of_week:   slotForm.day_of_week,
        period_number: Number(slotForm.period_number),
        start_time:    slotForm.start_time,
        end_time:      slotForm.end_time,
        room_number:   slotForm.room_number || null,
      }
      if (slotForm.id) {
        await teacherControlApi.updateTeacherControlTimetableSlot(slotForm.id, payload)
        toastSuccess('Slot updated.')
      } else {
        await teacherControlApi.createTeacherControlTimetableSlot(payload)
        toastSuccess('Slot created.')
      }
      setSlotForm({
        id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '',
        day_of_week: 'monday', period_number: '1',
        start_time: '08:00', end_time: '08:45', room_number: '',
      })
      setShowSlotForm(false)
      await load()
    } catch (err) { toastError(err?.message || 'Unable to save slot.') }
    finally { setSaving(false) }
  }

  const editSlot = (item) => {
    setSlotForm({
      id: item.id,
      teacher_id: String(item.teacher_id),
      class_id: String(item.class_id),
      section_id: String(item.section_id),
      subject_id: String(item.subject_id),
      day_of_week: item.day_of_week,
      period_number: String(item.period_number),
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
      room_number: item.room_number || '',
    })
    setShowSlotForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable slot?')) return
    setSaving(true)
    try {
      await teacherControlApi.deleteTeacherControlTimetableSlot(id)
      toastSuccess('Timetable slot deleted.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed to delete.') }
    finally { setSaving(false) }
  }

  const toggleSlot = async (item) => {
    setSaving(true)
    try {
      await teacherControlApi.updateTeacherControlTimetableSlot(item.id, { is_active: !item.is_active })
      toastSuccess('Updated.')
      await load()
    } catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const handleSlotDrop = async (slot, targetDay, targetPeriod, isCopy = false) => {
    if (!isCopy && slot.day_of_week === targetDay && slot.period_number === Number(targetPeriod)) {
      return
    }

    const pTimes = periodTimes[targetPeriod]
    const start = pTimes ? pTimes.start : '08:00'
    const end = pTimes ? pTimes.end : '08:45'

    const payload = {
      teacher_id:    Number(slot.teacher_id),
      class_id:      Number(slot.class_id),
      section_id:    Number(slot.section_id),
      subject_id:    Number(slot.subject_id),
      day_of_week:   targetDay,
      period_number: Number(targetPeriod),
      start_time:    start,
      end_time:      end,
      room_number:   slot.room_number || null,
    }

    const previousTimetable = [...timetable]

    if (isCopy) {
      const tempId = Date.now()
      setTimetable((prev) => [
        ...prev,
        {
          ...slot,
          id: tempId,
          day_of_week: targetDay,
          period_number: Number(targetPeriod),
          start_time: start,
          end_time: end,
        }
      ])

      setSaving(true)
      try {
        await teacherControlApi.createTeacherControlTimetableSlot(payload)
        toastSuccess('Slot duplicated successfully.')
        await load()
      } catch (err) {
        toastError(err?.message || 'Failed to duplicate slot.')
        setTimetable(previousTimetable)
      } finally {
        setSaving(false)
      }
    } else {
      // Optimistic Update
      setTimetable((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? { ...s, day_of_week: targetDay, period_number: Number(targetPeriod), start_time: start, end_time: end }
            : s
        )
      )

      setSaving(true)
      try {
        await teacherControlApi.updateTeacherControlTimetableSlot(slot.id, payload)
        toastSuccess('Slot rescheduled successfully.')
        await load()
      } catch (err) {
        toastError(err?.message || 'Failed to reschedule slot.')
        setTimetable(previousTimetable)
      } finally {
        setSaving(false)
      }
    }
  }

  const duplicateSlot = (item) => {
    setSlotForm({
      id: null,
      teacher_id: String(item.teacher_id),
      class_id: String(item.class_id),
      section_id: String(item.section_id),
      subject_id: String(item.subject_id),
      day_of_week: item.day_of_week,
      period_number: String(item.period_number),
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
      room_number: item.room_number || '',
    })
    setShowSlotForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reviewLeave = async (item, status) => {
    setSaving(true)
    try { await teacherControlApi.reviewTeacherControlLeave(item.id, { status }); toastSuccess(`Leave ${status}.`); await load() }
    catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const reviewCorrection = async (item, status) => {
    setSaving(true)
    try { await teacherControlApi.reviewTeacherControlCorrection(item.id, { status }); toastSuccess(`Correction ${status}.`); await load() }
    catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const reviewStudentCorrection = async (item, status) => {
    setSaving(true)
    try { await teacherControlApi.reviewStudentControlCorrection(item.id, { status }); toastSuccess(`Student correction ${status}.`); await load() }
    catch (err) { toastError(err?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  /* ── render ── */
  return (
    <div className="space-y-5 pb-20">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Teacher Control Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage assignments, timetable, leave approvals and correction requests
          </p>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserRoundCheck} label="Total Teachers" value={overview.teachers} color="bg-indigo-500" />
        <StatCard icon={School2} label="Active Assignments" value={overview.active_assignments} color="bg-sky-500" />
        <StatCard icon={CalendarRange} label="Pending Leaves" value={overview.pending_leaves} color="bg-violet-500" />
        <StatCard icon={ShieldCheck} label="Pending Corrections" value={overview.pending_corrections} color="bg-emerald-500" />
      </div>

      {/* ── Tabs ── */}
      <nav className="flex flex-wrap gap-2">
        {[
          { id: 'assignments', label: 'Assignments', icon: School2 },
          { id: 'timetable',   label: 'Timetable',   icon: CalendarRange },
          { id: 'workflows',   label: 'Workflows',    icon: ShieldCheck },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id} type="button" onClick={() => setTab(id)}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === id ? '#0f766e' : 'var(--color-surface)',
              color: tab === id ? '#fff' : 'var(--color-text-primary)',
              border: `1px solid ${tab === id ? '#0f766e' : 'var(--color-border)'}`,
            }}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </nav>

      {/* ════════════════════════════════════════
          TAB: ASSIGNMENTS
      ════════════════════════════════════════ */}
      {tab === 'assignments' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <SmallSelect
                value={aFilterStream}
                onChange={(e) => setAFilterStream(e.target.value)}
                options={STREAM_OPTIONS}
              />
              <SmallSelect
                value={aFilterClass}
                onChange={(e) => { setAFilterClass(e.target.value); setAFilterSection('') }}
                options={[{ value: '', label: 'All Classes' }, ...aClassOptionsFiltered]}
              />
              {aFilterClass && (
                <SmallSelect
                  value={aFilterSection}
                  onChange={(e) => setAFilterSection(e.target.value)}
                  options={[{ value: '', label: 'All Sections' }, ...(sectionsByClass[aFilterClass] || []).map((s) => ({ value: String(s.id), label: s.name }))]}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportAssignments}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <FileDown size={14} />Export PDF
              </button>
              <button
                type="button"
                onClick={() => setShowAssignForm((p) => !p)}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all"
                style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none' }}
              >
                <Zap size={14} />{showAssignForm ? 'Cancel' : 'New Assignment'}
              </button>
            </div>
          </div>

          {/* create form */}
          {showAssignForm && (
            <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{assignmentForm.id ? 'Edit' : 'Create'} Assignment</p>
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" onSubmit={handleAssignmentSave}>
                <Select label="Teacher" value={assignmentForm.teacher_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, teacher_id: e.target.value }))} options={teacherOptions} required />
                <Select label="Class"   value={assignmentForm.class_id}   onChange={(e) => setAssignmentForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
                <Select label="Section" value={assignmentForm.section_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, section_id: e.target.value }))} options={aSection} required />
                <Select label="Subject" value={assignmentForm.subject_id} onChange={(e) => setAssignmentForm((p) => ({ ...p, subject_id: e.target.value }))} options={aSubject} disabled={assignmentForm.is_class_teacher} placeholder={assignmentForm.is_class_teacher ? 'N/A for class teacher' : 'Select subject'} />
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentForm((p) => ({ ...p, is_class_teacher: !p.is_class_teacher, subject_id: '' }))}
                    className="flex-1 min-h-11 rounded-2xl px-3 text-xs font-semibold transition-all"
                    style={{ backgroundColor: assignmentForm.is_class_teacher ? '#0f766e' : 'var(--color-surface-raised)', color: assignmentForm.is_class_teacher ? '#fff' : 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  >
                    {assignmentForm.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                  </button>
                  <Button type="submit" variant="primary" loading={saving}>{assignmentForm.id ? 'Update' : 'Add'}</Button>
                </div>
              </form>
            </div>
          )}

          {/* assignment list */}
          {loading ? <GridSkeleton /> : !filteredGroups.length ? (
            <EmptyState icon={School2} title="No assignments" description="Create a teacher assignment to get started." />
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => (
                <AssignmentCard key={group.key} group={group} onToggle={toggleAssignment} onEdit={editAssignment} onDelete={deleteAssignment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: TIMETABLE
      ════════════════════════════════════════ */}
      {tab === 'timetable' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SmallSelect
                value={ttFilterStream}
                onChange={(e) => setTtFilterStream(e.target.value)}
                options={STREAM_OPTIONS}
              />
              <SmallSelect value={ttFilterClass} onChange={(e) => { setTtFilterClass(e.target.value); setTtFilterSection('') }} options={[{ value: '', label: 'All Classes' }, ...ttClassOptionsFiltered]} />
              {ttFilterClass && (
                <SmallSelect value={ttFilterSection} onChange={(e) => setTtFilterSection(e.target.value)} options={[{ value: '', label: 'All Sections' }, ...(sectionsByClass[ttFilterClass] || []).map((s) => ({ value: String(s.id), label: s.name }))]} />
              )}
              <SmallSelect value={ttFilterTeacher} onChange={(e) => setTtFilterTeacher(e.target.value)} options={[{ value: '', label: 'All Teachers' }, ...teacherOptions]} />
              {/* view toggle */}
              <div className="flex overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                {[{ id: 'grid', Icon: Grid3x3 }, { id: 'list', Icon: CalendarRange }].map(({ id, Icon }) => (
                  <button key={id} type="button" onClick={() => setTtView(id)}
                    className="flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold transition-all"
                    style={{ backgroundColor: ttView === id ? '#0f766e' : 'var(--color-surface)', color: ttView === id ? '#fff' : 'var(--color-text-secondary)' }}>
                    <Icon size={13} />{id === 'grid' ? 'Grid' : 'List'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportTimetable}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-xs sm:text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              >
                <FileDown size={14} />Export PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPeriodConfig(prev => !prev)
                  setShowSlotForm(false)
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-xs sm:text-sm font-semibold border"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
              >
                {showPeriodConfig ? 'Hide Periods' : 'Configure Periods'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !showSlotForm
                  setShowSlotForm(next)
                  setShowPeriodConfig(false)
                  if (next) {
                    const pTimes = periodTimes[1]
                    setSlotForm({
                      id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '',
                      day_of_week: 'monday', period_number: '1',
                      start_time: pTimes ? pTimes.start : '08:00',
                      end_time: pTimes ? pTimes.end : '08:45',
                      room_number: '',
                    })
                  } else {
                    setSlotForm({
                      id: null, teacher_id: '', class_id: '', section_id: '', subject_id: '',
                      day_of_week: 'monday', period_number: '1',
                      start_time: '08:00', end_time: '08:45', room_number: '',
                    })
                  }
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-xs sm:text-sm font-semibold"
                style={{ backgroundColor: '#0f766e', color: '#fff', border: 'none' }}
              >
                <Zap size={14} />{showSlotForm ? 'Cancel' : 'New Slot'}
              </button>
            </div>
          </div>

          {/* period configuration form */}
          {showPeriodConfig && (
            <div className="rounded-[24px] border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Configure Period Timings</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Pre-define times for each period. Creating/editing slots will automatically pull these times.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteLastPeriod}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Delete Last Period
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border hover:bg-black/5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    + Add Period
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.keys(periodTimes).map((p) => {
                  return (
                    <div key={p} className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>Period {p}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={periodTimes[p].start}
                            onChange={(e) => handlePeriodTimeChange(p, 'start', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-0.5">End Time</label>
                          <input
                            type="time"
                            value={periodTimes[p].end}
                            onChange={(e) => handlePeriodTimeChange(p, 'end', e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* slot form */}
          {showSlotForm && (
            <div className="rounded-[24px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slotForm.id ? 'Edit' : 'Create'} Timetable Slot</p>
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={handleSlotSave}>
                <Select label="Teacher" value={slotForm.teacher_id} onChange={(e) => setSlotForm((p) => ({ ...p, teacher_id: e.target.value, subject_id: '' }))} options={teacherOptions} required />
                <Select label="Class"   value={slotForm.class_id}   onChange={(e) => setSlotForm((p) => ({ ...p, class_id: e.target.value, section_id: '', subject_id: '' }))} options={classOptions} required />
                <Select label="Section" value={slotForm.section_id} onChange={(e) => setSlotForm((p) => ({ ...p, section_id: e.target.value, subject_id: '' }))} options={slotSectionOpts} required />
                <Select label="Subject" value={slotForm.subject_id} onChange={(e) => setSlotForm((p) => ({ ...p, subject_id: e.target.value }))} options={slotSubjectOpts} placeholder="Select assigned subject" required />
                <Select label="Day" value={slotForm.day_of_week} onChange={(e) => setSlotForm((p) => ({ ...p, day_of_week: e.target.value }))} options={DAY_OPTIONS.map((d) => ({ value: d.value, label: DAY_FULL[d.value] }))} required />
                <Input type="number" label="Period #" value={slotForm.period_number} onChange={(e) => handlePeriodNumberChange(e.target.value)} min="1" max="20" required />
                <TimePicker12h   label="Start"    value={slotForm.start_time}    onChange={(val) => setSlotForm((p) => ({ ...p, start_time: val }))} required />
                <TimePicker12h   label="End"      value={slotForm.end_time}      onChange={(val) => setSlotForm((p) => ({ ...p, end_time: val }))} required />
                <div className="sm:col-span-2 xl:col-span-3">
                  <Input label="Room (optional)" value={slotForm.room_number} onChange={(e) => setSlotForm((p) => ({ ...p, room_number: e.target.value }))} placeholder="e.g. 6-A" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" loading={saving} className="w-full">{slotForm.id ? 'Save Changes' : 'Add Slot'}</Button>
                </div>
              </form>
            </div>
          )}

          {/* timetable view */}
          {loading ? <GridSkeleton /> : !filteredSlots.length ? (
            <EmptyState icon={CalendarRange} title="No timetable slots" description="Add slots or adjust your filters." />
          ) : ttView === 'grid' ? (
            <TimetableGrid matrix={ttMatrix} onToggle={toggleSlot} onEdit={editSlot} onDelete={deleteSlot} onSlotDrop={handleSlotDrop} periodTimes={periodTimes} onDuplicate={duplicateSlot} />
          ) : (
            <TimetableList slots={filteredSlots} onToggle={toggleSlot} onEdit={editSlot} onDelete={deleteSlot} onDuplicate={duplicateSlot} />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: WORKFLOWS
      ════════════════════════════════════════ */}
      {tab === 'workflows' && (() => {
        const pendingLeaves  = (leaves  ?? []).filter(l => l.status === 'pending').length
        const pendingTeacher = (corrections ?? []).filter(c => c.status === 'pending').length
        const pendingStudent = (studentCorrections ?? []).filter(c => c.status === 'pending').length
        const totalPending   = pendingLeaves + pendingTeacher + pendingStudent
        return (
          <div className="space-y-6">

            {/* ── Workflow Summary Bar ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Pending', value: totalPending, icon: AlertTriangle,
                  bg: totalPending > 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6b7280,#4b5563)', urgent: totalPending > 0 },
                { label: 'Leave Requests', value: pendingLeaves, sub: `${(leaves??[]).length} total`, icon: CalendarRange,
                  bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
                { label: 'Teacher Corrections', value: pendingTeacher, sub: `${(corrections??[]).length} total`, icon: ShieldCheck,
                  bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
                { label: 'Student Corrections', value: pendingStudent, sub: `${(studentCorrections??[]).length} total`, icon: FileText,
                  bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
              ].map(({ label, value, sub, icon: Ic, bg, urgent }) => (
                <div key={label} className="relative overflow-hidden rounded-2xl p-4 text-white"
                  style={{ background: bg, boxShadow: urgent ? '0 4px 20px rgba(245,158,11,0.35)' : undefined }}>
                  {urgent && <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</p>
                      <p className="mt-1 text-3xl font-black">{value ?? 0}</p>
                      {sub && <p className="mt-0.5 text-[10px] opacity-60">{sub}</p>}
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <Ic size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Workflow Sections Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <WorkflowSection title="Leave Approval" icon={CalendarRange}
                items={leaves} loading={loading}
                pendingCount={pendingLeaves}
                renderItem={(item) => (
                  <LeaveRequestCard key={item.id} item={item}
                    onApprove={item.status === 'pending' ? async () => { await reviewLeave(item, 'approved'); setSelectedLeave(null) } : null}
                    onReject={item.status  === 'pending' ? async () => { await reviewLeave(item, 'rejected'); setSelectedLeave(null) } : null}
                  />
                )}
                emptyTitle="No leave requests" emptyDesc="Teacher leave applications will appear here."
              />
              <WorkflowSection title="Teacher Profile Corrections" icon={ShieldCheck}
                items={corrections} loading={loading}
                pendingCount={pendingTeacher}
                renderItem={(item) => (
                  <CorrectionRequestCard key={item.id} item={item} isStudent={false}
                    onApprove={item.status === 'pending' ? () => reviewCorrection(item, 'approved') : null}
                    onReject={item.status  === 'pending' ? () => reviewCorrection(item, 'rejected') : null}
                  />
                )}
                emptyTitle="No correction requests" emptyDesc="Teacher profile correction requests will appear here."
              />
              <WorkflowSection title="Student Profile Corrections" icon={FileText}
                items={studentCorrections} loading={loading}
                pendingCount={pendingStudent}
                renderItem={(item) => (
                  <CorrectionRequestCard key={item.id} item={item} isStudent={true}
                    onApprove={item.status === 'pending' ? () => reviewStudentCorrection(item, 'approved') : null}
                    onReject={item.status  === 'pending' ? () => reviewStudentCorrection(item, 'rejected') : null}
                  />
                )}
                emptyTitle="No student correction requests" emptyDesc="Student correction requests will appear here."
              />
              <WorkflowSection title="Homework Oversight" icon={BookOpenText}
                items={homework} loading={loading}
                renderItem={(item) => <HomeworkCard key={item.id} item={item} />}
                emptyTitle="No homework" emptyDesc="Homework assigned by teachers will appear here."
              />
            </div>
          </div>
        )
      })()}

      {selectedLeave && (
        <Modal 
          isOpen={!!selectedLeave} 
          onClose={() => setSelectedLeave(null)} 
          title="Leave Request Details"
        >
          <div className="space-y-4 p-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}>
                {selectedLeave.teacher_name ? selectedLeave.teacher_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'T'}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{selectedLeave.teacher_name}</h3>
                <p className="text-xs text-gray-500">Teacher Account</p>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--color-border)' }} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Leave Type</span>
                <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                  {(selectedLeave.leave_type || '').replace('_', ' ')} Leave
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Duration</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {Number(selectedLeave.days_count || 0)} day(s)
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Dates</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedLeave.from_date} to {selectedLeave.to_date}
                </span>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--color-border)' }} />

            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Reason / Message</span>
              <div className="rounded-2xl p-4 text-sm italic border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', borderLeft: '4px solid #0f766e' }}>
                "{selectedLeave.reason || 'No reason provided.'}"
              </div>
            </div>

            {selectedLeave.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  onClick={async () => {
                    await reviewLeave(selectedLeave, 'rejected');
                    setSelectedLeave(null);
                  }}
                  loading={saving}
                >
                  Reject Request
                </Button>
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    await reviewLeave(selectedLeave, 'approved');
                    setSelectedLeave(null);
                  }}
                  loading={saving}
                >
                  Approve Request
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Assignment Card
════════════════════════════════════════════════════════════════════════════ */
const AssignmentCard = ({ group, onToggle, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const active = group.subjectTeachers.filter((s) => s.is_active).length

  return (
    <article className="overflow-hidden rounded-[24px] border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* header row */}
      <div
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-all"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex flex-wrap items-center gap-3 min-w-0 flex-1 text-left"
        >
          {/* class pill */}
          <span className="inline-flex h-8 items-center rounded-xl px-3 text-xs font-bold" style={{ backgroundColor: '#0c4a6e', color: '#e0f2fe' }}>
            {group.class_name}{group.class_stream ? ` (${group.class_stream.toUpperCase()})` : ''} — {group.section_name}
          </span>
          {group.classTeacher ? (
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              CT: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{group.classTeacher.teacher_name}</span>
              {group.classTeacher.is_online && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Online now" />
              )}
            </span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>No class teacher</span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {active}/{group.subjectTeachers.length} subjects active
          </span>
          {group.inactiveCount > 0 && (
            <span className="rounded-lg px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              {group.inactiveCount} inactive
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {group.classTeacher && (
            <div className="flex items-center gap-1 border-r pr-2 mr-1" style={{ borderColor: 'var(--color-border)' }}>
              <button onClick={() => onEdit(group.classTeacher)} className="p-1.5 rounded-lg hover:bg-black/5" title="Edit Class Teacher"><Pencil size={14} /></button>
              <button onClick={() => onDelete(group.classTeacher.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete Assignment"><Trash2 size={14} /></button>
            </div>
          )}
          <button onClick={() => setOpen((p) => !p)} className="p-1.5">
            {open ? <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
          </button>
        </div>
      </div>

      {/* expanded body */}
      {open && (
        <div className="p-5">
          {/* subject grid */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.subjectTeachers.map((item) => (
              <SubjectChip key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
            ))}
            {!group.subjectTeachers.length && (
              <p className="col-span-full text-sm" style={{ color: 'var(--color-text-secondary)' }}>No subject teachers assigned.</p>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

const SubjectChip = ({ item, onToggle, onEdit, onDelete }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-[18px] border p-3"
    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', opacity: item.is_active ? 1 : 0.55 }}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: subjectColor(item.subject_id) }} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.subject_name || 'Subject'}</p>
        <p className="truncate text-[11px] flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          {item.teacher_name}
          {item.is_online && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" title="Online now" />
          )}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <button onClick={() => onEdit(item)} className="p-1 rounded-lg hover:bg-black/5" title="Edit"><Pencil size={13} /></button>
      <button onClick={() => onDelete(item.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={13} /></button>
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="flex-shrink-0 rounded-xl px-2 py-0.5 text-[10px] font-semibold transition-all ml-1"
        style={{ backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2', color: item.is_active ? '#065f46' : '#991b1b' }}
      >
        {item.is_active ? 'Active' : 'Off'}
      </button>
    </div>
  </div>
)

const formatPeriodTimeRange = (timeObj) => {
  if (!timeObj) return ''
  const to12h = (val) => {
    if (!val) return ''
    const [h, m] = val.split(':')
    const hrs = parseInt(h, 10)
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    const displayHrs = hrs % 12 || 12
    return `${displayHrs.toString().padStart(2, '0')}:${m} ${ampm}`
  }
  return `${to12h(timeObj.start)} – ${to12h(timeObj.end)}`
}

/* ════════════════════════════════════════════════════════════════════════════
   Timetable Grid
════════════════════════════════════════════════════════════════════════════ */
const TimetableGrid = ({ matrix, onToggle, onEdit, onDelete, onSlotDrop, periodTimes, onDuplicate }) => {
  const periods = Object.keys(periodTimes).map(Number).sort((a, b) => a - b)
  const days    = ['monday','tuesday','wednesday','thursday','friday','saturday']
  const [dragOverCell, setDragOverCell] = useState(null) // 'day:period'

  const handleDragOver = (e, day, period) => {
    e.preventDefault()
    setDragOverCell(`${day}:${period}`)
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = (e, day, period) => {
    e.preventDefault()
    setDragOverCell(null)
    try {
      const dataStr = e.dataTransfer.getData('application/json')
      if (dataStr) {
        const slot = JSON.parse(dataStr)
        const isCopy = e.altKey || e.ctrlKey || e.shiftKey
        if (onSlotDrop) {
          onSlotDrop(slot, day, period, isCopy)
        }
      }
    } catch (err) {
      console.error('Failed to parse drag data', err)
    }
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border" style={{ borderColor: 'var(--color-border)' }}>
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-raised)' }}>
            <th className="border-b border-r p-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', width: 80 }}>Period</th>
            {days.map((d) => (
              <th key={d} className="border-b border-r p-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                {DAY_FULL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {/* period label */}
              <td className="border-r p-3 align-top" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>P{p}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{formatPeriodTimeRange(periodTimes[p])}</p>
              </td>
              {days.map((d) => {
                const slots = (matrix[d]?.[p]) || []
                const isOver = dragOverCell === `${d}:${p}`
                return (
                  <td
                    key={d}
                    className="border-r p-2 align-top transition-all"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: isOver ? 'var(--color-sidebar-hover)' : 'var(--color-surface)',
                      boxShadow: isOver ? 'inset 0 0 0 2px var(--color-brand)' : 'none',
                      minWidth: 100
                    }}
                    onDragOver={(e) => handleDragOver(e, d, p)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, d, p)}
                  >
                    {slots.length ? (
                      <div className="space-y-1">
                        {slots.map((s) => (
                          <TimetableCell key={s.id} slot={s} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
                        ))}
                      </div>
                    ) : (
                      <div className="h-12 rounded-xl transition-all" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TimetableCell = ({ slot, onToggle, onEdit, onDelete, onDuplicate }) => {
  const color = subjectColor(slot.subject_id)

  const handleDragStart = (e, slot) => {
    e.dataTransfer.setData('application/json', JSON.stringify(slot))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={true}
      onDragStart={(e) => handleDragStart(e, slot)}
      className="group relative cursor-grab active:cursor-grabbing overflow-hidden rounded-xl p-2 transition-all hover:scale-[1.02] hover:shadow-sm"
      style={{ backgroundColor: `${color}18`, border: `1px solid ${color}40`, opacity: slot.is_active ? 1 : 0.45 }}
      title={`${slot.subject_name} • ${slot.teacher_name}${slot.room_number ? ` • Room ${slot.room_number}` : ''}`}
    >
      <div className="h-1 w-8 rounded-full mb-1.5" style={{ backgroundColor: color }} />
      <p className="truncate text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
        {slot.subject_name}
      </p>
      <p className="truncate text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
        {slot.teacher_name?.split(' ')[0]}
        {slot.section_name ? ` · ${slot.class_name}${slot.class_stream ? ` (${slot.class_stream.charAt(0).toUpperCase()})` : ''} ${slot.section_name}` : ''}
      </p>
      {/* hover actions overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: 'rgba(15, 118, 110, 0.95)', color: '#fff' }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(slot) }}
          className="p-1 rounded-lg bg-white/20 hover:bg-white/40 transition-colors"
          title="Edit Slot"
        >
          <Pencil size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(slot) }}
          className="p-1 rounded-lg bg-white/20 hover:bg-white/40 transition-colors"
          title="Duplicate Slot"
        >
          <Copy size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(slot.id) }}
          className="p-1 rounded-lg bg-red-600/70 hover:bg-red-600 transition-colors"
          title="Delete Slot"
        >
          <Trash2 size={11} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(slot) }}
          className="rounded-lg px-1.5 py-0.5 bg-white/20 hover:bg-white/40 text-[9px] font-bold transition-colors"
          title={slot.is_active ? 'Deactivate' : 'Activate'}
        >
          {slot.is_active ? 'Off' : 'On'}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Timetable List
 ════════════════════════════════════════════════════════════════════════════ */
const TimetableList = ({ slots, onToggle, onEdit, onDelete, onDuplicate }) => {
  const grouped = useMemo(() => {
    const g = {}
    slots.forEach((s) => {
      const d = s.day_of_week
      if (!g[d]) g[d] = []
      g[d].push(s)
    })
    return g
  }, [slots])

  return (
    <div className="space-y-4">
      {['monday','tuesday','wednesday','thursday','friday','saturday'].filter((d) => grouped[d]).map((d) => (
        <section key={d}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{DAY_FULL[d]}</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(grouped[d] || []).sort((a, b) => a.period_number - b.period_number).map((slot) => (
              <TimetableListRow key={slot.id} slot={slot} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const TimetableListRow = ({ slot, onToggle, onEdit, onDelete, onDuplicate }) => {
  const color = subjectColor(slot.subject_id)
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] border p-3"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', opacity: slot.is_active ? 1 : 0.55 }}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>
        P{slot.period_number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{slot.subject_name}</p>
        <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {slot.teacher_name} · {slot.class_name}{slot.class_stream ? ` (${slot.class_stream.charAt(0).toUpperCase() + slot.class_stream.slice(1)})` : ''} {slot.section_name}
          {slot.room_number ? ` · Room ${slot.room_number}` : ''}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          <Clock size={10} />{formatTime(slot.start_time)} – {formatTime(slot.end_time)}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onEdit(slot)} className="p-1 rounded-lg hover:bg-black/5" title="Edit"><Pencil size={13} /></button>
        <button onClick={() => onDuplicate(slot)} className="p-1 rounded-lg hover:bg-black/5 text-gray-600" title="Duplicate"><Copy size={13} /></button>
        <button onClick={() => onDelete(slot.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-600" title="Delete"><Trash2 size={13} /></button>
        <button
          type="button"
          onClick={() => onToggle(slot)}
          className="flex-shrink-0 rounded-xl px-2 py-0.5 text-[10px] font-semibold transition-all ml-1"
          style={{ backgroundColor: slot.is_active ? '#d1fae5' : '#fee2e2', color: slot.is_active ? '#065f46' : '#991b1b' }}
        >
          {slot.is_active ? 'Active' : 'Off'}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Workflow helpers
════════════════════════════════════════════════════════════════════════════ */
const STATUS_META = {
  approved: { bg: 'rgba(16,185,129,0.1)', text: '#059669', border: 'rgba(16,185,129,0.25)', strip: '#10b981', icon: CheckCircle2, label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.1)',  text: '#dc2626', border: 'rgba(239,68,68,0.25)',  strip: '#ef4444', icon: XCircle,      label: 'Rejected' },
  pending:  { bg: 'rgba(245,158,11,0.1)', text: '#b45309', border: 'rgba(245,158,11,0.25)', strip: '#f59e0b', icon: AlertTriangle, label: 'Pending'  },
}

const WorkflowSection = ({ title, icon: Icon, items, loading, renderItem, emptyTitle, emptyDesc, pendingCount, children }) => {
  const list  = items ?? []
  const total   = list.length
  const pending = pendingCount ?? list.filter(i => i.status === 'pending').length
  return (
    <section className="flex flex-col overflow-hidden rounded-3xl border transition-all duration-300"
      style={{ borderColor: pending > 0 ? 'rgba(245,158,11,0.4)' : 'var(--color-border)', backgroundColor: 'var(--color-surface)',
               boxShadow: pending > 0 ? '0 0 0 1px rgba(245,158,11,0.15), 0 4px 24px rgba(245,158,11,0.08)' : undefined }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff' }}>
            <Icon size={15} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{total} total record{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertTriangle size={10} />{pending} pending
            </span>
          )}
          {total > 0 && pending === 0 && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={10} />All clear
            </span>
          )}
        </div>
      </div>
      {/* Section body */}
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 480 }}>
        {loading ? <GridSkeleton rows={2} /> : !list.length ? (
          <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} />
        ) : (
          children || <div className="space-y-3">{list.map(renderItem)}</div>
        )}
      </div>
    </section>
  )
}


const LeaveRequestCard = ({ item, onApprove, onReject }) => {
  const sm = STATUS_META[item.status] || STATUS_META.pending
  const StatusIcon = sm.icon
  const initials = item.teacher_name
    ? item.teacher_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'T'
  const leaveTypeLabel = (item.leave_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const LEAVE_COLORS = { casual: '#6366f1', sick: '#0ea5e9', emergency: '#ef4444', earned: '#10b981', without_pay: '#6b7280' }
  const leaveColor = LEAVE_COLORS[item.leave_type] || '#0f766e'

  return (
    <article className="relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
      style={{ borderColor: sm.border, backgroundColor: 'var(--color-surface)' }}>
      {/* Status strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: sm.strip }} />

      <div className="pl-4 pr-4 py-4 flex gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
          style={{ background: `linear-gradient(135deg, ${leaveColor}, ${leaveColor}cc)` }}>
          {initials}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Name + status */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.teacher_name}</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${leaveColor}18`, color: leaveColor }}>
                {leaveTypeLabel} Leave
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: sm.bg, color: sm.text, borderColor: sm.border }}>
              <StatusIcon size={10} />{sm.label}
            </span>
          </div>

          {/* Row 2: Date timeline */}
          <div className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <CalendarRange size={11} />{item.from_date}
            </span>
            <ArrowRight size={12} className="flex-shrink-0 opacity-40" />
            <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <CalendarRange size={11} />{item.to_date}
            </span>
            <span className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{ backgroundColor: `${leaveColor}15`, color: leaveColor }}>
              {Number(item.days_count || 0)}d
            </span>
          </div>

          {/* Row 3: Reason */}
          {item.reason && (
            <div className="mt-2.5 rounded-xl px-3 py-2 text-[11px] italic leading-relaxed"
              style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', borderLeft: `3px solid ${sm.strip}` }}>
              “{item.reason}”
            </div>
          )}

          {/* Row 4: Actions */}
          {item.status === 'pending' && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={onReject}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 active:scale-95"
                style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
                <XCircle size={13} />Reject
              </button>
              <button onClick={onApprove}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', boxShadow: '0 2px 8px rgba(15,118,110,0.4)' }}>
                <CheckCircle2 size={13} />Approve
              </button>
            </div>
          )}
          {item.status !== 'pending' && item.reviewed_by_name && (
            <p className="mt-2 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              Reviewed by <span className="font-semibold">{item.reviewed_by_name}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

const CorrectionRequestCard = ({ item, isStudent = false, onApprove, onReject }) => {
  const sm = STATUS_META[item.status] || STATUS_META.pending
  const StatusIcon = sm.icon
  const name    = isStudent ? item.student_name  : item.teacher_name
  const role    = isStudent ? 'Student' : 'Teacher'
  const admInfo = isStudent ? (item.admission_no ? `#${item.admission_no}` : '') : ''
  const fieldLabel = (item.field_name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : role[0]
  const avatarColor = isStudent ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)'

  return (
    <article className="relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
      style={{ borderColor: sm.border, backgroundColor: 'var(--color-surface)' }}>
      {/* Status strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: sm.strip }} />

      <div className="pl-4 pr-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
              style={{ background: avatarColor }}>{initials}</div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {role}{admInfo ? ` · ${admInfo}` : ''}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: sm.bg, color: sm.text, borderColor: sm.border }}>
            <StatusIcon size={10} />{sm.label}
          </span>
        </div>

        {/* Field label */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Field</span>
          <span className="rounded-lg px-2.5 py-0.5 text-xs font-bold"
            style={{ backgroundColor: 'rgba(3,105,161,0.08)', color: '#0369a1', border: '1px solid rgba(3,105,161,0.15)' }}>
            {fieldLabel}
          </span>
        </div>

        {/* Diff comparison */}
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl p-3 border" style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.04)' }}>
            <p className="text-[9px] uppercase font-black tracking-wider mb-1" style={{ color: '#dc2626' }}>Current</p>
            <p className="text-xs font-medium line-through decoration-red-400/60" style={{ color: 'var(--color-text-primary)' }}>
              {item.current_value || <span style={{ opacity: 0.4 }}>— empty —</span>}
            </p>
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: '#fff' }}>
            <ArrowRight size={13} />
          </div>
          <div className="rounded-xl p-3 border" style={{ borderColor: 'rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.06)' }}>
            <p className="text-[9px] uppercase font-black tracking-wider mb-1 text-emerald-600">Requested</p>
            <p className="text-xs font-bold text-emerald-600">{item.requested_value}</p>
          </div>
        </div>

        {/* Reason */}
        {item.reason && (
          <div className="mt-3 rounded-xl px-3 py-2 text-[11px] italic leading-relaxed"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', borderLeft: `3px solid ${sm.strip}` }}>
            “{item.reason}”
          </div>
        )}

        {/* Actions */}
        {item.status === 'pending' && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <button onClick={onReject}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-300 active:scale-95"
              style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}>
              <XCircle size={13} />Reject
            </button>
            <button onClick={onApprove}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', boxShadow: '0 2px 8px rgba(15,118,110,0.4)' }}>
              <CheckCircle2 size={13} />Approve
            </button>
          </div>
        )}
        {item.status !== 'pending' && item.reviewed_by_name && (
          <p className="mt-2 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            Reviewed by <span className="font-semibold">{item.reviewed_by_name}</span>
          </p>
        )}
      </div>
    </article>
  )
}

const HomeworkCard = ({ item }) => {
  const total     = Number(item.student_count   || 0)
  const submitted = Number(item.submitted_count || 0)
  const pct       = total > 0 ? Math.round((submitted / total) * 100) : 0
  const subjectColor = SUBJECT_COLORS[(item.subject_id || 0) % SUBJECT_COLORS.length]

  const today    = new Date().toISOString().slice(0, 10)
  const due      = item.due_date || ''
  const daysLeft = due ? Math.ceil((new Date(due) - new Date(today)) / 86400000) : null
  const urgency  = daysLeft === null ? null : daysLeft < 0 ? 'overdue' : daysLeft <= 2 ? 'soon' : 'ok'
  const urgencyStyle = {
    overdue: { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626', label: `Overdue by ${Math.abs(daysLeft)}d` },
    soon:    { bg: 'rgba(245,158,11,0.1)',  text: '#b45309', label: daysLeft === 0 ? 'Due today' : `${daysLeft}d left` },
    ok:      { bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: `${daysLeft}d left` },
  }[urgency] || { bg: 'transparent', text: 'inherit', label: due }

  const statusMeta = item.status === 'active'
    ? { bg: 'rgba(16,185,129,0.1)', text: '#059669', border: 'rgba(16,185,129,0.25)', label: 'Active' }
    : item.status === 'completed'
    ? { bg: 'rgba(99,102,241,0.1)', text: '#4f46e5', border: 'rgba(99,102,241,0.25)', label: 'Completed' }
    : { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb', label: item.status }

  return (
    <article className="relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Subject color strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: subjectColor }} />

      <div className="pl-4 pr-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              by <span className="font-semibold">{item.teacher_name}</span>
            </p>
          </div>
          <span className="flex-shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold border"
            style={{ backgroundColor: statusMeta.bg, color: statusMeta.text, borderColor: statusMeta.border }}>
            {statusMeta.label}
          </span>
        </div>

        {/* Chips row */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            {item.class_name}{item.class_stream ? ` (${item.class_stream[0].toUpperCase()})` : ''} – {item.section_name}
          </span>
          <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: `${subjectColor}15`, color: subjectColor, border: `1px solid ${subjectColor}30` }}>
            {item.subject_name}
          </span>
          {due && (
            <span className="ml-auto flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: urgencyStyle.bg, color: urgencyStyle.text }}>
              <Clock size={9} />{urgencyStyle.label}
            </span>
          )}
        </div>

        {/* Submission progress */}
        {total > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span style={{ color: 'var(--color-text-secondary)' }}>Submissions</span>
              <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {submitted} / {total} students ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : subjectColor }} />
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
)

const SmallSelect = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="min-h-9 rounded-2xl px-3 text-xs font-semibold"
    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

const GridSkeleton = ({ rows = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-16 animate-pulse rounded-[22px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
    ))}
  </div>
)

export default AdminTeacherControlPage
