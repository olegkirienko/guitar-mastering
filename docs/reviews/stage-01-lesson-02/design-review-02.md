# Design Review 02 — Stage 01, Lesson 02

## Review metadata

- **Lesson:** `stage-01-lesson-02`
- **Design artifact:** `docs/lesson-designs/stage-01-lesson-02-frequency-pitch.md`
- **Course-map source:** `docs/course-map/stage-01-sound.md`, Node 2
- **Prior review:** `docs/reviews/stage-01-lesson-02/design-review-01.md`
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-11
- **Verdict:** `APPROVED`

## Scope of re-review

This review verifies the revised design against active findings `HIGH-01` and `MEDIUM-01`, checks the non-blocking recommendation `LOW-01`, and checks the surrounding lesson flow for direct regressions. The prior review remains an immutable snapshot.

## Finding resolution

### HIGH-01 — RESOLVED

The revised lesson now begins with the course-map phenomenon: the learner compares the open first string with the same string pressed farther toward the guitar body on screen 1. A virtual/textual equivalent is available without a guitar, audio, or manual interaction. The abstract 4-versus-8 repetition model follows on screen 2, and terminology follows on screen 3. Screen 5 explicitly revisits the already experienced guitar phenomenon as application while leaving the physical cause for Node 3.

This restores the required order:

`same-string guitar experience → question → abstract comparison → observation → frequency/pitch names → guitar application`

### MEDIUM-01 — RESOLVED

The implementation plan now gives every early interaction a single owner:

- `foundation` owns screens 0–1 and `SameStringPitchExperience`, including a complete virtual/textual path without Web Audio;
- `frequency-lab` owns screens 2–3, `FrequencyComparison`, and the non-audio `FrequencyPitchLab`;
- `optional-audio-counterexample` adds user-gesture audio to existing interactions and owns the loudness counterexample on screen 4.

The first slice is independently testable, its primary experience no longer depends on postponed audio, and component names, screen ranges, and exclusions agree.

### LOW-01 — ADDRESSED

The design now states that Lesson 2 remains `next` and unlinked on the home page during incomplete slices. The direct route is available for implementation review, and public `available` status belongs only to the final completion slice.

## Full-design assessment

- **Pedagogy:** Terms follow experience and observation. Prediction, experiment, feedback, application, checkpoint, and bridge are all present.
- **Correctness:** The design distinguishes physical frequency, perceived height, and loudness; it labels the 4-versus-8 animation as a slowed relational model rather than audible 4/8 Hz.
- **Curriculum scope:** String length, tension, linear density, note names, intervals, harmonics, spectrum, and timbre remain outside the lesson. The bridge opens Node 3 without teaching it.
- **Learner modalities:** Understanding, listening, hands-on guitar interaction, and experimentation are represented. Audio and a physical guitar remain optional for completion.
- **Accessibility:** Keyboard, static/reduced-motion, screen-reader, no-audio, no-guitar, limited-manual-interaction, mobile, and failure paths are specified.
- **Implementation readiness:** Six ordered slices have explicit ownership and exclusions, and the final-slice rule for public lesson exposure is clear.

No new actionable findings were identified.

## Verdict and gate recommendation

**Verdict: `APPROVED`**

Open the `design_approval` human gate. Do not begin the first implementation slice until explicit human approval is supplied. After approval, the first legal slice is `foundation` as defined in the approved specification.
