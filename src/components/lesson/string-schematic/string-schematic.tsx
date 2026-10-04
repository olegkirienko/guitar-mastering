import { densityLevels, tensionLevels } from '@/data/lessons/stage-01-lesson-03-model/constants';
import type { StringSettings } from '@/data/lessons/stage-01-lesson-03-model/types';

const nutX = 14;
const bridgeX = 306;

// Decorative: the vibrating part follows the length, the line thickens with weight,
// and a tighter string bulges less under the same push.
export function StringSchematic({ settings }: { settings: StringSettings }) {
  const startX = bridgeX - (bridgeX - nutX) * settings.length;
  const bulge = 14 - tensionLevels.indexOf(settings.tension) * 3;
  const width = 1.5 + densityLevels.indexOf(settings.density) * 1.5;
  const middleX = (startX + bridgeX) / 2;
  return <svg viewBox="0 0 320 56" className="h-auto w-full max-w-md" aria-hidden="true">
    <g className="text-fg-tertiary">
      <line x1={nutX} y1="12" x2={nutX} y2="44" stroke="currentColor" strokeWidth="4" />
      <line x1={bridgeX} y1="12" x2={bridgeX} y2="44" stroke="currentColor" strokeWidth="4" />
    </g>
    <path d={`M${startX} 28 Q${middleX} ${28 - bulge * 2} ${bridgeX} 28 Q${middleX} ${28 + bulge * 2} ${startX} 28 Z`} className="text-fg-brand-primary" fill="currentColor" opacity="0.15" />
    <line x1={nutX} y1="28" x2={bridgeX} y2="28" className="text-fg-primary" stroke="currentColor" strokeWidth={width} />
    {settings.length < 1 && <circle cx={startX} cy="28" r="7" className="text-fg-brand-primary" fill="currentColor" />}
  </svg>;
}
