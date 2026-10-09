// The picked names are right when they are exactly the correct set, in any order.
export function gradeNames(picked: readonly string[], correct: readonly string[]): boolean {
  return picked.length === correct.length && correct.every((name) => picked.includes(name));
}

// Every pair is judged: the answer to «same sound?» has to match the model.
export function gradePairs(answers: Readonly<Record<number, boolean>>, expected: readonly boolean[]): boolean {
  return expected.every((same, index) => answers[index] === same);
}
