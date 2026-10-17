import { Link } from 'react-router-dom'
import { getEventScheduleLabels } from '../utils/eventDisplay.js'
import Icon from './Icon.jsx'

export default function EventCard({ event }) {
  const venue = event._embedded?.venues?.[0]
  const image = event.images?.find((item) => item.ratio === '16_9') || event.images?.[0]
  const schedule = getEventScheduleLabels(event)
  const category = event.classifications?.[0]?.segment?.name

  return (
    <article className="event-card">
      <div className="event-card-visual">
        {image?.url ? <img src={image.url} alt="" loading="lazy" /> : <div className="event-image-placeholder"><Icon name="ticket" size={48} /></div>}
        {category && <span className="event-category">{category}</span>}
      </div>
      <div className="event-card-content">
        <p className="event-card-date"><Icon name="calendar" size={15} />{schedule.date}</p>
        <h2><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link></h2>
        <p className="event-card-meta"><Icon name="clock" size={15} />{schedule.time}</p>
        <p className="event-card-meta"><Icon name="location" size={15} />{venue?.name || 'Venue to be announced'}</p>
        <div className="event-card-bottom">
          <span>{[venue?.city?.name, venue?.country?.countryCode].filter(Boolean).join(', ') || 'Location to be announced'}</span>
          <Link className="event-card-link" to={`/events/${encodeURIComponent(event.id)}`} aria-label={`View details for ${event.name}`}><Icon name="arrow" size={18} /></Link>
        </div>
      </div>
    </article>
  )
}
