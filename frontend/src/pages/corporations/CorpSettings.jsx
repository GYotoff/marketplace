import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { validatePhone } from '@/lib/validators'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'

const CITIES = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo', 'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa', 'Gabrovo', 'Vidin', 'Montana', 'Other']
const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Manufacturing', 'Retail & E-commerce', 'Energy & Environment', 'Construction & Real Estate', 'Media & Entertainment', 'Transportation & Logistics', 'Food & Beverage', 'Consulting & Professional Services', 'Telecommunications', 'Other']
const TABS = [{ key: 'general', label: 'General' }, { key: 'contact', label: 'Contact & Social' }, { key: 'images', label: 'Logo & Cover' }]

function ImageUpload({ label, hint, currentUrl, bucket, entityId, field, onUploaded, wide }) {
  const ref = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)
  const [error, setError] = useState('')

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMb = wide ? 5 : 2
    if (file.size > maxMb * 1024 * 1024) { setError('Max size: ' + maxMb + 'MB'); return }
    setError('')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = entityId + '/' + field + '.' + ext
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (upErr) { setError(upErr.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    const url = publicUrl + '?t=' + Date.now()
    setPreview(url)
    onUploaded(url)
    setUploading(false)
    if (ref.current) ref.current.value = ''
  }

  const removeImg = async () => {
    setUploading(true)
    await Promise.all(['jpg', 'jpeg', 'png', 'webp', 'svg'].map(ext =>
      supabase.storage.from(bucket).remove([entityId + '/' + field + '.' + ext])
    ))
    setPreview(null)
    onUploaded(null)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {!wide ? (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="btn-secondary text-xs py-1.5">
              {uploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
            </button>
            {preview && (
              <button type="button" onClick={removeImg} disabled={uploading} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="w-full h-32 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover" />
              : <p className="text-xs text-gray-400">{hint}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="btn-secondary text-xs py-1.5">
              {uploading ? 'Uploading...' : preview ? 'Change cover' : 'Upload cover'}
            </button>
            {preview && (
              <button type="button" onClick={removeImg} disabled={uploading} className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5">Remove</button>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={upload} className="hidden" />
    </div>
  )
}

function SaveBtn({ saving, onSave }) {
  return (
    <div className="flex justify-end pt-3 border-t border-gray-100">
      <button type="button" onClick={onSave} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}

const CORP_SIZES = [
  { value: 'micro',             label: 'Micro (1–10 employees)',             label_bg: 'Микро (1–10 служители)' },
  { value: 'small',             label: 'Small (11–50 employees)',            label_bg: 'Малка (11–50 служители)' },
  { value: 'medium',            label: 'Medium (51–200 employees)',          label_bg: 'Средна (51–200 служители)' },
  { value: 'large',             label: 'Large (501–1 000 employees)',        label_bg: 'Голяма (501–1 000 служители)' },
  { value: 'enterprise',        label: 'Enterprise (1 001–5 000 employees)', label_bg: 'Корпорация (1 001–5 000 служители)' },
  { value: 'global_enterprise', label: 'Global Enterprise (5 000+)',         label_bg: 'Глобална корпорация (5 000+)' },
]

const EMPTY = { name: '', name_bg: '', industry: '', size: '', tagline: '', tagline_bg: '', description: '', description_bg: '', founded_year: '', registration_number: '', city: '', city_bg: '', address: '', address_bg: '', email: '', phone: '', website: '', facebook_url: '', instagram_url: '', linkedin_url: '', logo_url: '', cover_url: '' }


const UIC_RE = /^(?:\d{9}|\d{13})$/

const validateUIC = (val, lang) => {
  if (!val) return null  // empty is allowed (optional field)
  if (!UIC_RE.test(val.trim())) {
    return lang === 'bg'
      ? 'Невалиден ЕИК/Булстат. Трябва да съдържа 9 или 13 цифри.'
      : 'Invalid UIC/Bulstat. Must be exactly 9 or 13 digits.'
  }
  return null
}

export default function CorpSettings() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [corp, setCorp] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uicError, setUicError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [tab, setTab] = useState('general')
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { load() }, [user?.id])

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data: row } = await supabase
      .from('corporation_members')
      .select('corporation_id')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .eq('request_status', 'approved')
      .single()
    if (!row) { setLoading(false); return }
    const { data } = await supabase.from('corporations').select('*').eq('id', row.corporation_id).single()
    if (data) {
      setCorp(data)
      setForm({
        name: data.name || '', name_bg: data.name_bg || '', industry: data.industry || '', size: data.size || '', tagline: data.tagline || '', tagline_bg: data.tagline_bg || '',
        description: data.description || '', description_bg: data.description_bg || '',
        founded_year: data.founded_year || '', registration_number: data.registration_number || '',
        city: data.city || '', city_bg: data.city_bg || '', address: data.address || '', address_bg: data.address_bg || '', email: data.email || '',
        phone: data.phone || '', website: data.website || '',
        facebook_url: data.facebook_url || '', instagram_url: data.instagram_url || '', linkedin_url: data.linkedin_url || '',
        logo_url: data.logo_url || '', cover_url: data.cover_url || '',
      })
    }
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
        const phoneErr = validatePhone(form.phone, lang)
    if (phoneErr) { flash(phoneErr, 'error'); return }
    const uicErr = validateUIC(form.registration_number, lang)
    if (uicErr) { flash(uicErr, 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('corporations').update({
      name: form.name, name_bg: form.name_bg || null, industry: form.industry || null, size: form.size || null, tagline: form.tagline || null, tagline_bg: form.tagline_bg || null,
      description: form.description, description_bg: form.description_bg || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      registration_number: form.registration_number || null,
      city: form.city, city_bg: form.city_bg || null, address: form.address || null, address_bg: form.address_bg || null, email: form.email,
      phone: form.phone || null, website: form.website || null,
      facebook_url: form.facebook_url || null, instagram_url: form.instagram_url || null, linkedin_url: form.linkedin_url || null,
      logo_url: form.logo_url || null, cover_url: form.cover_url || null,
      updated_at: new Date().toISOString(),
    }).eq('id', corp.id)
    if (error) flash(error.message, 'error')
    else { flash('Changes saved successfully'); load() }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!corp) return <div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-gray-500 mb-4">You are not an admin of any corporation.</p><Link to="/corporations/register" className="btn-primary">Register a corporation</Link></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Corporation settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{corp.name}</p>
        </div>
        <Link to={'/corporations/' + corp.slug} className="btn-secondary text-sm">View page</Link>
      </div>
      {corp.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          Pending approval. Changes are saved but not publicly visible until approved.
        </div>
      )}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ' + (tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {tab === 'general' && (
          <div className="card flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Ime на корпорацията (EN)' : 'Corporation name (EN)'} <span className="text-red-400">*</span></label>
                <input type="text" required className="input" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Ime на корпорацията (BG)' : 'Corporation name (BG)'}</label>
                <input type="text" className="input" placeholder="напр. Мусала Софт"
                  value={form.name_bg} onChange={e => set('name_bg', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <select className="input" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Founded year</label>
                <input type="number" className="input" min="1900" max={new Date().getFullYear()} value={form.founded_year} onChange={e => set('founded_year', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company size</label>
              <select className="input" value={form.size} onChange={e => set('size', e.target.value)}>
                <option value="">Select size</option>
                {CORP_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Мото (EN)' : 'Tagline (EN)'}</label>
                <input type="text" className="input" placeholder="Short mission statement"
                  value={form.tagline} onChange={e => set('tagline', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Мото (BG)' : 'Tagline (BG)'}</label>
                <input type="text" className="input" placeholder="Кратко мото на български"
                  value={form.tagline_bg} onChange={e => set('tagline_bg', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (EN) <span className="text-red-400">*</span></label>
              <textarea rows={5} required className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (BG)</label>
              <textarea rows={4} className="input resize-none" value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration number</label>
              <input type="text" className="input" placeholder="UIC / Булстат"
                value={form.registration_number}
                onChange={e => { set('registration_number', e.target.value); setUicError(validateUIC(e.target.value, lang)) }} />
              {uicError && <p className="text-xs text-red-500 mt-1">{uicError}</p>}
            </div>
            <SaveBtn saving={saving} onSave={save} />
          </div>
        )}
        {tab === 'contact' && (
          <div className="card flex flex-col gap-5">
            {/* City bilingual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Град (EN)' : 'City (EN)'}</label>
                <select className="input" value={form.city}
                  onChange={e => {
                    const EN = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven','Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik','Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Online','Other'];
                    const BG = ['София','Пловдив','Варна','Бургас','Русе','Стара Загора','Плевен','Сливен','Добрич','Шумен','Перник','Хасково','Ямбол','Пазарджик','Благоевград','Велико Търново','Враца','Габрово','Видин','Монтана','Онлайн','Друго'];
                    set('city', e.target.value);
                    const idx = EN.indexOf(e.target.value);
                    if (idx >= 0) set('city_bg', BG[idx]);
                  }}>
                  <option value="">{lang === 'bg' ? 'Избери' : 'Select city'}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Град (BG)' : 'City (BG)'}</label>
                <select className="input" value={form.city_bg}
                  onChange={e => {
                    const EN = ['Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven','Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik','Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Online','Other'];
                    const BG = ['София','Пловдив','Варна','Бургас','Русе','Стара Загора','Плевен','Сливен','Добрич','Шумен','Перник','Хасково','Ямбол','Пазарджик','Благоевград','Велико Търново','Враца','Габрово','Видин','Монтана','Онлайн','Друго'];
                    set('city_bg', e.target.value);
                    const idx = BG.indexOf(e.target.value);
                    if (idx >= 0) set('city', EN[idx]);
                  }}>
                  <option value="">{lang === 'bg' ? 'Избери' : 'Select city'}</option>
                  {['София','Пловдив','Варна','Бургас','Русе','Стара Загора','Плевен','Сливен','Добрич','Шумен','Перник','Хасково','Ямбол','Пазарджик','Благоевград','Велико Търново','Враца','Габрово','Видин','Монтана','Онлайн','Друго'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Address bilingual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Адрес (EN)' : 'Address (EN)'}</label>
                <input type="text" className="input" placeholder="e.g. 15 Vitosha Blvd"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Адрес (BG)' : 'Address (BG)'}</label>
                <input type="text" className="input" placeholder="напр. бул. Витоша 15"
                  value={form.address_bg} onChange={e => set('address_bg', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Телефон' : 'Phone'}</label>
              <input type="tel" className="input" value={form.phone}
                onChange={e => { set('phone', e.target.value); setPhoneError(validatePhone(e.target.value, lang)) }} />
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email <span className="text-red-400">*</span></label>
              <input type="email" required className="input" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" className="input" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Social media</p>
              <div className="flex flex-col gap-3">
                {[{ k: 'facebook_url', l: 'Facebook' }, { k: 'instagram_url', l: 'Instagram' }, { k: 'linkedin_url', l: 'LinkedIn' }].map(s => (
                  <div key={s.k} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16 shrink-0">{s.l}</span>
                    <input type="url" className="input" value={form[s.k]} onChange={e => set(s.k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <SaveBtn saving={saving} onSave={save} />
          </div>
        )}
        {tab === 'images' && (
          <div className="card flex flex-col gap-7">
            <ImageUpload label="Corporation logo" hint="JPG, PNG, WebP or SVG - Max 2MB - Square recommended" currentUrl={form.logo_url} bucket="corp-logos" entityId={corp.id} field="logo" wide={false} onUploaded={url => set('logo_url', url)} />
            <div className="border-t border-gray-100 pt-6">
              <ImageUpload label="Cover image" hint="JPG, PNG or WebP - Max 5MB - 1200x400px recommended" currentUrl={form.cover_url} bucket="corp-covers" entityId={corp.id} field="cover" wide={true} onUploaded={url => set('cover_url', url)} />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <SaveBtn saving={saving} onSave={save} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
