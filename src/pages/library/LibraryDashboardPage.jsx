import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import usePageTitle from '../../hooks/usePageTitle';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const LibraryDashboardPage = () => {
  usePageTitle('Library Dashboard');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await libraryApi.getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><TableSkeleton rows={5} cols={4} /></div>;
  if (!data) return <div className="p-8 text-center">Failed to load dashboard.</div>;

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
                      <td className="py-3 text-red-500">{issue.due_date}</td>
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
