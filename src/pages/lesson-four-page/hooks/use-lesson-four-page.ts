import { useCallback, useEffect, useRef, useState } from 'react';
import { labModes } from '@/components/lesson/timbre-lab/constants';
import { overtoneMultiples, timbrePresets } from '@/data/lessons/stage-01-lesson-04-model/constants';
import type { OvertoneMultiple, TimbreSound } from '@/data/lessons/stage-01-lesson-04-model/types';
import { matchesOvertones } from '@/data/lessons/stage-01-lesson-04-model/utils/checkpoint';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';
import type { DescriptionId, LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonFourProgressAdapter } from '@/progress/lesson-four/lesson-four';
import { useLessonFourProgress } from '@/progress/use-lesson-four-progress';

// `overtones` is done once both faster waves have been heard at least once, so the
// lab's own list of waves decides the condition instead of a second copy of it.
const overtonesRequired = labModes.overtones.multiples;

// The «А» sound of the counterexample: the experiment begins where the screen left off.
const envelopeStart = lessonFourContent.envelope.comparison.sounds[0].sound;

export function useLessonFourPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync } = useLessonFourProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonFourStepId | null>(null);
  // Session-only descriptions from `intro`; the completion screen compares them with the experiments.
  const [descriptions, setDescriptions] = useState<readonly DescriptionId[]>([]);
  const [ownDescription, setOwnDescription] = useState('');
  // Session-only: each answer opens the rest of its step.
  const [introAnswered, setIntroAnswered] = useState(false);
  const [shapePredicted, setShapePredicted] = useState(false);
  const [overtonesPredicted, setOvertonesPredicted] = useState(false);
  // Session-only lab states; each screen owns its own sound.
  const [overtonesSound, setOvertonesSound] = useState<TimbreSound>(timbrePresets.pure);
  const [switchedOn, setSwitchedOn] = useState<readonly OvertoneMultiple[]>([]);
  const [spectrumSound, setSpectrumSound] = useState<TimbreSound>(timbrePresets.pluck);
  const [spectrumTouched, setSpectrumTouched] = useState(false);
  // A prediction counts as tested only when its state is reached after the guess.
  const [spectrumAnswered, setSpectrumAnswered] = useState<readonly string[]>([]);
  const [spectrumVerified, setSpectrumVerified] = useState<readonly string[]>([]);
  // `envelope` starts from the plucked sound of its counterexample, so giving it a
  // slow start is a real change; both ends have to be tried before the step is done.
  const [envelopeSound, setEnvelopeSound] = useState<TimbreSound>(envelopeStart);
  const [envelopeAnswered, setEnvelopeAnswered] = useState(false);
  const [envelopePredicted, setEnvelopePredicted] = useState(false);
  const [attackChanged, setAttackChanged] = useState(false);
  const [decayChanged, setDecayChanged] = useState(false);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { intro, shape, overtones, spectrum, envelope, checkpoint, complete, preferences, waveWords, envelopeWords } = lessonFourContent;
  const { route, goTo: openStep } = useLessonRoute('04', lessonFourProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonFourStepId) => progress.completedStepIds.includes(step);

  // «Завершити урок» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonFourStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonFourStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonFourStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  const toggleDescription = (id: DescriptionId, isSelected: boolean) => setDescriptions((current) => isSelected
    ? [...current.filter((item) => item !== id), id]
    : current.filter((item) => item !== id));
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  // Any answer finishes `intro`; the question is about noticing, not about being right.
  const answerIntro = useCallback(() => {
    setIntroAnswered(true);
    completeStep('intro');
  }, [completeStep]);
  const answerShapeCount = useCallback(() => completeStep('shape'), [completeStep]);

  const changeOvertonesSound = (next: TimbreSound) => {
    setOvertonesSound(next);
    const sounding = overtoneMultiples.filter((multiple) => next.overtones[multiple] !== 'off');
    const nextSwitchedOn = Array.from(new Set([...switchedOn, ...sounding]));
    if (nextSwitchedOn.length === switchedOn.length) return;
    setSwitchedOn(nextSwitchedOn);
    if (overtonesRequired.every((multiple) => nextSwitchedOn.includes(multiple))) completeStep('overtones');
  };

  const verifySpectrum = (sound: TimbreSound, answered: readonly string[]) => {
    const reached = spectrum.predictions.filter((item) => answered.includes(item.id) && matchesOvertones(sound, item.target)).map((item) => item.id);
    const nextVerified = Array.from(new Set([...spectrumVerified, ...reached]));
    if (nextVerified.length === spectrumVerified.length) return;
    setSpectrumVerified(nextVerified);
    if (spectrum.predictions.every((item) => nextVerified.includes(item.id))) completeStep('spectrum');
  };

  const changeSpectrumSound = (next: TimbreSound) => {
    setSpectrumSound(next);
    setSpectrumTouched(true);
    verifySpectrum(next, spectrumAnswered);
  };

  const answerSpectrum = (id: string) => {
    if (spectrumAnswered.includes(id)) return;
    const nextAnswered = [...spectrumAnswered, id];
    setSpectrumAnswered(nextAnswered);
    verifySpectrum(spectrumSound, nextAnswered);
  };

  // Any answer to the question counts, but both ends of the sound have to be tried.
  const finishEnvelope = (answered: boolean, attack: boolean, decay: boolean) => {
    if (answered && attack && decay) completeStep('envelope');
  };

  const answerEnvelope = () => {
    setEnvelopeAnswered(true);
    finishEnvelope(true, attackChanged, decayChanged);
  };

  const changeEnvelopeSound = (next: TimbreSound) => {
    const attack = attackChanged || next.attack !== envelopeSound.attack;
    const decay = decayChanged || next.decay !== envelopeSound.decay;
    setEnvelopeSound(next);
    setAttackChanged(attack);
    setDecayChanged(decay);
    finishEnvelope(envelopeAnswered, attack, decay);
  };

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonFourStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonFourStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return { route, progress, checkpoint, complete, passCheckpoint, finishLesson, finishStatus, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, focusedStep, descriptions, toggleDescription, ownDescription, setOwnDescription, intro, shape, overtones, spectrum, envelope, preferences, waveWords, envelopeWords, visibleStep, isCompleted, audio, goTo, toggleAudio, answerIntro, answerShapeCount, introOpen: introAnswered || isCompleted('intro'), shapeOpen: shapePredicted || isCompleted('shape'), answerShapePrediction: () => setShapePredicted(true), overtonesOpen: overtonesPredicted || isCompleted('overtones'), answerOvertonesPrediction: () => setOvertonesPredicted(true), overtonesSound, changeOvertonesSound, spectrumSound, changeSpectrumSound, spectrumNamed: spectrumTouched || isCompleted('spectrum'), answerSpectrum, isSpectrumAnswered: (id: string) => spectrumAnswered.includes(id), isSpectrumVerified: (id: string) => spectrumVerified.includes(id), envelopeSound, changeEnvelopeSound, answerEnvelope, envelopeOpen: envelopeAnswered || isCompleted('envelope'), envelopeLabOpen: envelopePredicted || isCompleted('envelope'), answerEnvelopePrediction: () => setEnvelopePredicted(true), envelopeStart, audioMessage };
}
