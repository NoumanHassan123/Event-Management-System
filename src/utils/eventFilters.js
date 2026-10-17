export const EVENT_CATEGORIES = ['Music', 'Sports', 'Arts & Theatre', 'Film', 'Miscellaneous']

export function normalizeEventFilters(filters = {}) {
  return {
    keyword: (filters.keyword || '').trim(),
    category: EVENT_CATEGORIES.includes(filters.category) ? filters.category : '',
    city: (filters.city || '').trim(),
    countryCode: (filters.countryCode || '').trim().toUpperCase(),
  }
}
