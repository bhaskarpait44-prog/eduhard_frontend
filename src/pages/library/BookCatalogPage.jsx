import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, User, Hash, MapPin, Globe, ExternalLink, Trash2, Pencil, Search, Filter, Plus, FileSpreadsheet } from 'lucide-react';
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
  const { toastSuccess, toastError } = useToast();

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
  const [reserveLoading, setReserveLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, category, availability]);

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
      toastError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleCreateOrUpdate = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedBook) {
        await libraryApi.updateBook(selectedBook.id, formData);
        toastSuccess('Book updated successfully');
      } else {
        await libraryApi.createBook(formData);
        toastSuccess('Book added to catalog');
      }
      setIsFormModalOpen(false);
      fetchBooks();
    } catch (err) {
      toastError(err.response?.data?.message || 'Action failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleIssue = async (issueData) => {
    setIssueLoading(true);
    try {
      await libraryApi.issueBook(issueData);
      toastSuccess('Book issued successfully');
      setIsIssueModalOpen(false);
      fetchBooks();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await libraryApi.deleteBook(bookToDelete.id);
      toastSuccess('Book deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchBooks();
    } catch (err) {
      toastError('Failed to delete book');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReserve = async (bookId) => {
    setReserveLoading(true);
    try {
      await libraryApi.createReservation({ book_id: bookId });
      toastSuccess('Book reserved successfully');
      fetchBooks();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Book Catalog</h1>
          <p className="text-text-muted">Manage your school library collection</p>
        </div>
        <div className="flex gap-2">
          <Link to="/library/books/import">
            <Button variant="secondary" icon={FileSpreadsheet}>Bulk Import</Button>
          </Link>
          <Button variant="primary" icon={Plus} onClick={() => { setSelectedBook(null); setIsFormModalOpen(true); }}>
            Add New Book
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[28px] p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search by title, author, ISBN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={Search}
          />
          <Select
            options={CATEGORIES}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          />
          <Select
            options={[
              { label: 'All Availability', value: '' },
              { label: 'In Stock', value: 'available' },
              { label: 'Out of Stock', value: 'out_of_stock' },
            ]}
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : books.length > 0 ? (
          <div className="space-y-4">
            {/* Mobile: Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {books.map((book) => (
                <div key={book.id} className="bg-surface-raised border border-border rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 rounded-lg bg-surface border border-border overflow-hidden shrink-0 shadow-sm">
                      {book.cover_image_url ? (
                        <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x140?text=No+Cover'} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                           <Book size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="ghost" className="capitalize text-[10px] py-0">{book.category.replace('_', ' ')}</Badge>
                        {book.digital_url && (
                          <a href={book.digital_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700">
                             <Globe size={14} />
                          </a>
                        )}
                      </div>
                      <h3 className="font-bold text-text-primary truncate">{book.title}</h3>
                      <p className="text-xs text-text-muted truncate">{book.author}</p>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-bold">ISBN: {book.isbn || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs py-2 border-y border-border/50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-text-muted uppercase tracking-wider font-bold text-[9px]">Shelf</span>
                      <span className="text-text-primary font-bold">{book.shelf_location || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-text-muted uppercase tracking-wider font-bold text-[9px] block mb-0.5">Stock</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-text-primary">{book.available_copies} / {book.total_copies}</span>
                        <div className="w-12 h-1.5 rounded-full bg-surface border border-border/50 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${(book.available_copies / book.total_copies) * 100}%`,
                              backgroundColor: book.available_copies === 0 ? '#ef4444' : book.available_copies < 3 ? '#f59e0b' : '#22c55e'
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {book.available_copies > 0 ? (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => { setBookToIssue(book); setIsIssueModalOpen(true); }}
                      >
                        Issue
                      </Button>
                    ) : (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 text-orange-600"
                        onClick={() => handleReserve(book.id)}
                        loading={reserveLoading}
                      >
                        Reserve
                      </Button>
                    )}
                    {book.digital_url && (
                      <a href={book.digital_url} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full" icon={ExternalLink}>Read</Button>
                      </a>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="px-2.5"
                      onClick={() => { setSelectedBook(book); setIsFormModalOpen(true); }}
                      icon={Pencil}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 px-2.5 hover:bg-red-50"
                      onClick={() => { setBookToDelete(book); setIsDeleteDialogOpen(true); }}
                      icon={Trash2}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 px-2 text-sm font-black uppercase tracking-widest text-text-muted">Book Catalog</th>
                    <th className="py-4 px-2 text-sm font-black uppercase tracking-widest text-text-muted text-center">Category</th>
                    <th className="py-4 px-2 text-sm font-black uppercase tracking-widest text-text-muted text-center">Location</th>
                    <th className="py-4 px-2 text-sm font-black uppercase tracking-widest text-text-muted">Availability Status</th>
                    <th className="py-4 px-2 text-sm font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-b border-border hover:bg-surface-raised transition-colors group">
                      <td className="py-4 px-2 min-w-[300px]">
                        <div className="flex gap-4">
                          <div className="w-12 h-16 rounded-md bg-surface border border-border overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                             {book.cover_image_url ? (
                               <img src={book.cover_image_url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/60x80?text=Cover'} />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-text-muted opacity-40"><Book size={18} /></div>
                             )}
                          </div>
                          <div className="flex flex-col justify-center min-w-0">
                            <span className="font-bold text-text-primary truncate">{book.title}</span>
                            <span className="text-xs text-text-muted truncate flex items-center gap-1.5">
                               <User size={10} className="shrink-0" /> {book.author}
                               <span className="opacity-30">|</span>
                               <Hash size={10} className="shrink-0" /> {book.isbn || 'No ISBN'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <Badge variant="ghost" className="capitalize text-[10px]">{book.category.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-4 px-2 text-sm text-center font-bold text-text-secondary">
                        <div className="flex items-center justify-center gap-1.5">
                           <MapPin size={12} className="text-text-muted" />
                           {book.shelf_location || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-2 min-w-[180px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-muted">
                            <span>{book.available_copies} Left</span>
                            <span>{Math.round((book.available_copies / (book.total_copies || 1)) * 100)}%</span>
                          </div>
                          <ProgressBar 
                            value={book.available_copies} 
                            max={book.total_copies} 
                            color={book.available_copies === 0 ? 'red' : book.available_copies < 3 ? 'orange' : 'green'}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {book.digital_url && (
                             <a href={book.digital_url} target="_blank" rel="noreferrer">
                               <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" icon={Globe} title="Read Digital Copy" />
                             </a>
                          )}
                          {book.available_copies > 0 ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary-600 font-black uppercase tracking-widest text-[10px]"
                              onClick={() => { setBookToIssue(book); setIsIssueModalOpen(true); }}
                            >
                              Issue
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-orange-600 font-black uppercase tracking-widest text-[10px]"
                              onClick={() => handleReserve(book.id)}
                              loading={reserveLoading}
                            >
                              Reserve
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setSelectedBook(book); setIsFormModalOpen(true); }}
                            icon={Pencil}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => { setBookToDelete(book); setIsDeleteDialogOpen(true); }}
                            icon={Trash2}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        book={selectedBook}
        loading={formLoading}
      />

      <IssueBookModal
        open={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={handleIssue}
        preSelectedBook={bookToIssue}
        loading={issueLoading}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
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
