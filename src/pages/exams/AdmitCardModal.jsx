// src/pages/exams/AdmitCardModal.jsx
import { useEffect, useState, useMemo } from 'react'
import { Download, AlertTriangle, CheckSquare, Square, Search } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getDefaulters } from '@/api/accountantApi'
import { getStudents } from '@/api/studentsApi'
import { getExamSubjects } from '@/api/examsApi'
import useSessionStore from '@/store/sessionStore'
import { formatCurrency } from '@/utils/helpers'
import AdmitCardPDF from '@/components/pdf/AdmitCardPDF'

const AdmitCardModal = ({ exam, open, onClose }) => {
  const { currentSession } = useSessionStore()
  const [students,    setStudents]    = useState([])
  const [defaulters,  setDefaulters]  = useState([])
  const [subjects,    setSubjects]    = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    if (!open || !exam?.id) return
    setLoading(true)

    Promise.all([
      getStudents({ class_id: exam.class_id, session_id: exam.session_id, perPage: 1000 }),
      getDefaulters({ class_id: exam.class_id }),
      getExamSubjects(exam.id)
    ])
    .then(([studentRes, defaulterRes, subjectRes]) => {
      const allStudents = studentRes.data?.students || []
      setStudents(allStudents)
      setDefaulters(defaulterRes.data?.defaulters || [])
      setSubjects(subjectRes.data?.subjects || [])
      setSelectedIds(allStudents.map(s => s.id)) // default select all
    })
    .catch(err => console.error('Failed to load admit card data', err))
    .finally(() => setLoading(false))
  }, [open, exam?.id, exam?.class_id, exam?.session_id])

  // Fee balance map for quick lookup
  const balances = useMemo(() => {
    const map = {}
    defaulters.forEach(d => {
      map[d.student_id] = Number(d.balance)
    })
    return map
  }, [defaulters])

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter(s => 
      s.student_name?.toLowerCase().includes(q) || 
      s.admission_no?.toLowerCase().includes(q) ||
      s.roll_number?.toString().includes(q)
    )
  }, [students, searchQuery])

  const selectedStudents = useMemo(() => 
    students.filter(s => selectedIds.includes(s.id)),
  [students, selectedIds])

  const toggleAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredStudents.map(s => s.id))
    }
  }

  const toggleOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const pdfFileName = useMemo(() => {
    if (!exam) return 'admit-cards.pdf'
    const name = `admit-cards-${exam.class_name}-${exam.name}`
    return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '.pdf'
  }, [exam])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Generate Admit Cards — ${exam?.name}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {selectedIds.length} of {students.length} students selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            
            {selectedIds.length > 0 ? (
              <PDFDownloadLink
                document={
                  <AdmitCardPDF 
                    students={selectedStudents} 
                    exam={{ ...exam, session_name: currentSession?.name }}
                    subjects={subjects}
                    schoolName={currentSession?.school_name || 'School Name'}
                    balances={balances}
                  />
                }
                fileName={pdfFileName}
              >
                {({ loading: pdfLoading }) => (
                  <Button 
                    variant="primary" 
                    icon={Download} 
                    loading={pdfLoading}
                  >
                    Download PDF
                  </Button>
                )}
              </PDFDownloadLink>
            ) : (
              <Button variant="primary" icon={Download} disabled>
                Download PDF
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition-all focus:ring-2 focus:ring-indigo-500/20"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            />
          </div>
          
          <button 
            onClick={toggleAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-surface-raised"
            style={{ color: 'var(--color-brand)' }}
          >
            {selectedIds.length === filteredStudents.length ? <CheckSquare size={14} /> : <Square size={14} />}
            {selectedIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* List */}
        <div 
          className="rounded-2xl border overflow-hidden max-h-[50vh] overflow-y-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: 'var(--color-surface-raised)' }} />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted">No students found matching your search.</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--color-surface-raised)' }}>
                <tr>
                  <th className="w-10 px-4 py-3 text-left"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ background: 'var(--color-surface)' }}>
                {filteredStudents.map((s) => {
                  const isSelected = selectedIds.includes(s.id)
                  const balance = balances[s.id] || 0
                  
                  return (
                    <tr 
                      key={s.id}
                      onClick={() => toggleOne(s.id)}
                      className="cursor-pointer transition-colors border-t"
                      style={{ 
                        borderColor: 'var(--color-border)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'transparent'
                      }}
                      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--color-surface-raised)')}
                      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        {isSelected ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {s.student_name || `${s.first_name} ${s.last_name}`}
                        </p>
                        <p className="text-xs text-muted font-mono">{s.admission_no}</p>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {s.roll_number || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {balance > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                            <AlertTriangle size={10} />
                            Fee Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex gap-3 items-start">
          <AlertTriangle size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Generating a PDF with many students may take a moment. The PDF will be formatted as A5 size, one student per page, suitable for printing on standard paper or cards.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default AdmitCardModal
