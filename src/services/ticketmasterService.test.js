import assert from 'node:assert/strict'
import { test, afterEach } from 'node:test'
import { getEvents, getEventsPage, getEventDetails } from './ticketmasterService.js'
import eventsReducer, { fetchEvents, fetchEventDetails } from '../features/events/eventsSlice.js'
import { normalizeEventFilters } from '../utils/eventFilters.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('malformed filter values cannot cause trim TypeErrors', () => {
  const empty = { keyword: '', category: '', city: '', countryCode: '' }
  for (const filters of [null, 123, [], { keyword: {}, city: 123, countryCode: [] }]) {
    assert.deepEqual(normalizeEventFilters(filters), empty)
  }
})

test('explicitly null event data is an error rather than an empty search result', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ _embedded: { events: null }, page: { totalElements: 12 } }) })
  await assert.rejects(getEvents({ apiKey: 'test-key' }), /unexpected response/)
})

test('search combines normalized keyword, category, city, and country without query injection', async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(input)
    assert.equal(url.searchParams.get('keyword'), 'Jazz & Blues?apikey=other')
    assert.equal(url.searchParams.get('classificationName'), 'Music')
    assert.equal(url.searchParams.get('city'), 'London')
    assert.equal(url.searchParams.get('countryCode'), 'GB')
    assert.equal(url.searchParams.get('apikey'), 'test-key')
    return { ok: true, json: async () => ({ page: { totalElements: 0 } }) }
  }
  assert.deepEqual(await getEvents({ apiKey: 'test-key', filters: {
    keyword: ' Jazz & Blues?apikey=other ', category: 'Music', city: ' London ', countryCode: ' gb ',
  } }), [])
})

test('cleared filters omit optional query parameters and invalid country is rejected', async () => {
  globalThis.fetch = async (input) => {
    const params = new URL(input).searchParams
    for (const field of ['keyword', 'classificationName', 'city', 'countryCode']) assert.equal(params.has(field), false)
    return { ok: true, json: async () => ({ page: { totalElements: 0 } }) }
  }
  await getEvents({ apiKey: 'test-key', filters: { keyword: ' ', city: ' ', countryCode: ' ', category: 'invalid' } })
  await assert.rejects(getEvents({ apiKey: 'test-key', filters: { countryCode: 'USA' } }), /two-letter/)
})

test('new search ignores older success and failure and clearing resets applied filters', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('old', { keyword: 'old' }))
  state = eventsReducer(state, fetchEvents.pending('new', { city: ' London ', countryCode: 'gb' }))
  assert.equal(state.filters.city, 'London')
  assert.equal(state.filters.countryCode, 'GB')
  state = eventsReducer(state, fetchEvents.fulfilled([{ id: 'old', name: 'Old event' }], 'old'))
  assert.equal(state.status, 'loading')
  assert.deepEqual(state.items, [])
  state = eventsReducer(state, fetchEvents.rejected(new Error('Old error'), 'old'))
  assert.equal(state.error, null)
  const items = [{ id: 'new', name: 'New event' }]
  state = eventsReducer(state, fetchEvents.fulfilled({ events: items }, 'new'))
  assert.deepEqual(state.items, items)
  state = eventsReducer(state, fetchEvents.pending('clear', {}))
  assert.deepEqual(state.filters, { keyword: '', category: '', city: '', countryCode: '' })
  assert.deepEqual(state.items, [])
})

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
  const success = eventsReducer(retry, fetchEvents.fulfilled({ events }, 'request-2'))
  assert.equal(success.status, 'succeeded')
  assert.deepEqual(success.items, events)
})

test('page requests keep filters and cutoff, and expose capped pagination metadata', async () => {
  const cutoff = '2026-10-17T12:00:00Z'
  const events = [{ id: 'page-two', name: 'Second page event' }]
  globalThis.fetch = async (input) => {
    const params = new URL(input).searchParams
    assert.equal(params.get('page'), '1')
    assert.equal(params.get('size'), '20')
    assert.equal(params.get('keyword'), 'jazz')
    assert.equal(params.get('countryCode'), 'GB')
    assert.equal(params.get('startDateTime'), cutoff)
    return { ok: true, json: async () => ({ _embedded: { events }, page: { number: 1, totalPages: 200, totalElements: 4000 } }) }
  }
  const result = await getEventsPage({ apiKey: 'test-key', page: 1,
    filters: { keyword: 'jazz', countryCode: 'GB' }, startDateTime: cutoff })
  assert.deepEqual(result.events, events)
  assert.equal(result.startDateTime, cutoff)
  assert.deepEqual(result.pagination, { number: 1, totalPages: 50, totalElements: 4000, limited: true })
})

test('invalid page indexes fail before fetching and mismatched response pages fail clearly', async () => {
  globalThis.fetch = () => { throw new Error('Should not fetch') }
  for (const page of [-1, 50, 1.5, '1']) {
    await assert.rejects(getEventsPage({ apiKey: 'test-key', page }), /page is unavailable/)
  }
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ page: { number: 0, totalPages: 2, totalElements: 21 } }) })
  await assert.rejects(getEventsPage({ apiKey: 'test-key', page: 1 }), /pagination data/)
})

test('last page and empty searches expose correct pagination', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({
    _embedded: { events: [{ id: 'last', name: 'Last event' }] },
    page: { number: 1, totalPages: 2, totalElements: 21 },
  }) })
  const last = await getEventsPage({ apiKey: 'test-key', page: 1 })
  assert.equal(last.pagination.totalPages, 2)
  assert.equal(last.pagination.limited, false)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ page: { number: 0, totalPages: 0, totalElements: 0 } }) })
  const empty = await getEventsPage({ apiKey: 'test-key' })
  assert.deepEqual(empty.events, [])
  assert.equal(empty.pagination.totalPages, 0)
})

test('Redux tracks requested page, preserves filters, ignores stale page responses, and resets on new search', () => {
  let state = eventsReducer(undefined, fetchEvents.pending('first', { keyword: 'jazz' }))
  const first = { events: [{ id: 'first', name: 'First' }], startDateTime: '2026-10-17T12:00:00Z',
    pagination: { number: 0, totalPages: 3, totalElements: 45, limited: false } }
  state = eventsReducer(state, fetchEvents.fulfilled(first, 'first'))
  state = eventsReducer(state, fetchEvents.pending('second', { keyword: 'jazz', page: 1 }))
  assert.equal(state.page, 1)
  assert.equal(state.startDateTime, first.startDateTime)
  assert.equal(state.filters.keyword, 'jazz')
  state = eventsReducer(state, fetchEvents.fulfilled(first, 'first'))
  assert.equal(state.status, 'loading')
  assert.deepEqual(state.items, [])
  state = eventsReducer(state, fetchEvents.rejected(new Error('Network failed'), 'second'))
  assert.equal(state.page, 1)
  assert.equal(state.status, 'failed')
  state = eventsReducer(state, fetchEvents.pending('search', { city: 'London' }))
  assert.equal(state.page, 0)
  assert.equal(state.startDateTime, null)
  assert.equal(state.filters.keyword, '')
  assert.equal(state.filters.city, 'London')
})
