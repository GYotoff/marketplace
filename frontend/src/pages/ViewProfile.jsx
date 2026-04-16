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
  male:             { en: 'Male',              bg: 'Мъж' },
  female:           { en: 'Female',            bg: 'Жена' },
  non_binary:       { en: 'Non-binary',        bg: 'Небинарен' },
  prefer_not_to_say:{ en: 'Prefer not to say', bg: 'Предпочитам да не казвам' },
}

const ROLE_LABEL = {
  volunteer:   { en: 'Volunteer',            bg: 'Доброволец' },
  org_admin:   { en: 'Organization admin',   bg: 'Администратор на организация' },
  corp_admin:  { en: 'Corporation admin',    bg: 'Администратор на корпорация' },
  super_admin: { en: 'Platform admin',       bg: 'Администратор на платформата' },
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-brand-400">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
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

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('project_applications').select('id, hours_logged', { count: 'exact' }).eq('profile_id', user.id),
      supabase.from('event_registrations').select('id, hours_logged').eq('profile_id', user.id).eq('status', 'confirmed'),
    ]).then(([apps, evs]) => {
      const evHours = (evs.data || []).reduce((s, r) => s + (r.hours_logged || 0), 0)
      const appHours = (apps.data || []).reduce((s, r) => s + (r.hours_logged || 0), 0)
      setStats({ applications: apps.count || 0, events: (evs.data || []).length, hours: evHours + appHours })
      setLoading(false)
    })
  }, [user?.id])

  if (!profile) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /></div>

  const displayName = (lang === 'bg' ? (profile.full_name_bg || profile.full_name) : profile.full_name) || (lang === 'bg' ? 'Не е зададено' : 'No name set')
  const city = lang === 'bg' ? (profile.city_bg || profile.city) : profile.city
  const country = lang === 'bg' ? (profile.country_bg || 'Bulgaria') : (profile.country || 'Bulgaria')
  const bio = lang === 'bg' ? (profile.bio_bg || profile.bio) : profile.bio
  const skills = lang === 'bg' ? (profile.skills_bg || profile.skills) : profile.skills
  const roleLabel = ROLE_LABEL[profile.role]?.[lang] || profile.role
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const media = profile.media_library || []
  const badges = profile.badges || []
  const achievements = profile.achievements || []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">{lang === 'bg' ? 'Моят профил' : 'My profile'}</h1>
        <Link to="/dashboard/profile/edit" className="btn-secondary text-sm">
          {lang === 'bg' ? 'Редактирай' : 'Edit profile'}
        </Link>
      </div>

      {/* Avatar + name */}
      <div className="card flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-xl overflow-hidden shrink-0">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-medium text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-500">{profile.email}</p>
          {(city || country) && <p className="text-xs text-gray-400 mt-0.5">{[city, country].filter(Boolean).join(', ')}</p>}
          <span className="text-xs text-brand-400 font-medium">{roleLabel}</span>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="card grid grid-cols-3 gap-4 mb-6">
          <Stat label={lang === 'bg' ? 'Приложения' : 'Applications'} value={stats.applications} />
          <Stat label={lang === 'bg' ? 'Събития' : 'Events'} value={stats.events} />
          <Stat label={lang === 'bg' ? 'Часове' : 'Hours'} value={stats.hours} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Personal details */}
        <div className="card flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-700">{lang === 'bg' ? 'Детайли' : 'Details'}</h3>
          {profile.birth_year && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-24 shrink-0">{lang === 'bg' ? 'Година' : 'Birth year'}</span>
              <span className="text-gray-700">{profile.birth_year}</span>
            </div>
          )}
          {profile.gender && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-24 shrink-0">{lang === 'bg' ? 'Пол' : 'Gender'}</span>
              <span className="text-gray-700">{GENDER_LABEL[profile.gender]?.[lang] || profile.gender}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-24 shrink-0">{lang === 'bg' ? 'Телефон' : 'Phone'}</span>
              <span className="text-gray-700">{profile.phone}</span>
            </div>
          )}
          {profile.availability?.length > 0 && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-400 w-24 shrink-0">{lang === 'bg' ? 'Наличност' : 'Available'}</span>
              <div className="flex flex-wrap gap-1">
                {profile.availability.map(a => (
                  <span key={a} className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-2 py-0.5">
                    {AVAILABILITY_LABEL[a]?.[lang] || a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social & skills */}
        <div className="card flex flex-col gap-3">
          {skills && (
            <>
              <h3 className="text-sm font-medium text-gray-700">{lang === 'bg' ? 'Умения' : 'Skills'}</h3>
              <div className="flex flex-wrap gap-1">
                {skills.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                  <span key={i} className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2 py-0.5">{s}</span>
                ))}
              </div>
            </>
          )}
          {(profile.facebook_url || profile.instagram_url || profile.linkedin_url) && (
            <div className="flex flex-col gap-1.5 mt-1">
              {profile.facebook_url && <a href={profile.facebook_url} target="_blank" rel="noreferrer" className="text-sm text-brand-500 hover:underline flex items-center gap-1.5">f Facebook</a>}
              {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="text-sm text-brand-500 hover:underline flex items-center gap-1.5">📷 Instagram</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-sm text-brand-500 hover:underline flex items-center gap-1.5">in LinkedIn</a>}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="card mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{lang === 'bg' ? 'За мен' : 'About me'}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{bio}</p>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="card mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{lang === 'bg' ? 'Значки' : 'Badges'}</h3>
          <div className="flex flex-wrap gap-3">
            {badges.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1 text-center w-16">
                <div className="w-12 h-12 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-xl">
                  {b.icon || '🏅'}
                </div>
                <p className="text-xs text-gray-600 leading-tight">{lang === 'bg' ? (b.label_bg || b.label) : b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card mb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{lang === 'bg' ? 'Постижения' : 'Achievements'}</h3>
          <div className="flex flex-col gap-2">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{a.icon || '⭐'}</span>
                <div>
                  <p className="font-medium text-gray-800">{lang === 'bg' ? (a.title_bg || a.title) : a.title}</p>
                  {(lang === 'bg' ? (a.desc_bg || a.desc) : a.desc) && (
                    <p className="text-xs text-gray-400">{lang === 'bg' ? (a.desc_bg || a.desc) : a.desc}</p>
                  )}
                </div>
                {a.date && <span className="ml-auto text-xs text-gray-400">{new Date(a.date).toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-GB')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media library */}
      {media.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{lang === 'bg' ? 'Медийна библиотека' : 'Media library'}</h3>
          {/* Slideshow */}
          <div className="relative bg-black rounded-xl overflow-hidden mb-2">
            <img src={media[slideIdx]} alt="" className="w-full h-56 object-cover" />
            {media.length > 1 && <>
              <button onClick={() => setSlideIdx(i => (i - 1 + media.length) % media.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">‹</button>
              <button onClick={() => setSlideIdx(i => (i + 1) % media.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">›</button>
              <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-lg">{slideIdx + 1}/{media.length}</span>
            </>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {media.map((url, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                className={'w-10 h-10 rounded-lg overflow-hidden border-2 transition-colors ' + (i === slideIdx ? 'border-brand-400' : 'border-transparent')}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
