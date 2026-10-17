const GMAIL_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9._-]+)?@gmail\.com$/i
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Intentional: reject invisible/control characters rather than accepting hidden input.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function emailIdentity(email) {
  const normalized = normalizeEmail(email)
  if (!GMAIL_PATTERN.test(normalized)) return normalized
  return `${normalized.split('@')[0].split('+')[0].replaceAll('.', '')}@gmail.com`
}

export function normalizeName(name) {
  return typeof name === 'string' ? name.trim().replace(/\s+/gu, ' ') : ''
}

export function getRegistrationErrors(values = {}) {
  const errors = {}
  const { name, email, password, confirmPassword } = values || {}
  const normalizedName = normalizeName(name)
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedName || !/\p{L}/u.test(normalizedName) || CONTROL_CHARACTERS.test(name || '')) {
    errors.name = 'Enter a name containing letters, without hidden or control characters.'
  } else if (normalizedName.length > 80) {
    errors.name = 'Your name must be 80 characters or fewer.'
  }
  if (!GMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254
    || normalizedEmail.split('@')[0].length > 64) {
    errors.email = 'Enter a valid email ending in @gmail.com.'
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    errors.password = 'Use 8 to 128 characters for your password.'
  } else if (password !== password.trim() || CONTROL_CHARACTERS.test(password)) {
    errors.password = 'Your password cannot start or end with spaces or contain hidden/control characters.'
  } else if (!/[\p{P}\p{S}]/u.test(password)) {
    errors.password = 'Include at least one special character, such as !, @, #, or $.'
  } else if (!/[\p{L}\p{N}]/u.test(password)) {
    errors.password = 'Include a letter or number as well as a special character.'
  }
  if (confirmPassword !== undefined && (typeof confirmPassword !== 'string' || password !== confirmPassword)) {
    errors.confirmPassword = 'Passwords must match.'
  }
  return errors
}

export function getLoginErrors(values = {}) {
  const { email, password } = values || {}
  const errors = {}
  // Existing accounts remain accessible; new registration is Gmail-only.
  const normalized = normalizeEmail(email)
  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254 || CONTROL_CHARACTERS.test(normalized)) {
    errors.email = 'Enter a valid email address.'
  }
  // Do not apply new signup strength rules to an existing account's password.
  if (typeof password !== 'string' || !password.length || password.length > 128) {
    errors.password = 'Enter your password (up to 128 characters).'
  }
  return errors
}
