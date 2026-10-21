import { useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';
import './App.css';

export default function App() {
  // Both screens live in the same React tree: switching never reloads the page
  const [screen, setScreen] = useState<Screen>('home');
  // Owned here so switching screens never unmounts the game state (ADR-2)
  const game = useGame();

  const navigate = (next: Screen) => {
    // Temporary for Milestone 2: leaving mid-game cancels it (real pause comes in Milestone 3)
    if (next === 'about') game.abandon();
    setScreen(next);
  };

  return (
    <div className="app-shell">
      <main className="app-content">
        {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      </main>
      <NavBar active={screen} onNavigate={navigate} />
    </div>
  );
}
