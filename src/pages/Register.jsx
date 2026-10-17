import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { register } from '../features/auth/authSlice.js'
import { getAuthDestination } from '../utils/authDestination.js'
import PasswordInput from '../components/PasswordInput.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Icon from '../components/Icon.jsx'
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
    const name = form.elements.namedItem('name')
    const password = form.elements.namedItem('password')
    const confirmation = form.elements.namedItem('confirmPassword')

    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.')
    confirmation.setCustomValidity(
      password.value === confirmation.value ? '' : 'Passwords must match.',
    )

    if (!form.reportValidity()) return

    const values = new FormData(form)
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
    event.currentTarget.elements.namedItem('name').setCustomValidity('')
    event.currentTarget.elements.namedItem('confirmPassword').setCustomValidity('')
  }

  return (
    <AuthLayout headingId="register-heading" title="Make yourself at home." subtitle="Create your account. Start collecting experiences.">
      <form className="auth-form" onSubmit={handleSubmit} onChange={handleChange}>
        <div className="auth-field">
          <label htmlFor="register-name">Full name</label>
          <input id="register-name" name="name" autoComplete="name" required />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Password</label>
          <PasswordInput id="register-password" name="password" autoComplete="new-password" minLength={8} aria-describedby="password-hint" required />
          <small id="password-hint">Use at least 8 characters.</small>
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <PasswordInput id="register-confirm-password" name="confirmPassword" label="confirm password" autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}<Icon name="arrow" size={18} /></button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p className="auth-switch">Already part of the crowd? <Link to="/login" state={location.state}>Log in</Link></p>
      <p className="auth-demo-note">This demo saves your account in this browser. Use a password you don't use elsewhere.</p>
    </AuthLayout>
  )
}
