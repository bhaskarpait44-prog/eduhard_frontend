import { useState, useEffect } from 'react'
import { Search, User, Phone, School, Hash } from 'lucide-react'
import { getStudents } from '@/api/studentsApi'
import TableSkeleton from '@/components/ui/TableSkeleton'
import EmptyState from '@/components/ui/EmptyState'

const StudentSearch = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    const term = e.target.value
    setSearch(term)
    
    if (term.length < 3) {
      setStudents([])
      setHasSearched(false)
      return
    }

    try {
      setLoading(true)
      setHasSearched(true)
      const res = await getStudents({ search: term, perPage: 20 })
      setStudents(res.data.students)
    } catch (err) {
      console.error('Error searching students:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Student Search
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Quickly lookup student information and parent contacts.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand" 
          size={20} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search by student name or admission number..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl text-base outline-none transition-all shadow-sm"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          value={search}
          onChange={handleSearch}
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="rounded-2xl overflow-hidden" 
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={5} /></div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
                  <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Student</th>
                  <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Admission No</th>
                  <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Class & Section</th>
                  <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-black/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" 
                          style={{ backgroundColor: 'var(--color-brand)15' }}>
                          <User size={14} style={{ color: 'var(--color-brand)' }} />
                        </div>
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {s.first_name} {s.last_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                         <Hash size={13} />
                         <span>{s.admission_no}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                         <School size={13} />
                         <span>{s.class_name || 'N/A'} - {s.section_name || 'N/A'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-brand)' }}>
                         <Phone size={13} />
                         <span>{s.phone || s.emergency_contact || 'No contact'}</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <div className="py-12">
            <EmptyState 
              title="No students found" 
              description={`We couldn't find any student matching "${search}"`} 
              icon={Search}
            />
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Search size={24} className="text-slate-400" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Find a Student</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Type at least 3 characters to start searching.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentSearch
