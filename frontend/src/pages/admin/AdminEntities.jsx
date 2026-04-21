import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const ROLE_LABEL = {
  volunteer:   { en: 'Volunteer',     bg: 'Доброволец' },
  org_admin:   { en: 'Org admin',     bg: 'Адм. организация' },
  corp_admin:  { en: 'Corp admin',    bg: 'Адм. корпорация' },
  super_admin: { en: 'Platform admin',bg: 'Адм. платформа' },
}

const STATUS_LABEL = {
  approved:  { en: 'Approved',  bg: 'Одобрен' },
  pending:   { en: 'Pending',   bg: 'Чакащ' },
  declined:  { en: 'Declined',  bg: 'Отказан' },
  suspended: { en: 'Спрян',    bg: 'Спрян' },
  active:    { en: 'Active',    bg: 'Активен' },
  inactive:  { en: 'Inactive',  bg: 'Неактивен' },
}

const TYPE_LABEL = {
  ngo:        { en: 'NGO',             bg: 'НПО' },
  nonprofit:  { en: 'Non-profit',      bg: 'Нестопанска' },
  company:    { en: 'Company',         bg: 'Компания' },
  government: { en: 'Government org',  bg: 'Правителствена' },
  education:  { en: 'Education',       bg: 'Образование' },
  investor:   { en: 'Investor',        bg: 'Инвеститор' },
  other:      { en: 'Other',           bg: 'Друго' },
}

async function safeQuery(queryFn) {
  try {
    const result = await queryFn()
    if (result.error) { console.warn('Query error:', result.error.message); return [] }
    return result.data || []
  } catch (e) {
    console.warn('Query exception:', e.message)
    return []
  }
}

async function safeCount(queryFn) {
  try {
    const result = await queryFn()
    if (result.error) { console.warn('Count error:', result.error.message); return 0 }
    return result.count || 0
  } catch (e) {
    console.warn('Count exception:', e.message)
    return 0
  }
}

