import { TOTAL_ROUNDS, type ColorId } from './colors';

export type GameStatus = 'idle' | 'presenting' | 'awaitingInput' | 'won' | 'lost';

export type GameState = {
  status: GameStatus;
  sequence: ColorId[];
  // Round shown in the indicator, 1–10
  round: number;
  inputIndex: number;
  completedRounds: number;
  gameId: number;
  // Bumped on every new presentation; actions from an older one are ignored
  presentationId: number;
  // The end-of-game dialog appears only after RESULT_DELAY_MS
  resultShown: boolean;
};

export type GameAction =
  | { type: 'start'; firstColor: ColorId }
  | { type: 'showNextRound'; presentationId: number }
  | { type: 'presentationDone'; presentationId: number }
  | { type: 'press'; color: ColorId; nextColor: ColorId }
  | { type: 'revealResult'; gameId: number }
  | { type: 'dismiss' }
  // Temporary for Milestone 2: leaving to "About" cancels the game (replaced by pause in Milestone 3)
  | { type: 'abandon' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
  presentationId: 0,
  resultShown: false,
};

function backToIdle(state: GameState, presentationId: number): GameState {
  // Keep the counters so the next game gets fresh ids
  return { ...initialGameState, gameId: state.gameId, presentationId };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      if (state.status !== 'idle') return state;
      return {
        ...initialGameState,
        status: 'presenting',
        sequence: [action.firstColor],
        gameId: state.gameId + 1,
        presentationId: state.presentationId + 1,
      };

    case 'showNextRound':
      if (state.status !== 'presenting' || action.presentationId !== state.presentationId) {
        return state;
      }
      return { ...state, round: state.sequence.length };

    case 'presentationDone':
      if (state.status !== 'presenting' || action.presentationId !== state.presentationId) {
        return state;
      }
      return { ...state, status: 'awaitingInput', round: state.sequence.length, inputIndex: 0 };

    case 'press': {
      if (state.status !== 'awaitingInput') return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'lost' };
      }
      const nextIndex = state.inputIndex + 1;
      if (nextIndex < state.sequence.length) {
        return { ...state, inputIndex: nextIndex };
      }
      if (state.round >= TOTAL_ROUNDS) {
        return { ...state, status: 'won', completedRounds: TOTAL_ROUNDS, inputIndex: nextIndex };
      }
      // Round indicator stays on the completed round until showNextRound
      return {
        ...state,
        status: 'presenting',
        sequence: [...state.sequence, action.nextColor],
        completedRounds: state.round,
        inputIndex: 0,
        presentationId: state.presentationId + 1,
      };
    }

    case 'revealResult':
      if ((state.status !== 'won' && state.status !== 'lost') || action.gameId !== state.gameId) {
        return state;
      }
      return { ...state, resultShown: true };

    case 'dismiss':
      if (state.status !== 'won' && state.status !== 'lost') return state;
      return backToIdle(state, state.presentationId);

    case 'abandon':
      if (state.status !== 'presenting' && state.status !== 'awaitingInput') return state;
      return backToIdle(state, state.presentationId + 1);

    default:
      return state;
  }
}
