import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const ORG_TYPES = [
  { value: 'ngo',        label: 'NGO' },
  { value: 'nonprofit',  label: 'Non-profit' },
  { value: 'company',    label: 'Company' },
  { value: 'government', label: 'Government organization' },
  { value: 'education',  label: 'Education' },
  { value: 'investor',   label: 'Investor' },
  { value: 'other',      label: 'Other' },
]

const BULGARIAN_CITIES = [
  'Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven',
  'Sliven','Dobrich','Shumen','Pernik','Haskovo','Yambol','Pazardzhik',
  'Blagoevgrad','Veliko Tarnovo','Vratsa','Gabrovo','Vidin','Montana','Other',
]

const STATUS_BADGE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'edit',     label: 'Edit details' },
  { key: 'members',  label: 'Members' },
  { key: 'audit',    label: 'Audit log' },
]

function Field({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
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

export default function AdminOrgDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uicError, setUicError] = useState(null)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)

  // Edit form state
  const [form, setForm] = useState({})

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    setLoading(true)

    const [orgRes, membersRes, auditRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', id).single(),
      supabase.from('organization_members')
        .select('*, profiles!organization_members_profile_id_fkey(full_name, email, avatar_url, role)')
        .eq('organization_id', id),
      supabase.from('admin_audit_log')
        .select('*, profiles!organization_members_profile_id_fkey(full_name, email)')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (orgRes.data) {
      setOrg(orgRes.data)
      setForm({
        name: orgRes.data.name || '',
        type: orgRes.data.type || 'ngo',
        tagline: orgRes.data.tagline || '',
        tagline_bg: orgRes.data.tagline_bg || '',
        description: orgRes.data.description || '',
        description_bg: orgRes.data.description_bg || '',
        founded_year: orgRes.data.founded_year || '',
        registration_number: orgRes.data.registration_number || '',
        city: orgRes.data.city || '',
        address: orgRes.data.address || '',
        email: orgRes.data.email || '',
        phone: orgRes.data.phone || '',
        website: orgRes.data.website || '',
        facebook_url: orgRes.data.facebook_url || '',
        instagram_url: orgRes.data.instagram_url || '',
        linkedin_url: orgRes.data.linkedin_url || '',
        is_verified: orgRes.data.is_verified || false,
        is_active: orgRes.data.is_active ?? true,
      })
    } else {
      navigate('/admin/organizations')
    }

    setMembers(membersRes.data || [])
    setAuditLog(auditRes.data || [])
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('organizations').update({
      name: form.name,
      type: form.type,
      tagline: form.tagline || null,
      tagline_bg: form.tagline_bg || null,
      description: form.description || null,
      description_bg: form.description_bg || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      registration_number: form.registration_number || null,
      city: form.city || null,
      address: form.address || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      facebook_url: form.facebook_url || null,
      instagram_url: form.instagram_url || null,
      linkedin_url: form.linkedin_url || null,
      is_verified: form.is_verified,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      showToast(error.message, 'error')
    } else {
      // Log admin edit
      await supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        entity_type: 'organization',
        entity_id: id,
        action: 'approve',
        note: 'Admin edited organization details',
      })
      showToast('Organization updated successfully')
      fetchAll()
    }
    setSaving(false)
  }

  const handleStatusChange = async (status) => {
    const { error } = await supabase.from('organizations').update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    if (!error) {
      await supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        entity_type: 'organization',
        entity_id: id,
        action: status === 'approved' ? 'approve' : status === 'declined' ? 'decline' : 'suspend',
      })
      showToast(`Organization ${status}`)
      fetchAll()
    }
  }

  const handleToggleActive = async () => {
    const newActive = !org.is_active
    const { error } = await supabase.from('organizations')
      .update({ is_active: newActive }).eq('id', id)
    if (!error) {
      await supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        entity_type: 'organization',
        entity_id: id,
        action: newActive ? 'activate' : 'deactivate',
      })
      showToast(`Organization ${newActive ? 'activated' : 'deactivated'}`)
      fetchAll()
    }
  }

  const handleToggleVerified = async () => {
    const newVerified = !org.is_verified
    await supabase.from('organizations').update({ is_verified: newVerified }).eq('id', id)
    showToast(`Verification ${newVerified ? 'granted' : 'removed'}`)
    fetchAll()
  }

  const handleRemoveMember = async (memberId, name) => {
    if (!confirm(`Remove ${name} from this organization?`)) return
    await supabase.from('organization_members').delete().eq('id', memberId)
    showToast(`${name} removed`)
    fetchAll()
  }

  const handleChangeMemberRole = async (memberId, newRole) => {
    await supabase.from('organization_members').update({ role: newRole }).eq('id', memberId)
    showToast('Role updated')
    fetchAll()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return null

  const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'
        }`}>{toast.msg}</div>
      )}

      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/admin/organizations" className="hover:text-gray-600">← Org approvals</Link>
        <span>/</span>
        <span className="text-gray-700">{org.name}</span>
      </div>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-semibold overflow-hidden shrink-0">
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-medium text-gray-900">{org.name}</h1>
              <span className={`badge text-xs px-2 py-0.5 capitalize ${STATUS_BADGE[org.status]}`}>{org.status}</span>
              {org.is_verified && (
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-xs">✓ Verified</span>
              )}
              {!org.is_active && (
                <span className="badge bg-red-50 text-red-700 border border-red-200 text-xs">Inactive</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{org.city} · {org.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Created {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {org.status === 'pending' && (
              <>
                <button onClick={() => handleStatusChange('approved')}
                  className="btn-primary text-sm">✓ Approve</button>
                <button onClick={() => handleStatusChange('declined')}
                  className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 text-sm">
                  ✗ Decline
                </button>
              </>
            )}
            {org.status === 'approved' && (
              <button onClick={() => handleStatusChange('suspended')}
                className="border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg px-4 py-2 text-sm">
                Suspend
              </button>
            )}
            {(org.status === 'suspended' || org.status === 'declined') && (
              <button onClick={() => handleStatusChange('approved')}
                className="btn-primary text-sm">Re-approve</button>
            )}
            <button onClick={handleToggleVerified}
              className={`border rounded-lg px-4 py-2 text-sm transition-colors ${
                org.is_verified
                  ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {org.is_verified ? 'Remove verification' : 'Grant verification'}
            </button>
            <button onClick={handleToggleActive}
              className={`border rounded-lg px-4 py-2 text-sm transition-colors ${
                org.is_active
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-brand-200 text-brand-600 hover:bg-brand-50'
              }`}>
              {org.is_active ? 'Deactivate' : 'Activate'}
            </button>
            {org.slug && (
              <Link to={`/organizations/${org.slug}`} target="_blank"
                className="border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm">
                View page ↗
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.key === 'members' && members.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{members.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Organization details</h2>
            <Field label="Name" value={org.name} />
            <Field label="Type" value={ORG_TYPES.find(t => t.value === org.type)?.label} />
            <Field label="Tagline" value={org.tagline} />
            <Field label="Founded" value={org.founded_year?.toString()} />
            <Field label="Registration №" value={org.registration_number} />
            <Field label="Status" value={org.status} />
            <Field label="Active" value={org.is_active ? 'Yes' : 'No'} />
            <Field label="Verified" value={org.is_verified ? 'Yes' : 'No'} />
          </div>
          <div className="card">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Contact</h2>
            <Field label="City" value={org.city} />
            <Field label="Address" value={org.address} />
            <Field label="Email" value={org.email} />
            <Field label="Phone" value={org.phone} />
            <Field label="Website" value={org.website} />
            <Field label="Facebook" value={org.facebook_url} />
            <Field label="Instagram" value={org.instagram_url} />
            <Field label="LinkedIn" value={org.linkedin_url} />
          </div>
          {org.description && (
            <div className="card md:col-span-2">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{org.description}</p>
              {org.description_bg && (
                <>
                  <p className="text-xs text-gray-400 mt-4 mb-1 uppercase tracking-wide">Bulgarian</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{org.description_bg}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* EDIT TAB */}
      {tab === 'edit' && (
        <form onSubmit={handleSave} className="card flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input type="text" required className="input"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Founded year</label>
              <input type="number" className="input" min="1900" max={new Date().getFullYear()}
                value={form.founded_year} onChange={e => set('founded_year', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration №</label>
              <input type="text" className="input"
                value={form.registration_number}
                onChange={e => { set('registration_number', e.target.value); setUicError(validateUIC(e.target.value, 'en')) }} />
              {uicError && <p className="text-xs text-red-500 mt-1">{uicError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline (EN)</label>
              <input type="text" className="input"
                value={form.tagline} onChange={e => set('tagline', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline (BG)</label>
              <input type="text" className="input"
                value={form.tagline_bg} onChange={e => set('tagline_bg', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (EN)</label>
            <textarea rows={4} className="input resize-none"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (BG)</label>
            <textarea rows={3} className="input resize-none"
              value={form.description_bg} onChange={e => set('description_bg', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Select city</option>
                {BULGARIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" className="input"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input type="text" className="input"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" className="input"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" className="input"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            {[
              { key: 'facebook_url', label: 'Facebook' },
              { key: 'instagram_url', label: 'Instagram' },
              { key: 'linkedin_url', label: 'LinkedIn' },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16 shrink-0">{s.label}</span>
                <input type="url" className="input"
                  value={form[s.key]} onChange={e => set(s.key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Admin-only toggles */}
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">Admin controls</p>
            {[
              { key: 'is_verified', label: 'Verified', desc: 'Shows a verification badge on the public page' },
              { key: 'is_active', label: 'Active', desc: 'Inactive orgs are hidden from all public listings' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-700">{f.label}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
                <button type="button" onClick={() => set(f.key, !form[f.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form[f.key] ? 'bg-brand-400' : 'bg-gray-200'
                  }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form[f.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div className="flex flex-col gap-3">
          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No members found.</div>
          ) : members.map(m => (
            <div key={m.id} className="card flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden">
                {m.profiles?.avatar_url
                  ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                  : (m.profiles?.full_name?.[0] || '?').toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{m.profiles?.full_name || '—'}</p>
                <p className="text-xs text-gray-400 truncate">{m.profiles?.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge text-xs px-2 py-0.5 capitalize ${
                  m.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>{m.role.replace('_', ' ')}</span>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                  value={m.role}
                  onChange={e => handleChangeMemberRole(m.id, e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="content_creator">Content creator</option>
                </select>
                <button onClick={() => handleRemoveMember(m.id, m.profiles?.full_name || 'member')}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {tab === 'audit' && (
        <div className="flex flex-col gap-3">
          {auditLog.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No audit log entries.</div>
          ) : auditLog.map(entry => (
            <div key={entry.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                entry.action === 'approve' || entry.action === 'activate' ? 'bg-brand-400' :
                entry.action === 'decline' || entry.action === 'deactivate' || entry.action === 'suspend' ? 'bg-red-400' :
                'bg-gray-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium capitalize">{entry.action}</span>
                  {entry.profiles && <span className="text-gray-400"> by {entry.profiles.full_name || entry.profiles.email}</span>}
                </p>
                {entry.note && <p className="text-xs text-gray-500 mt-0.5 italic">"{entry.note}"</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
