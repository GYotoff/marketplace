/**
 * CountryCitySelector
 *
 * Renders paired Country (EN + BG) and City (EN + BG) selectors/inputs.
 * - When country = Bulgaria: city = dropdown of Bulgarian cities
 * - When country = other:    city = free-text input
 * - Selecting a country in one language auto-fills the other language
 * - Selecting a city in one language auto-fills the other language (Bulgaria only)
 * - Both country and city are MANDATORY (validated on call)
 *
 * Props:
 *   countryEN   {string}   — current EN country value
 *   countryBG   {string}   — current BG country value
 *   cityEN      {string}   — current EN city value
 *   cityBG      {string}   — current BG city value
 *   onChange    {function} — called with ({ countryEN, countryBG, cityEN, cityBG })
 *   lang        {string}   — 'en' | 'bg'   (UI display language)
 *   errors      {object}   — { country?: string, city?: string } (validation messages)
 */

import {
  COUNTRIES_EN, COUNTRIES_BG,
  CITIES_EN, CITIES_BG,
  BULGARIA_EN, BULGARIA_BG,
  isBulgaria, pairCountry, pairCityEN, pairCityBG,
} from '@/lib/geodata/index.js'

export default function CountryCitySelector({
  countryEN = '', countryBG = '',
  cityEN = '',    cityBG = '',
  onChange,
  lang = 'en',
  errors = {},
}) {
  const isBG_country = isBulgaria(countryEN) || isBulgaria(countryBG)

  // ── Country EN select ──────────────────────────────────────────────────────
  const handleCountryEN = (val) => {
    const paired = pairCountry(val) ?? countryBG
    // When country changes, reset city
    onChange({ countryEN: val, countryBG: paired, cityEN: '', cityBG: '' })
  }

  // ── Country BG select ──────────────────────────────────────────────────────
  const handleCountryBG = (val) => {
    const paired = pairCountry(val) ?? countryEN
    onChange({ countryEN: paired, countryBG: val, cityEN: '', cityBG: '' })
  }

  // ── City EN ────────────────────────────────────────────────────────────────
  const handleCityEN = (val) => {
    if (isBG_country) {
      const paired = pairCityEN(val) ?? cityBG
      onChange({ countryEN, countryBG, cityEN: val, cityBG: paired })
    } else {
      onChange({ countryEN, countryBG, cityEN: val, cityBG })
    }
  }

  // ── City BG ────────────────────────────────────────────────────────────────
  const handleCityBG = (val) => {
    if (isBG_country) {
      const paired = pairCityBG(val) ?? cityEN
      onChange({ countryEN, countryBG, cityEN: paired, cityBG: val })
    } else {
      onChange({ countryEN, countryBG, cityEN, cityBG: val })
    }
  }

  // ── Labels ─────────────────────────────────────────────────────────────────
  const L = {
    country_en:  lang === 'bg' ? 'Държава (EN)' : 'Country (EN)',
    country_bg:  lang === 'bg' ? 'Държава (BG)' : 'Country (BG)',
    city_en:     lang === 'bg' ? 'Град (EN)'    : 'City (EN)',
    city_bg:     lang === 'bg' ? 'Град (BG)'    : 'City (BG)',
    required:    lang === 'bg' ? '*'             : '*',
    sel_country: lang === 'bg' ? 'Изберете държава' : 'Select country',
    sel_city:    lang === 'bg' ? 'Изберете град'    : 'Select city',
    city_ph_en:  lang === 'bg' ? 'напр. Берлин'     : 'e.g. Berlin',
    city_ph_bg:  lang === 'bg' ? 'напр. Берлин'     : 'e.g. Берлин',
    select_country_first: lang === 'bg' ? 'Първо изберете държава' : 'Select a country first',
  }

  const inputClass = (err) =>
    `input${err ? ' border-red-400 focus:ring-red-300' : ''}`

  return (
    <div className="flex flex-col gap-4">
      {/* ── Country row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Country EN */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
            {L.country_en} <span className="text-red-400">{L.required}</span>
          </label>
          <select
            className={inputClass(errors.country)}
            value={countryEN}
            onChange={e => handleCountryEN(e.target.value)}
          >
            <option value="">{L.sel_country}</option>
            {COUNTRIES_EN.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.country && (
            <p className="text-xs text-red-500 mt-1">{errors.country}</p>
          )}
        </div>

        {/* Country BG */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
            {L.country_bg} <span className="text-red-400">{L.required}</span>
          </label>
          <select
            className={inputClass(errors.country)}
            value={countryBG}
            onChange={e => handleCountryBG(e.target.value)}
          >
            <option value="">{L.sel_country}</option>
            {COUNTRIES_BG.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── City row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* City EN */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
            {L.city_en} <span className="text-red-400">{L.required}</span>
          </label>
          {!countryEN && !countryBG ? (
            <input type="text" className="input opacity-50 cursor-not-allowed"
              disabled placeholder={L.select_country_first} />
          ) : isBG_country ? (
            <select
              className={inputClass(errors.city)}
              value={cityEN}
              onChange={e => handleCityEN(e.target.value)}
            >
              <option value="">{L.sel_city}</option>
              {CITIES_EN.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              type="text"
              className={inputClass(errors.city)}
              placeholder={L.city_ph_en}
              value={cityEN}
              onChange={e => handleCityEN(e.target.value)}
            />
          )}
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>

        {/* City BG */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
            {L.city_bg} <span className="text-red-400">{L.required}</span>
          </label>
          {!countryEN && !countryBG ? (
            <input type="text" className="input opacity-50 cursor-not-allowed"
              disabled placeholder={L.select_country_first} />
          ) : isBG_country ? (
            <select
              className={inputClass(errors.city)}
              value={cityBG}
              onChange={e => handleCityBG(e.target.value)}
            >
              <option value="">{L.sel_city}</option>
              {CITIES_BG.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              type="text"
              className={inputClass(errors.city)}
              placeholder={L.city_ph_bg}
              value={cityBG}
              onChange={e => handleCityBG(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Validate country+city selection.
 * Returns { country?: string, city?: string } — empty object means valid.
 */
export function validateCountryCity({ countryEN, countryBG, cityEN, cityBG }, lang = 'en') {
  const errs = {}
  if (!countryEN && !countryBG) {
    errs.country = lang === 'bg'
      ? 'Държавата е задължителна.'
      : 'Country is required.'
  }
  if (!cityEN && !cityBG) {
    errs.city = lang === 'bg'
      ? 'Градът е задължителен.'
      : 'City is required.'
  }
  return errs
}
