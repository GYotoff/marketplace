import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function Organizations() {
  const { t, i18n } = useTranslation()
  const [orgs, setOrgs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('organizations').select('id,name,slug,description,description_bg,logo_url,city,type,is_verified')
      .eq('is_active', true).order('name')
      .then(({ data }) => { setOrgs(data || []); setLoading(false) })
  }, [])

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.city || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{t('nav.organizations')}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} organizations</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(org => (
          <Link key={org.id} to={`/organizations/${org.slug}`} className="card hover:border-gray-200 hover:shadow-sm transition-all flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg shrink-0">
                {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-xl object-cover" /> : org.name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-medium text-gray-900 truncate">{org.name}</h3>
                  {org.is_verified && (
                    <svg className="w-4 h-4 text-brand-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {org.city && <p className="text-sm text-gray-400">{org.city}</p>}
              </div>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {(i18n.language === 'bg' && org.description_bg) ? org.description_bg : org.description}
            </p>
            <span className="badge bg-brand-50 text-brand-700 self-start capitalize">{org.type}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
