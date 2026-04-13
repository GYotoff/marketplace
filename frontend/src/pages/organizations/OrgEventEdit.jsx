import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const CITIES = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven','Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik','Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Online','Other']

const EMPTY = {
  title: '', title_bg: '', description: '', description_bg: '',
  city: '', address: '', is_online: false, online_url: '',
  event_date: '', end_date: '', volunteers_needed: '',
  show_in_public: false, status: 'draft',
}

export default function OrgEventEdit() {
  const { projectId, eventId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isNew = !eventId

  useEffect(() => { load() }, [user, projectId, eventId])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: om } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('profile_id', user.id).eq('role', 'admin').eq('request_status', 'approved')
      .single()
    if (!om) { setLoading(false); return }
    setOrg(om.organizations)
    const { data: p } = await supabase.from('projects').select('id, title, status').eq('id', projectId).single()
    setProject(p)
    if (!isNew) {
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (ev) {
        const toLocal = (ts) => ts ? new Date(ts).toISOString().slice(0,16) : ''
        setForm({
          title: ev.title || '', title_bg: ev.title_bg || '',
          description: ev.description || '', description_bg: ev.description_bg || '',
          city: ev.city || '', address: ev.address || '',
          is_online: ev.is_online || false, online_url: ev.online_url || '',
          event_date: toLocal(ev.event_date), end_date: toLocal(ev.end_date),
          volunteers_needed: ev.volunteers_needed || '',
          show_in_public: ev.show_in_public || false,
          status: ev.status || 'draft',
        })
      }
    }
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.event_date) { setError('Event date is required'); return }
    setSaving(true)
    const payload = {
      title: form.title, title_bg: form.title_bg || null,
      description: form.description || null, description_bg: form.description_bg || null,
      city: form.city || null, address: form.address || null,
      is_online: form.is_online, online_url: form.online_url || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      volunteers_needed: form.volunteers_needed ? parseInt(form.volunteers_needed) : 0,
      show_in_public: form.show_in_public,
      updated_at: new Date().toISOString(),
    }
    let err
    if (isNew) {
      const { error } = await supabase.from('events').insert({
        ...payload, status: 'draft',
        organization_id: org.id, project_id: projectId, created_by: user.id,
      })
      err = error
    } else {
      const { error } = await supabase.from('events').update(payload).eq('id', eventId)
      err = error
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/org/projects/' + projectId + '/events')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!org || !project) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500">Not found.</p></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={'/org/projects/' + projectId + '/events'} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← {project.title}</Link>
          <h1 className="text-xl font-medium text-gray-900">{isNew ? 'New event' : 'Edit event'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <form onSubmit={save} className="card flex flex-col gap-5">
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
          <textarea rows={3} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (BG)</label>
          <textarea rows={3} className="input resize-none" value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date & time <span className="text-red-400">*</span></label>
            <input type="datetime-local" required className="input" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End date & time</label>
            <input type="datetime-local" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2 border-t border-gray-100">
          <button type="button" onClick={() => set('is_online', !form.is_online)}
            className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (form.is_online ? 'bg-brand-400' : 'bg-gray-200')}>
            <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (form.is_online ? 'translate-x-6' : 'translate-x-1')} />
          </button>
          <label className="text-sm font-medium text-gray-700">Online event</label>
        </div>

        {form.is_online ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Online URL</label>
            <input type="url" className="input" placeholder="https://zoom.us/j/..." value={form.online_url} onChange={e => set('online_url', e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input type="text" className="input" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteers needed</label>
          <input type="number" min="0" className="input" value={form.volunteers_needed} onChange={e => set('volunteers_needed', e.target.value)} />
        </div>

        {!isNew && form.status === 'published' && (
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Show on public page</p>
              <p className="text-xs text-gray-400">Visible at /events and on the project page</p>
            </div>
            <button type="button" onClick={() => set('show_in_public', !form.show_in_public)}
              className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (form.show_in_public ? 'bg-brand-400' : 'bg-gray-200')}>
              <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (form.show_in_public ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        )}

        <div className="flex justify-between pt-3 border-t border-gray-100">
          <Link to={'/org/projects/' + projectId + '/events'} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : (isNew ? 'Create event' : 'Save changes')}
          </button>
        </div>
      </form>
    </div>
  )
}
