import { lazy, Suspense } from 'react'
import './App.css'
import { MusicPlayer } from './components/MusicPlayer'
import { RsvpForm } from './components/RsvpForm'

const ReserveTable = lazy(() => import('./components/ReserveTable').then(module => ({ default: module.ReserveTable })))

const hosts = [
  { name: 'A1 & Friends', src: '/solace-logos/A1-logo.png', width: 713, height: 576 },
  { name: 'Uncle Bubu', src: '/solace-logos/coloured%20face%20white%20text.png', width: 1702, height: 738 },
  { name: 'Duretti Confetti', src: '/solace-logos/Duretti%20Confetti%20logo.png', width: 1208, height: 556 },
]

function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/reserve-table' || window.location.pathname.replace(/\/$/, '') === '/reserve-section') {
    return <><Suspense fallback={<main className="room-loader">Loading the lounge…</main>}><ReserveTable /></Suspense><MusicPlayer /></>
  }
  return (
    <main className="landing">
      <div className="grain" aria-hidden="true" />
      <header className="site-nav">
        <a href="#" className="small-wordmark" aria-label="Solace home">SOLACE</a>
        <span className="nav-caption">A LITTLE ESCAPE. A LATE NIGHT.</span>
        <a className="nav-rsvp" href="#rsvp">RSVP & SECTIONS <span aria-hidden="true">↗</span></a>
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

      <section className="partners" aria-labelledby="partners-title">
        <h2 id="partners-title">HOSTED BY</h2>
        <div className="partner-logos">{hosts.map(({ name, src, width, height }) => <img className="partner-logo" key={name} src={src} width={width} height={height} alt={name} loading="lazy" />)}</div>
      </section>

      <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
        <div className="rsvp-copy"><p className="section-kicker">SAVE YOUR WEDNESDAY.</p><h2 id="rsvp-title">FIND YOUR<br /><span>SOLACE.</span></h2><p>Come for the music. Stay for the Solace.</p></div>
        <div className="rsvp-details"><dl><div><dt>WHEN</dt><dd>Wednesday, 4 November 2026</dd></div><div><dt>WHERE</dt><dd>0808 Lagos</dd></div><div><dt>TIME</dt><dd>8:00 PM — 2:00 AM</dd></div><div><dt>ENTRY</dt><dd>RSVP & sections only</dd></div></dl><a className="booking-button" href="/reserve-section">EXPLORE SECTIONS <span aria-hidden="true">↗</span></a><RsvpForm /><a className="calendar-link" href="/solace.ics" download>ADD TO CALENDAR <span aria-hidden="true">+</span></a></div>
      </section>
      <footer><a className="small-wordmark" href="#">SOLACE</a><span>WED 04.11.26 / LAGOS</span><a href="#event-title">BACK TO TOP ↑</a></footer>
      <MusicPlayer />
    </main>
  )
}
export default App
