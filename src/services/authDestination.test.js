import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAuthDestination } from '../utils/authDestination.js'

test('login and signup retain internal event and registrations destinations', () => {
  const event = { pathname: '/events/event-123', search: '?source=search', hash: '#registration' }
  assert.deepEqual(getAuthDestination(event), event)
  assert.deepEqual(getAuthDestination({ pathname: '/my-events' }), {
    pathname: '/my-events', search: '', hash: '',
  })
})

test('external, missing and unexpected destinations fall back to events', () => {
  for (const from of [undefined, null, {}, { pathname: 'https://example.com' },
    { pathname: '//example.com' }, { pathname: '/login' }, { pathname: '/events/' },
    { pathname: '/events/a/extra' }]) {
    assert.equal(getAuthDestination(from), '/events')
  }
})
