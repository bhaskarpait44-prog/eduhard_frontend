import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit3, ShieldAlert, Check } from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import PermissionSelector from '@/components/admin/PermissionSelector'

const PermissionTemplatesPage = () => {
  usePageTitle('Permission Templates')
  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()

  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPermissions, setFormPermissions] = useState([])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await api.getPermissionTemplates()
      setTemplates(response.data || [])
    } catch (e) {
      toastError(e.message || 'Failed to load permission templates')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const startCreate = () => {
    setEditingTemplate({ id: 'new' })
    setFormName('')
    setFormDesc('')
    setFormPermissions([])
  }

  const startEdit = (template) => {
    setEditingTemplate(template)
    setFormName(template.name || '')
    setFormDesc(template.description || '')
    setFormPermissions(template.permission_names || [])
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      toastError('Template name is required')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        permissions: formPermissions,
      }

      if (editingTemplate.id === 'new') {
        await api.createTemplate(payload)
        toastSuccess('Template created successfully')
      } else {
        await api.updateTemplate(editingTemplate.id, payload)
        toastSuccess('Template updated successfully')
      }
      setEditingTemplate(null)
      loadTemplates()
    } catch (e) {
      toastError(e.message || 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    try {
      await api.deleteTemplate(id)
      toastSuccess('Template deleted successfully')
      if (editingTemplate?.id === id) {
        setEditingTemplate(null)
      }
      loadTemplates()
    } catch (e) {
      toastError(e.message || 'Failed to delete template')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(ROUTES.USERS)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Permission Templates</h1>
          <p className="text-sm text-gray-500 font-medium">Create and reuse access profiles for quick user provisioning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Templates List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Access Profiles</h2>
            <button
              onClick={startCreate}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-6">
              <ShieldAlert className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm font-semibold text-gray-600">No Custom Templates</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Create your first template to speed up user enrollment.</p>
              <button
                onClick={startCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  className={`p-4 rounded-2xl border transition-all ${editingTemplate?.id === tmpl.id ? 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/10' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{tmpl.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tmpl.description || 'No description provided'}</p>
                      <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {tmpl.permission_names?.length || 0} permissions
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(tmpl)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-50"
                        title="Edit Template"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Form (Create/Edit) */}
        <div className="lg:col-span-2">
          {editingTemplate ? (
            <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-6">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {editingTemplate.id === 'new' ? 'Create Permission Template' : `Edit Template: ${editingTemplate.name}`}
                  </h3>
                  <p className="text-[11px] text-gray-500">Configure template details and active permissions</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check size={14} />
                    Save Template
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Template Name *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Receptionist Full Access"
                      className="w-full px-4 py-3 rounded-xl text-sm border border-gray-100 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 text-gray-900 placeholder:text-gray-400/60"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Description</label>
                    <textarea
                      value={formDesc}
                      onChange={e => setFormDesc(e.target.value)}
                      placeholder="Describe what permissions this template covers"
                      className="w-full px-4 py-3 rounded-xl text-sm border border-gray-100 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 bg-gray-50/50 text-gray-900 placeholder:text-gray-400/60 min-h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">Select Permissions</h4>
                  <PermissionSelector selected={formPermissions} onChange={setFormPermissions} />
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
              <ShieldAlert className="mx-auto mb-2 text-gray-300" size={36} />
              <p className="text-sm font-semibold">Select or Create a Template</p>
              <p className="text-xs mt-1">Use the panel on the left to edit existing templates or click the plus button to create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PermissionTemplatesPage
