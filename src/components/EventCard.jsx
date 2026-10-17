import { Link } from 'react-router-dom'

export default function EventCard({ event }) {
  const venue = event._embedded?.venues?.[0]
  const image = event.images?.find((item) => item.ratio === '16_9') || event.images?.[0]
  const start = event.dates?.start
  const date = start?.dateTBA || start?.dateTBD ? 'Date to be announced' : start?.localDate
  const time = start?.timeTBA || start?.noSpecificTime ? null : start?.localTime
  const category = event.classifications?.[0]?.segment?.name

  return (
    <article className="event-card">
      {image?.url && <img src={image.url} alt="" loading="lazy" />}
      <div className="event-card-content">
        {category && <p className="event-category">{category}</p>}
        <h2><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link></h2>
        <p>{date || 'Date to be announced'}{time && ` at ${time.slice(0, 5)}`} (venue local time)</p>
        <p>{venue?.name || 'Venue to be announced'}</p>
        <p>{[venue?.city?.name, venue?.state?.name, venue?.country?.name].filter(Boolean).join(', ')}</p>
      </div>
    </article>
  )
}
