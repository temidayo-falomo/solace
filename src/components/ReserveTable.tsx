import { useRef, useState } from 'react';
import { LoungeModel } from './lounge/LoungeModel';
import './reserve.css';

import { TABLE_SECTIONS as sections } from "../data/tables";

export function ReserveTable() {
  const [selected, setSelected] = useState<number | null>(() => {
    const table = Number(new URLSearchParams(window.location.search).get("table"));
    return sections.some(section => section.tables.includes(table)) ? table : null;
  });
  const sheet = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const section = sections.find(s => selected !== null && s.tables.includes(selected));
  function select(id: number) {
    setSelected(id); setCopied(false); sheet.current?.showModal();
  }
  async function copySelection() {
    try {
      await navigator.clipboard.writeText(`SOLACE · Wed 4 Nov 2026 · 0808 Lounge · Table ${selected} · Section ${section?.id} (${section?.side})`);
      setCopied(true);
    } catch { setCopied(false); }
  }
  return <main className="reserve-page">
    <header className="reserve-nav"><a className="wordmark" href="/" aria-label="Solace home">SOLACE</a><a href="/">← Back to Solace</a><button className="open-table-sheet" type="button" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>{selected ? `Table ${String(selected).padStart(2, '0')} ↗` : 'Choose a table ↗'}</button></header>
    <div className="reserve-layout">
      <section className="room-panel" aria-label="0808 Lounge table selection"><LoungeModel selected={selected} onSelect={select} /></section>
      <dialog ref={sheet} className="table-sheet" aria-labelledby="table-sheet-title" onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
      <aside className="reservation-panel"><button type="button" className="close-table-sheet" aria-label="Close table details" onClick={() => sheet.current?.close()}>✕</button><p className="section-label">0808 LOUNGE / TABLES</p><h1 id="table-sheet-title">Find your<br /><em>Solace.</em></h1><p className="reserve-help">Tap a table in the room or choose a number below.</p>
        <div className="table-sections">{sections.map(s => <div className="table-section" key={s.id}><div><strong>Section {s.id}</strong><small>{s.side} side</small></div><div className="table-buttons">{s.tables.map(id => <button key={id} type="button" aria-label={`Table ${id}, section ${s.id}, ${s.side} side`} aria-pressed={selected === id} onClick={() => select(id)}>{String(id).padStart(2, '0')}</button>)}</div></div>)}</div>
        <div className="selection-summary" aria-live="polite"><small>YOUR TABLE</small><strong>{selected ? `Table ${String(selected).padStart(2, '0')}` : 'Pick your spot ↗'}</strong><span>{section ? `Section ${section.id} · ${section.side} side` : '20 tables. Find your favourite.'}</span></div>
        <p className="booking-note">Prices, guest capacities and availability are awaiting confirmation. Selecting a table does not hold or book it.</p><button className="reserve-action" disabled={!selected} onClick={copySelection}>{copied ? 'Selection copied ✓' : 'Copy table selection ↗'}</button><p className="reserve-help final-note">Reservations open once booking details are confirmed.</p>
      </aside></dialog>
    </div>
  </main>;
}
