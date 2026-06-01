// src/pages/sessions/SessionsPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, CalendarDays, Eye, Zap,
  ChevronRight, ChevronLeft, Filter, Trash2, Lock
} from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/utils/helpers'
import { ROUTES } from '@/constants/app'

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  upcoming : { label: 'Upcoming', variant: 'blue'   },
  active   : { label: 'Active',   variant: 'green'  },
  locked   : { label: 'Locked',   variant: 'yellow' },
  closed   : { label: 'Closed',   variant: 'grey'   },
  archived : { label: 'Archived', variant: 'dark'   },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, variant: 'grey' }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

const SessionsPage = () => {
  usePageTitle('Academic Sessions')
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()
  const { sessions, pagination, isLoading, isSaving, fetchSessions, activateSession, lockSession, deleteSession } = useSessionStore()

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [activateTarget, setActivateTarget] = useState(null)
  const [lockTarget,     setLockTarget]     = useState(null)
  const [page,         setPage]         = useState(1)

  // Fetch with server-side filters
  useEffect(() => {
    fetchSessions({ page, search, status: statusFilter, limit: 20 })
      .catch(() => toastError('Failed to load sessions'))
  }, [page, search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteSession(deleteTarget.id)
    if (result.success) {
      toastSuccess('Session deleted successfully')
      setDeleteTarget(null)
    } else {
      toastError(result.message || 'Failed to delete session')
    }
  }

  const handleActivate = async () => {
    if (!activateTarget) return
    const result = await activateSession(activateTarget.id)
    if (result.success) {
      toastSuccess(`Session "${activateTarget.name}" activated successfully`)
      setActivateTarget(null)
      fetchSessions({ page, search, status: statusFilter, limit: 20 })
    } else {
      toastError(result.message || 'Failed to activate session')
    }
  }

  const handleLock = async () => {
    if (!lockTarget) return
    const result = await lockSession(lockTarget.id)
    if (result.success) {
      toastSuccess(`Session "${lockTarget.name}" locked successfully`)
      setLockTarget(null)
      fetchSessions({ page, search, status: statusFilter, limit: 20 })
    } else {
      toastError(result.message || 'Failed to lock session')
    }
  }

  // Current page sessions
  const filtered = sessions

  return (
    <div className="space-y-6">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Academic Sessions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Manage academic years, working days, and holidays
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => navigate(ROUTES.SESSION_NEW)}
        >
          Create Session
        </Button>
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
        style={{
          backgroundColor : 'var(--color-surface)',
          border          : '1px solid var(--color-border)',
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search sessions…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{
              backgroundColor : 'var(--color-bg)',
              border          : '1.5px solid var(--color-border)',
              color           : 'var(--color-text-primary)',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-8 py-2 rounded-xl text-sm outline-none appearance-none cursor-pointer"
            style={{
              backgroundColor : 'var(--color-bg)',
              border          : '1.5px solid var(--color-border)',
              color           : 'var(--color-text-primary)',
            }}
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor : 'var(--color-surface)',
          border          : '1px solid var(--color-border)',
        }}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={search || statusFilter !== 'all' ? 'No sessions match' : 'No sessions yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Create your first academic session to get started.'
            }
            action={
              !search && statusFilter === 'all' && (
                <Button icon={Plus} onClick={() => navigate(ROUTES.SESSION_NEW)}>
                  Create Session
                </Button>
              )
            }
            className="border-0 rounded-none"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Session Name', 'Start Date', 'End Date', 'Status', 'Current', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((session, i) => (
                    <tr
                      key={session.id}
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => navigate(`${ROUTES.SESSIONS}/${session.id}`)}
                    >
                      <td className="px-5 py-4">
                        <span
                          className="font-semibold text-sm"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {session.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(session.start_date)}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDate(session.end_date)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="px-5 py-4">
                        {session.is_current && (
                          <Badge variant="green" dot>Current</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Eye}
                            onClick={() => navigate(`${ROUTES.SESSIONS}/${session.id}`)}
                          >
                            View
                          </Button>
                          {session.status === 'upcoming' && (
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Zap}
                              onClick={() => setActivateTarget(session)}
                            >
                              Activate
                            </Button>
                          )}
                          {session.status === 'active' && (
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Lock}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => setLockTarget(session)}
                            >
                              Lock
                            </Button>
                          )}
                          {!session.is_current && (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={Trash2}
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteTarget(session)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {filtered.map(session => (
                <div
                  key={session.id}
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => navigate(`${ROUTES.SESSIONS}/${session.id}`)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--color-surface-raised)' }}
                  >
                    <CalendarDays size={18} style={{ color: 'var(--color-brand)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {session.name}
                      </p>
                      {session.is_current && <Badge variant="green" dot size="sm">Current</Badge>}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(session.start_date)} — {formatDate(session.end_date)}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={session.status} />
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results count and Pagination */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Showing {filtered.length} of {pagination.total} session{pagination.total !== 1 ? 's' : ''}
          </p>

          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border disabled:opacity-50 transition-colors"
                style={{
                  borderColor     : 'var(--color-border)',
                  backgroundColor : 'var(--color-surface)',
                  color           : 'var(--color-text-primary)'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const windowSize = 5;
                  const start = Math.min(
                    Math.max(1, pagination.page - 2),
                    Math.max(1, pagination.totalPages - (windowSize - 1))
                  );
                  return Array.from({ length: Math.min(windowSize, pagination.totalPages) }, (_, i) => {
                    const p = start + i;
                    const active = p === pagination.page
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor : active ? 'var(--color-brand)' : 'var(--color-surface)',
                          color           : active ? 'white' : 'var(--color-text-primary)',
                          border          : active ? 'none' : '1px solid var(--color-border)',
                          boxShadow       : active ? '0 4px 12px rgba(var(--color-brand-rgb), 0.3)' : 'none'
                        }}
                      >
                        {p}
                      </button>
                    )
                  })
                })()}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border disabled:opacity-50 transition-colors"
                style={{
                  borderColor     : 'var(--color-border)',
                  backgroundColor : 'var(--color-surface)',
                  color           : 'var(--color-text-primary)'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm activate dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleActivate}
        title="Activate Session?"
        description={`This will activate "${activateTarget?.name}" and mark it as the current session. Any previously active session will be closed. This action cannot be undone.`}
        confirmLabel="Yes, Activate"
        variant="primary"
        loading={isSaving}
      />

      {/* ── Confirm lock dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={handleLock}
        title="Lock Session?"
        description={`This will lock "${lockTarget?.name}". Once locked, attendance, fees, and results for this session cannot be modified. This action cannot be undone.`}
        confirmLabel="Yes, Lock Session"
        variant="warning"
        loading={isSaving}
      />

      {/* ── Confirm delete dialog ──────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Session?"
        description={`This will permanently delete "${deleteTarget?.name}". All associated data including enrollments, attendance, and results will be lost. This action cannot be undone.`}
        confirmLabel="Yes, Delete Session"
        variant="danger"
        loading={isSaving}
      />
    </div>
  )
}

// ── Table skeleton ────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <div className="p-5 space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {[140, 100, 100, 80, 60, 80].map((w, j) => (
          <div
            key={j}
            className="h-4 rounded animate-pulse"
            style={{ width: w, backgroundColor: 'var(--color-surface-raised)' }}
          />
        ))}
      </div>
    ))}
  </div>
)

export default SessionsPage
