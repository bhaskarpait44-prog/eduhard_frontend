import { useState } from 'react'
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const DOCUMENT_TYPES = [
  { id: 'photo', label: 'Passport Photo', required: true },
  { id: 'birth_certificate', label: 'Birth Certificate', required: true },
  { id: 'transfer_certificate', label: 'Transfer Certificate', required: false },
  { id: 'marksheet', label: 'HSLC Mark Sheet', required: false },
  { id: 'admit_card', label: 'HSLC Admit Card', required: false },
  { id: 'pass_certificate', label: 'HSLC Pass Certificate', required: false },
  { id: 'registration_certificate', label: 'HSLC Registration Certificate', required: false },
  { id: 'character_certificate', label: 'Character Certificate', required: false },
  { id: 'prc', label: 'PRC', required: false },
  { id: 'caste_certificate', label: 'Caste Certificate', required: false },
  { id: 'blood_group_doc', label: 'Blood Group Proof', required: false },
  { id: 'aadhar_student', label: 'Student Aadhar Card', required: false },
  { id: 'aadhar_father', label: 'Father Aadhar Card', required: false },
  { id: 'aadhar_mother', label: "Mother's Aadhar Card", required: false },
]

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const StepDocuments = ({ defaultValues, onNext, onBack }) => {
  const [files, setFiles] = useState(defaultValues.files || {})
  const [errors, setErrors] = useState({})

  const handleFileChange = (id, e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = id === 'photo' ? ['image/jpeg', 'image/png', 'image/webp'] : ALLOWED_MIME_TYPES
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [id]: id === 'photo' ? 'Only JPG, PNG or WEBP images are allowed' : 'Only JPG, PNG, WEBP or PDF files are allowed' }))
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [id]: 'File size exceeds 5MB' }))
      e.target.value = ''
      return
    }

    setFiles(prev => ({ ...prev, [id]: file }))
    setErrors(prev => ({ ...prev, [id]: null }))
  }

  const removeFile = (id) => {
    setFiles(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const handleNext = (isSkipping = false) => {
    const missingRequired = DOCUMENT_TYPES.filter(doc => doc.required && !files[doc.id])

    if (!isSkipping && missingRequired.length > 0) {
      const newErrors = {}
      missingRequired.forEach(doc => {
        newErrors[doc.id] = 'This document is required'
      })
      setErrors(newErrors)
      return
    }

    if (isSkipping && missingRequired.length > 0) {
      if (!window.confirm(`You haven't uploaded ${missingRequired.length} required documents. Are you sure you want to skip this step? You can upload them later from the student profile.`)) {
        return
      }
    }

    onNext({ files })
  }

  const missingAnyRequired = DOCUMENT_TYPES.some(doc => doc.required && !files[doc.id])

  return (
    <div className="space-y-6">
      <div
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/5"
      >
        <div className="flex items-center justify-between gap-4">
          <SectionHeading 
            title="Digital Documents" 
            subtitle="Upload clear scans in JPG, PNG or PDF (Max 5MB each)" 
          />
          {missingAnyRequired && (
             <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-2">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-tight">Optional to skip</span>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCUMENT_TYPES.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                {doc.label} {doc.required && <span className="text-red-500">*</span>}
              </label>
              
              <div className={`relative group border-2 border-dashed rounded-xl p-3 transition-all ${
                errors[doc.id] ? 'border-red-300 bg-red-50/50' : 
                files[doc.id] ? 'border-green-300 bg-green-50/50' : 
                'border-border hover:border-brand-soft hover:bg-surface-raised'
              }`}>
                {files[doc.id] ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {files[doc.id].name}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {(files[doc.id].size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-text-muted hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-2 cursor-pointer">
                    <Upload size={20} className="text-text-muted mb-1" />
                    <span className="text-xs text-text-muted font-medium">Select File</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept={doc.id === 'photo' ? "image/jpeg,image/png,image/webp" : "image/*,application/pdf"}
                      onChange={(e) => handleFileChange(doc.id, e)} 
                    />
                  </label>
                )}
              </div>
              {errors[doc.id] && (
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors[doc.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <div className="flex gap-3">
           {missingAnyRequired && (
             <Button variant="ghost" onClick={() => handleNext(true)}>Skip for now</Button>
           )}
           <Button onClick={() => handleNext(false)} className="shadow-lg shadow-indigo-500/20">
             {missingAnyRequired ? 'Upload & Continue →' : 'Continue to Access →'}
           </Button>
        </div>
      </div>
    </div>
  )
}

export default StepDocuments
