import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export default function Volunteers() {
  const { t } = useTranslation()
  const [volunteers, setVolunteers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, city, bio, avatar_url, skills, role')
      .eq('role', 'volunteer')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => { setVolunteers(data || []); setLoading(false) })
  }, [])

  const filtered = volunteers.filter(v =>
    (v.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium">{t('nav.volunteers')}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} volunteer{filtered.length !== 1 ? 's' : ''}</p>
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
            {search ? 'No volunteers match your search.' : 'No volunteers yet.'}
          </p>
          {!search && (
            <Link to="/register" className="btn-primary">Be the first volunteer</Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(v => {
          const initials = (v.full_name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
          return (
            <div key={v.id} className="card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-semibold text-lg shrink-0 overflow-hidden">
                  {v.avatar_url
                    ? <img src={v.avatar_url} alt={v.full_name} className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{v.full_name || 'Volunteer'}</h3>
                  {v.city && <p className="text-sm text-gray-400">{v.city}</p>}
                </div>
              </div>
              {v.bio && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{v.bio}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
