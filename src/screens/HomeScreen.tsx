import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import { TOTAL_ROUNDS } from '../game/colors';
import './HomeScreen.css';

export default function HomeScreen() {
  return (
    <section className="home-screen">
      <header className="screen-header">
        <h1 className="screen-title">סיימון</h1>
      </header>
      <p className="round-indicator">
        שלב <bdi>1</bdi> מתוך <bdi>{TOTAL_ROUNDS}</bdi>
      </p>
      {/* Status line keeps a fixed slot so the board never shifts between states */}
      <p className="status-line" aria-live="polite"></p>
      <SimonBoard />
      <div className="action-area">
        <PrimaryButton>התחל משחק</PrimaryButton>
      </div>
    </section>
  );
}
