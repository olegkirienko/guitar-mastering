import { lastFrame, markerOffsets, rarefactionPositions, staticFrameMap, wavefrontPositions } from '@/components/lesson/sound-propagation-lab/constants';
import type { PlaybackState, SoundPropagationLabProps } from '@/components/lesson/sound-propagation-lab/types';
import { frameDescription } from '@/components/lesson/sound-propagation-lab/utils/frame-description';
import { useEffect, useId, useState } from 'react';

export function useSoundPropagationLab({ content, staticMode, onComplete }: SoundPropagationLabProps) {
  const predictionGroupId = useId();
  const [predictionId, setPredictionId] = useState<string>();
  const [predictionChecked, setPredictionChecked] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [frame, setFrame] = useState(0);
  const [sourceStopped, setSourceStopped] = useState(false);
  const [observationAnswered, setObservationAnswered] = useState(false);
  const [observationAttempts, setObservationAttempts] = useState(0);
  const [staticReviewed, setStaticReviewed] = useState(false);
  const [staticFrameIndex, setStaticFrameIndex] = useState(0);

  useEffect(() => {
    if (playback !== 'playing' || staticMode) return undefined;
    const timer = window.setTimeout(() => {
      setFrame((current) => {
        if (current >= lastFrame - 1) {
          setPlayback('finished');
          onComplete();
          return lastFrame;
        }
        return current + 1;
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [frame, onComplete, playback, staticMode]);

  useEffect(() => {
    if (staticMode) setPlayback((current) => current === 'playing' ? 'paused' : current);
  }, [staticMode]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPlayback((current) => current === 'playing' ? 'paused' : current);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const displayedFrame = staticMode ? staticFrameMap[staticFrameIndex] : frame;
  const frontIndex = displayedFrame >= 3 && displayedFrame <= 6 ? displayedFrame - 3 : -1;
  const wavefrontX = frontIndex < 0 ? -20 : wavefrontPositions[frontIndex];
  const activeMarkerOffsets = frontIndex < 0 ? undefined : markerOffsets[frontIndex];
  const rarefactionX = frontIndex >= 0 && frontIndex < rarefactionPositions.length ? rarefactionPositions[frontIndex] : undefined;
  const stringOffset = sourceStopped || displayedFrame === 0 || displayedFrame >= lastFrame ? 0 : displayedFrame % 2 === 0 ? -11 : 11;
  const eardrumOffset = displayedFrame === 6 ? -4 : 0;
  const status = frameDescription(displayedFrame, sourceStopped);
  const selectedPrediction = content.predictionChoices.find((choice) => choice.id === predictionId);
  const modelObserved = playback === 'finished' || staticReviewed;

  function play() {
    if (playback === 'finished') {
      setFrame(0);
      setSourceStopped(false);
    }
    setPlayback('playing');
  }

  function replay() {
    setFrame(0);
    setSourceStopped(false);
    setObservationAnswered(false);
    setObservationAttempts(0);
    setStaticReviewed(false);
    setPlayback('playing');
  }

  function stopSource() {
    setSourceStopped(true);
  }

  function finishStaticReview() {
    setStaticReviewed(true);
    onComplete();
  }

  function nextStaticFrame() {
    if (staticFrameIndex === staticFrameMap.length - 1) {
      finishStaticReview();
      return;
    }
    setStaticFrameIndex((current) => current + 1);
  }

  return { predictionGroupId, predictionId, setPredictionId, predictionChecked, setPredictionChecked, predictionMade, setPredictionMade, playback, setPlayback, frame, sourceStopped, observationAnswered, setObservationAnswered, observationAttempts, setObservationAttempts, staticReviewed, staticFrameIndex, setStaticFrameIndex, displayedFrame, frontIndex, wavefrontX, activeMarkerOffsets, rarefactionX, stringOffset, eardrumOffset, status, selectedPrediction, modelObserved, play, replay, stopSource, finishStaticReview, nextStaticFrame };
}
