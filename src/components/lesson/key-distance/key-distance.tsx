import { useKeyDistance } from '@/components/lesson/key-distance/hooks/use-key-distance';
import type { KeyDistanceProps } from '@/components/lesson/key-distance/types';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { baseFrequency, lastKeyNumber } from '@/data/lessons/stage-02-lesson-02-model/constants';

const formatTones = (semitones: number) => String(semitones / 2).replace('.', ',');

export function KeyDistance({ content, keyRowLabel, keyLabel, audio, gain }: KeyDistanceProps) {
  const { pressed, distance, press } = useKeyDistance({ audio, gain });
  return <div className="space-y-3">
    <KeyRow label={keyRowLabel} count={lastKeyNumber + 1} base={baseFrequency} keyLabel={keyLabel} onPlay={press} highlighted={pressed} />
    <p role="status" className="font-medium text-primary">
      {distance === null ? content.explorerEmpty : content.distance(pressed[0], pressed[1], distance, formatTones(distance))}
    </p>
  </div>;
}
