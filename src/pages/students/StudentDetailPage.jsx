import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Trash2, BookOpen, ScrollText,
  KeyRound, Copy, Mail, IdCard, CalendarCheck, GraduationCap, Wallet,
  Phone, Heart, User, ChevronLeft, ChevronRight as ChevronRIcon,
  ChevronDown, ChevronUp, Book
} from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { getInitials, formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import * as studentApi from '@/api/studentsApi'
import useAuth from '@/hooks/useAuth'
import TabAuditLog from './tabs/TabAuditLog'
import TabResults from './tabs/TabResults'
import TabFees from './tabs/TabFees'
import TabIdentity from './tabs/TabIdentity'
import TabProfile from './tabs/TabProfile'
import TabDocuments from './tabs/TabDocuments'
import TabEnrolledSubjects from './tabs/TabEnrolledSubjects'
import TabHealth from './tabs/TabHealth'
import useAttendanceStore from '@/store/attendanceStore'
import StudentIDCardDownload from '@/components/pdf/StudentIDCardDownload'
import TransferCertificateDownload from '@/components/pdf/TransferCertificateDownload'
import MarkAsLeftModal from '@/components/students/MarkAsLeftModal'
import ReadmitModal from '@/components/students/ReadmitModal'
import EnrollmentHistoryModal from '@/components/students/EnrollmentHistoryModal'
import { LogOut, History, ArrowRightLeft } from 'lucide-react'

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTES = [
  { a: '#4338ca', light: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
  { a: '#0e7490', light: '#ecfeff', text: '#155e75', border: '#a5f3fc' },
  { a: '#047857', light: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  { a: '#b45309', light: '#fffbeb', text: '#92400e', border: '#fde68a' },
  { a: '#b91c1c', light: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  { a: '#6d28d9', light: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
]

const getPalette = (name = '') => PALETTES[name.charCodeAt(0) % PALETTES.length]

const formatStream = (s) => {
  if (!s) return null
  const l = s[0].toUpperCase() + s.slice(1)
  return s === 'regular' ? l : `${l} Stream`
}

// ─── Primitives ───────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
)

const FieldItem = ({ label, value }) => (
  <div className="py-1.5">
    <p className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 leading-none mb-1">
      {label}
    </p>
    <p className={`text-sm ${value ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500 italic'}`}>
      {value || 'Not provided'}
    </p>
  </div>
)

const SecLabel = ({ icon, title, color }) => {
  const Icon = icon
  return (
    <div className="flex items-center gap-2 mt-4 mb-2">
      <div className="p-1 rounded-md" style={{ backgroundColor: `${color}15` }}>
        <Icon size={12} style={{ color }} />
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
        {title}
      </span>
    </div>
  )
}

// ─── LEFT PANEL (desktop sidebar / mobile collapsible card) ───────────────────
const LeftPanel = ({ 
  student, palette, isAdmin, onResetPassword, onDelete, onToggleStatus, 
  isSaving, toastWarning, onShowHistory, onMarkAsLeft, onReadmit 
}) => {
  const { fetchIDCardData, fetchTCData } = useAdminStudentStore()
  const [idCardData, setIdCardData] = useState(null)
  const [tcData, setTcData] = useState(null)
  const [fetchingID, setFetchingID] = useState(false)
  const [fetchingTC, setFetchingTC] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fullName = `${student.first_name} ${student.last_name}`.trim()
  const enrollment = student.current_enrollment

  const detailsBody = (
    <div className="p-4 pt-0 space-y-1">
      {student.status === 'active' && (
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shadow-sm ${student.is_active ? 'bg-emerald-500 ring-4 ring-emerald-500/10' : 'bg-amber-400 ring-4 ring-amber-500/10'}`} />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {student.is_active ? 'Active' : 'Suspended'}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus() }}
              disabled={isSaving}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 ${student.is_active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${student.is_active ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          )}
        </div>
      )}

      {enrollment && (
        <>
          <SecLabel icon={BookOpen} title="Enrollment" color={palette.a} />
          <FieldItem label="Class" value={[enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(' — ')} />
          <FieldItem label="Section · Roll" value={`Sec ${enrollment.section}  ·  Roll ${enrollment.roll_number || '—'}`} />
          {student.session_name && <FieldItem label="Session" value={student.session_name} />}
        </>
      )}

      <Divider />
      <SecLabel icon={User} title="Identity" color="#0891b2" />
      <FieldItem label="Date of Birth" value={formatDate(student.date_of_birth, 'long')} />
      <FieldItem label="Gender" value={student.gender} />
      <FieldItem label="Blood Group" value={student.blood_group} />
      {student.medical_notes && <FieldItem label="Medical Notes" value={student.medical_notes} />}

      <Divider />
      <SecLabel icon={Phone} title="Contact" color="#059669" />
      <FieldItem label="Phone" value={student.phone} />
      <FieldItem label="Email" value={student.email} />
      <FieldItem label="Address" value={[student.city, student.address].filter(Boolean).join(', ')} />

      <Divider />
      <SecLabel icon={Heart} title="Parents" color="#d97706" />
      <FieldItem label="Father" value={student.father_name} />
      <FieldItem label="Father Phone" value={student.father_phone} />
      <FieldItem label="Mother" value={student.mother_name} />
      <FieldItem label="Emergency" value={student.emergency_contact} />

      <Divider />
      <div className="flex flex-col gap-2 pt-2">
        <div className="w-full">
          {idCardData ? (
            <StudentIDCardDownload 
              data={idCardData} 
              fileName={`IDCard_${student.admission_no}.pdf`} 
            />
          ) : (
            <button
              onClick={async () => {
                setFetchingID(true)
                try {
                  const data = await fetchIDCardData(student.id)
                  setIdCardData(data)
                } catch (err) {
                  console.error('Failed to fetch ID card data', err)
                } finally { setFetchingID(false) }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20 disabled:opacity-50"
              disabled={fetchingID}
            >
              <IdCard size={13} /> {fetchingID ? 'Preparing...' : 'Download ID Card'}
            </button>
          )}
        </div>

        <div className="w-full">
          {tcData ? (
            <TransferCertificateDownload 
              data={tcData} 
              fileName={`TC_${student.admission_no}.pdf`} 
            />
          ) : (
            <button
              onClick={async () => {
                setFetchingTC(true)
                try {
                  const data = await fetchTCData(student.id)
                  setTcData(data)
                } catch (err) {
                  console.error('Failed to fetch TC data', err)
                } finally { setFetchingTC(false) }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20 disabled:opacity-50"
              disabled={fetchingTC}
            >
              <ScrollText size={13} /> {fetchingTC ? 'Preparing...' : 'Download TC'}
            </button>
          )}
        </div>

        <button
          onClick={() => onShowHistory()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
        >
          <History size={13} /> Enrollment History
        </button>

        {isAdmin && (
          <div className="space-y-2 pt-2">
            {student.status === 'active' ? (
              <button
                onClick={() => onMarkAsLeft()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
              >
                <LogOut size={13} /> Mark as Left
              </button>
            ) : (
              <button
                onClick={() => onReadmit()}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              >
                <ArrowRightLeft size={13} /> Re-admit Student
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!student.is_active) {
                    toastWarning('Please activate the student to perform actions.');
                    return;
                  }
                  onResetPassword();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 disabled:opacity-40"
              >
                <KeyRound size={11} /> Reset
              </button>
              <button
                onClick={() => {
                  if (!student.is_active) {
                    toastWarning('Please activate the student to perform actions.');
                    return;
                  }
                  onDelete();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/5 dark:text-red-400 dark:border-red-500/10 disabled:opacity-40"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="sdp-left-desktop sticky top-6 w-64 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Avatar Header */}
        <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800" style={{ backgroundColor: `${palette.light}50` }}>
          <div 
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-2xl font-black tracking-tighter shadow-inner ring-4 ring-white dark:ring-gray-800"
            style={{ backgroundColor: palette.light, color: palette.a }}
          >
            {getInitials(fullName)}
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1">{fullName}</h2>
          <p className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded-md mb-3">
            {student.admission_no}
          </p>
          <div>
            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${student.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
              {student.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        {detailsBody}
      </div>

      {/* ── Mobile profile card ── */}
      <div className="sdp-left-mobile hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className={`flex items-center gap-4 p-4 ${expanded ? 'border-b border-gray-100 dark:border-gray-800' : ''}`} style={{ backgroundColor: `${palette.light}30` }}>
          <div 
            className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-black tracking-tighter shadow-sm ring-2 ring-white dark:ring-gray-800"
            style={{ backgroundColor: palette.light, color: palette.a }}
          >
            {getInitials(fullName)}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{fullName}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{student.admission_no}</span>
              {enrollment && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                    Class {enrollment.class}{enrollment.section ? ` · Sec ${enrollment.section}` : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${student.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
              {student.is_active ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 py-1 px-3 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm transition-all active:scale-95"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide' : 'Info'}
            </button>
          </div>
        </div>
        {expanded && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{detailsBody}</div>}
      </div>
    </>
  )
}

// ─── ATTENDANCE CALENDAR ──────────────────────────────────────────────────────
const WDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS = {
  present: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#166534' },
  absent:  { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#991b1b' },
  late:    { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#92400e' },
  half_day: { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#1e40af' },
  holiday: { bg: 'var(--color-surface-raised)', border: 'var(--color-border)', dot: '#94a3b8', text: 'var(--color-text-muted)' },
}

const LEGEND_KEYS = ['present', 'absent', 'late', 'holiday']

const AttendanceCalendar = ({ enrollmentId }) => {
  const { fetchStudentAttendance, studentRecords, studentSummary, isLoading } = useAttendanceStore()
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  useEffect(() => {
    if (!enrollmentId) return
    const from = new Date(year, month, 1).toISOString().split('T')[0]
    const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
    fetchStudentAttendance(enrollmentId, { from, to })
  }, [year, month, enrollmentId, fetchStudentAttendance])

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells     = Array(firstDay).fill(null).concat(
    Array.from({ length: totalDays }, (_, i) => i + 1)
  )

  const recordsMap = useMemo(() => {
    const map = {}
    studentRecords.forEach(r => {
      const d = new Date(r.date).getDate()
      map[d] = r.status
    })
    return map
  }, [studentRecords])

  const STATS = [
    { label: 'Present', value: studentSummary?.presentCount || 0, color: 'emerald' },
    { label: 'Absent',  value: studentSummary?.absentCount || 0, color: 'red' },
    { label: 'Late',    value: studentSummary?.lateCount || 0, color: 'amber' },
    { label: 'Rate',    value: studentSummary?.percentage !== undefined ? `${studentSummary.percentage}%` : '—', color: 'blue' },
  ]

  return (
    <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {/* Stats row */}
      <div className="sdp-stats-grid grid grid-cols-4 gap-3 mb-6">
        {STATS.map(s => (
          <div key={s.label} className={`p-3 rounded-2xl border bg-${s.color}-50/50 border-${s.color}-100 dark:bg-${s.color}-500/5 dark:border-${s.color}-500/10`}>
            <p className={`text-[10px] font-black uppercase tracking-widest text-${s.color}-600 dark:text-${s.color}-400 mb-1`}>
              {s.label}
            </p>
            <p className={`text-2xl font-black tracking-tighter text-${s.color}-700 dark:text-${s.color}-300 leading-none`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-90 shadow-sm"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              {MONTHS[month]} {year}
            </h3>
          </div>
          <button
            onClick={next}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-90 shadow-sm"
          >
            <ChevronRIcon size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} className="aspect-square" />
            const status  = recordsMap[day]
            const s       = STATUS[status]
            const isToday = (
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear()
            )
            
            return (
              <div
                key={day}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative
                  ${s ? `bg-${s.dot}-50 dark:bg-${s.dot}-500/10` : 'bg-white dark:bg-gray-800'}
                  ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 z-10' : 'border border-transparent'}
                `}
                style={s ? { 
                  backgroundColor: status === 'present' ? '#f0fdf4' : status === 'absent' ? '#fef2f2' : status === 'late' ? '#fffbeb' : undefined,
                  borderColor: isToday ? '#6366f1' : 'transparent'
                } : {}}
              >
                <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : (s ? `text-${s.dot}-700` : 'text-gray-500')}`}>
                  {day}
                </span>
                {s && (
                  <div className={`w-1 h-1 rounded-full bg-${s.dot}-500`} style={{ backgroundColor: s.dot }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        {LEGEND_KEYS.map(k => (
          <div key={k} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border shadow-sm"
              style={{ backgroundColor: STATUS[k].bg, borderColor: STATUS[k].border }}
            />
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
              {k.replace('_', ' ')}
            </span>
          </div>
        ))}
        <span className="sdp-today-note ml-auto text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
          Today
        </span>
      </div>
    </div>
  )
}

// ─── RIGHT PANEL TABS ─────────────────────────────────────────────────────────
const RIGHT_TABS = [
  { key: 'identity',   label: 'Identity',   icon: IdCard },
  { key: 'profile',    label: 'Profile',    icon: User },
  { key: 'health',     label: 'Health',     icon: Heart },
  { key: 'subjects',   label: 'Subjects',   icon: Book },
  { key: 'documents',  label: 'Documents',  icon: ScrollText },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { key: 'results',    label: 'Results',    icon: GraduationCap },
  { key: 'fees',       label: 'Fees',       icon: Wallet },
  { key: 'audit',      label: 'Audit Log',  icon: ScrollText },
]

const RightPanel = ({ student, activeTab, setActiveTab, isAdmin }) => (
  <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
    {/* Tab strip — scrollable */}
    <div className="flex items-center border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar bg-gray-50/50 dark:bg-gray-800/20 px-2 pt-2">
      {RIGHT_TABS.map(tab => {
        const active = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight transition-all relative whitespace-nowrap
              ${active 
                ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 rounded-t-xl shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
            `}
          >
            <tab.icon size={14} className={active ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} />
            {tab.label}
            {active && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full mx-4" />
            )}
          </button>
        )
      })}
    </div>

    {/* Content */}
    <div className="sdp-tab-content p-6">
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {activeTab === 'identity'   && <TabIdentity student={student} studentId={student.id} />}
        {activeTab === 'profile'    && <TabProfile  student={student} studentId={student.id} />}
        {activeTab === 'health'     && <TabHealth   studentId={student.id} isAdmin={isAdmin} />}
        {activeTab === 'subjects'   && <TabEnrolledSubjects studentId={student.id} isAdmin={isAdmin} />}
        {activeTab === 'documents'  && <TabDocuments studentId={student.id} />}
        {activeTab === 'attendance' && <AttendanceCalendar enrollmentId={student.current_enrollment?.id} />}
        {activeTab === 'results'    && <TabResults  studentId={student.id} />}
        {activeTab === 'fees'       && <TabFees     enrollmentId={student.current_enrollment?.id} />}
        {activeTab === 'audit'      && <TabAuditLog studentId={student.id} />}
      </div>
    </div>
  </div>
)

