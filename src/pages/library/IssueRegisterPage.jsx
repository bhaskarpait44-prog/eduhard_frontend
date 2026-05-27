import React, { useState, useEffect } from 'react';
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
import ReturnBookModal from '../../components/library/ReturnBookModal';

const IssueRegisterPage = () => {
  usePageTitle('Issue Register');
  const { toastSuccess, toastError } = useToast();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [borrowerType, setBorrowerType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [overdueLoading, setOverdueLoading] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [page, status, borrowerType]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getIssues({
        page,
        status,
        borrower_type: borrowerType,
        start_date: startDate,
        end_date: endDate,
        search,
        limit: 10
      });
      setIssues(data.issues);
      setTotalPages(data.totalPages);
    } catch (err) {
      toastError('Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOverdue = async () => {
    setOverdueLoading(true);
    try {
      const { data } = await libraryApi.markOverdue();
      toastSuccess(data.message || `Overdue status updated: ${data.updatedCount} books.`);
      fetchIssues();
    } catch (err) {
      toastError('Failed to refresh overdue status');
    } finally {
      setOverdueLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssues();
  };

  const handleReturn = async (returnData) => {
    setReturnLoading(true);
    try {
      await libraryApi.returnBook(selectedIssue.id, returnData);
      toastSuccess('Book returned successfully');
      setIsReturnModalOpen(false);
      fetchIssues();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setReturnLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Issue Register</h1>
          <p className="text-text-muted">Track and manage book issues/returns</p>
        </div>
        <Button 
          variant="secondary" 
          loading={overdueLoading}
          onClick={handleRefreshOverdue}
        >
          Refresh Overdue Status
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by book or borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            options={[
              { label: 'All Status', value: '' },
              { label: 'Issued', value: 'issued' },
              { label: 'Returned', value: 'returned' },
              { label: 'Overdue', value: 'overdue' },
            ]}
            value={status}
            onChange={setStatus}
          />
          <Select
            options={[
              { label: 'All Borrowers', value: '' },
              { label: 'Student', value: 'student' },
              { label: 'Staff', value: 'staff' },
            ]}
            value={borrowerType}
            onChange={setBorrowerType}
          />
          <Input
            type="date"
            placeholder="From Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            placeholder="To Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : issues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Book Title</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Borrower</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Dates</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Fine</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Status</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr 
                    key={issue.id} 
                    className={`border-b border-border hover:bg-surface-raised transition-colors ${issue.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                  >
                    <td className="py-4 px-2 text-sm font-medium">{issue.book_title}</td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{issue.borrower_name}</span>
                        <span className="text-xs text-text-muted capitalize">
                           {issue.borrower_type} {issue.class_name ? `(${issue.class_name})` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col text-xs">
                        <span>Issued: {formatDate(issue.issue_date)}</span>
                        <span className="text-red-500 font-medium">Due: {formatDate(issue.due_date)}</span>
                        {issue.return_date && <span className="text-green-600">Ret: {formatDate(issue.return_date)}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-sm">
                      {issue.fine_amount > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-red-500">₹{issue.fine_amount}</span>
                          <span className="text-[10px] uppercase">{issue.fine_status}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-2">
                      {getStatusBadge(issue.status)}
                    </td>
                    <td className="py-4 px-2 text-sm">
                      {issue.status !== 'returned' && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedIssue(issue); setIsReturnModalOpen(true); }}>
                          Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No records found"
            description="Adjust your filters or issue a book to see results."
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
            <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      <ReturnBookModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={handleReturn}
        issue={selectedIssue}
        loading={returnLoading}
      />
    </div>
  );
};

export default IssueRegisterPage;
