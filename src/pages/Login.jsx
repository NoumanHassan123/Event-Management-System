import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { login } from '../features/auth/authSlice.js'
import { getAuthDestination } from '../utils/authDestination.js'
import PasswordInput from '../components/PasswordInput.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Icon from '../components/Icon.jsx'
import { getLoginErrors, normalizeEmail } from '../utils/authValidation.js'
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
    const form = event.currentTarget
    const emailField = form.elements.namedItem('email')
    emailField.value = normalizeEmail(emailField.value)
    const values = new FormData(form)
    const errors = getLoginErrors(Object.fromEntries(values))
    for (const field of ['email', 'password']) form.elements.namedItem(field).setCustomValidity(errors[field] || '')
    if (!form.reportValidity()) return
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
    <AuthLayout headingId="login-heading" title="Welcome back." subtitle="Your next great experience is waiting.">
      {from?.pathname === '/my-events' && (
        <p className="auth-note">Please log in to view your registrations.</p>
      )}
      {canReturn && from.pathname !== '/my-events' && (
        <p className="auth-note">Please log in to register for this event.</p>
      )}
      <form className="auth-form" onSubmit={handleSubmit} noValidate onChange={(event) => {
        setMessage('')
        for (const field of ['email', 'password']) event.currentTarget.elements.namedItem(field).setCustomValidity('')
      }}>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <PasswordInput id="login-password" name="password" autoComplete="current-password" maxLength={128} required />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}<Icon name="arrow" size={18} /></button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p className="auth-switch">New around here? <Link to="/register" state={location.state}>Create an account</Link></p>
      <p className="auth-demo-note">Demo accounts are saved in this browser.</p>
    </AuthLayout>
  )
}
