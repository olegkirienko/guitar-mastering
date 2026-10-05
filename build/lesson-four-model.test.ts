import { describe, expect, it } from 'vitest';
import { labModes } from '../src/components/lesson/timbre-lab/constants.ts';
import { peakGainCap } from '../src/data/lessons/stage-01-lesson-02-model/constants.ts';
import { safeGain } from '../src/data/lessons/stage-01-lesson-02-model/utils/lab.ts';
import { attackSeconds, decayDurationSeconds, playbackGain, timbrePresets } from '../src/data/lessons/stage-01-lesson-04-model/constants.ts';
import type { TimbreSound } from '../src/data/lessons/stage-01-lesson-04-model/types.ts';
import { matchesOvertones } from '../src/data/lessons/stage-01-lesson-04-model/utils/checkpoint.ts';
import { envelopePoints, envelopeValue, soundDuration } from '../src/data/lessons/stage-01-lesson-04-model/utils/envelope.ts';
import { partialStrengths, toPartialsSound } from '../src/data/lessons/stage-01-lesson-04-model/utils/partials.ts';
import { partialLabel, withOvertone } from '../src/data/lessons/stage-01-lesson-04-model/utils/sound.ts';
import { visualRepeats, waveCurves, waveDescription, waveValue } from '../src/data/lessons/stage-01-lesson-04-model/utils/wave.ts';
import { lessonFourContent } from '../src/data/lessons/stage-01-lesson-04/constants.ts';
import { renderPartials } from '../src/hooks/use-lesson-two-audio/utils/render-partials.ts';

const presets = Object.values(timbrePresets);
const words = lessonFourContent.waveWords;
const labs = { overtones: lessonFourContent.overtones.lab, spectrum: lessonFourContent.spectrum.lab };

