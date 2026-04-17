import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

function StatCard({ num, label }) {
  return (
    <div className="text-center py-6">
      <p className="text-2xl font-semibold text-brand-400">{num}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function SpotlightCard({ badge, badgeClass, accentColor, initials, avatarClass, title, desc, tags, stat }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className={`h-1 -mx-5 -mt-5 mb-1 rounded-t-xl`} style={{ background: accentColor }} />
      <span className={`badge ${badgeClass} self-start`}>{badge}</span>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg ${avatarClass}`}>{initials}</div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex gap-1.5 flex-wrap">
          {tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-gray-100 text-gray-500">{t}</span>)}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{stat}</span>
      </div>
    </div>
  )
}

function RoleCard({ icon, title, desc, cta, to, colorClass }) {
  return (
    <Link to={to} className="card flex flex-col items-center text-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      <span className="text-sm text-brand-400 group-hover:text-brand-600">{cta}</span>
    </Link>
  )
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [events, setEvents] = useState([])
  const [spotlights, setSpotlights] = useState([])
  const [stats, setStats] = useState({ orgs: 0, volunteers: 0, corps: 0, events: 0 })

  useEffect(() => {
    const now = new Date()

    supabase.from('events').select('id,title,title_bg,city,event_date,volunteers_needed,volunteers_enrolled,is_online')
      .eq('status', 'published').gte('event_date', now.toISOString()).order('event_date').limit(4)
      .then(({ data }) => data && setEvents(data))

    supabase.from('spotlights').select('*').eq('is_active', true)
      .eq('month', now.getMonth() + 1).eq('year', now.getFullYear())
      .then(({ data }) => data && setSpotlights(data))

    Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('corporations').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'volunteer'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]).then(([orgs, corps, vols, evts]) => {
      setStats({
        orgs: orgs.count || 0,
        corps: corps.count || 0,
        volunteers: vols.count || 0,
        events: evts.count || 0
      })
    })
  }, [])

  const formatDate = (d) => {
    const dt = new Date(d)
    return { day: dt.getDate(), month: dt.toLocaleString('en', { month: 'short' }), year: dt.getFullYear() }
  }

  const spotlightConfigs = {
    volunteer: { badge: t('spotlight.volunteer'), badgeClass: 'bg-brand-50 text-brand-800', accentColor: '#1D9E75', avatarClass: 'bg-brand-50 text-brand-600' },
    initiative: { badge: t('spotlight.initiative'), badgeClass: 'bg-blue-50 text-blue-800', accentColor: '#378ADD', avatarClass: 'bg-blue-50 text-blue-600' },
    corporation: { badge: t('spotlight.corporation'), badgeClass: 'bg-amber-50 text-amber-800', accentColor: '#BA7517', avatarClass: 'bg-amber-50 text-amber-700' },
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-6 px-4" style={{ background: 'var(--bg)', backgroundImage: 'var(--hero-gradient)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 sm:whitespace-nowrap" style={{ color: 'var(--text)' }}>
            {(() => {
              const title = t('hero.title')
              const highlight = lang === 'bg' ? 'Доброволствай.' : 'Volunteer.'
              const idx = title.indexOf(highlight)
              if (idx === -1) return <span>{title}</span>
              return <>
                <span>{title.slice(0, idx)}</span>
                <span className="text-brand-400">{highlight}</span>
                <span>{title.slice(idx + highlight.length)}</span>
              </>
            })()}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed mb-6 max-w-xl mx-auto">{t('hero.subtitle')}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/projects" className="btn-primary">{t('hero.cta_explore')}</Link>
            <Link to="/register" className="btn-secondary">{t('hero.cta_register')}</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          <StatCard num={stats.orgs} label={t('stats.organizations')} />
          <StatCard num={stats.volunteers} label={t('stats.volunteers')} />
          <StatCard num={stats.corps} label={t('stats.corporations')} />
          <StatCard num={stats.events} label={t('stats.events')} />
        </div>
      </section>

      {/* Spotlight */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-medium">{t('spotlight.title')}</h2>
          <Link to="/spotlights" className="text-sm text-brand-400 hover:text-brand-600">{t('spotlight.see_all')}</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {['volunteer','initiative','corporation'].map(type => {
            const cfg = spotlightConfigs[type]
            const s = spotlights.find(x => x.type === type)
            return (
              <SpotlightCard
                key={type}
                badge={cfg.badge}
                badgeClass={cfg.badgeClass}
                accentColor={cfg.accentColor}
                avatarClass={cfg.avatarClass}
                initials={s ? s.title?.slice(0,2).toUpperCase() : '??'}
                title={s?.title || '—'}
                desc={s?.description || ''}
                tags={[]}
                stat=""
              />
            )
          })}
        </div>
      </section>

      {/* Roles */}
      <section className="py-14 px-4" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-medium mb-6 text-center">{t('roles.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <RoleCard
              to="/projects"
              icon={<svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
              colorClass="bg-brand-50"
              title={t('roles.volunteer.title')}
              desc={t('roles.volunteer.desc')}
              cta={t('roles.volunteer.cta')}
            />
            <RoleCard
              to="/organizations"
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
              colorClass="bg-blue-50"
              title={t('roles.organization.title')}
              desc={t('roles.organization.desc')}
              cta={t('roles.organization.cta')}
            />
            <RoleCard
              to="/corporations"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
              colorClass="bg-amber-50"
              title={t('roles.corporation.title')}
              desc={t('roles.corporation.desc')}
              cta={t('roles.corporation.cta')}
            />
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-medium">{t('events.title')}</h2>
          <Link to="/events" className="text-sm text-brand-400 hover:text-brand-600">{t('events.see_all')}</Link>
        </div>
        <div className="flex flex-col gap-3">
          {events.length === 0 && <p className="text-gray-400 text-sm">{t('events.no_events')}</p>}
          {events.map(ev => {
            const { day, month, year } = formatDate(ev.event_date)
            const spots = ev.volunteers_needed - ev.volunteers_enrolled
            return (
              <Link key={ev.id} to={`/events/${ev.id}`} className="flex items-center gap-4 card hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="min-w-12 text-center bg-brand-50 rounded-lg py-2 px-1">
                  <p className="text-xl font-semibold text-brand-400 leading-none">{day}</p>
                  <p className="text-xs text-brand-600 uppercase">{month}</p>
                  <p className="text-xs text-brand-500">{year}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ev.title}</p>
                  <p className="text-sm text-gray-500">{ev.is_online ? t('events.online') : ev.city}</p>
                </div>
                <span className="text-sm text-brand-400 font-medium whitespace-nowrap">
                  {t('events.spots_left', { count: Math.max(0, spots) })}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  )
}
