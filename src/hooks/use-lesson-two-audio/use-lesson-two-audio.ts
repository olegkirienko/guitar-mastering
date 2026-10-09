import { toneDurationSeconds } from '@/data/lessons/stage-01-lesson-02-model/constants';
import { safeGain } from '@/data/lessons/stage-01-lesson-02-model/utils/lab';
import { attackSeconds, pluckSeconds, releaseSeconds } from '@/hooks/use-lesson-two-audio/constants';
import type { LessonAudioStatus, LessonTwoAudio, PartialsSound } from '@/hooks/use-lesson-two-audio/types';
import { createPartialsBuffer } from '@/hooks/use-lesson-two-audio/utils/create-partials-buffer';
import { createPluckedBuffer } from '@/hooks/use-lesson-two-audio/utils/create-plucked-buffer';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  const playSweep = useCallback((from: number, to: number, seconds: number, gain: number) => {
    void play((activeContext) => {
      const oscillator = activeContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(from, activeContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(to, activeContext.currentTime + seconds);
      return oscillator;
    }, gain, seconds);
  }, [play]);

  const playPluck = useCallback((frequency: number, gain = 0.1) => {
    void play((activeContext) => {
      const buffer = activeContext.createBufferSource();
      buffer.buffer = createPluckedBuffer(activeContext, frequency);
      return buffer;
    }, gain, pluckSeconds);
  }, [play]);

  // Lesson 4: a sound given as its own partials, already normalized by the renderer.
  const playPartials = useCallback((sound: PartialsSound, gain = 0.1) => {
    void play((activeContext) => {
      const buffer = activeContext.createBufferSource();
      buffer.buffer = createPartialsBuffer(activeContext, sound);
      return buffer;
    }, gain, sound.durationSeconds);
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

  return { enabled: audioEnabled, status, enable, playTone, playSweep, playPluck, playPartials, stop };
}
