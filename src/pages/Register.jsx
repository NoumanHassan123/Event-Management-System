import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { register } from '../features/auth/authSlice.js'
import { getAuthDestination } from '../utils/authDestination.js'
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
    <section className="auth-page" aria-labelledby="register-heading">
      <h1 id="register-heading">Register</h1>
      <p className="auth-note">This demo saves your account in this browser. Use a password you don't use elsewhere.</p>
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
          <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="password-hint" required />
          <small id="password-hint">Use at least 8 characters.</small>
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input id="register-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p>Already have an account? <Link to="/login" state={location.state}>Login</Link></p>
    </section>
  )
}
