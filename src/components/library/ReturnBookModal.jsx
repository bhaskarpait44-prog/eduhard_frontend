import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import libraryApi from '../../api/libraryApi';

const ReturnBookModal = ({ open, onClose, onSubmit, issue, loading }) => {
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [fineStatus, setFineStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');
  const [settings, setSettings] = useState(null);

  const [prevOpen, setPrevOpen] = useState(false);
  const [prevIssueId, setPrevIssueId] = useState(null);

  const issueId = issue ? issue.id : null;

  if (open && (!prevOpen || issueId !== prevIssueId)) {
    setPrevOpen(true);
    setPrevIssueId(issueId);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setFineStatus('pending');
    setRemarks('');
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  useEffect(() => {
    let active = true;
    if (open) {
      libraryApi.getSettings().then(({ data }) => {
        if (active) {
          setSettings(data);
        }
      }).catch((err) => {
        console.error('Failed to fetch library settings', err);
      });
    }
    return () => {
      active = false;
    };
  }, [open]);

  let fineAmount = 0;
  if (issue && settings) {
    const dueDate = new Date(issue.due_date);
    const retDate = new Date(returnDate);
    if (retDate > dueDate) {
      const diffTime = Math.abs(retDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * settings.fine_per_day;
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      return_date: returnDate,
      fine_status: fineAmount > 0 ? fineStatus : 'none',
      fine_remarks: remarks
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Return Book"
      size="md"
    >
      {!issue ? (
        <div className="py-8 text-center text-text-muted">Loading issue details...</div>
      ) : (
        <>
          <div className="bg-surface p-3 rounded-lg border border-border mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted">Book</p>
                <p className="font-medium">{issue.book_title || issue.book?.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Borrower</p>
                <p className="font-medium">{issue.borrower_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Issue Date</p>
                <p className="font-medium">{issue.issue_date}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Due Date</p>
                <p className="font-medium text-red-500">{issue.due_date}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Return Date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />

            {fineAmount > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 font-bold mb-2">Overdue Fine: ₹{fineAmount}</p>
                <Select
                  label="Fine Status"
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Waived', value: 'waived' },
                  ]}
                  value={fineStatus}
                  onChange={(e) => setFineStatus(e.target.value)}
                />
              </div>
            )}

            <Textarea
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes about the return..."
              rows={2}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading}>
                Confirm Return
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
};

export default ReturnBookModal;
