export type LoungeView = 'overview' | 'curtain' | 'stools' | 'dj' | 'lobby';
export interface LoungeScene {
  selectTable(id: number | null): void;
  goTo(view: LoungeView): void;
  setCeiling(visible: boolean): void;
  setLabels(visible: boolean): void;
  dispose(): void;
}
export function createLoungeScene(stage: HTMLDivElement, onSelect: (id: number) => void, onCeilingChange: (visible: boolean) => void): LoungeScene;
