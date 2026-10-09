// Key 0 is the white key left of a pair of black keys, an octave of 12 keys to key 12.
// Lesson 2 numbered from 440 Hz instead; here 440 Hz is key 9.
export const baseFrequency = 261.63;

export const keysInOctave = 12;

export const lastKeyNumber = keysInOctave;

// Positions of the white keys inside the octave, counted from key 0.
export const whiteKeyPositions: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

// Black keys of the lesson's keyboard: a pair, then a triple.
export const blackKeyPositions: readonly number[] = [1, 3, 6, 8, 10];

export const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const noteSyllables = ['до', 'ре', 'мі', 'фа', 'соль', 'ля', 'сі'] as const;

export const keyOfA = 9;
