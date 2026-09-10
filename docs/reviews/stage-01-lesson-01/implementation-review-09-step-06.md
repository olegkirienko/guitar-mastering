# Stage I · Lesson 1 — Step 06 `SoundPropagationLab` Implementation Review

## Review metadata

- Review date: 2026-09-10
- Review scope: implementation step 06, `SoundPropagationLab`
- Current HEAD SHA: `21d92a0b7b3870b8a17b57f76eb7fb155965af7f`
- Specification: `docs/lesson-designs/stage-01-lesson-01-sound.md`
- Approved prior-slice review: `docs/reviews/stage-01-lesson-01/fix-rereview-08-step-05.md`
- Workflow state: `docs/workflow/stage-01-lesson-01.yaml`
- Artifact identifier: `stage-01-lesson-01 / implementation-review-09-step-06`

## Final verdict

**CHANGES REQUIRED**

The slice adds the intended prediction-first laboratory, a controlled string/body/air/ear sequence, pause/replay/source-stop controls, lesson navigation, persistence of the new step identifier, a real-world transfer activity, and a concept reveal after observation. It also stays within step 06 and does not introduce checkpoint or completion work. The central visual model is not yet safe to approve, however: it depicts compression by enlarging air markers instead of changing their spacing and never depicts rarefaction. The required comparison diagrams are absent from the prediction, and the nominal static alternative cannot complete the laboratory flow.

## Blocking findings

### HIGH-04 — The visualization misrepresents compression and omits rarefaction

- Severity: high
- File and location: `src/components/lesson/SoundPropagationLab.tsx:129–141`
- What is wrong: every ordinary air marker remains fixed at its average-position tick, while markers near the moving front grow from radius 6 to radius 8. Only the highlighted marker receives a small horizontal displacement. This makes compression look like individual air parcels swelling rather than neighboring parcels moving closer together. No frame creates the larger inter-marker spacing required to show rarefaction.
- Why it matters: distinguishing local air motion from a propagated compression/rarefaction pattern is the central learning purpose of this slice. The current picture can replace the targeted misconception with another physically incorrect model even though the accompanying text is accurate.
- Affected requirement or principle: the approved choreography requires a denser group for compression, greater spacing for rarefaction, fixed average-position marks, and small local displacement of the represented air regions. The course map requires the learner to understand that the string makes the medium move and that the disturbance propagates as a wave.
- Smallest recommended fix: keep marker size constant and derive short horizontal offsets for the markers around the advancing front so one region becomes visibly denser while the adjacent region becomes visibly sparser. Keep every average-position tick fixed and ensure the highlighted marker returns to its own tick after a cycle.

### MEDIUM-13 — The prediction omits the required static model comparison and refers to a marker style that does not exist

- Severity: medium
- File and location: `src/components/lesson/SoundPropagationLab.tsx:93–107, 129–136`; `src/data/lessons/stage-01-lesson-01.ts:41–50`
- What is wrong: the two causal models are rendered only as text radio options through `ChoiceQuestion`; the specified static mini-schemes are absent. The prompt and feedback repeatedly tell the learner to follow a “смугаста” (striped) air region, but the highlighted region is a solid brown circle with no stripe or pattern.
- Why it matters: the pre-observation task is meant to compare two spatial models, not just two sentences. The missing diagrams make that comparison more abstract for a first-principles learner, while the mismatched marker description makes the subsequent observation harder to follow.
- Affected requirement or principle: screen 4 requires both alternatives to be represented with words and static mini-schemes and requires the tracked marker to be visually identifiable.
- Smallest recommended fix: add lesson-local mini-schemes to the two model choices without generalizing `ChoiceQuestion`, and either render the tracked marker with the promised pattern or consistently call it the highlighted/contrasting marker in content and UI.

### MEDIUM-14 — Reading the static four-frame alternative cannot advance the laboratory

- Severity: medium
- File and location: `src/components/lesson/SoundPropagationLab.tsx:159–169`
- What is wrong: the four static cards are available in a `details` element, but opening and reading them changes no interaction state. The observation question and concept reveal are rendered only when animated playback reaches `finished`, and `onComplete` is likewise called only by the animation timer.
- Why it matters: the slice claims to provide the approved four-frame model, but that path is a dead end: a learner who uses it must still run the animation before they can answer the observation question or encounter “звукова хвиля.” This also leaves later step-07 accessibility work without a functioning static laboratory path to enhance.
- Affected requirement or principle: implementation step 06 explicitly starts with the four static frames, and the approved lesson permits reviewing the central model through its static alternative. Required understanding must not depend on animation.
- Smallest recommended fix: add an explicit completion action after the four cards that marks the model as observed and reveals the same observation question; do not add the deferred automatic reduced-motion preference, transcript, or full frame-by-frame controls in this fix.

## Correctness and pedagogy

- The prediction is saved before the laboratory becomes available, preserving the required prediction-before-observation sequence.
- The term “звукова хвиля” is withheld until the post-run observation has been answered correctly or attempted twice.
- The source-stop behavior correctly keeps an already-created front moving toward the ear instead of clearing the whole scene immediately.
- The textual model correctly distinguishes local air motion, propagation of a change, and perception at the ear.
- `HIGH-04`, `MEDIUM-13`, and `MEDIUM-14` prevent the visual and alternative paths from delivering that model reliably.

## Architecture, persistence, and integration

- Lesson content remains in the lesson-specific data module, while the interaction is isolated in `SoundPropagationLab`.
- The page extends the existing local progress shape narrowly with the `air` step and preserves old stored values safely.
- Navigation to the air laboratory is gated by completion of the string experiment and returns focus through the existing `LessonStep` convention.
- No dependency, universal renderer, checkpoint, lesson completion, or future-course concept was introduced.

## Accessibility and mobile review

- Controls are native buttons with visible focus treatment and adequate minimum target height.
- The wide scene uses horizontal overflow rather than shrinking below legibility on narrow screens.
- The SVG exposes one concise description instead of every decorative marker, and status changes are duplicated in text.
- Automatic reduced-motion behavior, frame controls, and the full screen-reader transcript belong to approved step 07 and were not treated as defects in this step-06 review. `MEDIUM-14` concerns the currently implemented static path's inability to complete its own flow, not those deferred enhancements.

## Validation results

The following commands were actually executed with the Node version selected by `.nvmrc`:

- `/home/okirienko/.nvm/versions/node/v24.3.0/bin/node -v`: passed and reported `v24.3.0`, matching `.nvmrc` major version `24`.
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm lint`: passed (`tsc -b --pretty false`).
- `env PATH=/home/okirienko/.nvm/versions/node/v24.3.0/bin:... corepack pnpm build`: passed. Vite 7.3.6 transformed 1,236 modules and generated the production bundle.
- `git diff --check`: passed with no whitespace errors.

No `test` script is defined in `package.json`, so no automated test suite was run. No browser automation harness is present; visual behavior was assessed from the rendered-state and SVG control logic.

## Scope decision

Route step 06 to targeted fixes for exactly `HIGH-04`, `MEDIUM-13`, and `MEDIUM-14`. Do not begin step 07 reduced-motion/screen-reader extensions, step 08 checkpoint work, or later completion/integration slices.

## Exact verdict

CHANGES REQUIRED
