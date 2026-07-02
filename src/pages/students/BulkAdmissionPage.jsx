import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, Download, Loader2, ArrowRight,
} from 'lucide-react'
import Papa from 'papaparse'
import * as api from '@/api/studentsApi'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const STEPS = ['Download Template', 'Upload File', 'Review & Validate', 'Processing', 'Summary']

function parseCSV(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().replace(/^"(.*)"$/, '$1').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
  })
  return result.data
}

const BulkAdmissionPage = () => {
  usePageTitle('Bulk Student Admission')

  const navigate = useNavigate()
  const { toastError } = useToast()
  const fileRef = useRef(null)
  const pollRef = useRef(null)
  const pollStartTime = useRef(null)

  const [step, setStep] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState('')
  const [preview, setPreview] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [templateData, setTemplateData] = useState(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)

  useEffect(() => {
    const fetchTemplateInfo = async () => {
      try {
        const res = await api.getAdmissionTemplate()
        if (res.success && res.data) {
          setTemplateData(res.data)
        }
      } catch (err) {
        console.error('Failed to pre-fetch template details', err)
      }
    }
    fetchTemplateInfo()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true)
    try {
      const res = await api.getAdmissionTemplate()
      if (res.success && res.data?.columns) {
        const columns = res.data.columns
        const headerRow = columns.map(c => c.key)
        const exampleRow = columns.map(c => c.example ?? '')

        const csv = Papa.unparse({
          fields: headerRow,
          data: [exampleRow]
        })

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'educore_student_admission_template.csv'
        anchor.click()
        URL.revokeObjectURL(url)
      } else {
        toastError('Failed to fetch the CSV template from the server.')
      }
    } catch (err) {
      toastError(err.message || 'Failed to download template.')
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFile = async (file) => {
    if (!file.name.match(/\.csv$/i)) {
      setParseError('Please upload a CSV file. Excel (.xlsx) support is currently unavailable.')
      return
    }

    setParseError('')
    setIsLoading(true)

    try {
      const text = await file.text()
      if (text.startsWith('PK\x03\x04')) {
        setParseError('This file appears to be an Excel file. Please export it as a CSV and try again.')
        return
      }

      const rows = parseCSV(text)
      if (rows.length === 0) {
        setParseError('No data rows found in file.')
        return
      }

      const result = await api.previewAdmission({ rows })
      setPreview(result.data)
      setStep(2)
    } catch (e) {
      setParseError(e.message || 'Failed to parse file.')
    } finally {
      setIsLoading(false)
    }
  }

  const pollStatus = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollStartTime.current = Date.now()

    pollRef.current = setInterval(async () => {
      try {
        // Check timeout (60 seconds)
        if (Date.now() - pollStartTime.current > 60000) {
          clearInterval(pollRef.current)
          pollRef.current = null
          toastError('Import timeout: The process is taking longer than expected. Please check the import status later.')
          setIsLoading(false)
          setStep(4) // Move to summary anyway to show partial progress if any
          return
        }

        const response = await api.getAdmissionStatus(jobId)
        setJobStatus(response.data)

        if (['completed', 'failed'].includes(response.data?.status)) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setIsLoading(false)
          setStep(4)
        }
      } catch {
        clearInterval(pollRef.current)
        pollRef.current = null
        setIsLoading(false)
        setStep(4)
      }
    }, 1500)
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
      const result = await api.confirmAdmission({ rows: validRows })
      pollStatus(result.data?.job_id)
    } catch (e) {
      toastError(e.message || 'Admission import failed')
      setIsLoading(false)
      setStep(2)
    }
  }

  const validCount = preview?.summary?.valid || 0
  const invalidCount = preview?.summary?.invalid || 0
  const totalCount = preview?.summary?.total || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(ROUTES.STUDENTS)}
          className="flex items-center gap-1.5 text-sm hover:opacity-70 text-gray-500"
        >
          <ArrowLeft size={15} />
          Back to Students
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bulk Student Admission</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-1 flex-1 min-w-[120px]">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${index < step ? 'bg-green-500 text-white' : index === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}
            >
              {index < step ? '✓' : index + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${index === step ? 'text-indigo-600' : 'text-gray-400'}`}>
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${index < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="p-8 rounded-3xl text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileSpreadsheet size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Prepare your student data</h2>
          <p className="text-sm mb-8 text-gray-500 max-w-sm mx-auto">
            Download our standard template to ensure your data format matches our system requirements.
          </p>
          
          <div className="text-left p-6 rounded-2xl mb-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold mb-4 text-gray-800 dark:text-gray-200 uppercase tracking-widest">Required Columns</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {(templateData?.columns || [
                { key: 'first_name', label: 'First Name *' },
                { key: 'last_name', label: 'Last Name *' },
                { key: 'date_of_birth', label: 'DOB (YYYY-MM-DD) *' },
                { key: 'gender', label: 'Gender *' },
                { key: 'admission_class', label: 'Admission Class *' },
                { key: 'section', label: 'Section *' },
                { key: 'admission_date', label: 'Admission Date *' },
                { key: 'father_name', label: 'Father Name *' },
                { key: 'father_phone', label: 'Father Phone *' },
                { key: 'parent_email', label: 'Father Email (Parent Login) *' }
              ])
                .filter(col => col.label.includes('*'))
                .map(col => (
                  <div key={col.key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {col.key}
                  </div>
                ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 space-y-1.5 leading-relaxed text-left">
                {templateData?.notes ? (
                  templateData.notes.map((note, idx) => (
                    <div key={idx}>• {note}</div>
                  ))
                ) : (
                  <>
                    <div>• Fields marked * are required.</div>
                    <div>• Admission No will be auto-generated if left blank (ADM-YEAR-XXXX).</div>
                    <div>• Admission Class and Section names must match exactly with existing records.</div>
                    <div>• Admission Date will be used as the student's joined date.</div>
                    <div>• Father Email (Parent Login) will be used to create the parent login credentials.</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={downloadTemplate}
              disabled={isDownloadingTemplate}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              {isDownloadingTemplate ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isDownloadingTemplate ? 'Downloading...' : 'Download CSV Template'}
            </button>
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              I have my CSV file
              <ArrowRight size={18} />
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
            className={`flex flex-col items-center justify-center p-16 rounded-3xl cursor-pointer transition-all border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400'}`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
            {isLoading ? (
              <>
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Validating Data...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={32} className={isDragging ? 'text-indigo-600' : 'text-gray-400'} />
                </div>
                <p className="text-base font-bold text-gray-700 dark:text-gray-200">Click or drag CSV file here</p>
                <p className="text-xs mt-2 text-gray-400">Only .csv files are supported</p>
              </>
            )}
          </div>
          {parseError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-semibold">{parseError}</p>
            </div>
          )}
          <button onClick={() => setStep(0)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors px-2">
            ← Back to template
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Rows', value: totalCount, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Ready to Admit', value: validCount, color: 'text-green-600' },
              { label: 'Has Errors', value: invalidCount, color: invalidCount > 0 ? 'text-red-600' : 'text-green-600' },
            ].map(card => (
              <div key={card.label} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 z-10">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-4">Row</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Class/Sec</th>
                    <th className="px-6 py-4">DOB</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {preview.results.map((row, index) => (
                    <tr key={index} className={row.is_valid ? 'hover:bg-gray-50 dark:hover:bg-gray-700/30' : 'bg-red-50/30'}>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400">#{row.row_number}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{row.data.first_name} {row.data.last_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{row.data.admission_no || 'Auto-gen'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {row.data.admission_class} · {row.data.section}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{row.data.date_of_birth}</td>
                      <td className="px-6 py-4">
                        {row.is_valid ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                            <CheckCircle2 size={14} /> Ready
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500" title={row.errors?.join(', ')}>
                            <AlertCircle size={14} /> {row.errors?.[0]}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => { setStep(1); setPreview(null) }} 
              className="px-6 py-3 rounded-2xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel and Re-upload
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={validCount === 0} 
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Confirm and Admit {validCount} Student{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-16 rounded-3xl text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <Loader2 size={80} className="animate-spin text-indigo-600 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload size={32} className="text-indigo-600 animate-bounce" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Admitting Students...</h2>
          <p className="text-sm text-gray-500 mb-8">Please stay on this page while we process the records.</p>
          
          {jobStatus && (
            <div className="max-w-xs mx-auto">
              <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden mb-3 p-0.5 border border-gray-200 dark:border-gray-700">
                <div 
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500 shadow-sm shadow-indigo-500/50" 
                  style={{ width: `${jobStatus.total_rows > 0 ? (jobStatus.success_count / jobStatus.total_rows) * 100 : 0}%` }} 
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>{jobStatus.success_count} Success</span>
                <span>{jobStatus.total_rows} Total</span>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="p-10 rounded-3xl text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-gray-100">Admission Process Finished</h2>
          <p className="text-sm text-gray-500 mb-8 font-medium">Bulk admission task has been processed.</p>
          
          {jobStatus && (
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
              <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                <p className="text-4xl font-black text-green-600">{jobStatus.success_count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700/60 mt-2">Admitted</p>
              </div>
              <div className={`p-6 rounded-2xl ${jobStatus.failed_count > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'}`}>
                <p className={`text-4xl font-black ${jobStatus.failed_count > 0 ? 'text-red-600' : 'text-gray-400'}`}>{jobStatus.failed_count}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${jobStatus.failed_count > 0 ? 'text-red-700/60' : 'text-gray-400'}`}>Failed</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => { setStep(0); setPreview(null); setJobStatus(null) }} 
              className="px-8 py-3.5 text-sm font-bold rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Admit More
            </button>
            <button
              onClick={() => navigate(ROUTES.STUDENTS)}
              className="px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              View Students List
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulkAdmissionPage
