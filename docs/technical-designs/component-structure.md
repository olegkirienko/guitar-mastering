# Component and module structure

## Goal and non-goals

**Goal.** Give every unit of code one folder with one responsibility per file,
in kebab-case, so a component's types, constants, hooks, and helpers are no
longer buried in a single file.

**Non-goals.** No behavior, markup, or style change; no logic rewrite. Known
duplication (for example `VirtualGuitarString` has its own WebAudio synthesis
next to `useLessonTwoAudio`) is left for a later change. No barrel `index.ts`
files. The Untitled UI CLI-owned files stay as generated.

## Current state

Everything is flat: 5 top-level files in `src/components` (AppLayout,
RootLayout, RouteError, LessonCard, SectionHeading) plus 16 files in
`src/components/lesson` (15 components and one hook), 4 in `src/pages`,
`src/auth/AuthProvider.tsx`, `src/progress/*`, `src/data/*`. There is no
`types.ts`, `constants.ts`, or `utils/` at unit level. Types, constants, pure
helpers, hooks, and effects share one file. The worst offenders are
`VirtualGuitarString.tsx` (348 lines: 3 types, constants, buffer synthesis,
timers, 4 effects), `LessonTwoPage.tsx` (275), `data/lessons/stage-01-lesson-02.ts`
(289), `SoundPropagationLab.tsx` (246, two components), and `useLessonProgress.ts`
(211). Names mix PascalCase and kebab-case. No test imports a component; four
`build/` tests import `progress/` and `data/` by relative path.

## The rule

**A unit** is any `.tsx` file, plus any `.ts` module that mixes several
responsibilities (the large files in `progress/`, `data/`, and the big hooks).
Each unit gets a folder named after it, in kebab-case:

```
component-name/
  component-name.tsx        the component (one exported component per file)
  types.ts                  types and interfaces
  constants.ts              constants, static data, context objects
  hooks/use-hook-name.ts    one hook per file
  utils/function-name.ts    pure helpers (the folder is `utils/`, like src/utils)
  components/               sub-components used only by this component,
                            each following this same rule
```

- **Helpers** may be grouped by topic in one file named for the topic
  (`utils/comparison-timing.ts`), not one file per function.
- **Downward sharing is not "global".** A unit's sub-components may import
  their parent's `types.ts` and `constants.ts`; only sharing across unrelated
  units promotes to `src/`.
- **Stateful units.** A component or page that owns state, effects, refs, or
  timers (`VirtualGuitarString`, `SoundPropagationLab`, `LessonTwoPage`, and any
  other with effects) gets exactly **one** hook, `hooks/use-<unit>.ts`, that
  moves the existing body **verbatim**: the same hook calls in the same order,
  the same dependency arrays, refs created and shared inside it, and the
  component calls it once at the same position. Effects are never split,
  merged, or reordered in this change.
- **Only create a file that has content.** A tiny component is just
  `name/name.tsx`. No empty placeholder files.
- **Main file.** A unit that exports no component, hook, or logic (a data
  module) has only its parts, for example `types.ts` and `constants.ts`.
- **Names.** Files and folders are kebab-case; exported identifiers keep their
  names (`VirtualGuitarString`, `useLessonTwoAudio`). Named exports only.
- **Imports** use explicit file paths through `@/`, for example
  `@/components/lesson/choice-question/choice-question`. No barrels.
