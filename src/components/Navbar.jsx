import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <header className="site-header">
      <Link className="site-brand" to="/events">
        Event Management System
      </Link>
      <nav aria-label="Main navigation" className="site-nav">
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/my-events">My Registrations</NavLink>
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/register">Register</NavLink>
      </nav>
    </header>
  )
}
