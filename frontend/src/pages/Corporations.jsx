import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function Corporations() {
  const { t, i18n } = useTranslation()
  const [corps, setCorps] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('corporations')
      .select('id, name, slug, description, description_bg, tagline, tagline_bg, logo_url, city, industry, size, is_verified, status')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('name')
      .then(({ data }) => { setCorps(data || []); setLoading(false) })
  }, [])

  const filtered = corps.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{t('nav.corporations')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('corporations_count', { count: filtered.length })}</p>
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
          {search ? 'No corporations match your search.' : 'No corporations yet.'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(corp => {
          const desc = (i18n.language === 'bg' && corp.description_bg) ? corp.description_bg : corp.description
          const tag  = (i18n.language === 'bg' && corp.tagline_bg)     ? corp.tagline_bg     : corp.tagline
          return (
            <Link
              key={corp.id}
              to={'/corporations/' + corp.slug}
              className="card hover:border-gray-200 hover:shadow-sm transition-all flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-lg shrink-0 overflow-hidden">
                  {corp.logo_url
                    ? <img src={corp.logo_url} alt={corp.name} className="w-12 h-12 rounded-xl object-cover" />
                    : corp.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-medium text-gray-900 truncate">{corp.name}</h3>
                    {corp.is_verified && (
                      <svg className="w-4 h-4 text-brand-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {corp.city && <p className="text-sm text-gray-400">{corp.city}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {tag || desc || ''}
              </p>
              {corp.industry && (
                <span className="badge bg-amber-50 text-amber-700 self-start">{corp.industry}</span>
              )}
              {corp.size && (
                <span className="badge bg-gray-50 text-gray-600 border border-gray-200 self-start text-xs">{{
                  micro: 'Micro', small: 'Small', medium: 'Medium',
                  large: 'Large', enterprise: 'Enterprise', global_enterprise: 'Global Enterprise'
                }[corp.size] || corp.size}</span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
