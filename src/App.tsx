import { lazy, Suspense } from "react";
import "./App.css";
import { MusicPlayer } from "./components/MusicPlayer";
import { RsvpForm } from "./components/RsvpForm";

const ReserveTable = lazy(() =>
  import("./components/ReserveTable").then((module) => ({
    default: module.ReserveTable,
  })),
);

function App() {
  if (
    window.location.pathname.replace(/\/$/, "") === "/reserve-table" ||
    window.location.pathname.replace(/\/$/, "") === "/reserve-section"
  ) {
    return (
      <>
        <Suspense
          fallback={<main className="room-loader">Loading the lounge…</main>}
        >
          <ReserveTable />
        </Suspense>
        <MusicPlayer />
      </>
    );
  }
  return (
    <main className="landing">
      <div className="grain" aria-hidden="true" />
      <header className="site-nav">
        <a href="#" className="small-wordmark" aria-label="Solace home">
          SOLACE
        </a>
        <span className="nav-caption">A LITTLE ESCAPE. A LATE NIGHT.</span>
        <a className="nav-rsvp" href="#rsvp">
          RSVP to join the guestlist <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" aria-labelledby="event-title">
        <div className="hero-eyebrow">
          <span>LAGOS, LET’S GET TOGETHER.</span>
          <span>THE SEASON GUESTLIST</span>
        </div>
        <h1 id="event-title">SOLACE</h1>
        <div className="event-strip">
          <span>First access to everything we drop this season.</span>
        </div>
        <div className="hero-art">
          <img
            src="/solace-artwork.webp"
            width="1054"
            height="823"
            alt="Black-and-white vintage collage with a reclining woman on a vivid pink sofa, from the Solace event poster."
            fetchPriority="high"
          />
          <a className="art-cta" href="#rsvp">
            <span>
              RSVP to join the guestlist
            </span>
            <span className="round-arrow" aria-hidden="true">
              ↘
            </span>
          </a>
          <span className="art-caption">
            GOOD COMPANY. GREAT MUSIC. SOLACE.
          </span>
        </div>
      </section>

      <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
        <div className="rsvp-copy">
          <p className="section-kicker">JOIN THE SEASON GUESTLIST.</p>
          <h2 id="rsvp-title">
            FIND YOUR
            <br />
            <span>SOLACE.</span>
          </h2>
          <p>First access to everything we drop this season.</p>
        </div>
        <div className="rsvp-details">
          <p>Join our season interest pool for first access to future RSVPs and ticket drops.</p>
          <RsvpForm />
        </div>
      </section>
      <footer>
        <a className="small-wordmark" href="#">
          SOLACE
        </a>
        <span>THIS SEASON / LAGOS</span>
        <a href="#event-title">BACK TO TOP ↑</a>
      </footer>
      <MusicPlayer />
    </main>
  );
}
export default App;
