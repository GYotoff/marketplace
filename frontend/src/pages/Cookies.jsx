import { useTranslation } from 'react-i18next'

const CONTENT = {
  en: {
    title: 'Cookie Policy',
    updated: 'Last updated: April 2026',
    intro: 'This Cookie Policy explains how Dataverte uses cookies and similar technologies when you visit our platform.',
    sections: [
      {
        heading: 'What are cookies?',
        body: 'Cookies are small text files placed on your device when you visit a website. They help the site remember information about your visit, making your next visit easier and the site more useful to you.',
      },
      {
        heading: 'Cookies we use',
        body: 'We use only essential cookies necessary for the platform to function. These include: an authentication cookie to keep you logged in during your session, and a language preference cookie to remember whether you prefer English or Bulgarian.',
      },
      {
        heading: 'Cookies we do NOT use',
        body: 'We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies. We do not share cookie data with advertisers or data brokers.',
      },
      {
        heading: 'Cookie duration',
        body: 'Authentication cookies expire when you log out or after 7 days of inactivity. Language preference cookies are stored for up to 1 year.',
      },
      {
        heading: 'Managing cookies',
        body: 'You can control and delete cookies through your browser settings. Note that disabling essential cookies may prevent the platform from functioning correctly — for example, you will not be able to stay logged in.',
      },
      {
        heading: 'Contact',
        body: 'If you have questions about our use of cookies, contact us at hello@dataverte.com.',
      },
    ],
  },
  bg: {
    title: 'Политика за бисквитки',
    updated: 'Последна актуализация: Април 2026',
    intro: 'Тази Политика за бисквитки обяснява как Dataverte използва бисквитки и подобни технологии при посещение на нашата платформа.',
    sections: [
      {
        heading: 'Какво са бисквитките?',
        body: 'Бисквитките са малки текстови файлове, поставени на устройството ти при посещение на уебсайт. Те помагат на сайта да запомни информация за посещението ти, правейки следващото посещение по-лесно.',
      },
      {
        heading: 'Бисквитки, които използваме',
        body: 'Използваме само основни бисквитки, необходими за функционирането на платформата. Те включват: бисквитка за удостоверяване, за да останеш влязъл по време на сесията си, и бисквитка за езикови предпочитания — за запомняне дали предпочиташ английски или български.',
      },
      {
        heading: 'Бисквитки, които НЕ използваме',
        body: 'Не използваме рекламни бисквитки, бисквитки за проследяване между сайтове или бисквитки за анализи на трети страни. Не споделяме данни от бисквитки с рекламодатели или брокери на данни.',
      },
      {
        heading: 'Продължителност на бисквитките',
        body: 'Бисквитките за удостоверяване изтичат при изход от системата или след 7 дни неактивност. Бисквитките за езикови предпочитания се съхраняват до 1 година.',
      },
      {
        heading: 'Управление на бисквитките',
        body: 'Можеш да контролираш и изтриваш бисквитките чрез настройките на браузъра си. Имай предвид, че деактивирането на основните бисквитки може да попречи на правилното функциониране на платформата — например, няма да можеш да останеш влязъл.',
      },
      {
        heading: 'Контакт',
        body: 'Ако имаш въпроси относно използването на бисквитки, свържи се с нас на hello@dataverte.com.',
      },
    ],
  },
}

export default function Cookies() {
  const { i18n } = useTranslation()
  const c = i18n.language === 'bg' ? CONTENT.bg : CONTENT.en
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-medium text-gray-900 mb-2">{c.title}</h1>
      <p className="text-sm text-gray-400 mb-4">{c.updated}</p>
      <p className="text-sm text-gray-600 leading-relaxed mb-10">{c.intro}</p>
      <div className="flex flex-col gap-8">
        {c.sections.map(s => (
          <div key={s.heading}>
            <h2 className="text-base font-medium text-gray-900 mb-2">{s.heading}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
