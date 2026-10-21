import type { KeyboardEvent, PointerEvent } from 'react';
import { COLORS, type ColorId } from '../game/colors';
import './SimonBoard.css';

type Props = {
  litColor?: ColorId | null;
  dimmed?: boolean;
  disabled?: boolean;
  onPadDown?: (color: ColorId) => void;
  onPadUp?: () => void;
};

const isActivationKey = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ';

export default function SimonBoard({
  litColor = null,
  dimmed = false,
  disabled = true,
  onPadDown,
  onPadUp,
}: Props) {
  return (
    <div className={`simon-board${dimmed ? ' is-dimmed' : ''}`}>
      {COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          className={`simon-pad simon-pad--${color.id}${litColor === color.id ? ' is-lit' : ''}`}
          style={{ gridArea: color.gridArea, background: color.cssVar, color: color.cssVar }}
          aria-label={color.label}
          disabled={disabled}
          // Judge on pointerdown so touch gets instant light and sound (ADR-2)
          onPointerDown={(e: PointerEvent) => {
            e.preventDefault();
            onPadDown?.(color.id);
          }}
          onKeyDown={(e) => {
            if (!isActivationKey(e) || e.repeat) return;
            e.preventDefault();
            onPadDown?.(color.id);
          }}
          onKeyUp={(e) => {
            if (isActivationKey(e)) onPadUp?.();
          }}
        />
      ))}
      <div className="simon-center" aria-hidden="true" />
    </div>
  );
}
