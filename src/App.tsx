import { useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import './App.css';

export default function App() {
  // Both screens live in the same React tree: switching never reloads the page
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="app-shell">
      <main className="app-content">
        {screen === 'home' ? <HomeScreen /> : <AboutScreen />}
      </main>
      <NavBar active={screen} onNavigate={setScreen} />
    </div>
  );
}
