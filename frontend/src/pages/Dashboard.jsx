import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

function StatCard({ label, value, color = 'brand' }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold text-${color}-400`}>{value}</p>
    </div>
  )
}

function VolunteerDashboard({ profile }) {
  const [applications, setApplications] = useState([])
  const [registrations, setRegistrations] = useState([])

  useEffect(() => {
    supabase.from('project_applications').select('*, projects(title, organizations(name))').eq('profile_id', profile.id)
      .then(({ data }) => setApplications(data || []))
    supabase.from('event_registrations').select('*, events(title, event_date, organizations(name))').eq('profile_id', profile.id)
      .then(({ data }) => setRegistrations(data || []))
  }, [profile.id])

  const statusColor = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-brand-50 text-brand-700', rejected: 'bg-red-50 text-red-700', completed: 'bg-gray-100 text-gray-600' }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Project applications" value={applications.length} />
        <StatCard label="Event registrations" value={registrations.length} />
        <StatCard label="Hours logged" value={applications.reduce((s, a) => s + (a.hours_logged || 0), 0)} />
      </div>

      <div>
        <h2 className="text-base font-medium mb-3">My project applications</h2>
        {applications.length === 0
          ? <div className="card text-center text-sm text-gray-400 py-8">No applications yet. <Link to="/projects" className="text-brand-400">Browse projects →</Link></div>
          : <div className="flex flex-col gap-2">
              {applications.map(a => (
                <div key={a.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{a.projects?.title}</p>
                    <p className="text-xs text-gray-400">{a.projects?.organizations?.name}</p>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'bg-gray-100 text-gray-600'} capitalize`}>{a.status}</span>
                </div>
              ))}
            </div>
        }
      </div>

      <div>
        <h2 className="text-base font-medium mb-3">My event registrations</h2>
        {registrations.length === 0
          ? <div className="card text-center text-sm text-gray-400 py-8">No registrations yet. <Link to="/events" className="text-brand-400">Browse events →</Link></div>
          : <div className="flex flex-col gap-2">
              {registrations.map(r => (
                <div key={r.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{r.events?.title}</p>
                    <p className="text-xs text-gray-400">{r.events?.organizations?.name} · {r.events?.event_date ? new Date(r.events.event_date).toLocaleDateString() : ''}</p>
                  </div>
                  <span className={`badge ${statusColor[r.status] || 'bg-gray-100 text-gray-600'} capitalize`}>{r.status}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

function OrgDashboard({ profile }) {
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    supabase.from('organization_members').select('organizations(*)').eq('profile_id', profile.id).limit(1).single()
      .then(({ data }) => {
        if (data?.organizations) {
          setOrg(data.organizations)
          const orgId = data.organizations.id
          supabase.from('projects').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
            .then(({ data: p }) => setProjects(p || []))
          supabase.from('events').select('*').eq('organization_id', orgId).order('event_date')
            .then(({ data: e }) => setEvents(e || []))
        }
      })
  }, [profile.id])

  const statusColor = { draft: 'bg-gray-100 text-gray-600', published: 'bg-brand-50 text-brand-700', completed: 'bg-blue-50 text-blue-700', cancelled: 'bg-red-50 text-red-700' }

  return (
    <div className="flex flex-col gap-6">
      {!org ? (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">You don't have an organization yet.</p>
          <Link to="/organizations/register" className="btn-primary">Create your organization</Link>
        </div>
      ) : (
        <>
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center text-2xl font-medium text-brand-600">{org.name[0]}</div>
            <div>
              <h2 className="font-medium">{org.name}</h2>
              <p className="text-sm text-gray-400">{org.city} · {org.type}</p>
            </div>
            <Link to={`/organizations/${org.slug}`} className="btn-secondary ml-auto text-xs px-3 py-1.5">View page</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Projects" value={projects.length} />
            <StatCard label="Events" value={events.length} />
            <StatCard label="Total volunteers" value={projects.reduce((s, p) => s + (p.volunteers_enrolled || 0), 0)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium">Projects</h2>
              <Link to="/projects/new" className="btn-primary text-xs px-3 py-1.5">+ New project</Link>
            </div>
            {projects.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">No projects yet.</div>
              : <div className="flex flex-col gap-2">
                  {projects.map(p => (
                    <div key={p.id} className="card flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.volunteers_enrolled}/{p.volunteers_needed} volunteers</p>
                      </div>
                      <span className={`badge ${statusColor[p.status] || 'bg-gray-100'} capitalize`}>{p.status}</span>
                    </div>
                  ))}
                </div>
            }
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium">Events</h2>
              <Link to="/events/new" className="btn-primary text-xs px-3 py-1.5">+ New event</Link>
            </div>
            {events.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">No events yet.</div>
              : <div className="flex flex-col gap-2">
                  {events.slice(0, 5).map(e => (
                    <div key={e.id} className="card flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-gray-400">{new Date(e.event_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`badge ${statusColor[e.status] || 'bg-gray-100'} capitalize`}>{e.status}</span>
                    </div>
                  ))}
                </div>
            }
          </div>
        </>
      )}
    </div>
  )
}

function CorpDashboard({ profile }) {
  const [corp, setCorp] = useState(null)
  const [members, setMembers] = useState([])

  useEffect(() => {
    supabase.from('corporation_members').select('corporations(*)').eq('profile_id', profile.id).limit(1).single()
      .then(({ data }) => {
        if (data?.corporations) {
          setCorp(data.corporations)
          supabase.from('corporation_members').select('*, profiles(full_name, email, role)')
            .eq('corporation_id', data.corporations.id)
            .then(({ data: m }) => setMembers(m || []))
        }
      })
  }, [profile.id])

  return (
    <div className="flex flex-col gap-6">
      {!corp ? (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">You don't have a corporation registered yet.</p>
          <Link to="/corporations/new" className="btn-primary">Register your corporation</Link>
        </div>
      ) : (
        <>
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl font-medium text-amber-600">{corp.name[0]}</div>
            <div>
              <h2 className="font-medium">{corp.name}</h2>
              <p className="text-sm text-gray-400">{corp.city} · {corp.industry}</p>
            </div>
            <Link to={`/corporations/${corp.slug}`} className="btn-secondary ml-auto text-xs px-3 py-1.5">View page</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Enrolled employees" value={members.length} color="amber" />
            <StatCard label="Total volunteer hours" value={0} color="amber" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium">Employee volunteers</h2>
            </div>
            {members.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">No employee volunteers yet.</div>
              : <div className="flex flex-col gap-2">
                  {members.map(m => (
                    <div key={m.id} className="card flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-sm font-medium text-amber-600">
                        {m.profiles?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.profiles?.full_name}</p>
                        <p className="text-xs text-gray-400">{m.profiles?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuthStore()

  if (!profile) return null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          {greeting()}, {profile.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">
          Signed in as <span className="font-medium text-gray-700">{profile.role?.replace('_', ' ')}</span>
        </p>
      </div>

      {profile.role === 'volunteer' && <VolunteerDashboard profile={profile} />}
      {profile.role === 'org_admin' && <OrgDashboard profile={profile} />}
      {profile.role === 'corp_admin' && <CorpDashboard profile={profile} />}
      {profile.role === 'super_admin' && (
        <div className="card text-center py-10">
          <p className="text-gray-500">Super admin panel coming soon.</p>
        </div>
      )}
    </div>
  )
}
