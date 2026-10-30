import { lazy, Suspense } from 'react'
import './App.css'

const ReserveTable = lazy(() => import('./components/ReserveTable').then(module => ({ default: module.ReserveTable })))

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/reserve-table') {
    return <Suspense fallback={<main className="room-loader">Loading the lounge…</main>}><ReserveTable /></Suspense>
  }
  return (
    <main className="landing">
      <div className="grain" aria-hidden="true" />

      <h1 className="sr-only">
        SOLACE — Wednesday 4th November 2026 at 0808 Lagos, 8PM to 2AM.
        Uncle Bubu, Seyi Duretti, Zulu Tebeda. RSVP and tables only.
      </h1>

      <div className="poster-wrap">
        <img
          className="poster"
          src="/poster.jpg"
          alt="SOLACE event flyer: Wed 4th Nov 2026, 0808 Lagos, 8PM–2AM. Lineup: Uncle Bubu, Seyi Duretti, Zulu Tebeda."
        />
      </div>

      <div className="booking-actions">
      <a
        className="cta"
        href="https://solace.theexhibit.co"
        target="_blank"
        rel="noreferrer"
      >
        RSVP &amp; TABLES
      </a>
      <a className="cta cta-reserve" href="/reserve-table">Reserve table <span aria-hidden="true">↗</span></a>
      </div>
    </main>
  )
}

export default App
