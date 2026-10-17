import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { login } from '../features/auth/authSlice.js'
import { getAuthDestination } from '../utils/authDestination.js'
import './Auth.css'

export default function Login() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const from = location.state?.from
  const destination = getAuthDestination(from)
  const canReturn = destination !== '/events'

  if (user) return <Navigate to={destination} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    const values = new FormData(event.currentTarget)
    setMessage('')
    setIsSubmitting(true)
    try {
      await dispatch(login({ email: values.get('email'), password: values.get('password') })).unwrap()
    } catch (error) {
      setMessage(error.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-labelledby="login-heading">
      <h1 id="login-heading">Login</h1>
      {from?.pathname === '/my-events' && (
        <p className="auth-note">Please log in to view your registrations.</p>
      )}
      {canReturn && from.pathname !== '/my-events' && (
        <p className="auth-note">Please log in to register for this event.</p>
      )}
      <p className="auth-note">Use the account you created in this browser.</p>
      <form className="auth-form" onSubmit={handleSubmit} onChange={() => setMessage('')}>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p>Don't have an account? <Link to="/register" state={location.state}>Register</Link></p>
    </section>
  )
}
