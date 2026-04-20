import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import RankingBadge from '@/components/ui/RankingBadge'

const AVAILABILITY_LABEL = {
  weekdays: { en: 'Weekdays',  bg: 'Делнични' },
  weekends: { en: 'Weekends',  bg: 'Уикенди'  },
  mornings: { en: 'Mornings',  bg: 'Сутрини'  },
  evenings: { en: 'Evenings',  bg: 'Вечери'   },
}
const GENDER_LABEL = {
  male:              { en: 'Male',              bg: 'Мъж'                          },
  female:            { en: 'Female',            bg: 'Жена'                         },
  non_binary:        { en: 'Non-binary',        bg: 'Небинарен'                    },
  prefer_not_to_say: { en: 'Prefer not to say', bg: 'Предпочитам да не казвам'    },
}
const ROLE_LABEL = {
  volunteer:   { en: 'Volunteer',            bg: 'Доброволец'                          },
  org_admin:   { en: 'Organization admin',   bg: 'Администратор на организация'        },
  corp_admin:  { en: 'Corporation admin',    bg: 'Администратор на корпорация'         },
  super_admin: { en: 'Platform admin',       bg: 'Администратор на платформата'        },
}
const THEME_LABEL = {
  light:  { en: 'Light',  bg: 'Светла'   },
  dark:   { en: 'Dark',   bg: 'Тъмна'   },
  system: { en: 'System', bg: 'Системна' },
}

