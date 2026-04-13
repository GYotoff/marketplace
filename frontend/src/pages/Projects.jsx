import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function Projects() {
  const { t, i18n } = useTranslation()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, title, title_bg, description, description_bg, cover_url, city, start_date, end_date, volunteers_needed, volunteers_enrolled, status, organizations(name, slug, logo_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Projects error:', error)
        setProjects(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = projects.filter(p =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.organizations?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const spotsLeft = (p) => {
    const left = (p.volunteers_needed || 0) - (p.volunteers_enrolled || 0)
    return Math.max(0, left)
  }

  const formatDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString(i18n.language === 'bg' ? 'bg-BG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{i18n.language === 'bg' ? 'Проекти' : 'Projects'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} {i18n.language === 'bg' ? (filtered.length === 1 ? 'проект' : 'проекта') : (filtered.length === 1 ? 'project' : 'projects')}
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
        <div className="text-center py-16 text-gray-400 text-sm">
          {search ? (i18n.language === 'bg' ? 'Няма намерени проекти.' : 'No projects match your search.') : (i18n.language === 'bg' ? 'Няма активни проекти.' : 'No active projects yet.')}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(p => {
          const title = (i18n.language === 'bg' && p.title_bg) ? p.title_bg : p.title
          const desc  = (i18n.language === 'bg' && p.description_bg) ? p.description_bg : p.description
          const spots = spotsLeft(p)
          return (
            <Link
              key={p.id}
              to={'/projects/' + p.id}
              className="card hover:border-gray-200 hover:shadow-sm transition-all flex flex-col gap-3"
            >
              {p.cover_url && (
                <div className="w-full h-36 rounded-lg overflow-hidden bg-gray-100 -mx-0">
                  <img src={p.cover_url} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-medium text-gray-900 leading-snug">{title}</h3>
                {p.organizations && (
                  <Link
                    to={'/organizations/' + p.organizations.slug}
                    className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600"
                    onClick={e => e.stopPropagation()}
                  >
                    {p.organizations.logo_url && (
                      <img src={p.organizations.logo_url} alt="" className="w-4 h-4 rounded object-cover" />
                    )}
                    {p.organizations.name}
                  </Link>
                )}
                {desc && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">{desc}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-auto pt-1">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {p.city}
                    </span>
                  )}
                  {p.start_date && (
                    <span>{formatDate(p.start_date)}</span>
                  )}
                  {spots > 0 && (
                    <span className="badge bg-brand-50 text-brand-700 ml-auto">
                      {spots} {i18n.language === 'bg' ? 'места' : 'spots left'}
                    </span>
                  )}
                  {spots === 0 && p.volunteers_needed > 0 && (
                    <span className="badge bg-gray-100 text-gray-500 ml-auto">
                      {i18n.language === 'bg' ? 'Запълнен' : 'Full'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
