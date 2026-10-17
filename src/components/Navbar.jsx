import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice.js'
import './Navbar.css'

export default function Navbar() {
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setError('')
    setIsLoggingOut(true)
    try {
      await dispatch(logout()).unwrap()
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Logout failed. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="site-header">
      <Link className="site-brand" to="/events">
        Event Management System
      </Link>
      <nav aria-label="Main navigation" className="site-nav">
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/my-events">My Registrations</NavLink>
        {user ? (
          <>
            <span className="nav-user">Hello, {user.name}</span>
            <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
      {error && <p role="alert">{error}</p>}
    </header>
  )
}
