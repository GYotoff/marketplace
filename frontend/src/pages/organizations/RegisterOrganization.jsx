import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STEPS = ['Account', 'Organization', 'Contact', 'Review']

const BULGARIAN_CITIES = [
  'Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven',
  'Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik',
  'Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Other',
]

const ORG_TYPES = [
  { value: 'ngo', label: 'NGO (Non-governmental organization)' },
  { value: 'nonprofit', label: 'Non-profit organization' },
  { value: 'other', label: 'Other civil society entity' },
]

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i < current ? 'bg-brand-400 text-white' :
              i === current ? 'bg-brand-400 text-white ring-4 ring-brand-100' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < current
                ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                : i + 1
              }
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mb-4 transition-colors ${i < current ? 'bg-brand-400' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function RegisterOrganization() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Admin account data (only if not logged in)
  const [account, setAccount] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
  })

  // Organization data
  const [org, setOrg] = useState({
    name: '', type: 'ngo', description: '', description_bg: '',
    tagline: '', founded_year: '', registration_number: '',
    city: '', address: '', website: '',
    email: '', phone: '',
    facebook_url: '', instagram_url: '', linkedin_url: '',
  })

  const setA = (k, v) => setAccount(f => ({ ...f, [k]: v }))
  const setO = (k, v) => setOrg(f => ({ ...f, [k]: v }))

  const slugify = (text) => text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)

  const validateStep = () => {
    setError('')
    if (step === 0 && !user) {
      if (!account.full_name.trim()) { setError('Full name is required'); return false }
      if (!account.email.trim()) { setError('Email is required'); return false }
      if (account.password.length < 8) { setError('Password must be at least 8 characters'); return false }
      if (account.password !== account.confirm_password) { setError('Passwords do not match'); return false }
    }
    if (step === 1) {
      if (!org.name.trim()) { setError('Organization name is required'); return false }
      if (!org.description.trim()) { setError('Description is required'); return false }
    }
    if (step === 2) {
      if (!org.city) { setError('City is required'); return false }
      if (!org.email.trim()) { setError('Contact email is required'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const prev = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      let adminId = user?.id
      let adminEmail = user?.email

      // Step 1: Create account if not logged in
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: { data: { full_name: account.full_name, role: 'org_admin' } },
        })
        if (authError) throw new Error('Account creation failed: ' + authError.message)
        if (!authData.user) throw new Error('Account creation failed: no user returned')
        adminId = authData.user.id
        adminEmail = account.email

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: adminId,
          email: adminEmail,
          full_name: account.full_name,
          role: 'org_admin',
        }, { onConflict: 'id' })
        if (profileError) throw new Error('Profile creation failed: ' + profileError.message)
      } else {
        const { error: roleError } = await supabase.from('profiles')
          .update({ role: 'org_admin' }).eq('id', adminId)
        if (roleError) throw new Error('Role update failed: ' + roleError.message)
      }

      // Step 2: Create organization (status: pending)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: org.name,
          slug: slugify(org.name),
          type: org.type,
          description: org.description,
          description_bg: org.description_bg || null,
          tagline: org.tagline || null,
          founded_year: org.founded_year ? parseInt(org.founded_year) : null,
          registration_number: org.registration_number || null,
          city: org.city,
          address: org.address || null,
          website: org.website || null,
          email: org.email,
          phone: org.phone || null,
          facebook_url: org.facebook_url || null,
          instagram_url: org.instagram_url || null,
          linkedin_url: org.linkedin_url || null,
          status: 'pending',
          created_by: adminId,
        })
        .select()
        .single()

      if (orgError) throw new Error('Organization creation failed: ' + orgError.message)
      if (!orgData) throw new Error('Organization creation failed: no data returned')

      // Step 3: Add creator as org admin member
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: orgData.id,
        profile_id: adminId,
        role: 'admin',
        request_status: 'approved',
      })
      if (memberError) throw new Error('Member creation failed: ' + memberError.message)

      setDone(true)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Registration submitted!</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Your organization <strong>{org.name}</strong> has been submitted for review.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          A portal administrator will review your application and notify you by email. This usually takes 1–2 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-secondary">Back to home</Link>
          {user && <Link to="/dashboard" className="btn-primary">My dashboard</Link>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-gray-900">Register your organization</h1>
          <p className="text-sm text-gray-500 mt-1">Your registration will be reviewed by our team before going live</p>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg mb-5 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          {/* STEP 0 — Admin account */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Your account</h2>
                <p className="text-sm text-gray-500">You will be the administrator of this organization.</p>
              </div>
              {user ? (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <div>
                    <p className="text-sm font-medium text-brand-700">Signed in as {user.email}</p>
                    <p className="text-xs text-brand-500">You will be set as the organization admin.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <input type="text" required className="input" placeholder="Maria Kostadinova"
                      value={account.full_name} onChange={e => setA('full_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <input type="email" required className="input" placeholder="you@organization.org"
                      value={account.email} onChange={e => setA('email', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                      <input type="password" required className="input" placeholder="Min. 8 characters"
                        value={account.password} onChange={e => setA('password', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                      <input type="password" required className="input" placeholder="Repeat password"
                        value={account.confirm_password} onChange={e => setA('confirm_password', e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Already have an account? <Link to="/login" className="text-brand-400">Sign in first</Link> then return here.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Organization details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Organization details</h2>
                <p className="text-sm text-gray-500">Basic information about your organization.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization name <span className="text-red-400">*</span></label>
                <input type="text" required className="input" placeholder="Green Future Bulgaria"
                  value={org.name} onChange={e => setO('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type <span className="text-red-400">*</span></label>
                  <select className="input" value={org.type} onChange={e => setO('type', e.target.value)}>
                    {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Founded year</label>
                  <input type="number" className="input" placeholder="2015" min="1900" max={new Date().getFullYear()}
                    value={org.founded_year} onChange={e => setO('founded_year', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
                <input type="text" className="input" placeholder="A short slogan or mission statement"
                  value={org.tagline} onChange={e => setO('tagline', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English) <span className="text-red-400">*</span></label>
                <textarea rows={4} className="input resize-none" placeholder="Describe your organization, mission and activities..."
                  value={org.description} onChange={e => setO('description', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Bulgarian)</label>
                <textarea rows={3} className="input resize-none" placeholder="Описание на организацията на български..."
                  value={org.description_bg} onChange={e => setO('description_bg', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration number</label>
                <input type="text" className="input" placeholder="UIC / Булстат"
                  value={org.registration_number} onChange={e => setO('registration_number', e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 2 — Contact info */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Contact information</h2>
                <p className="text-sm text-gray-500">How volunteers and partners can reach you.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-400">*</span></label>
                  <select className="input" value={org.city} onChange={e => setO('city', e.target.value)}>
                    <option value="">Select city</option>
                    {BULGARIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" className="input" placeholder="+359 2 123 4567"
                    value={org.phone} onChange={e => setO('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <input type="text" className="input" placeholder="Street address"
                  value={org.address} onChange={e => setO('address', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email <span className="text-red-400">*</span></label>
                <input type="email" required className="input" placeholder="contact@organization.org"
                  value={org.email} onChange={e => setO('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                <input type="url" className="input" placeholder="https://yourorganization.org"
                  value={org.website} onChange={e => setO('website', e.target.value)} />
              </div>
              <div className="pt-2 border-t border-gray-100">
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
                        value={org[s.key]} onChange={e => setO(s.key, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-1">Review your registration</h2>
                <p className="text-sm text-gray-500">Please check everything before submitting.</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                <span>Your registration will be <strong>pending review</strong> until approved by a portal administrator. You will be notified by email.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Organization', value: org.name },
                  { label: 'Type', value: ORG_TYPES.find(t => t.value === org.type)?.label },
                  { label: 'City', value: org.city },
                  { label: 'Contact email', value: org.email },
                  { label: 'Website', value: org.website || '—' },
                  { label: 'Admin', value: user ? user.email : account.email },
                ].map(f => (
                  <div key={f.label} className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div>
              {step > 0 && (
                <button type="button" onClick={prev} className="btn-secondary">← Back</button>
              )}
            </div>
            <div>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="btn-primary">Continue →</button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="btn-primary flex items-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Submitting...' : 'Submit registration'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">
          Already registered? <Link to="/login" className="text-brand-400">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
