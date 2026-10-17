import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getEventGroup } from '../utils/eventSchedule.js'
import { getEventScheduleLabels } from '../utils/eventDisplay.js'

const now = Date.parse('2026-10-17T12:00:00Z')

test('unconfirmed dates never display a stale time as confirmed', () => {
  for (const flag of ['dateTBA', 'dateTBD']) {
    const labels = getEventScheduleLabels({ dates: { start: {
      localDate: '2026-10-17', localTime: '19:00:00', [flag]: true,
    } } })
    assert.equal(labels.date, 'Date to be announced')
    assert.equal(labels.time, 'Time to be announced')
  }
})

test('confirmed schedules show venue time while unknown times have an explicit fallback', () => {
  assert.deepEqual(getEventScheduleLabels({ dates: { start: { localDate: '2026-10-17', localTime: '19:30:00' } } }), {
    date: '2026-10-17', time: '19:30 (venue local time)',
  })
  for (const flag of ['timeTBA', 'noSpecificTime']) {
    assert.equal(getEventScheduleLabels({ dates: { start: { localDate: '2026-10-17', localTime: '00:00:00', [flag]: true } } }).time, 'Time to be announced')
  }
  assert.equal(getEventScheduleLabels({}).date, 'Date to be announced')
})

test('known end timestamps take precedence and exact boundary is completed', () => {
  const event = { dates: { start: { dateTime: '2026-10-17T11:00:00Z' }, end: { dateTime: '2026-10-17T13:00:00Z' } } }
  assert.equal(getEventGroup(event, now), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T13:00:00Z')), 'completed')
  assert.equal(getEventGroup({ dates: { start: { dateTime: '2026-10-17T11:00:00Z' } } }, now), 'ongoing')
})

test('date-only events stay upcoming through their venue local day', () => {
  const event = { dates: { start: { localDate: '2026-10-17', noSpecificTime: true }, timezone: 'America/Los_Angeles' } }
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T02:00:00Z')), 'upcoming')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T08:00:00Z')), 'completed')
  assert.equal(getEventGroup({ dates: { start: { localDate: '2026-10-18' }, timezone: 'Asia/Karachi' } }, now), 'upcoming')
})

test('missing, unknown, invalid dates and invalid timezone do not become completed', () => {
  for (const event of [
    {}, { dates: { start: { dateTBA: true, localDate: '2020-01-01' } } },
    { dates: { start: { dateTBD: true } } },
    { dates: { start: { dateTime: 'invalid', localDate: 'invalid' } } },
    { dates: { start: { localDate: '2026-02-30' } } },
    { dates: { start: { localDate: '2026-10-17' }, timezone: 'Invalid/Zone' } },
  ]) assert.equal(getEventGroup(event, now), 'undated')
})

test('exact start and end boundaries distinguish upcoming, ongoing, and completed', () => {
  const event = { dates: { start: { dateTime: '2026-10-17T12:00:00Z' }, end: { dateTime: '2026-10-17T14:00:00Z' } } }
  assert.equal(getEventGroup(event, now - 1), 'upcoming')
  assert.equal(getEventGroup(event, now), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T13:59:59Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T14:00:00Z')), 'completed')
})

test('missing end time keeps an event ongoing until venue-local midnight', () => {
  const event = { dates: { start: { dateTime: '2026-10-18T01:00:00Z', localDate: '2026-10-17' }, timezone: 'America/Los_Angeles' } }
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T01:30:00Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T06:59:59Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T07:00:00Z')), 'completed')
})

test('a start timestamp alone derives the venue day and falls back to UTC without a timezone', () => {
  const event = { dates: { start: { dateTime: '2026-10-17T11:00:00Z' }, timezone: 'Asia/Karachi' } }
  assert.equal(getEventGroup(event, now), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T19:00:00Z')), 'completed')
  delete event.dates.timezone
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T23:59:59Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T00:00:00Z')), 'completed')
})

test('multi-day events without an end instant stay ongoing through their scheduled final day', () => {
  const event = { dates: { start: { localDate: '2026-10-16', dateTime: '2026-10-16T10:00:00Z' }, end: { localDate: '2026-10-19' }, timezone: 'UTC' } }
  assert.equal(getEventGroup(event, now), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-19T23:59:59Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-20T00:00:00Z')), 'completed')
})

test('known end time across midnight overrides a start-day fallback', () => {
  const event = { dates: { start: { dateTime: '2026-10-17T22:00:00Z', localDate: '2026-10-17' }, end: { dateTime: '2026-10-18T02:00:00Z' }, timezone: 'UTC' } }
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T01:00:00Z')), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T02:00:00Z')), 'completed')
})

test('invalid or contradictory end timestamps cannot mark a newly started event completed', () => {
  for (const dateTime of ['invalid', '2026-10-17T09:00:00Z']) {
    const event = { dates: { start: { dateTime: '2026-10-17T11:00:00Z' }, end: { dateTime } } }
    assert.equal(getEventGroup(event, now), 'ongoing')
  }
})

test('date-only multi-day event with a known future end stays ongoing after its start day', () => {
  const event = { dates: { start: { localDate: '2026-10-16', timeTBA: true }, end: { dateTime: '2026-10-18T18:00:00Z' }, timezone: 'UTC' } }
  assert.equal(getEventGroup(event, now), 'ongoing')
  assert.equal(getEventGroup(event, Date.parse('2026-10-18T18:00:00Z')), 'completed')
})
