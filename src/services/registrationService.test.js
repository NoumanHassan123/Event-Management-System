import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import { readRegistrations, saveRegistration } from './registrationService.js'
import registrationsReducer, { loadRegistrations, registerForEvent } from '../features/registrations/registrationsSlice.js'

let storage
beforeEach(() => {
  storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
const event = { id: 'event-1', name: 'Example concert', dates: { start: { localDate: '2027-01-01' } } }

function createStore(userId = 'user-a') {
  return configureStore({ reducer: {
    auth: (state = { user: userId ? { id: userId } : null }) => state,
    registrations: registrationsReducer,
  } })
}

test('registration persists an event snapshot that can be restored', () => {
  const items = saveRegistration('user-a', { ...event, info: 'Unnecessary long description' })
  assert.equal(items.length, 1)
  assert.equal(items[0].event.id, event.id)
  assert.equal(items[0].event.info, undefined)
  assert.ok(Date.parse(items[0].registeredAt))
  assert.deepEqual(readRegistrations('user-a'), items)
})

test('duplicate registrations are rejected without changing saved data', () => {
  const items = saveRegistration('user-a', event)
  assert.throws(() => saveRegistration('user-a', event), /already registered/)
  assert.deepEqual(readRegistrations('user-a'), items)
})

test('each user has independent registrations for the same event', () => {
  saveRegistration('user-a', event)
  assert.deepEqual(readRegistrations('user-b'), [])
  saveRegistration('user-b', event)
  saveRegistration('user-a', { ...event, id: 'event-2' })
  assert.equal(readRegistrations('user-a').length, 2)
  assert.equal(readRegistrations('user-b').length, 1)
})

test('invalid events, cancelled events, missing login and damaged storage are rejected', () => {
  assert.throws(() => saveRegistration(null, event), /log in/)
  assert.throws(() => saveRegistration('user-a', {}), /valid event/)
  assert.throws(() => saveRegistration('user-a', { ...event, dates: { status: { code: 'cancelled' } } }), /cancelled/)
  storage.set('ems.registrations.user-a', 'broken-json')
  assert.throws(() => saveRegistration('user-a', event), /could not be read/)
  assert.equal(storage.get('ems.registrations.user-a'), 'broken-json')
})

test('failed storage writes do not report success', () => {
  localStorage.setItem = () => { throw new Error('Quota exceeded') }
  assert.throws(() => saveRegistration('user-a', event), /could not be saved/)
  assert.deepEqual(readRegistrations('user-a'), [])
})

test('Redux rejects guests and loading another user registrations', async () => {
  const guestStore = createStore(null)
  await assert.rejects(guestStore.dispatch(registerForEvent(event)).unwrap(), { message: /log in/ })
  const store = createStore()
  await assert.rejects(store.dispatch(loadRegistrations('user-b')).unwrap(), { message: /log in/ })
  assert.deepEqual(readRegistrations('user-a'), [])
})

test('Redux registration blocks duplicates and new store restores persisted items', async () => {
  const store = createStore()
  await store.dispatch(loadRegistrations('user-a')).unwrap()
  await store.dispatch(registerForEvent(event)).unwrap()
  await assert.rejects(store.dispatch(registerForEvent(event)).unwrap(), { message: /already registered/ })
  assert.equal(store.getState().registrations.byUser['user-a'].items.length, 1)
  const restored = createStore()
  await restored.dispatch(loadRegistrations('user-a')).unwrap()
  assert.deepEqual(restored.getState().registrations.byUser['user-a'].items, readRegistrations('user-a'))
  const otherUser = createStore('user-b')
  await otherUser.dispatch(loadRegistrations('user-b')).unwrap()
  assert.equal(otherUser.getState().registrations.byUser['user-b'].items.length, 0)
})
