export function getEventGroup(event, now = Date.now()) {
  const start = event.dates?.start
  if (!start || start.dateTBA || start.dateTBD) return 'undated'
  const timestamp = event.dates?.end?.dateTime
    || (!start.timeTBA && !start.noSpecificTime ? start.dateTime : null)
  if (timestamp) {
    const time = Date.parse(timestamp)
    if (Number.isFinite(time)) return time <= now ? 'completed' : 'upcoming'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start.localDate || '')) return 'undated'
  const parsed = new Date(`${start.localDate}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== start.localDate) return 'undated'
  // A date-only event stays upcoming through its venue's local calendar day.
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: event.dates.timezone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(now))
    const part = (type) => parts.find((item) => item.type === type).value
    const today = `${part('year')}-${part('month')}-${part('day')}`
    return start.localDate < today ? 'completed' : 'upcoming'
  } catch {
    return 'undated'
  }
}
