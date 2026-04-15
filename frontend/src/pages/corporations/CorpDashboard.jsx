import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function CorpDashboard() {
  const { user } = useAuthStore()
  const [corp, setCorp] = useState(null)
  const [members, setMembers] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [acting, setActing] = useState(null)
  const [toast, setToast] = useState(null)

  const flash = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { load() }, [user])

  const load = async () => {
    if (!user) return []
    setLoading(true)
    const { data: row } = await supabase
      .from('corporation_members')
      .select('corporation_id')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .eq('request_status', 'approved')
      .single()
    if (!row) { setLoading(false); return [] }
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('corporations').select('*').eq('id', row.corporation_id).single(),
      supabase.from('corporation_members')
        .select('*, profiles!corporation_members_profile_id_fkey(full_name, email, avatar_url, city)')
        .eq('corporation_id', row.corporation_id)
        .order('requested_at', { ascending: false }),
    ])
    setCorp(c)
    const fresh = m || []
    setMembers(fresh)
    setLoading(false)
    return fresh
  }

  const approve = (id, name) => {
    setConfirm({
      title: 'Approve membership?',
      message: name,
      confirmLabel: 'Approve',
      variant: 'default',
      onConfirm: () => _execApprove(id),
    })
  }
  const _execApprove = async (id) => {
    setActing(id)
    await supabase.from('corporation_members')
      .update({ request_status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    flash('Member approved')
    const fresh = await load()
    const stillPending = fresh.filter(m => m.request_status === 'pending')
    if (stillPending.length === 0) setTab('members')
    setActing(null)
  }

  const decline = (id, name) => {
    setConfirm({
      title: 'Decline membership request?',
      message: name,
      confirmLabel: 'Decline',
      variant: 'danger',
      onConfirm: () => _execDecline(id),
    })
  }
  const _execDecline = async (id) => {
    setActing(id)
    await supabase.from('corporation_members')
      .update({ request_status: 'declined', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    flash('Request declined')
    await load()
    setActing(null)
  }

  const remove = (id, name) => {
    setConfirm({
      title: 'Remove member?',
      message: name,
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: () => _execRemove(id, name),
    })
  }
  const _execRemove = async (id, name) => {
    setActing(id)
    await supabase.from('corporation_members').delete().eq('id', id)
    flash(name + ' removed')
    load()
    setActing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!corp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">You are not an admin of any corporation.</p>
        <Link to="/corporations/register" className="btn-primary">Register a corporation</Link>
      </div>
    )
  }

  const approved = members.filter(m => m.request_status === 'approved')
  const pending = members.filter(m => m.request_status === 'pending')

  const statusColor = {
    pending: 'text-amber-600',
    approved: 'text-brand-600',
    declined: 'text-red-600',
    suspended: 'text-gray-500',
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members (' + approved.length + ')' },
    { key: 'requests', label: 'Requests' + (pending.length > 0 ? ' (' + pending.length + ')' : '') },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
      {toast && (
        <div className={'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ' + (toast.type === 'error' ? 'bg-red-500' : 'bg-brand-400')}>
          {toast.msg}
        </div>
      )}

      <div className="card mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-xl shrink-0 overflow-hidden">
            {corp.logo_url
              ? <img src={corp.logo_url} alt={corp.name} className="w-14 h-14 rounded-xl object-cover" />
              : corp.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-medium text-gray-900">{corp.name}</h1>
            <p className={'text-sm font-medium capitalize ' + (statusColor[corp.status] || 'text-gray-500')}>{corp.status}</p>
            {corp.industry && <p className="text-xs text-gray-400 mt-0.5">{corp.industry}</p>}
            {corp.status === 'pending' && <p className="text-xs text-amber-600 mt-0.5">Awaiting portal admin approval</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={'/corporations/' + corp.slug} className="btn-secondary text-sm">View page</Link>
          <Link to="/corp/settings" className="btn-primary text-sm">Edit corp</Link>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <p className="text-sm text-amber-700 font-medium">
            {pending.length} membership request{pending.length > 1 ? 's' : ''} waiting for approval
          </p>
          <button onClick={() => setTab('requests')} className="text-xs text-amber-700 font-medium underline">
            Review
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ' + (tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Approved members', value: approved.length },
            { label: 'Pending requests', value: pending.length },
            { label: 'Volunteer hours', value: 0 },
            { label: 'Projects joined', value: 0 },
          ].map(s => (
            <div key={s.label} className="card text-center py-5">
              <p className="text-2xl font-medium text-brand-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div className="flex flex-col gap-3">
          {approved.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No approved members yet.</div>
          ) : (
            approved.map(m => {
              const initial = (m.profiles?.full_name?.[0] || m.profiles?.email?.[0] || '?').toUpperCase()
              return (
                <div key={m.id} className="card flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-medium shrink-0 overflow-hidden">
                    {m.profiles?.avatar_url
                      ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                      : initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {m.profiles?.full_name || '-'}
                      {m.profile_id === user.id && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.profiles?.email}</p>
                    {m.profiles?.city && <p className="text-xs text-gray-400">{m.profiles.city}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={'badge text-xs px-2 py-0.5 capitalize ' + (m.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}>
                      {m.role}
                    </span>
                    {m.profile_id !== user.id && (
                      <button
                        onClick={() => remove(m.id, m.profiles?.full_name || 'member')}
                        disabled={acting === m.id}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No pending membership requests.</div>
          ) : (
            pending.map(m => {
              const initial = (m.profiles?.full_name?.[0] || '?').toUpperCase()
              return (
                <div key={m.id} className="card flex items-start gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-medium shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{m.profiles?.full_name || '-'}</p>
                    <p className="text-xs text-gray-400">{m.profiles?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Requested {new Date(m.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approve(m.id)}
                      disabled={acting === m.id}
                      className="btn-primary text-xs py-1.5"
                    >
                      {acting === m.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => decline(m.id)}
                      disabled={acting === m.id}
                      className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
