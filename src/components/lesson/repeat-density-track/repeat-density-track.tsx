import { visualCycles } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';

// Schematic repeats: density follows the value, the line height never changes.
export function RepeatDensityTrack({ frequency }: { frequency: number }) {
  const cycles = visualCycles(frequency);
  const points = Array.from({ length: 161 }, (_, index) => {
    const x = (index / 160) * 300 + 10;
    const y = 24 - Math.sin((index / 160) * cycles * 2 * Math.PI) * 14;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return <svg viewBox="0 0 320 48" className="h-auto w-full max-w-md" aria-hidden="true">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600" />
  </svg>;
}
