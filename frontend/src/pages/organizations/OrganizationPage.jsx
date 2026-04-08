import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const TYPE_LABEL = {
  ngo: 'NGO', nonprofit: 'Non-profit', company: 'Company',
  government: 'Government organization', education: 'Education',
  investor: 'Investor', other: 'Other',
}
const TYPE_LABEL_BG = {
  ngo: 'НПО', nonprofit: 'Организация с нестопанска цел', company: 'Компания',
  government: 'Правителствена институция', education: 'Образование',
  investor: 'Инвеститор', other: 'Друго',
}

function SocialLink({ href, icon, label }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-400 transition-colors">
      {icon}
      <span>{label}</span>
    </a>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

export default function OrganizationPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [org, setOrg] = useState(null)
  const [projects, setProjects] = useState([])
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('about')

  useEffect(() => {
    fetchOrg()
  }, [slug])

  const fetchOrg = async () => {
    setLoading(true)

    const { data: orgData, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !orgData) { setNotFound(true); setLoading(false); return }
    setOrg(orgData)

    // Fetch published projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, title, title_bg, description, description_bg, city, start_date, end_date, volunteers_needed, volunteers_enrolled, status, cover_url, categories(name, name_bg, color)')
      .eq('organization_id', orgData.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6)

    setProjects(projectsData || [])

    // Fetch upcoming events
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, title_bg, description, description_bg, city, event_date, volunteers_needed, volunteers_enrolled, is_online, status')
      .eq('organization_id', orgData.id)
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .limit(6)

    setEvents(eventsData || [])

    // Fetch public member count
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgData.id)

    setMembers(count || 0)
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-4xl mb-4">🏢</p>
      <h1 className="text-xl font-medium text-gray-900 mb-2">Organization not found</h1>
      <p className="text-gray-500 text-sm mb-6">This organization doesn't exist or is not yet approved.</p>
      <Link to="/organizations" className="btn-primary">Browse organizations</Link>
    </div>
  )

  const name = org.name
  const description = (i18n.language === 'bg' && org.description_bg) ? org.description_bg : org.description
  const tagline = (i18n.language === 'bg' && org.tagline_bg) ? org.tagline_bg : org.tagline
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const TABS = [
    { key: 'about', label: 'About' },
    { key: 'projects', label: `Projects (${projects.length})` },
    { key: 'events', label: `Events (${events.length})` },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Cover image */}
      {org.cover_url && (
        <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          <img src={org.cover_url} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">

          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-2xl shrink-0 overflow-hidden border border-gray-100">
            {org.logo_url
              ? <img src={org.logo_url} alt={name} className="w-full h-full object-cover" />
              : initials
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-medium text-gray-900">{name}</h1>
              {org.is_verified && (
                <svg className="w-5 h-5 text-brand-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
              <span className="badge bg-brand-50 text-brand-700 text-xs capitalize">
                {(i18n.language === 'bg' ? TYPE_LABEL_BG[org.type] : TYPE_LABEL[org.type]) || org.type}
              </span>
            </div>

            {tagline && <p className="text-gray-500 text-sm mb-2">{tagline}</p>}

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {org.city && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {org.city}
                </span>
              )}
              {org.founded_year && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Est. {org.founded_year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {members} member{members !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            {org.website && (
              <a href={org.website} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                Website ↗
              </a>
            )}
            {user && (
              <Link to={`/organizations/${slug}/volunteer`} className="btn-primary text-sm">
                Volunteer
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Projects', value: projects.length },
            { label: 'Events', value: events.length },
            { label: 'Team members', value: members },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-semibold text-brand-400">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ABOUT TAB */}
      {tab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Description */}
            {description && (
              <div className="card">
                <h2 className="text-base font-medium text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}

            {/* Social links */}
            {(org.facebook_url || org.instagram_url || org.linkedin_url) && (
              <div className="card">
                <h2 className="text-base font-medium text-gray-900 mb-3">Follow us</h2>
                <div className="flex flex-col gap-3">
                  <SocialLink href={org.facebook_url} label="Facebook"
                    icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                  />
                  <SocialLink href={org.instagram_url} label="Instagram"
                    icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                  />
                  <SocialLink href={org.linkedin_url} label="LinkedIn"
                    icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="card">
              <h2 className="text-base font-medium text-gray-900 mb-3">Details</h2>
              <div>
                <InfoRow label="Type" value={(i18n.language === 'bg' ? TYPE_LABEL_BG[org.type] : TYPE_LABEL[org.type]) || org.type} />
                <InfoRow label="City" value={org.city} />
                <InfoRow label="Address" value={org.address} />
                <InfoRow label="Founded" value={org.founded_year?.toString()} />
                <InfoRow label="Email" value={org.email} />
                <InfoRow label="Phone" value={org.phone} />
                <InfoRow label="Reg. number" value={org.registration_number} />
              </div>
            </div>

            {!user && (
              <div className="card bg-brand-50 border-brand-100 text-center">
                <p className="text-sm text-brand-700 mb-3 font-medium">Want to volunteer?</p>
                <p className="text-xs text-brand-600 mb-3 leading-relaxed">Create an account to apply for projects and register for events.</p>
                <Link to="/register" className="btn-primary w-full text-center text-sm">
                  Join GiveForward
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROJECTS TAB */}
      {tab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No published projects yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map(p => {
                const title = (i18n.language === 'bg' && p.title_bg) ? p.title_bg : p.title
                const desc = (i18n.language === 'bg' && p.description_bg) ? p.description_bg : p.description
                const spots = Math.max(0, (p.volunteers_needed || 0) - (p.volunteers_enrolled || 0))
                return (
                  <Link key={p.id} to={`/projects/${p.id}`}
                    className="card hover:border-gray-200 hover:shadow-sm transition-all flex flex-col gap-3">
                    {p.cover_url && (
                      <div className="h-32 -mx-5 -mt-5 mb-1 overflow-hidden rounded-t-xl">
                        <img src={p.cover_url} alt={title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {p.categories && (
                      <span className="badge text-xs self-start px-2 py-0.5"
                        style={{ background: p.categories.color + '20', color: p.categories.color }}>
                        {(i18n.language === 'bg' && p.categories.name_bg) ? p.categories.name_bg : p.categories.name}
                      </span>
                    )}
                    <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
                    {desc && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{desc}</p>}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      {p.city && <span className="text-xs text-gray-400">{p.city}</span>}
                      <span className="text-xs text-brand-400 font-medium">{spots} spots left</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENTS TAB */}
      {tab === 'events' && (
        <div>
          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No upcoming events.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {events.map(ev => {
                const title = (i18n.language === 'bg' && ev.title_bg) ? ev.title_bg : ev.title
                const dt = new Date(ev.event_date)
                const spots = Math.max(0, (ev.volunteers_needed || 0) - (ev.volunteers_enrolled || 0))
                return (
                  <Link key={ev.id} to={`/events/${ev.id}`}
                    className="card flex gap-4 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="min-w-14 text-center bg-brand-50 rounded-xl py-3 shrink-0">
                      <p className="text-2xl font-semibold text-brand-400 leading-none">{dt.getDate()}</p>
                      <p className="text-xs text-brand-600 uppercase mt-0.5">
                        {dt.toLocaleString('en', { month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ev.is_online ? 'Online' : ev.city}
                        {' · '}{dt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-brand-400 font-medium">{spots} spots</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
