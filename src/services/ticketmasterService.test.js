import assert from 'node:assert/strict'
import { test, afterEach } from 'node:test'
import { getEvents } from './ticketmasterService.js'
import eventsReducer, { fetchEvents } from '../features/events/eventsSlice.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('missing key prevents a network request', async () => {
  globalThis.fetch = () => { throw new Error('Should not fetch') }
  await assert.rejects(getEvents({ apiKey: '' }), /not configured/)
})

test('requests upcoming events in date order and passes abort signal', async () => {
  const controller = new AbortController()
  const events = [{ id: 'event-1', name: 'Example event' }]
  globalThis.fetch = async (input, options) => {
    const url = new URL(input)
    assert.equal(url.origin, 'https://app.ticketmaster.com')
    assert.equal(url.pathname, '/discovery/v2/events.json')
    assert.equal(url.searchParams.get('apikey'), 'test-key')
    assert.equal(url.searchParams.get('sort'), 'date,asc')
    assert.equal(url.searchParams.get('size'), '20')
    assert.match(url.searchParams.get('startDateTime'), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    assert.equal(options.signal, controller.signal)
    return { ok: true, json: async () => ({ _embedded: { events } }) }
  }
  assert.deepEqual(await getEvents({ apiKey: 'test-key', signal: controller.signal }), events)
})

test('valid empty results return an empty list', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ page: { totalElements: 0 } }) })
  assert.deepEqual(await getEvents({ apiKey: 'test-key' }), [])
})

test('HTTP errors produce useful messages without exposing credentials', async () => {
  for (const [status, message] of [[401, /authorize/], [403, /authorize/], [429, /busy/], [500, /could not be loaded/]]) {
    globalThis.fetch = async () => ({ ok: false, status })
    await assert.rejects(getEvents({ apiKey: 'test-key' }), (error) => {
      assert.match(error.message, message)
      assert.equal(error.message.includes('test-key'), false)
      return true
    })
  }
})

test('network and malformed responses fail clearly', async () => {
  globalThis.fetch = async () => { throw new TypeError('Network failed') }
  await assert.rejects(getEvents({ apiKey: 'test-key' }), /Unable to connect/)
  globalThis.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError() } })
  await assert.rejects(getEvents({ apiKey: 'test-key' }), /unreadable/)
  for (const data of [null, {}, { _embedded: { events: {} } }, { _embedded: { events: [{}] } }]) {
    globalThis.fetch = async () => ({ ok: true, json: async () => data })
    await assert.rejects(getEvents({ apiKey: 'test-key' }), /unexpected/)
  }
})

test('Redux handles loading, success, and retry after errors', () => {
  const initial = eventsReducer(undefined, { type: 'init' })
  const pending = eventsReducer(initial, fetchEvents.pending('request-1'))
  assert.equal(pending.status, 'loading')
  const failure = eventsReducer(pending, fetchEvents.rejected(new Error('Connection failed'), 'request-1'))
  assert.equal(failure.status, 'failed')
  assert.equal(failure.error, 'Connection failed')
  const retry = eventsReducer(failure, fetchEvents.pending('request-2'))
  assert.equal(retry.error, null)
  const events = [{ id: '1', name: 'Example' }]
  const success = eventsReducer(retry, fetchEvents.fulfilled(events, 'request-2'))
  assert.equal(success.status, 'succeeded')
  assert.deepEqual(success.items, events)
})
