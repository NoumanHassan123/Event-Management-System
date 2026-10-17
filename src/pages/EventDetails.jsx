import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fetchEventDetails } from '../features/events/eventsSlice.js'
import EventRegistration from '../components/EventRegistration.jsx'
import { getEventScheduleLabels } from '../utils/eventDisplay.js'
import './EventDetails.css'

export default function EventDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const details = useSelector((state) => state.events.details[id])

  useEffect(() => {
    if (!details) dispatch(fetchEventDetails(id))
  }, [dispatch, id, details])

  const event = details?.event
  const venue = event?._embedded?.venues?.[0]
  const image = event?.images?.find((item) => item.ratio === '16_9') || event?.images?.[0]
  const schedule = getEventScheduleLabels(event || {})
  const classification = event?.classifications?.[0]
  const category = [...new Set([
    classification?.segment?.name, classification?.genre?.name, classification?.subGenre?.name,
  ].filter((name) => name && name !== 'Undefined'))].join(' / ')
  const location = [venue?.address?.line1, venue?.address?.line2, venue?.city?.name,
    venue?.state?.name, venue?.postalCode, venue?.country?.name].filter(Boolean).join(', ')

  return (
    <section className="event-details" aria-labelledby="event-heading">
      <Link to="/events">Back to events</Link>
      <h1 id="event-heading">{event?.name || 'Event Details'}</h1>
      {(!details || details.status === 'loading') && <p role="status">Loading event details...</p>}
      {details?.status === 'failed' && (
        <div className="event-details-error">
          <p role="alert">{details.error}</p>
          <button type="button" onClick={() => dispatch(fetchEventDetails(id))}>Try again</button>
        </div>
      )}
      {event && (
        <>
          {image?.url && <img className="event-details-image" src={image.url} alt={event.name} />}
          <dl className="event-facts">
            <div><dt>Date</dt><dd>{schedule.date}</dd></div>
            <div><dt>Time</dt><dd>{schedule.time}{event.dates?.timezone && ` - ${event.dates.timezone}`}</dd></div>
            <div><dt>Venue</dt><dd>{venue?.name || 'To be announced'}</dd></div>
            <div><dt>Location</dt><dd>{location || 'To be announced'}</dd></div>
            <div><dt>Category</dt><dd>{category || 'Not specified'}</dd></div>
            {event.dates?.status?.code && <div><dt>Status</dt><dd>{event.dates.status.code}</dd></div>}
          </dl>
          <section className="event-registration" aria-label="Event registration">
            <EventRegistration key={`${id}`} event={event} />
          </section>
          <section className="event-description" aria-labelledby="about-event-heading">
            <h2 id="about-event-heading">About this event</h2>
            <p>{event.info || event.description || 'No description is available for this event.'}</p>
          </section>
          {event.pleaseNote && (
            <section className="event-description" aria-labelledby="event-notes-heading">
              <h2 id="event-notes-heading">Please note</h2>
              <p>{event.pleaseNote}</p>
            </section>
          )}
        </>
      )}
    </section>
  )
}
