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
const account = { name: ' Test User ', email: ' Test@Example.com ', password: 'test-password-123' }

test('registration normalizes profile and persists session without password credentials', async () => {
  const user = await registerAccount(account)
  assert.equal(user.name, 'Test User')
  assert.equal(user.email, 'test@example.com')
  assert.deepEqual(readSession(), user)
  assert.equal(JSON.stringify([...storage.values()]).includes(account.password), false)
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name'])
  const saved = JSON.parse(storage.get('ems.users'))[0]
  assert.match(saved.passwordHash, /^[a-f0-9]{64}$/)
})

test('duplicate emails and incorrect credentials are rejected', async () => {
  await registerAccount(account)
  signOut()
  await assert.rejects(registerAccount({ ...account, email: 'test@example.com' }), /already exists/)
  await assert.rejects(signIn({ email: account.email, password: 'wrong' }), /incorrect/)
  await assert.rejects(signIn({ email: 'missing@example.com', password: account.password }), /incorrect/)
  assert.equal(readSession(), null)
  assert.equal(JSON.parse(storage.get('ems.users')).length, 1)
  const user = await signIn(account)
  assert.equal(user.email, 'test@example.com')
  signOut()
  assert.equal(readSession(), null)
})

test('invalid registration and corrupt storage fail without overwriting accounts', async () => {
  await assert.rejects(registerAccount({ ...account, name: ' ' }), /Enter a name/)
  await assert.rejects(registerAccount({ ...account, email: 'invalid' }), /valid email/)
  await assert.rejects(registerAccount({ ...account, password: 'short' }), /8 characters/)
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
