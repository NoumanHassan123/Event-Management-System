import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { configureStore } from '@reduxjs/toolkit'
import { readRegistrations, saveRegistration, removeRegistration } from './registrationService.js'
import registrationsReducer, { loadRegistrations, registerForEvent, cancelRegistration } from '../features/registrations/registrationsSlice.js'

let storage
beforeEach(() => {
  storage = new Map()
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
})
const event = { id: 'event-1', name: 'Example concert', dates: { start: { localDate: '2027-01-01' } } }

test('malformed registration snapshots fail safely without overwriting saved data', () => {
  for (const invalid of [{ ...event, name: {} }, { ...event, images: {} },
    { ...event, classifications: 'invalid' }, { ...event, _embedded: { venues: {} } }]) {
    assert.throws(() => saveRegistration('user-a', invalid), /valid event/)
    const saved = JSON.stringify([{ event: invalid }])
    storage.set('ems.registrations.user-a', saved)
    assert.throws(() => readRegistrations('user-a'), /could not be read/)
    assert.equal(storage.get('ems.registrations.user-a'), saved)
    storage.delete('ems.registrations.user-a')
  }
})

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

test('cancellation persists, preserves other events and users, and allows registration again', () => {
  saveRegistration('user-a', event)
  saveRegistration('user-a', { ...event, id: 'event-2' })
  saveRegistration('user-b', event)
  const updated = removeRegistration('user-a', event.id)
  assert.deepEqual(updated.map((item) => item.event.id), ['event-2'])
  assert.deepEqual(readRegistrations('user-a'), updated)
  assert.equal(readRegistrations('user-b').length, 1)
  assert.throws(() => removeRegistration('user-a', event.id), /could not be found/)
  assert.equal(saveRegistration('user-a', event).length, 2)
})

test('completed events cannot be registered or cancelled', () => {
  const past = { ...event, dates: { start: { dateTime: '2020-01-01T12:00:00Z' } } }
  assert.throws(() => saveRegistration('user-a', past), /closed/)
  storage.set('ems.registrations.user-a', JSON.stringify([{ event: past }]))
  assert.throws(() => removeRegistration('user-a', past.id), /completed events/)
  assert.equal(readRegistrations('user-a').length, 1)
})

test('ongoing events retain their registration but cannot accept new registration or cancellation', () => {
  const ongoing = { ...event, dates: { start: { dateTime: new Date(Date.now() - 1800000).toISOString() }, end: { dateTime: new Date(Date.now() + 1800000).toISOString() } } }
  assert.throws(() => saveRegistration('user-a', ongoing), /already started/)
  storage.set('ems.registrations.user-a', JSON.stringify([{ event: ongoing }]))
  const saved = storage.get('ems.registrations.user-a')
  assert.throws(() => removeRegistration('user-a', ongoing.id), /ongoing or completed/)
  assert.equal(storage.get('ems.registrations.user-a'), saved)
})

test('failed cancellation leaves persisted registrations unchanged', () => {
  const items = saveRegistration('user-a', event)
  localStorage.setItem = () => { throw new Error('Storage blocked') }
  assert.throws(() => removeRegistration('user-a', event.id), /cancellation could not be saved/)
  assert.deepEqual(readRegistrations('user-a'), items)
})

test('Redux cancellation updates current user, rejects guests and restores removal on reload', async () => {
  const store = createStore()
  await store.dispatch(registerForEvent(event)).unwrap()
  await store.dispatch(cancelRegistration(event.id)).unwrap()
  assert.deepEqual(store.getState().registrations.byUser['user-a'].items, [])
  const restored = createStore()
  await restored.dispatch(loadRegistrations('user-a')).unwrap()
  assert.deepEqual(restored.getState().registrations.byUser['user-a'].items, [])
  const guest = createStore(null)
  await assert.rejects(guest.dispatch(cancelRegistration(event.id)).unwrap(), { message: /log in/ })
})