// ─── Credential copy row ──────────────────────────────────────────────────────
const CredRow = ({ icon, label, value, onCopy }) => {
  const Icon = icon
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex-shrink-0 bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          <Icon size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 leading-none mb-1">
            {label}
          </p>
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 truncate">
            {value || '—'}
          </p>
        </div>
      </div>
      <button
        onClick={() => onCopy(value)}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm active:scale-90"
      >
        <Copy size={11} /> Copy
      </button>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Pulse = ({ h, w = '100%', r = 8 }) => (
  <div 
    className="bg-gray-200 dark:bg-gray-800 animate-pulse" 
    style={{ height: h, width: w, borderRadius: r }} 
  />
)

const DetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Pulse h={32} w={150} r={12} />
    <div className="sdp-layout">
      <div className="sdp-left-desktop w-64 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center gap-4">
        <Pulse h={80} w={80} r={24} />
        <Pulse h={20} w="80%" />
        <Pulse h={14} w="50%" />
        <div className="w-full space-y-3 mt-4">
          {Array.from({ length: 8 }).map((_, i) => <Pulse key={i} h={40} r={12} />)}
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 px-6">
          {[80, 60, 90, 70].map((w, i) => <Pulse key={i} h={14} w={w} r={6} />)}
        </div>
        <div className="p-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} h={70} r={16} />)}
          </div>
          <Pulse h={200} r={16} />
        </div>
      </div>
    </div>
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────
const StudentDetailPage = () => {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastSuccess, toastWarning } = useToast()
  const { isAdmin } = useAuth()
  const {
    selectedStudent: student,
    fetchStudent,
    clearSelected,
    deleteStudent,
    toggleStatus,
    isSaving,
  } = useAdminStudentStore()

  const initialTab = RIGHT_TABS.some(tab => tab.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'identity'
  const [activeTab,       setActiveTab]       = useState(initialTab)
  const [pageLoading,     setPageLoading]     = useState(true)
  const [deleteOpen,      setDeleteOpen]      = useState(false)
  const [passwordOpen,    setPasswordOpen]    = useState(false)
  const [confirmName,     setConfirmName]     = useState('')
  const [tempPassword,    setTempPassword]    = useState('')
  const [resetResult,     setResetResult]     = useState(null)
  const [isResettingPass, setIsResettingPass] = useState(false)
  const [historyOpen,      setHistoryOpen]      = useState(false)
  const [leftOpen,         setLeftOpen]         = useState(false)
  const [readmitOpen,      setReadmitOpen]      = useState(false)

  usePageTitle(student ? `${student.first_name} ${student.last_name}` : 'Student')
  useEffect(() => {
    setPageLoading(true)
    fetchStudent(id)
      .catch(() => { toastError('Student not found'); navigate(ROUTES.STUDENTS) })
      .finally(() => setPageLoading(false))
    return () => clearSelected()
  }, [id])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (RIGHT_TABS.some(item => item.key === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'identity' ? {} : { tab })
  }

  if (pageLoading || !student) return <DetailSkeleton />

  const fullName  = `${student.first_name} ${student.last_name}`.trim()
  const canDelete = confirmName.trim() === fullName
  const palette   = getPalette(fullName)

  const handleDelete = async () => {
    if (!canDelete) return
    if (!student.is_active) {
      toastWarning('Cannot delete a deactivated student. Please activate them first.');
      return;
    }
    const r = await deleteStudent(id, {
      confirm_name: confirmName.trim(),
      reason: `Deleted after confirming name ${fullName}`,
    })
    if (r.success) { toastSuccess('Student deleted'); navigate(ROUTES.STUDENTS) }
    else toastError(r.message || 'Failed to delete')
  }

  const handleToggleStatus = async () => {
    const action = student.is_active ? 'deactivate' : 'activate'
    const msg = student.is_active
      ? "Deactivating will block this student's login but keeps them enrolled. Continue?"
      : "This will restore the student's login access. Continue?"
    
    if (!window.confirm(msg)) return

    const res = await toggleStatus(id)
    if (res.success) {
      toastSuccess(`Student ${res.is_active ? 'activated' : 'deactivated'}`)
    } else {
      toastError(res.message || 'Failed to toggle status')
    }
  }

  const handleResetPassword = async () => {
    if (!student.is_active) {
      toastWarning('Cannot reset password for a deactivated student.');
      return;
    }
    setIsResettingPass(true)
    try {
      const res = await studentApi.resetPassword(id, {
        new_password: tempPassword.trim() || undefined,
      })
      setResetResult(res.data)
      setTempPassword('')
      toastSuccess('Password reset')
    } catch (err) {
      toastError(err.message || 'Failed')
    } finally {
      setIsResettingPass(false)
    }
  }

  const handleCopy = async (v) => {
    if (!v) return
    try { await navigator.clipboard.writeText(v); toastSuccess('Copied') }
    catch { toastError('Unable to copy') }
  }

  return (
    <div className="flex flex-col gap-6">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .sdt { animation: fadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) both }

        .sdp-layout { display: flex; gap: 24px; align-items: flex-start }
        
        @media (max-width: 1024px) {
          .sdp-layout { flex-direction: column; gap: 16px; }
          .sdp-left-desktop { display: none !important }
          .sdp-left-mobile { display: block !important }
          .sdp-stats-grid { grid-template-columns: repeat(2, 1fr) !important }
        }
      `}</style>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(ROUTES.STUDENTS)}
        className="group self-start inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-500/30 shadow-sm active:scale-95"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
        Back to Students
      </button>

      {/* ── Main layout ── */}
      <div className="sdt sdp-layout">
        <LeftPanel
          student={student}
          palette={palette}
          isAdmin={isAdmin}
          onResetPassword={() => { setTempPassword(''); setResetResult(null); setPasswordOpen(true) }}
          onDelete={() => { setConfirmName(''); setDeleteOpen(true) }}
          onToggleStatus={handleToggleStatus}
          isSaving={isSaving}
          toastWarning={toastWarning}
          onShowHistory={() => setHistoryOpen(true)}
          onMarkAsLeft={() => setLeftOpen(true)}
          onReadmit={() => setReadmitOpen(true)}
        />
        <RightPanel
          student={student}
          palette={palette}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isAdmin={isAdmin}
        />
      </div>

      {/* ── Delete modal ── */}
      <Modal
        open={isAdmin && deleteOpen}
        onClose={() => !isSaving && setDeleteOpen(false)}
        title="Delete Student Record"
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={isSaving} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleDelete} loading={isSaving} disabled={!canDelete} className="flex-1">
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 text-red-700 dark:text-red-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold mb-1">Destructive Action</p>
              <p className="opacity-90">This will permanently remove the student and all associated records from the system. This cannot be undone.</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Confirm Student Name</p>
            <p className="text-sm font-black text-gray-900 dark:text-white">{fullName}</p>
          </div>

          <Input
            label="Type full name to confirm"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={fullName}
            autoFocus
            error={confirmName && !canDelete ? 'Name does not match' : undefined}
          />
        </div>
      </Modal>

      {/* ── Reset password modal ── */}
      <Modal
        open={isAdmin && passwordOpen}
        onClose={() => !isResettingPass && setPasswordOpen(false)}
        title="Reset Access Credentials"
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="secondary" onClick={() => setPasswordOpen(false)} disabled={isResettingPass} className="flex-1">
              Close
            </Button>
            <Button icon={KeyRound} onClick={handleResetPassword} loading={isResettingPass} className="flex-1">
              Reset Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-blue-700 dark:text-blue-400">
            <p className="text-xs leading-relaxed">
              Leave the password field blank to automatically generate a secure temporary password.
            </p>
          </div>

          <Input
            label="Custom Password (Optional)"
            value={tempPassword}
            onChange={e => setTempPassword(e.target.value)}
            placeholder="Leave blank for auto-generate"
          />

          {resetResult && (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  New credentials generated. Share these with the student.
                </p>
              </div>
              <div className="grid gap-2">
                <CredRow icon={IdCard}   label="Admission No"   value={resetResult.admission_no}       onCopy={handleCopy} />
                <CredRow icon={Mail}     label="Login Email"    value={resetResult.email}              onCopy={handleCopy} />
                <CredRow icon={KeyRound} label="Temporary Pass" value={resetResult.generated_password} onCopy={handleCopy} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modals ── */}
      <EnrollmentHistoryModal open={historyOpen} student={student} onClose={() => setHistoryOpen(false)} />
      <MarkAsLeftModal open={leftOpen} student={student} onClose={() => setLeftOpen(false)} onSuccess={() => { setLeftOpen(false); fetchStudent(id) }} />
      <ReadmitModal open={readmitOpen} student={student} onClose={() => setReadmitOpen(false)} onSuccess={() => { setReadmitOpen(false); fetchStudent(id) }} />
    </div>
  )
}

export default StudentDetailPagediv>
          )}
        </div>
      </Modal>

      {/* ── Modals ── */}
      <EnrollmentHistoryModal open={historyOpen} student={student} onClose={() => setHistoryOpen(false)} />
      <MarkAsLeftModal open={leftOpen} student={student} onClose={() => setLeftOpen(false)} onSuccess={() => { setLeftOpen(false); fetchStudent(id) }} />
      <ReadmitModal open={readmitOpen} student={student} onClose={() => setReadmitOpen(false)} onSuccess={() => { setReadmitOpen(false); fetchStudent(id) }} />
    </div>
  )
}

export default StudentDetailPage label="Login Email"    value={resetResult.email}              onCopy={handleCopy} />
                <CredRow icon={KeyRound} label="Temporary Pass" value={resetResult.generated_password} onCopy={handleCopy} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modals ── */}
      <EnrollmentHistoryModal open={historyOpen} student={student} onClose={() => setHistoryOpen(false)} />
      <MarkAsLeftModal open={leftOpen} student={student} onClose={() => setLeftOpen(false)} onSuccess={() => { setLeftOpen(false); fetchStudent(id) }} />
      <ReadmitModal open={readmitOpen} student={student} onClose={() => setReadmitOpen(false)} onSuccess={() => { setReadmitOpen(false); fetchStudent(id) }} />
    </div>
  )
}

export default StudentDetailPage