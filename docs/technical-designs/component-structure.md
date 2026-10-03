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

Everything is flat: 15 files in `src/components`, 4 in `src/pages`,
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
| `components/lesson/VirtualGuitarString.tsx` | `lesson/virtual-guitar-string/`: `.tsx`, `types.ts` (StringState, AudioStatus, Props), `constants.ts` (motionFrames), `utils/` (plucked-string buffer, audio context), `hooks/` (pluck/pause/stop state and timers) |
| `components/lesson/SoundPropagationLab.tsx` | `lesson/sound-propagation-lab/`: `.tsx`, `types.ts`, `constants.ts` (markers, offsets, wavefront positions), `utils/frame-description.ts`, `hooks/` (frame state and timers), `components/prediction-mini-scheme/` |
| `components/lesson/FrequencyPitchLab.tsx` | `lesson/frequency-pitch-lab/`; `RepeatDensityTrack` is also used by `PitchLoudnessComparison`, so it becomes the sibling unit `lesson/repeat-density-track/` |
| `components/lesson/useLessonTwoAudio.ts` | `src/hooks/use-lesson-two-audio/` (used by six units): hook, `types.ts`, `constants.ts` (attack, release, pluck), `utils/create-plucked-buffer.ts` |
| other `components/lesson/*.tsx` (ChoiceQuestion, FrequencyComparison, FrequencyPitchCheckpoint, GuitarApplication, LessonProgressPanel, LessonShell, LessonStep, PitchLoudnessComparison, RealWorldExperiment, SameStringDiagram, SameStringPitchExperience, SoundPathCheckpoint) | one folder each; `ChoiceQuestionChoice` and `PitchPath` move to their owners' `types.ts` |
| `AppLayout`, `RootLayout`, `RouteError`, `LessonCard`, `SectionHeading` | one folder each under `components/` |
| `pages/LessonTwoPage.tsx` | `pages/lesson-two-page/`: `.tsx`, `constants.ts` (stopByStep, button classes), `hooks/use-lesson-two-page.ts` (step gating, progress callbacks, reduced motion, focus) |
| other `pages/*.tsx` | one folder each; `router.tsx` lazy imports updated |
| `auth/AuthProvider.tsx` | `auth/auth-provider/`: `.tsx`, `types.ts` (five types), `constants.ts` (context); `useAuth` becomes `src/hooks/use-auth.ts` |
| `providers/route-provider.tsx` | `providers/route-provider/route-provider.tsx` |
| `progress/core.ts`, `lesson-one.ts`, `lesson-two.ts` | `progress/core/`, `progress/lesson-one/`, `progress/lesson-two/`: `types.ts`, `constants.ts` (storage keys), `utils/` (parse, normalize, read/write, merge), adapter file |
| `progress/useLessonProgress.ts`, `useLesson*Progress.ts` | `progress/use-lesson-progress/` (hook plus `types.ts`, `utils/`), `use-lesson-one-progress.ts`, `use-lesson-two-progress.ts` |
| `data/lessons/stage-01-lesson-0x*.ts`, `data/lessons.ts` | `data/lessons/stage-01-lesson-02/` (`types.ts` with `LessonTwoStepId`, `constants.ts` with the content, `utils/` with the pure model: safeGain, toneDurationSeconds), the same shape for lesson 01 |

The extraction is mechanical: cut types, constants, helpers, and hooks into
files and import them back. Effects and state stay in the same order and keep
the same dependencies.

## Slices (three PRs, after this design is approved)

1. **PR 1: rule and non-UI code.** Add the rule to `CLAUDE.md` (and the
   kebab-case line of the `untitled-ui` skill, README); restructure `data/` and
   `progress/`; update the four `build/` tests' imports.
2. **PR 2: components.** Everything under `src/components` except CLI-owned
   files, plus `use-lesson-two-audio`.
3. **PR 3: pages, auth, providers.** Plus a guard test
   `build/source-structure.test.ts` that fails when a non-excepted file under
   `src` is not kebab-case or a `.tsx` is not inside a folder of the same name.

## Security and privacy

None: no runtime, API, or data change.

## Rollback

Revert the PR; each slice stands alone.

## Test strategy

For every PR: `corepack pnpm test`, `corepack pnpm build`, `git diff --check`,
`corepack pnpm test:browser` (29 e2e tests, including the lesson flows), and
the before/after screenshots of Home, Lesson 1, Lesson 2, and Account at 1280 and
375 px, which must stay at 0 differing pixels. Moves use `git mv` so history
follows. The built chunk list stays the same (the lazy pages keep their own
chunks).
