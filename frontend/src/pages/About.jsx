import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-medium text-gray-900 mb-4">About Dataverte</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          A volunteer marketplace connecting NGOs, corporations, and individuals across Bulgaria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {[
          {
            icon: '🤝',
            title: 'Our mission',
            desc: 'To make volunteering easy, structured, and impactful — bridging the gap between organizations that need help and people who want to give back.',
          },
          {
            icon: '🌱',
            title: 'What we do',
            desc: 'We provide a platform where NGOs publish projects and events, corporations manage CSR programs, and volunteers find meaningful causes to support.',
          },
          {
            icon: '🇧🇬',
            title: 'Where we operate',
            desc: 'We focus on Bulgaria, supporting civil society organizations, non-profits, and forward-thinking companies that invest in social impact.',
          },
        ].map(item => (
          <div key={item.title} className="card text-center flex flex-col items-center gap-3">
            <span className="text-4xl">{item.icon}</span>
            <h2 className="text-base font-medium text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Who is it for?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Volunteers', desc: 'Individuals and corporate employees looking for causes to support with their time and skills.', link: '/register', cta: 'Join as volunteer' },
            { label: 'Organizations', desc: 'NGOs and non-profits that want to publish projects, recruit volunteers, and organize events.', link: '/organizations/register', cta: 'List your organization' },
            { label: 'Corporations', desc: 'Companies that want to structure CSR programs and track employee volunteering.', link: '/corporations/register', cta: 'Register your company' },
          ].map(r => (
            <div key={r.label} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-gray-900">{r.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{r.desc}</p>
              <Link to={r.link} className="text-sm text-brand-500 hover:text-brand-600 font-medium">{r.cta} →</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400 mb-4">Built with care for civil society in Bulgaria.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/organizations" className="btn-secondary">Browse organizations</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </div>
    </div>
  )
}
