import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import CancelRegistration from '../components/CancelRegistration.jsx'
import Icon from '../components/Icon.jsx'
import { getEventGroup } from '../utils/eventSchedule.js'
import { loadRegistrations } from '../features/registrations/registrationsSlice.js'
import './Events.css'

export default function MyEvents() {
  const user = useSelector((state) => state.auth.user)
  const registrations = useSelector((state) => state.registrations.byUser[user?.id])
  const dispatch = useDispatch()
  const [now, setNow] = useState(Date.now)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user && !registrations) dispatch(loadRegistrations(user.id))
  }, [dispatch, user, registrations])

  const groups = { upcoming: [], completed: [], undated: [] }
  for (const item of registrations?.items || []) groups[getEventGroup(item.event, now)].push(item)
  const titles = { upcoming: 'Upcoming Events', completed: 'Completed Events', undated: 'Date To Be Announced' }

  return (
    <section className="events-page my-events-page" aria-labelledby="my-events-heading">
      <header className="page-intro"><span className="eyebrow">YOUR PERSONAL LINEUP</span><h1 id="my-events-heading">Plans worth keeping<span className="accent-text">.</span></h1><p>All your registrations, in one happy place.</p></header>
      {registrations?.status === 'succeeded' && (
        <div className="registration-overview">
          <div><Icon name="ticket" size={24} /><span><strong>{registrations.items.length}</strong> Total registrations</span></div>
          <div><Icon name="calendar" size={24} /><span><strong>{groups.upcoming.length}</strong> Coming up</span></div>
          <div><Icon name="check" size={24} /><span><strong>{groups.completed.length}</strong> Memories made</span></div>
        </div>
      )}
      <p role="status">{notice?.userId === user?.id ? notice?.message : ''}</p>
      {(!registrations || registrations.status === 'loading') && <p role="status">Loading your registrations...</p>}
      {registrations?.status === 'failed' && (
        <div className="events-feedback">
          <p role="alert">{registrations.error}</p>
          <button type="button" onClick={() => dispatch(loadRegistrations(user.id))}>Try again</button>
        </div>
      )}
      {registrations?.status === 'succeeded' && (registrations.items.length ? (
        Object.entries(groups).map(([group, items]) => (
          <section className="registration-group" key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`}>{titles[group]} ({items.length})</h2>
            {items.length ? (
              <div className="events-grid">
                {items.map((item) => (
                  <div className="registered-event" key={item.event.id}>
                    <EventCard event={item.event} />
                    {group !== 'completed' && (
                      <CancelRegistration event={item.event} onCancelled={(name) => {
                        setNotice({ userId: user.id, message: `Registration for ${name} cancelled.` })
                      }} />
                    )}
                  </div>
                ))}
              </div>
            ) : <p>No events in this group.</p>}
          </section>
        ))
      ) : <div className="empty-state"><Icon name="ticket" size={38} /><h2>Your next chapter is unwritten.</h2><p>Find an experience you love and register. We will keep your plans right here.</p><Link className="button-primary" to="/events">Explore events <Icon name="arrow" size={18} /></Link></div>)}
    </section>
  )
}
