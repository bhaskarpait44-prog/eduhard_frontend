import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const MyBooksPage = () => {
  usePageTitle('My Library');

  const [activeTab, setActiveTab] = useState('issues');
  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'issues') fetchMyIssues();
    else fetchMyReservations();
  }, [activeTab]);

  const fetchMyIssues = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getMyIssues();
      setIssues(data);
    } catch (err) {
      console.error('Failed to fetch my issues', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getMyReservations();
      setReservations(data);
    } catch (err) {
      console.error('Failed to fetch my reservations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    setCancelLoading(true);
    try {
      await libraryApi.cancelReservation(id);
      fetchMyReservations();
    } catch (err) {
      console.error('Failed to cancel reservation', err);
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'issued': return <Badge variant="primary">Issued</Badge>;
      case 'returned': return <Badge variant="success">Returned</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      default: return <Badge variant="ghost">{status}</Badge>;
    }
  };

  const getReservationBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="primary">Waitlist</Badge>;
      case 'ready': return <Badge variant="success">Ready for Pickup</Badge>;
      case 'completed': return <Badge variant="ghost">Fulfilled</Badge>;
      case 'cancelled': return <Badge variant="ghost">Cancelled</Badge>;
      case 'expired': return <Badge variant="danger">Expired</Badge>;
      default: return <Badge variant="ghost">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Library</h1>
        <p className="text-text-muted">Track your borrowed books and reservations</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface-raised border border-border rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'issues' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          My Issues
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'reservations' ? 'bg-surface text-brand shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          My Reservations
        </button>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        {loading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : activeTab === 'issues' ? (
          issues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Book Title</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Dates</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Fine</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="border-b border-border hover:bg-surface-raised transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{issue.book_title}</span>
                          <span className="text-xs text-text-muted">{issue.book_author}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex flex-col text-xs">
                          <span>Issued: {formatDate(issue.issue_date)}</span>
                          <span className={`font-medium ${issue.status === 'overdue' ? 'text-red-500' : 'text-text-muted'}`}>
                             Due: {formatDate(issue.due_date)}
                          </span>
                          {issue.return_date && <span className="text-green-600">Returned: {formatDate(issue.return_date)}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm">
                        {issue.fine_amount > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-red-500">₹{issue.fine_amount}</span>
                            <span className="text-[10px] uppercase text-muted">{issue.fine_status}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-2">
                        {getStatusBadge(issue.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No books issued"
              description="You don't have any books currently issued to you."
            />
          )
        ) : (
          reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Book Title</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Reserved On</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Status</th>
                    <th className="py-4 px-2 text-sm font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id} className="border-b border-border hover:bg-surface-raised transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{res.book?.title}</span>
                          <span className="text-xs text-text-muted">{res.book?.author}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm">
                        <div className="flex flex-col">
                          <span>{formatDate(res.reservation_date)}</span>
                          {res.expires_at && (
                            <span className="text-[10px] text-orange-600 font-medium">
                              Expires: {formatDate(res.expires_at)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        {getReservationBadge(res.status)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        {(res.status === 'pending' || res.status === 'ready') && (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            disabled={cancelLoading}
                            className="text-xs text-red-500 font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No reservations"
              description="You haven't reserved any books yet."
            />
          )
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;
