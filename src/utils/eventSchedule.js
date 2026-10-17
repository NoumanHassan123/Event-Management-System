function validLocalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null
}

function timestamp(value) {
  return typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN
}

function localDay(time, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(time))
  const part = (type) => parts.find((item) => item.type === type).value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function getEventGroup(event, now = Date.now()) {
  const start = event.dates?.start
  if (!start || start.dateTBA || start.dateTBD || !Number.isFinite(now)) return 'undated'
  const startTime = !start.timeTBA && !start.noSpecificTime ? timestamp(start.dateTime) : NaN
  const endTime = timestamp(event.dates?.end?.dateTime)
  const hasKnownEnd = Number.isFinite(endTime) && (!Number.isFinite(startTime) || endTime >= startTime)
  // An explicit end is authoritative; a start instant never proves completion.
  if (hasKnownEnd) {
    if (now >= endTime) return 'completed'
    if (Number.isFinite(startTime) && now >= startTime) return 'ongoing'
    if (Number.isFinite(startTime)) return 'upcoming'
  }
  if (Number.isFinite(startTime) && now < startTime) return 'upcoming'

  try {
    const timeZone = event.dates.timezone || event._embedded?.venues?.[0]?.timezone || 'UTC'
    const today = localDay(now, timeZone)
    const startDay = validLocalDate(start.localDate)
      || (Number.isFinite(startTime) ? localDay(startTime, timeZone) : null)
    if (!startDay) return 'undated'
    const endDay = validLocalDate(event.dates?.end?.localDate)
    const finalDay = endDay && endDay >= startDay ? endDay : startDay
    // With no end instant, completion is an estimate after the final local day.
    if (!hasKnownEnd && finalDay < today) return 'completed'
    if (Number.isFinite(startTime) && now >= startTime) return 'ongoing'
    if (startDay < today) return 'ongoing'
    return 'upcoming'
  } catch {
    return 'undated'
  }
}
