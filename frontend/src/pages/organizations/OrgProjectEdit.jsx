import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const CITIES = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven','Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik','Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Online','Other']

const EMPTY = {
  title: '', title_bg: '', description: '', description_bg: '',
  city: '', address: '', start_date: '', end_date: '',
  volunteers_needed: '', skills_required: '',
  show_in_public: false, status: 'draft',
}

export default function OrgProjectEdit() {
  const { id } = useParams() // undefined = new
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isNew = !id

  useEffect(() => { load() }, [user, id])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: om } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name, status, is_active)')
      .eq('profile_id', user.id).eq('role', 'admin').eq('request_status', 'approved')
      .single()
    if (!om) { setLoading(false); return }
    setOrg(om.organizations)
    if (!isNew) {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single()
      if (p) {
        setForm({
          title: p.title || '', title_bg: p.title_bg || '',
          description: p.description || '', description_bg: p.description_bg || '',
          city: p.city || '', address: p.address || '',
          start_date: p.start_date || '', end_date: p.end_date || '',
          volunteers_needed: p.volunteers_needed || '',
          skills_required: (p.skills_required || []).join(', '),
          show_in_public: p.show_in_public || false,
          status: p.status || 'draft',
        })
      }
    }
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    const payload = {
      title: form.title, title_bg: form.title_bg || null,
      description: form.description || null, description_bg: form.description_bg || null,
      city: form.city || null, address: form.address || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      volunteers_needed: form.volunteers_needed ? parseInt(form.volunteers_needed) : 0,
      skills_required: form.skills_required ? form.skills_required.split(',').map(s => s.trim()).filter(Boolean) : null,
      show_in_public: form.show_in_public,
      updated_at: new Date().toISOString(),
    }
    let error
    if (isNew) {
      const { error: e } = await supabase.from('projects').insert({
        ...payload, status: 'draft', organization_id: org.id, created_by: user.id,
      })
      error = e
    } else {
      const { error: e } = await supabase.from('projects').update(payload).eq('id', id)
      error = e
    }
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate('/org/projects')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!org) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500">You are not an admin of any organization.</p></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">{isNew ? 'New project' : 'Edit project'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        <Link to="/org/projects" className="btn-secondary text-sm">← Back</Link>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <div className="card flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (EN) <span className="text-red-400">*</span></label>
            <input type="text" required className="input" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title (BG)</label>
            <input type="text" className="input" value={form.title_bg} onChange={e => set('title_bg', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (EN)</label>
          <textarea rows={4} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (BG)</label>
          <textarea rows={3} className="input resize-none" value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteers needed</label>
            <input type="number" min="0" className="input" value={form.volunteers_needed} onChange={e => set('volunteers_needed', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
          <input type="text" className="input" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
            <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End date</label>
            <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills required <span className="text-gray-400 font-normal">(comma-separated)</span></label>
          <input type="text" className="input" placeholder="e.g. Teaching, Photography, IT" value={form.skills_required} onChange={e => set('skills_required', e.target.value)} />
        </div>

        {!isNew && form.status === 'published' && (
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Show on public page</p>
              <p className="text-xs text-gray-400">When on, visible to all visitors at /projects</p>
            </div>
            <button type="button" onClick={() => set('show_in_public', !form.show_in_public)}
              className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (form.show_in_public ? 'bg-brand-400' : 'bg-gray-200')}>
              <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (form.show_in_public ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        )}

        <div className="flex justify-between pt-3 border-t border-gray-100">
          <Link to="/org/projects" className="btn-secondary">Cancel</Link>
          <button type="button" onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : (isNew ? 'Create project' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  )
}