function VolunteerRow({ user, onToggle, loading, lang }) {
  const initials = (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()
  return (
    <div className="card flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden">
        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.full_name || '—'}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{user.email}</p>
        {user.city && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{user.city}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <span className="text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}</span>
        <span className={`badge text-xs px-2 py-0.5 ${user.is_active ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {user.is_active ? (lang === 'bg' ? 'Активен' : 'Active') : (lang === 'bg' ? 'Неактивен' : 'Inactive')}
        </span>
        <span className="badge bg-gray-50 text-gray-500 border border-gray-100 text-xs">
          {ROLE_LABEL[user.role]?.[lang] || user.role}
        </span>
        <button onClick={() => onToggle(user)} disabled={loading === user.id || user.role === 'super_admin'}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${user.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
          {loading === user.id ? '…' : user.is_active === true ? (lang === 'bg' ? 'Деактивирай' : 'Deactivate') : (lang === 'bg' ? 'Активирай' : 'Activate')}
        </button>
      </div>
    </div>
  )
}

function EntityRow({ entity, kind, onToggle, loading, lang }) {
  const initials = ((entity.name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()) || '?'
  return (
    <div className="card flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold shrink-0 overflow-hidden">
        {entity.logo_url ? <img src={entity.logo_url} className="w-full h-full object-cover rounded-xl" alt="" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{lang === 'bg' ? (entity.name_bg || entity.name) : entity.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{entity.email}</p>
        {(entity.city || entity.city_bg) && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{lang === 'bg' ? (entity.city_bg || entity.city) : entity.city}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <span className="text-xs text-gray-400">{new Date(entity.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}</span>
        {entity.type && <span className="badge bg-gray-50 text-gray-500 border border-gray-100 text-xs">{TYPE_LABEL[entity.type]?.[lang] || entity.type}</span>}
        <span className={`badge text-xs px-2 py-0.5 ${
          entity.status === 'approved' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
          entity.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {entity.status
            ? (STATUS_LABEL[entity.status]?.[lang] || entity.status)
            : (entity.is_active ? (lang === 'bg' ? 'Активен' : 'Active') : (lang === 'bg' ? 'Неактивен' : 'Inactive'))}
        </span>
        {kind === 'org' && entity.slug && (
          <Link to={`/organizations/${entity.slug}`} className="text-xs text-gray-400 hover:text-brand-400 border border-gray-200 rounded-lg px-2.5 py-1.5">
            {lang === 'bg' ? 'Виж' : 'View'}
          </Link>
        )}
        <button onClick={() => onToggle(entity)} disabled={loading === entity.id}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${entity.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-brand-200 text-brand-600 hover:bg-brand-50'}`}>
          {loading === entity.id ? '…' : entity.is_active ? (lang === 'bg' ? 'Деактивирай' : 'Deactivate') : (lang === 'bg' ? 'Активирай' : 'Activate')}
        </button>
      </div>
    </div>
  )
}

export default function AdminEntities() {
  const [confirm, setConfirm] = useState(null)
  const { user: adminUser } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [tab, setTab] = useState('volunteers')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState([])
  const dataRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [counts, setCounts] = useState({ volunteers: 0, organizations: 0, corporations: 0 })
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'volunteers') {
        let q = supabase.from('profiles').select('*').neq('role', 'super_admin').order('created_at', { ascending: false })
        if (filter === 'active') q = q.eq('is_active', true)
        if (filter === 'inactive') q = q.eq('is_active', false)
        const rows = await safeQuery(() => q)
        dataRef.current = rows
        setData(rows)
      } else if (tab === 'organizations') {
        let q = supabase.from('organizations').select('*').order('created_at', { ascending: false })
        if (filter === 'active') q = q.eq('is_active', true)
        if (filter === 'inactive') q = q.eq('is_active', false)
        const rows = await safeQuery(() => q)
        dataRef.current = rows
        setData(rows)
      } else if (tab === 'corporations') {
        let q = supabase.from('corporations').select('*').order('created_at', { ascending: false })
        if (filter === 'active') q = q.eq('is_active', true)
        if (filter === 'inactive') q = q.eq('is_active', false)
        const rows = await safeQuery(() => q)
        dataRef.current = rows
        setData(rows)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tab, filter])

  const fetchCounts = useCallback(async () => {
    const [vols, orgs, corps] = await Promise.all([
      safeCount(() => supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'super_admin')),
      safeCount(() => supabase.from('organizations').select('id', { count: 'exact', head: true })),
      safeCount(() => supabase.from('corporations').select('id', { count: 'exact', head: true })),
    ])
    setCounts({ volunteers: vols, organizations: orgs, corporations: corps })
  }, [])

  useEffect(() => {
    fetchData()
    fetchCounts()
  }, [fetchData, fetchCounts])

  const toggleVolunteer = (u) => {
    const newActive = !u.is_active
    setConfirm({
      title: lang === 'bg' ? (newActive ? 'Активирай доброволец?' : 'Деактивирай доброволец?') : (newActive ? 'Activate volunteer?' : 'Deactivate volunteer?'),
      message: u.full_name || u.email,
      confirmLabel: lang === 'bg' ? (newActive ? 'Активирай' : 'Деактивирай') : (newActive ? 'Activate' : 'Deactivate'),
      variant: newActive ? 'default' : 'danger',
      onConfirm: () => _execToggleVolunteer(u),
    })
  }
  const _execToggleVolunteer = async (u) => {
    const current = dataRef.current.find(p => p.id === u.id) || u
    const newActive = !current.is_active
    setActionLoading(u.id)
    const { error } = await supabase.from('profiles').update({ is_active: newActive }).eq('id', u.id)
    if (!error) {
      await supabase.from('admin_audit_log').insert({ admin_id: adminUser.id, entity_type: 'volunteer', entity_id: u.id, action: newActive ? 'activate' : 'deactivate' }).catch(() => {})
      // Update data and clear loading in same render to avoid blank button flash
      setData(prev => {
        const next = prev.map(p => p.id === u.id ? { ...p, is_active: newActive } : p)
        dataRef.current = next
        return next
      })
      showToast(`${current.full_name || current.email} ${lang === 'bg' ? (newActive ? 'активиран' : 'деактивиран') : (newActive ? 'activated' : 'deactivated')}`)
      fetchCounts()
    } else {
      showToast(error.message, 'error')
    }
    setActionLoading(null)
  }

  const toggleEntity = (entity, table) => {
    const newActive = !entity.is_active
    setConfirm({
      title: lang === 'bg' ? (newActive ? 'Активирай?' : 'Деактивирай?') : (newActive ? 'Activate?' : 'Deactivate?'),
      message: entity.name,
      confirmLabel: lang === 'bg' ? (newActive ? 'Активирай' : 'Деактивирай') : (newActive ? 'Activate' : 'Deactivate'),
      variant: newActive ? 'default' : 'danger',
      onConfirm: () => _execToggleEntity(entity, table),
    })
  }
  const _execToggleEntity = async (entity, table) => {
    const current = dataRef.current.find(e => e.id === entity.id) || entity
    const newActive = !current.is_active
    setActionLoading(entity.id)
    const { error } = await supabase.from(table).update({ is_active: newActive }).eq('id', entity.id)
    if (!error) {
      setData(prev => {
        const next = prev.map(e => e.id === entity.id ? { ...e, is_active: newActive } : e)
        dataRef.current = next
        return next
      })
      showToast(`${current.name} ${lang === 'bg' ? (newActive ? 'активирана' : 'деактивирана') : (newActive ? 'activated' : 'deactivated')}`)
      fetchCounts()
    } else {
      showToast(error.message, 'error')
    }
    setActionLoading(null)
  }

  const filtered = data.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    if (tab === 'volunteers') return (item.full_name || '').toLowerCase().includes(s) || (item.email || '').toLowerCase().includes(s)
    return (item.name || '').toLowerCase().includes(s) || (item.email || '').toLowerCase().includes(s) || (item.city || '').toLowerCase().includes(s)
  })

  const TABS = [
    { key: 'volunteers', label: lang === 'bg' ? 'Доброволци' : 'Volunteers', count: counts.volunteers },
    { key: 'organizations', label: lang === 'bg' ? 'Организации' : 'Organizations', count: counts.organizations },
    { key: 'corporations', label: lang === 'bg' ? 'Корпорации' : 'Corporations', count: counts.corporations },
  ]

  return (
    <>
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
      <div className="max-w-5xl mx-auto px-4 py-10">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{lang === 'bg' ? 'Управление на субекти' : 'Entity management'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{lang === 'bg' ? 'Управлявай достъпа на всички субекти в платформата' : 'Manage access for all platform entities'}</p>
        </div>
        <input type="search" placeholder={lang === 'bg' ? 'Търси...' : 'Search...'} className="input sm:w-64"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-1 border-b border-gray-100 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setFilter('all') }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-brand-400 text-white border-brand-400' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {f === 'all' ? (lang === 'bg' ? 'Всички' : 'All') : f === 'active' ? (lang === 'bg' ? 'Активни' : 'Active') : (lang === 'bg' ? 'Неактивни' : 'Inactive')}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} {lang === 'bg' ? 'резултата' : (filtered.length !== 1 ? 'results' : 'result')}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">{lang === 'bg' ? 'Няма намерени резултати' : `No ${tab} found${search ? ` matching "${search}"` : ''}.`}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {tab === 'volunteers' && filtered.map(u => (
            <VolunteerRow key={u.id} user={u} onToggle={toggleVolunteer} loading={actionLoading} lang={lang} />
          ))}
          {tab === 'organizations' && filtered.map(e => (
            <EntityRow key={e.id} entity={e} kind="org" onToggle={e => toggleEntity(e, 'organizations')} loading={actionLoading} lang={lang} />
          ))}
          {tab === 'corporations' && filtered.map(e => (
            <EntityRow key={e.id} entity={e} kind="corp" onToggle={e => toggleEntity(e, 'corporations')} loading={actionLoading} lang={lang} />
          ))}
        </div>
      )}
    </div>
    </>
  )
}