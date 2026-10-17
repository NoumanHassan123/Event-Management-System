import { emailIdentity, getLoginErrors, getRegistrationErrors, normalizeEmail, normalizeName } from '../utils/authValidation.js'

const USERS_KEY = 'ems.users'
const SESSION_KEY = 'ems.session'

function isProfile(user) {
  return user && typeof user.id === 'string' && Boolean(user.id.trim())
    && typeof user.name === 'string' && Boolean(user.name.trim())
    && typeof user.email === 'string' && Boolean(user.email.trim())
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    if (!Array.isArray(users) || !users.every((user) => isProfile(user)
      && typeof user.salt === 'string' && user.salt.length > 0
      && typeof user.passwordHash === 'string' && /^[a-f0-9]{64}$/.test(user.passwordHash))) {
      throw new Error('Invalid accounts')
    }
    return users
  } catch {
    throw new Error('Saved accounts could not be read. Please check your browser storage.')
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error('Your browser could not save the account or session. Please enable local storage and try again.')
  }
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function startSession(account) {
  const user = { id: account.id, name: account.name, email: account.email }
  writeStorage(SESSION_KEY, user)
  return user
}

export function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (!isProfile(session)) return null
    const account = readUsers().find((user) => user.id === session.id)
    return account ? { id: account.id, name: account.name, email: account.email } : null
  } catch {
    return null
  }
}

export async function registerAccount(values = {}) {
  const errors = getRegistrationErrors(values)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const { name, email, password } = values
  const normalizedEmail = normalizeEmail(email)
  const identity = emailIdentity(normalizedEmail)
  if (readUsers().some((user) => emailIdentity(user.email) === identity)) {
    throw new Error('An account with this email already exists. Please log in.')
  }
  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(password, salt)
  // Read again after hashing so another completed registration is not overwritten.
  const users = readUsers()
  if (users.some((user) => emailIdentity(user.email) === identity)) {
    throw new Error('An account with this email already exists. Please log in.')
  }
  const account = { id: crypto.randomUUID(), name: normalizeName(name), email: normalizedEmail, salt, passwordHash }
  writeStorage(USERS_KEY, [...users, account])
  try {
    return startSession(account)
  } catch {
    throw new Error('Your account was created, but the session could not be saved. Please log in again.')
  }
}

export async function signIn(values = {}) {
  const errors = getLoginErrors(values)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const { email, password } = values
  const users = readUsers()
  const normalizedEmail = normalizeEmail(email)
  // Prefer exact addresses for legacy accounts that may have shared an alias.
  const account = users.find((user) => normalizeEmail(user.email) === normalizedEmail)
    || users.find((user) => emailIdentity(user.email) === emailIdentity(normalizedEmail))
  if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
    throw new Error('Email or password is incorrect.')
  }
  return startSession(account)
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    throw new Error('Logout could not be saved. Please try again.')
  }
}
