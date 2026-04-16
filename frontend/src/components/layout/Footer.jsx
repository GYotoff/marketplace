import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Dataverte" className="h-8 w-8 object-contain rounded-lg" />
              <span className="font-medium" style={{ color: 'var(--text)' }}>Data<span className="text-brand-400">verte</span></span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>{t('footer.platform')}</h4>
            {['organizations','corporations','volunteers'].map(k => (
              <Link key={k} to={`/${k}`} className="block text-sm mb-2 transition-colors hover:text-brand-400"
                style={{ color: 'var(--text-muted)' }}>{t(`nav.${k}`)}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>{t('footer.company')}</h4>
            {[['about','/about'],['blog','/blog'],['contact','/contact']].map(([k,p]) => (
              <Link key={k} to={p} className="block text-sm mb-2 transition-colors hover:text-brand-400"
                style={{ color: 'var(--text-muted)' }}>{t(`footer.${k}`)}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>{t('footer.legal')}</h4>
            {[['privacy','/privacy'],['terms','/terms'],['cookies','/cookies']].map(([k,p]) => (
              <Link key={k} to={p} className="block text-sm mb-2 transition-colors hover:text-brand-400"
                style={{ color: 'var(--text-muted)' }}>{t(`footer.${k}`)}</Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-2"
          style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{t('footer.copy')}</p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{t('footer.made')}</p>
        </div>
      </div>
    </footer>
  )
}
