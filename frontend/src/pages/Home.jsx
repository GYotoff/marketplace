import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

function StatCard({ num, label, border }) {
  return (
    <div className="text-center py-5" style={border ? { borderRight: '1px solid var(--border)' } : {}}>
      <p className="text-2xl font-semibold text-brand-400">{num}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function SpotlightCard({ accent, badge, badgeStyle, avatar, title, sub, detail, stat, link }) {
  const inner = (
    <div className="card flex flex-col gap-3 h-full hover:shadow-sm transition-all" style={{ borderTop: `3px solid ${accent}` }}>
      <span className="badge self-start text-xs" style={badgeStyle}>{badge}</span>
      <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 font-semibold text-base"
        style={{ background: `${accent}20`, color: accent }}>
        {avatar?.src
          ? <img src={avatar.src} alt="" className="w-full h-full object-cover" />
          : avatar?.initials || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>{title || '—'}</h3>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        {detail && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-faint)' }}>{detail}</p>}
      </div>
      {stat && <p className="text-xs font-semibold" style={{ color: accent }}>{stat}</p>}
    </div>
  )
  return link ? <Link to={link} className="block h-full">{inner}</Link> : inner
}

function RoleCard({ icon, title, desc, cta, to, colorClass }) {
  return (
    <Link to={to} className="card flex flex-col items-center text-center gap-3 hover:shadow-sm transition-all group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
      <h3 className="font-medium" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      <span className="text-sm text-brand-400 group-hover:text-brand-600 mt-auto">{cta}</span>
    </Link>
  )
}

// Shared section header — left title + right link, matching width of all content
function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-xl font-medium" style={{ color: 'var(--text)' }}>{title}</h2>
      {linkTo && <Link to={linkTo} className="text-sm text-brand-400 hover:text-brand-600">{linkLabel}</Link>}
    </div>
  )
}

const RANK_COLOR = { Standard:'#6b7280', Bronze:'#cd7f32', Silver:'#708090', Gold:'#c9a200', Platinum:'#4a90a4' }
const MAX_W = 'max-w-7xl mx-auto px-4'

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [events,   setEvents]   = useState([])
  const [stats,    setStats]    = useState({ orgs:0, volunteers:0, corps:0, events:0, projects:0, hours:0 })
  const [spotVol,  setSpotVol]  = useState(null)
  const [spotInit, setSpotInit] = useState(null)
  const [spotOrg,  setSpotOrg]  = useState(null)

  useEffect(() => {
    const now = new Date()
    const yr  = now.getFullYear()
    const mo  = now.getMonth() + 1

      supabase.rpc('get_upcoming_public_events', { p_limit: 5 })
      .then(({ data }) => data && setEvents(data))

    supabase.rpc('get_home_stats').then(({ data }) => {
      if (data) setStats({
        orgs: data.orgs||0, corps: data.corps||0, volunteers: data.volunteers||0,
        events: data.events||0, projects: data.projects||0, hours: Math.round(data.hours||0),
      })
    })

    supabase.rpc('get_spotlight_volunteer',   { p_year:yr, p_month:mo }).then(({ data }) => data?.[0] && setSpotVol(data[0]))
    supabase.rpc('get_spotlight_initiative',  { p_year:yr, p_month:mo }).then(({ data }) => data?.[0] && setSpotInit(data[0]))
    supabase.rpc('get_spotlight_organization',{ p_year:yr, p_month:mo }).then(({ data }) => data?.[0] && setSpotOrg(data[0]))
  }, [])

  const fmtDate = (d) => {
    const dt = new Date(d)
    return { day: dt.getDate(), month: dt.toLocaleString(lang==='bg'?'bg-BG':'en',{month:'short'}), year: dt.getFullYear() }
  }

  const statItems = [
    { num: stats.orgs,       label: t('stats.organizations') },
    { num: stats.corps,      label: t('stats.corporations')  },
    { num: stats.projects,   label: t('stats.projects')      },
    { num: stats.events,     label: t('stats.events')        },
    { num: stats.volunteers, label: t('stats.volunteers')    },
    { num: stats.hours,      label: t('stats.hours')         },
  ]

  return (
    <div>

      {/* ══ Hero ══════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4" style={{ background:'var(--bg)', backgroundImage:"url('/background.png')" }}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-3 sm:whitespace-nowrap" style={{ color:'var(--text)' }}>
            {(() => {
              const title = t('hero.title')
              const highlight = lang==='bg' ? 'Доброволствай.' : 'Volunteer.'
              const idx = title.indexOf(highlight)
              if (idx===-1) return <span>{title}</span>
              return <><span>{title.slice(0,idx)}</span><span className="text-brand-400">{highlight}</span><span>{title.slice(idx+highlight.length)}</span></>
            })()}
          </h1>
          <p className="text-base leading-relaxed mb-5 mx-auto" style={{ color:'var(--text-muted)', maxWidth:'90%' }}>
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/projects" className="btn-primary">{t('hero.cta_explore')}</Link>
            <Link to="/register" className="btn-secondary">{t('hero.cta_register')}</Link>
          </div>
        </div>
      </section>

      {/* ══ Stats ════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div className={`${MAX_W} grid grid-cols-3 md:grid-cols-6`}>
          {statItems.map((s,i) => <StatCard key={i} num={s.num} label={s.label} border={i<statItems.length-1} />)}
        </div>
      </section>

      {/* ══ Monthly spotlight ════════════════════════════════════════════════ */}
      <section className="py-10">
        <div className={MAX_W}>
          <SectionHeader title={t('spotlight.title')} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Volunteer of the month — custom card with ranking + achievements */}
            <div className="card flex flex-col gap-3" style={{ borderTop:'3px solid #1D9E75' }}>
              <span className="badge self-start text-xs" style={{ background:'rgba(29,158,117,0.12)', color:'#1D9E75' }}>{t('home.volunteer')}</span>
              {spotVol ? (
                <>
                  <div className="relative w-14 h-14 shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-semibold text-lg"
                      style={{ background:'rgba(29,158,117,0.12)', color:'#1D9E75' }}>
                      {spotVol.avatar_url
                        ? <img src={spotVol.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (spotVol.full_name||'?').slice(0,2).toUpperCase()}
                    </div>
                    {spotVol.ranking_icon_url && (
                      <img src={spotVol.ranking_icon_url} alt={spotVol.ranking_type}
                        style={{ position:'absolute', bottom:0, right:0, width:22, height:22, objectFit:'contain' }} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color:'var(--text)' }}>
                      {lang==='bg' ? (spotVol.full_name_bg||spotVol.full_name) : spotVol.full_name}
                    </h3>
                    {(spotVol.city||spotVol.city_bg) && (
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                        {lang==='bg' ? (spotVol.city_bg||spotVol.city) : spotVol.city}
                      </p>
                    )}
                    {spotVol.ranking_type && (
                      <span className="text-xs font-semibold" style={{ color: RANK_COLOR[spotVol.ranking_type]||'#6b7280' }}>
                        {lang==='bg' ? (spotVol.ranking_type_bg||spotVol.ranking_type) : spotVol.ranking_type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-brand-400">⏱ {spotVol.hours} {t('home.hours_logged')}</p>
                  {spotVol.achievements?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1" style={{ borderTop:'1px solid var(--border)' }}>
                      {spotVol.achievements.slice(0,6).map((a,i) => (
                        <span key={i} title={lang==='bg'?(a.name_bg||a.name):a.name}
                          className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                          style={{ background:'var(--bg-subtle)', border:'1px solid var(--border-mid)' }}>
                          {a.badge_url ? <img src={a.badge_url} alt="" className="w-full h-full object-contain p-0.5" /> : <span className="text-xs">🎖️</span>}
                        </span>
                      ))}
                      {spotVol.achievements.length > 6 && (
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                          style={{ background:'var(--bg-subtle)', color:'var(--text-faint)' }}>
                          +{spotVol.achievements.length-6}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : <p className="text-sm" style={{ color:'var(--text-faint)' }}>{t('home.no_data')}</p>}
            </div>

            {/* Initiative of the month */}
            <SpotlightCard
              accent="#378ADD"
              badge={t('home.initiative')}
              badgeStyle={{ background:'rgba(55,138,221,0.12)', color:'#378ADD' }}
              avatar={spotInit ? { src:spotInit.org_logo_url, initials:(spotInit.title||'?').slice(0,2).toUpperCase() } : { initials:'?' }}
              title={spotInit ? (lang==='bg'?(spotInit.title_bg||spotInit.title):spotInit.title) : t('home.no_data')}
              sub={spotInit ? (spotInit.is_online ? t('home.online') : (lang==='bg'?(spotInit.city_bg||spotInit.city):spotInit.city)) : null}
              detail={spotInit?.org_name||null}
              stat={spotInit ? `👥 ${spotInit.confirmed_count} ${t('home.confirmed')}` : null}
              link={spotInit ? `/events/${spotInit.id}` : null}
            />

            {/* Organization of the month */}
            <SpotlightCard
              accent="#1D9E75"
              badge={t('home.organization')}
              badgeStyle={{ background:'rgba(29,158,117,0.12)', color:'#1D9E75' }}
              avatar={spotOrg ? { src:spotOrg.logo_url, initials:(spotOrg.name||'?').slice(0,2).toUpperCase() } : { initials:'?' }}
              title={spotOrg?.name||t('home.no_data')}
              sub={spotOrg?.city||null}
              stat={spotOrg ? `📅 ${spotOrg.event_count} ${t('home.events_org')}` : null}
              link={spotOrg ? `/organizations/${spotOrg.slug}` : null}
            />
          </div>
        </div>
      </section>

      {/* ══ Who is it for ════════════════════════════════════════════════════ */}
      <section className="py-5" style={{ background:'var(--bg-subtle)' }}>
        <div className={MAX_W}>
          <h2 className="text-xl font-medium mb-3" style={{ color:'var(--text)' }}>{t('roles.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <RoleCard to="/projects"
              icon={<svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
              colorClass="bg-brand-50" title={t('roles.volunteer.title')} desc={t('roles.volunteer.desc')} cta={t('roles.volunteer.cta')} />
            <RoleCard to="/organizations"
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
              colorClass="bg-blue-50" title={t('roles.organization.title')} desc={t('roles.organization.desc')} cta={t('roles.organization.cta')} />
            <RoleCard to="/corporations"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
              colorClass="bg-amber-50" title={t('roles.corporation.title')} desc={t('roles.corporation.desc')} cta={t('roles.corporation.cta')} />
          </div>
        </div>
      </section>

      {/* ══ Upcoming events ══════════════════════════════════════════════════ */}
      <section className="py-10">
        <div className={MAX_W}>
          <SectionHeader title={t('events.title')} linkTo="/events" linkLabel={t('home.see_events')} />
          <div className="flex flex-col gap-3">
            {events.length === 0 && <p className="text-sm" style={{ color:'var(--text-faint)' }}>{t('events.no_events')}</p>}
            {events.map(ev => {
              const { day, month, year } = fmtDate(ev.event_date)
              const title   = (lang==='bg' && ev.title_bg)       ? ev.title_bg       : ev.title
              const desc    = (lang==='bg' && ev.description_bg) ? ev.description_bg : ev.description
              const city    = (lang==='bg' && ev.city_bg)        ? ev.city_bg        : ev.city
              const isOnline = ev.is_online || ev.event_type === 'online'
              const spots   = Math.max(0, (ev.volunteers_needed||0) - (ev.volunteers_enrolled||0))
              const org     = (lang==='bg' && ev.organization_name_bg) ? ev.organization_name_bg : ev.organization_name
              const logo_url  = ev.organization_logo_url
              return (
                <Link key={ev.id} to={`/events/${ev.id}`} className="card flex gap-4 hover:shadow-sm transition-all">
                  <div className="min-w-14 text-center rounded-xl py-3 shrink-0 bg-brand-50">
                    <p className="text-2xl font-bold text-brand-400 leading-none">{day}</p>
                    <p className="text-xs text-brand-600 uppercase mt-0.5">{month}</p>
                    <p className="text-xs text-brand-500 mt-0.5">{year}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight" style={{ color:'var(--text)' }}>{title}</p>
                      <span className="text-xs font-medium whitespace-nowrap text-brand-400 shrink-0">{spots} {t('home.spots_left')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {logo_url && <img src={logo_url} alt="" className="w-3.5 h-3.5 rounded object-cover" />}
                      <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                        {org}{org && (isOnline||city) ? ' · ' : ''}{isOnline ? t('home.online') : city}
                      </p>
                    </div>
                    {desc && <p className="text-xs mt-1 line-clamp-1" style={{ color:'var(--text-faint)' }}>{desc}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}
