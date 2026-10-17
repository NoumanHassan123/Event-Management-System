import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { register } from '../features/auth/authSlice.js'
import { getAuthDestination } from '../utils/authDestination.js'
import PasswordInput from '../components/PasswordInput.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Icon from '../components/Icon.jsx'
import { getRegistrationErrors, normalizeEmail } from '../utils/authValidation.js'
import './Auth.css'

export default function Register() {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const destination = getAuthDestination(location.state?.from)

  if (user) return <Navigate to={destination} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return
    const form = event.currentTarget
    const emailField = form.elements.namedItem('email')
    emailField.value = normalizeEmail(emailField.value)
    const values = new FormData(form)
    const errors = getRegistrationErrors(Object.fromEntries(values))
    for (const field of ['name', 'email', 'password', 'confirmPassword']) {
      form.elements.namedItem(field).setCustomValidity(errors[field] || '')
    }
    if (!form.reportValidity()) return
    setMessage('')
    setIsSubmitting(true)
    try {
      await dispatch(register({
        name: values.get('name'), email: values.get('email'), password: values.get('password'),
      })).unwrap()
    } catch (error) {
      setMessage(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(event) {
    setMessage('')
    for (const field of ['name', 'email', 'password', 'confirmPassword']) {
      event.currentTarget.elements.namedItem(field).setCustomValidity('')
    }
  }

  return (
    <AuthLayout headingId="register-heading" title="Make yourself at home." subtitle="Create your account. Start collecting experiences.">
      <form className="auth-form" onSubmit={handleSubmit} onChange={handleChange} noValidate>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" name="name" autoComplete="name" maxLength={80} required />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Gmail address</label>
          <input id="register-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@gmail.com" aria-describedby="email-hint" required />
          <small id="email-hint">Only @gmail.com addresses are accepted.</small>
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <PasswordInput id="register-password" name="password" autoComplete="new-password" minLength={8} maxLength={128} aria-describedby="password-hint" required />
          <small id="password-hint">8–128 characters, with a letter or number and a special character (!, @, #, $). No spaces at the start or end.</small>
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <PasswordInput id="register-confirm-password" name="confirmPassword" label="confirm password" autoComplete="new-password" maxLength={128} required />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}<Icon name="arrow" size={18} /></button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p className="auth-switch">Already part of the crowd? <Link to="/login" state={location.state}>Log in</Link></p>
      <p className="auth-demo-note">This demo saves your account in this browser. Use a password you don't use elsewhere.</p>
    </AuthLayout>
  )
}
