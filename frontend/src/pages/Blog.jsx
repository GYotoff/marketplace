import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const CONTENT = {
  en: {
    title: 'Blog',
    subtitle: 'Insights, stories, and updates from the Dataverte community.',
    empty: 'No posts yet — check back soon.',
    back: '← Back to home',
  },
  bg: {
    title: 'Блог',
    subtitle: 'Истории, новини и актуализации от общността на Dataverte.',
    empty: 'Все още няма публикации — очаквайте скоро.',
    back: '← Към начало',
  },
}

export default function Blog() {
  const { i18n } = useTranslation()
  const c = i18n.language === 'bg' ? CONTENT.bg : CONTENT.en
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-medium text-gray-900 mb-3">{c.title}</h1>
      <p className="text-gray-500 mb-10">{c.subtitle}</p>
      <div className="card text-center py-16 text-gray-400 text-sm">{c.empty}</div>
      <Link to="/" className="block mt-8 text-sm text-brand-500 hover:text-brand-600">{c.back}</Link>
    </div>
  )
}
