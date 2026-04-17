import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import RankingBadge from '@/components/ui/RankingBadge'

const AVAILABILITY_LABEL = {
  weekdays: { en: 'Weekdays',  bg: 'Делнични' },
  weekends: { en: 'Weekends',  bg: 'Уикенди' },
  mornings: { en: 'Mornings',  bg: 'Сутрини' },
  evenings: { en: 'Evenings',  bg: 'Вечери' },
}

const RANK_COLOR = {
  Standard: '#6b7280',
  Bronze:   '#cd7f32',
  Silver:   '#708090',
  Gold:     '#c9a200',
  Platinum: '#4a90a4',
}

export default function Volunteers() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [volunteers, setVolunteers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('get_public_volunteers')
      .then(({ data, error }) => {
        if (error) console.error('Volunteers query error:', error)
        setVolunteers(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = volunteers.filter(v => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (v.full_name || '').toLowerCase().includes(s) ||
      (v.full_name_bg || '').toLowerCase().includes(s) ||
      (v.city || '').toLowerCase().includes(s) ||
      (v.city_bg || '').toLowerCase().includes(s) ||
      (v.skills || '').toLowerCase().includes(s) ||
      (v.skills_bg || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{t('nav.volunteers')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} {lang === 'bg' ? (filtered.length === 1 ? 'доброволец' : 'доброволци') : (filtered.length === 1 ? 'volunteer' : 'volunteers')}
          </p>
        </div>
        <input
          type="search"
          placeholder={t('common.search')}
          className="input sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-400">{t('common.loading')}</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">
            {search
              ? (lang === 'bg' ? 'Няма намерени доброволци.' : 'No volunteers match your search.')
              : (lang === 'bg' ? 'Все още няма доброволци.' : 'No volunteers yet.')}
          </p>
          {!search && <Link to="/register" className="btn-primary">{lang === 'bg' ? 'Бъди първи' : 'Be the first volunteer'}</Link>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(v => {
          const name = (lang === 'bg' ? (v.full_name_bg || v.full_name) : v.full_name) || (lang === 'bg' ? 'Доброволец' : 'Volunteer')
          const city = (lang === 'bg' ? (v.city_bg || v.city) : v.city)
          const country = (lang === 'bg' ? (v.country_bg || v.country) : v.country) || 'Bulgaria'
          const bio = (lang === 'bg' ? (v.bio_bg || v.bio) : v.bio)
          const skills = (lang === 'bg' ? (v.skills_bg || v.skills) : v.skills)
          const initials = (v.full_name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
          const badges = v.badges || []
          const achievements = v.achievements || []

          return (
            <div key={v.id} className="card flex flex-col gap-3">
              {/* Header: avatar + name + location + ranking */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg overflow-hidden">
                    {v.avatar_url
                      ? <img src={v.avatar_url} alt={name} className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  {v.ranking_type && (
                    <div className="absolute -bottom-1 -right-1">
                      <img src={v.ranking_icon_url || `/badges/${v.ranking_type.toLowerCase()}.png`}
                        alt={v.ranking_type} title={lang === 'bg' ? v.ranking_type_bg : v.ranking_type}
                        className="w-5 h-5 object-contain drop-shadow" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                  {(city || country) && (
                    <p className="text-xs text-gray-400 truncate">{[city, country].filter(Boolean).join(', ')}</p>
                  )}
                  {v.ranking_type && (
                    <span className="text-xs font-semibold" style={{ color: RANK_COLOR[v.ranking_type] || '#6b7280' }}>
                      {lang === 'bg' ? v.ranking_type_bg : v.ranking_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Corporation membership */}
              {v.corp_name && (
                <Link to={`/corporations/${v.corp_slug}`}
                  className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 rounded-lg px-2.5 py-1.5">
                  {v.corp_logo_url && <img src={v.corp_logo_url} alt="" className="w-4 h-4 rounded object-cover" />}
                  <span className="font-medium truncate">{v.corp_name}</span>
                </Link>
              )}

              {/* Stats: events + hours */}
              {(v.event_count > 0 || v.confirmed_hours > 0) && (
                <div className="flex gap-3 text-xs text-gray-500">
                  {v.event_count > 0 && (
                    <span className="flex items-center gap-1">
                      📅 <strong className="text-gray-700">{v.event_count}</strong>
                      {lang === 'bg' ? ' събит.' : ' events'}
                    </span>
                  )}
                  {v.confirmed_hours > 0 && (
                    <span className="flex items-center gap-1">
                      ⏱ <strong className="text-gray-700">{v.confirmed_hours}</strong>
                      {lang === 'bg' ? ' часа' : ' hours'}
                    </span>
                  )}
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{bio}</p>
              )}

              {/* Skills */}
              {skills && (
                <div className="flex flex-wrap gap-1">
                  {skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4).map((s, i) => (
                    <span key={i} className="badge bg-gray-50 text-gray-600 border border-gray-200 text-xs px-2 py-0.5">{s}</span>
                  ))}
                </div>
              )}

              {/* Availability */}
              {v.availability?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {v.availability.map(a => (
                    <span key={a} className="badge bg-brand-50 text-brand-700 border border-brand-100 text-xs px-2 py-0.5">
                      {AVAILABILITY_LABEL[a]?.[lang] || a}
                    </span>
                  ))}
                </div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {badges.slice(0, 5).map((b, i) => (
                    <span key={i} title={lang === 'bg' ? (b.label_bg || b.label) : b.label}
                      className="w-8 h-8 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-base">
                      {b.icon || '🏅'}
                    </span>
                  ))}
                  {badges.length > 5 && (
                    <span className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                      +{badges.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <div className="flex flex-col gap-1 text-xs text-gray-600">
                  {achievements.slice(0, 2).map((a, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span>{a.icon || '⭐'}</span>
                      <span>{lang === 'bg' ? (a.title_bg || a.title) : a.title}</span>
                    </div>
                  ))}
                  {achievements.length > 2 && (
                    <span className="text-gray-400">+{achievements.length - 2} {lang === 'bg' ? 'още' : 'more'}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
