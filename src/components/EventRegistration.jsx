import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { loadRegistrations, registerForEvent } from '../features/registrations/registrationsSlice.js'
import { getEventGroup } from '../utils/eventSchedule.js'

export default function EventRegistration({ event }) {
  const user = useSelector((state) => state.auth.user)
  const registrations = useSelector((state) => state.registrations.byUser[user?.id])
  const dispatch = useDispatch()
  const location = useLocation()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user && !registrations) dispatch(loadRegistrations(user.id))
  }, [dispatch, user, registrations])

  async function handleRegister() {
    if (isSubmitting) return
    setError('')
    setIsSubmitting(true)
    try {
      await dispatch(registerForEvent(event)).unwrap()
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <p><Link to="/login" state={{ from: location }}>Log in to register for this event</Link></p>
  }

  const isRegistered = registrations?.items.some((item) => item.event.id === event.id)
  if (isRegistered) {
    return <p role="status">You are registered for this event. <Link to="/my-events">View my registrations</Link></p>
  }
  const group = getEventGroup(event, now)
  if (group === 'completed' || group === 'ongoing') {
    return <p>Registration is closed because this event has already started.</p>
  }
  if (registrations?.status === 'failed') {
    return (
      <div>
        <p role="alert">{registrations.error}</p>
        <button type="button" onClick={() => dispatch(loadRegistrations(user.id))}>Try again</button>
      </div>
    )
  }

  return (
    <div>
      <button type="button" onClick={handleRegister}
        disabled={isSubmitting || registrations?.status !== 'succeeded' || event.dates?.status?.code === 'cancelled'}>
        {event.dates?.status?.code === 'cancelled' ? 'Event cancelled' : isSubmitting ? 'Registering...' : 'Register for event'}
      </button>
      <p className="registration-note">This saves your registration in this app. It does not reserve or purchase a Ticketmaster ticket.</p>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
