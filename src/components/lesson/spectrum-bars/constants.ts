// One slot per partial; the bar sits inside it with a wide surface gap on each side.
// The slot width divides the box evenly, so an HTML row of the same column count
// lines its labels up with the bars at any width.
export const spectrumBox = { width: 320, height: 100, slot: 64, bar: 36, top: 8, baseline: 92 };

// A partial that is off still gets a stub on the baseline, so «немає» reads as an
// empty place in the spectrum rather than a missing column.
export const emptyBarHeight = 3;

export const barRadius = 4;
