import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CONTENT = {
  en: {
    title: 'About Dataverte',
    subtitle: 'A volunteer marketplace connecting NGOs, corporations, and individuals across Bulgaria.',
    mission_title: 'Our mission',
    mission_desc: 'To make volunteering easy, structured, and impactful — bridging the gap between organizations that need help and people who want to give back.',
    what_title: 'What we do',
    what_desc: 'We provide a platform where NGOs publish projects and events, corporations manage CSR programs, and volunteers find meaningful causes to support.',
    where_title: 'Where we operate',
    where_desc: 'We focus on Bulgaria, supporting civil society organizations, non-profits, and forward-thinking companies that invest in social impact.',
    who_title: 'Who is it for?',
    roles: [
      { label: 'Volunteers', desc: 'Individuals and corporate employees looking for causes to support with their time and skills.', link: '/register', cta: 'Join as volunteer' },
      { label: 'Organizations', desc: 'NGOs and non-profits that want to publish projects, recruit volunteers, and organize events.', link: '/organizations/register', cta: 'List your organization' },
      { label: 'Corporations', desc: 'Companies that want to structure CSR programs and track employee volunteering.', link: '/corporations/register', cta: 'Register your company' },
    ],
    tagline: 'Built with care for civil society in Bulgaria.',
    browse: 'Browse organizations',
    start: 'Get started',
  },
  bg: {
    title: 'За Dataverte',
    subtitle: 'Платформа за доброволчество, свързваща НПО, корпорации и физически лица в България.',
    mission_title: 'Нашата мисия',
    mission_desc: 'Да направим доброволчеството лесно, структурирано и значимо — свързвайки организациите, нуждаещи се от помощ, с хората, желаещи да дадат от себе си.',
    what_title: 'Какво правим',
    what_desc: 'Предоставяме платформа, където НПО публикуват проекти и събития, корпорациите управляват КСО програми, а доброволците намират значими каузи.',
    where_title: 'Къде работим',
    where_desc: 'Фокусираме се върху България, подкрепяйки организации на гражданското общество, организации с нестопанска цел и компании, инвестиращи в социален ефект.',
    who_title: 'За кого е?',
    roles: [
      { label: 'Доброволци', desc: 'Физически лица и служители, търсещи каузи, в които да вложат своето време и умения.', link: '/register', cta: 'Стани доброволец' },
      { label: 'Организации', desc: 'НПО и организации с нестопанска цел, желаещи да публикуват проекти и да набират доброволци.', link: '/organizations/register', cta: 'Регистрирай организация' },
      { label: 'Корпорации', desc: 'Компании, желаещи да структурират КСО програми и да следят доброволческите часове.', link: '/corporations/register', cta: 'Регистрирай компания' },
    ],
    tagline: 'Направено с грижа за гражданското общество в България.',
    browse: 'Разгледай организации',
    start: 'Започни',
  },
}

export default function About() {
  const { i18n } = useTranslation()
  const c = i18n.language === 'bg' ? CONTENT.bg : CONTENT.en

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-medium text-gray-900 mb-4">{c.title}</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">{c.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {[
          { icon: '🤝', title: c.mission_title, desc: c.mission_desc },
          { icon: '🌱', title: c.what_title, desc: c.what_desc },
          { icon: '🇧🇬', title: c.where_title, desc: c.where_desc },
        ].map(item => (
          <div key={item.title} className="card text-center flex flex-col items-center gap-3">
            <span className="text-4xl">{item.icon}</span>
            <h2 className="text-base font-medium text-gray-900">{item.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{c.who_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {c.roles.map(r => (
            <div key={r.label} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-gray-900">{r.label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{r.desc}</p>
              <Link to={r.link} className="text-sm text-brand-500 hover:text-brand-600 font-medium">{r.cta} →</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-400 mb-4">{c.tagline}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/organizations" className="btn-secondary">{c.browse}</Link>
          <Link to="/register" className="btn-primary">{c.start}</Link>
        </div>
      </div>
    </div>
  )
}
