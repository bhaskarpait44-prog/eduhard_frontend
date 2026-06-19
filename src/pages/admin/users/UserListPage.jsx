import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, Trash2, ToggleLeft, ToggleRight,
  X, Upload, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'
import Modal from '@/components/ui/Modal'

const ROLE_STYLES = {
  admin       : { label: 'Admin', color: 'var(--color-brand)', bg: 'color-mix(in srgb, var(--color-brand) 12%, var(--color-surface-raised))' },
  teacher     : { label: 'Teacher', color: 'var(--color-success)', bg: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface-raised))' },
  accountant  : { label: 'Accountant', color: 'var(--color-warning)', bg: 'color-mix(in srgb, var(--color-warning) 12%, var(--color-surface-raised))' },
  student     : { label: 'Student', color: 'var(--color-info)', bg: 'color-mix(in srgb, var(--color-info) 12%, var(--color-surface-raised))' },
  parent      : { label: 'Parent', color: '#b45309', bg: 'color-mix(in srgb, #b45309 12%, var(--color-surface-raised))' },
  librarian   : { label: 'Librarian', color: '#7c3aed', bg: 'color-mix(in srgb, #7c3aed 12%, var(--color-surface-raised))' },
  receptionist: { label: 'Receptionist', color: '#be185d', bg: 'color-mix(in srgb, #be185d 12%, var(--color-surface-raised))' },
  staff       : { label: 'Staff', color: '#0369a1', bg: 'color-mix(in srgb, #0369a1 12%, var(--color-surface-raised))' },
}

const MANAGED_ROLE_OPTIONS = ['admin', 'teacher', 'accountant', 'student', 'parent', 'staff', 'librarian', 'receptionist']
const DEFAULT_PAGINATION = { page: 1, totalPages: 1, total: 0, perPage: 20 }

const getUserRecordId = (user) => user?.uid ?? user?.id ?? user?.source_id ?? null

const RoleBadge = ({ role }) => {
  const s = ROLE_STYLES[role] || { label: role, bg: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

const Skeleton = () => (
  <div className="animate-pulse divide-y" style={{ borderColor: 'var(--color-border)' }}>
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        <div className="w-5 h-5 rounded bg-gray-200 shrink-0" />
        <div className="w-9 h-9 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          <div className="h-3 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        </div>
        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
      </div>
    ))}
  </div>
)

const UserListPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toastSuccess, toastError } = useToast()
  
  const requestedRole = searchParams.get('role')
  const requestedStatus = searchParams.get('status')
  
  const initialRoleFilter = MANAGED_ROLE_OPTIONS.includes(requestedRole) ? requestedRole : ''
  const initialStatusFilter = ['active', 'inactive'].includes(requestedStatus) ? requestedStatus : ''

  const [users, setUsers] = useState([])
  const [roleCounts, setRoleCounts] = useState({})
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  
  // Sorting states
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [perPage, setPerPage] = useState(20)

  // Selection states
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [userToDelete, setUserToDelete] = useState(null)

  const currentPage = pagination.page || 1
  const totalPages = pagination.totalPages || 1
  const activeRoleStyle = roleFilter ? ROLE_STYLES[roleFilter] : null
  const activeRoleLabel = activeRoleStyle?.label || 'All'
  const pageTitle = roleFilter ? `${activeRoleLabel} Users` : 'User Management'
  
  const activeFiltersDesc = useMemo(() => {
    const parts = []
    if (roleFilter) {
      parts.push(ROLE_STYLES[roleFilter]?.label || roleFilter)
    }
    if (statusFilter) {
      parts.push(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))
    }
    if (search) {
      parts.push(`matching "${search}"`)
    }
    return parts.length > 0 ? ` — ${parts.join(', ')}` : ''
  }, [roleFilter, statusFilter, search])

  const pageDescription = `${pagination.total} result${pagination.total !== 1 ? 's' : ''}${activeFiltersDesc}`
  usePageTitle(pageTitle)

  const getPageNumbers = () => {
    const pages = []
    const showMax = 5

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const load = async (params = {}) => {
    const nextPage = params.page || currentPage
    setIsLoading(true)
    try {
      const response = await api.getUsers({
        page: nextPage,
        perPage: perPage,
        search,
        role: roleFilter,
        status: statusFilter,
      })

      setUsers(response.data?.users || [])
      setRoleCounts(response.data?.roleCounts || {})
      setPagination(response.data?.pagination || DEFAULT_PAGINATION)
      setSelectedIds(new Set())
    } catch (e) {
      toastError(e.message || 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setRoleFilter(initialRoleFilter)
  }, [initialRoleFilter])

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  useEffect(() => {
    load({ page: 1 })
  }, [search, roleFilter, statusFilter, perPage])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (roleFilter) nextParams.set('role', roleFilter)
    if (statusFilter) nextParams.set('status', statusFilter)
    setSearchParams(nextParams, { replace: true })
  }, [roleFilter, statusFilter, setSearchParams])

  const handleToggle = async (user) => {
    const userId = getUserRecordId(user)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }
    setIsSaving(true)
    try {
      const response = await api.toggleUserStatus(userId)
      const nextStatus = response.data?.is_active ?? !user.is_active
      setUsers(prev => prev.map((u) => (
        getUserRecordId(u) === userId ? { ...u, is_active: nextStatus } : u
      )))
      toastSuccess(response.message || `User ${nextStatus ? 'activated' : 'deactivated'}`)
    } catch (e) {
      toastError(e.message || 'Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = (user) => {
    if (user.source_type === 'student_portal') {
      toastError('Manage this student from the Students module')
      return
    }
    setUserToDelete(user)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    const userId = getUserRecordId(userToDelete)
    if (!userId) {
      toastError('Unable to identify this user record')
      return
    }

    setIsSaving(true)
    try {
      await api.deleteUser(userId)
      setUsers(prev => prev.filter((u) => getUserRecordId(u) !== userId))
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      setRoleCounts(prev => ({
        ...prev,
        [userToDelete.role]: Math.max(0, (prev[userToDelete.role] || 0) - 1),
      }))
      toastSuccess('User deleted')
      setUserToDelete(null)
    } catch (e) {
      toastError(e.message || 'Cannot delete user')
    } finally {
      setIsSaving(false)
    }
  }

  // Bulk Actions
  const handleBulkStatus = async (isActive) => {
    setIsSaving(true)
    try {
      const idsToToggle = []
      users.forEach(u => {
        const uid = getUserRecordId(u)
        if (selectedIds.has(uid) && u.is_active !== isActive) {
          idsToToggle.push(uid)
        }
      })

      if (idsToToggle.length > 0) {
        await Promise.all(idsToToggle.map(id => api.toggleUserStatus(id)))
      }
      toastSuccess(`Bulk updated status for ${selectedIds.size} user(s)`)
      setSelectedIds(new Set())
      load()
    } catch (e) {
      toastError('Failed to bulk update status')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} user(s)?`)) return
    setIsSaving(true)
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.deleteUser(id)))
      toastSuccess(`Successfully deleted ${selectedIds.size} user(s)`)
      setSelectedIds(new Set())
      load()
    } catch (e) {
      toastError('Failed to bulk delete users')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkExport = () => {
    const selectedUsersData = users.filter(u => selectedIds.has(getUserRecordId(u)))
    const headers = ['Name', 'Email/Employee ID', 'Role', 'Status', 'Last Login', 'Created At']
    const csvContent = [
      headers.join(','),
      ...selectedUsersData.map(u => [
        `"${u.name}"`,
        `"${u.email || u.employee_id || ''}"`,
        `"${u.role}"`,
        `"${u.is_active ? 'Active' : 'Inactive'}"`,
        `"${u.last_login_at ? formatDate(u.last_login_at) : 'Never'}"`,
        `"${u.created_at ? formatDate(u.created_at) : ''}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `exported_users_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Exported successfully')
  }

  // Client side sorting
  const sortedUsers = useMemo(() => {
    const listCopy = [...users]
    listCopy.sort((a, b) => {
      let valA = a[sortBy] ?? ''
      let valB = b[sortBy] ?? ''

      if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase()
        valB = (b.name || '').toLowerCase()
      } else if (sortBy === 'role') {
        valA = (a.role || '').toLowerCase()
        valB = (b.role || '').toLowerCase()
      } else if (sortBy === 'created_at') {
        valA = a.created_at ? new Date(a.created_at).getTime() : 0
        valB = b.created_at ? new Date(b.created_at).getTime() : 0
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return listCopy
  }, [users, sortBy, sortOrder])

  // Checkbox management
  const allSelected = sortedUsers.length > 0 && sortedUsers.every(u => selectedIds.has(getUserRecordId(u)))
  
  const handleSelectAll = () => {
    if (allSelected) {
      const nextSelected = new Set(selectedIds)
      sortedUsers.forEach(u => nextSelected.delete(getUserRecordId(u)))
      setSelectedIds(nextSelected)
    } else {
      const nextSelected = new Set(selectedIds)
      sortedUsers.forEach(u => nextSelected.add(getUserRecordId(u)))
      setSelectedIds(nextSelected)
    }
  }

  const handleSelectRow = (uid) => {
    const nextSelected = new Set(selectedIds)
    if (nextSelected.has(uid)) {
      nextSelected.delete(uid)
    } else {
      nextSelected.add(uid)
    }
    setSelectedIds(nextSelected)
  }

  const handleRowClick = (e, user) => {
    const tag = e.target.tagName.toLowerCase()
    if (tag === 'input' || tag === 'button' || tag === 'svg' || tag === 'path' || e.target.closest('button') || e.target.closest('input')) {
      return
    }
    const uid = getUserRecordId(user)
    if (uid) {
      navigate(ROUTES.USER_DETAIL.replace(':id', uid))
    }
  }

  const roleChips = useMemo(() => Object.entries(ROLE_STYLES), [])

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => navigate(ROUTES.USERS)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm hover:opacity-75"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={15} />
            User Management
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {pageDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(roleFilter ? `${ROUTES.USER_IMPORT}?role=${roleFilter}` : ROUTES.USER_IMPORT)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            <Upload size={15} />
            Import Users
          </button>
          <button
            onClick={() => navigate(roleFilter ? `${ROUTES.USER_NEW}?role=${roleFilter}` : ROUTES.USER_NEW)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <Plus size={15} />
            Add New User
          </button>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 dark:bg-slate-900 dark:border-slate-800 flex-1 max-w-md">
              <Search size={16} className="text-gray-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, email or employee ID..."
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border border-gray-100 bg-gray-50 dark:bg-slate-900 dark:border-slate-800 outline-none text-gray-700 dark:text-gray-200"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort Control */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-3 py-2 rounded-xl text-sm border border-gray-100 bg-gray-50 dark:bg-slate-900 dark:border-slate-800 outline-none text-gray-700 dark:text-gray-200"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="role-asc">Role (A-Z)</option>
              <option value="role-desc">Role (Z-A)</option>
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Per Page:</span>
            <select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="px-2 py-1.5 rounded-xl text-xs border border-gray-100 bg-gray-50 dark:bg-slate-900 dark:border-slate-800 outline-none text-gray-700 dark:text-gray-200 font-bold"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* Persistent Role Chips */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/50">
          {roleChips.map(([role, s]) => {
            const isSelected = roleFilter === role
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(isSelected ? '' : role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                style={{
                  backgroundColor: isSelected ? `color-mix(in srgb, ${s.color} 12%, var(--color-surface-raised))` : 'var(--color-surface-raised)',
                  color: isSelected ? s.color : 'var(--color-text-secondary)',
                  borderColor: isSelected ? s.color : 'var(--color-border)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}: {roleCounts[role] || 0}
              </button>
            )
          })}
          {(roleFilter || statusFilter || searchInput) && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setRoleFilter('')
                setStatusFilter('')
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {isLoading ? (
          <Skeleton />
        ) : sortedUsers.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="max-w-xs mx-auto">
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>No users found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>We couldn't find any user matching your search or filters.</p>
            </div>
            <div className="flex gap-3 justify-center">
              {(roleFilter || statusFilter || searchInput) && (
                <button
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                    setRoleFilter('')
                    setStatusFilter('')
                  }}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => navigate(roleFilter ? `${ROUTES.USER_NEW}?role=${roleFilter}` : ROUTES.USER_NEW)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors border border-indigo-700"
              >
                Create new user
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="px-5 py-3.5 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  {['User', 'Role', 'Status', 'Permissions', 'Created', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, i) => {
                  const uid = getUserRecordId(user)
                  const isRowChecked = selectedIds.has(uid)
                  return (
                    <tr
                      key={uid || `${user.source_type || 'user'}-${user.source_id ?? user.id ?? i}`}
                      style={{ borderBottom: i < sortedUsers.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      className="transition-colors cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/20"
                      onClick={e => handleRowClick(e, user)}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isRowChecked}
                          onChange={() => handleSelectRow(uid)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: ROLE_STYLES[user.role]?.color || 'var(--color-brand)' }}
                          >
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.email || user.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: user.is_active
                                ? 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface-raised))'
                                : 'color-mix(in srgb, var(--color-text-secondary) 12%, var(--color-surface-raised))',
                              color: user.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: user.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)',
                              }}
                            />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.is_online && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, var(--color-surface-raised))',
                                color: 'var(--color-brand)',
                                border: '1px solid color-mix(in srgb, var(--color-brand) 25%, var(--color-border))',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                                style={{ backgroundColor: 'var(--color-brand)' }}
                              />
                              Online
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {user.role === 'admin'
                            ? 'All (Admin)'
                            : `${user.permission_count || 0} permissions`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {user.created_at ? formatDate(user.created_at) : '--'}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {user.is_online ? (
                          <span className="text-indigo-600 font-bold">Active now</span>
                        ) : (
                          user.last_login_at ? formatDate(user.last_login_at) : 'Never'
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(ROUTES.USER_DETAIL.replace(':id', uid))}
                            className="px-2.5 py-1.5 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400 hover:dark:bg-slate-700 transition-all flex items-center gap-1.5"
                          >
                            Manage
                          </button>
                          <ActionButton
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggle(user)}
                            disabled={isSaving}
                          >
                            {user.is_active ? <ToggleRight size={15} style={{ color: '#16a34a' }} /> : <ToggleLeft size={15} />}
                          </ActionButton>
                          <ActionButton
                            title="Delete"
                            onClick={() => confirmDelete(user)}
                            disabled={isSaving}
                            danger
                          >
                            <Trash2 size={13} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => load({ page: currentPage - 1 })}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <ChevronLeft size={16} />
          </button>
          
          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={`sep-${i}`} className="px-1 text-gray-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => load({ page: p })}
                className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: p === currentPage ? 'var(--color-brand)' : 'var(--color-surface)',
                  color: p === currentPage ? '#fff' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {p}
              </button>
            )
          ))}

          <button
            onClick={() => load({ page: currentPage + 1 })}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs font-semibold">
            {selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatus(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkStatus(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-900/30"
            >
              Delete
            </button>
            <button
              onClick={handleBulkExport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Export CSV
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setUserToDelete(null)}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Delete User
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
          </p>
          <p className="text-xs text-gray-400">
            This action will deactivate their account and hide them from general lists. You can still find them using the 'Inactive' status filter.
          </p>
        </div>
      </Modal>
    </div>
  )
}

const ActionButton = ({ children, title, onClick, disabled, danger = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
    title={title}
    style={{ color: danger ? '#dc2626' : 'var(--color-text-muted)' }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : 'var(--color-surface-raised)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    {children}
  </button>
)

export default UserListPage
