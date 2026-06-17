import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useFamilyStore from '@/store/familyStore'
import useAdminStudentStore from '@/store/studentStore'
import { 
  Users, 
  Plus, 
  Search,
  Phone,
  Mail,
  Trash2,
  Pencil,
  AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function FamilyManager() {
  usePageTitle('Sibling Linking & Families')
  const { toastSuccess, toastError } = useToast()
  const { 
    families, isLoading, fetchFamilies, createFamily, updateFamily, deleteFamily, clearError, error 
  } = useFamilyStore()
  const { students, fetchStudents } = useAdminStudentStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  const [form, setForm] = useState({
    family_name: '',
    primary_contact: '',
    phone: '',
    email: '',
    student_ids: []
  })

  // Multi-select for students
  const [studentSearch, setStudentSearch] = useState('')

  useEffect(() => {
    fetchFamilies()
    fetchStudents()
  }, [fetchFamilies, fetchStudents])

  const filteredFamilies = useMemo(() => {
    if (!searchQuery) return families
    const q = searchQuery.toLowerCase()
    return families.filter(f => 
      f.family_name?.toLowerCase().includes(q) ||
      f.primary_contact?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.siblings?.some(s => s.first_name?.toLowerCase().includes(q) || s.last_name?.toLowerCase().includes(q))
    )
  }, [families, searchQuery])

  const filteredStudentsForSelect = useMemo(() => {
    if (!studentSearch) return students.slice(0, 10)
    const q = studentSearch.toLowerCase()
    return students.filter(s => 
      s.first_name?.toLowerCase().includes(q) || 
      s.last_name?.toLowerCase().includes(q) || 
      s.admission_no?.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [students, studentSearch])

  // Map studentId -> existing familyName for warnings
  const studentFamilyMap = useMemo(() => {
    const map = {}
    families.forEach(f => {
      f.siblings?.forEach(s => { map[s.id] = f.family_name })
    })
    return map
  }, [families])

  const openModal = (family = null) => {
    clearError()
    if (family) {
      setEditingId(family.id)
      setForm({
        family_name: family.family_name || '',
        primary_contact: family.primary_contact || '',
        phone: family.phone || '',
        email: family.email || '',
        student_ids: family.siblings?.map(s => s.id) || []
      })
    } else {
      setEditingId(null)
      setForm({
        family_name: '',
        primary_contact: '',
        phone: '',
        email: '',
        student_ids: []
      })
    }
    setStudentSearch('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateFamily(editingId, form)
        toastSuccess('Family updated')
      } else {
        await createFamily(form)
        toastSuccess('Family created')
      }
      setModalOpen(false)
    } catch (err) {
      toastError(err.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteFamily(deleteTarget.id)
      toastSuccess('Family deleted')
      setDeleteTarget(null)
    } catch (err) { 
      toastError('Deletion failed') 
    }
  }

  const toggleStudent = (id) => {
    setForm(prev => {
      const ids = prev.student_ids.includes(id) 
        ? prev.student_ids.filter(x => x !== id)
        : [...prev.student_ids, id]
      return { ...prev, student_ids: ids }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Sibling Linking</h1>
            <p className="text-sm font-medium text-gray-500">Group students into families for discounts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search families..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
            />
          </div>
          <Button icon={Plus} onClick={() => openModal()} className="rounded-2xl">
            Create Family
          </Button>
        </div>
      </div>

      {isLoading && families.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4" />
              <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : filteredFamilies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFamilies.map(f => (
            <div key={f.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{f.family_name || 'Unnamed Family'}</h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">{f.primary_contact}</p>
                  {f.parent_user_name && (
                    <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase">Account: {f.parent_user_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(f)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={16}/></button>
                  <button onClick={() => setDeleteTarget(f)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {f.phone && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Phone size={14} /> {f.phone}</div>}
                {f.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail size={14} /> {f.email}</div>}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Linked Siblings ({f.siblings?.length || 0})</p>
                <div className="space-y-2">
                  {f.siblings?.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{s.first_name} {s.last_name}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{s.admission_no}</span>
                    </div>
                  ))}
                  {(!f.siblings || f.siblings.length === 0) && (
                    <p className="text-xs text-gray-400 italic">No siblings linked.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12">
          <EmptyState title="No families found" description="Create a family group to start linking siblings." />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => !isLoading && setModalOpen(false)} title={editingId ? 'Edit Family' : 'Create Family'} size="md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input label="Family Name" value={form.family_name} onChange={e => setForm({...form, family_name: e.target.value})} placeholder="e.g. The Smith Family" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Primary Contact Name" value={form.primary_contact} onChange={e => setForm({...form, primary_contact: e.target.value})} required />
              <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
            </div>
            <Input label="Email (Optional)" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold mb-3">Link Siblings</p>
            
            {/* Selected Students */}
            {form.student_ids.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {form.student_ids.map(id => {
                  const s = students.find(x => x.id === id)
                  return s ? (
                    <div key={id} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-500/30">
                      {s.first_name} {s.last_name}
                      <button type="button" onClick={() => toggleStudent(id)} className="ml-1 text-indigo-400 hover:text-indigo-600"><Trash2 size={12}/></button>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {/* Search and Select */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search students to link..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-100 dark:border-gray-800 p-1">
              {filteredStudentsForSelect.map(s => {
                const existingFamily = studentFamilyMap[s.id]
                const alreadyInThisFamily = editingId && families.find(f => f.id === editingId)?.siblings?.some(sib => sib.id === s.id)

                return (
                  <div key={s.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer" onClick={() => toggleStudent(s.id)}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={form.student_ids.includes(s.id)} 
                        onChange={() => toggleStudent(s.id)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                      />
                      <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
                      {existingFamily && !alreadyInThisFamily && (
                        <span className="text-[10px] text-orange-500 font-bold ml-1 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded">
                          In: {existingFamily}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{s.admission_no}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="mr-2">Cancel</Button>
            <Button type="submit" loading={isLoading}>Save Family</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete family?"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          This will unlink all students from <strong>{deleteTarget?.family_name}</strong>. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={isLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
