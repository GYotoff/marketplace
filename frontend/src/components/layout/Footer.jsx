import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-brand-400 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
                  <circle cx="9" cy="6" r="3" fill="white" opacity="0.9"/>
                  <path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-medium">Give<span className="text-brand-400">Forward</span></span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('footer.platform')}</h4>
            {['organizations','corporations','volunteers'].map(k => (
              <Link key={k} to={`/${k}`} className="block text-sm text-gray-500 hover:text-gray-900 mb-2">{t(`nav.${k}`)}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('footer.company')}</h4>
            {[['about','/about'],['blog','/blog'],['contact','/contact']].map(([k,p]) => (
              <Link key={k} to={p} className="block text-sm text-gray-500 hover:text-gray-900 mb-2">{t(`footer.${k}`)}</Link>
            ))}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('footer.legal')}</h4>
            {[['privacy','/privacy'],['terms','/terms'],['cookies','/cookies']].map(([k,p]) => (
              <Link key={k} to={p} className="block text-sm text-gray-500 hover:text-gray-900 mb-2">{t(`footer.${k}`)}</Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-100 gap-2">
          <p className="text-xs text-gray-400">{t('footer.copy')}</p>
          <p className="text-xs text-gray-400">{t('footer.made')}</p>
        </div>
      </div>
    </footer>
  )
}
