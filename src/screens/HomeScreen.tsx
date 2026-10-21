import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import ResultDialog from '../components/ResultDialog';
import { TOTAL_ROUNDS } from '../game/colors';
import type { Game } from '../game/useGame';
import './HomeScreen.css';

type Props = { game: Game };

export default function HomeScreen({ game }: Props) {
  const { state, litColor, audioError } = game;
  const { status } = state;
  const finished = status === 'won' || status === 'lost';

  let statusText = '';
  if (status === 'presenting') statusText = 'המשחק מציג את הרצף';
  else if (status === 'awaitingInput') statusText = 'התור שלך';

  return (
    <section className="home-screen">
      <header className="screen-header">
        <h1 className="screen-title">דיסקו גו</h1>
      </header>
      <p className="round-indicator">
        שלב <bdi>{state.round}</bdi> מתוך <bdi>{TOTAL_ROUNDS}</bdi>
      </p>
      {/* Status line keeps a fixed slot so the board never shifts between states */}
      {status === 'idle' && audioError ? (
        <p className="status-line status-line--error" role="alert">
          לא ניתן להפעיל את הצליל. לחץ שוב על "התחל משחק".
        </p>
      ) : (
        <p className="status-line" aria-live="polite">
          {statusText}
        </p>
      )}
      <div className="board-area">
        <SimonBoard
          litColor={litColor}
          dimmed={status === 'presenting' || finished}
          disabled={status !== 'awaitingInput'}
          onPadDown={game.padDown}
          onPadUp={game.padUp}
        />
        {finished && state.resultShown && (
          <ResultDialog
            outcome={status}
            completedRounds={state.completedRounds}
            onConfirm={game.dismiss}
          />
        )}
      </div>
      <div className="action-area">
        {status === 'idle' && (
          <PrimaryButton onClick={() => void game.startGame()}>התחל משחק</PrimaryButton>
        )}
        {status === 'presenting' && <p className="action-hint">המתן…</p>}
        {status === 'awaitingInput' && <p className="action-hint">הקש על הצבעים לפי הסדר</p>}
      </div>
    </section>
  );
}
