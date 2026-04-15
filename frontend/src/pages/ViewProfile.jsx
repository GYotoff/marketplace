import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

const FIELD = ({ label, value, placeholder = '—' }) => (
  <div className="flex flex-col gap-0.5">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
      {value || placeholder}
    </p>
  </div>
)

export default function ViewProfile() {
  const { user, profile } = useAuthStore()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const [stats, setStats] = useState({ applications: 0, events: 0, hours: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('project_applications')
        .select('id, hours_logged', { count: 'exact' })
        .eq('profile_id', user.id),
      supabase.from('event_registrations')
        .select('id, hours_logged', { count: 'exact' })
        .eq('profile_id', user.id),
    ]).then(([apps, regs]) => {
      const appHours = (apps.data || []).reduce((s, r) => s + (r.hours_logged || 0), 0)
      const regHours = (regs.data || []).reduce((s, r) => s + (r.hours_logged || 0), 0)
      setStats({
        applications: apps.count || 0,
        events: regs.count || 0,
        hours: appHours + regHours,
      })
      setLoading(false)
    })
  }, [user])

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : profile.email[0].toUpperCase()

  const roleLabel = lang === 'bg' ? {
    volunteer: 'Доброволец',
    org_admin: 'Администратор на организация',
    corp_admin: 'Администратор на корпорация',
    super_admin: 'Администратор на платформата',
  }[profile.role] || profile.role : {
    volunteer: 'Volunteer',
    org_admin: 'Organization admin',
    corp_admin: 'Corporation admin',
    super_admin: 'Platform admin',
  }[profile.role] || profile.role

  const roleColor = {
    volunteer: 'bg-brand-50 text-brand-700',
    org_admin: 'bg-blue-50 text-blue-700',
    corp_admin: 'bg-amber-50 text-amber-700',
    super_admin: 'bg-purple-50 text-purple-700',
  }[profile.role] || 'bg-gray-50 text-gray-700'

  const completionFields = ['full_name', 'phone', 'bio', 'city']
  const filled = completionFields.filter(f => profile[f]).length
  const completionPct = Math.round((filled / completionFields.length) * 100)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header card */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl font-medium text-brand-600 shrink-0 overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              : initials
            }
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-medium text-gray-900">{(lang === 'bg' ? (profile.full_name_bg || profile.full_name) : profile.full_name) || (lang === 'bg' ? 'Не е зададено' : 'No name set')}</h1>
              <span className={`badge ${roleColor} text-xs`}>{roleLabel}</span>
            </div>
            <p className="text-sm text-gray-500">{profile.email}</p>
            {profile.city && (
              <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {lang === 'bg' ? (profile.city_bg || profile.city) : profile.city}, {lang === 'bg' ? (profile.country_bg || profile.country) : profile.country}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'bg' ? 'Член от ' : 'Member since '}{new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <Link to="/dashboard/profile/edit" className="btn-secondary text-sm shrink-0">
            Edit profile
          </Link>
        </div>

        {/* Profile completion bar */}
        {completionPct < 100 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-gray-500">Profile completion</p>
              <p className="text-xs text-brand-400 font-medium">{completionPct}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct < 100 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Add {completionFields.filter(f => !profile[f]).map(f => f.replace('_', ' ')).join(', ')} to complete your profile.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: lang === 'bg' ? 'Заявки за проекти' : 'Project applications', value: stats.applications },
            { label: lang === 'bg' ? 'Регистрации за събития' : 'Events registered', value: stats.events },
            { label: lang === 'bg' ? 'Доброволчески часове' : 'Volunteer hours', value: stats.hours },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className="text-2xl font-medium text-brand-400">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="card mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{lang === 'bg' ? (profile.bio_bg || profile.bio) : profile.bio}</p>
        </div>
      )}

      {/* Details grid */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Profile details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FIELD label={lang === 'bg' ? 'Пълно име' : 'Full name'} value={lang === 'bg' ? (profile.full_name_bg || profile.full_name) : profile.full_name} />
          <FIELD label={lang === 'bg' ? 'Имейл' : 'Email'} value={profile.email} />
          <FIELD label={lang === 'bg' ? 'Телефон' : 'Phone'} value={profile.phone} />
          <FIELD label={lang === 'bg' ? 'Град' : 'City'} value={lang === 'bg' ? (profile.city_bg || profile.city) : profile.city} />
          <FIELD label={lang === 'bg' ? 'Държава' : 'Country'} value={lang === 'bg' ? (profile.country_bg || profile.country) : profile.country} />
          <FIELD label={lang === 'bg' ? 'Предпочитан език' : 'Preferred language'} value={profile.preferred_language === 'bg' ? 'Български' : 'English'} />
          <FIELD label={lang === 'bg' ? 'Роля' : 'Role'} value={roleLabel} />
          <FIELD label={lang === 'bg' ? 'Статус на акаунта' : 'Account status'} value={lang === 'bg' ? (profile.is_active ? 'Активен' : 'Неактивен') : (profile.is_active ? 'Active' : 'Inactive')} />
        </div>
      </div>
    </div>
  )
}
