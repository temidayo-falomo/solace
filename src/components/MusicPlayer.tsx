import { useRef, useState } from "react";
import "./music-player.css";

export function MusicPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function togglePlayback() {
    const track = audio.current;
    if (!track) return;
    setError(false);
    if (!track.paused) {
      track.pause();
      return;
    }
    setPending(true);
    try {
      await track.play();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="music-player" aria-label="Site music">
      <audio
        ref={audio}
        src="/audio/darkest-secrets-episode-1.mp3"
        preload="none"
        loop
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError(true); }}
      />
      <button
        type="button"
        onClick={togglePlayback}
        disabled={pending}
        aria-label={`${playing ? "Pause" : "Play"} Darkest Secrets Episode 1 by Kemuel and Cupidszn, featuring Telz`}
        aria-pressed={playing}
      >
        <span className="music-player-control" aria-hidden="true">
          {playing ? (
            <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="m9 5 11 7-11 7z" /></svg>
          )}
        </span>
        <span className="music-player-credit">
          <strong>Darkest Secrets Episode 1</strong>
          <span>{pending ? "Loading…" : "Kemuel, Cupidszn ft. Telz"}</span>
        </span>
      </button>
      <span className="music-player-error" role="status">{error ? "Couldn't play. Try again." : ""}</span>
    </aside>
  );
}
