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
  assert.equal(getEventGroup(event, now), 'upcoming')
  assert.equal(getEventGroup(event, Date.parse('2026-10-17T13:00:00Z')), 'completed')
  assert.equal(getEventGroup({ dates: { start: { dateTime: '2026-10-17T11:00:00Z' } } }, now), 'completed')
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