/* ── Small helpers ── */
function Section({ title, children, empty }) {
  if (empty) return null
  return (
    <div className="card mb-4">
      <p className="text-xs font-bold uppercase tracking-widest mb-3 pb-2"
        style={{ color: 'var(--text-faint)', borderBottom: '1px solid var(--border)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Row({ label, value, children }) {
  const content = children ?? (value ?? null)
  if (content === null || content === '' || content === undefined) return null
  return (
    <div className="flex gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs font-medium uppercase tracking-wide shrink-0 w-32 pt-0.5"
        style={{ color: 'var(--text-faint)' }}>{label}</span>
      <div className="flex-1 min-w-0 text-sm" style={{ color: 'var(--text)' }}>{content}</div>
    </div>
  )
}

function Chip({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.25)' }}>
      {label}
    </span>
  )
}

function GrayChip({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)' }}>
      {label}
    </span>
  )
}

export default function ViewProfile() {
  const { user, profile } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'

  const [stats, setStats]   = useState({ applications: 0, events: 0, hours: 0 })
  const [corp,  setCorp]    = useState(null)
  const [ranking, setRanking] = useState(null)
  const [slideIdx, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('project_applications')
        .select('id, hours_logged', { count: 'exact' })
        .eq('profile_id', user.id),
      supabase.from('event_registrations')
        .select('id, hours_logged')
        .eq('profile_id', user.id)
        .eq('status', 'confirmed'),
      profile?.corporation_id
        ? supabase.from('corporations').select('id,name,slug,logo_url').eq('id', profile.corporation_id).single()
        : null,
      profile?.ranking_id
        ? supabase.from('rankings').select('id,type,type_bg,icon_url,message,message_bg').eq('id', profile.ranking_id).single()
        : null,
    ]).then(([apps, evs, corpRes, rankingRes]) => {
      const evH  = (evs.data  || []).reduce((s, r) => s + (Number(r.hours_logged) || 0), 0)
      const appH = (apps.data || []).reduce((s, r) => s + (Number(r.hours_logged) || 0), 0)
      setStats({ applications: apps.count || 0, events: evs.data?.length || 0, hours: Math.round((evH + appH) * 10) / 10 })
      if (corpRes?.data) setCorp(corpRes.data)
      if (rankingRes?.data) setRanking(rankingRes.data)
      setLoading(false)
    })
  }, [user?.id])

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const nameEN = profile.full_name    || ''
  const nameBG = profile.full_name_bg || ''
  const displayName = (lang === 'bg' ? (nameBG || nameEN) : nameEN) || '—'
  const roleLabel   = ROLE_LABEL[profile.role]?.[lang] || profile.role
  const isVolunteer = profile.role === 'volunteer'
  const initials    = nameEN.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const media       = profile.media_library || []
  const badges      = profile.badges        || []
  const achievements = profile.achievements || []
  const fmtDate     = d => new Date(d).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')

  const L = {
    myProfile:    lang === 'bg' ? 'Моят профил'         : 'My profile',
    edit:         lang === 'bg' ? 'Редактирай'           : 'Edit profile',
    personal:     lang === 'bg' ? 'Лична информация'     : 'Personal information',
    account:      lang === 'bg' ? 'Акаунт'               : 'Account',
    bio_section:  lang === 'bg' ? 'За мен'               : 'About me',
    skills_s:     lang === 'bg' ? 'Умения'               : 'Skills',
    social_s:     lang === 'bg' ? 'Социални мрежи'       : 'Social networks',
    badges_s:     lang === 'bg' ? 'Значки'               : 'Badges',
    achieve_s:    lang === 'bg' ? 'Постижения'           : 'Achievements',
    media_s:      lang === 'bg' ? 'Медийна библиотека'   : 'Media library',
    prefs_s:      lang === 'bg' ? 'Предпочитания'        : 'Preferences',
    stats_s:      lang === 'bg' ? 'Статистика'           : 'Activity',
    nameEN:       lang === 'bg' ? 'Пълно име (EN)'       : 'Full name (EN)',
    nameBG:       lang === 'bg' ? 'Пълно име (BG)'       : 'Full name (BG)',
    email_l:      lang === 'bg' ? 'Имейл'                : 'Email',
    phone_l:      lang === 'bg' ? 'Телефон'              : 'Phone',
    birth_l:      lang === 'bg' ? 'Г. на раждане'        : 'Birth year',
    gender_l:     lang === 'bg' ? 'Пол'                  : 'Gender',
    cityEN:       lang === 'bg' ? 'Град (EN)'             : 'City (EN)',
    cityBG:       lang === 'bg' ? 'Град (BG)'             : 'City (BG)',
    countryEN:    lang === 'bg' ? 'Държава (EN)'          : 'Country (EN)',
    countryBG:    lang === 'bg' ? 'Държава (BG)'          : 'Country (BG)',
    avail_l:      lang === 'bg' ? 'Наличност'             : 'Availability',
    vol_type:     lang === 'bg' ? 'Тип доброволец'        : 'Volunteer type',
    corp_l:       lang === 'bg' ? 'Корпорация'            : 'Corporation',
    role_l:       lang === 'bg' ? 'Роля'                  : 'Role',
    member_since: lang === 'bg' ? 'Член от'               : 'Member since',
    last_active:  lang === 'bg' ? 'Последна активност'    : 'Last updated',
    status_l:     lang === 'bg' ? 'Статус'                : 'Status',
    active:       lang === 'bg' ? 'Активен'               : 'Active',
    inactive:     lang === 'bg' ? 'Неактивен'             : 'Inactive',
    ui_lang:      lang === 'bg' ? 'Език на интерфейса'    : 'Interface language',
    ui_theme:     lang === 'bg' ? 'Тема'                  : 'Theme',
    applications: lang === 'bg' ? 'Заявки'                : 'Applications',
    events:       lang === 'bg' ? 'Потвърдени'            : 'Confirmed',
    hours:        lang === 'bg' ? 'Часове'                : 'Hours',
    corporate:    lang === 'bg' ? 'Корпоративен'          : 'Corporate',
    freelancer:   lang === 'bg' ? 'Независим'             : 'Freelancer',
    bioEN:        lang === 'bg' ? 'За мен (EN)'           : 'About me (EN)',
    bioBG:        lang === 'bg' ? 'За мен (BG)'           : 'About me (BG)',
    skillsEN:     lang === 'bg' ? 'Умения (EN)'           : 'Skills (EN)',
    skillsBG:     lang === 'bg' ? 'Умения (BG)'           : 'Skills (BG)',
    signature:    lang === 'bg' ? 'Подпис и печат'        : 'Signature line',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{L.myProfile}</h1>
        <Link to="/dashboard/profile/edit" className="btn-secondary text-sm">{L.edit}</Link>
      </div>

      {/* ── Hero ── */}
      <div className="card flex items-center gap-5 mb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-brand-600 font-bold text-2xl overflow-hidden shrink-0"
          style={{ background: 'rgba(29,158,117,0.12)', border: '2px solid rgba(29,158,117,0.25)' }}>
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
          {(profile.city || profile.country) && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
              📍 {[lang === 'bg' ? (profile.city_bg || profile.city) : profile.city, lang === 'bg' ? (profile.country_bg || profile.country) : profile.country].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-brand-400"
              style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.25)' }}>
              {roleLabel}
            </span>
            {!profile.is_active && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-red-600"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                {L.inactive}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Ranking ── */}
      {isVolunteer && ranking && (
        <div className="card mb-4 flex items-center gap-5">
          <RankingBadge
            rankingType={ranking.type}
            rankingTypeBg={ranking.type_bg}
            iconUrl={ranking.icon_url}
            lang={lang}
            size="lg"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>
              {lang === 'bg' ? 'Ранг' : 'Ranking'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {lang === 'bg' ? (ranking.message_bg || ranking.message) : ranking.message}
            </p>
            {profile.ranking_date && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                {lang === 'bg' ? 'От' : 'Since'}: {new Date(profile.ranking_date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Stats (volunteers only) ── */}
      {isVolunteer && !loading && (
        <div className="card grid grid-cols-3 gap-0 mb-4 p-0 overflow-hidden">
          {[
            { v: stats.applications, l: L.applications },
            { v: stats.events,       l: L.events        },
            { v: stats.hours,        l: L.hours         },
          ].map((s, i) => (
            <div key={i} className="text-center py-4 px-2"
              style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <p className="text-2xl font-bold text-brand-400">{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Personal Information ── */}
      <Section title={L.personal}>
        <Row label={lang === 'bg' ? 'Пълно име' : 'Full name'} value={lang === 'bg' ? (nameBG || nameEN) : nameEN} />
        <Row label={L.birth_l} value={profile.birth_year} />
        <Row label={L.gender_l}>{profile.gender ? GENDER_LABEL[profile.gender]?.[lang] || profile.gender : null}</Row>
        <Row label={L.phone_l} value={profile.phone} />
        <Row label={lang === 'bg' ? 'Град' : 'City'} value={lang === 'bg' ? (profile.city_bg || profile.city) : profile.city} />
        <Row label={lang === 'bg' ? 'Държава' : 'Country'} value={lang === 'bg' ? (profile.country_bg || profile.country) : profile.country} />
        {isVolunteer && (
          <Row label={L.vol_type}>
            {profile.volunteer_type === 'corporate' ? L.corporate : L.freelancer}
          </Row>
        )}
        {corp && (
          <Row label={L.corp_l}>
            <Link to={`/corporations/${corp.slug}`} className="flex items-center gap-1.5 text-brand-500 hover:underline">
              {corp.logo_url && <img src={corp.logo_url} alt="" className="w-4 h-4 rounded object-cover" />}
              {corp.name}
            </Link>
          </Row>
        )}
        {profile.availability?.length > 0 && (
          <Row label={L.avail_l}>
            <div className="flex flex-wrap gap-1">
              {profile.availability.map(a => <Chip key={a} label={AVAILABILITY_LABEL[a]?.[lang] || a} />)}
            </div>
          </Row>
        )}
      </Section>

      {/* ── Account ── */}
      <Section title={L.account}>
        <Row label={L.email_l}  value={profile.email} />
        <Row label={L.role_l}   value={roleLabel} />
        <Row label={L.status_l}>{profile.is_active ? L.active : L.inactive}</Row>
        <Row label={L.member_since}>{profile.created_at ? fmtDate(profile.created_at) : null}</Row>
        <Row label={L.last_active}>{profile.updated_at ? fmtDate(profile.updated_at) : null}</Row>
      </Section>

      {/* ── Preferences ── */}
      <Section title={L.prefs_s}>
        <Row label={L.ui_lang}>
          {profile.ui_language === 'bg' ? 'Български' : 'English'}
        </Row>
        <Row label={L.ui_theme}>
          {THEME_LABEL[profile.ui_theme]?.[lang] || profile.ui_theme || 'Light'}
        </Row>
      </Section>

      {/* ── About me ── */}
      <Section title={L.bio_section} empty={!profile.bio && !profile.bio_bg}>
        {profile.bio && (
          <Row label={lang === 'bg' ? 'За мен' : 'About me'}>
            <p className="leading-relaxed whitespace-pre-line">{lang === 'bg' ? (profile.bio_bg || profile.bio) : profile.bio}</p>
          </Row>
        )}
      </Section>

      {/* ── Skills ── */}
      <Section title={L.skills_s} empty={!profile.skills && !profile.skills_bg}>
        {profile.skills && (
          <Row label={lang === 'bg' ? 'Умения' : 'Skills'}>
            <div className="flex flex-wrap gap-1">
              {(lang === 'bg' ? (profile.skills_bg || profile.skills) : profile.skills).split(',').map(s => s.trim()).filter(Boolean).map((s, i) => <GrayChip key={i} label={s} />)}
            </div>
          </Row>
        )}
      </Section>

      {/* ── Social networks ── */}
      <Section title={L.social_s} empty={!profile.facebook_url && !profile.instagram_url && !profile.linkedin_url}>
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

      {/* ── Badges ── */}
      <Section title={L.badges_s} empty={badges.length === 0}>
        <div className="flex flex-wrap gap-4 pt-2">
          {badges.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center w-16">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(29,158,117,0.12)', border: '2px solid rgba(29,158,117,0.3)' }}>
                {b.icon || '🏅'}
              </div>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                {lang === 'bg' ? (b.label_bg || b.label) : b.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Achievements ── */}
      <Section title={L.achieve_s} empty={achievements.length === 0}>
        <div className="flex flex-col gap-3 pt-1">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              {/* Badge icon */}
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
                style={{ background: 'rgba(29,158,117,0.12)', border: '2px solid rgba(29,158,117,0.3)' }}>
                {a.badge_url
                  ? <img src={a.badge_url} alt="" className="w-full h-full object-contain p-1" />
                  : <span className="text-xl">🎖️</span>}
              </div>
              {/* Name + message */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {lang === 'bg' ? (a.name_bg || a.name) : a.name}
                </p>
                {(lang === 'bg' ? (a.message_bg || a.message) : a.message) && (
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'bg' ? (a.message_bg || a.message) : a.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Media library ── */}
      <Section title={L.media_s} empty={media.length === 0}>
        <div className="relative bg-black rounded-xl overflow-hidden mb-2 mt-2">
          <img src={media[slideIdx]} alt="" className="w-full h-64 object-cover" />
          {media.length > 1 && (
            <>
              <button onClick={() => setSlide(i => (i - 1 + media.length) % media.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">‹</button>
              <button onClick={() => setSlide(i => (i + 1) % media.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">›</button>
              <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg">{slideIdx + 1}/{media.length}</span>
            </>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {media.map((url, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={'w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ' + (i === slideIdx ? 'border-brand-400' : 'border-transparent')}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </Section>

    </div>
  )
}
