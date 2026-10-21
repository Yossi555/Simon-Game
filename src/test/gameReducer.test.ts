import { gameReducer, initialGameState, type GameState } from '../game/gameReducer';
import type { ColorId } from '../game/colors';

const started = (first: ColorId = 'red') =>
  gameReducer(initialGameState, { type: 'start', firstColor: first });

const done = (s: GameState) =>
  gameReducer(s, { type: 'presentationDone', presentationId: s.presentationId });

// Plays the whole current sequence correctly, appending `next` on round completion
function playRound(s: GameState, next: ColorId = 'green'): GameState {
  let state = done(s);
  for (const color of state.sequence) {
    state = gameReducer(state, { type: 'press', color, nextColor: next });
  }
  return state;
}

describe('gameReducer', () => {
  it('starts with a one-color sequence at round 1', () => {
    const s = started('blue');
    expect(s).toMatchObject({ status: 'presenting', sequence: ['blue'], round: 1, completedRounds: 0 });
  });

  it('adds exactly one color per round, keeping the previous sequence as a prefix', () => {
    let s = started('red');
    const lengths = [s.sequence.length];
    for (let i = 0; i < 9; i++) {
      const prev = s.sequence;
      s = playRound(s, 'red');
      expect(s.sequence.slice(0, prev.length)).toEqual(prev);
      lengths.push(s.sequence.length);
    }
    expect(lengths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // Repeats of the same color are allowed
    expect(s.sequence.every((c) => c === 'red')).toBe(true);
  });

  it('keeps the completed round on the indicator until showNextRound', () => {
    const s = playRound(started());
    expect(s).toMatchObject({ status: 'presenting', round: 1, completedRounds: 1 });
    const next = gameReducer(s, { type: 'showNextRound', presentationId: s.presentationId });
    expect(next.round).toBe(2);
  });

  it('ignores presses outside the player turn', () => {
    const presenting = started();
    expect(gameReducer(presenting, { type: 'press', color: 'red', nextColor: 'red' })).toBe(presenting);
    expect(gameReducer(initialGameState, { type: 'press', color: 'red', nextColor: 'red' })).toBe(
      initialGameState,
    );
  });

  it('advances the input index on a correct press', () => {
    let s = playRound(started('red'), 'blue');
    s = done(s);
    s = gameReducer(s, { type: 'press', color: 'red', nextColor: 'green' });
    expect(s).toMatchObject({ status: 'awaitingInput', inputIndex: 1 });
  });

  it('loses at round 1 with 0 completed rounds', () => {
    const s = gameReducer(done(started('red')), { type: 'press', color: 'blue', nextColor: 'red' });
    expect(s).toMatchObject({ status: 'lost', completedRounds: 0, round: 1 });
    // No second chance
    expect(gameReducer(s, { type: 'press', color: 'red', nextColor: 'red' })).toBe(s);
  });

  it('loses at a later round with round - 1 completed', () => {
    let s = started('red');
    s = playRound(s, 'green');
    s = gameReducer(s, { type: 'showNextRound', presentationId: s.presentationId });
    s = playRound(s, 'yellow');
    s = done(s); // round 3: red, green, yellow
    s = gameReducer(s, { type: 'press', color: 'red', nextColor: 'red' });
    s = gameReducer(s, { type: 'press', color: 'blue', nextColor: 'red' });
    expect(s).toMatchObject({ status: 'lost', round: 3, completedRounds: 2 });
  });

  it('wins after completing round 10 and never reaches round 11', () => {
    let s = started();
    for (let i = 0; i < 9; i++) s = playRound(s);
    expect(s.sequence).toHaveLength(10);
    s = playRound(s);
    expect(s).toMatchObject({ status: 'won', completedRounds: 10, round: 10 });
    expect(s.sequence).toHaveLength(10);
  });

  it('ignores actions from a stale presentation', () => {
    const s = started();
    const stale = s.presentationId - 1;
    expect(gameReducer(s, { type: 'presentationDone', presentationId: stale })).toBe(s);
    expect(gameReducer(s, { type: 'showNextRound', presentationId: stale })).toBe(s);
  });

  it('reveals the result only for the current game', () => {
    const lost = gameReducer(done(started('red')), { type: 'press', color: 'blue', nextColor: 'red' });
    expect(gameReducer(lost, { type: 'revealResult', gameId: lost.gameId - 1 })).toBe(lost);
    expect(gameReducer(lost, { type: 'revealResult', gameId: lost.gameId }).resultShown).toBe(true);
  });

  it('dismiss returns to idle and the next game gets a new id and sequence', () => {
    const lost = gameReducer(done(started('red')), { type: 'press', color: 'blue', nextColor: 'red' });
    const idle = gameReducer(lost, { type: 'dismiss' });
    expect(idle).toMatchObject({ status: 'idle', sequence: [], round: 1, resultShown: false });
    const next = gameReducer(idle, { type: 'start', firstColor: 'yellow' });
    expect(next.gameId).toBe(lost.gameId + 1);
    expect(next.sequence).toEqual(['yellow']);
  });

  it('abandon cancels only an active game', () => {
    const s = started();
    const abandoned = gameReducer(s, { type: 'abandon' });
    expect(abandoned).toMatchObject({ status: 'idle', sequence: [] });
    expect(abandoned.presentationId).toBe(s.presentationId + 1);
    const lost = gameReducer(done(s), { type: 'press', color: 'blue', nextColor: 'red' });
    expect(gameReducer(lost, { type: 'abandon' })).toBe(lost);
    expect(gameReducer(initialGameState, { type: 'abandon' })).toBe(initialGameState);
  });
});
