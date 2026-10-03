import { pluckSeconds } from '@/hooks/use-lesson-two-audio/constants';

export function createPluckedBuffer(context: AudioContext, frequency: number): AudioBuffer {
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
