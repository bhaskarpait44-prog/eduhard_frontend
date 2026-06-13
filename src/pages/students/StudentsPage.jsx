// src/pages/students/StudentsPage.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Users, ChevronRight,
  ChevronLeft, X, LayoutGrid, LayoutList,
  MoreVertical, Eye, Pencil, Trash2,
  ExternalLink, Filter, Upload, Download, FileDown, IdCard
} from 'lucide-react'
import useAdminStudentStore from '@/store/studentStore'
import useSessionStore from '@/store/sessionStore'
import useClasses from '@/hooks/useClasses'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { getFileUrl } from '@/utils/helpers'
import BulkIDCardsDownload from '@/components/pdf/BulkIDCardsDownload'
import { formatDate, getInitials, debounce } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'
import { downloadSimpleClassStudentsPdf } from '@/api/classApi'
import { downloadBlob } from '@/utils/downloadBlob'
import useAuth from '@/hooks/useAuth'
import * as studentApi from '@/api/studentsApi'
import { getSections } from '@/api/classApi'

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_BADGE = {
  male   : { label: 'Male',   variant: 'blue'  },
  female : { label: 'Female', variant: 'green' },
  other  : { label: 'Other',  variant: 'grey'  },
}

const formatStream = (stream) => {
  if (!stream) return null
  const label = stream.charAt(0).toUpperCase() + stream.slice(1)
  return stream === 'regular' ? label : `${label} Stream`
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
const AvatarCircle = ({ name, photo_path, size = "h-9 w-9", fontSize = "text-xs", onClick }) => {
  const initials = getInitials(name)
  return (
    <div 
      className={`${size} rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ${photo_path ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
      onClick={onClick}
    >
      {photo_path ? (
        <img 
          src={getFileUrl(photo_path)} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<span class="${fontSize}">${initials}</span>`;
          }}
        />
      ) : (
        <span className={fontSize}>{initials}</span>
      )}
    </div>
  )
}

