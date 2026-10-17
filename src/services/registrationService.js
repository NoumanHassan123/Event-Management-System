import { getEventGroup } from '../utils/eventSchedule.js'

function isStoredEvent(event) {
  return event && typeof event.id === 'string' && Boolean(event.id.trim())
    && typeof event.name === 'string' && Boolean(event.name.trim())
    && (event.images === undefined || Array.isArray(event.images))
    && (event.classifications === undefined || Array.isArray(event.classifications))
    && (event._embedded?.venues === undefined || Array.isArray(event._embedded.venues))
}

function storageKey(userId) {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Please log in to manage your registrations.')
  return `ems.registrations.${userId}`
}

export function readRegistrations(userId) {
  const key = storageKey(userId)
  try {
    const items = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(items) || items.some((item) => !isStoredEvent(item?.event))) {
      throw new Error('Invalid registrations')
    }
    return items
  } catch {
    throw new Error('Your saved registrations could not be read. Please check your browser storage and try again.')
  }
}

export function saveRegistration(userId, event) {
  const items = readRegistrations(userId)
  if (!isStoredEvent(event)) throw new Error('Please select a valid event.')
  if (items.some((item) => item.event.id === event.id)) {
    throw new Error('You are already registered for this event.')
  }
  if (event.dates?.status?.code === 'cancelled') throw new Error('This event has been cancelled.')
  const group = getEventGroup(event)
  if (group === 'completed' || group === 'ongoing') throw new Error('Registration is closed for events that have already started.')
  const image = event.images?.find((item) => item.ratio === '16_9') || event.images?.[0]
  const snapshot = {
    id: event.id, name: event.name, dates: event.dates || {},
    images: image ? [image] : [], classifications: event.classifications || [],
    _embedded: { venues: event._embedded?.venues?.slice(0, 1) || [] },
  }
  const updated = [...items, { event: snapshot, registeredAt: new Date().toISOString() }]
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(updated))
  } catch {
    throw new Error('Your registration could not be saved. Please enable browser storage or free some space and try again.')
  }
  return updated
}
export function removeRegistration(userId, eventId) {
  const items = readRegistrations(userId)
  const registration = items.find((item) => item.event.id === eventId)
  if (!registration) throw new Error('This registration could not be found. Please reload your registrations.')
  const group = getEventGroup(registration.event)
  if (group === 'completed' || group === 'ongoing') {
    throw new Error('Registrations for ongoing or completed events cannot be cancelled.')
  }
  const updated = items.filter((item) => item.event.id !== eventId)
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(updated))
  } catch {
    throw new Error('Your cancellation could not be saved. Please check your browser storage and try again.')
  }
  return updated
}
