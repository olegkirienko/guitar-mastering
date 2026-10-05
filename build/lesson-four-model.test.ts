import { describe, expect, it } from 'vitest';
import { peakGainCap } from '../src/data/lessons/stage-01-lesson-02-model/constants.ts';
import { safeGain } from '../src/data/lessons/stage-01-lesson-02-model/utils/lab.ts';
import { attackSeconds, decayDurationSeconds, playbackGain, timbrePresets } from '../src/data/lessons/stage-01-lesson-04-model/constants.ts';
import type { TimbreSound } from '../src/data/lessons/stage-01-lesson-04-model/types.ts';
import { envelopePoints, envelopeValue, soundDuration } from '../src/data/lessons/stage-01-lesson-04-model/utils/envelope.ts';
import { partialStrengths, toPartialsSound } from '../src/data/lessons/stage-01-lesson-04-model/utils/partials.ts';
import { visualRepeats, waveCurves, waveDescription, waveValue } from '../src/data/lessons/stage-01-lesson-04-model/utils/wave.ts';
import { lessonFourContent } from '../src/data/lessons/stage-01-lesson-04/constants.ts';
import { renderPartials } from '../src/hooks/use-lesson-two-audio/utils/render-partials.ts';

const presets = Object.values(timbrePresets);
const words = lessonFourContent.waveWords;

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
