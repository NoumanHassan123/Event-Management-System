import assert from 'node:assert/strict'
import { test, afterEach } from 'node:test'
import { getEvents, getEventDetails } from './ticketmasterService.js'
import eventsReducer, { fetchEvents, fetchEventDetails } from '../features/events/eventsSlice.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('event details request encodes ID and passes signal', async () => {
  const id = 'example/id?test'
  const event = { id, name: 'Example event', dates: { start: { localDate: '2026-12-01' } } }
  const controller = new AbortController()
  globalThis.fetch = async (input, options) => {
    const url = new URL(input)
    assert.equal(url.pathname, `/discovery/v2/events/${encodeURIComponent(id)}.json`)
    assert.equal(url.searchParams.get('apikey'), 'test-key')
    assert.equal(url.searchParams.has('startDateTime'), false)
    assert.equal(options.signal, controller.signal)
    return { ok: true, json: async () => event }
  }
  assert.deepEqual(await getEventDetails(id, { apiKey: 'test-key', signal: controller.signal }), event)
})

test('event details handle missing IDs, not found, and malformed data', async () => {
  await assert.rejects(getEventDetails(''), /event ID is required/)
  globalThis.fetch = async () => ({ ok: false, status: 404 })
  await assert.rejects(getEventDetails('missing', { apiKey: 'test-key' }), /could not be found/)
  for (const data of [null, {}, { id: 'other', name: 'Wrong event' }, { id: 'example' }]) {
    globalThis.fetch = async () => ({ ok: true, json: async () => data })
    await assert.rejects(getEventDetails('example', { apiKey: 'test-key' }), /unexpected event details/)
  }
})

test('details for different routes remain separate when requests resolve out of order', () => {
  let state = eventsReducer(undefined, fetchEventDetails.pending('request-a', 'event-a'))
  state = eventsReducer(state, fetchEventDetails.pending('request-b', 'event-b'))
  const eventB = { id: 'event-b', name: 'Event B' }
  state = eventsReducer(state, fetchEventDetails.fulfilled(eventB, 'request-b', 'event-b'))
  state = eventsReducer(state, fetchEventDetails.rejected(new Error('Not found'), 'request-a', 'event-a'))
  assert.equal(state.details['event-a'].status, 'failed')
  assert.equal(state.details['event-a'].error, 'Not found')
  assert.deepEqual(state.details['event-b'].event, eventB)
  assert.equal(state.details['event-b'].status, 'succeeded')
  state = eventsReducer(state, fetchEventDetails.pending('retry-a', 'event-a'))
  assert.equal(state.details['event-a'].error, null)
  assert.equal(state.details['event-a'].status, 'loading')
})

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
