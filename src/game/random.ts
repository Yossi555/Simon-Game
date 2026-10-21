import { COLOR_IDS, type ColorId } from './colors';

// Game-only randomness; repeats are allowed (ARCHITECTURE §2.3 rule 1)
export function randomColor(): ColorId {
  return COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)];
}
