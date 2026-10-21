import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { gameReducer, initialGameState } from './gameReducer';
import { randomColor } from './random';
import type { ColorId } from './colors';
import {
  GAP_MS,
  NEXT_ROUND_DELAY_MS,
  PRESS_MIN_MS,
  RESULT_DELAY_MS,
  ROUND_HOLD_MS,
  START_DELAY_MS,
  TONE_MS,
} from './timing';
import { playLoss, playWin, startTone, stopAll, unlockAudio } from '../audio/audioEngine';

const CONFETTI_COLORS = ['#00D26A', '#FF3B30', '#FFD600', '#00A3FF'];

type Press = { color: ColorId; startedAt: number; stopTone: () => void };

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [presentedColor, setPresentedColor] = useState<ColorId | null>(null);
  const [pressedColor, setPressedColor] = useState<ColorId | null>(null);
  const [audioError, setAudioError] = useState(false);
  const pressRef = useRef<Press | null>(null);
  const releaseTimer = useRef<number | undefined>(undefined);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { status, presentationId, gameId, resultShown } = state;
  const sequenceLength = state.sequence.length;
  const isNextRound = status === 'presenting' && sequenceLength > state.round;

  // Sequence playback; cleanup cancels every timer, light and tone at once
  useEffect(() => {
    if (status !== 'presenting') return;
    const abort = new AbortController();
    const timers: number[] = [];
    let stopTone: (() => void) | null = null;
    const sequence = stateRef.current.sequence;
    const at = (ms: number, fn: () => void) => {
      timers.push(
        window.setTimeout(() => {
          if (!abort.signal.aborted) fn();
        }, ms),
      );
    };

    let t = START_DELAY_MS;
    if (isNextRound) {
      at(ROUND_HOLD_MS, () => dispatch({ type: 'showNextRound', presentationId }));
      t = ROUND_HOLD_MS + NEXT_ROUND_DELAY_MS;
    }
    sequence.forEach((color, i) => {
      at(t, () => {
        setPresentedColor(color);
        stopTone = startTone(color);
      });
      at(t + TONE_MS, () => {
        setPresentedColor(null);
        stopTone?.();
        stopTone = null;
        if (i === sequence.length - 1) dispatch({ type: 'presentationDone', presentationId });
      });
      t += TONE_MS + GAP_MS;
    });

    return () => {
      abort.abort();
      timers.forEach((id) => window.clearTimeout(id));
      stopTone?.();
      stopAll();
      setPresentedColor(null);
    };
    // presentationId identifies one presentation; isNextRound is fixed for its lifetime
  }, [status, presentationId]);

  // End of game: message and end sound after RESULT_DELAY_MS
  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;
    const id = window.setTimeout(() => {
      dispatch({ type: 'revealResult', gameId });
      if (status === 'won') playWin();
      else playLoss();
    }, RESULT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [status, gameId]);

  // Confetti on a revealed win only; cleared when leaving that state
  useEffect(() => {
    if (status !== 'won' || !resultShown) return;
    void confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.45 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    return () => {
      confetti.reset();
    };
  }, [status, resultShown]);

  const releasePad = useCallback(() => {
    const press = pressRef.current;
    if (!press) return;
    pressRef.current = null;
    // Light and tone last at least PRESS_MIN_MS, or as long as the finger is down
    const remaining = Math.max(0, PRESS_MIN_MS - (performance.now() - press.startedAt));
    const finish = () => {
      press.stopTone();
      setPressedColor((c) => (c === press.color ? null : c));
    };
    window.clearTimeout(releaseTimer.current);
    if (remaining > 0) releaseTimer.current = window.setTimeout(finish, remaining);
    else finish();
  }, []);

  // The pad may turn disabled right after the press, so the release is caught on window
  useEffect(() => {
    window.addEventListener('pointerup', releasePad);
    window.addEventListener('pointercancel', releasePad);
    return () => {
      window.removeEventListener('pointerup', releasePad);
      window.removeEventListener('pointercancel', releasePad);
      window.clearTimeout(releaseTimer.current);
    };
  }, [releasePad]);

  const padDown = useCallback((color: ColorId) => {
    if (stateRef.current.status !== 'awaitingInput' || pressRef.current) return;
    window.clearTimeout(releaseTimer.current);
    setPressedColor(color);
    pressRef.current = { color, startedAt: performance.now(), stopTone: startTone(color) };
    dispatch({ type: 'press', color, nextColor: randomColor() });
  }, []);

  const startGame = useCallback(async () => {
    if (stateRef.current.status !== 'idle') return;
    const ok = await unlockAudio();
    setAudioError(!ok);
    if (ok) dispatch({ type: 'start', firstColor: randomColor() });
  }, []);

  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);

  const abandon = useCallback(() => {
    dispatch({ type: 'abandon' });
    stopAll();
  }, []);

  return {
    state,
    litColor: pressedColor ?? presentedColor,
    audioError,
    startGame,
    padDown,
    padUp: releasePad,
    dismiss,
    abandon,
  };
}

export type Game = ReturnType<typeof useGame>;
