import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'


const TYPE_LABEL = {
  ngo:        { en: 'NGO',             bg: 'НПО' },
  nonprofit:  { en: 'Non-profit',      bg: 'Нестопанска' },
  company:    { en: 'Company',         bg: 'Компания' },
  government: { en: 'Government org',  bg: 'Правителствена' },
  education:  { en: 'Education',       bg: 'Образование' },
  investor:   { en: 'Investor',        bg: 'Инвеститор' },
  other:      { en: 'Other',           bg: 'Друго' },
}

const STATUS_LABEL = {
  pending:   { en: 'Pending',   bg: 'Чакащ' },
  approved:  { en: 'Approved',  bg: 'Одобрен' },
  declined:  { en: 'Declined',  bg: 'Отказан' },
  suspended: { en: 'Suspended', bg: 'Спрян' },
}

const STATUS_BADGE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
}

function OrgRow({ org, onAction, lang = 'en' }) {
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const confirmHandle = (status) => {
    const cfg = {
      suspended: { title: lang === 'bg' ? 'Спри организацията?' : 'Suspend?', variant: 'danger', confirm: lang === 'bg' ? 'Спри' : 'Suspend' },
      approved:  { title: lang === 'bg' ? 'Одобри организацията?' : 'Approve?', variant: 'default', confirm: lang === 'bg' ? 'Одобри' : 'Approve' },
      declined:  { title: lang === 'bg' ? 'Откажи организацията?' : 'Decline?', variant: 'danger', confirm: lang === 'bg' ? 'Откажи' : 'Decline' },
    }[status] || { title: `Set to ${status}?`, variant: 'warning', confirm: 'Confirm' }
    setConfirm({ title: cfg.title, confirmLabel: cfg.confirm, variant: cfg.variant,
      onConfirm: () => handle(status) })
  }
  const handle = async (status) => {
    setLoading(true)
    await onAction(org.id, status, note)
    setLoading(false)
    setOpen(false)
    setNote('')
  }

  return (
    <>
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
      <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link to={'/admin/organizations/' + org.id} className="font-medium text-gray-900 hover:text-brand-400 transition-colors">{lang === 'bg' ? (org.name_bg || org.name) : org.name}</Link>
            <span className={`badge text-xs px-2 py-0.5 ${STATUS_BADGE[org.status]}`}>
              {STATUS_LABEL[org.status]?.[lang] || org.status}
            </span>
            <span className="badge bg-gray-50 text-gray-500 border border-gray-200 text-xs">
              {TYPE_LABEL[org.type]?.[lang] || org.type}
            </span>
          </div>
          <p className="text-sm text-gray-500">{lang === 'bg' ? (org.city_bg || org.city) : org.city} · {org.email}</p>
          {org.website && (
            <a href={org.website} target="_blank" rel="noreferrer"
              className="text-xs text-brand-400 hover:underline">{org.website}</a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'bg' ? 'Подадено' : 'Submitted'} {new Date(org.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
            {org.admin_name && (lang === 'bg' ? ` от ${org.admin_name} (${org.admin_email})` : ` by ${org.admin_name} (${org.admin_email})`)}
          </p>
          {org.review_note && (
            <p className="text-xs text-gray-500 mt-1 italic">{lang === 'bg' ? 'Бележка' : 'Note'}: {org.review_note}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {org.status === 'pending' && (
            <button onClick={() => setOpen(!open)}
              className="btn-primary text-xs py-1.5">
              {open ? (lang === 'bg' ? 'Отказ' : 'Cancel') : (lang === 'bg' ? 'Преглед' : 'Review')}
            </button>
          )}
          {org.status === 'approved' && (
            <button onClick={() => confirmHandle('suspended')} disabled={loading}
              className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5">
              {lang === 'bg' ? 'Спри' : 'Suspend'}
            </button>
          )}
          {(org.status === 'declined' || org.status === 'suspended') && (
            <button onClick={() => confirmHandle('approved')} disabled={loading}
              className="btn-primary text-xs py-1.5">
              {lang === 'bg' ? 'Одобри отново' : 'Re-approve'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {org.description && (
        <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3 line-clamp-3">
          {org.description}
        </p>
      )}

      {/* Registration number */}
      {org.registration_number && (
        <p className="text-xs text-gray-400">{lang === 'bg' ? 'Рег. №' : 'Registration №'}: {org.registration_number}</p>
      )}

      {/* Review panel */}
      {open && (
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {lang === 'bg' ? 'Бележка при преглед' : 'Review note'} <span className="text-gray-400 font-normal">{lang === 'bg' ? '(незадължително — видима за администратора на организацията)' : '(optional — visible to org admin)'}</span>
            </label>
            <textarea rows={2} className="input resize-none text-sm"
              placeholder="e.g. Registration approved. Welcome to Dataverte!"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirmHandle('approved')} disabled={loading}
              className="btn-primary text-sm flex items-center gap-1.5">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              ✓ {lang === 'bg' ? 'Одобри' : 'Approve'}
            </button>
            <button onClick={() => confirmHandle('declined')} disabled={loading}
              className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 text-sm">
              ✗ {lang === 'bg' ? 'Откажи' : 'Decline'}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default function AdminOrganizations() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user, profile } = useAuthStore()
  const [orgs, setOrgs] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})
  const [search, setSearch] = useState('')

  const fetchOrgs = async () => {
    setLoading(true)

    // Fetch orgs with creator profile via separate query to avoid join issues
    let query = supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data: orgsData, error } = await query

    if (error) { console.error(error); setLoading(false); return }

    // Enrich with creator profile
    const enriched = await Promise.all((orgsData || []).map(async (org) => {
      if (!org.created_by) return org
      const { data: creator } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', org.created_by)
        .single()
      return {
        ...org,
        admin_name: creator?.full_name,
        admin_email: creator?.email,
      }
    }))

    setOrgs(enriched)
    setLoading(false)
  }

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'declined', 'suspended']
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', s)
      )
    )
    const c = {}
    statuses.forEach((s, i) => { c[s] = results[i].count || 0 })
    setCounts(c)
  }

  useEffect(() => { fetchOrgs(); fetchCounts() }, [filter])

  const handleAction = async (id, status, note) => {
    const { error } = await supabase.from('organizations').update({
      status,
      review_note: note || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) { console.error(error); return }
    fetchOrgs()
    fetchCounts()
  }

  const filtered = orgs.filter(o =>
    !search ||
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.admin_email || '').toLowerCase().includes(search.toLowerCase())
  )

  const FILTERS = [
    { key: 'pending', label: lang === 'bg' ? 'Чакащи' : 'Pending' },
    { key: 'approved', label: lang === 'bg' ? 'Одобрени' : 'Approved' },
    { key: 'declined', label: lang === 'bg' ? 'Отказани' : 'Declined' },
    { key: 'suspended', label: lang === 'bg' ? 'Спрени' : 'Suspended' },
    { key: 'all', label: lang === 'bg' ? 'Всички' : 'All' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{lang === 'bg' ? 'Одобрения на организации' : 'Organization approvals'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {lang === 'bg' ? 'Преглед и одобрение на заявки за регистрация на организации' : 'Review and approve organization registration requests'}
          </p>
        </div>
        <input
          type="search"
          placeholder={lang === 'bg' ? 'Търси по име, град или имейл...' : 'Search by name, city or email...'}
          className="input sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Pending alert banner */}
      {(counts.pending || 0) > 0 && filter !== 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm text-amber-700">
            <span className="font-medium">{counts.pending}</span> {lang === 'bg' ? (counts.pending > 1 ? 'организации чакат одобрение' : 'организация чака одобрение') : (counts.pending > 1 ? 'organizations waiting for approval' : 'organization waiting for approval')}
          </p>
          <button onClick={() => setFilter('pending')} className="text-xs text-amber-700 font-medium underline">
            View pending →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ${
              filter === f.key
                ? 'border-brand-400 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
            {f.key !== 'all' && counts[f.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                f.key === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {search ? (lang === 'bg' ? 'Няма резултати.' : 'No results match your search.') : (lang === 'bg' ? 'Няма организации.' : `No ${filter === 'all' ? '' : filter} organizations.`)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(org => (
            <OrgRow lang={lang} key={org.id} org={org} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