// ─── Status Toggle ────────────────────────────────────────────────────────────
const StatusToggle = ({ isActive, onToggle, isLoading }) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      disabled={isLoading}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 ${isActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

// ─── Three-dot dropdown menu ──────────────────────────────────────────────────
const CardMenu = ({ student, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { toastError, toastSuccess } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDownloadForm = async () => {
    setIsDownloading(true)
    try {
      const blob = await studentApi.downloadAdmissionForm(student.id)
      downloadBlob(blob, `AdmissionForm_${student.admission_no}.pdf`)
      toastSuccess('Admission form ready')
    } catch (err) {
      toastError(err.message || 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  const items = [
    { icon: ExternalLink, label: 'Full Profile', action: onView },
    { icon: Pencil, label: 'Edit Profile',  action: onEdit },
    { icon: FileDown, label: 'Admission Form', action: handleDownloadForm, loading: isDownloading },
    { icon: Trash2, label: 'Delete Student', action: onDelete, danger: true },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-top-2">
          {items.map(({ icon: Icon, label, action, danger, loading }) => (
            <button
              key={label}
              disabled={loading}
              onClick={(e) => { e.stopPropagation(); if(!loading) { setOpen(false); action?.() } }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon size={14} className={danger ? 'text-red-500' : 'text-gray-400'} />
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
const StudentGridCard = ({ student, onView, onEdit, onDelete, onPreview }) => {
  const fullName = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment
  const gCfg = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }

  const classLabel = enrollment
    ? [enrollment.class, formatStream(enrollment.stream)].filter(Boolean).join(', ')
    : 'Not Enrolled'

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-700/50">
        <span 
          onClick={onView}
          className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded"
        >
          {student.admission_no}
        </span>
        <CardMenu student={student} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Profile Info */}
      <div className="p-5 flex flex-col items-center text-center flex-1" onClick={onView} style={{ cursor: 'pointer' }}>
        <div className="mb-4 relative">
          <AvatarCircle 
            name={fullName} 
            photo_path={student.photo_path} 
            size="h-16 w-16" 
            fontSize="text-lg" 
            onClick={(e) => {
              if (student.photo_path) {
                e.stopPropagation();
                onPreview?.(student.photo_path, fullName);
              }
            }}
          />
          {student.is_active && (
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-gray-800 rounded-full ${student.is_online ? 'bg-indigo-500 animate-pulse' : 'bg-green-500'}`} />
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1 flex items-center gap-1.5">
          {fullName}
          {student.is_online && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" title="Online now" />
          )}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">{classLabel}</p>

        {/* Status Indicator */}
        <div className="mb-4">
          {student.status === 'active' ? (
            student.is_active ? (
              <Badge variant="green" size="xs" dot>Enrolled</Badge>
            ) : (
              <Badge variant="amber" size="xs" dot>Suspended</Badge>
            )
          ) : student.status === 'left' ? (
            <Badge variant="red" size="xs" dot>Left</Badge>
          ) : (
            <Badge variant="blue" size="xs" dot>Graduated</Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 w-full gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-4 mt-auto">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Roll No</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{enrollment?.roll_number || '--'}</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Gender</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{gCfg.label}</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between gap-2">
        <button 
          onClick={onView}
          className="flex-1 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────
const StudentTableRow = ({ student, onView, onEdit, onDelete, onToggleStatus, onPreview, isSaving }) => {
  const fullName = `${student.first_name} ${student.last_name}`
  const enrollment = student.current_enrollment
  const gCfg = GENDER_BADGE[student.gender] || { label: student.gender, variant: 'grey' }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AvatarCircle 
              name={fullName} 
              photo_path={student.photo_path} 
              onClick={(e) => {
                if (student.photo_path) {
                  e.stopPropagation();
                  onPreview?.(student.photo_path, fullName);
                }
              }}
            />
            {student.is_online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <p 
              onClick={onView}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex items-center gap-1.5"
            >
              {fullName}
              {student.is_online && (
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Online</span>
              )}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {enrollment ? `${enrollment.class} · ${enrollment.section || '-'}` : 'Not Enrolled'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded">
          {student.admission_no}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(student.date_of_birth)}</span>
      </td>
      <td className="px-6 py-4">
        <Badge variant={gCfg.variant}>{gCfg.label}</Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <StatusToggle isActive={student.is_active} onToggle={onToggleStatus} isLoading={isSaving} />
          {student.status === 'active' ? (
            student.is_active ? (
              <Badge variant="green" dot>Enrolled</Badge>
            ) : (
              <Badge variant="amber" dot>Suspended</Badge>
            )
          ) : student.status === 'left' ? (
            <Badge variant="red" dot>Left</Badge>
          ) : (
            <Badge variant="blue" dot>Graduated</Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <CardMenu student={student} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────
const StudentsPage = () => {
  usePageTitle('Students')
  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const { isAdmin } = useAuth()
  const { students, pagination, isLoading, isSaving, fetchStudents, deleteStudent, toggleStatus, fetchClassIDCardsData } = useAdminStudentStore()
  const { classes, sections, fetchClasses, fetchSections } = useClasses()
  const { currentSession, fetchCurrentSession, isLoading: isSessionLoading } = useSessionStore()

  const [search, setSearch] = useState('')
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [filters, setFilters] = useState({ 
    class_id: '', 
    section_id: ''
  })
  const [page, setPage] = useState(1)
  const [view, setView] = useState('grid')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [bulkIDData, setBulkIDData] = useState(null)
  const [fetchingBulk, setFetchingBulk] = useState(false)
  const [downloadModal, setDownloadModal] = useState(false)
  const [idCardModal, setIdCardModal] = useState(false)
  const [idCardFilters, setIdCardFilters] = useState({ class_id: '', section_id: '' })
  const [downloadFilters, setDownloadFilters] = useState({ class_id: '', section_id: '' })
  const [idCardSections, setIdCardSections] = useState([])
  const [downloadSections, setDownloadSections] = useState([])
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  const doFetch = useCallback(
    debounce((q, f, p) => {
      fetchStudents({ search: q, ...f, page: p, perPage: 20 })
        .catch(() => toastError('Failed to load students'))
        .finally(() => setIsInitialLoading(false))
    }, 350),
    [fetchStudents, toastError]
  )

  useEffect(() => {
    if (!currentSession?.id) {
      fetchCurrentSession().catch(() => setIsInitialLoading(false))
      return
    }
    doFetch(search, { ...filters, session_id: String(currentSession.id) }, page)
  }, [search, filters, page, currentSession?.id, doFetch, fetchCurrentSession])

  useEffect(() => {
    fetchClasses().catch(() => toastError('Failed to load classes'))
  }, [fetchClasses, toastError])

  useEffect(() => {
    if (filters.class_id) {
      fetchSections(filters.class_id).catch(() => {})
    }
  }, [filters.class_id, fetchSections])

  const clearFilters = () => {
    setSearch('')
    setFilters({ 
      class_id: '', 
      section_id: ''
    })
    setPage(1)
  }

  const hasActiveFilters = search || Object.values(filters).some(v => v !== '')

  const goToDetail = (id) => navigate(`${ROUTES.STUDENTS}/${id}`)
  const goToEdit   = (id) => navigate(`${ROUTES.STUDENTS}/${id}?tab=profile`)

  const handleToggleStatus = async (student) => {
    const res = await toggleStatus(student.id)
    if (res.success) {
      toastSuccess(`Student ${res.is_active ? 'activated' : 'deactivated'}`)
    } else {
      toastError(res.message || 'Failed to toggle status')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    const res = await deleteStudent(confirmDelete.id, {
      confirm_name: `${confirmDelete.first_name} ${confirmDelete.last_name}`.trim(),
      reason: 'Deleted from students list'
    })
    if (res.success) {
      toastSuccess('Student deleted successfully')
      setConfirmDelete(null)
    } else {
      toastError(res.message || 'Failed to delete student')
    }
  }

  const handleDownloadListPdf = async () => {
    if (!downloadFilters.class_id) {
      toastError('Please select a class.')
      return
    }
    setDownloadingPdf(true)
    try {
      const response = await downloadSimpleClassStudentsPdf(downloadFilters.class_id, {
        session_id: currentSession?.id,
        section_id: downloadFilters.section_id
      })
      
      const clsName = classes.find(c => String(c.id) === String(downloadFilters.class_id))?.name || 'Students'
      const fileName = `${clsName.replace(/[^a-z0-9-_]+/gi, '-')}-student-list.pdf`
      
      downloadBlob(response, fileName)
      setDownloadModal(false)
      toastSuccess('Student list downloaded.')
    } catch (err) {
      toastError(err.message || 'Failed to download student list.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleFetchBulkIDData = async () => {
    if (!idCardFilters.class_id) {
      toastError('Please select a class.')
      return
    }
    setFetchingBulk(true)
    try {
      const data = await fetchClassIDCardsData({ 
        class_id: idCardFilters.class_id, 
        section_id: idCardFilters.section_id,
        session_id: currentSession?.id 
      })
      if (data && data.length > 0) {
        setBulkIDData(data)
      } else {
        toastError('No students found in this class/section.')
      }
    } catch (err) {
      toastError('Failed to fetch ID card data.')
    } finally {
      setFetchingBulk(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            Students
            {!isInitialLoading && pagination.total > 0 && (
              <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                {pagination.total} Total
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Managing enrollment for <span className="font-semibold text-gray-700 dark:text-gray-300">{currentSession?.name || 'current session'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList size={18} />
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                icon={IdCard} 
                onClick={() => {
                  setBulkIDData(null)
                  setIdCardModal(true)
                }}
              >
                ID Cards
              </Button>
              <Button 
                variant="secondary" 
                icon={Download} 
                onClick={() => setDownloadModal(true)}
              >
                Download List
              </Button>
              <Button 
                variant="secondary" 
                icon={Upload} 
                onClick={() => navigate(ROUTES.STUDENT_IMPORT)}
              >
                Import
              </Button>
              <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>
                Admit Student
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Upgrade */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, admission no, or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-sm font-bold shadow-sm ${isFilterPanelOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
            >
              <Filter size={16} className={isFilterPanelOpen ? 'text-indigo-600' : 'text-gray-400'} />
              Filters
              {Object.values(filters).filter(v => v !== '').length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] ml-1">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors"
              >
                <X size={16} /> <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {isFilterPanelOpen && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Class Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Class</label>
                <select
                  value={filters.class_id}
                  onChange={e => { setFilters(f => ({ ...f, class_id: e.target.value, section_id: '' })); setPage(1) }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.stream && cls.stream !== 'regular' ? `(${cls.stream.charAt(0).toUpperCase() + cls.stream.slice(1)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Section</label>
                <select
                  value={filters.section_id}
                  onChange={e => { setFilters(f => ({ ...f, section_id: e.target.value })); setPage(1) }}
                  disabled={!filters.class_id}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{filters.class_id ? 'All Sections' : 'Select Class First'}</option>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {isInitialLoading || isLoading ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className={`animate-pulse bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl ${view === 'grid' ? 'h-64' : 'h-16'}`} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasActiveFilters ? "No students found" : "No students yet"}
            description={hasActiveFilters ? "Try adjusting your search or filters." : "Start by admitting your first student."}
            action={!hasActiveFilters && isAdmin && (
              <Button icon={Plus} onClick={() => navigate(ROUTES.STUDENT_NEW)}>Admit Student</Button>
            )}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
              <StudentGridCard
                key={student.id}
                student={student}
                onView={() => goToDetail(student.id)}
                onEdit={() => goToEdit(student.id)}
                onDelete={() => setConfirmDelete(student)}
                onPreview={(url, title) => setPreviewImage({ url, title })}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    {['Student', 'Admission No', 'Date of Birth', 'Gender', 'Status', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {students.map(student => (
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      onView={() => goToDetail(student.id)}
                      onEdit={() => goToEdit(student.id)}
                      onDelete={() => setConfirmDelete(student)}
                      onToggleStatus={() => handleToggleStatus(student)}
                      onPreview={(url, title) => setPreviewImage({ url, title })}
                      isSaving={isSaving}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${confirmDelete?.first_name} ${confirmDelete?.last_name}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={isSaving}
      />

      {/* ID Cards Modal */}
      <Modal 
        open={idCardModal} 
        onClose={() => setIdCardModal(false)} 
        title="Download Bulk ID Cards"
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
            Generate printable ID cards for all students in a class.
          </div>

          <Select
            label="Class"
            value={idCardFilters.class_id}
            onChange={async (e) => {
              const classId = e.target.value
              setIdCardFilters(prev => ({ ...prev, class_id: classId, section_id: '' }))
              if (classId) {
                try {
                  const res = await getSections(classId)
                  setIdCardSections(res.data || [])
                } catch (err) {
                  toastError('Failed to load sections')
                }
              } else {
                setIdCardSections([])
              }
            }}
            options={classes.map(cls => ({
              value: cls.id,
              label: `${cls.name}${cls.stream && cls.stream !== 'regular' ? ` (${cls.stream.charAt(0).toUpperCase() + cls.stream.slice(1)})` : ''}`
            }))}
            placeholder="Select Class"
            required
          />

          <Select
            label="Section"
            value={idCardFilters.section_id}
            onChange={e => setIdCardFilters(prev => ({ ...prev, section_id: e.target.value }))}
            disabled={!idCardFilters.class_id}
            options={idCardSections.map(sec => ({
              value: sec.id,
              label: `Section ${sec.name}`
            }))}
            placeholder={idCardFilters.class_id ? "All Sections" : "Select Class First"}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIdCardModal(false)} disabled={fetchingBulk}>
              Cancel
            </Button>
            {bulkIDData ? (
              <BulkIDCardsDownload data={bulkIDData} fileName={`IDCards_Class_${idCardFilters.class_id}.pdf`} />
            ) : (
              <Button 
                icon={IdCard} 
                onClick={handleFetchBulkIDData} 
                loading={fetchingBulk}
                disabled={!idCardFilters.class_id}
              >
                Generate ID Cards
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal 
        open={downloadModal} 
        onClose={() => setDownloadModal(false)} 
        title="Download Student List"
      >
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
            Generate a simplified student list for a specific class and section. 
            Includes Student Name and Admission Number.
          </div>

          <Select
            label="Class"
            value={downloadFilters.class_id}
            onChange={async (e) => {
              const classId = e.target.value
              setDownloadFilters(prev => ({ ...prev, class_id: classId, section_id: '' }))
              if (classId) {
                try {
                  const res = await getSections(classId)
                  setDownloadSections(res.data || [])
                } catch (err) {
                  toastError('Failed to load sections')
                }
              } else {
                setDownloadSections([])
              }
            }}
            options={classes.map(cls => ({
              value: cls.id,
              label: `${cls.name}${cls.stream && cls.stream !== 'regular' ? ` (${cls.stream.charAt(0).toUpperCase() + cls.stream.slice(1)})` : ''}${!cls.is_active ? ' (Inactive)' : ''}`
            }))}
            placeholder="Select Class"
            required
          />

          <Select
            label="Section"
            value={downloadFilters.section_id}
            onChange={e => setDownloadFilters(prev => ({ ...prev, section_id: e.target.value }))}
            disabled={!downloadFilters.class_id}
            options={downloadSections.map(sec => ({
              value: sec.id,
              label: `Section ${sec.name}`
            }))}
            placeholder={downloadFilters.class_id ? "All Sections" : "Select Class First"}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDownloadModal(false)} disabled={downloadingPdf}>
              Cancel
            </Button>
            <Button 
              icon={Download} 
              onClick={handleDownloadListPdf} 
              loading={downloadingPdf}
              disabled={!downloadFilters.class_id}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)} 
        title={previewImage?.title || "Profile Photo"}
        size="md"
      >
        <div className="flex justify-center p-2">
          {previewImage && (
            <img 
              src={getFileUrl(previewImage.url)} 
              alt={previewImage.title} 
              className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain"
            />
          )}
        </div>
      </Modal>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500">
            Showing <span className="text-gray-900 dark:text-gray-100">{students.length}</span> of <span className="text-gray-900 dark:text-gray-100">{pagination.total}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4))
                const p = startPage + i
                const active = p === pagination.page
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsPage
