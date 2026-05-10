import React, { useState, useEffect } from 'react';
import libraryApi from '../../api/libraryApi';
import useToast from '../../hooks/useToast';
import usePageTitle from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeleton from '../../components/ui/TableSkeleton';
import BookFormModal from '../../components/library/BookFormModal';
import IssueBookModal from '../../components/library/IssueBookModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ProgressBar from '../../components/ui/ProgressBar';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Fiction', value: 'fiction' },
  { label: 'Non-Fiction', value: 'non_fiction' },
  { label: 'Science', value: 'science' },
  { label: 'Mathematics', value: 'mathematics' },
  { label: 'History', value: 'history' },
  { label: 'Geography', value: 'geography' },
  { label: 'Literature', value: 'literature' },
  { label: 'Reference', value: 'reference' },
  { label: 'Magazine', value: 'magazine' },
  { label: 'Other', value: 'other' },
];

const BookCatalogPage = () => {
  usePageTitle('Book Catalog');
  const { toast } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [bookToIssue, setBookToIssue] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [page, category, availability]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getBooks({
        page,
        search,
        category,
        availability,
        limit: 10
      });
      setBooks(data.books);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleCreateOrUpdate = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedBook) {
        await libraryApi.updateBook(selectedBook.id, formData);
        toast.success('Book updated successfully');
      } else {
        await libraryApi.createBook(formData);
        toast.success('Book added to catalog');
      }
      setIsFormModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleIssue = async (issueData) => {
    setIssueLoading(true);
    try {
      await libraryApi.issueBook(issueData);
      toast.success('Book issued successfully');
      setIsIssueModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await libraryApi.deleteBook(bookToDelete.id);
      toast.success('Book deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error('Failed to delete book');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Book Catalog</h1>
          <p className="text-text-muted">Manage your school library collection</p>
        </div>
        <Button variant="primary" onClick={() => { setSelectedBook(null); setIsFormModalOpen(true); }}>
          Add New Book
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search by title, author, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={CATEGORIES}
            value={category}
            onChange={setCategory}
          />
          <Select
            options={[
              { label: 'All Availability', value: '' },
              { label: 'In Stock', value: 'available' },
              { label: 'Out of Stock', value: 'out_of_stock' },
            ]}
            value={availability}
            onChange={setAvailability}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : books.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Book Details</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Category</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Location</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Availability</th>
                  <th className="py-4 px-2 text-sm font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id} className="border-b border-border hover:bg-surface-raised transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">{book.title}</span>
                        <span className="text-xs text-text-muted">{book.author} | ISBN: {book.isbn || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="ghost" className="capitalize">{book.category.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-4 px-2 text-sm">
                      {book.shelf_location || 'Not set'}
                    </td>
                    <td className="py-4 px-2 min-w-[150px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-text-muted">
                          <span>{book.available_copies} of {book.total_copies} available</span>
                        </div>
                        <ProgressBar 
                          value={book.available_copies} 
                          max={book.total_copies} 
                          color={book.available_copies === 0 ? 'red' : book.available_copies < 3 ? 'orange' : 'green'}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary-600"
                          onClick={() => { setBookToIssue(book); setIsIssueModalOpen(true); }}
                          disabled={book.available_copies === 0}
                        >
                          Issue
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedBook(book); setIsFormModalOpen(true); }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => { setBookToDelete(book); setIsDeleteDialogOpen(true); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No books found"
            description="Add books to your library catalog to get started."
            action={<Button variant="primary" onClick={() => { setSelectedBook(null); setIsFormModalOpen(true); }}>Add New Book</Button>}
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

      <BookFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        book={selectedBook}
        loading={formLoading}
      />

      <IssueBookModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={handleIssue}
        preSelectedBook={bookToIssue}
        loading={issueLoading}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Book"
        message={`Are you sure you want to delete "${bookToDelete?.title}"? This will hide it from the catalog but won't affect past issue records.`}
        loading={deleteLoading}
        type="danger"
      />
    </div>
  );
};

export default BookCatalogPage;
