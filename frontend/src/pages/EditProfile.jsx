import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import AvatarUpload from '@/components/ui/AvatarUpload'

const BULGARIAN_CITIES = [
  'Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora',
  'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo',
  'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa',
  'Gabrovo', 'Vidin', 'Montana', 'Other',
]

const TABS_EN = [
  { id: 'personal', label: 'Personal info' },
  { id: 'security', label: 'Password & security' },
]
const TABS_BG = [
  { id: 'personal', label: 'Лична информация' },
  { id: 'security', label: 'Парола и сигурност' },
]

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-brand-400 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success'
        ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
      }
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

  // Personal info form
  const [form, setForm] = useState({
    full_name: '', full_name_bg: '', phone: '',
    bio: '', bio_bg: '',
    city: '', city_bg: '',
    country_bg: '',
    preferred_language: 'en',
  })
  const [saving, setSaving] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        full_name_bg: profile.full_name_bg || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        bio_bg: profile.bio_bg || '',
        city: profile.city || '',
        city_bg: profile.city_bg || '',
        country_bg: profile.country_bg || '',
        preferred_language: profile.preferred_language || 'en',
      })
    }
  }, [profile])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }))

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({
        ...form,
        full_name_bg: form.full_name_bg || null,
        bio_bg: form.bio_bg || null,
        city_bg: form.city_bg || null,
        country_bg: form.country_bg || null,
      })
      setToast({ message: 'Profile saved successfully', type: 'success' })
    } catch (err) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) {
      setToast({ message: 'Passwords do not match', type: 'error' }); return
    }
    if (pwForm.password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters', type: 'error' }); return
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setPwForm({ current: '', password: '', confirm: '' })
      setToast({ message: 'Password updated successfully', type: 'success' })
    }
    setPwSaving(false)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/profile" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-medium text-gray-900">Edit profile</h1>
          <p className="text-sm text-gray-500">Update your personal information and account settings</p>
        </div>
      </div>

      {/* Avatar upload */}
      <div className="card mb-6 flex flex-col sm:flex-row items-center gap-6">
        <AvatarUpload size="lg" />
        <div className="min-w-0 text-center sm:text-left">
          <p className="font-medium text-gray-900 truncate">{profile?.full_name || lang === 'bg' ? 'Не е зададено' : 'No name set'}</p>
          <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
          <span className="text-xs text-brand-400 font-medium capitalize">
            {profile?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-6 gap-1">
        {(lang === 'bg' ? TABS_BG : TABS_EN).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-brand-400 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal info tab */}
      {tab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="card flex flex-col gap-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.full_name')} (EN)</label>
              <input type="text" required className="input"
                placeholder="Maria Kostadinova"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.full_name')} (BG)</label>
              <input type="text" className="input"
                placeholder="Мария Костадинова"
                value={form.full_name_bg} onChange={e => set('full_name_bg', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.phone')}</label>
              <input type="tel" className="input"
                placeholder="+359 88 123 4567"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.city')}</label>
            <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
              <option value="">Select your city</option>
              {BULGARIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (EN) <span className="text-gray-400 font-normal">— visible to organizations</span></label>
              <textarea rows={4} className="input resize-none"
                placeholder="Describe your skills, interests and the causes you care about..."
                maxLength={500}
                value={form.bio} onChange={e => set('bio', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Биография (BG) <span className="text-gray-400 font-normal">— видима за организациите</span></label>
              <textarea rows={4} className="input resize-none"
                placeholder="Опишете уменията, интересите и каузите, които ви вълнуват..."
                maxLength={500}
                value={form.bio_bg} onChange={e => set('bio_bg', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.bio_bg.length}/500</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country (BG) — Държава (BG)</label>
            <input type="text" className="input" placeholder="напр. България"
              value={form.country_bg} onChange={e => set('country_bg', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred language</label>
            <div className="flex gap-3">
              {[{ value: 'en', label: '🇬🇧 English' }, { value: 'bg', label: '🇧🇬 Български' }].map(lang => (
                <label key={lang.value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium flex-1 justify-center ${
                    form.preferred_language === lang.value
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}>
                  <input type="radio" name="lang" value={lang.value} className="sr-only"
                    checked={form.preferred_language === lang.value}
                    onChange={() => set('preferred_language', lang.value)} />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <Link to="/dashboard/profile" className="btn-secondary text-sm">Cancel</Link>
            <button type="submit" disabled={saving}
              className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* Password tab */}
      {tab === 'security' && (
        <form onSubmit={handleChangePassword} className="card flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Change password</h3>
            <p className="text-xs text-gray-500">Choose a strong password with at least 8 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required className="input pr-10"
                placeholder={lang === 'bg' ? 'Мин. 8 символа' : 'Min. 8 characters'}
                value={pwForm.password} onChange={e => setPw('password', e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            {/* Strength bar */}
            {pwForm.password && (
              <div className="flex gap-1 mt-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${
                    pwForm.password.length >= i * 3
                      ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-brand-300' : 'bg-brand-500'
                      : 'bg-gray-100'
                  }`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input type={showPw ? 'text' : 'password'} required className={`input ${
              pwForm.confirm && pwForm.password !== pwForm.confirm ? 'border-red-300 focus:ring-red-400' : ''
            }`}
              placeholder={lang === 'bg' ? 'Повторете новата парола' : 'Repeat your new password'}
              value={pwForm.confirm} onChange={e => setPw('confirm', e.target.value)} />
            {pwForm.confirm && pwForm.password !== pwForm.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 flex gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>You will remain logged in on this device after changing your password.</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setPwForm({ current: '', password: '', confirm: '' })}
              className="btn-secondary text-sm">Clear</button>
            <button type="submit" disabled={pwSaving}
              className="btn-primary flex items-center gap-2">
              {pwSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {pwSaving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
