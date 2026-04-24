import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 min-w-0 break-all">{value}</span>
    </div>
  )
}

function SocialLink({ href, label, icon }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-400 transition-colors">
      {icon}
      <span>{label}</span>
    </a>
  )
}

const FB_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const IG_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const LI_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export default function CorporationPage() {
  const { slug } = useParams()
  const { i18n } = useTranslation()
  const { user } = useAuthStore()

  const [corp, setCorp] = useState(null)
  const [memberCount,    setMemberCount]    = useState(0)
  const [volunteerHours, setVolunteerHours] = useState(0)
  const [projectsJoined, setProjectsJoined] = useState(0)
  const [memberStatus,   setMemberStatus]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('about')

  useEffect(() => { fetchCorp() }, [slug])

  useEffect(() => {
    if (user && corp) checkMembership()
  }, [user?.id, corp])

  const fetchCorp = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('corporations').select('*').eq('slug', slug).single()
    if (error || !data) { setNotFound(true); setLoading(false); return }
    setCorp(data)
    const { count } = await supabase.from('corporation_members').select('id', { count: 'exact', head: true }).eq('corporation_id', data.id).eq('request_status', 'approved')
    setMemberCount(count || 0)

    // Fetch total volunteer hours of all approved members
    const { data: members } = await supabase
      .from('corporation_members')
      .select('profile_id')
      .eq('corporation_id', data.id)
      .eq('request_status', 'approved')
    const memberIds = (members || []).map(m => m.profile_id)

    if (memberIds.length > 0) {
      const { data: hoursData } = await supabase
        .from('event_registrations')
        .select('hours_logged')
        .in('profile_id', memberIds)
        .eq('status', 'confirmed')
      const totalHours = (hoursData || []).reduce((sum, r) => sum + (r.hours_logged || 0), 0)
      setVolunteerHours(Math.round(totalHours))

      const { count: projCount } = await supabase
        .from('project_applications')
        .select('project_id', { count: 'exact', head: true })
        .in('profile_id', memberIds)
        .eq('status', 'approved')
      setProjectsJoined(projCount || 0)
    }

    setLoading(false)
  }

  const checkMembership = async () => {
    if (!user || !corp) return
    const { data } = await supabase.from('corporation_members').select('request_status').eq('corporation_id', corp.id).eq('profile_id', user.id).maybeSingle()
    if (data) setMemberStatus(data.request_status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-4xl mb-4">🏢</p>
        <h1 className="text-xl font-medium text-gray-900 mb-2">Corporation not found</h1>
        <p className="text-gray-500 text-sm mb-6">This corporation does not exist or is not yet approved.</p>
        <Link to="/corporations" className="btn-primary">Browse corporations</Link>
      </div>
    )
  }

  const name = (i18n.language === 'bg' && corp.name_bg) ? corp.name_bg : corp.name
  const initials = name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?'
  const description = (i18n.language === 'bg' && corp.description_bg) ? corp.description_bg : corp.description
  const tagline = (i18n.language === 'bg' && corp.tagline_bg) ? corp.tagline_bg : corp.tagline

  const TABS = [
    { key: 'about', label: 'About' },
    { key: 'members', label: 'Members (' + memberCount + ')' },
  ]

  let memberBadge = null
  if (!user) {
    memberBadge = <Link to="/register" className="btn-primary text-sm">Join as volunteer</Link>
  } else if (memberStatus === 'approved') {
    memberBadge = <span className="badge bg-brand-50 text-brand-700 border border-brand-200 text-sm px-3 py-1.5">Member</span>
  } else if (memberStatus === 'pending') {
    memberBadge = <span className="badge bg-amber-50 text-amber-700 border border-amber-200 text-sm px-3 py-1.5">Pending approval</span>
  } else if (memberStatus === 'declined') {
    memberBadge = <span className="badge bg-red-50 text-red-700 border border-red-200 text-sm px-3 py-1.5">Membership declined</span>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {corp.cover_url && (
        <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          <img src={corp.cover_url} alt={name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-2xl shrink-0 overflow-hidden border border-gray-100">
            {corp.logo_url ? <img src={corp.logo_url} alt={name} className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-medium text-gray-900">{name}</h1>
              {corp.is_verified && (
                <svg className="w-5 h-5 text-brand-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {corp.industry && <span className="badge bg-amber-50 text-amber-700 text-xs">{corp.industry}</span>}
              {corp.size && <span className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs">{{
                micro:             'Micro',
                small:             'Small',
                medium:            'Medium',
                large:             'Large',
                enterprise:        'Enterprise',
                global_enterprise: 'Global Enterprise',
              }[corp.size] || corp.size}</span>}
            </div>
            {tagline && <p className="text-gray-500 text-sm mb-2">{tagline}</p>}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {corp.city && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {i18n.language === 'bg' ? (corp.city_bg || corp.city) : corp.city}
                </span>
              )}
              {corp.founded_year && <span>Est. {corp.founded_year}</span>}
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="text-brand-400 font-semibold">{memberCount}</span>
                  {memberCount === 1 ? 'member' : 'members'}
                </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {corp.website && <a href={corp.website} target="_blank" rel="noreferrer" className="btn-secondary text-sm">Website</a>}
            {memberBadge}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: i18n.language === 'bg' ? 'Записани членове'        : 'Enrolled members',  value: memberCount    },
            { label: i18n.language === 'bg' ? 'Доброволчески часове'    : 'Volunteer hours',    value: volunteerHours },
            { label: i18n.language === 'bg' ? 'Присъединени проекти'    : 'Projects joined',    value: projectsJoined },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-semibold text-amber-500">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ' + (tab === t.key ? 'border-brand-400 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 flex flex-col gap-6">
            {description && (
              <div className="card">
                <h2 className="text-base font-medium text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
              </div>
            )}
            {(corp.facebook_url || corp.instagram_url || corp.linkedin_url) && (
              <div className="card">
                <h2 className="text-base font-medium text-gray-900 mb-3">Follow us</h2>
                <div className="flex flex-col gap-3">
                  <SocialLink href={corp.facebook_url} label="Facebook" icon={FB_ICON} />
                  <SocialLink href={corp.instagram_url} label="Instagram" icon={IG_ICON} />
                  <SocialLink href={corp.linkedin_url} label="LinkedIn" icon={LI_ICON} />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="card">
              <h2 className="text-base font-medium text-gray-900 mb-3">Details</h2>
              <InfoRow label="Industry" value={corp.industry} />
              <InfoRow label="Size" value={corp.size ? ({
                micro:             'Micro (1–10 employees)',
                small:             'Small (11–50 employees)',
                medium:            'Medium (51–200 employees)',
                large:             'Large (501–1 000 employees)',
                enterprise:        'Enterprise (1 001–5 000 employees)',
                global_enterprise: 'Global Enterprise (5 000+)',
              }[corp.size] || corp.size) : null} />
              <InfoRow label={i18n.language === 'bg' ? 'Град' : 'City'} value={i18n.language === 'bg' ? (corp.city_bg || corp.city) : corp.city} />
              <InfoRow label={i18n.language === 'bg' ? 'Адрес' : 'Address'} value={i18n.language === 'bg' ? (corp.address_bg || corp.address) : corp.address} />
              <InfoRow label="Founded" value={corp.founded_year ? String(corp.founded_year) : null} />
              <InfoRow label="Email" value={corp.email} />
              <InfoRow label="Phone" value={corp.phone} />
              <InfoRow label="Reg. number" value={corp.registration_number} />
            </div>
            {!user && (
              <div className="card bg-amber-50 border-amber-100 text-center">
                <p className="text-sm text-amber-700 mb-2 font-medium">Work here?</p>
                <p className="text-xs text-amber-600 mb-3 leading-relaxed">Register as a corporate volunteer to join this company's CSR program.</p>
                <Link to="/register" className="btn-primary w-full text-center text-sm">Join Dataverte</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="text-center py-12 text-gray-400 text-sm">
          The member directory is private to enrolled employees.
        </div>
      )}
    </div>
  )
}
