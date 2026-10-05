import { fretPositions, pressedFingerX } from '@/components/lesson/same-string-diagram/constants';
import { useId } from 'react';

export function StringState({ pressed, label, highlightVibrating = false }: { pressed: boolean; label: string; highlightVibrating?: boolean }) {
  const labelId = useId();
  return <div className="max-w-md">
    <svg viewBox="0 0 320 56" className="h-auto w-full" role="img" aria-labelledby={labelId}>
      <g className="text-border-primary">
        <rect x="8" y="16" width="252" height="24" rx="4" fill="currentColor" opacity="0.35" />
        <path d="M260 8 Q300 8 312 28 Q300 48 260 48 Z" fill="currentColor" opacity="0.6" />
      </g>
      <g className="text-fg-tertiary">
        <line x1="14" y1="14" x2="14" y2="42" stroke="currentColor" strokeWidth="4" />
        {fretPositions.map((x) => <line key={x} x1={x} y1="16" x2={x} y2="40" stroke="currentColor" strokeWidth="2" />)}
      </g>
      <line x1="14" y1="28" x2="296" y2="28" className="text-fg-primary" stroke="currentColor" strokeWidth="1.5" />
      {highlightVibrating && <line x1={pressed ? pressedFingerX : 14} y1="28" x2="296" y2="28" className="text-fg-brand-primary" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.7" />}
      {pressed && <circle cx={pressedFingerX} cy="28" r="7" className="text-brand-tertiary" fill="currentColor" />}
    </svg>
    <p id={labelId} className="mt-1 text-sm text-secondary">{label}</p>
  </div>;
}
