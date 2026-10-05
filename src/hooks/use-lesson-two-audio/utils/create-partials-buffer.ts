import type { PartialsSound } from '@/hooks/use-lesson-two-audio/types';
import { renderPartials } from '@/hooks/use-lesson-two-audio/utils/render-partials';

export function createPartialsBuffer(context: AudioContext, sound: PartialsSound): AudioBuffer {
  const samples = renderPartials(context.sampleRate, sound);
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  buffer.getChannelData(0).set(samples);
  return buffer;
}
