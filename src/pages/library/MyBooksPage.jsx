import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import usePageTitle from '../../hooks/usePageTitle';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const MyBooksPage = () => {
  usePageTitle('My Issued Books');

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyIssues();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Issued Books</h1>
        <p className="text-text-muted">Track your borrowed books and due dates</p>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        {loading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : issues.length > 0 ? (
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
                        <span className="font-medium text-text-primary">{issue.book?.title}</span>
                        <span className="text-xs text-text-muted">{issue.book?.author}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col text-xs">
                        <span>Issued: {issue.issue_date}</span>
                        <span className={`font-medium ${issue.status === 'overdue' ? 'text-red-500' : 'text-text-muted'}`}>
                           Due: {issue.due_date}
                        </span>
                        {issue.return_date && <span className="text-green-600">Returned: {issue.return_date}</span>}
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
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;
