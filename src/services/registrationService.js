function storageKey(userId) {
  if (!userId) throw new Error('Please log in to manage your registrations.')
  return `ems.registrations.${userId}`
}

export function readRegistrations(userId) {
  const key = storageKey(userId)
  try {
    const items = JSON.parse(localStorage.getItem(key) ?? '[]')
    if (!Array.isArray(items) || items.some((item) => !item?.event?.id || !item?.event?.name)) {
      throw new Error('Invalid registrations')
    }
    return items
  } catch {
    throw new Error('Your saved registrations could not be read. Please check your browser storage and try again.')
  }
}

export function saveRegistration(userId, event) {
  const items = readRegistrations(userId)
  if (!event?.id || !event?.name) throw new Error('Please select a valid event.')
  if (items.some((item) => item.event.id === event.id)) {
    throw new Error('You are already registered for this event.')
  }
  if (event.dates?.status?.code === 'cancelled') throw new Error('This event has been cancelled.')
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
