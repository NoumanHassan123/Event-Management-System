import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { cancelRegistration } from '../features/registrations/registrationsSlice.js'

export default function CancelRegistration({ event, onCancelled }) {
  const dispatch = useDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      await dispatch(cancelRegistration(event.id)).unwrap()
      onCancelled(event.name)
    } catch (err) {
      setError(err.message || 'Cancellation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="registration-actions">
      <button type="button" onClick={handleCancel} disabled={isSubmitting}
        aria-label={`Cancel registration for ${event.name}`}>
        {isSubmitting ? 'Cancelling...' : 'Cancel registration'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
