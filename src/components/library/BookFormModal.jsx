import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import useToast from '../../hooks/useToast';
import libraryApi from '../../api/libraryApi';

const CATEGORIES = [
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

const BookFormModal = ({ open, onClose, onSubmit, book, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    category: 'other',
    total_copies: 1,
    shelf_location: '',
    publication_year: new Date().getFullYear(),
    description: '',
    cover_image_url: '',
    digital_url: '',
  });

  const { toastSuccess, toastWarning, toastError } = useToast();
  const [lookupLoading, setLookupLoading] = useState(false);

  const lookupISBN = async (targetIsbn) => {
    if (!targetIsbn) {
      toastWarning('Please enter an ISBN first.');
      return;
    }
    const cleanIsbn = targetIsbn.replace(/[- ]/g, '').trim();
    if (!cleanIsbn) return;

    setLookupLoading(true);
    try {
      const { data } = await libraryApi.lookupISBN(cleanIsbn);
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          isbn: cleanIsbn,
          title: data.title || prev.title,
          author: data.author || prev.author,
          publisher: data.publisher || prev.publisher,
          publication_year: data.publication_year || prev.publication_year,
          cover_image_url: data.cover_image_url || prev.cover_image_url,
          description: data.description || prev.description
        }));
        const sourceLabel = data.source === 'open_library' ? 'Open Library' : 'Google Books';
        toastSuccess(`Book details autofilled from ${sourceLabel}!`);
      }
    } catch (err) {
      console.error('ISBN lookup failed', err);
      const errMsg = err.response?.data?.message || 'No book metadata found for this ISBN. You can still enter details manually.';
      toastWarning(errMsg);
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        publisher: book.publisher || '',
        isbn: book.isbn || '',
        category: book.category || 'other',
        total_copies: book.total_copies || 0,
        shelf_location: book.shelf_location || '',
        publication_year: book.publication_year || new Date().getFullYear(),
        description: book.description || '',
        cover_image_url: book.cover_image_url || '',
        digital_url: book.digital_url || '',
      });
    } else {
      setFormData({
        title: '',
        author: '',
        publisher: '',
        isbn: '',
        category: 'other',
        total_copies: 1,
        shelf_location: '',
        publication_year: new Date().getFullYear(),
        description: '',
        cover_image_url: '',
        digital_url: '',
      });
    }
  }, [book, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={book ? 'Edit Book' : 'Add New Book'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover Preview */}
          <div className="w-full md:w-40 shrink-0">
             <div className="aspect-[3/4] w-full rounded-2xl bg-surface-raised border-2 border-dashed border-border flex items-center justify-center overflow-hidden mb-2">
                {formData.cover_image_url ? (
                  <img src={formData.cover_image_url} alt="Cover Preview" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/300x400?text=No+Cover' }} />
                ) : (
                  <span className="text-text-muted text-[10px] uppercase font-bold text-center px-4 tracking-widest">No Cover Image</span>
                )}
             </div>
             <p className="text-[10px] text-text-muted text-center font-medium leading-tight">Image will update when you paste a valid URL below.</p>
          </div>

          {/* Form Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Book Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. The Great Gatsby"
            />
            <Input
              label="Author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              placeholder="e.g. F. Scott Fitzgerald"
            />
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                ISBN (Scan or Type to Autofill)
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        lookupISBN(formData.isbn);
                      }
                    }}
                    placeholder="Scan barcode or enter ISBN..."
                    containerClassName="w-full"
                    autoFocus={!book}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-[42px] font-bold text-xs shrink-0"
                  onClick={() => lookupISBN(formData.isbn)}
                  loading={lookupLoading}
                >
                  Autofill
                </Button>
              </div>
            </div>
            <Select
              label="Category"
              options={CATEGORIES}
              value={formData.category}
              onChange={(e) => handleSelectChange('category', e.target.value)}
              required
            />
            <Input
              label="Total Copies"
              name="total_copies"
              type="number"
              value={formData.total_copies}
              onChange={handleChange}
              required
              min="0"
            />
            <Input
              label="Shelf Location"
              name="shelf_location"
              value={formData.shelf_location}
              onChange={handleChange}
              placeholder="e.g. A-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Input
            label="Cover Image URL"
            name="cover_image_url"
            value={formData.cover_image_url}
            onChange={handleChange}
            placeholder="https://example.com/cover.jpg"
            hint="Direct link to a JPEG/PNG image."
          />
          <Input
            label="Digital Copy (URL)"
            name="digital_url"
            value={formData.digital_url}
            onChange={handleChange}
            placeholder="https://example.com/ebook.pdf"
            hint="Link for students to read online."
          />
           <Input
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            placeholder="e.g. Charles Scribner's Sons"
          />
          <Input
            label="Publication Year"
            name="publication_year"
            type="number"
            value={formData.publication_year}
            onChange={handleChange}
            placeholder="e.g. 1925"
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Brief summary of the book..."
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {book ? 'Update Book' : 'Add Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookFormModal;
