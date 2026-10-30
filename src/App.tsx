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
      <header className="site-nav">
        <a href="#" className="small-wordmark" aria-label="Solace home">SOLACE</a>
        <span className="nav-caption">A LITTLE ESCAPE. A LATE NIGHT.</span>
        <a className="nav-rsvp" href="#rsvp">RSVP & TABLES <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" aria-labelledby="event-title">
        <div className="hero-eyebrow"><span>LAGOS, LET’S GET TOGETHER.</span><span>04.11.26 / NOVEMBER 2026</span></div>
        <h1 id="event-title">SOLACE</h1>
        <div className="event-strip"><span>WED 4TH NOV, 2026</span><span>0808 LAGOS</span><span>8PM—2AM</span></div>
        <div className="hero-art">
          <img src="/solace-artwork.webp" width="1054" height="823" alt="Black-and-white vintage collage with a reclining woman on a vivid pink sofa, from the Solace event poster." fetchPriority="high" />
          <a className="art-cta" href="#rsvp"><span>YOUR MIDWEEK<br />ESCAPE STARTS HERE.</span><span className="round-arrow" aria-hidden="true">↘</span></a>
          <span className="art-caption">GOOD COMPANY. GREAT MUSIC. SOLACE.</span>
        </div>
      </section>

      <section className="lineup" aria-labelledby="lineup-title">
        <div className="section-top"><h2 id="lineup-title">ON THE SELECTS</h2><span>THREE NAMES. ONE NIGHT.</span></div>
        <div className="artist-list">{['UNCLE BUBU', 'SEYI DURETTI', 'ZULU TEBEDA'].map((artist, i) => <div className="artist" key={artist}><span className="artist-index">0{i + 1}</span><h3>{artist}</h3><span className="artist-star" aria-hidden="true">✳</span></div>)}</div>
      </section>

      <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
        <div className="rsvp-copy"><p className="section-kicker">SAVE YOUR WEDNESDAY.</p><h2 id="rsvp-title">FIND YOUR<br /><span>SOLACE.</span></h2><p>A night at 0808 Lagos, soundtracked by Uncle Bubu, Seyi Duretti and Zulu Tebeda. Come through. Stay a little longer.</p></div>
        <div className="rsvp-details"><dl><div><dt>WHEN</dt><dd>Wednesday, 4 November 2026</dd></div><div><dt>WHERE</dt><dd>0808 Lagos</dd></div><div><dt>TIME</dt><dd>8:00 PM — 2:00 AM</dd></div><div><dt>ENTRY</dt><dd>RSVP & tables only</dd></div></dl><a className="booking-button" href="/reserve-table">EXPLORE TABLES <span aria-hidden="true">↗</span></a><a className="calendar-link" href="/solace.ics" download>ADD TO CALENDAR <span aria-hidden="true">+</span></a></div>
      </section>
      <footer><a className="small-wordmark" href="#">SOLACE</a><span>WED 04.11.26 / LAGOS</span><a href="#event-title">BACK TO TOP ↑</a></footer>
    </main>
  )
}
export default App
