import { useState } from 'react'
import Icon from './Icon.jsx'
import './EventHeroMotion.css'

export default function EventHero() {
  const [motionEnabled, setMotionEnabled] = useState(true)

  return (
    <header className="discover-hero">
      <div className="hero-copy">
        <span className="eyebrow"><span className="small-dot" /> GO OUT. FEEL MORE.</span>
        <h1 id="events-heading"><span className="hero-title-line">Make room for</span>{' '}<span className="hero-title-line">something <em>great.<svg className="hero-underline" viewBox="0 0 200 14" fill="none" aria-hidden="true"><path d="M3 9C49 1 122 0 197 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></em></span></h1>
        <p>From front-row moments to unexpected discoveries.<br className="desktop-break" /> Find the experiences that make life a little louder.</p>
        <a className="hero-explore" href="#find-events">Find your next plan <Icon name="arrow" size={18} /></a>
      </div>
      <div className="hero-art-stage" data-motion={motionEnabled ? 'playing' : 'paused'}>
      <div className="hero-art" aria-hidden="true">
        <span className="hero-ambient-light" />
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <span className="hero-star"><Icon name="sparkle" size={56} /></span>
        <span className="hero-sparkle-small"><Icon name="sparkle" size={22} /></span>
        <div className="hero-ticket">
          <div className="ticket-top"><span>GATHER PRESENTS</span><Icon name="ticket" size={25} /></div>
          <p>YOUR NEXT<br /><strong>GREAT<br />MEMORY.</strong></p>
          <div className="ticket-bottom"><span>MUSIC · CULTURE · SPORT</span><span className="ticket-barcode" /></div>
        </div>
        <span className="hero-float"><span className="small-dot" /> Live a little more.</span>
      </div>
      <button className="hero-motion-control" type="button" onClick={() => setMotionEnabled((enabled) => !enabled)}
        aria-label={motionEnabled ? 'Pause decorative animations' : 'Resume decorative animations'}
        title={motionEnabled ? 'Pause decorative animations' : 'Resume decorative animations'}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          {motionEnabled ? <><rect x="3" y="2" width="3" height="12" rx="1" /><rect x="10" y="2" width="3" height="12" rx="1" /></> : <path d="m4 2 10 6-10 6V2Z" />}
        </svg>
        <span>{motionEnabled ? 'Pause motion' : 'Resume motion'}</span>
      </button>
      </div>
    </header>
  )
}
