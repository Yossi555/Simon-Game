import { COLORS, type ColorId } from '../game/colors';
import './SimonBoard.css';

type Props = {
  // Reserved for Milestone 2 (highlight / dimmed states)
  activeColor?: ColorId | null;
  dimmed?: boolean;
};

export default function SimonBoard({ activeColor = null, dimmed = false }: Props) {
  return (
    <div className={`simon-board${dimmed ? ' is-dimmed' : ''}`}>
      {COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={`simon-pad simon-pad--${color.id}${activeColor === color.id ? ' is-active' : ''}`}
          style={{ gridArea: color.gridArea, background: color.cssVar }}
          aria-label={color.label}
        />
      ))}
      <div className="simon-center" aria-hidden="true" />
    </div>
  );
}
