import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { validateFullName } from '@/lib/validators'

const ROLES = [
  {
    value: 'volunteer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
    color: 'brand',
    descKey: 'auth.role_volunteer_desc',
  },
  {
    value: 'org_admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
    ),
    color: 'blue',
    descKey: 'auth.role_org_desc',
  },
  {
    value: 'corp_admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
    color: 'amber',
    descKey: 'auth.role_corp_desc',
  },
]

const colorMap = {
  brand: { ring: 'border-brand-400 bg-brand-50', icon: 'bg-brand-100 text-brand-600', text: 'text-brand-700' },
  blue:  { ring: 'border-blue-400 bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700'  },
  amber: { ring: 'border-amber-400 bg-amber-50', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' },
}

const STEPS = ['role', 'details', 'confirm']
const STEPS_WITH_CORP = ['role', 'details', 'affiliation', 'confirm']

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ email: '', password: '', confirm_password: '', full_name: '', role: '', preferred_language: 'en', volunteer_type: 'freelancer', corporation_id: '' })
  const [corporations, setCorporations] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [fullnameError, setFullNameError] = useState(null)
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('corporations').select('id, name, city').eq('status', 'approved').eq('is_active', true).order('name')
      .then(({ data }) => setCorporations(data || []))
  }, [])

  const nextStep = () => { setError(''); setStep(s => s + 1) }
  const prevStep = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const authData = await register(form.email, form.password, form.full_name, form.role)
      // If volunteer chose a corporation, create a pending membership request
      if (form.role === 'volunteer' && form.volunteer_type === 'corporate' && form.corporation_id && authData?.user?.id) {
        await supabase.from('profiles').update({
          volunteer_type: 'corporate',
          corporation_id: form.corporation_id,
        }).eq('id', authData.user.id)
        await supabase.from('corporation_members').insert({
          corporation_id: form.corporation_id,
          profile_id: authData.user.id,
          role: 'employee',
          request_status: 'pending',
        })
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleLabels = {
    volunteer: t('auth.role_volunteer'),
    org_admin: t('auth.role_org'),
    corp_admin: t('auth.role_corp'),
  }

  // Success screen
  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account and get started.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 18 18" fill="none" className="w-7 h-7">
              <circle cx="9" cy="6" r="3" fill="white" opacity="0.9"/>
              <path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-gray-900">{t('auth.register_title')}</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Dataverte community</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                ${i < step ? 'bg-brand-400 text-white' : i === step ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i < step
                  ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-brand-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          {/* STEP 0: Choose role */}
          {step === 0 && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-1">{t('auth.role_label')}</h2>
              <p className="text-sm text-gray-500 mb-4">Choose the role that best describes you</p>
              <div className="flex flex-col gap-3">
                {ROLES.map(r => {
                  const c = colorMap[r.color]
                  const selected = form.role === r.value
                  return (
                    <button
                      key={r.value} type="button"
                      onClick={() => set('role', r.value)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                        ${selected ? c.ring : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selected ? c.icon : 'bg-gray-100 text-gray-500'}`}>
                        {r.icon}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${selected ? c.text : 'text-gray-900'}`}>{roleLabels[r.value]}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t(r.descKey)}</p>
                      </div>
                      {selected && (
                        <svg className={`w-5 h-5 ml-auto shrink-0 ${c.text}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => { if (!form.role) { setError('Please select a role.'); return } nextStep() }}
                className="btn-primary w-full mt-5"
              >
                Continue
              </button>
            </div>
          )}

          {/* STEP 1: Personal details */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Your details</h2>
                <p className="text-sm text-gray-500">Creating account as <strong>{roleLabels[form.role]}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.full_name')}</label>
                <input type="text" required className="input" placeholder="Maria Kostadinova"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
                <input type="email" required className="input" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required className="input pr-10" placeholder="Min. 8 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <input type="password" required className="input" placeholder="Repeat your password"
                  value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred language</label>
                <select className="input" value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}>
                  <option value="en">English</option>
                  <option value="bg">Български</option>
                </select>
              </div>
              <div className="flex gap-3 mt-1">
                <button onClick={prevStep} className="btn-secondary flex-1">Back</button>
                <button onClick={() => {
                  if (!form.full_name || !form.email || !form.password || !form.confirm_password) { setError('Please fill in all fields.'); return }
                  if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return }
                  if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
                  nextStep()
                }} className="btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* STEP 2: Review & submit */}

          {/* STEP 2 — Volunteer affiliation (volunteers only) */}
          {step === 2 && form.role === 'volunteer' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Your affiliation</h2>
                <p className="text-sm text-gray-500">Are you a freelance volunteer or part of a corporation's CSR program?</p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { value: 'freelancer', label: 'Freelance volunteer', desc: 'I volunteer independently, not as part of a company program.', icon: '🙋' },
                  { value: 'corporate', label: 'Corporate volunteer', desc: 'I am part of a corporation registered on Dataverte.', icon: '🏢' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => set('volunteer_type', opt.value)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${form.volunteer_type === opt.value ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                    <div>
                      <p className={`font-medium text-sm ${form.volunteer_type === opt.value ? 'text-brand-700' : 'text-gray-900'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {form.volunteer_type === 'corporate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select your corporation <span className="text-red-400">*</span></label>
                  {corporations.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No active corporations found.</p>
                  ) : (
                    <select className="input" value={form.corporation_id} onChange={e => set('corporation_id', e.target.value)}>
                      <option value="">Select a corporation...</option>
                      {corporations.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ''}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">Your membership request will be sent to the company admin for approval.</p>
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">Back</button>
                <button type="button" onClick={() => {
                  if (form.volunteer_type === 'corporate' && !form.corporation_id) {
                    setError('Please select your corporation.'); return
                  }
                  nextStep()
                }} className="btn-primary flex-1">Continue</button>
              </div>
            </div>
          )}

          {/* STEP 2 for non-volunteers / STEP 3 for volunteers */}
          {((step === 2 && form.role !== 'volunteer') || (step === 3 && form.role === 'volunteer')) && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Review your details</h2>
                <p className="text-sm text-gray-500">Make sure everything looks correct</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2.5">
                {[
                  { label: 'Role', value: roleLabels[form.role] },
                  { label: 'Name', value: form.full_name },
                  { label: 'Email', value: form.email },
                  { label: 'Language', value: form.preferred_language === 'en' ? 'English' : 'Български' },
                  ...(form.role === 'volunteer' ? [{ label: 'Affiliation', value: form.volunteer_type === 'corporate' ? `Corporate (${corporations.find(c => c.id === form.corporation_id)?.name || 'pending selection'})` : 'Freelance' }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                By creating an account you agree to our{' '}
                <Link to="/terms" className="text-brand-400 hover:underline">Terms of Use</Link> and{' '}
                <Link to="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Creating account...' : t('auth.register_btn')}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-600 font-medium">{t('auth.sign_in')}</Link>
        </p>
      </div>
    </div>
  )
}
