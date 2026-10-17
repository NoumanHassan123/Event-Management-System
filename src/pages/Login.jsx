import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { login } from '../features/auth/authSlice.js'
import './Auth.css'

export default function Login() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  if (user) return <Navigate to="/events" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    const values = new FormData(event.currentTarget)
    setMessage('')
    setIsSubmitting(true)
    try {
      await dispatch(login({ email: values.get('email'), password: values.get('password') })).unwrap()
      navigate('/events', { replace: true })
    } catch (error) {
      setMessage(error.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-labelledby="login-heading">
      <h1 id="login-heading">Login</h1>
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
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </section>
  )
}
