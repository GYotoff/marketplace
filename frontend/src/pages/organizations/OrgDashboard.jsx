import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const ROLE_BADGE = {
  admin: 'bg-purple-50 text-purple-700 border border-purple-200',
  content_creator: 'bg-blue-50 text-blue-700 border border-blue-200',
}

const STATUS_BADGE = {
  pending:  'bg-amber-50 text-amber-700',
  approved: 'bg-brand-50 text-brand-700',
  declined: 'bg-red-50 text-red-700',
}

export default function OrgDashboard() {
  const { user, profile } = useAuthStore()
  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchOrgData()
  }, [user])

  const fetchOrgData = async () => {
    if (!user) return
    setLoading(true)

    // Get org where user is admin
    const { data: memberRow } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!memberRow) { setLoading(false); return }

    const [orgRes, membersRes, requestsRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', memberRow.organization_id).single(),
      supabase.from('organization_members')
        .select('*, profiles!organization_members_profile_id_fkey(full_name, email, avatar_url)')
        .eq('organization_id', memberRow.organization_id),
      supabase.from('org_creator_requests')
        .select('*, profiles!organization_members_profile_id_fkey(full_name, email, avatar_url)')
        .eq('organization_id', memberRow.organization_id)
        .eq('status', 'pending'),
    ])

    setOrg(orgRes.data)
    setMembers(membersRes.data || [])
    setRequests(requestsRes.data || [])
    setLoading(false)
  }

  const handleCreatorRequest = async (requestId, profileId, action) => {
    setActionLoading(requestId)
    const status = action === 'approve' ? 'approved' : 'declined'

    await supabase.from('org_creator_requests')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)

    if (action === 'approve') {
      // Add as content creator member
      await supabase.from('organization_members').upsert({
        organization_id: org.id,
        profile_id: profileId,
        role: 'content_creator',
        request_status: 'approved',
        invited_by: user.id,
      }, { onConflict: 'organization_id,profile_id' })
    }

    setActionLoading(null)
    fetchOrgData()
  }

  const handleRevokeMember = async (memberId, profileId) => {
    if (!confirm('Remove this member from the organization?')) return
    setActionLoading(memberId)
    await supabase.from('organization_members')
      .delete()
      .eq('id', memberId)
      .neq('profile_id', user.id) // can't remove yourself
    setActionLoading(null)
    fetchOrgData()
  }

  const handleChangeMemberRole = async (memberId, newRole) => {
    setActionLoading(memberId)
    await supabase.from('organization_members').update({ role: newRole }).eq('id', memberId)
    setActionLoading(null)
    fetchOrgData()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!org) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 mb-4">You are not an admin of any organization.</p>
      <Link to="/organizations/register" className="btn-primary">Register an organization</Link>
    </div>
  )

  const statusColor = { pending: 'text-amber-600', approved: 'text-brand-600', declined: 'text-red-600', suspended: 'text-gray-500' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Org header */}
      <div className="card mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xl shrink-0">
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-14 h-14 rounded-xl object-cover" />
              : org.name[0]
            }
          </div>
          <div>
            <h1 className="text-xl font-medium text-gray-900">{org.name}</h1>
            <p className={`text-sm font-medium capitalize ${statusColor[org.status]}`}>{org.status}</p>
            {org.status === 'pending' && (
              <p className="text-xs text-amber-600 mt-0.5">Awaiting portal admin approval before going live</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/organizations/${org.slug}`} className="btn-secondary text-sm">View page</Link>
          <Link to="/org/settings" className="btn-primary text-sm">Edit org</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'members', label: `Members (${members.length})` },
          { key: 'requests', label: `Creator requests${requests.length > 0 ? ` (${requests.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.key === 'requests' && requests.length > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Members', value: members.length },
            { label: 'Pending requests', value: requests.length },
            { label: 'Projects', value: 0 },
            { label: 'Events', value: 0 },
          ].map(s => (
            <div key={s.label} className="card text-center py-5">
              <p className="text-2xl font-medium text-brand-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div className="flex flex-col gap-3">
          {members.map(m => {
            const isMe = m.profile_id === user.id
            return (
              <div key={m.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-medium shrink-0 overflow-hidden">
                  {m.profiles?.avatar_url
                    ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                    : (m.profiles?.full_name?.[0] || '?').toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {m.profiles?.full_name || 'Unknown'} {isMe && <span className="text-xs text-gray-400">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{m.profiles?.email}</p>
                </div>
                <span className={`badge text-xs px-2 py-0.5 capitalize shrink-0 ${ROLE_BADGE[m.role]}`}>
                  {m.role.replace('_', ' ')}
                </span>
                {!isMe && (
                  <div className="flex gap-2 shrink-0">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                      value={m.role}
                      onChange={e => handleChangeMemberRole(m.id, e.target.value)}
                      disabled={actionLoading === m.id}
                    >
                      <option value="admin">Admin</option>
                      <option value="content_creator">Content creator</option>
                    </select>
                    <button
                      onClick={() => handleRevokeMember(m.id, m.profile_id)}
                      disabled={actionLoading === m.id}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-2.5 py-1.5"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Creator requests tab */}
      {tab === 'requests' && (
        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No pending requests</div>
          ) : requests.map(req => (
            <div key={req.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium shrink-0 overflow-hidden">
                {req.profiles?.avatar_url
                  ? <img src={req.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                  : (req.profiles?.full_name?.[0] || '?').toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{req.profiles?.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{req.profiles?.email}</p>
                {req.message && <p className="text-sm text-gray-500 mt-1 italic">"{req.message}"</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Requested {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleCreatorRequest(req.id, req.profile_id, 'approve')}
                  disabled={actionLoading === req.id}
                  className="btn-primary text-xs py-1.5">
                  {actionLoading === req.id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleCreatorRequest(req.id, req.profile_id, 'decline')}
                  disabled={actionLoading === req.id}
                  className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
