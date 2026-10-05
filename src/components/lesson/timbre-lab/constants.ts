import type { TimbreLabMode, TimbreLabModeConfig } from '@/components/lesson/timbre-lab/types';

// `overtones` asks one question — what does adding a faster wave do — so it offers
// two waves and two levels, and draws them under the sum. `spectrum` opens the
// whole mix once that is answered. `envelope` changes the subject to the two ends of
// the sound, so it locks the mix the learner has just been playing with.
export const labModes: Record<TimbreLabMode, TimbreLabModeConfig> = {
  overtones: { multiples: [2, 3], levels: ['off', 'strong'], showPartials: true, lockedOvertones: false },
  spectrum: { multiples: [2, 3, 4, 5], levels: ['off', 'weak', 'strong'], showPartials: false, lockedOvertones: false },
  envelope: { multiples: [2, 3, 4, 5], levels: ['off', 'weak', 'strong'], showPartials: false, lockedOvertones: true },
};
