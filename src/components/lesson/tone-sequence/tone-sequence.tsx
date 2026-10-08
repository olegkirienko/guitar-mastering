import { Button } from '@/components/base/buttons/button';
import type { ToneSequenceProps } from '@/components/lesson/tone-sequence/types';
import { useToneSequence } from '@/hooks/use-tone-sequence/use-tone-sequence';

export function ToneSequence({ sequences, stopLabel, audio, gain, gapMs = 600, onPlay }: ToneSequenceProps) {
  const sequence = useToneSequence({ audio, gain, gapMs });
  if (!audio.enabled) return null;
  return <div className="flex flex-wrap gap-3">
    {sequences.map((item) => <Button key={item.id} color="secondary" size="lg" onClick={() => { sequence.start(item.frequencies); onPlay?.(item.id); }}>{item.label}</Button>)}
    {sequence.playing && <Button color="tertiary" size="lg" onClick={sequence.stop}>{stopLabel}</Button>}
  </div>;
}
