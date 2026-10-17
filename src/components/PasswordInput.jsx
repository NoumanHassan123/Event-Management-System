import { useState } from 'react'
import './PasswordInput.css'

export default function PasswordInput({ id, label = 'password', ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false)
  const toggleLabel = `${isVisible ? 'Hide' : 'Show'} ${label}`

  return (
    <div className="password-input">
      <input {...inputProps} id={id} type={isVisible ? 'text' : 'password'} />
      <button className="password-toggle" type="button" onClick={() => setIsVisible((visible) => !visible)}
        aria-label={toggleLabel} aria-controls={id} title={toggleLabel}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {isVisible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  )
}
