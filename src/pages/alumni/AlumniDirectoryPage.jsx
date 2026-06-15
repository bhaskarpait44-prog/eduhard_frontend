import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  ExternalLink,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { alumniApi } from '@/api'
import { ROUTES, ROLES } from '@/constants/app'
import useAuth from '@/hooks/useAuth'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { getFileUrl, getInitials, cn } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AlumniProfileFormModal from '@/components/alumni/AlumniProfileFormModal'

const AlumniDirectoryPage = () => {
  usePageTitle('Alumni Directory')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastError, toastSuccess } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN

  const [alumni, setAlumni] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, perPage: 20, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAlumniId, setSelectedAlumniId] = useState(null)

  // Filters from URL
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const batchYear = searchParams.get('batch_year') || ''
  const occupation = searchParams.get('occupation') || ''
  const city = searchParams.get('city') || ''
  const isMentor = searchParams.get('is_mentor') || ''

  const fetchAlumni = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        perPage: 20,
        search,
        batch_year: batchYear || undefined,
        occupation: occupation || undefined,
        city: city || undefined,
        is_mentor: isMentor || undefined
      }
      const res = await alumniApi.getAlumniDirectory(params)
      setAlumni(res.data.students)
      setPagination(res.data.pagination)
    } catch (err) {
      toastError('Failed to fetch alumni directory')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, batchYear, occupation, city, isMentor, toastError])

  useEffect(() => {
    fetchAlumni()
  }, [fetchAlumni])

  const handleSearch = (e) => {
    e.preventDefault()
    const form = e.target
    const newParams = new URLSearchParams(searchParams)
    newParams.set('search', form.search.value)
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleFilterChange = (name, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) newParams.set(name, value)
    else newParams.delete(name)
    if (name !== 'page') newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const params = { search, batch_year: batchYear, occupation }
      const res = await alumniApi.downloadAlumniPdf(params)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `alumni-directory-${new Date().getTime()}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess('PDF downloaded successfully')
    } catch (err) {
      toastError('Failed to download PDF')
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleEditProfile = (e, id) => {
    e.stopPropagation()
    setSelectedAlumniId(id)
    setShowEditModal(true)
  }

  const batchYears = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alumni Directory</h1>
          <p className="text-sm text-text-secondary">Network and manage profiles of past students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={Download}
            loading={isDownloading}
            onClick={handleDownloadPdf}
            size="sm"
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border-base rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or admission no..."
              className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-border-base rounded-xl text-sm focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </form>

          <select
            value={batchYear}
            onChange={(e) => handleFilterChange('batch_year', e.target.value)}
            className="px-4 py-2 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All Batches</option>
            {batchYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>

          <select
            value={occupation}
            onChange={(e) => handleFilterChange('occupation', e.target.value)}
            className="px-4 py-2 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All Occupations</option>
            <option value="employed">Employed</option>
            <option value="self_employed">Self Employed</option>
            <option value="higher_studies">Higher Studies</option>
            <option value="unemployed">Unemployed</option>
            <option value="other">Other</option>
          </select>

          <div className="flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border-base rounded-xl">
            <input
              type="checkbox"
              id="mentor-toggle"
              checked={isMentor === 'true'}
              onChange={(e) => handleFilterChange('is_mentor', e.target.checked ? 'true' : '')}
              className="rounded border-border-base text-brand focus:ring-brand"
            />
            <label htmlFor="mentor-toggle" className="text-sm font-medium text-text-secondary select-none">
              Mentors Only
            </label>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border-base rounded-2xl p-5 animate-pulse h-[200px]" />
          ))}
        </div>
      ) : alumni.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alumni.map((person) => (
            <AlumniCard
              key={person.id}
              person={person}
              onClick={() => navigate(ROUTES.ALUMNI_PROFILE.replace(':id', person.id))}
              onEdit={(e) => handleEditProfile(e, person.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-surface border border-dashed border-border-base rounded-2xl">
          <User size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-text-primary">No alumni found</h3>
          <p className="text-text-secondary text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-text-secondary">
            Showing <span className="font-bold text-text-primary">{alumni.length}</span> of <span className="font-bold text-text-primary">{pagination.total}</span> alumni
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => handleFilterChange('page', page - 1)}
            />
            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const p = i + 1
                if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => handleFilterChange('page', p)}
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                        page === p ? "bg-brand text-white" : "hover:bg-surface-raised text-text-secondary"
                      )}
                    >
                      {p}
                    </button>
                  )
                }
                if (p === 2 || p === pagination.totalPages - 1) {
                  return <span key={p} className="px-1 text-text-muted">...</span>
                }
                return null
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              disabled={page >= pagination.totalPages}
              onClick={() => handleFilterChange('page', page + 1)}
            />
          </div>
        </div>
      )}

      {showEditModal && (
        <AlumniProfileFormModal
          id={selectedAlumniId}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchAlumni()
          }}
        />
      )}
    </div>
  )
}

const AlumniCard = ({ person, onClick, onEdit, isAdmin }) => {
  const fullName = `${person.first_name} ${person.last_name || ''}`.trim()
  const profile = person.alumniProfile
  const batchYear = person.left_date ? new Date(person.left_date).getFullYear() : '--'

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border-base rounded-2xl p-5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="flex gap-4 relative z-10">
        <div className="h-16 w-16 rounded-2xl bg-surface-raised flex items-center justify-center text-text-muted font-bold text-xl overflow-hidden shrink-0 border border-border-base">
          {person.photo_url ? (
            <img src={getFileUrl(person.photo_url)} alt="" className="h-full w-full object-cover" />
          ) : getInitials(fullName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-text-primary truncate group-hover:text-brand transition-colors">
              {fullName}
            </h3>
            {isAdmin && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-brand/10 text-text-muted hover:text-brand transition-colors shrink-0"
              >
                <Edit size={14} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
            <GraduationCap size={12} className="text-brand" />
            Batch of {batchYear} • Adm No: {person.admission_no}
          </p>

          <div className="mt-3 space-y-2">
            {profile?.current_occupation ? (
              <div className="flex items-start gap-2">
                <Briefcase size={12} className="mt-1 text-text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {profile.job_title || profile.current_occupation.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-text-secondary truncate">
                    {profile.company_or_institution || '--'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-text-muted italic">Profile incomplete</p>
            )}

            {profile?.current_city && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-text-muted shrink-0" />
                <p className="text-[10px] text-text-secondary truncate">
                  {profile.current_city}, {profile.current_country}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-base flex items-center justify-between">
        <div className="flex gap-1.5">
          {profile?.is_mentor_volunteer && (
            <Badge variant="blue" size="xs">Mentor</Badge>
          )}
          <Badge variant={person.status === 'graduated' ? 'green' : 'grey'} size="xs">
            {person.status}
          </Badge>
        </div>
        <button className="text-[10px] font-bold text-brand flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View Profile <ExternalLink size={10} />
        </button>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
    </div>
  )
}

export default AlumniDirectoryPage
