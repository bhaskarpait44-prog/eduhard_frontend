import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, Download, Loader2, ArrowRight,
} from 'lucide-react'
import Papa from 'papaparse'
import libraryApi from '@/api/libraryApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'

const STEPS = ['Download Template', 'Upload File', 'Review & Validate', 'Processing', 'Summary']

const BulkImportBooksPage = () => {
  usePageTitle('Bulk Import Books')

  const navigate = useNavigate()
  const { toastError, toastSuccess } = useToast()
  const fileRef = useRef(null)

  const [step, setStep] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState('')
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const downloadTemplate = () => {
    const csv = [
      ['title', 'author', 'publisher', 'isbn', 'category', 'total_copies', 'shelf_location', 'publication_year', 'description'].join(','),
      ['The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', '9780743273565', 'Fiction', '5', 'A-12', '1925', 'A classic novel of the Jazz Age'].join(','),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'educore_book_import_template.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file) => {
    if (!file.name.match(/\.csv$/i)) {
      setParseError('Please upload a CSV file.')
      return
    }

    setParseError('')
    setIsLoading(true)

    try {
      const text = await file.text()
      const { data: rows, errors: parseErrors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h =>
          h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''),
      })
      if (parseErrors.length > 0) {
        setParseError(`CSV parse error: ${parseErrors[0].message}`)
        return
      }
      if (rows.length === 0) {
        setParseError('No data rows found in file.')
        return
      }

      const result = await libraryApi.previewImportBooks({ rows })
      setPreview(result.data)
      setStep(2)
    } catch (e) {
      setParseError(e.response?.data?.message || 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    const validRows = (preview?.results || []).filter(row => row.is_valid).map(row => row.data)
    if (!validRows.length) {
      toastError('No valid rows to import.')
      return
    }

    setIsLoading(true)
    setStep(3)

    try {
      const result = await libraryApi.confirmImportBooks({ rows: validRows })
      setImportResult(result.data)
      toastSuccess(result.data.message || 'Books imported successfully')
      setStep(4)
    } catch (e) {
      toastError(e.response?.data?.message || 'Import failed')
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  const validCount = preview?.summary?.valid || 0
  const invalidCount = preview?.summary?.invalid || 0
  const totalCount = preview?.summary?.total || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm hover:opacity-70 text-text-secondary"
        >
          <ArrowLeft size={15} />
          Back to Books
        </button>
        <h1 className="text-xl font-bold text-text-primary">Bulk Import Books</h1>
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${index < step ? 'bg-green-500 text-white' : index === step ? 'bg-brand text-white' : 'bg-surface-raised text-gray-400'}`}
            >
              {index < step ? 'OK' : index + 1}
            </div>
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: index < step ? '#22c55e' : 'var(--color-border)' }} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="p-8 rounded-2xl text-center bg-surface border border-border">
          <FileSpreadsheet size={40} className="mx-auto mb-4 text-brand" />
          <h2 className="text-lg font-semibold mb-2 text-text-primary">Start with the template</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto text-text-secondary">
            Download the CSV template, fill in your book records, then upload it in the next step.
          </p>
          <div className="text-left p-4 rounded-xl mb-6 text-sm bg-surface-raised">
            <p className="font-semibold mb-2 text-text-primary">Required columns:</p>
            <ul className="space-y-1 text-text-secondary">
              <li><code>title</code> and <code>author</code> are required</li>
              <li><code>isbn</code>, <code>publisher</code>, <code>category</code>, <code>total_copies</code> are recommended</li>
              <li><code>shelf_location</code>, <code>publication_year</code> are optional</li>
              <li>Existing ISBNs in your catalog will be flagged as errors</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border text-text-secondary hover:bg-surface-raised"
            >
              <Download size={15} />
              Download Template
            </button>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-brand hover:opacity-90"
            >
              I have my file
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const droppedFile = e.dataTransfer.files[0]
              if (droppedFile) handleFile(droppedFile)
            }}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center p-12 rounded-2xl cursor-pointer transition-all border-2 border-dashed"
            style={{
              borderColor: isDragging ? 'var(--color-brand)' : 'var(--color-border)',
              backgroundColor: isDragging ? 'var(--color-brand-light)' : 'var(--color-surface)',
            }}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            {isLoading ? (
              <>
                <Loader2 size={32} className="animate-spin mb-3 text-brand" />
                <p className="text-sm text-text-secondary">Validating file...</p>
              </>
            ) : (
              <>
                <Upload size={32} className={`mb-3 ${isDragging ? 'text-brand' : 'text-text-muted'}`} />
                <p className="text-sm font-medium text-text-secondary">Drag and drop your CSV file here</p>
                <p className="text-xs mt-1 text-text-muted">or click to browse.</p>
              </>
            )}
          </div>
          {parseError && (
            <div className="flex items-start gap-3 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-600">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}
          <button onClick={() => setStep(0)} className="text-sm text-text-muted">
            Back
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Rows', value: totalCount, color: 'text-text-primary' },
              { label: 'Valid Rows', value: validCount, color: 'text-green-600' },
              { label: 'Error Rows', value: invalidCount, color: invalidCount > 0 ? 'text-red-600' : 'text-green-600' },
            ].map(card => (
              <div key={card.label} className="p-4 rounded-xl text-center bg-surface border border-border">
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs mt-1 text-text-muted">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden max-h-80 overflow-y-auto border border-border">
            <div className="sticky top-0 grid grid-cols-5 gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-surface-raised border-b border-border text-text-muted">
              <span>Row</span>
              <span>Title</span>
              <span>Author</span>
              <span>ISBN</span>
              <span>Status</span>
            </div>
            {preview.results.map((row, index) => (
              <div
                key={`${row.row_number}-${index}`}
                className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm border-b border-border last:border-0 ${row.is_valid ? '' : 'bg-red-50/50'}`}
              >
                <span className="text-text-muted">#{row.row_number}</span>
                <span className="text-text-primary truncate font-medium">{row.data.title}</span>
                <span className="truncate text-text-secondary">{row.data.author}</span>
                <span className="text-text-secondary">{row.data.isbn || '--'}</span>
                <span>
                  {row.is_valid ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 size={13} />
                      Valid
                    </span>
                  ) : (
                    <span className="text-xs text-red-600" title={row.errors?.join(' | ')}>
                      {row.errors?.[0]}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setPreview(null) }} className="px-4 py-2.5 rounded-xl text-sm border border-border text-text-secondary">
              Re-upload
            </button>
            <button onClick={handleConfirm} disabled={validCount === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand disabled:opacity-50">
              Import {validCount} valid book{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-12 rounded-2xl text-center bg-surface border border-border">
          <Loader2 size={40} className="animate-spin mx-auto mb-4 text-brand" />
          <h2 className="text-lg font-semibold mb-2 text-text-primary">Importing books...</h2>
          <p className="text-sm text-text-secondary">Please don't close this window.</p>
        </div>
      )}

      {step === 4 && importResult && (
        <div className="p-8 rounded-2xl text-center bg-surface border border-border">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-lg font-semibold mb-2 text-text-primary">Import Complete</h2>
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 inline-block mb-8 min-w-[200px]">
            <p className="text-3xl font-bold text-green-600">{importResult.successCount}</p>
            <p className="text-sm mt-1 text-green-700">Books added to catalog</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep(0); setPreview(null); setImportResult(null) }} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border text-text-secondary">
              Import More
            </button>
            <button
              onClick={() => navigate('/library/books')}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-brand"
            >
              View Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulkImportBooksPage
