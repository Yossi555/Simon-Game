import './NavBar.css';

export type Screen = 'home' | 'about';

type Props = {
  active: Screen;
  onNavigate: (screen: Screen) => void;
};

const TABS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
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
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
