export async function getEvents({ signal, apiKey = import.meta.env?.VITE_TICKETMASTER_API_KEY } = {}) {
  if (!apiKey?.trim()) {
    throw new Error('Events are not configured yet. Please contact the site administrator.')
  }

  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json')
  url.search = new URLSearchParams({
    apikey: apiKey.trim(),
    size: '20',
    sort: 'date,asc',
    startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  }).toString()

  let response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Unable to connect to the events service. Check your connection and try again.')
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('The events service could not authorize this request. Please contact the site administrator.')
    }
    if (response.status === 429) {
      throw new Error('The events service is busy. Please wait a little before trying again.')
    }
    throw new Error('Events could not be loaded. Please try again later.')
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The events service returned an unreadable response. Please try again later.')
  }
  const events = data?._embedded?.events
  if (events === undefined && data?.page) return []
  if (!Array.isArray(events) || events.some((event) => !event?.id || !event?.name)) {
    throw new Error('The events service returned an unexpected response. Please try again later.')
  }
  return events
}
