import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../features/auth/authSlice.js'
import Icon from './Icon.jsx'
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
        <span className="brand-icon"><Icon name="ticket" size={24} /></span>
        <span>gather<span className="brand-dot">.</span><small>EVENT MANAGEMENT</small></span>
      </Link>
      <nav aria-label="Main navigation" className="site-nav">
        <NavLink to="/events"><Icon name="search" size={17} /> Discover</NavLink>
        <NavLink to="/my-events"><Icon name="ticket" size={17} /> My Registrations</NavLink>
        {user ? (
          <>
            <span className="nav-user"><span className="user-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span><span>{user.name}</span></span>
            <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <NavLink className={({ isActive }) => `nav-login${isActive ? ' active' : ''}`} to="/login">Log in</NavLink>
            <NavLink className="nav-signup" to="/register">Get started <Icon name="arrow" size={16} /></NavLink>
          </>
        )}
      </nav>
      {error && <p role="alert">{error}</p>}
    </header>
  )
}
