export const EVENT_CATEGORIES = ['Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous']

export function normalizeEventFilters(filters = {}) {
  const source = filters && typeof filters === 'object' && !Array.isArray(filters) ? filters : {}
  const text = (value) => typeof value === 'string' ? value.trim() : ''
  return {
    keyword: text(source.keyword),
    category: EVENT_CATEGORIES.includes(source.category) ? source.category : '',
    city: text(source.city),
    countryCode: text(source.countryCode).toUpperCase(),
  }
}
