import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
import App from '../App';
import * as audio from '../audio/audioEngine';
import { randomColor } from '../game/random';
import type { ColorId } from '../game/colors';

vi.mock('../audio/audioEngine', () => ({
  unlockAudio: vi.fn(async () => true),
  startTone: vi.fn(() => vi.fn()),
  playWin: vi.fn(),
  playLoss: vi.fn(),
  stopAll: vi.fn(),
}));
vi.mock('../game/random', () => ({ randomColor: vi.fn(() => 'red') }));
vi.mock('canvas-confetti', () => {
  const fn = vi.fn(async () => undefined) as unknown as typeof confetti & { reset: () => void };
  fn.reset = vi.fn();
  return { default: fn };
});

const LABELS: Record<ColorId, string> = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' };

const pad = (c: ColorId) => screen.getByRole('button', { name: LABELS[c] });
const isLit = (c: ColorId) => pad(c).classList.contains('is-lit');
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const resultDetail = () => document.querySelector('.result-detail')?.textContent;
const roundText = () => screen.getByText((_, el) => el?.classList.contains('round-indicator') ?? false).textContent;

async function clickStart() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

function press(c: ColorId) {
  act(() => {
    fireEvent.pointerDown(pad(c));
    fireEvent.pointerUp(window);
  });
  advance(300);
}

// Presentation length for a sequence of n colors (600ms lit + 250ms gap)
const playMs = (n: number) => n * 850 - 250;

function renderApp() {
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(randomColor).mockReturnValue('red');
  vi.mocked(audio.unlockAudio).mockResolvedValue(true);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('game flow', () => {
  it('presents the first color after 1000ms for 600ms, with input blocked', async () => {
    renderApp();
    await clickStart();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(pad('red')).toBeDisabled();
    advance(999);
    expect(isLit('red')).toBe(false);
    advance(1);
    expect(isLit('red')).toBe(true);
    expect(audio.startTone).toHaveBeenCalledWith('red');
    advance(599);
    expect(isLit('red')).toBe(true);
    advance(1);
    expect(isLit('red')).toBe(false);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.getByText('הקש על הצבעים לפי הסדר')).toBeInTheDocument();
    expect(pad('red')).toBeEnabled();
  });

  it('ignores presses while the sequence is presented', async () => {
    renderApp();
    await clickStart();
    advance(1000);
    act(() => {
      fireEvent.pointerDown(pad('blue'));
      fireEvent.pointerUp(window);
    });
    advance(600);
    // Wrong color pressed during presentation, yet the game continues normally
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(audio.startTone).toHaveBeenCalledTimes(1);
  });

  it('keeps a constant pace and holds the completed round for 1000ms', async () => {
    renderApp();
    await clickStart();
    advance(1000 + playMs(1));
    press('red'); // round 1 done (300ms elapsed inside press)
    expect(roundText()).toBe('שלב 1 מתוך 10');
    advance(700); // 1000ms after the press
    expect(roundText()).toBe('שלב 2 מתוך 10');
    advance(999);
    expect(isLit('red')).toBe(false);
    advance(1);
    expect(isLit('red')).toBe(true);
    // Same 600 / 250 rhythm in round 2
    advance(600);
    expect(isLit('red')).toBe(false);
    advance(249);
    expect(isLit('red')).toBe(false);
    advance(1);
    expect(isLit('red')).toBe(true);
    advance(600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('loses at round 1: pad tone at once, loss message and sound after 1000ms, no confetti', async () => {
    renderApp();
    await clickStart();
    advance(1000 + playMs(1));
    act(() => {
      fireEvent.pointerDown(pad('blue'));
    });
    expect(audio.startTone).toHaveBeenLastCalledWith('blue');
    expect(isLit('blue')).toBe(true);
    expect(pad('red')).toBeDisabled();
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
    act(() => void fireEvent.pointerUp(window));
    advance(999);
    expect(audio.playLoss).not.toHaveBeenCalled();
    advance(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(resultDetail()).toBe('השלמת 0 שלבים');
    expect(audio.playLoss).toHaveBeenCalledTimes(1);
    expect(audio.playWin).not.toHaveBeenCalled();
    expect(confetti).not.toHaveBeenCalled();
  });

  it('loses at a later round and reports the completed rounds', async () => {
    renderApp();
    await clickStart();
    advance(1000 + playMs(1));
    press('red');
    advance(1700 + playMs(2));
    press('red');
    press('red');
    advance(1700 + playMs(3));
    press('red');
    press('green');
    advance(1000);
    expect(resultDetail()).toBe('השלמת 2 שלבים');
    expect(roundText()).toBe('שלב 3 מתוך 10');
  });

  it('wins after round 10 with sound and confetti, and there is no round 11', async () => {
    renderApp();
    await clickStart();
    advance(1000 + playMs(1));
    for (let round = 1; round <= 10; round++) {
      for (let i = 0; i < round; i++) press('red');
      if (round < 10) advance(1700 + playMs(round + 1));
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(700);
    expect(screen.getByText('ניצחת!', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(roundText()).toBe('שלב 10 מתוך 10');
    advance(10000);
    expect(roundText()).toBe('שלב 10 מתוך 10');
    expect(pad('red')).toBeDisabled();
  });

  it('"אישור" returns to the start state and a new game uses a new random sequence', async () => {
    renderApp();
    await clickStart();
    advance(1000 + playMs(1));
    press('blue');
    advance(700);
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'אישור' })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(roundText()).toBe('שלב 1 מתוך 10');
    expect(pad('red')).toBeDisabled();

    vi.mocked(randomColor).mockReturnValue('yellow');
    await clickStart();
    advance(1000);
    expect(isLit('yellow')).toBe(true);
  });

  it('shows a message and does not start when audio cannot start', async () => {
    vi.mocked(audio.unlockAudio).mockResolvedValue(false);
    renderApp();
    await clickStart();
    expect(screen.getByRole('alert')).toHaveTextContent('לא ניתן להפעיל את הצליל');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    advance(5000);
    expect(audio.startTone).not.toHaveBeenCalled();

    vi.mocked(audio.unlockAudio).mockResolvedValue(true);
    await clickStart();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['while presenting', 1300],
    ['during the player turn', 1000 + playMs(1) + 300],
  ])('leaving to "About" %s leaves no light, sound or timer behind', async (_, ms) => {
    renderApp();
    await clickStart();
    advance(ms);
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'אודות' })));
    expect(audio.stopAll).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'בית' })));
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(roundText()).toBe('שלב 1 מתוך 10');
    expect(document.querySelector('.is-lit')).toBeNull();
  });

  it('does not persist anything and a fresh mount starts idle', async () => {
    const { unmount } = render(<App />);
    await clickStart();
    advance(1000 + playMs(1));
    press('red');
    unmount();
    expect(localStorage.length).toBe(0);
    render(<App />);
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(roundText()).toBe('שלב 1 מתוך 10');
  });
});
