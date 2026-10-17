import Icon from './Icon.jsx'

export default function AuthLayout({ title, subtitle, headingId, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <span className="eyebrow"><Icon name="sparkle" size={16} /> A LITTLE MORE LIFE</span>
        <h2>More moments.<br />More <em>memories.</em></h2>
        <p>The live music. The last-minute plans. The things you will talk about for years. Find them here.</p>
        <div className="auth-story-art" aria-hidden="true"><Icon name="ticket" size={100} /><span>GOOD TIMES AHEAD</span></div>
        <div className="auth-story-bottom"><span className="small-dot" /> Your next great experience is out there.</div>
      </aside>
      <section className="auth-card" aria-labelledby={headingId}>
        <span className="auth-card-icon"><Icon name="ticket" size={25} /></span>
        <h1 id={headingId}>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </section>
    </div>
  )
}
