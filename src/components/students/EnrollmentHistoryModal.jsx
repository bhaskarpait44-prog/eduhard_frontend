import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Badge from '@/components/ui/Badge'
import { History, Calendar, BookOpen, GraduationCap, LogOut } from 'lucide-react'
import { getEnrollmentHistory } from '@/api/studentLeavingApi'
import { formatDate, formatPercent } from '@/utils/helpers'

export default function EnrollmentHistoryModal({ open, student, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && student?.id) {
      setLoading(true)
      getEnrollmentHistory(student.id)
        .then(res => setHistory(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, student])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enrollment History"
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        {student && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{student.first_name} {student.last_name}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Admission No: {student.admission_no}</p>
            </div>
            <Badge variant={student.status === 'active' ? 'green' : 'grey'}>{student.status?.toUpperCase()}</Badge>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading history...</div>
          ) : history.length === 0 ? (
            <EmptyState icon={History} title="No history found" description="This student has no enrollment records." />
          ) : history.map((item, idx) => (
            <div key={item.id} className="relative pl-8 pb-4 last:pb-0">
              {/* Timeline Connector */}
              {idx !== history.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              {/* Timeline Dot */}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white z-10`} style={{ borderColor: item.status === 'active' ? '#16a34a' : '#cbd5e1' }}>
                {item.leaving_type === 'graduated' ? <GraduationCap size={12} className="text-blue-600" /> : 
                 item.leaving_type === 'left' ? <LogOut size={12} className="text-red-600" /> :
                 <BookOpen size={12} className="text-slate-500" />}
              </div>

              <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{item.session_name}</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{item.class_name} ({item.section_name})</p>
                  </div>
                  <Badge variant={item.status === 'active' ? 'green' : 'grey'} size="sm">
                    {item.status === 'active' ? 'Current' : item.leaving_type?.toUpperCase() || 'INACTIVE'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetaItem label="Joined" value={formatDate(item.joined_date)} sub={item.joining_type} />
                  <MetaItem label="Left" value={item.left_date ? formatDate(item.left_date) : '--'} sub={item.leaving_type} />
                  <MetaItem label="Percentage" value={item.percentage != null ? `${formatPercent(item.percentage)}` : '--'} />
                  <MetaItem label="Result" value={item.result?.toUpperCase() || '--'} sub={item.grade ? `Grade ${item.grade}` : ''} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

function MetaItem({ label, value, sub }) {
  return (
    <div>
      <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="block text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
      {sub && <span className="block text-[10px] text-slate-400 font-medium">{sub}</span>}
    </div>
  )
}
