// src/pages/exams/AdmitCardModal.jsx
import { useEffect, useState, useMemo } from 'react'
import { Printer, Users, AlertTriangle, IndianRupee } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { getDefaulters } from '@/api/accountantApi'
import { getStudents } from '@/api/studentsApi'
import { formatCurrency } from '@/utils/helpers'

/* ── severity config (reuse same logic as DefaulterList) ── */
const SEVERITY = (balance) => {
  if (balance >= 10000) return { label: 'Critical', bg: '#fef2f2', text: '#b91c1c' }
  if (balance >= 5000)  return { label: 'High',     bg: '#fff7ed', text: '#c2410c' }
  return                       { label: 'Moderate', bg: '#fefce8', text: '#a16207' }
}

/* ══════════════════════════════════════════════════════════ */
const AdmitCardModal = ({ exam, open, onClose }) => {
  const [tab,        setTab]        = useState('admitCards') // 'admitCards' | 'feeDefaulters'
  const [students,   setStudents]   = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    if (!open || !exam?.id) return
    setLoading(true)

    Promise.all([
      // fetch students for this class/session
      getStudents({ class_id: exam.class_id, session_id: exam.session_id, perPage: 1000 }),

      // filter defaulters by the exam's class
      getDefaulters({ class_id: exam.class_id })
    ])
    .then(([studentRes, defaulterRes]) => {
      setStudents(studentRes.data?.students || [])
      setDefaulters(defaulterRes.data?.defaulters || [])
    })
    .finally(() => setLoading(false))
  }, [open, exam?.id, exam?.class_id, exam?.session_id])

  /* only defaulters who belong to this class */
  const classDefaulters = useMemo(() =>
    defaulters.filter(d => d.class_name === exam?.class_name),
  [defaulters, exam?.class_name])

  const totalDue = useMemo(() =>
    classDefaulters.reduce((sum, d) => sum + Number(d.balance || 0), 0),
  [classDefaulters])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${exam?.name} — ${exam?.class_name}`}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {tab === 'admitCards' && (
            <Button icon={Printer} onClick={() => window.print()}>Print Cards</Button>
          )}
        </>
      }
    >
      {/* ── Tab bar ── */}
      <div className="flex gap-2 mb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <TabBtn active={tab === 'admitCards'}    onClick={() => setTab('admitCards')}>
          <Users size={13} /> Admit Cards
        </TabBtn>
        <TabBtn active={tab === 'feeDefaulters'} onClick={() => setTab('feeDefaulters')}>
          <AlertTriangle size={13} />
          Fee Defaulters
          {classDefaulters.length > 0 && (
            <span className="ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">
              {classDefaulters.length}
            </span>
          )}
        </TabBtn>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl"
              style={{ background: 'var(--color-surface-raised)' }} />
          ))}
        </div>
      ) : tab === 'admitCards' ? (
        <AdmitCardsTab students={students} exam={exam} />
      ) : (
        <FeeDefaultersTab defaulters={classDefaulters} totalDue={totalDue} />
      )}
    </Modal>
  )
}

/* ── Tab button ── */
const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
    style={{
      borderColor:  active ? '#4338ca' : 'transparent',
      color:        active ? '#4338ca' : 'var(--color-text-secondary)',
      background:   'transparent',
    }}
  >
    {children}
  </button>
)

/* ══════════════════════════════════════════════════════════
   Admit Cards Tab (your existing card UI)
═══════════════════════════════════════════════════════════ */
const AdmitCardsTab = ({ students, exam }) => {
  if (!students.length)
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No students found for this class.
      </p>
    )

  return (
    <div id="admit-card-print-area" className="space-y-4">
      {students.map(s => (
        <AdmitCard key={s.id} student={s} exam={exam} />
      ))}
    </div>
  )
}

/* ── Placeholder for AdmitCard component ── */
const AdmitCard = ({ student, exam }) => (
  <div className="p-4 border rounded-xl" style={{ borderColor: 'var(--color-border)' }}>
    <p className="font-bold">{student.student_name}</p>
    <p className="text-xs text-muted">{exam.name}</p>
  </div>
)

/* ══════════════════════════════════════════════════════════
   Fee Defaulters Tab
═══════════════════════════════════════════════════════════ */
const FeeDefaultersTab = ({ defaulters, totalDue }) => {
  if (!defaulters.length)
    return (
      <div className="rounded-2xl py-10 text-center"
        style={{ background: 'var(--color-surface-raised)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          No pending payments for this class 🎉
        </p>
      </div>
    )

  return (
    <div className="space-y-4">

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Defaulters</p>
          <p className="text-2xl font-bold text-red-700">{defaulters.length}</p>
          <p className="text-xs text-red-500">students with due fees</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">Total Due</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalDue)}</p>
          <p className="text-xs text-orange-500">outstanding balance</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'var(--color-surface-raised)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}>#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}>Student</th>
              <th className="text-left px-4 py-3 text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}>Due Since</th>
              <th className="text-right px-4 py-3 text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}>Balance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold"
                style={{ color: 'var(--color-text-muted)' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {defaulters.map((d, i) => {
              const sev = SEVERITY(Number(d.balance))
              return (
                <tr key={d.student_id}
                  style={{ borderTop: '1px solid var(--color-border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {d.student_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {d.roll_number || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {d.first_due_date ? new Date(d.first_due_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: '#b91c1c' }}>
                    {formatCurrency(d.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold"
                      style={{ background: sev.bg, color: sev.text }}>
                      {sev.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Warning note */}
      <div className="rounded-2xl p-3 flex gap-2 items-start"
        style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
        <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-800 font-medium">
          Students with pending fees may be restricted from receiving their admit card
          until dues are cleared. Please coordinate with the accounts department.
        </p>
      </div>

    </div>
  )
}

export default AdmitCardModal
