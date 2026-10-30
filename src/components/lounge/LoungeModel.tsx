import { useEffect, useRef, useState } from 'react';
import { createLoungeScene } from './scene.js';
import type { LoungeScene, LoungeView } from './scene.js';
import './lounge.css';

const views: { id: LoungeView; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'curtain', label: 'Right curtain' },
  { id: 'stools', label: 'From the bar' }, { id: 'dj', label: 'From the DJ booth' },
  { id: 'lobby', label: 'Lobby' },
];

export function LoungeModel({ selected, onSelect }: { selected: number | null; onSelect: (id: number) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<LoungeScene | null>(null);
  const onSelectRef = useRef(onSelect);
  const [view, setView] = useState<LoungeView>('overview');
  const [labels, setLabels] = useState(true);
  const [ceiling, setCeiling] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    if (!stage.current) return;
    let errorFrame = 0;
    try {
      scene.current = createLoungeScene(stage.current, id => onSelectRef.current(id), setCeiling);
    } catch (cause) {
      errorFrame = requestAnimationFrame(() => setError(cause instanceof Error ? cause.message : 'The 3D room could not load. Choose a table from the list instead.'));
    }
    return () => { cancelAnimationFrame(errorFrame); scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.selectTable(selected); }, [selected]);
  return <div className="lounge-model">
    <div ref={stage} className="lounge-stage" aria-label="Interactive 0808 Lounge. Drag to orbit; use the table list for keyboard selection." />
    {error && <p className="lounge-error" role="alert">{error}</p>}
    <div className="lounge-plate"><h3>0808 Lounge</h3><p>Explore the room. Tap a gold table to select it.</p></div>
    <div className="lounge-controls" aria-label="Room controls">
      <div className="lounge-control-group">{views.map(item => <button type="button" key={item.id} aria-pressed={view === item.id} onClick={() => { setView(item.id); scene.current?.goTo(item.id); }}>{item.label}</button>)}</div>
      <div className="lounge-control-group"><button type="button" aria-pressed={labels} onClick={() => { setLabels(!labels); scene.current?.setLabels(!labels); }}>Labels</button><button type="button" aria-pressed={ceiling} onClick={() => { setCeiling(!ceiling); scene.current?.setCeiling(!ceiling); }}>Ceiling</button></div>
    </div>
  </div>;
}
