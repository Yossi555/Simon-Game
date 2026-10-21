import { COLORS, type ColorId } from '../game/colors';

type Voice = { osc: OscillatorNode; gain: GainNode; startedAt: number };
type VoiceOptions = { type?: OscillatorType; when?: number; durationS?: number; volume?: number };

const ATTACK_S = 0.01;
const RELEASE_S = 0.02;
const VOLUME = 0.3;

let ctx: AudioContext | null = null;
const active = new Set<Voice>();

export function frequencyOf(color: ColorId): number {
  return COLORS.find((c) => c.id === color)!.frequency;
}

// Must be called from a user gesture (autoplay policy). Never pretend audio works if it does not.
export async function unlockAudio(): Promise<boolean> {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      ctx = new Ctor();
    }
    if (ctx.state !== 'running') await ctx.resume();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

// Starts a tone `when` seconds from now. With `durationS` it stops itself on the audio clock;
// otherwise the returned function fades it out.
function startVoice(
  frequency: number,
  { type = 'triangle', when = 0, durationS, volume = VOLUME }: VoiceOptions = {},
): Voice | null {
  if (!ctx) return null;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  // Short envelope to avoid clicks
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + ATTACK_S);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  const voice = { osc, gain, startedAt: start };
  active.add(voice);
  osc.onended = () => {
    active.delete(voice);
    gain.disconnect();
  };
  if (durationS !== undefined) {
    gain.gain.setValueAtTime(volume, start + durationS - RELEASE_S);
    gain.gain.linearRampToValueAtTime(0, start + durationS);
    osc.stop(start + durationS);
  }
  return voice;
}

function stopVoice(voice: Voice, at: number) {
  try {
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, at);
    voice.gain.gain.linearRampToValueAtTime(0, at + RELEASE_S);
    voice.osc.stop(at + RELEASE_S);
  } catch {
    // Already stopped
  }
}

export function startTone(color: ColorId): () => void {
  const voice = startVoice(frequencyOf(color));
  let stopped = false;
  return () => {
    if (stopped || !voice || !ctx) return;
    stopped = true;
    stopVoice(voice, Math.max(ctx.currentTime, voice.startedAt + ATTACK_S));
  };
}

// Rising arpeggio C5–E5–G5–C6
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    startVoice(f, { when: i * 0.15, durationS: i === notes.length - 1 ? 0.6 : 0.14 });
  });
}

// Low falling buzz
export function playLoss() {
  const voice = startVoice(196, { type: 'sawtooth', durationS: 0.7, volume: 0.18 });
  if (voice && ctx) voice.osc.frequency.linearRampToValueAtTime(98, ctx.currentTime + 0.7);
}

export function stopAll() {
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const voice of active) stopVoice(voice, now);
}
