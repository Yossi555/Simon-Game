import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { COLORS } from '../game/colors';

describe('App', () => {
  it('renders the home screen by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'שלב 1 מתוך 10'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    for (const label of ['ירוק', 'אדום', 'צהוב', 'כחול']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('navigates between home and about without losing the shell', async () => {
    const user = userEvent.setup();
    render(<App />);
    const homeTab = screen.getByRole('button', { name: 'בית' });
    const aboutTab = screen.getByRole('button', { name: 'אודות' });
    expect(homeTab).toHaveAttribute('aria-current', 'page');

    await user.click(aboutTab);
    expect(screen.getByRole('heading', { name: 'על המשחק' })).toBeInTheDocument();
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
    expect(aboutTab).toHaveAttribute('aria-current', 'page');
    expect(homeTab).not.toHaveAttribute('aria-current');

    await user.click(homeTab);
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(homeTab).toHaveAttribute('aria-current', 'page');
  });
});

describe('board layout', () => {
  it('places colors per the mockups: green TL, red TR, yellow BL, blue BR', () => {
    const areas = Object.fromEntries(COLORS.map((c) => [c.id, c.gridArea]));
    expect(areas).toEqual({ green: '1 / 1', red: '1 / 2', yellow: '2 / 1', blue: '2 / 2' });
  });
});
