import { useState } from 'react';
import { LoungeModel } from './lounge/LoungeModel';
import './reserve.css';

import { TABLE_SECTIONS as sections } from "../data/tables";

export function ReserveTable() {
  const [selected, setSelected] = useState<number | null>(() => {
    const table = Number(new URLSearchParams(window.location.search).get("table"));
    return sections.some(section => section.tables.includes(table)) ? table : null;
  });
  const [copied, setCopied] = useState(false);
  const section = sections.find(s => selected !== null && s.tables.includes(selected));
  function select(id: number) {
    setSelected(id); setCopied(false);
  }
  async function copySelection() {
    try {
      await navigator.clipboard.writeText(`SOLACE · Wed 4 Nov 2026 · 0808 Lounge · Table ${selected} · Section ${section?.id} (${section?.side})`);
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <main className="reserve-page">
    <header className="reserve-nav"><a className="wordmark" href="/" aria-label="Solace home">SOLACE</a><a href="/">← Back to Solace</a><span>4 NOV 2026 / 0808 LAGOS</span></header>
    <div className="reserve-layout">
      <section className="room-panel" aria-labelledby="room-title"><div className="room-heading"><h2 id="room-title">01 / FIND YOUR SPOT</h2><span>INTERACTIVE 3D ROOM ↗</span></div><LoungeModel selected={selected} onSelect={select} /><div className="room-foot"><span><i /> SELECTABLE TABLE</span><span>Drag to explore · Pinch to zoom</span></div></section>
      <aside className="reservation-panel"><p className="section-label">02 / RESERVE A TABLE</p><h1>Find your<br /><em>Solace.</em></h1><p className="reserve-help">Tap a table in the room or choose a number below.</p>
        <div className="table-sections">{sections.map(s => <div className="table-section" key={s.id}><div><strong>Section {s.id}</strong><small>{s.side} side</small></div><div className="table-buttons">{s.tables.map(id => <button key={id} type="button" aria-label={`Table ${id}, section ${s.id}, ${s.side} side`} aria-pressed={selected === id} onClick={() => select(id)}>{String(id).padStart(2, '0')}</button>)}</div></div>)}</div>
        <div className="selection-summary" aria-live="polite"><small>YOUR TABLE</small><strong>{selected ? `Table ${String(selected).padStart(2, '0')}` : 'Pick your spot ↗'}</strong><span>{section ? `Section ${section.id} · ${section.side} side` : '20 tables. Find your favourite.'}</span></div>
        <p className="booking-note">Prices, guest capacities and availability are awaiting confirmation. Selecting a table does not hold or book it.</p><button className="reserve-action" disabled={!selected} onClick={copySelection}>{copied ? 'Selection copied ✓' : 'Copy table selection ↗'}</button><p className="reserve-help final-note">Reservations open once booking details are confirmed.</p>
      </aside>
    </div>
  </main>;
}
