import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import CountryCitySelector, { validateCountryCity } from '@/components/ui/CountryCitySelector'
import { validatePhone } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'

const ORG_TYPES = [
  { value: 'ngo',        label: 'NGO (Non-governmental organization)' },
  { value: 'nonprofit',  label: 'Non-profit organization' },
  { value: 'company',    label: 'Company' },
  { value: 'government', label: 'Government organization' },
  { value: 'education',  label: 'Education' },
  { value: 'investor',   label: 'Investor' },
  { value: 'other',      label: 'Other' },
]

function ImageUpload({ label, hint, currentUrl, bucket, orgId, field, onUploaded, aspectRatio = 'square' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > (bucket === 'org-covers' ? 5 : 2) * 1024 * 1024) {
      setError(`Max size: ${bucket === 'org-covers' ? '5MB' : '2MB'}`); return
    }
    setError('')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${orgId}/${field}.${ext}`
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    setPreview(url)
    onUploaded(url)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = async () => {
    setUploading(true)
    const exts = ['jpg', 'jpeg', 'png', 'webp', 'svg']
    await Promise.all(exts.map(ext =>
      supabase.storage.from(bucket).remove([`${orgId}/${field}.${ext}`])
    ))
    setPreview(null)
    onUploaded(null)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {aspectRatio === 'square' ? (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            }
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="btn-secondary text-xs py-1.5">
              {uploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
            </button>
            {preview && (
              <button type="button" onClick={handleRemove} disabled={uploading}
                className="text-xs text-red-500 hover:text-red-700">
                Remove
              </button>
            )}
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <div className="text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
            }
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="btn-secondary text-xs py-1.5">
              {uploading ? 'Uploading...' : preview ? 'Change cover' : 'Upload cover'}
            </button>
            {preview && (
              <button type="button" onClick={handleRemove} disabled={uploading}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5">
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file"
        accept={bucket === 'org-logos' ? 'image/jpeg,image/png,image/webp,image/svg+xml' : 'image/jpeg,image/png,image/webp'}
        onChange={handleFile} className="hidden" />
    </div>
  )
}

// TABS moved inside component


const UIC_RE = /^(?:\d{9}|\d{13})$/

const validateUIC = (val, lang) => {
  if (!val) return null  // empty is allowed (optional field)
  if (!UIC_RE.test(val.trim())) {
    return lang === 'bg'
      ? 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ ÐÐÐ/ÐÑÐ»ÑÑÐ°Ñ. Ð¢ÑÑÐ±Ð²Ð° Ð´Ð° ÑÑÐ´ÑÑÐ¶Ð° 9 Ð¸Ð»Ð¸ 13 ÑÐ¸ÑÑÐ¸.'
      : 'Invalid UIC/Bulstat. Must be exactly 9 or 13 digits.'
  }
  return null
}

export default function OrgSettings() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const TABS = [
    { key: 'general', label: lang==='bg'?'Общи':'General' },
    { key: 'contact', label: lang==='bg'?'Контакт':'Contact & Social' },
    { key: 'images',  label: lang==='bg'?'Лого и корица':'Logo & Cover' },
  ]
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ccErrors, setCcErrors]     = useState({})
  const [uicError, setUicError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [tab, setTab] = useState('general')
  const [toast, setToast] = useState(null)
  const [userRole, setUserRole] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchOrg()
  }, [user?.id])

  const fetchOrg = async () => {
    if (!user) return
    setLoading(true)

    const { data: memberRow } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .in('role', ['admin', 'content_creator'])
      .single()

    if (!memberRow) { setLoading(false); return }
    setUserRole(memberRow.role)

    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', memberRow.organization_id)
      .single()

    if (data) {
      setOrg(data)
      setForm({
        name: data.name || '',
        name_bg: data.name_bg || '',
        country: data.country || '',
        country_bg: data.country_bg || '',
        type: data.type || 'ngo',
        tagline: data.tagline || '',
        tagline_bg: data.tagline_bg || '',
        description: data.description || '',
        description_bg: data.description_bg || '',
        founded_year: data.founded_year || '',
        registration_number: data.registration_number || '',
        city: data.city || '',
        city_bg: data.city_bg || '',
        address: data.address || '',
        address_bg: data.address_bg || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        linkedin_url: data.linkedin_url || '',
        logo_url: data.logo_url || '',
        cover_url: data.cover_url || '',
      })
    }
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
        const phoneErr = validatePhone(form.phone, lang)
    if (phoneErr) { showToast(phoneErr, 'error'); return }
    const ccErr = validateCountryCity({ countryEN: form.country, countryBG: form.country_bg, cityEN: form.city, cityBG: form.city_bg }, lang)
    if (Object.keys(ccErr).length) { setCcErrors(ccErr); showToast(lang === 'bg' ? 'ÐÐ¾Ð»Ñ Ð¿Ð¾Ð¿ÑÐ»Ð½ÐµÑÐµ Ð´ÑÑÐ¶Ð°Ð²Ð°ÑÐ° Ð¸ Ð³ÑÐ°Ð´Ð°.' : 'Please fill in country and city.', 'error'); return }
    setCcErrors({})
    const uicErr = validateUIC(form.registration_number, lang)
    if (uicErr) { showToast(uicErr, 'error'); return }
    setSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({
        name: form.name,
        name_bg: form.name_bg || null,
        type: form.type,
        tagline: form.tagline || null,
        tagline_bg: form.tagline_bg || null,
        description: form.description,
        description_bg: form.description_bg || null,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        registration_number: form.registration_number || null,
        country: form.country || null,
        country_bg: form.country_bg || null,
        city: form.city,
        city_bg: form.city_bg || null,
        address: form.address || null,
        address_bg: form.address_bg || null,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        linkedin_url: form.linkedin_url || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)
      .select()

    if (error) showToast(error.message, 'error')
    else { showToast('Changes saved successfully'); fetchOrg() }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 mb-4">You are not a member of any organization.</p>
      <Link to="/organizations/register" className="btn-primary">Register an organization</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">{lang==='bg'?'Настройки на организацията':'Organization settings'}</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {lang==='bg'?(org.name_bg||org.name):org.name}
            <span className={`badge text-xs px-2 py-0.5 capitalize ${
              org.status === 'approved' ? 'bg-brand-50 text-brand-700'
              : org.status === 'pending' ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700'
            }`}>{lang==='bg'?({pending:'Чакащ',approved:'Одобрен',declined:'Отказан',suspended:'Спрян'}[org.status]||org.status):org.status}</span>
          </p>
        </div>
        <Link to={`/organizations/${org.slug}`} className="btn-secondary text-sm">
          {lang==='bg'?'Виж страницата':'View page'}
        </Link>
      </div>

      {org.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          Your organization is pending approval. Changes are saved but won't be publicly visible until approved.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div>

        {/* GENERAL TAB */}
        {tab === 'general' && (
          <div className="card flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'bg' ? 'ÐÐ¼Ðµ Ð½Ð° Ð¾ÑÐ³Ð°Ð½Ð¸Ð·Ð°ÑÐ¸ÑÑÐ° (EN)' : 'Organization name (EN)'} <span className="text-red-400">*</span>
                </label>
                <input type="text" required className="input"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'bg' ? 'Ime Ð½Ð° Ð¾ÑÐ³Ð°Ð½Ð¸Ð·Ð°ÑÐ¸ÑÑÐ° (BG)' : 'Organization name (BG)'}
                </label>
                <input type="text" className="input" placeholder="Ð½Ð°Ð¿Ñ. ÐÐ°ÑÐ°Ð²ÐµÑÑ"
                  value={form.name_bg} onChange={e => set('name_bg', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Тип':'Type'}</label>
                <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                  {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Година на основаване':'Founded year'}</label>
                <input type="number" className="input" placeholder="e.g. 2015"
                  min="1900" max={new Date().getFullYear()}
                  value={form.founded_year} onChange={e => set('founded_year', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Мото (EN)':'Tagline (EN)'}</label>
              <input type="text" className="input" placeholder="Short mission statement in English"
                value={form.tagline} onChange={e => set('tagline', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Мото (BG)':'Tagline (BG)'}</label>
              <input type="text" className="input" placeholder="ÐÑÐ°ÑÐºÐ¾ Ð¼Ð¾ÑÐ¾ Ð½Ð° Ð±ÑÐ»Ð³Ð°ÑÑÐºÐ¸"
                value={form.tagline_bg} onChange={e => set('tagline_bg', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (EN) <span className="text-red-400">*</span>
              </label>
              <textarea rows={5} required className="input resize-none"
                placeholder="Describe your organization, mission and activities..."
                value={form.description} onChange={e => set('description', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Описание (BG)':'Description (BG)'}</label>
              <textarea rows={4} className="input resize-none"
                placeholder="ÐÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ð½Ð° Ð¾ÑÐ³Ð°Ð½Ð¸Ð·Ð°ÑÐ¸ÑÑÐ° Ð½Ð° Ð±ÑÐ»Ð³Ð°ÑÑÐºÐ¸..."
                value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Рег. номер':'Registration number'}</label>
              <input type="text" className="input" placeholder="UIC / ÐÑÐ»ÑÑÐ°Ñ"
                value={form.registration_number}
                onChange={e => { set('registration_number', e.target.value); setUicError(validateUIC(e.target.value, lang)) }} />
              {uicError && <p className="text-xs text-red-500 mt-1">{uicError}</p>}
            </div>

            <SaveButton saving={saving} onSave={handleSave} lang={lang} />
          </div>
        )}

        {/* CONTACT TAB */}
        {tab === 'contact' && (
          <div className="card flex flex-col gap-5">
          {/* Country + City */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Ð¢ÐµÐ»ÐµÑÐ¾Ð½' : 'Phone'}</label>
              <input type="tel" className="input" placeholder="+359 2 123 4567"
                value={form.phone}
                onChange={e => { set('phone', e.target.value); setPhoneError(validatePhone(e.target.value, lang)) }} />
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact email <span className="text-red-400">*</span>
              </label>
              <input type="email" required className="input"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang==='bg'?'Уебсайт':'Website'}</label>
              <input type="url" className="input" placeholder="https://yourorganization.org"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Social media</p>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/yourorg' },
                  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/yourorg' },
                  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourorg' },
                ].map(s => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16 shrink-0">{s.label}</span>
                    <input type="url" className="input" placeholder={s.placeholder}
                      value={form[s.key]} onChange={e => set(s.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <SaveButton saving={saving} onSave={handleSave} lang={lang} />
          </div>
        )}

        {/* IMAGES TAB */}
        {tab === 'images' && (
          <div className="card flex flex-col gap-7">
            <ImageUpload
              label="Organization logo"
              hint="JPG, PNG, WebP or SVG Â· Max 2MB Â· Square recommended"
              currentUrl={form.logo_url}
              bucket="org-logos"
              orgId={org.id}
              field="logo"
              aspectRatio="square"
              onUploaded={url => set('logo_url', url)}
            />

            <div className="border-t border-gray-100 pt-6">
              <ImageUpload
                label="Cover image"
                hint="JPG, PNG or WebP Â· Max 5MB Â· 1200Ã400px recommended"
                currentUrl={form.cover_url}
                bucket="org-covers"
                orgId={org.id}
                field="cover"
                aspectRatio="wide"
                onUploaded={url => set('cover_url', url)}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <SaveButton saving={saving} onSave={handleSave} lang={lang} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SaveButton({ saving, onSave, lang }) {
  return (
    <div className="flex justify-end pt-3 border-t border-gray-100">
      <button type="button" onClick={onSave} disabled={saving}
        className="btn-primary flex items-center gap-2">
        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {saving ? (lang==='bg'?'Запазване...':'Saving...') : (lang==='bg'?'Запази промените':'Save changes')}
      </button>
    </div>
  )
}
