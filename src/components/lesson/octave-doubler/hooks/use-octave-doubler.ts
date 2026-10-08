import { useState } from 'react';
import { maxFrequency } from '@/data/lessons/stage-02-lesson-01-model/constants';
import { octaveOf } from '@/data/lessons/stage-02-lesson-01-model/utils/octave';
import type { OctaveDoublerProps, PredictionId } from '@/components/lesson/octave-doubler/types';

export function useOctaveDoubler({ content, audio, gain, onDone }: Pick<OctaveDoublerProps, 'content' | 'audio' | 'gain' | 'onDone'>) {
  const [frequency, setFrequency] = useState<number>(content.start);
  const [visited, setVisited] = useState<readonly number[]>([content.start]);
  // Session-only: the guess is asked before every press and never checked or saved.
  const [prediction, setPrediction] = useState<PredictionId | null>(null);
  const [doubled, setDoubled] = useState(false);
  const [halved, setHalved] = useState(false);
  const [listened, setListened] = useState(false);
  const [tripled, setTripled] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const up = octaveOf(frequency, 'up');
  const down = octaveOf(frequency, 'down');
  const triple = frequency * 3 <= maxFrequency ? frequency * 3 : null;

  // The step is done after one doubling, one halving and — with sound — one listening.
  const finish = (nextDoubled: boolean, nextHalved: boolean, nextListened: boolean) => {
    if (nextDoubled && nextHalved && (nextListened || !audio.enabled)) onDone();
  };

  const play = (next: number) => {
    if (!audio.enabled) return false;
    audio.playTone(next, gain);
    setListened(true);
    return true;
  };

  const change = (direction: 'up' | 'down') => {
    const next = octaveOf(frequency, direction);
    if (next === null) return;
    const nextDoubled = doubled || direction === 'up';
    const nextHalved = halved || direction === 'down';
    setFrequency(next);
    setVisited((current) => (current.includes(next) ? current : [...current, next].sort((a, b) => a - b)));
    setDoubled(nextDoubled);
    setHalved(nextHalved);
    setTripled(null);
    setPrediction(null);
    setAnnouncement(content.changed(next));
    finish(nextDoubled, nextHalved, listened || play(next));
  };

  const tryTriple = () => {
    if (triple === null) return;
    setTripled(triple);
    setPrediction(null);
    play(triple);
  };

  const listen = () => {
    audio.playTone(frequency, gain);
    setListened(true);
    finish(doubled, halved, true);
  };

  const reset = () => {
    setFrequency(content.start);
    setTripled(null);
    setPrediction(null);
    setAnnouncement(content.changed(content.start));
  };

  return { frequency, visited, prediction, setPrediction, tripled, announcement, canDouble: up !== null, canHalve: down !== null, canTriple: triple !== null, double: () => change('up'), halve: () => change('down'), tryTriple, listen, reset };
}
