import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const CITIES = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven','Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik','Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Online','Other']

const EMPTY = {
  title: '', title_bg: '', description: '', description_bg: '',
  goals: '', goals_bg: '', deliverables: '', deliverables_bg: '',
  manager_name: '', manager_name_bg: '', manager_email: '',
  cover_url: '',
  city: '', address: '', start_date: '', end_date: '',
  volunteers_needed: '', skills_required: '',
  show_in_public: false, status: 'draft',
}

/* Inline cover image upload — uploads to project-covers bucket */
function CoverUpload({ currentUrl, orgId, onUploaded }) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(currentUrl || null)
  const [error, setError]         = useState('')
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Max 5 MB'); return }
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
      setError('PNG, JPG or WebP only'); return
    }
    setError('')
    setUploading(true)
    setPreview(URL.createObjectURL(file))
    const ext  = file.name.split('.').pop()
    const path = `${orgId || user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('project-covers').upload(path, file, { upsert: true })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('project-covers').getPublicUrl(path)
    onUploaded(publicUrl)
    setUploading(false)
  }

  const handleRemove = () => {
    setPreview(null)
    onUploaded('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      {preview && (
        <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100">
          <img src={preview} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">
          {uploading ? 'Uploading…' : preview ? 'Change cover' : 'Upload cover'}
        </button>
        {preview && (
          <button type="button" onClick={handleRemove}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
            Remove
          </button>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>PNG, JPG or WebP · max 5 MB</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" className="hidden"
        accept="image/png,image/jpeg,image/webp" onChange={handleFile} />
    </div>
  )
}

export default function OrgProjectEdit() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [org, setOrg]       = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const isNew = !id

  useEffect(() => { load() }, [user?.id, id])

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
          title:          p.title          || '',
          title_bg:       p.title_bg       || '',
          description:    p.description    || '',
          description_bg: p.description_bg || '',
          goals:          p.goals          || '',
          goals_bg:       p.goals_bg       || '',
          deliverables:   p.deliverables   || '',
          deliverables_bg:p.deliverables_bg|| '',
          manager_name:   p.manager_name   || '',
          manager_name_bg:p.manager_name_bg|| '',
          manager_email:  p.manager_email  || '',
          cover_url:      p.cover_url      || '',
          city:           p.city           || '',
          address:        p.address        || '',
          start_date:     p.start_date     || '',
          end_date:       p.end_date       || '',
          volunteers_needed: p.volunteers_needed || '',
          skills_required:   (p.skills_required || []).join(', '),
          show_in_public: p.show_in_public || false,
          status:         p.status         || 'draft',
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
      title:           form.title,
      title_bg:        form.title_bg        || null,
      description:     form.description     || null,
      description_bg:  form.description_bg  || null,
      goals:           form.goals           || null,
      goals_bg:        form.goals_bg        || null,
      deliverables:    form.deliverables    || null,
      deliverables_bg: form.deliverables_bg || null,
      manager_name:    form.manager_name    || null,
      manager_name_bg: form.manager_name_bg || null,
      manager_email:   form.manager_email   || null,
      cover_url:       form.cover_url       || null,
      city:            form.city            || null,
      address:         form.address         || null,
      start_date:      form.start_date      || null,
      end_date:        form.end_date        || null,
      volunteers_needed: form.volunteers_needed ? parseInt(form.volunteers_needed) : 0,
      skills_required: form.skills_required
        ? form.skills_required.split(',').map(s => s.trim()).filter(Boolean)
        : null,
      show_in_public:  form.show_in_public,
      updated_at:      new Date().toISOString(),
    }
    let err
    if (isNew) {
      const { error: e } = await supabase.from('projects').insert({
        ...payload, status: 'draft', organization_id: org.id, created_by: user.id,
      })
      err = e
    } else {
      const { error: e } = await supabase.from('projects').update(payload).eq('id', id)
      err = e
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/org/projects')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!org) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">You are not an admin of any organization.</p>
    </div>
  )

  const F = ({ label, hint, children }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
        {label}{hint && <span className="ml-1 font-normal text-xs" style={{ color: 'var(--text-faint)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>
            {isNew ? 'New project' : 'Edit project'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{org.name}</p>
        </div>
        <Link to="/org/projects" className="btn-secondary text-sm">← Back</Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
      )}

      <div className="flex flex-col gap-6">

        {/* ── Cover image ── */}
        <div className="card">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Cover image</h2>
          <CoverUpload
            currentUrl={form.cover_url}
            orgId={org.id}
            onUploaded={url => set('cover_url', url)}
          />
        </div>

        {/* ── Basic info ── */}
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Basic information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Title (EN)" hint="*">
              <input type="text" className="input" value={form.title} onChange={e => set('title', e.target.value)} />
            </F>
            <F label="Title (BG)">
              <input type="text" className="input" value={form.title_bg} onChange={e => set('title_bg', e.target.value)} />
            </F>
          </div>

          <F label="Description (EN)">
            <textarea rows={4} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
          </F>
          <F label="Description (BG)">
            <textarea rows={3} className="input resize-none" value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
          </F>
        </div>

        {/* ── Goals ── */}
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Goals</h2>
          <F label="Goals (EN)">
            <textarea rows={3} className="input resize-none"
              placeholder="What are the main goals of this project?"
              value={form.goals} onChange={e => set('goals', e.target.value)} />
          </F>
          <F label="Goals (BG)">
            <textarea rows={3} className="input resize-none"
              placeholder="Какви са основните цели на проекта?"
              value={form.goals_bg} onChange={e => set('goals_bg', e.target.value)} />
          </F>
        </div>

        {/* ── Deliverables ── */}
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Deliverables</h2>
          <F label="Deliverables (EN)">
            <textarea rows={3} className="input resize-none"
              placeholder="What will be delivered at the end of this project?"
              value={form.deliverables} onChange={e => set('deliverables', e.target.value)} />
          </F>
          <F label="Deliverables (BG)">
            <textarea rows={3} className="input resize-none"
              placeholder="Какви ще са резултатите от проекта?"
              value={form.deliverables_bg} onChange={e => set('deliverables_bg', e.target.value)} />
          </F>
        </div>

        {/* ── Manager ── */}
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Project manager</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Manager name (EN)">
              <input type="text" className="input" placeholder="e.g. Maria Ivanova"
                value={form.manager_name} onChange={e => set('manager_name', e.target.value)} />
            </F>
            <F label="Manager name (BG)">
              <input type="text" className="input" placeholder="напр. Мария Иванова"
                value={form.manager_name_bg} onChange={e => set('manager_name_bg', e.target.value)} />
            </F>
          </div>
          <F label="Manager email">
            <input type="email" className="input" placeholder="manager@organisation.bg"
              value={form.manager_email} onChange={e => set('manager_email', e.target.value)} />
          </F>
        </div>

        {/* ── Logistics ── */}
        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Logistics</h2>

          <div className="grid grid-cols-2 gap-4">
            <F label="City">
              <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Volunteers needed">
              <input type="number" min="0" className="input" value={form.volunteers_needed}
                onChange={e => set('volunteers_needed', e.target.value)} />
            </F>
          </div>

          <F label="Address">
            <input type="text" className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Start date">
              <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </F>
            <F label="End date">
              <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
            </F>
          </div>

          <F label="Skills required" hint="(comma-separated)">
            <input type="text" className="input" placeholder="e.g. Teaching, Photography, IT"
              value={form.skills_required} onChange={e => set('skills_required', e.target.value)} />
          </F>
        </div>

        {/* ── Visibility toggle ── */}
        {!isNew && form.status === 'published' && (
          <div className="card flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Show on public page</p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Visible to all visitors at /projects</p>
            </div>
            <button type="button" onClick={() => set('show_in_public', !form.show_in_public)}
              className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (form.show_in_public ? 'bg-brand-400' : 'bg-gray-200')}>
              <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (form.show_in_public ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex justify-between">
          <Link to="/org/projects" className="btn-secondary">Cancel</Link>
          <button type="button" onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : isNew ? 'Create project' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
