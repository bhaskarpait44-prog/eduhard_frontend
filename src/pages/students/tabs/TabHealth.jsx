import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useHealthStore from '@/store/healthStore'
import useToast from '@/hooks/useToast'
import { Activity, Syringe, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/helpers'
import { healthProfileSchema, vaccinationSchema, incidentSchema } from '@/utils/validations'

export default function TabHealth({ studentId, isAdmin }) {
  const { profile, vaccinations, incidents, isLoading, fetchHealthData, updateProfile, addVaccination, deleteVaccination, addIncident, deleteIncident } = useHealthStore()
  const { toastSuccess, toastError } = useToast()

  const [editMode, setEditMode] = useState(false)
  const [vaxModal, setVaxModal] = useState(false)
  const [incModal, setIncModal] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(healthProfileSchema),
  })

  const vaxForm = useForm({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: { vaccine_name: '', date_administered: '', next_due_date: '', remarks: '' }
  })

  const incForm = useForm({
    resolver: zodResolver(incidentSchema),
    defaultValues: { incident_date: new Date().toISOString().split('T')[0], incident_time: '', type: 'injury', description: '', action_taken: '' }
  })

  useEffect(() => {
    fetchHealthData(studentId)
  }, [studentId, fetchHealthData])

  useEffect(() => {
    if (profile) profileForm.reset(profile)
  }, [profile, profileForm])

  const handleProfileSave = async (data) => {
    try {
      await updateProfile(studentId, data)
      toastSuccess('Health profile updated')
      setEditMode(false)
    } catch (err) { toastError('Failed to update health profile') }
  }

  const handleVaxSave = async (data) => {
    try {
      await addVaccination(studentId, data)
      toastSuccess('Vaccination recorded')
      setVaxModal(false)
      vaxForm.reset()
    } catch (err) { toastError('Failed to record vaccination') }
  }

  const handleIncSave = async (data) => {
    try {
      await addIncident(studentId, data)
      toastSuccess('Incident recorded')
      setIncModal(false)
      incForm.reset()
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
            <Button size="sm" variant="secondary" onClick={() => {
              if (editMode) profileForm.reset(profile)
              setEditMode(!editMode)
            }}>
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Blood Group" {...profileForm.register('blood_group')} placeholder="e.g. O+" error={profileForm.formState.errors.blood_group?.message} />
              <Input label="Height (cm)" type="number" step="0.1" {...profileForm.register('height_cm')} error={profileForm.formState.errors.height_cm?.message} />
              <Input label="Weight (kg)" type="number" step="0.1" {...profileForm.register('weight_kg')} error={profileForm.formState.errors.weight_kg?.message} />
            </div>
            <Input label="Allergies" {...profileForm.register('allergies')} error={profileForm.formState.errors.allergies?.message} />
            <Input label="Medical Conditions" {...profileForm.register('medical_conditions')} error={profileForm.formState.errors.medical_conditions?.message} />
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
            {isAdmin && <Button size="sm" variant="secondary" onClick={() => { vaxForm.reset(); setVaxModal(true); }} icon={Plus}>Add</Button>}
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
            {isAdmin && <Button size="sm" variant="secondary" onClick={() => { incForm.reset(); setIncModal(true); }} icon={Plus}>Log Incident</Button>}
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
        <form onSubmit={vaxForm.handleSubmit(handleVaxSave)} className="space-y-4">
          <Input label="Vaccine Name" {...vaxForm.register('vaccine_name')} error={vaxForm.formState.errors.vaccine_name?.message} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date Administered" type="date" {...vaxForm.register('date_administered')} error={vaxForm.formState.errors.date_administered?.message} />
            <Input label="Next Due Date" type="date" {...vaxForm.register('next_due_date')} error={vaxForm.formState.errors.next_due_date?.message} />
          </div>
          <Input label="Remarks" {...vaxForm.register('remarks')} error={vaxForm.formState.errors.remarks?.message} />
          <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading}>Save</Button></div>
        </form>
      </Modal>

      <Modal open={incModal} onClose={() => setIncModal(false)} title="Log Medical Incident">
        <form onSubmit={incForm.handleSubmit(handleIncSave)} className="space-y-4">
          <Select label="Type" {...incForm.register('type')} options={[{value:'injury',label:'Injury'},{value:'illness',label:'Illness'},{value:'other',label:'Other'}]} error={incForm.formState.errors.type?.message} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" {...incForm.register('incident_date')} error={incForm.formState.errors.incident_date?.message} required />
            <Input label="Time" type="time" {...incForm.register('incident_time')} error={incForm.formState.errors.incident_time?.message} />
          </div>
          <Input label="Description" {...incForm.register('description')} error={incForm.formState.errors.description?.message} required />
          <Input label="Action Taken" {...incForm.register('action_taken')} error={incForm.formState.errors.action_taken?.message} />
          <div className="flex justify-end pt-2"><Button type="submit" loading={isLoading}>Save</Button></div>
        </form>
      </Modal>
    </div>
  )
}
