import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import CountryCitySelector, { validateCountryCity } from '@/components/ui/CountryCitySelector'
import { validatePhone } from '@/lib/validators'
import { validateFullName } from '@/lib/validators'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

/*const CITIES = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven',
  'Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik',
  'Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Other']*/

const EMPTY = {
  title: '', title_bg: '',
  description: '', description_bg: '',
  summary: '', summary_bg: '',
  goal: '', goal_bg: '',
  meeting_point: '', meeting_point_bg: '',
  requirements: '', requirements_bg: '',
  contact_person: '', contact_person_bg: '',
  contact_email: '', contact_phone: '',
  country: 'Bulgaria', country_bg: 'България', city: '', city_bg: '', address: '', address_bg: '',
  location_lat: '', location_lng: '',
  event_type: 'onsite', online_url: '', is_online: false,
  event_date: '', end_date: '',
  volunteers_needed: '',
  invitation_image_url: '',
  gallery_images: [],
  show_in_public: false, status: 'draft',
}

function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (value ? 'bg-brand-400' : 'bg-gray-200')}>
        <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (value ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function BilingualTextarea({ labelEn, labelBg, valueEn, valueBg, onChangeEn, onChangeBg, rows = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label={labelEn}>
        <textarea rows={rows} className="input resize-none" value={valueEn} onChange={e => onChangeEn(e.target.value)} />
      </Field>
      <Field label={labelBg}>
        <textarea rows={rows} className="input resize-none" value={valueBg} onChange={e => onChangeBg(e.target.value)} />
      </Field>
    </div>
  )
}

function ImageUpload({ label, currentUrl, bucket, path, onUploaded }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)

  useEffect(() => setPreview(currentUrl), [currentUrl])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${path}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      setPreview(data.publicUrl)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        {preview && <img src={preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => ref.current?.click()}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            {uploading ? <><div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /> Uploading...</> : '↑ Upload image'}
          </button>
          {preview && (
            <button type="button" onClick={() => { setPreview(''); onUploaded('') }} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

function GalleryUpload({ images, orgId, eventId, onChange }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 10 - images.length
    const toUpload = files.slice(0, remaining)
    setUploading(true)
    const urls = []
    for (const file of toUpload) {
      const ext = file.name.split('.').pop()
      const path = `${orgId}/${eventId || 'new'}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('event-images').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    onChange([...images, ...urls])
    setUploading(false)
  }

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Gallery images ({images.length}/10) — shown as slideshow after event completes
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative group">
            <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
            <button type="button" onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              ×
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <button type="button" onClick={() => ref.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 text-2xl hover:border-brand-300 hover:text-brand-400 flex items-center justify-center transition-colors">
            {uploading ? <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /> : '+'}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      {images.length >= 10 && <p className="text-xs text-amber-600">Maximum 10 images reached.</p>}
    </div>
  )
}

const TABS = ['Basic', 'Details', 'Location', 'Contact', 'Media']

export default function OrgEventEdit() {
  const { projectId, eventId } = useParams()
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ccErrors, setCcErrors] = useState({})
  const [phoneEventError, setPhoneEventError] = useState(null)
  const [personResponsibleError, setpersonResponsibleError] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Basic')
  const isNew = !eventId

  useEffect(() => { load() }, [user?.id, projectId, eventId])

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
        const toLocal = (ts) => ts ? new Date(ts).toISOString().slice(0, 16) : ''
        setForm({
          title: ev.title || '', title_bg: ev.title_bg || '',
          description: ev.description || '', description_bg: ev.description_bg || '',
          summary: ev.summary || '', summary_bg: ev.summary_bg || '',
          goal: ev.goal || '', goal_bg: ev.goal_bg || '',
          meeting_point: ev.meeting_point || '', meeting_point_bg: ev.meeting_point_bg || '',
          requirements: ev.requirements || '', requirements_bg: ev.requirements_bg || '',
          contact_person: ev.contact_person || '', contact_person_bg: ev.contact_person_bg || '',
          contact_email: ev.contact_email || '', contact_phone: ev.contact_phone || '',
          city: ev.city || '', city_bg: ev.city_bg || '',
          address: ev.address || '', address_bg: ev.address_bg || '',
          location_lat: ev.location_lat != null ? String(parseFloat(ev.location_lat)) : '',
          location_lng: ev.location_lng != null ? String(parseFloat(ev.location_lng)) : '',
          event_type: ev.event_type || (ev.is_online ? 'online' : 'onsite'),
          online_url: ev.online_url || '',
          is_online: ev.is_online || false,
          event_date: toLocal(ev.event_date), end_date: toLocal(ev.end_date),
          volunteers_needed: ev.volunteers_needed || '',
          invitation_image_url: ev.invitation_image_url || '',
          gallery_images: ev.gallery_images || [],
          show_in_public: ev.show_in_public || false,
          status: ev.status || 'draft',
        })
      }
    }
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setError('')
    if (!form.title.trim()) { setError('Title (EN) is required'); return }
    if (!form.event_date) { setError('Start date & time is required'); return }
    const phoneErr = validatePhone(form.contact_phone, lang)
    if (phoneErr) { setError(phoneErr); return }
    setSaving(true)
    const isOnline = form.event_type === 'online' || form.event_type === 'hybrid'
    const payload = {
      title: form.title, title_bg: form.title_bg || null,
      description: form.description || null, description_bg: form.description_bg || null,
      summary: form.summary || null, summary_bg: form.summary_bg || null,
      goal: form.goal || null, goal_bg: form.goal_bg || null,
      meeting_point: form.meeting_point || null, meeting_point_bg: form.meeting_point_bg || null,
      requirements: form.requirements || null, requirements_bg: form.requirements_bg || null,
      contact_person: form.contact_person || null, contact_person_bg: form.contact_person_bg || null,
      contact_email: form.contact_email || null, contact_phone: form.contact_phone || null,
      city: form.city || null, city_bg: form.city_bg || null,
      address: form.address || null, address_bg: form.address_bg || null,
      location_lat: form.location_lat !== '' ? parseFloat(form.location_lat) : null,
      location_lng: form.location_lng !== '' ? parseFloat(form.location_lng) : null,
      event_type: form.event_type,
      is_online: isOnline,
      online_url: (isOnline && form.online_url) ? form.online_url : null,
      event_date: new Date(form.event_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      volunteers_needed: form.volunteers_needed ? parseInt(form.volunteers_needed) : 0,
      invitation_image_url: form.invitation_image_url || null,
      gallery_images: Array.isArray(form.gallery_images) ? form.gallery_images : [],
      show_in_public: form.show_in_public,
      updated_at: new Date().toISOString(),
    }
    let err
    try {
      if (isNew) {
        const { error, data } = await supabase.from('events').insert({
          ...payload, status: 'draft', organization_id: org.id, project_id: projectId, created_by: user.id,
        })
        console.log('insert result:', { error, data })
        err = error
      } else {
        const { error, data, status, statusText } = await supabase.from('events').update(payload).eq('id', eventId)
        console.log('update result:', { error, data, status, statusText })
        err = error
      }
    } catch (e) {
      console.error('save exception:', e)
      err = e
    }
    setSaving(false)
    if (err) { setError(err.message || String(err)); return }
    navigate('/org/projects/' + projectId + '/events')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!org || !project) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500">Not found.</p></div>

  const isOnline = form.event_type === 'online' || form.event_type === 'hybrid'
  const isOnsite = form.event_type === 'onsite' || form.event_type === 'hybrid'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to={'/org/projects/' + projectId + '/events'} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← {project.title}</Link>
        <h1 className="text-xl font-medium text-gray-900">{isNew ? 'New event' : 'Edit event'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-gray-100 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ' +
              (tab === t ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Basic ── */}
        {tab === 'Basic' && <>
          <div className="card flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Title (EN) *">
                <input type="text" required className="input" value={form.title} onChange={e => set('title', e.target.value)} />
              </Field>
              <Field label="Title (BG)">
                <input type="text" className="input" value={form.title_bg} onChange={e => set('title_bg', e.target.value)} />
              </Field>
            </div>

            <BilingualTextarea labelEn="Description (EN)" labelBg="Description (BG)"
              valueEn={form.description} valueBg={form.description_bg}
              onChangeEn={v => set('description', v)} onChangeBg={v => set('description_bg', v)} rows={4} />

            <BilingualTextarea labelEn="Summary (EN)" labelBg="Summary (BG)"
              valueEn={form.summary} valueBg={form.summary_bg}
              onChangeEn={v => set('summary', v)} onChangeBg={v => set('summary_bg', v)} rows={2} />

            <BilingualTextarea labelEn="Goal (EN)" labelBg="Goal (BG)"
              valueEn={form.goal} valueBg={form.goal_bg}
              onChangeEn={v => set('goal', v)} onChangeBg={v => set('goal_bg', v)} rows={2} />

            <BilingualTextarea labelEn="Volunteer requirements (EN)" labelBg="Volunteer requirements (BG)"
              valueEn={form.requirements} valueBg={form.requirements_bg}
              onChangeEn={v => set('requirements', v)} onChangeBg={v => set('requirements_bg', v)} rows={2} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start date & time *">
                <input type="datetime-local" required className="input" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
              </Field>
              <Field label="End date & time">
                <input type="datetime-local" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
              </Field>
            </div>

            <Field label="Volunteers needed">
              <input type="number" min="0" className="input" value={form.volunteers_needed} onChange={e => set('volunteers_needed', e.target.value)} />
            </Field>
          </div>
        </>}

        {/* ── Details ── */}
        {tab === 'Details' && <>
          <div className="card flex flex-col gap-5">
            {/* Event type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event type</label>
              <div className="flex gap-3">
                {[['onsite','🏢 On site'],['online','💻 Online'],['hybrid','🔀 Hybrid']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => set('event_type', val)}
                    className={'flex-1 text-sm py-2.5 rounded-xl border-2 font-medium transition-colors ' +
                      (form.event_type === val ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-600 hover:border-gray-200')}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {isOnline && (
              <Field label="Meeting / join URL">
                <input type="url" className="input" placeholder="https://zoom.us/j/..." value={form.online_url} onChange={e => set('online_url', e.target.value)} />
              </Field>
            )}

            <BilingualTextarea labelEn="Meeting point instructions (EN)" labelBg="Meeting point instructions (BG)"
              valueEn={form.meeting_point} valueBg={form.meeting_point_bg}
              onChangeEn={v => set('meeting_point', v)} onChangeBg={v => set('meeting_point_bg', v)} rows={2} />

            {!isNew && (form.status === 'published' || form.status === 'completed') && (
              <div className="border-t border-gray-100 pt-3">
                <Toggle value={form.show_in_public} onChange={v => set('show_in_public', v)}
                  label="Show on public page" hint="Visible at /events and on the project page" />
              </div>
            )}
          </div>
        </>}

        {/* ── Location ── */}
        {tab === 'Location' && <>
          <div className="card flex flex-col gap-5">
            {isOnsite && <>
              <CountryCitySelector
                countryEN={form.country}
                countryBG={form.country_bg}
                cityEN={form.city}
                cityBG={form.city_bg}
                lang={lang}
                errors={ccErrors}
                onChange={({ countryEN, countryBG, cityEN, cityBG }) => {
                  set('country', countryEN); set('country_bg', countryBG)
                  set('city', cityEN);       set('city_bg', cityBG)
                  setCcErrors({})
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Address (EN)">
                  <input type="text" className="input" placeholder="e.g. 1 Bulgaria Blvd" value={form.address} onChange={e => set('address', e.target.value)} />
                </Field>
                <Field label="Address (BG)">
                  <input type="text" className="input" placeholder="напр. бул. България 1" value={form.address_bg} onChange={e => set('address_bg', e.target.value)} />
                </Field>
              </div>
            </>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Geolocation (for map)</label>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input type="number" step="any" className="input" placeholder="42.6977" value={form.location_lat} onChange={e => set('location_lat', e.target.value)} />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" className="input" placeholder="23.3219" value={form.location_lng} onChange={e => set('location_lng', e.target.value)} />
                </Field>
              </div>
              {form.location_lat && form.location_lng && (
                <a href={`https://www.google.com/maps?q=${form.location_lat},${form.location_lng}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-brand-500 hover:underline mt-1.5 block">
                  📍 Preview on Google Maps →
                </a>
              )}
              <p className="text-xs text-gray-400 mt-1">Tip: right-click a location in Google Maps and copy the coordinates.</p>
            </div>
          </div>
        </>}

        {/* ── Contact ── */}
        {tab === 'Contact' && <>
          <div className="card flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Person responsible (EN)">
                <input type="text" className="input" placeholder="Maria Kostadinova" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} />
              </Field>
              <Field label="Person responsible (BG)">
                <input type="text" className="input" placeholder="Мария Костадинова" value={form.contact_person_bg} onChange={e => set('contact_person_bg', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact email">
                <input type="email" className="input" placeholder="contact@org.bg" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
              </Field>
              <Field label="Contact phone">
                <input type="tel" className="input" placeholder="+359 88 123 4567" value={form.contact_phone}
                  onChange={e => { set('contact_phone', e.target.value); setPhoneEventError(validatePhone(e.target.value, lang)) }} />
                {phoneEventError && <p className="text-xs text-red-500 mt-1">{phoneEventError}</p>}
              </Field>
            </div>
          </div>
        </>}

        {/* ── Media ── */}
        {tab === 'Media' && <>
          <div className="card flex flex-col gap-5">
            <ImageUpload
              label="Invitation image"
              currentUrl={form.invitation_image_url}
              bucket="event-images"
              path={org.id}
              onUploaded={url => set('invitation_image_url', url)}
            />
            <div className="border-t border-gray-100 pt-4">
              <GalleryUpload
                images={form.gallery_images}
                orgId={org.id}
                eventId={eventId}
                onChange={imgs => set('gallery_images', imgs)}
              />
            </div>
          </div>
        </>}

        <div className="flex justify-between pt-2">
          <Link to={'/org/projects/' + projectId + '/events'} className="btn-secondary">Cancel</Link>
          <button type="button" onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving...' : (isNew ? 'Create event' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  )
}
