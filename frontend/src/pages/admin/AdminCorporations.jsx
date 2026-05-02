import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const STATUS_BADGE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
}

const STATUS_LABEL = {
  pending:   { en: 'Pending',   bg: 'Чакащ' },
  approved:  { en: 'Approved',  bg: 'Одобрен' },
  declined:  { en: 'Declined',  bg: 'Отказан' },
  suspended: { en: 'Suspended', bg: 'Спрян' },
}

const SIZE_LABEL = {
  micro:             { en: 'Micro',             bg: 'Микро' },
  small:             { en: 'Small',             bg: 'Малка' },
  medium:            { en: 'Medium',            bg: 'Средна' },
  large:             { en: 'Large',             bg: 'Голяма' },
  enterprise:        { en: 'Enterprise',        bg: 'Корпорация' },
  global_enterprise: { en: 'Global Enterprise', bg: 'Глобална корпорация' },
}

function CorpRow({ corp, onAction, lang = 'en' }) {
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const confirmHandle = (status) => {
    const cfg = {
      suspended: { title: lang === 'bg' ? 'Спри корпорацията?' : 'Suspend?', variant: 'danger', confirm: lang === 'bg' ? 'Спри' : 'Suspend' },
      approved:  { title: lang === 'bg' ? 'Одобри корпорацията?' : 'Approve?', variant: 'default', confirm: lang === 'bg' ? 'Одобри' : 'Approve' },
      declined:  { title: lang === 'bg' ? 'Откажи корпорацията?' : 'Decline?', variant: 'danger', confirm: lang === 'bg' ? 'Откажи' : 'Decline' },
    }[status] || { title: `Set to ${status}?`, variant: 'warning', confirm: 'Confirm' }
    setConfirm({ title: cfg.title, confirmLabel: cfg.confirm, variant: cfg.variant,
      onConfirm: () => handle(status) })
  }
  const handle = async (status) => {
    setLoading(true)
    await onAction(corp.id, status, note)
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
              <span className="font-medium text-gray-900">{lang === 'bg' ? (corp.name_bg || corp.name) : corp.name}</span>
              {corp.is_verified && (
                <span className="badge text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200">✓ {lang === 'bg' ? 'Верифицирана' : 'Verified'}</span>
              )}
              <span className={'badge text-xs px-2 py-0.5 ' + (STATUS_BADGE[corp.status] || 'bg-gray-100 text-gray-600')}>
                {STATUS_LABEL[corp.status]?.[lang] || corp.status}
              </span>
              {corp.industry && (
                <span className="badge bg-gray-50 text-gray-500 border border-gray-200 text-xs">
                  {corp.industry}
                </span>
              )}
              {corp.size && (
                <span className="badge bg-gray-50 text-gray-500 border border-gray-200 text-xs">
                  {SIZE_LABEL[corp.size]?.[lang] || corp.size}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{lang === 'bg' ? (corp.city_bg || corp.city) : corp.city}{corp.email ? ' · ' + corp.email : ''}</p>
            {corp.website && (
              <a href={corp.website} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline">
                {corp.website}
              </a>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'bg' ? 'Подадено' : 'Submitted'} {new Date(corp.created_at).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {corp.admin_name && (lang === 'bg' ? ` от ${corp.admin_name} (${corp.admin_email})` : ` by ${corp.admin_name} (${corp.admin_email})`)}
            </p>
            {corp.review_note && (
              <p className="text-xs text-gray-500 mt-1 italic">{lang === 'bg' ? 'Бележка' : 'Note'}: {corp.review_note}</p>
            )}
            {corp.registration_number && (
              <p className="text-xs text-gray-400">{lang === 'bg' ? 'Рег. №' : 'Registration number'}: {corp.registration_number}</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            {corp.status === 'pending' && (
              <button onClick={() => setOpen(!open)} className="btn-primary text-xs py-1.5">
            <button
              onClick={() => onVerify(corp.id, !corp.is_verified)}
              disabled={loading}
              className={corp.is_verified
                ? 'text-xs border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5'
                : 'text-xs border border-brand-200 text-brand-600 hover:bg-brand-50 rounded-lg px-3 py-1.5'}
            >
              {corp.is_verified
                ? (lang === 'bg' ? '✓ Верифицирана' : '✓ Verified')
                : (lang === 'bg' ? 'Верифицирай' : 'Verify')}
            </button>
                {open ? (lang === 'bg' ? 'Отказ' : 'Cancel') : (lang === 'bg' ? 'Преглед' : 'Review')}
              </button>
            )}
            {corp.status === 'approved' && (
              <button onClick={() => confirmHandle('suspended')} disabled={loading}
                className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5">
                {lang === 'bg' ? 'Спри' : 'Suspend'}
              </button>
            )}
            {(corp.status === 'declined' || corp.status === 'suspended') && (
              <button onClick={() => confirmHandle('approved')} disabled={loading}
                className="btn-primary text-xs py-1.5">
                {lang === 'bg' ? 'Одобри отново' : 'Re-approve'}
              </button>
            )}
          </div>
        </div>

        {corp.description && (
          <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3 line-clamp-3">
            {lang === 'bg' ? (corp.description_bg || corp.description) : corp.description}
          </p>
        )}

        {open && (
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {lang === 'bg' ? 'Бележка при преглед' : 'Review note'} <span className="text-gray-400 font-normal">{lang === 'bg' ? '(незадължително — видима за администратора на корпорацията)' : '(optional — visible to corp admin)'}</span>
              </label>
              <textarea rows={2} className="input resize-none text-sm"
                placeholder={lang === 'bg' ? 'напр. Заявката е одобрена. Добре дошли!' : 'e.g. Registration approved. Welcome to Dataverte!'}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
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

export default function AdminCorporations() {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user } = useAuthStore()
  const [corps, setCorps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('pending')
  const [counts, setCounts] = useState({})

  const fetchCorps = async () => {
    setLoading(true)
    let query = supabase.from('corporations').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    const corpsWithAdmin = await Promise.all((data || []).map(async corp => {
      const { data: creator } = await supabase.from('profiles').select('full_name, email').eq('id', corp.created_by).single()
      return { ...corp, admin_name: creator?.full_name, admin_email: creator?.email }
    }))
    setCorps(corpsWithAdmin)
    setLoading(false)
  }

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'declined', 'suspended']
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('corporations').select('id', { count: 'exact', head: true }).eq('status', s)
      )
    )
    const c = {}
    statuses.forEach((s, i) => { c[s] = results[i].count || 0 })
    setCounts(c)
  }

  useEffect(() => { fetchCorps(); fetchCounts() }, [filter])

  const handleAction = async (id, status, note) => {
    await supabase.from('corporations').update({
      status,
      review_note: note || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      is_active: status === 'approved',
    }).eq('id', id)
    fetchCorps()
    fetchCounts()
  }

  const handleVerify = async (id, isVerified) => {
    await supabase.from('corporations').update({
      is_verified: isVerified,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    fetchCorps()
  }

  const filtered = corps.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: 'var(--text)' }}>{lang === 'bg' ? 'Одобрения на корпорации' : 'Corporation approvals'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{lang === 'bg' ? 'Преглед и одобрение на заявки за регистрация на корпорации' : 'Review and approve corporation registration requests'}</p>
        </div>
        <input
          type="search"
          placeholder={lang === 'bg' ? 'Търси по име, град или имейл...' : 'Search by name, city or email...'}
          className="input sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {(counts.pending || 0) > 0 && filter !== 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm text-amber-700">
            <span className="font-medium">{counts.pending}</span> {lang === 'bg' ? (counts.pending > 1 ? 'корпорации чакат одобрение' : 'корпорация чака одобрение') : (counts.pending > 1 ? 'corporations waiting for approval' : 'corporation waiting for approval')}
          </p>
          <button onClick={() => setFilter('pending')} className="text-xs text-amber-700 font-medium underline">
            {lang === 'bg' ? 'Виж чакащите →' : 'View pending →'}
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ${
              filter === f.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
            {f.key !== 'all' && counts[f.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${f.key === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {search ? (lang === 'bg' ? 'Няма резултати.' : 'No results match your search.') : (lang === 'bg' ? 'Няма корпорации.' : 'No ' + (filter === 'all' ? '' : filter) + ' corporations.')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(corp => (
            <CorpRow lang={lang} key={corp.id} corp={corp} onAction={handleAction} onVerify={handleVerify} />
          ))}
        </div>
      )}
    </div>
  )
}
