import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import CountryCitySelector, { validateCountryCity } from '@/components/ui/CountryCitySelector'
import { validatePhone } from '@/lib/validators'
import { useAuthStore } from '@/store/authStore'

const STEPS = ['Account', 'Corporation', 'Contact', 'Review']

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Manufacturing',
  'Retail & E-commerce', 'Energy & Environment', 'Construction & Real Estate',
  'Media & Entertainment', 'Transportation & Logistics', 'Food & Beverage',
  'Consulting & Professional Services', 'Telecommunications', 'Other',
]

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${i < current ? 'bg-brand-400 text-white' : i === current ? 'bg-brand-400 text-white ring-4 ring-brand-100' : 'bg-gray-100 text-gray-400'}`}>
              {i < current
                ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mb-4 ${i < current ? 'bg-brand-400' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  )
}


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

export default function RegisterCorporation() {
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [error, setError] = useState('')
  const [ccErrors, setCcErrors] = useState({})
  const [uicCorpError, setUicCorpError] = useState(null)
  const [phoneCorpError, setPhoneCorpError] = useState(null)
  const [done, setDone] = useState(false)

  const [account, setAccount] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const CORP_SIZES = [
  { value: 'micro',             label: 'Micro (1–10 employees)' },
  { value: 'small',             label: 'Small (11–50 employees)' },
  { value: 'medium',            label: 'Medium (51–200 employees)' },
  { value: 'large',             label: 'Large (501–1 000 employees)' },
  { value: 'enterprise',        label: 'Enterprise (1 001–5 000 employees)' },
  { value: 'global_enterprise', label: 'Global Enterprise (5 000+)' },
]

const [corp, setCorp] = useState({ name: '', industry: '', size: '', tagline: '', tagline_bg: '', description: '', description_bg: '', founded_year: '', registration_number: '', website: '' })
  const [contact, setContact] = useState({ country: 'Bulgaria', country_bg: 'България', city: '', city_bg: '', address: '', address_bg: '', email: '', phone: '', facebook_url: '', instagram_url: '', linkedin_url: '' })

  const setA = (k, v) => setAccount(p => ({ ...p, [k]: v }))
  const setC = (k, v) => setCorp(p => ({ ...p, [k]: v }))
  const setT = (k, v) => setContact(p => ({ ...p, [k]: v }))

  const validate = () => {
    setError('')
    if (step === 0 && !user) {
      if (!account.full_name.trim()) { setError('Full name is required'); return false }
      if (!account.email.trim()) { setError('Email is required'); return false }
      if (account.password.length < 8) { setError('Password must be at least 8 characters'); return false }
      if (account.password !== account.confirm) { setError('Passwords do not match'); return false }
    }
    if (step === 1) {
      if (!corp.name.trim()) { setError('Corporation name is required'); return false }
      if (!corp.description.trim()) { setError('Description is required'); return false }
    }
    if (step === 2) {
      if (!contact.city) { setError('City is required'); return false }
            const phoneErr = validatePhone(contact.phone, lang)
      if (phoneErr) { setError(phoneErr); return false }
    const uicErr = validateUIC(corp.registration_number, lang)
      if (uicErr) { setError(uicErr); return false }
      if (!contact.email.trim()) { setError('Contact email is required'); return false }
    }
    return true
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => { setError(''); setStep(s => s - 1) }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: { data: { full_name: account.full_name, role: 'corp_admin' } },
        })
        if (authError) throw new Error('Account creation failed: ' + authError.message)
        if (!authData.user) throw new Error('Account creation failed')
        await new Promise(r => setTimeout(r, 1000))
      }

      const { error: rpcError } = await supabase.rpc('register_corporation', {
        p_name: corp.name,
        p_name_bg: corp.name_bg || null,
        p_slug: slugify(corp.name),
        p_industry: corp.industry || null,
        p_size: corp.size || null,
        p_description: corp.description,
        p_description_bg: corp.description_bg || null,
        p_tagline: corp.tagline || null,
        p_tagline_bg: corp.tagline_bg || null,
        p_founded_year: corp.founded_year ? parseInt(corp.founded_year) : null,
        p_registration_number: corp.registration_number || null,
        p_country: contact.country || null,
        p_country_bg: contact.country_bg || null,
        p_city: contact.city,
        p_city_bg: contact.city_bg || null,
        p_address: contact.address || null,
        p_address_bg: contact.address_bg || null,
        p_website: corp.website || null,
        p_email: contact.email,
        p_phone: contact.phone || null,
        p_facebook_url: contact.facebook_url || null,
        p_instagram_url: contact.instagram_url || null,
        p_linkedin_url: contact.linkedin_url || null,
      })
      if (rpcError) throw new Error('Corporation creation failed: ' + rpcError.message)
      setDone(true)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Registration submitted!</h2>
          <p className="text-sm text-gray-500 mb-2">Your corporation <strong>{corp.name}</strong> has been submitted for review.</p>
          <p className="text-sm text-gray-400 mb-6">A portal administrator will review and notify you by email within 1-2 business days.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary">Back to home</Link>
            {user && <Link to="/dashboard" className="btn-primary">My dashboard</Link>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900">Register your corporation</h1>
          <p className="text-sm text-gray-500 mt-1">Your registration will be reviewed before going live</p>
        </div>
        <StepIndicator current={step} />
        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Your account</h2>
                <p className="text-sm text-gray-500">You will be the administrator of this corporation.</p>
              </div>
              {user ? (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <div>
                    <p className="text-sm font-medium text-brand-700">Signed in as {user.email}</p>
                    <p className="text-xs text-brand-500">You will be set as the corporation admin.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <input type="text" className="input" placeholder="Maria Kostadinova" value={account.full_name} onChange={e => setA('full_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input type="email" className="input" placeholder="you@company.com" value={account.email} onChange={e => setA('email', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <input type="password" className="input" placeholder="Min. 8 characters" value={account.password} onChange={e => setA('password', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                      <input type="password" className="input" placeholder="Repeat password" value={account.confirm} onChange={e => setA('confirm', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Corporation details</h2>
                <p className="text-sm text-gray-500">Basic information about your company.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Corporation name <span className="text-red-400">*</span></label>
                <input type="text" className="input" placeholder="Acme Bulgaria Ltd." value={corp.name} onChange={e => setC('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                  <select className="input" value={corp.industry} onChange={e => setC('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Founded year</label>
                  <input type="number" className="input" placeholder="2010" min="1900" max={new Date().getFullYear()} value={corp.founded_year} onChange={e => setC('founded_year', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company size</label>
                <select className="input" value={corp.size} onChange={e => setC('size', e.target.value)}>
                  <option value="">Select size</option>
                  {CORP_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
                <input type="text" className="input" placeholder="A short slogan or mission" value={corp.tagline} onChange={e => setC('tagline', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English) <span className="text-red-400">*</span></label>
                <textarea rows={4} className="input resize-none" placeholder="Describe your company and CSR goals..." value={corp.description} onChange={e => setC('description', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Bulgarian)</label>
                <textarea rows={3} className="input resize-none" placeholder="Описание на компанията на български..." value={corp.description_bg} onChange={e => setC('description_bg', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration number</label>
                <input type="text" className="input" placeholder="UIC / Булстат"
                  value={corp.registration_number}
                  onChange={e => { setC('registration_number', e.target.value); setUicCorpError(validateUIC(e.target.value, lang)) }} />
                {uicCorpError && <p className="text-xs text-red-500 mt-1">{uicCorpError}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Contact information</h2>
                <p className="text-sm text-gray-500">How partners and volunteers can reach you.</p>
              </div>
              <CountryCitySelector
                countryEN={contact.country || 'Bulgaria'}
                countryBG={contact.country_bg || 'България'}
                cityEN={contact.city}
                cityBG={contact.city_bg}
                lang={lang}
                errors={ccErrors}
                onChange={({ countryEN, countryBG, cityEN, cityBG }) => {
                  setT('country', countryEN); setT('country_bg', countryBG)
                  setT('city', cityEN);       setT('city_bg', cityBG)
                  setCcErrors({})
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'bg' ? 'Телефон' : 'Phone'}</label>
                <input type="tel" className="input" placeholder="+359 2 123 4567" value={contact.phone}
                  onChange={e => { setT('phone', e.target.value); setPhoneCorpError(validatePhone(e.target.value, lang)) }} />
                {phoneCorpError && <p className="text-xs text-red-500 mt-1">{phoneCorpError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input type="text" className="input" placeholder="Street address" value={contact.address} onChange={e => setT('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email <span className="text-red-400">*</span></label>
                <input type="email" className="input" placeholder="contact@company.com" value={contact.email} onChange={e => setT('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                <input type="url" className="input" placeholder="https://yourcompany.com" value={corp.website} onChange={e => setC('website', e.target.value)} />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Social media</p>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'facebook_url', label: 'Facebook', ph: 'https://facebook.com/yourcompany' },
                    { key: 'instagram_url', label: 'Instagram', ph: 'https://instagram.com/yourcompany' },
                    { key: 'linkedin_url', label: 'LinkedIn', ph: 'https://linkedin.com/company/yourcompany' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16 shrink-0">{s.label}</span>
                      <input type="url" className="input" placeholder={s.ph} value={contact[s.key]} onChange={e => setT(s.key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Review your registration</h2>
                <p className="text-sm text-gray-500">Please check everything before submitting.</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <span>Your registration will be <strong>pending review</strong> until approved by a portal administrator.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Corporation', value: corp.name },
                  { label: 'Industry', value: corp.industry || '-' },
                  { label: 'Size', value: corp.size ? CORP_SIZES.find(s => s.value === corp.size)?.label || corp.size : '-' },
                  { label: 'City', value: contact.city },
                  { label: 'Contact email', value: contact.email },
                  { label: 'Website', value: corp.website || '-' },
                  { label: 'Admin', value: user ? user.email : account.email },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{f.value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div>{step > 0 && <button type="button" onClick={back} className="btn-secondary">Back</button>}</div>
            <div>
              {step < STEPS.length - 1
                ? <button type="button" onClick={next} className="btn-primary">Continue</button>
                : (
                  <button type="button" onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? 'Submitting...' : 'Submit registration'}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
