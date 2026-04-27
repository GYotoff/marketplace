import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { validatePhone } from '@/lib/validators'
import { validateFullName } from '@/lib/validators'
import AvatarUpload from '@/components/ui/AvatarUpload'
import CountryCitySelector, { validateCountryCity } from '@/components/ui/CountryCitySelector'

const BULGARIAN_CITIES = [
  'Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven',
  'Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik',
  'Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Other',
]

const AVAILABILITY_OPTIONS = [
  { key: 'weekdays',  en: 'Weekdays',  bg: 'Делнични дни' },
  { key: 'weekends',  en: 'Weekends',  bg: 'Уикенди' },
  { key: 'mornings',  en: 'Mornings',  bg: 'Сутрини' },
  { key: 'evenings',  en: 'Evenings',  bg: 'Вечери' },
]

const GENDER_OPTIONS = [
  { key: 'male',            en: 'Male',              bg: 'Мъж' },
  { key: 'female',          en: 'Female',            bg: 'Жена' },
  { key: 'non_binary',      en: 'Non-binary',        bg: 'Небинарен' },
  { key: 'prefer_not_to_say', en: 'Prefer not to say', bg: 'Предпочитам да не казвам' },
]

const ROLE_LABEL = {
  volunteer: { en: 'Volunteer', bg: 'Доброволец' },
  org_admin: { en: 'Organization admin', bg: 'Администратор на организация' },
  corp_admin: { en: 'Corporation admin', bg: 'Администратор на корпорация' },
  super_admin: { en: 'Platform admin', bg: 'Администратор на платформата' },
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === 'success' ? 'bg-brand-400 text-white' : 'bg-red-500 text-white'}`}>
      {message}
    </div>
  )
}

export default function EditProfile() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user, profile, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('personal')
  const [toast, setToast] = useState(null)
  const flash = (msg, type = 'success') => setToast({ msg, type })

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: '', full_name_bg: '', phone: '',
    bio: '', bio_bg: '',
    city: '', city_bg: '', country: '', country_bg: '',
    birth_year: '', gender: '',
    availability: [],
    skills: '', skills_bg: '',
    facebook_url: '', instagram_url: '', linkedin_url: '',
  })
  const [pwForm, setPwForm] = useState({ current: '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [phoneError, setPhoneError] = useState(null)
  const [fullnameError, setFullNameError] = useState(null)
  const [ccErrors, setCcErrors]       = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState([])
  const mediaRef = useRef()

  // Populate form ONLY on initial mount or user change.
  // Using a ref guard prevents the Realtime subscription from resetting
  // the form mid-edit (which caused the save loop).
  const formInitialized = useRef(false)
  useEffect(() => {
    if (!profile) return
    if (formInitialized.current) return   // already populated — don't overwrite edits
    formInitialized.current = true
    setForm({
      full_name: profile.full_name || '', full_name_bg: profile.full_name_bg || '',
      phone: profile.phone || '',
      bio: profile.bio || '', bio_bg: profile.bio_bg || '',
      city: profile.city || '', city_bg: profile.city_bg || '', country: profile.country || '', country_bg: profile.country_bg || '',
      birth_year: profile.birth_year || '',
      gender: profile.gender || '',
      availability: profile.availability || [],
      skills: profile.skills || '', skills_bg: profile.skills_bg || '',
      facebook_url: profile.facebook_url || '',
      instagram_url: profile.instagram_url || '',
      linkedin_url: profile.linkedin_url || '',
    })
    setMediaLibrary(profile.media_library || [])
  }, [profile?.id])

  // Reset the guard when user changes (logout/login as different user)
  useEffect(() => { formInitialized.current = false }, [user?.id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAvailability = (key) => setForm(f => ({
    ...f,
    availability: f.availability.includes(key)
      ? f.availability.filter(k => k !== key)
      : [...f.availability, key],
  }))

  // ── Save personal info ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    // Always read user id from store directly to avoid stale closures
    const currentUser = useAuthStore.getState().user
    if (!currentUser?.id) {
      flash(lang === 'bg' ? 'Не сте влезли в профила си' : 'Not authenticated', 'error')
      return
    }
    setSaving(true)
    try {
          const phoneErr = validatePhone(form.phone, lang)
    if (phoneErr) { flash(phoneErr, 'error'); return }
      const nameErr = validateFullName(form.full_name, lang)
    if (nameErr) { flash(nameErr, 'error'); return }
    const ccErr = validateCountryCity({ countryEN: form.country, countryBG: form.country_bg, cityEN: form.city, cityBG: form.city_bg }, lang)
    if (Object.keys(ccErr).length) { setCcErrors(ccErr); flash(lang === 'bg' ? 'Моля попълнете държавата и града.' : 'Please fill in country and city.', 'error'); return }
    setCcErrors({})
    const updates = {
        full_name:     form.full_name     || null,
        full_name_bg:  form.full_name_bg  || null,
        phone:         form.phone         || null,
        bio:           form.bio           || null,
        bio_bg:        form.bio_bg        || null,
        city:          form.city       || null,
        city_bg:       form.city_bg    || null,
        country:       form.country     || null,
        country_bg:    form.country_bg  || null,
        birth_year:    form.birth_year    ? parseInt(form.birth_year) : null,
        gender:        form.gender        || null,
        availability:  form.availability,
        skills:        form.skills        || null,
        skills_bg:     form.skills_bg     || null,
        facebook_url:  form.facebook_url  || null,
        instagram_url: form.instagram_url || null,
        linkedin_url:  form.linkedin_url  || null,
      }
      const { error: upErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
      if (upErr) throw upErr
      // Fetch fresh data to sync ViewProfile without resetting the edit form
      const { data: fresh } = await supabase
        .from('profiles').select('*').eq('id', currentUser.id).single()
      if (fresh) {
        // Bypass formInitialized guard — update store directly
        useAuthStore.setState({ profile: fresh })
      }
      flash(lang === 'bg' ? 'Профилът е запазен' : 'Profile saved')
    } catch (e) {
      flash(e.message || String(e), 'error')
    }
    setSaving(false)
  }

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (pwForm.password !== pwForm.confirm) { flash(lang === 'bg' ? 'Паролите не съвпадат' : 'Passwords do not match', 'error'); return }
    if (pwForm.password.length < 8) { flash(lang === 'bg' ? 'Паролата трябва да е поне 8 символа' : 'Password must be at least 8 characters', 'error'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    if (error) flash(error.message, 'error')
    else { flash(lang === 'bg' ? 'Паролата е сменена' : 'Password changed'); setPwForm({ current: '', password: '', confirm: '' }) }
    setPwSaving(false)
  }

  // ── Media library ──────────────────────────────────────────────────────────
  const uploadMedia = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 20 - mediaLibrary.length
    const toUpload = files.slice(0, remaining)
    const urls = []
    for (const file of toUpload) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('volunteer-media').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('volunteer-media').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    const newLibrary = [...mediaLibrary, ...urls]
    setMediaLibrary(newLibrary)
    await supabase.from('profiles').update({ media_library: newLibrary }).eq('id', user.id)
    flash(lang === 'bg' ? 'Снимките са качени' : 'Photos uploaded')
  }

  const removeMedia = async (url) => {
    const newLibrary = mediaLibrary.filter(u => u !== url)
    setMediaLibrary(newLibrary)
    await supabase.from('profiles').update({ media_library: newLibrary }).eq('id', user.id)
  }

  if (!profile) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const displayName = (lang === 'bg' ? (profile.full_name_bg || profile.full_name) : profile.full_name) || (lang === 'bg' ? 'Не е зададено' : 'No name set')
  const roleLabel = ROLE_LABEL[profile.role]?.[lang] || profile.role

  const TABS = [
    { id: 'personal', label: lang === 'bg' ? 'Лична информация' : 'Personal info' },
    { id: 'skills',   label: lang === 'bg' ? 'Умения и профили' : 'Skills & social' },
    { id: 'media',    label: lang === 'bg' ? 'Медийна библиотека' : 'Media library' },
    { id: 'security', label: lang === 'bg' ? 'Парола' : 'Password' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/profile" className="text-sm text-gray-400 hover:text-gray-600">
          ← {lang === 'bg' ? 'Моят профил' : 'My profile'}
        </Link>
      </div>

      {/* Header card */}
      <div className="card flex items-center gap-4 mb-6">
        <AvatarUpload lang={lang} />
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-sm text-gray-500 truncate">{profile.email}</p>
          <span className="text-xs text-brand-400 font-medium">{roleLabel}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-gray-100 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ' +
              (tab === t.id ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Personal info ── */}
      {tab === 'personal' && (
        <div className="card flex flex-col gap-5">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Пълно име (EN)' : 'Full name (EN)'}</label>
              <input type="text" className="input" placeholder="Maria Kostadinova"
                value={form.full_name}
                onChange={e => { set('full_name', e.target.value); setFullNameError(validateFullName(e.target.value, lang))}} />
                {fullnameError && <p className="text-xs text-red-500 mt-1">{fullnameError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Пълно име (BG)' : 'Full name (BG)'}</label>
              <input type="text" className="input" placeholder="Мария Костадинова"
                value={form.full_name_bg} onChange={e => set('full_name_bg', e.target.value) } />
            </div>
          </div>

          {/* Birth year + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Година на раждане' : 'Year of birth'}</label>
              <input type="number" className="input" placeholder="1990" min="1920" max={new Date().getFullYear() - 16}
                value={form.birth_year} onChange={e => set('birth_year', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Пол' : 'Gender'}</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">{lang === 'bg' ? 'Изберете' : 'Select'}</option>
                {GENDER_OPTIONS.map(g => <option key={g.key} value={g.key}>{lang === 'bg' ? g.bg : g.en}</option>)}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Телефон' : 'Phone'}</label>
            <input type="tel" className="input" placeholder="+359 88 123 4567"
              value={form.phone}
              onChange={e => { set('phone', e.target.value); setPhoneError(validatePhone(e.target.value, lang)) }} />
            {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
          </div>

          {/* Country + City via shared component */}
          <CountryCitySelector
            countryEN={form.country}
            countryBG={form.country_bg}
            cityEN={form.city}
            cityBG={form.city_bg}
            lang={lang}
            errors={ccErrors}
            onChange={({ countryEN, countryBG, cityEN, cityBG }) => {
              set('country', countryEN)
              set('country_bg', countryBG)
              set('city', cityEN)
              set('city_bg', cityBG)
              setCcErrors({})
            }}
          />

          {/* Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (EN)</label>
              <textarea rows={4} className="input resize-none" maxLength={500}
                placeholder="Describe your skills, interests and the causes you care about..."
                value={form.bio} onChange={e => set('bio', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Биография (BG)</label>
              <textarea rows={4} className="input resize-none" maxLength={500}
                placeholder="Опишете уменията, интересите и каузите..."
                value={form.bio_bg} onChange={e => set('bio_bg', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.bio_bg.length}/500</p>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'bg' ? 'Наличност' : 'Availability'}</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map(a => (
                <button key={a.key} type="button"
                  onClick={() => toggleAvailability(a.key)}
                  className={'text-sm px-3 py-1.5 rounded-lg border-2 transition-colors ' +
                    (form.availability.includes(a.key)
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200')}>
                  {lang === 'bg' ? a.bg : a.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <Link to="/dashboard/profile" className="btn-secondary">{lang === 'bg' ? 'Отказ' : 'Cancel'}</Link>
            <button type="button" onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? (lang === 'bg' ? 'Запазване...' : 'Saving...') : (lang === 'bg' ? 'Запази' : 'Save changes')}
            </button>
          </div>
        </div>
      )}

      {/* ── Skills & Social ── */}
      {tab === 'skills' && (
        <div className="card flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Умения (EN)' : 'Skills (EN)'}</label>
              <textarea rows={3} className="input resize-none"
                placeholder="e.g. First aid, Photography, Teaching, Gardening"
                value={form.skills} onChange={e => set('skills', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{lang === 'bg' ? 'Разделете с запетая' : 'Separate with commas'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Умения (BG)' : 'Skills (BG)'}</label>
              <textarea rows={3} className="input resize-none"
                placeholder="напр. Първа помощ, Фотография, Преподаване"
                value={form.skills_bg} onChange={e => set('skills_bg', e.target.value)} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">{lang === 'bg' ? 'Социални мрежи' : 'Social networks'}</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">f</span>
                <input type="url" className="input flex-1" placeholder="https://facebook.com/yourprofile"
                  value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">📷</span>
                <input type="url" className="input flex-1" placeholder="https://instagram.com/yourprofile"
                  value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">in</span>
                <input type="url" className="input flex-1" placeholder="https://linkedin.com/in/yourprofile"
                  value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <Link to="/dashboard/profile" className="btn-secondary">{lang === 'bg' ? 'Отказ' : 'Cancel'}</Link>
            <button type="button" onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? (lang === 'bg' ? 'Запазване...' : 'Saving...') : (lang === 'bg' ? 'Запази' : 'Save changes')}
            </button>
          </div>
        </div>
      )}

      {/* ── Media library ── */}
      {tab === 'media' && (
        <div className="card flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">{lang === 'bg' ? 'Медийна библиотека' : 'Media library'}</p>
            <p className="text-xs text-gray-400 mb-4">{lang === 'bg' ? `Снимки от доброволчески събития (${mediaLibrary.length}/20)` : `Photos from volunteering events (${mediaLibrary.length}/20)`}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {mediaLibrary.map((url, i) => (
                <div key={i} className="relative group w-24 h-24">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button type="button" onClick={() => removeMedia(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
              {mediaLibrary.length < 20 && (
                <button type="button" onClick={() => mediaRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 text-2xl hover:border-brand-300 hover:text-brand-400 flex items-center justify-center transition-colors">
                  +
                </button>
              )}
            </div>
            <input ref={mediaRef} type="file" accept="image/*" multiple className="hidden" onChange={uploadMedia} />
            {mediaLibrary.length >= 20 && <p className="text-xs text-amber-600">{lang === 'bg' ? 'Достигнато е максималното количество (20).' : 'Maximum 20 photos reached.'}</p>}
          </div>
        </div>
      )}

      {/* ── Password ── */}
      {tab === 'security' && (
        <div className="card flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Нова парола' : 'New password'}</label>
            <input type="password" className="input"
              value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Потвърдете паролата' : 'Confirm password'}</label>
            <input type="password" className="input"
              value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <Link to="/dashboard/profile" className="btn-secondary">{lang === 'bg' ? 'Отказ' : 'Cancel'}</Link>
            <button type="button" onClick={handleChangePassword} disabled={pwSaving} className="btn-primary flex items-center gap-2">
              {pwSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {pwSaving ? (lang === 'bg' ? 'Запазване...' : 'Saving...') : (lang === 'bg' ? 'Смени паролата' : 'Change password')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
