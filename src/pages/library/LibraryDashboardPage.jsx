import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Book, Bookmark, Clock, AlertCircle, TrendingUp, PieChart as PieIcon, ExternalLink } from 'lucide-react';
import libraryApi from '../../api/libraryApi';
import useToast from '../../hooks/useToast';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/helpers';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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

  const { stats, recentIssues, topBooks, categoryStats, monthlyTrends } = data;

  const pieData = categoryStats.map((item, index) => ({
    name: item.category.replace('_', ' ').toUpperCase(),
    value: item.count
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Library Analytics</h1>
          <p className="text-text-muted text-sm font-medium">Real-time performance and collection insights</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => window.open('/library/books', '_self')}>Go to Catalog</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collection" value={stats.total_books || 0} icon={Book} color="indigo" />
        <StatCard title="On Shelves" value={stats.total_available_copies || 0} icon={Bookmark} color="emerald" />
        <StatCard title="In Circulation" value={stats.total_currently_issued || 0} icon={Clock} color="amber" />
        <StatCard title="Overdue Penalty" value={stats.total_overdue || 0} icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
               <TrendingUp size={16} className="text-indigo-500" /> Issue Trends (6 Months)
            </h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '12px'}}
                   cursor={{fill: 'var(--color-surface-raised)'}}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-surface border border-border rounded-[32px] p-6 shadow-sm">
           <h2 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
             <PieIcon size={16} className="text-emerald-500" /> Genre Mix
           </h2>
           <div className="h-[280px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700, fontSize: '12px'}}
                 />
                 <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 700, paddingTop: '20px'}} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issues */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[32px] p-6 shadow-sm overflow-hidden">
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted mb-4">Live Issue Log</h2>
          {recentIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Book</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Borrower</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Due Date</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentIssues.map(issue => (
                    <tr key={issue.id} className="group hover:bg-surface-raised transition-colors">
                      <td className="py-3 px-2">
                         <p className="text-sm font-bold text-text-primary truncate max-w-[200px]">{issue.book_title}</p>
                      </td>
                      <td className="py-3 px-2 text-sm font-medium text-text-secondary">{issue.borrower_name}</td>
                      <td className="py-3 px-2 text-xs font-bold text-rose-500">{formatDate(issue.due_date)}</td>
                      <td className="py-3 px-2 text-right">
                         <Badge variant={issue.status === 'overdue' ? 'danger' : 'primary'} size="sm" className="font-black uppercase text-[9px] tracking-widest">
                            {issue.status}
                         </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Quiet day in the library" description="No books have been issued recently." />
          )}
        </div>

        {/* Top Books */}
        <div className="bg-surface border border-border rounded-[32px] p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted mb-6">Popular Picks</h2>
          {topBooks.length > 0 ? (
            <div className="space-y-5">
              {topBooks.map((book, index) => (
                <div key={index} className="flex items-center gap-4 group cursor-default">
                  <div className="w-10 h-14 rounded-lg bg-surface-raised border border-border overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                     {book.cover_image_url ? (
                       <img src={book.cover_image_url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/40x56?text=Cover'} />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-text-muted opacity-30"><Book size={14} /></div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-text-primary truncate">{book.title}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider truncate">{book.author}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <div className="h-1 flex-1 bg-surface-raised rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{width: `${(book.borrow_count / topBooks[0].borrow_count) * 100}%`}} />
                       </div>
                       <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter shrink-0">{book.borrow_count} Issues</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No data yet" description="The leaderboard will fill up as books are issued." />
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryDashboardPage;
