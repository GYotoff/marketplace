import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

const SETTINGS_ICON = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'bg' ? 'bg' : 'en'
  const { user, profile, logout } = useAuthStore()
  const { theme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef(null)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMenuOpen(false); setMobileOpen(false) }, [location.pathname])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase()

  const navLink = (to, label) => (
    <Link to={to} className={`text-sm transition-colors ${
      location.pathname === to ? 'text-brand-400 font-medium' : 'hover:text-brand-400'
    }`} style={{ color: location.pathname === to ? undefined : 'var(--text-muted)' }}>
      {label}
    </Link>
  )

  const MenuItem = ({ to, icon, label, color = 'var(--text-muted)' }) => (
    <Link to={to} className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
      style={{ color: 'var(--text)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ color }}>{icon}</span>
      {label}
    </Link>
  )

  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="Dataverte" className="h-9 w-9 object-contain rounded-lg" />
            <span className="font-medium hidden sm:block" style={{ color: 'var(--text)' }}>
              Data<span className="text-brand-400">verte</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLink('/about', t('nav.about'))}
            {navLink('/organizations', t('nav.organizations'))}
            {navLink('/corporations', t('nav.corporations'))}
            {navLink('/volunteers', t('nav.volunteers'))}
            {navLink('/projects', lang === 'bg' ? 'Проекти' : 'Projects')}
            {navLink('/events', lang === 'bg' ? 'Събития' : 'Events')}
          </div>

          {/* Mobile hamburger — shown only on < md */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border-mid)', background: 'transparent', color: 'var(--text)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu">
            {mobileOpen
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Language toggle */}
            <button
              onClick={() => {
                const next = lang === 'en' ? 'bg' : 'en'
                i18n.changeLanguage(next)
                localStorage.setItem('i18nextLng', next)
              }}
              title={lang === 'en' ? 'Switch to Bulgarian' : 'Превключи на английски'}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border-mid)', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Show flag of the language we'll switch TO */}
              {lang === 'en' ? (
                /* Bulgarian flag: white / green / red */
                <span style={{ display:'inline-block', width:22, height:15, borderRadius:3, overflow:'hidden', border:'1px solid var(--border-mid)', flexShrink:0 }}>
                  <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
                    <rect width="22" height="5" fill="#FFFFFF"/>
                    <rect y="5" width="22" height="5" fill="#00966E"/>
                    <rect y="10" width="22" height="5" fill="#D62612"/>
                  </svg>
                </span>
              ) : (
                /* UK flag: Union Jack */
                <span style={{ display:'inline-block', width:22, height:15, borderRadius:3, overflow:'hidden', border:'1px solid var(--border-mid)', flexShrink:0 }}>
                  <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
                    <rect width="22" height="15" fill="#012169"/>
                    <path d="M0 0L22 15M22 0L0 15" stroke="white" strokeWidth="3"/>
                    <path d="M0 0L22 15M22 0L0 15" stroke="#C8102E" strokeWidth="1.8"/>
                    <path d="M11 0V15M0 7.5H22" stroke="white" strokeWidth="4.5"/>
                    <path d="M11 0V15M0 7.5H22" stroke="#C8102E" strokeWidth="2.5"/>
                  </svg>
                </span>
              )}
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {lang === 'en' ? 'БГ' : 'EN'}
              </span>
            </button>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: menuOpen ? '#1D9E75' : 'var(--border-mid)',
                    background: menuOpen ? 'rgba(29,158,117,0.08)' : 'transparent',
                  }}>
                  <div className="w-7 h-7 bg-brand-400 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-24 truncate" style={{ color: 'var(--text)' }}>
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg py-1.5 z-50 border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

                    {/* User header */}
                    <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                        {profile?.full_name || profile?.email}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{profile?.email}</p>
                      <p className="text-xs font-medium mt-0.5 text-brand-400">
                        {{ volunteer: lang === 'bg' ? 'Доброволец' : 'Volunteer', org_admin: lang === 'bg' ? 'Администратор на организация' : 'Org admin', corp_admin: lang === 'bg' ? 'Администратор на корпорация' : 'Corp admin', super_admin: lang === 'bg' ? 'Администратор на платформата' : 'Platform admin' }[profile?.role] || profile?.role}
                      </p>
                    </div>

                    {/* Common links */}
                    <MenuItem to="/dashboard" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} label={t('nav.dashboard')} color="var(--text-muted)" />
                    <MenuItem to="/dashboard/profile" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>} label={lang === 'bg' ? 'Моят профил' : 'My profile'} color="var(--text-muted)" />
                    <MenuItem to="/dashboard/profile/edit" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>} label={lang === 'bg' ? 'Редактирай профил' : 'Edit profile'} color="var(--text-muted)" />

                    {/* Volunteer links */}
                    {profile?.role === 'volunteer' && (
                      <>
                        <MenuItem to="/dashboard/calendar" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>} label={lang === 'bg' ? 'Моят календар' : 'My calendar'} color="var(--text-muted)" />
                        <MenuItem to="/dashboard/attendance" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label={lang === 'bg' ? 'Моето участие' : 'My attendance'} color="var(--text-muted)" />
                      </>
                    )}

                    {/* Org admin links */}
                    {(profile?.role === 'org_admin' || profile?.role === 'content_creator') && (
                      <>
                        <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                        <MenuItem to="/org/dashboard" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>} label={lang === 'bg' ? 'Табло на организацията' : 'Organization dashboard'} color="rgb(96,165,250)" />
                        <MenuItem to="/org/projects" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>} label={lang === 'bg' ? 'Проекти и събития' : 'Projects and events'} color="rgb(96,165,250)" />
                        <MenuItem to="/org/settings" icon={SETTINGS_ICON} label={lang === 'bg' ? 'Настройки на организацията' : 'Organization settings'} color="rgb(96,165,250)" />
                        <MenuItem to="/org/content" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} label={lang === 'bg' ? 'Редактор на съдържание' : 'Content editor'} color="rgb(96,165,250)" />
                      </>
                    )}

                    {/* Corp admin links */}
                    {profile?.role === 'corp_admin' && (
                      <>
                        <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                        <MenuItem to="/corp/dashboard" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} label={lang === 'bg' ? 'Табло на корпорацията' : 'Corporation dashboard'} color="rgb(251,191,36)" />
                        <MenuItem to="/corp/settings" icon={SETTINGS_ICON} label={lang === 'bg' ? 'Настройки на корпорацията' : 'Corporation settings'} color="rgb(251,191,36)" />
                        <MenuItem to="/corp/content" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} label={lang === 'bg' ? 'Редактор на съдържание' : 'Content editor'} color="rgb(251,191,36)" />
                      </>
                    )}

                    {/* Super admin links */}
                    {profile?.role === 'super_admin' && (
                      <>
                        <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                        <MenuItem to="/admin/organizations" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label={lang === 'bg' ? 'Одобрения на организации' : 'Organization approvals'} color="rgb(251,191,36)" />
                        <MenuItem to="/admin/corporations" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} label={lang === 'bg' ? 'Одобрения на корпорации' : 'Corporation approvals'} color="rgb(251,191,36)" />
                        <MenuItem to="/admin/entities" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label={lang === 'bg' ? 'Управление на субекти' : 'Entity management'} color="rgb(251,191,36)" />
                        <MenuItem to="/admin/rankings" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>} label={lang === 'bg' ? 'Рангове' : 'Rankings'} color="rgb(251,191,36)" />
                        <MenuItem to="/admin/achievements" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>} label={lang === 'bg' ? 'Постижения' : 'Achievements'} color="rgb(251,191,36)" />
                        <MenuItem to="/admin/progression-rules" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>} label={lang === 'bg' ? 'Правила за прогрес' : 'Progression rules'} color="rgb(251,191,36)" />
                      </>
                    )}

                    {/* Settings — for all logged-in users */}
                    <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                    <MenuItem to="/settings"
                      icon={<span className="text-sm">{themeIcon}</span>}
                      label={lang === 'bg' ? 'Настройки' : 'Settings'}
                      color="var(--text-muted)" />

                    {/* Logout */}
                    <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition-colors"
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary hidden sm:block text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile menu drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 flex flex-col gap-1">

            {/* Public nav links */}
            <Link to="/about" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.about')}
            </Link>
            <Link to="/organizations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.organizations')}
            </Link>
            <Link to="/corporations" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.corporations')}
            </Link>
            <Link to="/volunteers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.volunteers')}
            </Link>
            <Link to="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.projects')}
            </Link>
            <Link to="/events" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {t('nav.events')}
            </Link>

            {/* Auth links */}
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {user ? (
                <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {lang === 'bg' ? 'Табло' : 'Dashboard'}
                </Link>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <Link to="/login" className="btn-secondary text-sm text-center">{t('nav.login')}</Link>
                  <Link to="/register" className="btn-primary text-sm text-center">{t('nav.register')}</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
