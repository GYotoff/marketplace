import { useTranslation } from 'react-i18next'

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. Information we collect',
        body: 'We collect information you provide when registering, such as your name, email address, city, and role. We also collect usage data such as pages visited and actions taken on the platform.',
      },
      {
        heading: '2. How we use your information',
        body: 'We use your information to provide and improve the Dataverte platform, communicate with you about your account and activities, match volunteers with organizations and projects, and send important updates about the service.',
      },
      {
        heading: '3. Data sharing',
        body: 'We do not sell your personal data. We may share limited profile information (name, city) with organizations and corporations you interact with on the platform. We do not share data with third-party advertisers.',
      },
      {
        heading: '4. Data retention',
        body: 'We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at hello@dataverte.com.',
      },
      {
        heading: '5. Cookies',
        body: 'We use essential cookies to keep you logged in and remember your language preference. We do not use tracking or advertising cookies. See our Cookie Policy for details.',
      },
      {
        heading: '6. Your rights',
        body: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at hello@dataverte.com. We will respond within 30 days.',
      },
      {
        heading: '7. Security',
        body: 'We use industry-standard security measures including encrypted connections (HTTPS) and secure authentication. Your password is never stored in plain text.',
      },
      {
        heading: '8. Contact',
        body: 'For privacy-related questions, contact us at hello@dataverte.com.',
      },
    ],
  },
  bg: {
    title: 'Политика за поверителност',
    updated: 'Последна актуализация: Април 2026',
    sections: [
      {
        heading: '1. Информация, която събираме',
        body: 'Събираме информацията, която предоставяш при регистрация: имена, имейл адрес, град и роля. Събираме и данни за използването на платформата — посетени страници и извършени действия.',
      },
      {
        heading: '2. Как използваме информацията ти',
        body: 'Използваме информацията за предоставяне и подобряване на платформата Dataverte, за комуникация с теб относно акаунта и дейностите ти, за свързване на доброволци с организации и проекти, и за изпращане на важни актуализации.',
      },
      {
        heading: '3. Споделяне на данни',
        body: 'Ние не продаваме твоите лични данни. Можем да споделяме ограничена информация от профила ти (имена, град) с организациите и корпорациите, с които взаимодействаш в платформата. Не споделяме данни с рекламодатели.',
      },
      {
        heading: '4. Съхранение на данни',
        body: 'Съхраняваме данните ти, докато акаунтът ти е активен. Можеш да поискаш изтриване на акаунта и свързаните данни по всяко време, като се свържеш с нас на hello@dataverte.com.',
      },
      {
        heading: '5. Бисквитки',
        body: 'Използваме основни бисквитки, за да поддържаме сесията ти и да запомним езиковите ти предпочитания. Не използваме проследяващи или рекламни бисквитки. Виж нашата Политика за бисквитки за подробности.',
      },
      {
        heading: '6. Твоите права',
        body: 'Имаш право да получиш достъп, да коригираш или да изтриеш личните си данни. За да упражниш тези права, се свържи с нас на hello@dataverte.com. Ще отговорим в рамките на 30 дни.',
      },
      {
        heading: '7. Сигурност',
        body: 'Използваме стандартни за индустрията мерки за сигурност, включително криптирани връзки (HTTPS) и сигурно удостоверяване. Паролата ти никога не се съхранява в явен вид.',
      },
      {
        heading: '8. Контакт',
        body: 'За въпроси, свързани с поверителността, се свържи с нас на hello@dataverte.com.',
      },
    ],
  },
}

export default function Privacy() {
  const { i18n } = useTranslation()
  const c = i18n.language === 'bg' ? CONTENT.bg : CONTENT.en
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-medium text-gray-900 mb-2">{c.title}</h1>
      <p className="text-sm text-gray-400 mb-10">{c.updated}</p>
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
