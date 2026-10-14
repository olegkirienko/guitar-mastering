export const lastFret = 12;

export const semitonesInOctave = 12;

// Pitch classes counted from C; every black key is spelled with a sharp in this lesson.
export const sharpNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

// The 5th string, the one the learner heard in Stage II.
export const fifthString = { name: '5-та струна', openKey: 9, openNote: 'A', frequency: 110 } as const;
