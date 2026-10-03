import { useCallback, useEffect, useRef, useState } from 'react';
import { safeGain } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { toneDurationSeconds } from '@/data/lessons/stage-01-lesson-02-model/constants';

export type LessonAudioStatus = 'idle' | 'ready' | 'unavailable' | 'blocked';

export interface LessonTwoAudio {
  enabled: boolean;
  status: LessonAudioStatus;
  enable(): Promise<boolean>;
  playTone(frequency: number, gain: number): void;
  playPluck(frequency: number): void;
  stop(): void;
}

const attackSeconds = 0.02;
const releaseSeconds = 0.12;
const pluckSeconds = 1.1;

function createPluckedBuffer(context: AudioContext, frequency: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * pluckSeconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const delayLength = Math.max(2, Math.round(context.sampleRate / frequency));
  const delay = new Float32Array(delayLength);
  let seed = 0x5f3759df;
  for (let index = 0; index < delayLength; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    delay[index] = ((seed / 0xffffffff) * 2 - 1) * (1 - index / delayLength * 0.35);
  }
  let cursor = 0;
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    const current = delay[cursor];
    delay[cursor] = (current + previous) * 0.498;
    previous = current;
    cursor = (cursor + 1) % delayLength;
    samples[index] = current * Math.exp(-index / context.sampleRate * 2.3);
  }
  return buffer;
}

// Page-level audio for Lesson 2: opt-in, one sound at a time, soft attack and
// release, capped gain, and silence on hidden tab, step change, and unmount.
export function useLessonTwoAudio(
  audioEnabled: boolean,
  onEnabledChange: (enabled: boolean) => void,
  stopKey: string,
): LessonTwoAudio {
  const [status, setStatus] = useState<LessonAudioStatus>('idle');
  const context = useRef<AudioContext>(undefined);
  const source = useRef<AudioScheduledSourceNode>(undefined);
  const gainNode = useRef<GainNode>(undefined);
  const run = useRef(0);

  const getContext = useCallback((): AudioContext | undefined => {
    if (context.current && context.current.state !== 'closed') return context.current;
    if (!window.AudioContext) {
      setStatus('unavailable');
      return undefined;
    }
    try {
      context.current = new window.AudioContext();
      return context.current;
    } catch {
      setStatus('unavailable');
      return undefined;
    }
  }, []);

  const stop = useCallback(() => {
    run.current += 1;
    const activeContext = context.current;
    const activeSource = source.current;
    const activeGain = gainNode.current;
    source.current = undefined;
    gainNode.current = undefined;
    if (!activeContext || !activeSource || !activeGain) return;
    try {
      const now = activeContext.currentTime;
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setValueAtTime(Math.max(activeGain.gain.value, 0.0001), now);
      activeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      activeSource.stop(now + 0.05);
    } catch {
      // The source may already have ended.
    }
  }, []);

  const enable = useCallback(async () => {
    const activeContext = getContext();
    if (!activeContext) return false;
    try {
      await activeContext.resume();
      setStatus('ready');
      onEnabledChange(true);
      return true;
    } catch {
      setStatus('blocked');
      onEnabledChange(false);
      return false;
    }
  }, [getContext, onEnabledChange]);

  const play = useCallback(async (create: (activeContext: AudioContext) => AudioScheduledSourceNode, peak: number, duration: number) => {
    if (!audioEnabled) return;
    stop();
    const ticket = run.current;
    const activeContext = getContext();
    if (!activeContext) return;
    try {
      if (activeContext.state === 'suspended') await activeContext.resume();
    } catch {
      setStatus('blocked');
      onEnabledChange(false);
      return;
    }
    if (ticket !== run.current) return;
    setStatus('ready');
    const node = create(activeContext);
    const gain = activeContext.createGain();
    const now = activeContext.currentTime;
    const level = safeGain(peak);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + attackSeconds);
    gain.gain.setValueAtTime(level, now + duration - releaseSeconds);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    node.connect(gain).connect(activeContext.destination);
    node.onended = () => {
      node.disconnect();
      gain.disconnect();
      if (source.current === node) {
        source.current = undefined;
        gainNode.current = undefined;
      }
    };
    source.current = node;
    gainNode.current = gain;
    node.start(now);
    node.stop(now + duration + 0.02);
  }, [audioEnabled, getContext, onEnabledChange, stop]);

  const playTone = useCallback((frequency: number, gain: number) => {
    void play((activeContext) => {
      const oscillator = activeContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, activeContext.currentTime);
      return oscillator;
    }, gain, toneDurationSeconds);
  }, [play]);

  const playPluck = useCallback((frequency: number) => {
    void play((activeContext) => {
      const buffer = activeContext.createBufferSource();
      buffer.buffer = createPluckedBuffer(activeContext, frequency);
      return buffer;
    }, 0.1, pluckSeconds);
  }, [play]);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => document.removeEventListener('visibilitychange', stopWhenHidden);
  }, [stop]);

  useEffect(() => stop, [stopKey, stop]);

  useEffect(() => () => {
    stop();
    void context.current?.close();
  }, [stop]);

  useEffect(() => {
    if (!audioEnabled) stop();
  }, [audioEnabled, stop]);

  return { enabled: audioEnabled, status, enable, playTone, playPluck, stop };
}
