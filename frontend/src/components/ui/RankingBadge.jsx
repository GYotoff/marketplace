/**
 * RankingBadge — shows the volunteer's ranking shield icon + type label.
 * Props:
 *   rankingType     string  — 'Standard'|'Bronze'|'Silver'|'Gold'|'Platinum'
 *   rankingTypeBg   string  — Bulgarian type label
 *   iconUrl         string  — /badges/bronze.png etc.
 *   lang            string  — 'en'|'bg'
 *   size            'sm'|'md'|'lg'  (default 'md')
 */
export default function RankingBadge({ rankingType, rankingTypeBg, iconUrl, lang = 'en', size = 'md' }) {
  if (!rankingType) return null

  const label = lang === 'bg' ? (rankingTypeBg || rankingType) : rankingType
  const src   = iconUrl || `/badges/${rankingType.toLowerCase()}.png`

  const dim = size === 'sm' ? 'w-8 h-8'  : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
  const txt = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs'  : 'text-[10px]'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <img src={src} alt={label} className={`${dim} object-contain drop-shadow-sm`} />
      <span className={`${txt} font-semibold text-center leading-tight`}
        style={{ color: RANK_COLOR[rankingType] || '#6b7280' }}>
        {label}
      </span>
    </div>
  )
}

/** Small inline version — just the icon with tooltip-style label on hover */
export function RankingIcon({ rankingType, iconUrl, size = 20 }) {
  if (!rankingType) return null
  const src = iconUrl || `/badges/${rankingType.toLowerCase()}.png`
  return (
    <img src={src} alt={rankingType} title={rankingType}
      style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }} />
  )
}

const RANK_COLOR = {
  Standard: '#6b7280',
  Bronze:   '#cd7f32',
  Silver:   '#708090',
  Gold:     '#c9a200',
  Platinum: '#4a90a4',
}
