import type { ReactNode } from 'react';
import './NavBar.css';

export type Screen = 'home' | 'about';

type Props = {
  active: Screen;
  onNavigate: (screen: Screen) => void;
};

// Simple line icons, secondary to the Hebrew labels (DESIGN §2.3)
const HomeIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9v11h13V9" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

const InfoIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <circle cx="12" cy="7.5" r="0.6" className="navbar-icon-dot" />
  </svg>
);

const TABS: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'בית', icon: HomeIcon },
  { id: 'about', label: 'אודות', icon: InfoIcon },
];

export default function NavBar({ active, onNavigate }: Props) {
  return (
    <nav className="navbar" aria-label="ניווט ראשי">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="navbar-tab"
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onNavigate(tab.id)}
        >
          <span className="navbar-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
