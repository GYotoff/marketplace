import { useTranslation } from 'react-i18next'

const CONTENT = {
  en: {
    title: 'Contact us',
    subtitle: 'Have a question or want to get in touch? We would love to hear from you.',
    sections: [
      { icon: '📧', label: 'Email', value: 'hello@dataverte.com', href: 'mailto:hello@dataverte.com' },
      { icon: '🌐', label: 'Website', value: 'www.dataverte.com', href: 'https://www.dataverte.com' },
      { icon: '📍', label: 'Location', value: 'Sofia, Bulgaria', href: null },
    ],
    org_title: 'For organizations',
    org_desc: 'Looking to register your NGO or non-profit? Visit our organization registration page to get started.',
    org_link: 'Register your organization →',
    corp_title: 'For corporations',
    corp_desc: 'Interested in setting up a CSR program for your company? We can help you structure and track employee volunteering.',
    corp_link: 'Register your company →',
  },
  bg: {
    title: 'Свържи се с нас',
    subtitle: 'Имаш въпрос или искаш да се свържеш с нас? Ще се радваме да чуем от теб.',
    sections: [
      { icon: '📧', label: 'Имейл', value: 'hello@dataverte.com', href: 'mailto:hello@dataverte.com' },
      { icon: '🌐', label: 'Уебсайт', value: 'www.dataverte.com', href: 'https://www.dataverte.com' },
      { icon: '📍', label: 'Местоположение', value: 'София, България', href: null },
    ],
    org_title: 'За организации',
    org_desc: 'Искаш да регистрираш НПО или организация с нестопанска цел? Посети страницата за регистрация.',
    org_link: 'Регистрирай организация →',
    corp_title: 'За корпорации',
    corp_desc: 'Искаш да създадеш КСО програма за компанията си? Ние можем да помогнем.',
    corp_link: 'Регистрирай компания →',
  },
}

export default function Contact() {
  const { i18n } = useTranslation()
  const c = i18n.language === 'bg' ? CONTENT.bg : CONTENT.en
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-medium text-gray-900 mb-3">{c.title}</h1>
      <p className="text-gray-500 mb-10">{c.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {c.sections.map(s => (
          <div key={s.label} className="card text-center flex flex-col items-center gap-2">
            <span className="text-3xl">{s.icon}</span>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
            {s.href
              ? <a href={s.href} className="text-sm text-brand-500 hover:text-brand-600 font-medium">{s.value}</a>
              : <p className="text-sm text-gray-700">{s.value}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="card flex flex-col gap-2">
          <h2 className="text-base font-medium text-gray-900">{c.org_title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed flex-1">{c.org_desc}</p>
          <a href="/organizations/register" className="text-sm text-brand-500 hover:text-brand-600 font-medium">{c.org_link}</a>
        </div>
        <div className="card flex flex-col gap-2">
          <h2 className="text-base font-medium text-gray-900">{c.corp_title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed flex-1">{c.corp_desc}</p>
          <a href="/corporations/register" className="text-sm text-brand-500 hover:text-brand-600 font-medium">{c.corp_link}</a>
        </div>
      </div>
    </div>
  )
}
