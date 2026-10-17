import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

export default function Login() {
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('Login is not available yet. No sign-in has occurred.')
  }

  return (
    <section className="auth-page" aria-labelledby="login-heading">
      <h1 id="login-heading">Login</h1>
      <form className="auth-form" onSubmit={handleSubmit} onChange={() => setMessage('')}>
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button type="submit">Login</button>
        <p className="auth-message" role="status">{message}</p>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </section>
  )
}
