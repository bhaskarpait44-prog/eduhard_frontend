import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import libraryApi from '../../api/libraryApi';
import { getStudents } from "../../api/studentsApi";
import { getUsers } from '../../api/userManagementApi';
import useToast from '../../hooks/useToast';

const IssueBookModal = ({ isOpen, onClose, onSubmit, preSelectedBook = null, loading }) => {
  const { toast } = useToast();
  const [borrowerType, setBorrowerType] = useState('student');
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [borrowers, setBorrowers] = useState([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(preSelectedBook?.id || '');
  
  const [dueDate, setDueDate] = useState('');
  const [searchingBorrowers, setSearchingBorrowers] = useState(false);
  const [searchingBooks, setSearchingBooks] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await libraryApi.getSettings();
      const defaultDays = data.max_issue_days || 14;
      const d = new Date();
      d.setDate(d.getDate() + defaultDays);
      setDueDate(d.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to fetch library settings', err);
      // Fallback
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setDueDate(d.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      if (preSelectedBook) {
        setSelectedBookId(preSelectedBook.id);
        setBookSearch(preSelectedBook.title);
      } else {
        setSelectedBookId('');
        setBookSearch('');
      }
      setSelectedBorrowerId('');
      setBorrowerSearch('');
      setBorrowers([]);
    }
  }, [isOpen, preSelectedBook]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (borrowerSearch.length >= 3) {
        searchBorrowers();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [borrowerSearch, borrowerType]);

  const searchBorrowers = async () => {
    setSearchingBorrowers(true);
    try {
      if (borrowerType === 'student') {
        const { data } = await getStudents({ search: borrowerSearch, limit: 10 });
        setBorrowers(data.students.map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          identifier: s.admission_no
        })));
      } else {
        const { data } = await getUsers({ search: borrowerSearch, limit: 10 });
        setBorrowers(data.users.map(u => ({
          id: u.id,
          name: u.name,
          identifier: u.email
        })));
      }
    } catch (err) {
      toast.error('Failed to search borrowers');
    } finally {
      setSearchingBorrowers(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (bookSearch.length >= 3 && !preSelectedBook) {
        searchBooks();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [bookSearch]);

  const searchBooks = async () => {
    setSearchingBooks(true);
    try {
      const { data } = await libraryApi.getBooks({ search: bookSearch, availability: 'available', limit: 10 });
      setBooks(data.books);
    } catch (err) {
      toast.error('Failed to search books');
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleIssue = (e) => {
    e.preventDefault();
    if (!selectedBookId) return toast.error('Please select a book');
    if (!selectedBorrowerId) return toast.error('Please select a borrower');
    if (!dueDate) return toast.error('Please select a due date');

    onSubmit({
      book_id: selectedBookId,
      borrower_type: borrowerType,
      borrower_id: selectedBorrowerId,
      due_date: dueDate
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Book"
      size="md"
    >
      <form onSubmit={handleIssue} className="space-y-4">
        {/* Book Selection */}
        {!preSelectedBook ? (
          <div className="space-y-1">
            <Input
              label="Search Book"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
            />
            {searchingBooks && <p className="text-xs text-muted">Searching...</p>}
            {books.length > 0 && !selectedBookId && (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-surface-raised">
                {books.map(b => (
                  <div 
                    key={b.id} 
                    className="p-2 hover:bg-surface border-b border-border last:border-0 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedBookId(b.id);
                      setBookSearch(b.title);
                      setBooks([]);
                    }}
                  >
                    <p className="font-medium">{b.title}</p>
                    <p className="text-xs text-muted">{b.author} | {b.available_copies} available</p>
                  </div>
                ))}
              </div>
            )}
            {selectedBookId && !preSelectedBook && (
               <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-border">
                  <span className="text-sm font-medium">{bookSearch}</span>
                  <button type="button" className="text-xs text-red-500" onClick={() => {setSelectedBookId(''); setBookSearch('');}}>Change</button>
               </div>
            )}
          </div>
        ) : (
          <div className="bg-surface p-3 rounded-lg border border-border">
            <p className="text-xs text-muted mb-1">Book to issue</p>
            <p className="font-medium">{preSelectedBook.title}</p>
            <p className="text-xs">{preSelectedBook.author}</p>
          </div>
        )}

        <hr className="border-border" />

        {/* Borrower Selection */}
        <div className="space-y-4">
          <Select
            label="Borrower Type"
            options={[
              { label: 'Student', value: 'student' },
              { label: 'Staff', value: 'staff' },
            ]}
            value={borrowerType}
            onChange={(val) => {
              setBorrowerType(val);
              setSelectedBorrowerId('');
              setBorrowerSearch('');
              setBorrowers([]);
            }}
          />

          <div className="space-y-1">
            <Input
              label={`Search ${borrowerType === 'student' ? 'Student' : 'Staff'}`}
              value={borrowerSearch}
              onChange={(e) => setBorrowerSearch(e.target.value)}
              placeholder={`Search by name or ${borrowerType === 'student' ? 'Admission No' : 'Email'}...`}
            />
            {searchingBorrowers && <p className="text-xs text-muted">Searching...</p>}
            {borrowers.length > 0 && !selectedBorrowerId && (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto bg-surface-raised">
                {borrowers.map(b => (
                  <div 
                    key={b.id} 
                    className="p-2 hover:bg-surface border-b border-border last:border-0 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedBorrowerId(b.id);
                      setBorrowerSearch(b.name);
                      setBorrowers([]);
                    }}
                  >
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-muted">{b.identifier}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedBorrowerId && (
               <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-border">
                  <span className="text-sm font-medium">{borrowerSearch}</span>
                  <button type="button" className="text-xs text-red-500" onClick={() => {setSelectedBorrowerId(''); setBorrowerSearch('');}}>Change</button>
               </div>
            )}
          </div>
        </div>

        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} disabled={!selectedBookId || !selectedBorrowerId}>
            Issue Book
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IssueBookModal;
