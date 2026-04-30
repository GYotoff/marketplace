import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import RankingBadge from '@/components/ui/RankingBadge'

function StatCard({ label, value, color = 'brand' }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold text-${color}-400`}>{value}</p>
    </div>
  )
}

function VolunteerDashboard({ profile }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [applications,   setApplications]   = useState([])
  const [registrations,  setRegistrations]  = useState([])
  const [corpMembership, setCorpMembership] = useState(null)
  const [ranking,        setRanking]        = useState(null)

  useEffect(() => {
    supabase.from('project_applications').select('*, projects(title, organizations(name))').eq('profile_id', profile.id)
      .then(({ data }) => setApplications(data || []))
    // Use RPC to bypass RLS — fetches all registered events including completed ones
    supabase.rpc('get_volunteer_registered_events')
      .then(({ data }) => setRegistrations(data || []))
    if (profile.ranking_id) {
      supabase.from('rankings').select('id,type,type_bg,icon_url,message,message_bg')
        .eq('id', profile.ranking_id).single()
        .then(({ data }) => { if (data) setRanking(data) })
    }
    supabase.from('corporation_members')
      .select('request_status, reviewed_at, corporations(id, name, slug, logo_url, city, industry)')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.corporations) setCorpMembership(data) })
  }, [profile.id])

  const STATUS_LABEL = {
  pending:   { en: 'Pending',   bg: 'Чакащ' },
  approved:  { en: 'Approved',  bg: 'Одобрен' },
  declined:  { en: 'Declined',  bg: 'Отказан' },
  withdrawn: { en: 'Withdrawn', bg: 'Оттеглен' },
  confirmed: { en: 'Confirmed', bg: 'Потвърден' },
  attended:  { en: 'Attended',  bg: 'Присъствал' },
  cancelled: { en: 'Cancelled', bg: 'Отказан' },
}

const statusColor = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-brand-50 text-brand-700', rejected: 'bg-red-50 text-red-700', completed: 'bg-gray-100 text-gray-600' }
  const memberBadge = {
    approved: 'bg-brand-50 text-brand-700 border border-brand-200',
    pending:  'bg-amber-50 text-amber-700 border border-amber-200',
    declined: 'bg-red-50 text-red-700 border border-red-200',
  }

  const L = {
    corp_membership:      lang === 'bg' ? 'Членство в корпорация'          : 'Corporation membership',
    project_applications: lang === 'bg' ? 'Заявки за проекти'              : 'Project applications',
    event_registrations:  lang === 'bg' ? 'Регистрации за събития'         : 'Event registrations',
    hours_logged:         lang === 'bg' ? 'Отработени часове'              : 'Hours logged',
    my_applications:      lang === 'bg' ? 'Моите заявки за проекти'        : 'My project applications',
    my_registrations:     lang === 'bg' ? 'Моите регистрации за събития'   : 'My event registrations',
    no_applications:      lang === 'bg' ? 'Няма заявки. '                  : 'No applications yet. ',
    no_registrations:     lang === 'bg' ? 'Няма регистрации. '             : 'No registrations yet. ',
    browse_projects:      lang === 'bg' ? 'Разгледай проекти →'            : 'Browse projects →',
    browse_events:        lang === 'bg' ? 'Разгледай събития →'            : 'Browse events →',
    view_page:            lang === 'bg' ? 'Виж страницата'                 : 'View page',
    pending_msg:          lang === 'bg' ? 'Заявката ви за членство очаква одобрение от администратора.' : 'Your membership request is awaiting approval from the company admin.',
    approved_msg:         lang === 'bg' ? 'Вие сте одобрен корпоративен доброволец за тази компания.'  : 'You are an approved corporate volunteer for this company.',
    declined_msg:         lang === 'bg' ? 'Заявката ви за членство не беше одобрена.'                  : 'Your membership request was not approved.',
    your_ranking:         lang === 'bg' ? 'Вашият ранг'                                                   : 'Your ranking',
    since:                lang === 'bg' ? 'От'                                                            : 'Since',
    my_past_events:       lang === 'bg' ? 'Минали събития'                       : 'Past events',
  }
  const _now = new Date()
  const _upcomingRegs = registrations.filter(r => r.event_status !== 'completed' && r.event_date && new Date(r.event_date) >= _now)
  const _pastRegs = registrations.filter(r => r.event_status === 'completed' || (r.event_date && new Date(r.event_date) < _now))
  return (
    <div className="flex flex-col gap-6">

      {corpMembership && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-gray-900">{L.corp_membership}</h2>
            <span className={`badge text-xs px-2 py-0.5 capitalize ${memberBadge[corpMembership.request_status] || 'bg-gray-100 text-gray-600'}`}>
              {corpMembership.request_status}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-lg shrink-0 overflow-hidden">
              {corpMembership.corporations?.logo_url
                ? <img src={corpMembership.corporations.logo_url} alt="" className="w-full h-full object-cover" />
                : (corpMembership.corporations?.name?.[0] || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{corpMembership.corporations?.name}</p>
              <p className="text-xs text-gray-400">
                {corpMembership.corporations?.city}{corpMembership.corporations?.industry ? ` · ${corpMembership.corporations.industry}` : ''}
              </p>
              {corpMembership.request_status === 'pending'  && <p className="text-xs text-amber-600 mt-0.5">{L.pending_msg}</p>}
              {corpMembership.request_status === 'approved' && <p className="text-xs text-brand-600 mt-0.5">{L.approved_msg}</p>}
              {corpMembership.request_status === 'declined' && <p className="text-xs text-red-600 mt-0.5">{L.declined_msg}</p>}
            </div>
            {corpMembership.corporations?.slug && (
              <Link to={`/corporations/${corpMembership.corporations.slug}`} className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                {L.view_page}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Ranking card ── */}
      {ranking && (
        <div className="card flex items-center gap-4">
          <RankingBadge
            rankingType={ranking.type}
            rankingTypeBg={ranking.type_bg}
            iconUrl={ranking.icon_url}
            size="lg"
            lang={lang}
          />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-faint)' }}>
              {L.your_ranking}
            </p>
            <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              {lang === 'bg' ? (ranking.type_bg || ranking.type) : ranking.type}
            </p>
            {(lang === 'bg' ? (ranking.message_bg || ranking.message) : ranking.message) && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {lang === 'bg' ? (ranking.message_bg || ranking.message) : ranking.message}
              </p>
            )}
            {profile.ranking_date && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {L.since}: {new Date(profile.ranking_date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}
              </p>
            )}
          </div>
        </div>
      )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={L.project_applications} value={applications.length} />
        <StatCard label={L.event_registrations}  value={registrations.length} />
        <StatCard label={L.hours_logged}          value={registrations.reduce((s, r) => s + (r.hours_logged || 0), 0)} />
			</div>

      <div>
        <h2 className="text-base font-medium mb-3">{L.my_applications}</h2>
        {applications.length === 0
          ? <div className="card text-center text-sm text-gray-400 py-8">{L.no_applications}<Link to="/projects" className="text-brand-400">{L.browse_projects}</Link></div>
          : <div className="flex flex-col gap-2">
              {applications.map(a => (
                <div key={a.id} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={'/projects/' + a.project_id} className="font-medium text-sm hover:text-brand-500 transition-colors block truncate">{a.projects?.title}</Link>
                    <p className="text-xs text-gray-400 truncate">{a.projects?.organizations?.name}</p>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[a.status]?.[lang] || a.status}</span>
                </div>
              ))}
            </div>
        }
      </div>

      <div>
            <h2 className="text-base font-medium mb-3">{L.my_registrations}</h2>
            {_upcomingRegs.length === 0 && _pastRegs.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">{L.no_registrations}<Link to="/events" className="text-brand-400">{L.browse_events}</Link></div>
              : <div className="flex flex-col gap-3">
                  {_upcomingRegs.length > 0 && <div className="flex flex-col gap-2">
                    {_upcomingRegs.map(r => (
                <div key={r.reg_id} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={'/events/' + r.event_id} className="font-medium text-sm hover:text-brand-500 transition-colors block truncate">{r.event_title}</Link>
                    <p className="text-xs text-gray-400 truncate">
                      {r.org_name}{r.event_date ? ' · ' + new Date(r.event_date).toLocaleDateString() : ''}
                      {r.hours_logged > 0 ? ' · ⏱ ' + r.hours_logged + 'h' : ''}
                    </p>
                  </div>
                  <span className={`badge ${statusColor[r.reg_status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[r.reg_status]?.[lang] || r.reg_status}</span>
                </div>
                    ))}
                  </div>}
                  {_pastRegs.length > 0 && <>
                    <h3 className="text-xs font-medium uppercase tracking-wide mt-2" style={{color:'var(--text-faint)'}}>{L.my_past_events}</h3>
                    <div className="flex flex-col gap-2">
                      {_pastRegs.map(r => (
                        <div key={r.reg_id} className="card flex items-center justify-between gap-3 opacity-80">
                          <div className="min-w-0">
                            <Link to={'/events/' + r.event_id} className="font-medium text-sm hover:text-brand-500 transition-colors block truncate">{r.event_title}</Link>
                            <p className="text-xs text-gray-400 truncate">
                              {r.org_name}{r.event_date ? ' · ' + new Date(r.event_date).toLocaleDateString() : ''}
                              {r.hours_logged > 0 ? ' · ⏱ ' + r.hours_logged + 'h' : ''}
                            </p>
                          </div>
                          <span className={`badge ${statusColor[r.reg_status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[r.reg_status]?.[lang] || r.reg_status}</span>
                        </div>
                      ))}
                    </div>
                  </>}
                </div>}
		</div>
    
  )
}

function OrgDashboard({ profile }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [events, setEvents] = useState([])
  const [totalOrgVolunteers, setTotalOrgVolunteers] = useState(0)

  useEffect(() => {
    supabase.from('organization_members').select('organizations(*)').eq('profile_id', profile.id).limit(1).single()
      .then(({ data }) => {
        if (data?.organizations) {
          setOrg(data.organizations)
          const orgId = data.organizations.id
          supabase.from('projects').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
            .then(({ data: p }) => setProjects(p || []))
          supabase.from('events').select('*').eq('organization_id', orgId).order('event_date')
            .then(({ data: e }) => {
        setEvents(e || [])
        if (e?.length) {
          supabase.from('event_registrations')
            .select('profile_id', { count: 'exact', head: true })
            .in('status', ['approved','confirmed'])
            .in('event_id', e.map(ev => ev.id))
            .then(({count}) => setTotalOrgVolunteers(count || 0))
        }
      })
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
            <Link to={`/organizations/${org.slug}`} className="btn-secondary ml-auto text-xs px-3 py-1.5">{lang==='bg'?'Виж страницата':'View page'}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label={lang==='bg'?'Проекти':'Projects'} value={projects.length} />
            <StatCard label={lang==='bg'?'Събития':'Events'} value={events.length} />
            <StatCard label={lang==='bg'?'Общо доброволци':'Total volunteers'} value={totalOrgVolunteers} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium">{lang==='bg'?'Проекти':'Projects'}</h2>
            </div>
            {projects.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">No projects yet.</div>
              : <div className="flex flex-col gap-2">
                  {projects.map(p => (
                    <div key={p.id} className="card flex items-center justify-between gap-3">
                      <div>
                        <Link to={'/org/projects/'+p.id} className="font-medium text-sm hover:text-brand-500 transition-colors block">{lang==='bg'?(p.title_bg||p.title):p.title}</Link>
                        <p className="text-xs text-gray-400">{p.volunteers_enrolled}/{p.volunteers_needed} {lang==='bg'?'доброволци':'volunteers'}</p>
                      </div>
                      <span className={`badge ${statusColor[p.status] || 'bg-gray-100'} capitalize`}>{lang==='bg'?({active:'Активен',completed:'Завършен',draft:'Чернова',cancelled:'Отменен',archived:'Архивиран'}[p.status]||p.status):p.status}</span>
                    </div>
                  ))}
                </div>
            }
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium">{lang==='bg'?'Събития':'Events'}</h2>
            </div>
            {events.length === 0
              ? <div className="card text-center text-sm text-gray-400 py-8">{lang==='bg'?'Няма все още събития.':'No events yet.'}</div>
              : <div className="flex flex-col gap-2">
                  {events.slice(0, 5).map(e => (
                    <div key={e.id} className="card flex items-center justify-between gap-3">
                      <div>
                        <Link to={'/org/event/'+e.id+'/edit'} className="font-medium text-sm hover:text-brand-500 transition-colors block">{lang==='bg'?(e.title_bg||e.title):e.title}</Link>
                        <p className="text-xs text-gray-400">{new Date(e.event_date).toLocaleDateString(lang==='bg'?'bg-BG':'en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
                      </div>
                      <span className={`badge ${statusColor[e.status] || 'bg-gray-100'} capitalize`}>{lang==='bg'?({published:'Публикувано',draft:'Чернова',cancelled:'Отменено',completed:'Завършено'}[e.status]||e.status):e.status}</span>
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
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [corp, setCorp] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    supabase.from('corporation_members')
      .select('corporation_id, role, corporations(*)')
      .eq('profile_id', profile.id)
      .eq('role', 'admin')
      .eq('request_status', 'approved')
      .single()
      .then(({ data }) => {
        if (data?.corporations) {
          setCorp(data.corporations)
          supabase.from('corporation_members').select('id, request_status')
            .eq('corporation_id', data.corporations.id)
            .then(({ data: m }) => {
              setMemberCount((m || []).filter(x => x.request_status === 'approved').length)
              setPendingCount((m || []).filter(x => x.request_status === 'pending').length)
            })
        }
      })
  }, [profile.id])

  return (
    <div className="flex flex-col gap-6">
      {!corp ? (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">You don't have a corporation registered yet.</p>
          <Link to="/corporations/register" className="btn-primary">Register your corporation</Link>
        </div>
      ) : (
        <>
          <div className="card flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl font-medium text-amber-600 overflow-hidden">
              {corp.logo_url ? <img src={corp.logo_url} alt={corp.name} className="w-full h-full object-cover" /> : corp.name[0]}
            </div>
            <div>
              <h2 className="font-medium">{corp.name}</h2>
              <p className="text-sm text-gray-400">{corp.city}{corp.industry ? ` · ${corp.industry}` : ''}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <Link to="/corp/dashboard" className="btn-secondary text-xs px-3 py-1.5">Dashboard</Link>
              <Link to="/corp/settings" className="btn-primary text-xs px-3 py-1.5">Settings</Link>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-amber-700 font-medium">{pendingCount} membership request{pendingCount > 1 ? 's' : ''} waiting</p>
              <Link to="/corp/dashboard" className="text-xs text-amber-700 font-medium underline">Review →</Link>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Approved members" value={memberCount} color="amber" />
            <StatCard label="Pending requests" value={pendingCount} color="amber" />
          </div>
          <div className="flex gap-3">
            <Link to="/corp/dashboard" className="btn-secondary flex-1 text-center text-sm">View all members</Link>
            <Link to="/corp/dashboard" className="btn-primary flex-1 text-center text-sm">Manage corp</Link>
          </div>
        </>
      )}
    </div>
  )
}


function SuperAdminDashboard({ profile }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [counts, setCounts] = useState({ orgPending: 0, orgApproved: 0, corpPending: 0, users: 0, volunteers: 0, orgAdmins: 0, corpAdmins: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('corporations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'volunteer').eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'org_admin').eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'corp_admin').eq('is_active', true),
    ]).then(([orgPending, orgApproved, corpPending, vols, orgAdmins, corpAdmins]) => {
      setCounts({
        orgPending:  orgPending.count   || 0,
        orgApproved: orgApproved.count  || 0,
        corpPending: corpPending.count  || 0,
        volunteers:  vols.count         || 0,
        orgAdmins:   orgAdmins.count    || 0,
        corpAdmins:  corpAdmins.count   || 0,
      })
    })
  }, [])

  const totalPending = counts.orgPending + counts.corpPending

  const actions = [
    {
      label: t('dashboard.org_approvals'),
      desc: counts.orgPending > 0 ? counts.orgPending + (lang === 'bg' ? ' чакат преглед' : ' pending review') : (lang === 'bg' ? 'Няма чакащи заявки' : 'No pending requests'),
      to: '/admin/organizations',
      urgent: counts.orgPending > 0,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: t('dashboard.corp_approvals'),
      desc: counts.corpPending > 0 ? counts.corpPending + (lang === 'bg' ? ' чакат преглед' : ' pending review') : (lang === 'bg' ? 'Няма чакащи заявки' : 'No pending requests'),
      to: '/admin/corporations',
      urgent: counts.corpPending > 0,
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    {
      label: t('dashboard.entity_management'),
      desc: counts.volunteers + (lang === 'bg' ? ' регистрирани' : ' registered'),
      to: '/admin/entities',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },

  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label={lang === 'bg' ? 'Чакащи организации' : 'Pending orgs'} value={counts.orgPending} color="amber" />
        <StatCard label={lang === 'bg' ? 'Чакащи корпорации' : 'Pending corps'} value={counts.corpPending} color="amber" />
        <StatCard label={lang === 'bg' ? 'Общо доброволци' : 'Total volunteers'} value={counts.volunteers} color="brand" />
        <StatCard label={lang === 'bg' ? 'Админи организации' : 'Org admins'} value={counts.orgAdmins} color="blue" />
        <StatCard label={lang === 'bg' ? 'Админи корпорации' : 'Corp admins'} value={counts.corpAdmins} color="blue" />
      </div>

      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-700 font-medium">
            {lang === 'bg'
              ? <>
                  {counts.orgPending > 0 && counts.orgPending + ' организации'}
                  {counts.orgPending > 0 && counts.corpPending > 0 && ' и '}
                  {counts.corpPending > 0 && counts.corpPending + ' корпорации'}
                  {' чакат одобрение'}
                </>
              : <>
                  {counts.orgPending > 0 && counts.orgPending + ' org' + (counts.orgPending > 1 ? 's' : '')}
                  {counts.orgPending > 0 && counts.corpPending > 0 && ' and '}
                  {counts.corpPending > 0 && counts.corpPending + ' corporation' + (counts.corpPending > 1 ? 's' : '')}
                  {' waiting for approval'}
                </>}
          </p>
          <div className="flex gap-2">
            {counts.orgPending > 0 && (
              <Link to="/admin/organizations" className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600">
                {lang === 'bg' ? 'Организации' : 'Orgs'}
              </Link>
            )}
            {counts.corpPending > 0 && (
              <Link to="/admin/corporations" className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600">
                {lang === 'bg' ? 'Корпорации' : 'Corps'}
              </Link>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">{lang === 'bg' ? 'Бързи действия' : 'Quick actions'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map(a => (
            <Link key={a.to} to={a.to}
              className={"card flex items-start gap-4 hover:border-gray-200 hover:shadow-sm transition-all " + (a.urgent ? 'border-amber-200 bg-amber-50' : '')}>
              <div className={"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " + (a.urgent ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand-600')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={a.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{a.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuthStore()
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  if (!profile) return null

  const ROLE_LABELS = {
    volunteer: t('role_labels.volunteer'),
    org_admin: t('role_labels.org_admin'),
    corp_admin: t('role_labels.corp_admin'),
    super_admin: t('role_labels.super_admin'),
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return t('dashboard.greeting_morning')
    if (h < 17) return t('dashboard.greeting_afternoon')
    return t('dashboard.greeting_evening')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">
          {greeting()}, {(lang === 'bg' ? (profile.full_name_bg || profile.full_name) : profile.full_name)?.split(' ')[0] || (lang === 'bg' ? 'там' : 'there')} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t('dashboard.signed_in_as')} <span className="font-medium text-gray-700">{ROLE_LABELS[profile.role] || profile.role}</span>
        </p>
      </div>

      {profile.role === 'volunteer' && <VolunteerDashboard profile={profile} />}
      {profile.role === 'org_admin' && <OrgDashboard profile={profile} />}
      {profile.role === 'corp_admin' && <CorpDashboard profile={profile} />}
      {profile.role === 'super_admin' && <SuperAdminDashboard profile={profile} />}
    </div>
  )
}
