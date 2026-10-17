import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import EventCard from '../components/EventCard.jsx'
import { fetchEvents } from '../features/events/eventsSlice.js'
import './Events.css'

export default function Events() {
  const dispatch = useDispatch()
  const { items, status, error } = useSelector((state) => state.events)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchEvents())
  }, [dispatch, status])

  return (
    <section className="events-page" aria-labelledby="events-heading">
      <h1 id="events-heading">Upcoming Events</h1>
      {(status === 'idle' || status === 'loading') && <p role="status">Loading events...</p>}
      {status === 'failed' && (
        <div className="events-feedback">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => dispatch(fetchEvents())}>Try again</button>
        </div>
      )}
      {status === 'succeeded' && (items.length ? (
        <div className="events-grid">
          {items.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      ) : <p role="status">No upcoming events found. Please check again later.</p>)}
    </section>
  )
}