function peakOf(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

describe('Lesson 4 sound model', () => {
  it('always keeps the fundamental and leaves out the overtones that are off', () => {
    expect(partialStrengths(timbrePresets.pure)).toEqual([{ multiple: 1, strength: 1 }]);
    expect(partialStrengths(timbrePresets.pluck)).toEqual([
      { multiple: 1, strength: 1 },
      { multiple: 2, strength: 0.8 },
      { multiple: 3, strength: 0.3 },
      { multiple: 4, strength: 0.3 },
      { multiple: 5, strength: 0.3 },
    ]);
    const highest: TimbreSound = { ...timbrePresets.bright, fundamental: 440 };
    expect(toPartialsSound(highest).partials.map((partial) => partial.frequency)).toEqual([440, 880, 1320, 1760, 2200]);
    expect(toPartialsSound(timbrePresets.pluck)).toMatchObject({ attackSeconds: 0.005, decaySeconds: 0.7, durationSeconds: 2 });
    expect(toPartialsSound(timbrePresets.bright).decaySeconds).toBeNull();
  });

  it('repeats the sum with every repeat of the fundamental and draws a plain sine without overtones', () => {
    const pluck = partialStrengths(timbrePresets.pluck);
    for (const phase of [0.17, 0.42, 0.93]) {
      expect(waveValue(pluck, phase + 1)).toBeCloseTo(waveValue(pluck, phase), 10);
      expect(waveValue(pluck, phase + 2)).toBeCloseTo(waveValue(pluck, phase), 10);
    }
    const pure = partialStrengths(timbrePresets.pure);
    for (const phase of [0.17, 0.42, 0.93]) expect(waveValue(pure, phase)).toBeCloseTo(Math.sin(2 * Math.PI * phase), 10);
  });

  it('draws every wave on its own peak and keeps a higher sound denser', () => {
    expect([220, 330, 440].map((fundamental) => visualRepeats(fundamental as 220 | 330 | 440))).toEqual([3, 4.5, 6]);
    for (const preset of presets) {
      const { sum, partials } = waveCurves(preset);
      expect(Math.max(...sum.map((point) => Math.abs(point.y)))).toBeCloseTo(1, 6);
      expect(partials).toHaveLength(partialStrengths(preset).length);
      // Components share the sum's scale, so none of them can outgrow it.
      for (const partial of partials) expect(Math.max(...partial.points.map((point) => Math.abs(point.y)))).toBeLessThanOrEqual(1);
    }
  });

  it('describes a wave in words for a reader who cannot see it', () => {
    expect(waveDescription(timbrePresets.pure, words)).toBe('Повторів: 3; обертонів немає');
    expect(waveDescription(timbrePresets.pluck, words)).toBe('Повторів: 3; обертони: ×2 сильний, ×3 слабкий, ×4 слабкий, ×5 слабкий');
    expect(waveDescription({ ...timbrePresets.bright, fundamental: 330 }, words)).toBe('Повторів: 4,5; обертони: ×2 сильний, ×3 сильний, ×4 сильний, ×5 сильний');
  });

  it('never lets a sound run past two seconds and orders the three attacks', () => {
    expect(attackSeconds.instant).toBeLessThan(attackSeconds.fast);
    expect(attackSeconds.fast).toBeLessThan(attackSeconds.slow);
    for (const duration of Object.values(decayDurationSeconds)) expect(duration).toBeLessThanOrEqual(2);
    for (const preset of presets) {
      const points = envelopePoints(preset);
      expect(points[0].y).toBe(0);
      // Full strength is reached exactly when the attack ends, and never exceeded.
      expect(envelopeValue(preset, attackSeconds[preset.attack])).toBe(1);
      expect(Math.max(...points.map((point) => point.y))).toBeLessThanOrEqual(1);
      // A held sound stays at full strength; one with a decay is quieter at the end than at its peak.
      expect(points[points.length - 1].y).toBe(preset.decay === 'held' ? 1 : envelopeValue(preset, soundDuration(preset)));
    }
    expect(envelopeValue(timbrePresets.pluck, soundDuration(timbrePresets.pluck))).toBeLessThan(0.1);
  });

  it('renders a normalized buffer that starts and ends in silence', () => {
    for (const preset of presets) {
      const sound = toPartialsSound(preset);
      const samples = renderPartials(44100, sound);
      expect(samples).toHaveLength(Math.round(44100 * sound.durationSeconds));
      expect(peakOf(samples)).toBeCloseTo(1, 6);
      expect(Math.abs(samples[0])).toBeLessThan(1e-6);
      expect(Math.abs(samples[samples.length - 1])).toBeLessThan(1e-3);
    }
  });

  it('plays every sound at or under the Lesson 2 gain cap', () => {
    expect(playbackGain).toBeLessThanOrEqual(peakGainCap);
    expect(safeGain(playbackGain)).toBe(playbackGain);
  });

  it('introduces the three presets as one frequency with three timbres', () => {
    const sounds = lessonFourContent.intro.comparison.sounds;
    expect(sounds.map((item) => item.sound)).toEqual([timbrePresets.pure, timbrePresets.pluck, timbrePresets.bright]);
    for (const item of sounds) expect(item.sound.fundamental).toBe(220);
    // Same pitch, different shapes: the whole point of the `shape` screen.
    const descriptions = sounds.map((item) => waveDescription(item.sound, words));
    expect(new Set(descriptions).size).toBe(sounds.length);
    for (const description of descriptions) expect(description.startsWith('Повторів: 3;')).toBe(true);
  });
});

describe('Lesson 4 overtones and spectrum screens', () => {
  it('names a partial by its multiple and frequency, never by an ordinal', () => {
    expect(partialLabel(220, 1)).toBe('×1 · 220 Гц');
    expect(partialLabel(220, 3)).toBe('×3 · 660 Гц');
    expect(partialLabel(440, 5)).toBe('×5 · 2200 Гц');
  });

  it('changes one overtone and leaves the rest of the sound untouched', () => {
    const next = withOvertone(timbrePresets.pure, 3, 'weak');
    expect(next.overtones).toEqual({ 2: 'off', 3: 'weak', 4: 'off', 5: 'off' });
    expect(next.fundamental).toBe(timbrePresets.pure.fundamental);
    expect(timbrePresets.pure.overtones[3]).toBe('off');
  });

  it('tests a prediction only on the overtones it names', () => {
    expect(matchesOvertones(timbrePresets.bright, { 4: 'strong', 5: 'strong' })).toBe(true);
    expect(matchesOvertones(timbrePresets.pluck, { 4: 'strong', 5: 'strong' })).toBe(false);
    expect(matchesOvertones(timbrePresets.pure, {})).toBe(true);
  });

  it('never offers the fundamental as a switch and has a word for every level it offers', () => {
    for (const [mode, lab] of Object.entries(labs)) {
      const config = labModes[mode as keyof typeof labs];
      expect(config.multiples).not.toContain(1);
      expect(lab.mixer.fundamentalNote).toContain('завжди');
      for (const level of config.levels) expect(lab.levels[level]).toBeTruthy();
    }
  });

  it('keeps the words of a later screen off the screen that has not earned them', () => {
    // `overtones` draws the waves it adds; the spectrum and the ready-made sounds wait for their own screen.
    expect(Object.keys(labs.overtones)).not.toContain('spectrum');
    expect(Object.keys(labs.overtones)).not.toContain('presets');
    expect(labModes.overtones.showPartials).toBe(true);
    expect(labs.overtones.status.overtone).not.toContain('бертон');
    expect(labs.spectrum.status.overtone).toContain('бертон');
  });

  it('starts the spectrum lab where neither prediction is already true', () => {
    for (const prediction of lessonFourContent.spectrum.predictions) {
      expect(matchesOvertones(timbrePresets.pluck, prediction.target)).toBe(false);
      // Every level a prediction asks for is one the spectrum lab actually offers.
      for (const level of Object.values(prediction.target)) expect(labModes.spectrum.levels).toContain(level);
    }
  });

  it('labels the three ways the string swings with the frequencies they stand for', () => {
    const rows = lessonFourContent.overtones.modes.rows;
    expect(rows.map((row) => row.parts)).toEqual([1, 2, 3]);
    for (const row of rows) expect(row.label.startsWith(partialLabel(220, row.parts))).toBe(true);
  });
});
