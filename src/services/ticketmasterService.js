import { normalizeEventFilters } from '../utils/eventFilters.js'

async function requestTicketmaster(path, params, { signal, apiKey = import.meta.env?.VITE_TICKETMASTER_API_KEY } = {}) {
  if (!apiKey?.trim()) {
    throw new Error('Events are not configured yet. Please contact the site administrator.')
  }

  const url = new URL(`https://app.ticketmaster.com/discovery/v2/${path}`)
  url.search = new URLSearchParams({
    apikey: apiKey.trim(),
    ...params,
  }).toString()

  let response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Unable to connect to the events service. Check your connection and try again.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('This event could not be found. It may no longer be available.')
    }
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
  return data
}

export const EVENTS_PAGE_SIZE = 20
export const MAX_EVENT_PAGES = 50

export async function getEventsPage(options = {}) {
  const page = options.page ?? 0
  if (!Number.isInteger(page) || page < 0 || page >= MAX_EVENT_PAGES) {
    throw new Error('This results page is unavailable. Please narrow your search.')
  }
  const startDateTime = options.startDateTime || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const filters = normalizeEventFilters(options.filters)
  if (filters.countryCode && !/^[A-Z]{2}$/.test(filters.countryCode)) {
    throw new Error('Enter a two-letter country code, such as US, GB, or CA.')
  }
  const params = {}
  if (filters.keyword) params.keyword = filters.keyword
  if (filters.category) params.classificationName = filters.category
  if (filters.city) params.city = filters.city
  if (filters.countryCode) params.countryCode = filters.countryCode
  const data = await requestTicketmaster('events.json', {
    size: String(EVENTS_PAGE_SIZE),
    page: String(page),
    sort: 'date,asc',
    startDateTime,
    ...params,
  }, options)
  const events = data?._embedded?.events ?? (data?.page ? [] : undefined)
  if (!Array.isArray(events) || events.some((event) => !event?.id || !event?.name)) {
    throw new Error('The events service returned an unexpected response. Please try again later.')
  }
  const totalElements = data.page?.totalElements ?? events.length
  const totalPages = data.page?.totalPages ?? (events.length ? page + 1 : 0)
  const number = data.page?.number ?? page
  if (![totalElements, totalPages, number].every((value) => Number.isInteger(value) && value >= 0) || number !== page) {
    throw new Error('The events service returned unexpected pagination data. Please try again later.')
  }
  return {
    events, startDateTime,
    pagination: { number, totalElements, totalPages: Math.min(totalPages, MAX_EVENT_PAGES),
      limited: totalPages > MAX_EVENT_PAGES },
  }
}

export async function getEvents(options = {}) {
  return (await getEventsPage(options)).events
}

export async function getEventDetails(id, options = {}) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('An event ID is required.')
  const data = await requestTicketmaster(`events/${encodeURIComponent(id)}.json`, {}, options)
  if (data?.id !== id || typeof data?.name !== 'string' || !data.name) {
    throw new Error('The events service returned unexpected event details. Please try again later.')
  }
  return data
}
