import { motionFrames } from '@/components/lesson/virtual-guitar-string/constants';
import type { AudioStatus, StringState, VirtualGuitarStringProps } from '@/components/lesson/virtual-guitar-string/types';
import { createPluckedStringBuffer } from '@/components/lesson/virtual-guitar-string/utils/plucked-string';
import { useEffect, useRef, useState } from 'react';

export function useVirtualGuitarString({ predictionChoices, audioEnabled, staticMode, onAudioEnabledChange, onExperimentComplete }: Pick<VirtualGuitarStringProps, 'predictionChoices' | 'audioEnabled' | 'staticMode' | 'onAudioEnabledChange' | 'onExperimentComplete'>) {
  const [stringState, setStringState] = useState<StringState>('rest');
  const [elapsed, setElapsed] = useState(0);
  const [hasPlucked, setHasPlucked] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);
  const [predictionId, setPredictionId] = useState<string>();
  const [experimentStarted, setExperimentStarted] = useState(false);
  const [slow, setSlow] = useState(false);
  const [frameIndex, setFrameIndex] = useState(motionFrames.length - 1);
  const [observationAttempts, setObservationAttempts] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const animationStart = useRef<number | undefined>(undefined);
  const animationFrame = useRef<number | undefined>(undefined);
  const gestureStarted = useRef(false);
  const audioContext = useRef<AudioContext | undefined>(undefined);
  const activeSource = useRef<AudioBufferSourceNode | undefined>(undefined);
  const activeGain = useRef<GainNode | undefined>(undefined);
  const audioRun = useRef(0);

  const isMoving = stringState === 'playing' && !staticMode;
  const frame = motionFrames[frameIndex];
  const cycleDuration = slow ? 6400 : 3200;
  const amplitude = Math.max(0, 30 * (1 - elapsed / cycleDuration));
  const offset = stringState === 'stopped' || stringState === 'rest' ? 0 : staticMode ? frame.offset : Math.sin(elapsed / (slow ? 210 : 105)) * amplitude;
  const isStopAvailable = experimentStarted && (stringState === 'playing' || (staticMode && stringState === 'paused'));
  const predictionLabel = predictionChoices.find((choice) => choice.id === predictionId)?.label;
  const visualDescription = stringState === 'stopped'
    ? 'Струна зупинена й лежить на прямій звичного положення.'
    : staticMode
      ? `${frame.label} Покадровий режим показує нерухомий кадр руху.`
      : stringState === 'playing'
        ? 'Струна рухається туди-назад і поступово заспокоюється.'
        : stringState === 'paused'
          ? 'Показ на паузі: струна зафіксована в поточному положенні.'
          : 'Струна у спокої між двома опорами.';
  const statusText = stringState === 'stopped'
    ? 'Струну зупинено — вона повернулася до звичного положення, а звук швидко стихає.'
    : staticMode && stringState === 'paused'
      ? `${frame.label} Покадрова модель показує: поки струна рухається туди-назад, звук триває й поступово стихає.`
      : stringState === 'playing'
        ? 'Струна рухається туди-назад; поки вона рухається, звук триває й поступово стихає.'
        : stringState === 'paused'
          ? 'Показ на паузі: кадр струни зафіксовано. Натисни «Продовжити», щоб далі спостерігати рух.'
          : hasPlucked
            ? 'Струна знову у спокої, звук стих.'
            : 'Струна поки нерухома, звуку немає.';
  const stopGuidance = !hasPlucked
    ? staticMode ? 'Спочатку покажи кадр руху струни.' : 'Спочатку смикни струну.'
    : !predictionMade
      ? 'Зроби й збережи прогноз, потім смикни струну ще раз.'
      : !experimentStarted
        ? staticMode ? 'Покажи наступний кадр, щоб почати перевірку прогнозу.' : 'Смикни струну, щоб почати перевірку прогнозу.'
        : stringState === 'paused' && !staticMode
          ? 'Продовж рух, а потім зупини струну.'
          : staticMode ? 'Покажи наступний кадр, щоб повторити дослід.' : 'Смикни струну ще раз, щоб зупинити її під час руху.';

  useEffect(() => {
    if (staticMode) setStringState((current) => current === 'playing' ? 'paused' : current);
  }, [staticMode]);

  useEffect(() => () => {
    audioRun.current += 1;
    activeSource.current?.stop();
    void audioContext.current?.close();
  }, []);

  useEffect(() => {
    const pauseForHiddenDocument = () => {
      if (document.hidden) {
        if (stringState === 'playing') setStringState('paused');
        stopAudio();
      }
    };
    document.addEventListener('visibilitychange', pauseForHiddenDocument);
    return () => document.removeEventListener('visibilitychange', pauseForHiddenDocument);
  }, [stringState]);

  useEffect(() => {
    if (!isMoving) return undefined;
    animationStart.current = performance.now() - elapsed;
    const animate = (time: number) => {
      const nextElapsed = time - (animationStart.current ?? time);
      if (nextElapsed >= cycleDuration) {
        setElapsed(cycleDuration);
        setStringState('rest');
        return;
      }
      setElapsed(nextElapsed);
      animationFrame.current = requestAnimationFrame(animate);
    };
    animationFrame.current = requestAnimationFrame(animate);
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [cycleDuration, elapsed, isMoving]);

  function stopAudio(fadeDuration = 0.08) {
    audioRun.current += 1;
    const gain = activeGain.current;
    const source = activeSource.current;
    const context = audioContext.current;
    if (!gain || !source || !context) return;

    const now = context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, fadeDuration / 3);
    source.stop(now + fadeDuration * 6);
    activeGain.current = undefined;
    activeSource.current = undefined;
  }

  function getAudioContext() {
    if (audioContext.current && audioContext.current.state !== 'closed') return audioContext.current;
    if (!window.AudioContext) {
      setAudioStatus('unavailable');
      return undefined;
    }
    try {
      audioContext.current = new window.AudioContext();
      return audioContext.current;
    } catch {
      setAudioStatus('unavailable');
      return undefined;
    }
  }

  async function enableAudio() {
    const context = getAudioContext();
    if (!context) return;
    try {
      await context.resume();
      onAudioEnabledChange(true);
      setAudioStatus('ready');
    } catch {
      onAudioEnabledChange(false);
      setAudioStatus('blocked');
    }
  }

  async function startAudio() {
    if (!audioEnabled) return;
    stopAudio(0.03);
    const run = audioRun.current;
    const context = getAudioContext();
    if (!context) return;
    try {
      if (context.state === 'suspended') await context.resume();
      if (audioRun.current !== run) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;
      source.buffer = createPluckedStringBuffer(context);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
      gain.gain.setTargetAtTime(0.0001, now + 0.18, 0.22);
      source.connect(gain).connect(context.destination);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (activeSource.current === source) {
          activeSource.current = undefined;
          activeGain.current = undefined;
        }
      };
      activeSource.current = source;
      activeGain.current = gain;
      source.start(now);
      source.stop(now + 1.25);
    } catch {
      onAudioEnabledChange(false);
      setAudioStatus('blocked');
    }
  }

  function toggleAudio() {
    if (!audioEnabled) {
      void enableAudio();
      return;
    }
    onAudioEnabledChange(false);
    stopAudio();
  }

  function pluck() {
    setHasPlucked(true);
    setElapsed(0);
    setFrameIndex(1);
    setStringState(staticMode ? 'paused' : 'playing');
    if (predictionMade) setExperimentStarted(true);
    void startAudio();
  }

  function stop() {
    if (!isStopAvailable) return;
    setStringState('stopped');
    stopAudio();
    onExperimentComplete();
  }

  function togglePlayback() {
    if (stringState === 'playing') {
      setStringState('paused');
      stopAudio();
      return;
    }
    setStringState('playing');
    void startAudio();
  }

  function toggleSpeed() {
    const nextSlow = !slow;
    setSlow(nextSlow);
    setElapsed(0);
    if (stringState === 'playing') void startAudio();
  }

  function nextFrame() {
    const startsStaticExperiment = stringState !== 'paused';
    setHasPlucked(true);
    setFrameIndex((current) => (current + 1) % motionFrames.length);
    setStringState('paused');
    if (predictionMade) setExperimentStarted(true);
    if (startsStaticExperiment) void startAudio();
  }

  function previousFrame() {
    setHasPlucked(true);
    setFrameIndex((current) => (current - 1 + motionFrames.length) % motionFrames.length);
    setStringState('paused');
  }

  return { stringState, hasPlucked, predictionMade, setPredictionMade, predictionId, setPredictionId, slow, frameIndex, observationAttempts, setObservationAttempts, audioStatus, gestureStarted, offset, isStopAvailable, predictionLabel, visualDescription, statusText, stopGuidance, toggleAudio, pluck, stop, togglePlayback, toggleSpeed, nextFrame, previousFrame };
}
