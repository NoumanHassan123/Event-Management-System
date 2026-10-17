import { Link } from 'react-router-dom'
import { getEventScheduleLabels } from '../utils/eventDisplay.js'

export default function EventCard({ event }) {
  const venue = event._embedded?.venues?.[0]
  const image = event.images?.find((item) => item.ratio === '16_9') || event.images?.[0]
  const schedule = getEventScheduleLabels(event)
  const category = event.classifications?.[0]?.segment?.name

  return (
    <article className="event-card">
      {image?.url && <img src={image.url} alt="" loading="lazy" />}
      <div className="event-card-content">
        {category && <p className="event-category">{category}</p>}
        <h2><Link to={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link></h2>
        <p>{schedule.date}</p>
        <p>{schedule.time}</p>
        <p>{venue?.name || 'Venue to be announced'}</p>
        <p>{[venue?.city?.name, venue?.state?.name, venue?.country?.name].filter(Boolean).join(', ')}</p>
      </div>
    </article>
  )
}
