import { useTranslation } from 'react-i18next'

const CONTENT = {
  en: {
    title: 'Terms of Use',
    updated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. Acceptance of terms',
        body: 'By accessing or using Dataverte, you agree to these Terms of Use. If you do not agree, please do not use the platform.',
      },
      {
        heading: '2. Eligibility',
        body: 'You must be at least 18 years old to create an account. By registering, you confirm that the information you provide is accurate and complete.',
      },
      {
        heading: '3. Account responsibilities',
        body: 'You are responsible for maintaining the confidentiality of your account credentials. You may not share your account with others or use another person\'s account without permission.',
      },
      {
        heading: '4. Acceptable use',
        body: 'You agree not to use the platform for any unlawful purpose, to post false or misleading information, to harass or harm other users, or to interfere with the operation of the platform.',
      },
      {
        heading: '5. Content',
        body: 'You retain ownership of content you post. By posting, you grant Dataverte a non-exclusive license to display that content on the platform. You are responsible for ensuring your content does not infringe third-party rights.',
      },
      {
        heading: '6. Organizations and corporations',
        body: 'Organizations and corporations must provide accurate registration information. Dataverte reserves the right to approve, reject, or remove any registered entity at its discretion.',
      },
      {
        heading: '7. Limitation of liability',
        body: 'Dataverte is provided "as is". We are not liable for any damages arising from use of the platform, including loss of data or volunteer matching outcomes.',
      },
      {
        heading: '8. Changes to terms',
        body: 'We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.',
      },
      {
        heading: '9. Contact',
        body: 'For questions about these terms, contact us at hello@dataverte.com.',
      },
    ],
  },
  bg: {
    title: 'Условия за ползване',
    updated: 'Последна актуализация: Април 2026',
    sections: [
      {
        heading: '1. Приемане на условията',
        body: 'С достъпа до или използването на Dataverte се съгласяваш с тези Условия за ползване. Ако не се съгласяваш, моля не използвай платформата.',
      },
      {
        heading: '2. Допустимост',
        body: 'Трябва да си навършил поне 18 години, за да създадеш акаунт. С регистрацията потвърждаваш, че предоставената информация е точна и пълна.',
      },
      {
        heading: '3. Отговорности за акаунта',
        body: 'Ти си отговорен за поверителността на данните за достъп до акаунта си. Не можеш да споделяш акаунта си с други или да използваш чужд акаунт без разрешение.',
      },
      {
        heading: '4. Допустима употреба',
        body: 'Съгласяваш се да не използваш платформата за незаконни цели, да не публикуваш невярна или подвеждаща информация, да не тормозиш или наранявяш други потребители и да не пречиш на работата на платформата.',
      },
      {
        heading: '5. Съдържание',
        body: 'Запазваш собствеността върху публикуваното от теб съдържание. С публикуването предоставяш на Dataverte неизключителен лиценз за показване на това съдържание в платформата. Ти носиш отговорност съдържанието ти да не нарушава права на трети страни.',
      },
      {
        heading: '6. Организации и корпорации',
        body: 'Организациите и корпорациите трябва да предоставят точна информация при регистрация. Dataverte си запазва правото да одобрява, отхвърля или премахва всеки регистриран субект по свое усмотрение.',
      },
      {
        heading: '7. Ограничение на отговорността',
        body: 'Dataverte се предоставя "такава каквато е". Ние не носим отговорност за вреди, произтичащи от използването на платформата, включително загуба на данни или резултати от свързването с доброволци.',
      },
      {
        heading: '8. Промени в условията',
        body: 'Можем да актуализираме тези условия от време на време. Продължаването на използването на платформата след промени представлява приемане на новите условия.',
      },
      {
        heading: '9. Контакт',
        body: 'За въпроси относно тези условия, свържи се с нас на hello@dataverte.com.',
      },
    ],
  },
}

export default function Terms() {
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
