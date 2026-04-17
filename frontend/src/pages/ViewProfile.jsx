import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

const AVAILABILITY_LABEL = {
  weekdays: { en: 'Weekdays',  bg: 'Делнични' },
  weekends: { en: 'Weekends',  bg: 'Уикенди' },
  mornings: { en: 'Mornings',  bg: 'Сутрини' },
  evenings: { en: 'Evenings',  bg: 'Вечери' },
}
const GENDER_LABEL = {
  male:              { en: 'Male',              bg: 'Мъж' },
  female:            { en: 'Female',            bg: 'Жена' },
  non_binary:        { en: 'Non-binary',        bg: 'Небинарен' },
  prefer_not_to_say: { en: 'Prefer not to say', bg: 'Предпочитам да не казвам' },
}
const ROLE_LABEL = {
  volunteer:   { en: 'Volunteer',              bg: 'Доброволец' },
  org_admin:   { en: 'Organization admin',     bg: 'Администратор на организация' },
  corp_admin:  { en: 'Corporation admin',      bg: 'Администратор на корпорация' },
  super_admin: { en: 'Platform admin',         bg: 'Администратор на платформата' },
}

function Row({ label, children }) {
  return (
    <div className="flex gap-3 text-sm py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs font-medium uppercase tracking-wide shrink-0 w-28 pt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <div className="flex-1 min-w-0" style={{ color: 'var(--text)' }}>{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-1 pb-2" style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function ViewProfile() {
  const { user, profile } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [stats, setStats] = useState({ applications: 0, events: 0, hours: 0 })
  const [loading, setLoading] = useState(true)
  const [slideIdx, setSlideIdx] = useState(0)
  const [corp, setCorp] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('project_applications').select('id, hours_logged', { count: 'exact' }).eq('profile_id', user.id),
      supabase.from('event_registrations').select('id, hours_logged').eq('profile_id', user.id).eq('status', 'confirmed'),
      profile?.corporation_id
        ? supabase.from('corporations').select('id, name, slug, logo_url').eq('id', profile.corporation_id).single()
        : Promise.resolve({ data: null }),
    ]).then(([apps, evs, corpRes]) => {
      const evHours = (evs.data || []).reduce((s, r) => s + (Number(r.hours_logged) || 0), 0)
      const appHours = (apps.data || []).reduce((s, r) => s + (Number(r.hours_logged) || 0), 0)
      setStats({ applications: apps.count || 0, events: (evs.data || []).length, hours: Math.round((evHours + appHours) * 10) / 10 })
      if (corpRes.data) setCorp(corpRes.data)
      setLoading(false)
    })
  }, [user?.id])

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const nameEN  = profile.full_name || ''
  const nameBG  = profile.full_name_bg || ''
  const displayName = (lang === 'bg' ? (nameBG || nameEN) : nameEN) || (lang === 'bg' ? 'Не е зададено' : 'No name set')
  const city    = lang === 'bg' ? (profile.city_bg || profile.city) : profile.city
  const country = lang === 'bg' ? (profile.country_bg || profile.country || 'Bulgaria') : (profile.country || 'Bulgaria')
  const bio     = lang === 'bg' ? (profile.bio_bg  || profile.bio) : profile.bio
  const skills  = lang === 'bg' ? (profile.skills_bg || profile.skills) : profile.skills
  const roleLabel = ROLE_LABEL[profile.role]?.[lang] || profile.role
  const initials  = nameEN.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const media     = profile.media_library || []
  const badges    = profile.badges || []
  const achievements = profile.achievements || []
  const isVolunteer  = profile.role === 'volunteer'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium" style={{ color: 'var(--text)' }}>
          {lang === 'bg' ? 'Моят профил' : 'My profile'}
        </h1>
        <Link to="/dashboard/profile/edit" className="btn-secondary text-sm">
          {lang === 'bg' ? 'Редактирай' : 'Edit profile'}
        </Link>
      </div>

      {/* ── Hero card: avatar + name + role ── */}
      <div className="card flex items-center gap-5 mb-4">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-2xl overflow-hidden shrink-0 border-2 border-brand-100">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{displayName}</h2>
          {nameBG && nameEN && nameBG !== nameEN && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{lang === 'bg' ? nameEN : nameBG}</p>
          )}
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
          {(city || country) && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              📍 {[city, country].filter(Boolean).join(', ')}
            </p>
          )}
          <span className="inline-block mt-1 text-xs font-medium text-brand-400 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      {isVolunteer && !loading && (
        <div className="card grid grid-cols-3 gap-0 mb-4 p-0 overflow-hidden">
          {[
            { v: stats.applications, l: lang === 'bg' ? 'Приложения' : 'Applications' },
            { v: stats.events,       l: lang === 'bg' ? 'Потвърдени събития' : 'Confirmed events' },
            { v: stats.hours,        l: lang === 'bg' ? 'Часове' : 'Hours' },
          ].map((s, i) => (
            <div key={i} className="text-center py-4 px-2" style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <p className="text-2xl font-bold text-brand-400">{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Personal information ── */}
      <Section title={lang === 'bg' ? 'Лична информация' : 'Personal information'}>
        {nameEN && <Row label={lang === 'bg' ? 'Пълно име (EN)' : 'Full name (EN)'}>{nameEN}</Row>}
        {nameBG && <Row label={lang === 'bg' ? 'Пълно име (BG)' : 'Full name (BG)'}>{nameBG}</Row>}
        {profile.birth_year && <Row label={lang === 'bg' ? 'Г. на раждане' : 'Birth year'}>{profile.birth_year}</Row>}
        {profile.gender && <Row label={lang === 'bg' ? 'Пол' : 'Gender'}>{GENDER_LABEL[profile.gender]?.[lang] || profile.gender}</Row>}
        {profile.phone && <Row label={lang === 'bg' ? 'Телефон' : 'Phone'}>{profile.phone}</Row>}
        <Row label={lang === 'bg' ? 'Имейл' : 'Email'}>{profile.email}</Row>
        {profile.city && <Row label={lang === 'bg' ? 'Град (EN)' : 'City (EN)'}>{profile.city}</Row>}
        {profile.city_bg && <Row label={lang === 'bg' ? 'Град (BG)' : 'City (BG)'}>{profile.city_bg}</Row>}
        {profile.country && <Row label={lang === 'bg' ? 'Държава' : 'Country'}>{profile.country}</Row>}
        {profile.country_bg && <Row label={lang === 'bg' ? 'Държава (BG)' : 'Country (BG)'}>{profile.country_bg}</Row>}
        {isVolunteer && profile.volunteer_type && (
          <Row label={lang === 'bg' ? 'Тип доброволец' : 'Volunteer type'}>
            {profile.volunteer_type === 'corporate'
              ? (lang === 'bg' ? 'Корпоративен' : 'Corporate')
              : (lang === 'bg' ? 'Независим' : 'Freelancer')}
          </Row>
        )}
        {corp && (
          <Row label={lang === 'bg' ? 'Корпорация' : 'Corporation'}>
            <Link to={`/corporations/${corp.slug}`} className="flex items-center gap-1.5 text-brand-500 hover:underline">
              {corp.logo_url && <img src={corp.logo_url} alt="" className="w-4 h-4 rounded object-cover" />}
              {corp.name}
            </Link>
          </Row>
        )}
        {profile.availability?.length > 0 && (
          <Row label={lang === 'bg' ? 'Наличност' : 'Availability'}>
            <div className="flex flex-wrap gap-1">
              {profile.availability.map(a => (
                <span key={a} className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-2 py-0.5">
                  {AVAILABILITY_LABEL[a]?.[lang] || a}
                </span>
              ))}
            </div>
          </Row>
        )}
      </Section>

      {/* ── Bio ── */}
      {(bio || (profile.bio && profile.bio_bg)) && (
        <Section title={lang === 'bg' ? 'За мен' : 'About me'}>
          {profile.bio && (
            <Row label="EN">
              <p className="leading-relaxed">{profile.bio}</p>
            </Row>
          )}
          {profile.bio_bg && (
            <Row label="BG">
              <p className="leading-relaxed">{profile.bio_bg}</p>
            </Row>
          )}
        </Section>
      )}

      {/* ── Skills ── */}
      {(profile.skills || profile.skills_bg) && (
        <Section title={lang === 'bg' ? 'Умения' : 'Skills'}>
          {profile.skills && (
            <Row label="EN">
              <div className="flex flex-wrap gap-1">
                {profile.skills.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                  <span key={i} className="badge text-xs px-2 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)' }}>{s}</span>
                ))}
              </div>
            </Row>
          )}
          {profile.skills_bg && (
            <Row label="BG">
              <div className="flex flex-wrap gap-1">
                {profile.skills_bg.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                  <span key={i} className="badge text-xs px-2 py-0.5" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)' }}>{s}</span>
                ))}
              </div>
            </Row>
          )}
        </Section>
      )}

      {/* ── Social networks ── */}
      {(profile.facebook_url || profile.instagram_url || profile.linkedin_url) && (
        <Section title={lang === 'bg' ? 'Социални мрежи' : 'Social networks'}>
          {profile.facebook_url && (
            <Row label="Facebook">
              <a href={profile.facebook_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate block">{profile.facebook_url}</a>
            </Row>
          )}
          {profile.instagram_url && (
            <Row label="Instagram">
              <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate block">{profile.instagram_url}</a>
            </Row>
          )}
          {profile.linkedin_url && (
            <Row label="LinkedIn">
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline truncate block">{profile.linkedin_url}</a>
            </Row>
          )}
        </Section>
      )}

      {/* ── Badges ── */}
      {badges.length > 0 && (
        <Section title={lang === 'bg' ? 'Значки' : 'Badges'}>
          <div className="flex flex-wrap gap-4 pt-2">
            {badges.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 text-center w-16">
                <div className="w-12 h-12 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-2xl">
                  {b.icon || '🏅'}
                </div>
                <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>{lang === 'bg' ? (b.label_bg || b.label) : b.label}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <Section title={lang === 'bg' ? 'Постижения' : 'Achievements'}>
          {achievements.map((a, i) => (
            <Row key={i} label={a.icon || '⭐'}>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{lang === 'bg' ? (a.title_bg || a.title) : a.title}</p>
                {(lang === 'bg' ? (a.desc_bg || a.desc) : a.desc) && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{lang === 'bg' ? (a.desc_bg || a.desc) : a.desc}</p>
                )}
                {a.date && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{new Date(a.date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}</p>}
              </div>
            </Row>
          ))}
        </Section>
      )}

      {/* ── Media library ── */}
      {media.length > 0 && (
        <Section title={lang === 'bg' ? 'Медийна библиотека' : 'Media library'}>
          <div className="relative bg-black rounded-xl overflow-hidden mb-2 mt-2">
            <img src={media[slideIdx]} alt="" className="w-full h-64 object-cover" />
            {media.length > 1 && (
              <>
                <button onClick={() => setSlideIdx(i => (i - 1 + media.length) % media.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">‹</button>
                <button onClick={() => setSlideIdx(i => (i + 1) % media.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">›</button>
                <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg">{slideIdx + 1}/{media.length}</span>
              </>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {media.map((url, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className={'w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ' + (i === slideIdx ? 'border-brand-400' : 'border-transparent')}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
