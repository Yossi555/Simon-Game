import { useEffect, useRef } from 'react';
import PrimaryButton from './PrimaryButton';
import './ResultDialog.css';

type Props = {
  outcome: 'won' | 'lost';
  completedRounds: number;
  onConfirm: () => void;
};

function completedText(n: number) {
  return n === 1 ? (
    'השלמת שלב אחד'
  ) : (
    <>
      השלמת <bdi>{n}</bdi> שלבים
    </>
  );
}

export default function ResultDialog({ outcome, completedRounds, onConfirm }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className="result-scrim">
      <div
        className="result-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        {outcome === 'won' ? (
          <h2 id="result-title" className="result-title">
            <span className="result-title--cheer">כל הכבוד!</span> ניצחת!
          </h2>
        ) : (
          <>
            <h2 id="result-title" className="result-title result-title--lost">
              נפסלת!
            </h2>
            <p className="result-detail">{completedText(completedRounds)}</p>
          </>
        )}
        <PrimaryButton ref={buttonRef} onClick={onConfirm}>
          אישור
        </PrimaryButton>
      </div>
    </div>
  );
}
