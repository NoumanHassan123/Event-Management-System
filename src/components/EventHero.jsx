import Icon from './Icon.jsx'

export default function EventHero() {
  return (
    <header className="discover-hero">
      <div className="hero-copy">
        <span className="eyebrow"><span className="small-dot" /> GO OUT. FEEL MORE.</span>
        <h1 id="events-heading">Make room for<br />something <em>great.</em></h1>
        <p>From front-row moments to unexpected discoveries.<br className="desktop-break" /> Find the experiences that make life a little louder.</p>
        <a className="hero-explore" href="#find-events">Find your next plan <Icon name="arrow" size={18} /></a>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <span className="hero-star"><Icon name="sparkle" size={56} /></span>
        <div className="hero-ticket">
          <div className="ticket-top"><span>GATHER PRESENTS</span><Icon name="ticket" size={25} /></div>
          <p>YOUR NEXT<br /><strong>GREAT<br />MEMORY.</strong></p>
          <div className="ticket-bottom"><span>MUSIC · CULTURE · SPORT</span><span className="ticket-barcode" /></div>
        </div>
        <span className="hero-float"><span className="small-dot" /> Live a little more.</span>
      </div>
    </header>
  )
}