- **Sharing.** A type, constant, hook, or helper used by one unit stays in that
  unit's folder. Used by two or more units, it moves to the global
  `src/hooks`, `src/utils`, or a new `src/constants` (types stay in the owning
  unit's `types.ts` and are imported from there). A sub-component that a second
  unit starts to use becomes a sibling unit.
- **Exceptions** (not restructured): `src/main.tsx`, `src/router.tsx`, and
  everything the Untitled UI CLI owns (`src/components/base|application|foundations/**`,
  `src/utils/cx.ts`, `src/utils/is-react-component.ts`, `src/hooks/use-breakpoint.ts`,
  `src/hooks/use-clipboard.ts`, `src/styles/theme.css`).
- **Grouping folders** such as `components/lesson/` stay; the rule applies
  inside them.

## Mapping

| Today | Target |
|---|---|
| `components/lesson/VirtualGuitarString.tsx` | `lesson/virtual-guitar-string/`: `.tsx`, `types.ts` (StringState, AudioStatus, Props), `constants.ts` (motionFrames), `utils/plucked-string.ts` (buffer synthesis, audio context), `hooks/use-virtual-guitar-string.ts` (the whole state, 4 effects, refs, and timers, verbatim) |
| `components/lesson/SoundPropagationLab.tsx` | `lesson/sound-propagation-lab/`: `.tsx`, `types.ts`, `constants.ts` (markers, offsets, wavefront positions), `utils/frame-description.ts`, `hooks/use-sound-propagation-lab.ts` (states and timeout effects, verbatim), `components/prediction-mini-scheme/` |
| `components/lesson/FrequencyPitchLab.tsx` | `lesson/frequency-pitch-lab/`; `RepeatDensityTrack` is also used by `PitchLoudnessComparison`, so it becomes the sibling unit `lesson/repeat-density-track/` |
| `components/lesson/useLessonTwoAudio.ts` | `src/hooks/use-lesson-two-audio/` (used by six units): hook, `types.ts`, `constants.ts` (attack, release, pluck), `utils/create-plucked-buffer.ts` |
| other `components/lesson/*.tsx` (ChoiceQuestion, FrequencyComparison, FrequencyPitchCheckpoint, GuitarApplication, LessonProgressPanel, LessonShell, LessonStep, PitchLoudnessComparison, RealWorldExperiment, SameStringDiagram, SameStringPitchExperience, SoundPathCheckpoint) | one folder each; `ChoiceQuestionChoice` and `PitchPath` move to their owners' `types.ts` |
| `AppLayout`, `RootLayout`, `RouteError`, `LessonCard`, `SectionHeading` | one folder each under `components/` |
| `pages/LessonTwoPage.tsx` | `pages/lesson-two-page/`: `.tsx`, `constants.ts` (stopByStep, button classes), `hooks/use-lesson-two-page.ts` (step gating, callbacks, reduced motion, focus; verbatim) |
| `pages/AccountPage.tsx` | `pages/account-page/`: `.tsx`, `constants.ts` (`avatars`, `inputClass`, `primaryButton`), `components/{error-summary,auth-form,profile-form,delete-account}/` (the four local components, each its own unit, importing the page's `constants.ts`) |
| other `pages/*.tsx` | one folder each; `router.tsx` lazy imports updated |
| `auth/AuthProvider.tsx`, every top-level declaration | `auth/auth-provider/`: `auth-provider.tsx` (`AuthProvider`), `types.ts` (`Profile`, `AccountUser`, `Credentials`, `AuthState`, `AuthContextValue`), `constants.ts` (`AuthContext`), `utils/api.ts` (`api<T>()`). `class ApiError` is a runtime class shared with `AccountPage`, so it becomes the global `src/utils/api-error.ts`. `useAuth` becomes `src/hooks/use-auth.ts`. Importers updated: `AppLayout` and `use-lesson-progress` (`useAuth`), `RootLayout` (`AuthProvider`), `AccountPage` (`ApiError`, `useAuth`, `Profile`) |
| `providers/route-provider.tsx` | `providers/route-provider/route-provider.tsx` |
| `progress/core.ts`, `lesson-one.ts`, `lesson-two.ts` | `progress/core/`, `progress/lesson-one/`, `progress/lesson-two/`: `types.ts`, `constants.ts` (storage keys), `utils/` (parse, normalize, read/write, merge), adapter file |
| `progress/useLessonProgress.ts`, `useLesson*Progress.ts` | `progress/use-lesson-progress/` (hook plus `types.ts`, `utils/`), `use-lesson-one-progress.ts`, `use-lesson-two-progress.ts` |
| `data/lessons.ts` (`LessonStatus`, `Lesson`, `lessons`) | `data/lessons/types.ts` and `data/lessons/constants.ts`; importers change from `@/data/lessons` to the explicit file paths |
| `data/lessons/stage-01-lesson-01.ts` | `data/lessons/stage-01-lesson-01/`: `types.ts` (`LessonOneStepId`), `constants.ts` (`lessonOneContent`) |
| `data/lessons/stage-01-lesson-02.ts` | `data/lessons/stage-01-lesson-02/`: `types.ts` (`LessonTwoStepId`), `constants.ts` (`sameStringExperience`, `lessonTwoContent`) |
| `data/lessons/stage-01-lesson-02-model.ts` | its own unit `data/lessons/stage-01-lesson-02-model/`: `types.ts` (`LabFrequency`, `PitchChange`, `ChainCard`, `ChainAttemptOutcome`), `constants.ts` (comparison counts and durations, `labFrequencies`, gains, `toneDurationSeconds`, `stringPluckFrequency`, chains), `utils/{comparison-timing,lab,chain}.ts` (the pure functions, grouped by topic) |

The extraction is mechanical: cut types, constants, helpers, and hooks into
files and import them back. Effects and state stay in the same order and keep
the same dependencies.

## Slices (three PRs, after this design is approved)

1. **PR 1: rule, auth, and non-UI code.** Add the rule to `CLAUDE.md`, replace
   the `untitled-ui` skill sentence "Other project files keep the repo's
   existing names." with "All files and folders are kebab-case; each `.tsx`
   lives in a folder of the same name (see CLAUDE.md, Component structure).",
   and update the README source tree. Restructure `auth/` (so `useAuth` and
   `ApiError` already live at their final paths, which `use-lesson-progress`
   needs), `data/`, and `progress/`. Update the four `build/` tests' relative
   import paths (they keep relative imports) and the `useAuth`/`ApiError`
   import lines in `AppLayout`, `RootLayout`, and `AccountPage`.
2. **PR 2: components.** First commit: characterization e2e tests (see below),
   written against the unchanged code. Then everything under `src/components`
   except CLI-owned files, plus `use-lesson-two-audio`.
3. **PR 3: pages and providers.** Plus the guard test
   `build/source-structure.test.ts`. It encodes this exact allowlist:
   `src/main.tsx`, `src/router.tsx`, `src/vite-env.d.ts`,
   `src/components/{base,application,foundations}/**`,
   `src/utils/{cx,is-react-component}.ts`,
   `src/hooks/{use-breakpoint,use-clipboard}.ts`. It enforces only two things:
   every `.ts`/`.tsx` file name under `src` is kebab-case, and every `.tsx`
   outside the allowlist sits in a folder with the same name. It does not
   enforce which files a unit has, when a `.ts` module should be split, or the
   sharing rules (those are review rules); `.ts` hooks need no folder.

## Security and privacy

None: no runtime, API, or data change.

## Rollback

Revert the PR; each slice stands alone.

## Test strategy

For every PR: `corepack pnpm test`, `corepack pnpm build`, `git diff --check`,
`corepack pnpm test:browser`, and the before/after screenshots of Home,
Lesson 1, Lesson 2, and Account at 1280 and 375 px, which must stay at 0
differing pixels. The repo has no screenshot tooling and gets none: the
comparison is a manual procedure with a throwaway Playwright script (build
`main` and the branch, capture the 8 pages, `compare -metric AE`), whose result
goes in each PR body. Moves use `git mv` so history follows. The built chunk
list stays the same (the lazy pages keep their own chunks).

Screenshots at rest do not exercise audio, timers, or focus, so behavior is
covered by tests, not by pixels:

| Unit | Covered by |
|---|---|
| Lesson 2 units (`LessonTwoPage`, the lab, comparison, checkpoint, `use-lesson-two-audio`) | the 16 tests in `e2e/lesson-two.spec.ts` (step gating, reduced motion, audio capped and silenced on a hidden tab, blocked audio, corrupted storage) |
| `auth-provider`, `account-page`, `use-lesson-progress` | `e2e/account-profile.spec.ts` (10 tests) and the `build/` progress tests |
| Lesson 1 units (`VirtualGuitarString`, `SoundPropagationLab`, `SoundPathCheckpoint`) | **no behavioral e2e today** (only the progress tests touch Lesson 1). PR 2 begins with characterization tests written against the unchanged code: pluck, pause, and stop of the string with its state labels; the propagation lab frames with reduced motion and its prediction; the sound-path checkpoint answer states. They must pass before the move and stay unchanged after it |
