export type ColorId = 'green' | 'red' | 'yellow' | 'blue';

export type SimonColor = {
  id: ColorId;
  label: string;
  cssVar: string;
  gridArea: string;
  // Tone pitch in Hz, inspired by the original Simon device
  frequency: number;
};

// Spatial layout from the mockups (DESIGN.md §1.1); it must not flip in RTL
export const COLORS: readonly SimonColor[] = [
  { id: 'green', label: 'ירוק', cssVar: 'var(--green)', gridArea: '1 / 1', frequency: 415 },
  { id: 'red', label: 'אדום', cssVar: 'var(--red)', gridArea: '1 / 2', frequency: 310 },
  { id: 'yellow', label: 'צהוב', cssVar: 'var(--yellow)', gridArea: '2 / 1', frequency: 252 },
  { id: 'blue', label: 'כחול', cssVar: 'var(--blue)', gridArea: '2 / 2', frequency: 209 },
];

export const TOTAL_ROUNDS = 10;

export const COLOR_IDS: readonly ColorId[] = COLORS.map((c) => c.id);
