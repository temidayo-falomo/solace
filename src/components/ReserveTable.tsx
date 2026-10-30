import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { LoungeModel } from './lounge/LoungeModel';
import './reserve.css';
import { RsvpForm } from './RsvpForm';

import { TABLE_SECTIONS as sections } from "../data/tables";

export function ReserveTable() {
  const [selected, setSelected] = useState<number | null>(() => {
    const section = Number(new URLSearchParams(window.location.search).get("section"));
    return sections.some(item => item.id === section) ? section : null;
  });
  const sheet = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const section = sections.find(s => s.id === selected);
  function select(id: number) {
    flushSync(() => setSelected(id));
    if (!sheet.current?.open) sheet.current?.showModal();
    form.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }
  return <main className="reserve-page">
    <header className="reserve-nav"><a className="wordmark" href="/" aria-label="Solace home">SOLACE</a><a href="/">← Back to Solace</a><button className="open-table-sheet" type="button" aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>{selected ? `Section ${selected} ↗` : 'Choose a section ↗'}</button></header>
    <div className="reserve-layout">
      <section className="room-panel" aria-label="0808 Lounge section selection"><LoungeModel selected={selected} onSelect={select} /></section>
      <dialog ref={sheet} className="table-sheet" aria-labelledby="table-sheet-title" onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
      <aside className="reservation-panel"><button type="button" className="close-table-sheet" aria-label="Close section details" onClick={() => sheet.current?.close()}>✕</button><p className="section-label">0808 LOUNGE / SECTIONS</p><h1 id="table-sheet-title">Find your<br /><em>Solace.</em></h1><p className="reserve-help">Choose your section.</p>
        <div className="table-sections">{sections.map(s => <div className="table-section" key={s.id}><div><strong>Section {s.id}</strong><small>{s.side} side</small></div><div className="table-buttons"><button type="button" aria-label={`Choose section ${s.id}, ${s.side} side`} aria-pressed={selected === s.id} onClick={() => select(s.id)}>{String(s.id).padStart(2, '0')}</button></div></div>)}</div>
        <div className="selection-summary" aria-live="polite"><small>YOUR SECTION</small><strong>{selected ? `Section ${selected}` : 'Pick your spot ↗'}</strong><span>{section ? `Section ${section.id} · ${section.side} side` : '9 sections. Find your favourite.'}</span></div>
        <p className="booking-note">Sections are subject to availability.</p>
        {selected ? <div ref={form}><RsvpForm section={selected} /></div> : <p className="reserve-help">Choose a section to continue with your RSVP request.</p>}
      </aside></dialog>
    </div>
  </main>;
}
