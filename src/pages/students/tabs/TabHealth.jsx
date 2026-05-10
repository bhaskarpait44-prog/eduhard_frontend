import { useEffect, useState } from 'react'
import useHealthStore from '@/store/healthStore'
import useToast from '@/hooks/useToast'
import { Activity, Syringe, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/helpers'

export default function TabHealth({ studentId, isAdmin }) {
  const { profile, vaccinations, incidents, isLoading, fetchHealthData, updateProfile, addVaccination, deleteVaccination, addIncident, deleteIncident } = useHealthStore()
  const { toastSuccess, toastError } = useToast()

  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  
  const [vaxModal, setVaxModal] = useState(false)
  const [vaxForm, setVaxForm] = useState({ vaccine_name: '', date_administered: '', next_due_date: '', remarks: '' })

  const [incModal, setIncModal] = useState(false)
  const [incForm, setIncForm] = useState({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', type: 'injury', description: '', action_taken: '' })

  useEffect(() => {
    fetchHealthData(studentId)
  }, [studentId, fetchHealthData])

  useEffect(() => {
    if (profile) setProfileForm(profile)
  }, [profile])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(studentId, profileForm)
      toastSuccess('Health profile updated')
      setEditMode(false)
    } catch (err) { toastError('Failed to update health profile') }
  }

  const handleVaxSave = async (e) => {
    e.preventDefault()
    try {
      await addVaccination(studentId, vaxForm)
      toastSuccess('Vaccination recorded')
      setVaxModal(false)
      setVaxForm({ vaccine_name: '', date_administered: '', next_due_date: '', remarks: '' })
    } catch (err) { toastError('Failed to record vaccination') }
  }

  const handleIncSave = async (e) => {
    e.preventDefault()
    try {
      await addIncident(studentId, incForm)
      toastSuccess('Incident recorded')
      setIncModal(false)
      setIncForm({ incident_date: new Date().toISOString().split('T')[0], incident_time: '', type: 'injury', description: '', action_taken: '' })
    } catch (err) { toastError('Failed to record incident') }
  }

  return (
    <div className="space-y-6">
      {/* Basic Profile */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-rose-500" size={20} />
            <h3 className="text-lg font-bold">Health Profile</h3>
          </div>
          {isAdmin && (
            <Button size="sm" variant="secondary" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Blood Group" value={profileForm.blood_group || ''} onChange={e => setProfileForm({...profileForm, blood_group: e.target.value})} placeholder="e.g. O+" />
              <Input label="Height (cm)" type="number" step="0.1" value={profileForm.height_cm || ''} onChange={e => setProfileForm({...profileForm, height_cm: e.target.value})} />
              <Input label="Weight (kg)" type="number" step="0.1" value={profileForm.weight_kg || ''} onChange={e => setProfileForm({...profileForm, weight_kg: e.target.value})} />
            </div>
            <Input label="Allergies" value={profileForm.allergies || ''} onChange={e => setProfileForm({...profileForm, allergies: e.target.value})} />
            <Input label="Medical Conditions" value={profileForm.medical_conditions || ''} onChange={e => setProfileForm({...profileForm, medical_conditions: e.target.value})} />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isLoading}>Save Profile</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Blood Group</p>
              <p className="font-medium text-rose-600 dark:text-rose-400">{profile?.blood_group || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Height</p>
              <p className="font-medium">{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Weight</p>
              <p className="font-medium">{profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}</p>
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Allergies</p>
              <p className="font-medium">{profile?.allergies || 'None reported'}</p>
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Medical Conditions</p>
              <p className="font-medium">{profile?.medical_conditions || 'None reported'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vaccinations */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Syringe className="text-indigo-500" size={20} />
              <h3 className="text-lg font-bold">Vaccinations</h3>
            </div>
            {isAdmin && <Button size="sm" variant="secondary" onClick={() => setVaxModal(true)} icon={Plus}>Add</Button>}
          </div>
          <div className="space-y-3">
            {vaccinations.length === 0 ? <p className="text-sm text-gray-500 italic">No vaccination records.</p> : vaccinations.map(v => (
              <div key={v.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{v.vaccine_name}</p>
                  <p className="text-xs text-gray-500 mt-1">Given: {v.date_administered ? formatDate(v.date_administered) : 'Unknown'}</p>
                  {v.next_due_date && <p className="text-xs text-indigo-500 font-medium">Due: {formatDate(v.next_due_date)}</p>}
                </div>
                {isAdmin && <button onClick={() => { if(window.confirm('Delete this record?')) deleteVaccination(studentId, v.id) }} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <h3 className="text-lg font-bold">Medical Incidents</h3>
            </div>
            {isAdmin && <Button size="sm" variant="secondary" onClick={() => setIncModal(true)} icon={Plus}>Log Incident</Button>}
          </div>
          <div className="space-y-3">
            {incidents.length === 0 ? <p className="text-sm text-gray-500 italic">No medical incidents recorded.</p> : incidents.map(i => (
              <div key={i.id} className="p-3 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100 dark:border-amber-500/10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-black text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">{i.type}</span>
                    <span className="text-xs text-gray-500">{formatDate(i.incident_date)} {i.incident_time}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{i.description}</p>
                  {i.action_taken && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Action: {i.action_taken}</p>}
                </div>
                {isAdmin && <button onClick={() => { if(window.confirm('Delete this incident?')) deleteIncident(studentId, i.id) }} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={vaxModal} onClose={() => setVaxModal(false)} title="Record Vaccination">
        <form onSubmit={handleVaxSave} className="space-y-4">
          <Input label="Vaccine Name" value={vaxForm.vaccine_name} onChange={e => setVaxForm({...vaxForm, vaccine_name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date Administered" type="date" value={vaxForm.date_administered} onChange={e => setVaxForm({...vaxForm, date_administered: e.target.value})} />
            <Input label="Next Due Date" type="date" value={vaxForm.next_due_date} onChange={e => setVaxForm({...vaxForm, next_due_date: e.target.value})} />
          </div>
          <Input label="Remarks" value={vaxForm.remarks} onChange={e => setVaxForm({...vaxForm, remarks: e.target.value})} />
          <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading}>Save</Button></div>
        </form>
      </Modal>

      <Modal open={incModal} onClose={() => setIncModal(false)} title="Log Medical Incident">
        <form onSubmit={handleIncSave} className="space-y-4">
          <Select label="Type" value={incForm.type} onChange={e => setIncForm({...incForm, type: e.target.value})} options={[{value:'injury',label:'Injury'},{value:'illness',label:'Illness'},{value:'other',label:'Other'}]} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={incForm.incident_date} onChange={e => setIncForm({...incForm, incident_date: e.target.value})} required />
            <Input label="Time" type="time" value={incForm.incident_time} onChange={e => setIncForm({...incForm, incident_time: e.target.value})} />
          </div>
          <Input label="Description" value={incForm.description} onChange={e => setIncForm({...incForm, description: e.target.value})} required />
          <Input label="Action Taken" value={incForm.action_taken} onChange={e => setIncForm({...incForm, action_taken: e.target.value})} />
          <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
