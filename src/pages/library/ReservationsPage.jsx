import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, CheckCircle2, XCircle, Search, Filter, Users } from 'lucide-react';
import libraryApi from '../../api/libraryApi';
import useToast from '../../hooks/useToast';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Ready for Pickup', value: 'ready' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
];

const BORROWER_OPTIONS = [
  { label: 'All Borrowers', value: '' },
  { label: 'Students', value: 'student' },
  { label: 'Staff', value: 'staff' },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':   return <Badge variant="primary">Waitlist</Badge>;
    case 'ready':     return <Badge variant="success">Ready for Pickup</Badge>;
    case 'completed': return <Badge variant="ghost">Fulfilled</Badge>;
    case 'cancelled': return <Badge variant="ghost">Cancelled</Badge>;
    case 'expired':   return <Badge variant="danger">Expired</Badge>;
    default:          return <Badge variant="ghost">{status}</Badge>;
  }
};

const ReservationsPage = () => {
  usePageTitle('Reservations Queue');
  const { toastSuccess, toastError } = useToast();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [borrowerType, setBorrowerType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkCancelLoading, setBulkCancelLoading] = useState(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getReservations({
        status,
        borrower_type: borrowerType,
        page,
        limit: 15,
      });
      setReservations(data.reservations || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toastError('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [status, borrowerType, page]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleMarkReady = async (id) => {
    setActionLoadingId(id);
    try {
      await libraryApi.markReservationReady(id);
      toastSuccess('Reservation marked as ready for pickup.');
      fetchReservations();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to mark reservation as ready.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id) => {
    setActionLoadingId(id);
    try {
      await libraryApi.cancelReservation(id);
      toastSuccess('Reservation cancelled.');
      fetchReservations();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkCancelExpired = async () => {
    setBulkCancelLoading(true);
    try {
      // Cancel all expired reservations one by one from current view
      const expiredIds = reservations.filter(r => r.status === 'expired').map(r => r.id);
      if (expiredIds.length === 0) {
        toastError('No expired reservations visible on this page.');
        return;
      }
      await Promise.all(expiredIds.map(id => libraryApi.cancelReservation(id)));
      toastSuccess(`Cancelled ${expiredIds.length} expired reservation(s).`);
      fetchReservations();
    } catch (err) {
      toastError('Some cancellations failed. Please try again.');
    } finally {
      setBulkCancelLoading(false);
    }
  };

  const getBorrowerName = (res) => {
    if (res.studentBorrower) {
      return `${res.studentBorrower.first_name} ${res.studentBorrower.last_name}`;
    }
    if (res.staffBorrower) return res.staffBorrower.name;
    return '—';
  };

  const getBorrowerIdentifier = (res) => {
    if (res.studentBorrower) return res.studentBorrower.admission_no || 'Student';
    if (res.staffBorrower) return res.staffBorrower.email || 'Staff';
    return res.borrower_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reservation Queue</h1>
          <p className="text-text-muted">
            Manage book reservation requests · {total} total reservation{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBulkCancelExpired}
            loading={bulkCancelLoading}
            icon={XCircle}
          >
            Clear Expired
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchReservations} icon={Filter}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-[28px] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Filter by Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          />
          <Select
            label="Filter by Borrower Type"
            options={BORROWER_OPTIONS}
            value={borrowerType}
            onChange={(e) => { setBorrowerType(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : reservations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted">Book</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted">Borrower</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted text-center">Queue #</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted">Reserved On</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted">Expires</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted text-center">Status</th>
                  <th className="py-4 px-3 text-xs font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res, idx) => (
                  <tr
                    key={res.id}
                    className={`border-b border-border hover:bg-surface-raised transition-colors ${
                      res.status === 'expired' ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Book */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-11 rounded bg-surface-raised border border-border flex items-center justify-center shrink-0">
                          <BookOpen size={14} className="text-text-muted opacity-50" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate max-w-[160px]">
                            {res.book?.title || '—'}
                          </p>
                          <p className="text-xs text-text-muted truncate">{res.book?.author}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            {res.book?.available_copies ?? '?'} copy(s) available
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Borrower */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">{getBorrowerName(res)}</span>
                        <span className="text-xs text-text-muted">{getBorrowerIdentifier(res)}</span>
                        <span className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5 font-bold">
                          {res.borrower_type}
                        </span>
                      </div>
                    </td>

                    {/* Queue position (relative index on this page) */}
                    <td className="py-4 px-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-surface-raised border border-border flex items-center justify-center mx-auto">
                        <span className="text-xs font-black text-text-secondary">
                          {(page - 1) * 15 + idx + 1}
                        </span>
                      </div>
                    </td>

                    {/* Reserved on */}
                    <td className="py-4 px-3 text-sm text-text-secondary">
                      {formatDate(res.reservation_date)}
                    </td>

                    {/* Expires at */}
                    <td className="py-4 px-3 text-sm">
                      {res.expires_at ? (
                        <span className={new Date(res.expires_at) < new Date() ? 'text-red-500 font-bold' : 'text-text-secondary'}>
                          {formatDate(res.expires_at)}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-3 text-center">
                      {getStatusBadge(res.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {res.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest"
                            onClick={() => handleMarkReady(res.id)}
                            loading={actionLoadingId === res.id}
                            icon={CheckCircle2}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {(res.status === 'pending' || res.status === 'ready') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleCancel(res.id)}
                            loading={actionLoadingId === res.id}
                            icon={XCircle}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No reservations found"
            description="There are no reservations matching your current filters."
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsPage;
