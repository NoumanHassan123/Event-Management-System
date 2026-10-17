import assert from 'node:assert/strict'
import { test, beforeEach } from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import { registerAccount, signIn, signOut, readSession } from './authService.js'
import authReducer, { register, login, logout } from '../features/auth/authSlice.js'

let storage
beforeEach(() => {
  storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  }
})
const account = { name: ' Test User ', email: ' Test@Gmail.com ', password: 'test-password-123' }

test('registration normalizes profile and persists session without password credentials', async () => {
  const user = await registerAccount(account)
  assert.equal(user.name, 'Test User')
  assert.equal(user.email, 'test@gmail.com')
  assert.deepEqual(readSession(), user)
  assert.equal(JSON.stringify([...storage.values()]).includes(account.password), false)
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name'])
  const saved = JSON.parse(storage.get('ems.users'))[0]
  assert.match(saved.passwordHash, /^[a-f0-9]{64}$/)
})

test('duplicate emails and incorrect credentials are rejected', async () => {
  await registerAccount(account)
  signOut()
  await assert.rejects(registerAccount({ ...account, email: 'test@gmail.com' }), /already exists/)
  await assert.rejects(signIn({ email: account.email, password: 'wrong' }), /incorrect/)
  await assert.rejects(signIn({ email: 'missing@gmail.com', password: account.password }), /incorrect/)
  assert.equal(readSession(), null)
  assert.equal(JSON.parse(storage.get('ems.users')).length, 1)
  const user = await signIn(account)
  assert.equal(user.email, 'test@gmail.com')
  signOut()
  assert.equal(readSession(), null)
})

test('invalid registration and corrupt storage fail without overwriting accounts', async () => {
  await assert.rejects(registerAccount({ ...account, name: ' ' }), /Enter a name/)
  await assert.rejects(registerAccount({ ...account, email: 'invalid' }), /valid email/)
  await assert.rejects(registerAccount({ ...account, password: 'short' }), /8 to 128/)
  storage.set('ems.users', 'broken-json')
  await assert.rejects(registerAccount(account), /could not be read/)
  assert.equal(storage.get('ems.users'), 'broken-json')
  storage.set('ems.session', 'broken-json')
  assert.equal(readSession(), null)
})

test('storage write failures surface errors', async () => {
  localStorage.setItem = () => { throw new Error('Storage disabled') }
  await assert.rejects(registerAccount(account), /could not save/)
  assert.equal(readSession(), null)
})

test('Redux updates for register, logout and login, and preserves state on failed login', async () => {
  const store = configureStore({ reducer: { auth: authReducer } })
  const user = await store.dispatch(register(account)).unwrap()
  assert.deepEqual(store.getState().auth.user, user)
  await store.dispatch(logout()).unwrap()
  assert.equal(store.getState().auth.user, null)
  await assert.rejects(store.dispatch(login({ ...account, password: 'wrong' })).unwrap())
  assert.equal(store.getState().auth.user, null)
  await store.dispatch(login(account)).unwrap()
  assert.deepEqual(store.getState().auth.user, user)
})

test('Gmail dotted and tagged aliases cannot create duplicate accounts and can log in', async () => {
  const user = await registerAccount({ ...account, email: 'test.user@gmail.com' })
  signOut()
  for (const email of ['TESTUSER@gmail.com', 'test.user+events@gmail.com', 't.e.s.t.u.s.e.r@gmail.com']) {
    await assert.rejects(registerAccount({ ...account, email }), /already exists/)
    assert.equal((await signIn({ email, password: account.password })).id, user.id)
    signOut()
  }
  assert.equal(JSON.parse(storage.get('ems.users')).length, 1)
})

test('new registrations reject other domains, domain spoofing and malformed Gmail addresses', async () => {
  for (const email of ['user@yahoo.com', 'user@googlemail.com', 'user@gmail.com.evil.com',
    'user@gmail.com@evil.com', '.user@gmail.com', 'user.@gmail.com', 'user..name@gmail.com',
    'user name@gmail.com', 'user+@gmail.com', '@gmail.com', 'user@gmail.com\n.evil', 'a'.repeat(65) + '@gmail.com']) {
    await assert.rejects(registerAccount({ ...account, email }), /@gmail.com/, email)
  }
  assert.equal(storage.size, 0)
})

test('new passwords require a special character and reject unsafe whitespace and excessive length', async () => {
  for (const password of ['abcdefgh123', '        ', 'Password1! ', ' Password1!', 'Password\u200b1!',
    'Password1!\n', '!!!!!!!!', 'a'.repeat(129) + '!']) {
    await assert.rejects(registerAccount({ ...account, password }), /password|characters|special|letter/i)
  }
  const user = await registerAccount({ ...account, password: 'Good pass1!' })
  assert.equal((await signIn({ email: account.email, password: 'Good pass1!' })).id, user.id)
})

test('missing and non-string inputs fail with validation messages rather than TypeErrors', async () => {
  for (const values of [undefined, null, {}, { name: 123, email: [], password: {} }]) {
    await assert.rejects(registerAccount(values), (error) => error instanceof Error && error.name !== 'TypeError')
    await assert.rejects(signIn(values), (error) => error instanceof Error && error.name !== 'TypeError')
  }
})

test('names are normalized and support Unicode while invalid names are rejected', async () => {
  for (const name of ['123456', '---', '\u200b', 'A\u200bB', 'A'.repeat(81)]) {
    await assert.rejects(registerAccount({ ...account, name }), /name/)
  }
  const user = await registerAccount({ ...account, name: '  Jos\u00e9   O\u2019Connor  ' })
  assert.equal(user.name, 'Jos\u00e9 O\u2019Connor')
})

test('simultaneous duplicate registration attempts create only one account', async () => {
  const results = await Promise.allSettled([
    registerAccount(account), registerAccount({ ...account, email: 't.e.s.t+events@gmail.com' }),
  ])
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(JSON.parse(storage.get('ems.users')).length, 1)
})

test('malformed saved profiles and hashes fail without overwriting data', async () => {
  for (const users of [[null], [{ id: '', name: 'Test', email: 'test@gmail.com', salt: 'salt', passwordHash: 'broken' }]]) {
    const saved = JSON.stringify(users)
    storage.set('ems.users', saved)
    await assert.rejects(registerAccount(account), /could not be read/)
    assert.equal(storage.get('ems.users'), saved)
    assert.equal(readSession(), null)
  }
})

test('legacy non-Gmail accounts remain accessible', async () => {
  const user = await registerAccount(account)
  const users = JSON.parse(storage.get('ems.users'))
  users[0].email = 'legacy@example.com'
  storage.set('ems.users', JSON.stringify(users))
  signOut()
  assert.equal((await signIn({ email: 'legacy@example.com', password: account.password })).id, user.id)
})

test('session write failure reports account creation and allows retrying login', async () => {
  const write = localStorage.setItem
  localStorage.setItem = (key, value) => {
    if (key === 'ems.session') throw new Error('Storage full')
    write(key, value)
  }
  await assert.rejects(registerAccount(account), /account was created/)
  assert.equal(JSON.parse(storage.get('ems.users')).length, 1)
  localStorage.setItem = write
  assert.equal((await signIn(account)).email, 'test@gmail.com')
})
