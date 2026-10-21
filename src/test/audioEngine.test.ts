import { frequencyOf } from '../audio/audioEngine';
import { COLOR_IDS } from '../game/colors';

describe('audio engine', () => {
  it('gives each of the four colors a different pitch', () => {
    const freqs = COLOR_IDS.map(frequencyOf);
    expect(new Set(freqs).size).toBe(4);
  });
});
