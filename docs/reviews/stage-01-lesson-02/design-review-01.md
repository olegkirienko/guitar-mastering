# Design Review 01 — Stage 01, Lesson 02

## Review metadata

- **Lesson:** `stage-01-lesson-02`
- **Design artifact:** `docs/lesson-designs/stage-01-lesson-02-frequency-pitch.md`
- **Course-map source:** `docs/course-map/stage-01-sound.md`, Node 2
- **Workflow phase reviewed:** `design_review`
- **Date:** 2026-09-11
- **Verdict:** `CHANGES REQUIRED`

## Summary

The draft has a strong discovery arc once it reaches the comparison laboratory: it delays the terms “frequency,” “hertz,” and “pitch/height” until after observation; separates physical frequency from perceived height; includes the required quiet/loud counterexample; preserves the boundary before string length, tension, density, notes, intervals, harmonics, and timbre; and specifies credible no-audio, keyboard, reduced-motion, mobile, and guitar-free paths.

The design is not ready for human approval because its motivating experience does not match the course-map source of truth, and its first two implementation slices assign the central comparison interaction inconsistently. Both issues affect the first approved implementation slice and must be resolved in the design artifact before implementation can begin.

## Blocking findings

### HIGH-01 — The course-map guitar experience is deferred until after the abstraction

**Evidence**

- The course map defines the Node 2 experience as `відкрита перша струна → та сама струна, затиснута вище` (`docs/course-map/stage-01-sound.md`, Node 2).
- The draft instead opens with anonymous tone buttons and then abstract 4-versus-8 repetition tracks (`docs/lesson-designs/stage-01-lesson-02-frequency-pitch.md`, “Екран 0” and “Екран 1”).
- The required same-string comparison first appears in “Екран 5,” after the frequency/pitch concept reveal and loudness counterexample.

**Impact**

The learner reaches the explanatory abstraction before encountering the specific guitar phenomenon chosen by the curriculum to motivate it. This weakens the course’s physical-interaction track and reverses the source-of-truth order from guitar experience to abstraction and back to guitar application.

**Required revision**

Make the open first string versus the same string pressed farther toward the body the initial phenomenon, before frequency terminology or the abstract frequency laboratory. Provide a virtual/textual equivalent for learners without a guitar or usable audio. The later guitar step may revisit the phenomenon as application, but it must not be its first appearance. Keep the reason that pressing changes frequency unresolved so Node 3 remains intact.

### MEDIUM-01 — The first comparison has contradictory slice ownership and an unavailable dependency

**Evidence**

- The `foundation` slice claims screens 0–1 and explicitly excludes Web Audio.
- Screen 0 specifies two playable tones as its primary interaction.
- `FrequencyComparison`, which describes the screen 1 synchronized repetition comparison, is assigned to the later `frequency-lab` slice even though that slice claims screens 2–3.
- Web Audio is deferred again to the third `optional-audio-counterexample` slice.

**Impact**

An implementer cannot determine which slice owns the first comparison or how the primary screen-0 experience works at the end of the foundation slice. This creates overlapping ownership and makes the first reviewable slice depend on behavior explicitly postponed to a later slice.

**Required revision**

Give each early interaction exactly one owning slice. Specify a complete, testable first-slice path that does not depend on a later slice, or move the minimum required user-gesture audio into that first slice. If audio remains deferred, define the initial guitar/virtual comparison as the primary experience rather than treating the no-audio format as a fallback. Align screen ranges, named components, and exclusions across all slices.

## Non-blocking recommendation

### LOW-01 — Define lesson-card exposure while implementation is incomplete

The `foundation` slice includes a “correct lesson card” but does not state whether Lesson 2 becomes navigable from the home page before its final slice is approved. Clarify that incomplete slices remain accessible only through the intended review path, or define the exact temporary card status, so a partially implemented lesson is not accidentally presented as complete course content.

## Review conclusion

The conceptual model, counterexample, accessibility approach, and scope boundaries are suitable foundations for revision. Resolve `HIGH-01` and `MEDIUM-01`, then submit the revised design for a new immutable design review. `LOW-01` should be clarified during the same revision if possible but is not independently blocking.

## Verdict and gate recommendation

**Verdict: `CHANGES REQUIRED`**

Do not open the `design_approval` human gate. Return to `phase: design` with `HIGH-01` and `MEDIUM-01` as active blocking findings.
