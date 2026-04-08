import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'

const STATUS_BADGE = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-brand-50 text-brand-700 border border-brand-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border border-gray-200',
}

function OrgRow({ org, onAction }) {
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async (status) => {
    setLoading(true)
    await onAction(org.id, status, note)
    setLoading(false)
    setOpen(false)
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900">{org.name}</h3>
            <span className={`badge text-xs px-2 py-0.5 capitalize ${STATUS_BADGE[org.status]}`}>{org.status}</span>
            <span className="badge bg-gray-50 text-gray-500 border border-gray-200 text-xs capitalize">{org.type}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{org.city} · {org.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {new Date(org.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {org.profiles && ` by ${org.profiles.full_name || org.profiles.email}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/organizations/${org.slug}`} target="_blank"
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
            Preview
          </Link>
          {org.status === 'pending' && (
            <button onClick={() => setOpen(!open)}
              className="text-xs btn-primary py-1.5">
              Review
            </button>
          )}
          {org.status === 'approved' && (
            <button onClick={() => handle('suspended')} disabled={loading}
              className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5">
              Suspend
            </button>
          )}
          {(org.status === 'declined' || org.status === 'suspended') && (
            <button onClick={() => handle('approved')} disabled={loading}
              className="text-xs btn-primary py-1.5">
              Approve
            </button>
          )}
        </div>
      </div>

      {/* Description preview */}
      {org.description && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed border-t border-gray-100 pt-3">
          {org.description}
        </p>
      )}

      {/* Review panel */}
      {open && (
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Review note (optional — sent to org admin)</label>
            <textarea rows={2} className="input resize-none text-sm" placeholder="e.g. Registration approved. Welcome to GiveForward!"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handle('approved')} disabled={loading}
              className="btn-primary text-sm flex items-center gap-1.5">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Approve
            </button>
            <button onClick={() => handle('declined')} disabled={loading}
              className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 text-sm">
              Decline
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrganizations() {
  const { profile } = useAuthStore()
  const [orgs, setOrgs] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({})

  const fetchOrgs = async () => {
    setLoading(true)
    const query = supabase
      .from('organizations')
      .select('*, profiles!organizations_created_by_fkey(full_name, email)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query.eq('status', filter)

    const { data } = await query
    setOrgs(data || [])
    setLoading(false)
  }

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'declined', 'suspended']
    const results = await Promise.all(
      statuses.map(s => supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', s))
    )
    const c = {}
    statuses.forEach((s, i) => { c[s] = results[i].count || 0 })
    setCounts(c)
  }

  useEffect(() => { fetchOrgs(); fetchCounts() }, [filter])

  const handleAction = async (id, status, note) => {
    await supabase.from('organizations').update({
      status,
      review_note: note || null,
      reviewed_by: profile?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    fetchOrgs()
    fetchCounts()
  }

  const FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'declined', label: 'Declined' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Organization approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve organization registration requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
              filter === f.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
            {counts[f.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                f.key === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
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
      ) : orgs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No {filter === 'all' ? '' : filter} organizations found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orgs.map(org => (
            <OrgRow key={org.id} org={org} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
