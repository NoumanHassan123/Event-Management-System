import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import { loadRegistrations } from '../features/registrations/registrationsSlice.js'
import './Events.css'

export default function MyEvents() {
  const user = useSelector((state) => state.auth.user)
  const registrations = useSelector((state) => state.registrations.byUser[user?.id])
  const dispatch = useDispatch()

  useEffect(() => {
    if (user && !registrations) dispatch(loadRegistrations(user.id))
  }, [dispatch, user, registrations])

  return (
    <section className="events-page" aria-labelledby="my-events-heading">
      <h1 id="my-events-heading">My Registrations</h1>
      {(!registrations || registrations.status === 'loading') && <p role="status">Loading your registrations...</p>}
      {registrations?.status === 'failed' && (
        <div className="events-feedback">
          <p role="alert">{registrations.error}</p>
          <button type="button" onClick={() => dispatch(loadRegistrations(user.id))}>Try again</button>
        </div>
      )}
      {registrations?.status === 'succeeded' && (registrations.items.length ? (
        <div className="events-grid">
          {registrations.items.map((item) => <EventCard key={item.event.id} event={item.event} />)}
        </div>
      ) : <p>You have no registrations yet. <Link to="/events">Explore events</Link></p>)}
    </section>
  )
}
