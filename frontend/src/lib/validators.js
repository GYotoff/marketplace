/**
 * Shared field validators for GiveForward.
 * Every function returns null (valid) or a bilingual error string.
 *
 * To add a new phone field in future:
 *   import { validatePhone } from '@/lib/validators'
 *   const err = validatePhone(value, lang)
 *   if (err) { showError(err); return }
 */

// E.164-style: optional leading +, then 7–15 digits, no spaces/dashes
export const PHONE_RE = /^\+?[0-9]{7,15}$/

export function validatePhone(val, lang = 'en') {
  if (!val || val.trim() === '') return null   // optional field
  if (!PHONE_RE.test(val.trim())) {
    return lang === 'bg'
      ? 'Невалиден телефонен номер. Въведете 7–15 цифри, с или без водещо „+".'
      : 'Invalid phone number. Enter 7–15 digits, optionally starting with "+".'
  }
  return null
}

// UIC / Булстат — already used across org/corp pages
export const UIC_RE = /^(?:\d{9}|\d{13})$/

export function validateUIC(val, lang = 'en') {
  if (!val || val.trim() === '') return null
  if (!UIC_RE.test(val.trim())) {
    return lang === 'bg'
      ? 'Невалиден ЕИК/Булстат. Трябва да съдържа 9 или 13 цифри.'
      : 'Invalid UIC/Bulstat. Must be exactly 9 or 13 digits.'
  }
  return null
}
