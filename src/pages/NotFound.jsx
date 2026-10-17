import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="events-page" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Page not found</h1>
      <p>The page you requested could not be found. <Link to="/events">Explore upcoming events</Link></p>
    </section>
  )
}
