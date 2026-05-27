import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import useToast from '../../hooks/useToast';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const LibraryDashboardPage = () => {
  usePageTitle('Library Dashboard');
  const { toastError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await libraryApi.getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setError(true);
      toastError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>;
  
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <EmptyState 
          title="Connection Error" 
          description="We couldn't reach the library servers. Please check your connection and try again."
        />
        <Button variant="secondary" onClick={fetchDashboardData} className="mt-4">
          Retry Loading
        </Button>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-text-muted">No dashboard data available.</div>;

  const { stats, recentIssues, topBooks } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Library Overview</h1>
        <p className="text-text-muted">Quick insights into your library operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Books" value={stats.total_books || 0} color="blue" />
        <StatCard title="Available Copies" value={stats.total_available_copies || 0} color="green" />
        <StatCard title="Currently Issued" value={stats.total_currently_issued || 0} color="purple" />
        <StatCard title="Overdue" value={stats.total_overdue || 0} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issues */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[28px] p-6">
          <h2 className="text-lg font-bold mb-4">Recent Issues</h2>
          {recentIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2">Book</th>
                    <th className="py-2">Borrower</th>
                    <th className="py-2">Due Date</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.map(issue => (
                    <tr key={issue.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium">{issue.book_title}</td>
                      <td className="py-3">{issue.borrower_name}</td>
                      <td className="py-3 text-red-500">{formatDate(issue.due_date)}</td>
                      <td className="py-3">
                         <Badge variant={issue.status === 'overdue' ? 'danger' : 'primary'} size="sm">
                            {issue.status.toUpperCase()}
                         </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No recent issues" description="Issued books will appear here." />
          )}
        </div>

        {/* Top Books */}
        <div className="bg-surface border border-border rounded-[28px] p-6">
          <h2 className="text-lg font-bold mb-4">Top Borrowed Books</h2>
          {topBooks.length > 0 ? (
            <div className="space-y-4">
              {topBooks.map((book, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{book.title}</p>
                    <p className="text-xs text-text-muted truncate">{book.author}</p>
                  </div>
                  <div className="text-xs font-bold bg-surface-raised px-2 py-1 rounded">
                    {book.borrow_count} times
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No data" description="Start issuing books to see trends." />
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboardPage;
