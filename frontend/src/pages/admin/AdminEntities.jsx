import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  volunteer: 'Volunteer', org_admin: 'Org admin',
  corp_admin: 'Corp admin', super_admin: 'Portal admin',
}

const TYPE_LABEL = {
  ngo: 'NGO', nonprofit: 'Non-profit', company: 'Company',
  government: 'Government org', education: 'Education',
  investor: 'Investor', other: 'Other',
}

const STATUS_BADGE = {
  true:  'bg-brand-50 text-brand-700 border border-brand-200',
  false: 'bg-red-50 text-red-700 border border-red-200',
}

const ORG_STATUS_BADGE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
}

// Send email notification via Supabase edge function
async function sendNotificationEmail(to, subject, body) {
  try {
    await supabase.functions.invoke('send-email', {
      body: { to, subject, body }
    })
  } catch (e) {
    // Email is best-effort — don't block the UI action
    console.warn('Email notification failed:', e.message)
  }
}

// ─── Volunteer row ─────────────────────────────────────────────────────────────
function VolunteerRow({ user, onToggle, loading }) {
  return (
    <div className="card flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden">
        {user.avatar_url
          ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
          : (user.full_name?.[0] || user.email[0]).toUpperCase()
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{user.full_name || '—'}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
        {user.city && <p className="text-xs text-gray-400">{user.city}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-gray-400">
          {new Date(user.created_at).toLocaleDateString('en-GB')}
        </span>
        <span className={`badge text-xs px-2 py-0.5 ${STATUS_BADGE[String(user.is_active)]}`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
        <span className="badge bg-gray-50 text-gray-500 border border-gray-100 text-xs">
          {ROLE_LABEL[user.role] || user.role}
        </span>
        <button
          onClick={() => onToggle(user)}
          disabled={loading === user.id || user.role === 'super_admin'}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
            user.is_active
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-brand-200 text-brand-600 hover:bg-brand-50'
          }`}
        >
          {loading === user.id
            ? '...'
            : user.is_active ? 'Deactivate' : 'Activate'
          }
        </button>
      </div>
    </div>
  )
}

// ─── Org / Corp row ────────────────────────────────────────────────────────────
function EntityRow({ entity, kind, onToggle, loading }) {
  const initials = entity.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const statusBadge = entity.status
    ? ORG_STATUS_BADGE[entity.status] || ORG_STATUS_BADGE.approved
    : STATUS_BADGE[String(entity.is_active)]

  return (
    <div className="card flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold shrink-0 overflow-hidden">
        {entity.logo_url
          ? <img src={entity.logo_url} className="w-full h-full object-cover rounded-xl" alt="" />
          : initials
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{entity.name}</p>
        <p className="text-xs text-gray-400 truncate">{entity.email}</p>
        {entity.city && <p className="text-xs text-gray-400">{entity.city}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        <span className="text-xs text-gray-400">
          {new Date(entity.created_at).toLocaleDateString('en-GB')}
        </span>
        {entity.type && (
          <span className="badge bg-gray-50 text-gray-500 border border-gray-100 text-xs">
            {TYPE_LABEL[entity.type] || entity.type}
          </span>
        )}
        <span className={`badge text-xs px-2 py-0.5 capitalize ${statusBadge}`}>
          {entity.status || (entity.is_active ? 'Active' : 'Inactive')}
        </span>
        {kind === 'org' && entity.slug && (
          <Link to={`/organizations/${entity.slug}`}
            className="text-xs text-gray-400 hover:text-brand-400 border border-gray-200 rounded-lg px-2.5 py-1.5">
            View
          </Link>
        )}
        <button
          onClick={() => onToggle(entity)}
          disabled={loading === entity.id}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
            entity.is_active
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-brand-200 text-brand-600 hover:bg-brand-50'
          }`}
        >
          {loading === entity.id ? '...' : entity.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminEntities() {
  const { user: adminUser } = useAuthStore()
  const [tab, setTab] = useState('volunteers')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [counts, setCounts] = useState({ volunteers: 0, organizations: 0, corporations: 0 })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)

    if (tab === 'volunteers') {
      let q = supabase.from('profiles').select('*').neq('role', 'super_admin').order('created_at', { ascending: false })
      if (filter === 'active') q = q.eq('is_active', true)
      if (filter === 'inactive') q = q.eq('is_active', false)
      const { data: rows } = await q
      setData(rows || [])
    }

    if (tab === 'organizations') {
      let q = supabase.from('organizations').select('*').order('created_at', { ascending: false })
      if (filter === 'active') q = q.eq('is_active', true)
      if (filter === 'inactive') q = q.eq('is_active', false)
      const { data: rows } = await q
      setData(rows || [])
    }

    if (tab === 'corporations') {
      let q = supabase.from('corporations').select('*').order('created_at', { ascending: false })
      if (filter === 'active') q = q.eq('is_active', true)
      if (filter === 'inactive') q = q.eq('is_active', false)
      const { data: rows, error: corpErr } = await q
      if (corpErr) console.error('Corporations error:', corpErr.message)
      setData(rows || [])
    }

    setLoading(false)
  }, [tab, filter])

  const fetchCounts = useCallback(async () => {
    const [vols, orgs, corps] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'super_admin').then(r => r).catch(() => ({ count: 0 })),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).then(r => r).catch(() => ({ count: 0 })),
      supabase.from('corporations').select('id', { count: 'exact', head: true }).then(r => r).catch(() => ({ count: 0 })),
    ])
    setCounts({
      volunteers: vols.count || 0,
      organizations: orgs.count || 0,
      corporations: corps.count || 0,
    })
  }, [])

  useEffect(() => { fetchData(); fetchCounts() }, [fetchData, fetchCounts])

  // Toggle active/inactive for volunteers
  const toggleVolunteer = async (u) => {
    setActionLoading(u.id)
    const newActive = !u.is_active
    const { error } = await supabase.from('profiles')
      .update({ is_active: newActive }).eq('id', u.id)

    if (!error) {
      // Log action
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser.id,
        entity_type: 'volunteer',
        entity_id: u.id,
        action: newActive ? 'activate' : 'deactivate',
      })

      // Send email notification
      const subject = newActive
        ? 'Your Dataverte account has been activated'
        : 'Your Dataverte account has been deactivated'
      const body = newActive
        ? `Hi ${u.full_name || 'there'},\n\nYour Dataverte account has been activated. You can now log in and browse volunteer opportunities.\n\nThe Dataverte Team`
        : `Hi ${u.full_name || 'there'},\n\nYour Dataverte account has been deactivated by a portal administrator. If you believe this is a mistake, please contact support.\n\nThe Dataverte Team`
      await sendNotificationEmail(u.email, subject, body)

      showToast(`${u.full_name || u.email} ${newActive ? 'activated' : 'deactivated'}`)
      fetchData()
    } else {
      showToast(error.message, 'error')
    }
    setActionLoading(null)
  }

  // Toggle active/inactive for orgs/corps
  const toggleEntity = async (entity, table, kind) => {
    setActionLoading(entity.id)
    const newActive = !entity.is_active
    const { error } = await supabase.from(table)
      .update({ is_active: newActive }).eq('id', entity.id)

    if (!error) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser.id,
        entity_type: kind,
        entity_id: entity.id,
        action: newActive ? 'activate' : 'deactivate',
      })

      if (entity.email) {
        const subject = newActive
          ? `Your ${kind === 'organization' ? 'organization' : 'corporation'} has been activated on Dataverte`
          : `Your ${kind === 'organization' ? 'organization' : 'corporation'} has been deactivated on Dataverte`
        const body = newActive
          ? `Hi,\n\nYour ${kind} "${entity.name}" has been activated on Dataverte.\n\nThe Dataverte Team`
          : `Hi,\n\nYour ${kind} "${entity.name}" has been deactivated by a portal administrator. Please contact support if you believe this is an error.\n\nThe Dataverte Team`
        await sendNotificationEmail(entity.email, subject, body)
      }

      showToast(`${entity.name} ${newActive ? 'activated' : 'deactivated'}`)
      fetchData()
    } else {
      showToast(error.message, 'error')
    }
    setActionLoading(null)
  }

  // Filter by search
  const filtered = data.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    if (tab === 'volunteers') {
      return (item.full_name || '').toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s) ||
        (item.city || '').toLowerCase().includes(s)
    }
    return item.name.toLowerCase().includes(s) ||
      (item.email || '').toLowerCase().includes(s) ||
      (item.city || '').toLowerCase().includes(s)
  })

  const TABS = [
    { key: 'volunteers', label: 'Volunteers', count: counts.volunteers },
    { key: 'organizations', label: 'Organizations', count: counts.organizations },
    { key: 'corporations', label: 'Corporations', count: counts.corporations },
  ]

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Entity management</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage access for all platform entities</p>
        </div>
        <input
          type="search"
          placeholder="Search by name, email or city..."
          className="input sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Entity tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilter('all') }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
              tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-brand-400 text-white border-brand-400'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No {tab} found{search ? ` matching "${search}"` : ''}.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tab === 'volunteers' && filtered.map(u => (
            <VolunteerRow key={u.id} user={u} onToggle={toggleVolunteer} loading={actionLoading} />
          ))}
          {tab === 'organizations' && filtered.map(e => (
            <EntityRow key={e.id} entity={e} kind="org"
              onToggle={e => toggleEntity(e, 'organizations', 'organization')}
              loading={actionLoading} />
          ))}
          {tab === 'corporations' && filtered.map(e => (
            <EntityRow key={e.id} entity={e} kind="corp"
              onToggle={e => toggleEntity(e, 'corporations', 'corporation')}
              loading={actionLoading} />
          ))}
        </div>
      )}
    </div>
  )
}
