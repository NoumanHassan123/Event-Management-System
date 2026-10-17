import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import EventCard from '../components/EventCard.jsx'
import EventHero from '../components/EventHero.jsx'
import Icon from '../components/Icon.jsx'
import { fetchEvents } from '../features/events/eventsSlice.js'
import { EVENT_CATEGORIES, normalizeEventFilters } from '../utils/eventFilters.js'
import './Events.css'

export default function Events() {
  const dispatch = useDispatch()
  const { items, status, error, filters, page, pagination } = useSelector((state) => state.events)
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchEvents({ ...filters, page }))
  }, [dispatch, status, filters, page])

  function handleChange(event) {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    const normalized = normalizeEventFilters(draft)
    setDraft(normalized)
    dispatch(fetchEvents(normalized))
  }

  function handleClear() {
    const empty = normalizeEventFilters()
    setDraft(empty)
    dispatch(fetchEvents(empty))
  }

  function handleCategory(category) {
    const updated = { ...filters, category }
    setDraft(updated)
    dispatch(fetchEvents(updated))
  }

  return (
    <section className="events-page" aria-labelledby="events-heading">
      <EventHero />
      <div className="search-panel" id="find-events">
      <div className="search-panel-heading"><Icon name="search" size={19} /><h2>What are you in the mood for?</h2><span>Your next plan starts here.</span></div>
      <form className="event-search" onSubmit={handleSearch} role="search" aria-label="Find events">
        <div className="event-search-field">
          <label htmlFor="event-keyword">Keyword</label>
          <input id="event-keyword" name="keyword" type="search" value={draft.keyword} onChange={handleChange} placeholder="Event or artist name" />
        </div>
        <div className="event-search-field">
          <label htmlFor="event-category">Category</label>
          <select id="event-category" name="category" value={draft.category} onChange={handleChange}>
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="event-search-field">
          <label htmlFor="event-city">City</label>
          <input id="event-city" name="city" value={draft.city} onChange={handleChange} placeholder="Any city" />
        </div>
        <div className="event-search-field">
          <label htmlFor="event-country">Country code</label>
          <input id="event-country" name="countryCode" value={draft.countryCode} onChange={handleChange}
            maxLength={2} pattern="[A-Za-z]{2}" title="Enter a two-letter country code" aria-describedby="country-hint" placeholder="Any country" />
          <small id="country-hint">For example: US, GB, CA, AU</small>
        </div>
        <div className="event-search-actions">
          <button type="submit"><Icon name="search" size={18} /> Search events</button>
          <button type="button" onClick={handleClear}>Clear filters</button>
        </div>
      </form>
      </div>
      <div className="results-heading">
        <div><span className="eyebrow">OUT THERE, WAITING FOR YOU</span><h2>Discover what's happening</h2></div>
        <span className="results-source"><span className="small-dot" /> Live from Ticketmaster</span>
      </div>
      <div className="category-filters" role="group" aria-label="Quick category filters">
        {['', ...EVENT_CATEGORIES].map((category) => (
          <button key={category || 'all'} type="button" aria-pressed={filters.category === category}
            onClick={() => handleCategory(category)}>{category || 'All experiences'}</button>
        ))}
      </div>
      {Object.values(filters).some(Boolean) && (
        <p className="event-search-summary">Applied filters: {[
          filters.keyword && `Keyword: ${filters.keyword}`, filters.category && `Category: ${filters.category}`,
          filters.city && `City: ${filters.city}`, filters.countryCode && `Country: ${filters.countryCode}`,
        ].filter(Boolean).join(' | ')}</p>
      )}
      {(status === 'idle' || status === 'loading') && <div className="events-loading" role="status"><span className="loading-spinner" /> Finding your next great experience...</div>}
      {status === 'failed' && (
        <div className="events-feedback">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => dispatch(fetchEvents({ ...filters, page }))}>Try again</button>
          {page > 0 && <button type="button" onClick={() => dispatch(fetchEvents({ ...filters, page: page - 1 }))}>Previous page</button>}
        </div>
      )}
      {status === 'succeeded' && (items.length ? (
        <div className="events-grid">
          {items.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      ) : <div className="empty-state" role="status"><Icon name="search" size={34} /><h3>No plans found. Yet.</h3><p>Try a different keyword or location. Your next great experience is out there.</p><button type="button" onClick={handleClear}>Clear filters <Icon name="arrow" size={16} /></button></div>)}
      {status === 'succeeded' && pagination && (items.length > 0 || page > 0) && (
        <nav className="events-pagination" aria-label="Event results pages">
          <button type="button" disabled={page === 0}
            onClick={() => dispatch(fetchEvents({ ...filters, page: page - 1 }))}>Previous</button>
          <p role="status">Page {page + 1} of {Math.max(page + 1, pagination.totalPages)} · {pagination.totalElements} events found</p>
          <button type="button" disabled={page + 1 >= pagination.totalPages}
            onClick={() => dispatch(fetchEvents({ ...filters, page: page + 1 }))}>Next</button>
          {pagination.limited && <p className="pagination-hint">Showing the first 1,000 matches. Narrow your filters to explore more results.</p>}
        </nav>
      )}
    </section>
  )
}
