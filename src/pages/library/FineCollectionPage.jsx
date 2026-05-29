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
import StatCard from '../../components/ui/StatCard';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';

const FineCollectionPage = () => {
  usePageTitle('Fine Collection');
  const { toastSuccess, toastError } = useToast();

  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState({ total_collected: 0, total_waived: 0, total_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fineStatus, setFineStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [actionStatus, setActionStatus] = useState('paid');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFines();
    fetchSummary();
  }, [page, fineStatus]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getFines({
        page,
        fine_status: fineStatus,
        search,
        limit: 10
      });
      setFines(data.fines);
      setTotalPages(data.totalPages);
    } catch (err) {
      toastError('Failed to fetch fines');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await libraryApi.getFineSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFines();
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await libraryApi.updateFineStatus(selectedFine.id, {
        fine_status: actionStatus,
        fine_remarks: remarks
      });
      toastSuccess(`Fine marked as ${actionStatus}`);
      setIsActionModalOpen(false);
      fetchFines();
      fetchSummary();
    } catch (err) {
      toastError('Failed to update fine status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fine Collection</h1>
          <p className="text-text-muted">Manage library penalty payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Collected" value={`₹${summary.total_collected || 0}`} color="green" />
        <StatCard title="Total Pending" value={`₹${summary.total_pending || 0}`} color="orange" />
        <StatCard title="Total Waived" value={`₹${summary.total_waived || 0}`} color="blue" />
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by book or borrower..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            options={[
              { label: 'All', value: '' },
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Waived', value: 'waived' },
            ]}
            value={fineStatus}
            onChange={(e) => { setFineStatus(e.target.value); setPage(1); }}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : fines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Borrower</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Book Title</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Due Date</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Fine Amount</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((fine) => (
                  <tr key={fine.id} className="border-b border-border hover:bg-surface-raised transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{fine.borrower_name}</span>
                        <span className="text-xs text-text-muted uppercase">{fine.borrower_type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-sm">{fine.book_title}</td>
                    <td className="py-4 px-2 text-sm text-red-500">{formatDate(fine.due_date)}</td>
                    <td className="py-4 px-2 text-sm font-bold">₹{fine.fine_amount}</td>
                    <td className="py-4 px-2">
                      {fine.fine_status === 'pending' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setSelectedFine(fine); 
                            setActionStatus('paid'); 
                            setRemarks(''); 
                            setIsActionModalOpen(true); 
                          }}
                        >
                          Collect / Waive
                        </Button>
                      ) : (
                        <Badge variant={fine.fine_status === 'paid' ? 'success' : 'ghost'}>
                          {fine.fine_status.toUpperCase()}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No fines found"
            description="There are no fine records matching your criteria."
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

      <Modal
        open={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Fine Action"
        size="sm"
      >
        <form onSubmit={handleAction} className="space-y-4">
          <div className="p-3 bg-surface border border-border rounded-lg mb-4">
            <p className="text-xs text-muted mb-1">Fine Amount</p>
            <p className="text-xl font-bold">₹{selectedFine?.fine_amount}</p>
            <p className="text-sm text-muted mt-2">{selectedFine?.borrower_name} - {selectedFine?.book_title}</p>
          </div>

          <Select
            label="Action"
            options={[
              { label: 'Mark as Paid', value: 'paid' },
              { label: 'Mark as Waived', value: 'waived' },
            ]}
            value={actionStatus}
            onChange={(e) => setActionStatus(e.target.value)}
          />

          <Textarea
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any internal notes..."
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsActionModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={actionLoading}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FineCollectionPage;
