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

function CorpRow({ corp, onAction }) {
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const confirmHandle = (status) => {
    const cfg = {
      suspended: { title: 'Suspend?', variant: 'danger', confirm: 'Suspend' },
      approved:  { title: 'Approve?', variant: 'default', confirm: 'Approve' },
      declined:  { title: 'Decline?', variant: 'danger', confirm: 'Decline' },
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
            <span className="font-medium text-gray-900">{corp.name}</span>
            <span className={'badge text-xs px-2 py-0.5 capitalize ' + (STATUS_BADGE[corp.status] || 'bg-gray-100 text-gray-600')}>
              {corp.status}
            </span>
            {corp.industry && (
              <span className="badge bg-gray-50 text-gray-500 border border-gray-200 text-xs">
                {corp.industry}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{corp.city}{corp.email ? ' · ' + corp.email : ''}</p>
          {corp.website && (
            <a href={corp.website} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline">
              {corp.website}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Submitted {new Date(corp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {corp.admin_name && ' by ' + corp.admin_name + ' (' + corp.admin_email + ')'}
          </p>
          {corp.review_note && (
            <p className="text-xs text-gray-500 mt-1 italic">Note: {corp.review_note}</p>
          )}
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {corp.status === 'pending' && (
            <button onClick={() => setOpen(!open)} className="btn-primary text-xs py-1.5">
              {open ? 'Cancel' : 'Review'}
            </button>
          )}
          {corp.status === 'approved' && (
            <button onClick={() => confirmHandle('suspended')} disabled={loading}
              className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5">
              Suspend
            </button>
          )}
          {(corp.status === 'declined' || corp.status === 'suspended') && (
            <button onClick={() => confirmHandle('approved')} disabled={loading} className="btn-primary text-xs py-1.5">
              Re-approve
            </button>
          )}
          {corp.slug && (
            <Link to={'/corporations/' + corp.slug} className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg px-3 py-1.5">
              View page
            </Link>
          )}
        </div>
      </div>

      {corp.description && (
        <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3 line-clamp-3">
          {corp.description}
        </p>
      )}

      {corp.registration_number && (
        <p className="text-xs text-gray-400">Registration number: {corp.registration_number}</p>
      )}

      {open && (
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Review note <span className="text-gray-400 font-normal">(optional — visible to corp admin)</span>
            </label>
            <textarea
              rows={2}
              className="input resize-none text-sm"
              placeholder="e.g. Registration approved. Welcome to Dataverte!"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => confirmHandle('approved')} disabled={loading}
              className="btn-primary text-sm flex items-center gap-1.5">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Approve
            </button>
            <button onClick={() => confirmHandle('declined')} disabled={loading}
              className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 text-sm">
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default function AdminCorporations() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [corps, setCorps] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})
  const [search, setSearch] = useState('')

  const fetchCorps = async () => {
    setLoading(true)
    let query = supabase
      .from('corporations')
      .select('*')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)

    const { data, error } = await query
    if (error) { console.error(error); setLoading(false); return }

    // Enrich with creator profile
    const enriched = await Promise.all((data || []).map(async (corp) => {
      if (!corp.created_by) return corp
      const { data: creator } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', corp.created_by)
        .single()
      return { ...corp, admin_name: creator?.full_name, admin_email: creator?.email }
    }))

    setCorps(enriched)
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
    const { error } = await supabase.from('corporations').update({
      status,
      review_note: note || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { console.error(error); return }
    fetchCorps()
    fetchCounts()
  }

  const filtered = corps.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.admin_email || '').toLowerCase().includes(search.toLowerCase())
  )

  const FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'declined', label: 'Declined' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Corporation approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve corporation registration requests</p>
        </div>
        <input
          type="search"
          placeholder={t('admin.search_placeholder')}
          className="input sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {(counts.pending || 0) > 0 && filter !== 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm text-amber-700">
            <span className="font-medium">{counts.pending}</span> corporation{counts.pending > 1 ? 's' : ''} waiting for approval
          </p>
          <button onClick={() => setFilter('pending')} className="text-xs text-amber-700 font-medium underline">
            View pending
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 whitespace-nowrap ' + (filter === f.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
          >
            {f.label}
            {f.key !== 'all' && counts[f.key] > 0 && (
              <span className={'text-xs px-1.5 py-0.5 rounded-full ' + (f.key === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500')}>
                {counts[f.key]}
              </span>
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
            {search ? 'No results match your search.' : 'No ' + (filter === 'all' ? '' : filter) + ' corporations.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(corp => (
            <CorpRow key={corp.id} corp={corp} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
