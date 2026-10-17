import assert from 'node:assert/strict'
import { test } from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, { register, login, logout } from '../features/auth/authSlice.js'
import registrationsReducer, { registerForEvent, cancelRegistration, loadRegistrations } from '../features/registrations/registrationsSlice.js'
import { readSession } from './authService.js'

test('account creation, registration, refresh, logout, user isolation, login and cancellation work together', async () => {
  const data = new Map()
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
  const freshStore = () => configureStore({
    reducer: { auth: authReducer, registrations: registrationsReducer },
    preloadedState: { auth: { user: readSession() } },
  })
  let store = freshStore()
  const firstAccount = { name: 'QA First', email: 'first@example.test', password: 'demo-password-123' }
  const user = await store.dispatch(register(firstAccount)).unwrap()
  const future = new Date(Date.now() + 86400000 * 30).toISOString()
  const event = { id: 'qa-event', name: 'QA Event', dates: { start: { dateTime: future } } }
  await store.dispatch(registerForEvent(event)).unwrap()
  await assert.rejects(store.dispatch(registerForEvent(event)).unwrap(), { message: /already registered/ })
  store = freshStore()
  assert.equal(store.getState().auth.user.id, user.id)
  await store.dispatch(loadRegistrations(user.id)).unwrap()
  assert.equal(store.getState().registrations.byUser[user.id].items.length, 1)
  await store.dispatch(logout()).unwrap()
  assert.equal(readSession(), null)
  await assert.rejects(store.dispatch(registerForEvent(event)).unwrap(), { message: /log in/ })
  const secondUser = await store.dispatch(register({ ...firstAccount, email: 'second@example.test' })).unwrap()
  await store.dispatch(loadRegistrations(secondUser.id)).unwrap()
  assert.deepEqual(store.getState().registrations.byUser[secondUser.id].items, [])
  await assert.rejects(store.dispatch(cancelRegistration(event.id)).unwrap(), { message: /could not be found/ })
  await store.dispatch(logout()).unwrap()
  await assert.rejects(store.dispatch(login({ ...firstAccount, password: 'wrong-password' })).unwrap(), { message: /incorrect/ })
  assert.equal(store.getState().auth.user, null)
  await store.dispatch(login(firstAccount)).unwrap()
  await store.dispatch(cancelRegistration(event.id)).unwrap()
  store = freshStore()
  await store.dispatch(loadRegistrations(user.id)).unwrap()
  assert.deepEqual(store.getState().registrations.byUser[user.id].items, [])
  await store.dispatch(registerForEvent(event)).unwrap()
  assert.equal(store.getState().registrations.byUser[user.id].items.length, 1)
})
