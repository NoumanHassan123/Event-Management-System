import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

export default function NotFound() {
  return (
    <section className="events-page my-events-page" aria-labelledby="not-found-heading">
      <div className="empty-state">
        <Icon name="search" size={40} />
        <p className="eyebrow">A LITTLE OFF THE BEATEN PATH</p>
        <h1 id="not-found-heading">Page not found</h1>
        <p>The page you requested could not be found. Let's get you back to the good stuff.</p>
        <Link className="button-primary" to="/events">Explore upcoming events <Icon name="arrow" size={17} /></Link>
      </div>
    </section>
  )
}
