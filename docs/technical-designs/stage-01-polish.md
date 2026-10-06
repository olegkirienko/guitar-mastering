# Stage I polish

## Goal and non-goals

**Goal.** Six defects the owner found while walking through the delivered Stage I
are fixed in one change: the step indicator disagrees with the step list, the
intro step carries a stray audio toggle, every step puts «далі» before «назад»,
the lesson 1 sound-path checkpoint is confusing to read and to operate, the
course page does not say which stage a lesson belongs to, and the account menu
does not look like a menu, so the learner cannot find «Вийти».

**Non-goals.** New lessons or new pedagogy; a Stage II entry on the course page;
any server, API or progress-schema change; new dependencies; drag-and-drop
reordering anywhere; a theme or header redesign beyond the account trigger.

## 1. One progress model per lesson

**Problem.** A lesson has two independent progress models. The step list
(`LessonStepList`) is built from `courseLessons[].steps`, while the bar in the
header is built from `progressStops` in the lesson content plus a `currentStop`
number the page computes. The two drift:
`src/pages/lesson-one-page/lesson-one-page.tsx:18` maps the five steps to
`1, 1, 4, 5, 5`, so step 2 reads «Крок 1 із 5» and step 4 reads «Крок 5 із 5».
Lesson 2 folds eight steps into five stops, lessons 3 and 4 fold seven into six,
and lesson 5 folds six into six, so `complete` always repeats the previous stop.

**Design.** The step list becomes the only model. `LessonShell` already computes
`currentIndex` from `steps` and `currentStepId`; the bar uses that index and
`steps.length`, so the number beside the bar and the number in the list can no
longer disagree. The short caption on the right stays: the lesson content keeps
one short word per step, keyed by step id.

Contract change in `src/components/lesson/lesson-shell/types.ts`:

- remove `currentStop: number`;
- replace `progressStops: readonly string[]` with
  `stepLabels: Record<string, string>`;
- the caption renders `stepLabels[currentStepId]`, falling back to the step
  title when a key is missing; `currentIndex` is clamped with
  `Math.max(currentIndex, 0)` so an unknown step id cannot produce `0 із N`.

Each of the five content files converts its `progressStops` array into
`stepLabels`, one entry per step id, reusing the existing words. Lesson 1:
`intro: 'Питання'`, `string: 'Струна'`, `air: 'Повітря'`,
`checkpoint: 'Шлях звуку'`, `complete: 'Підсумок'`. Lessons 2–5 keep their
current words and add one for the step that had none. The four
`stopByStep` constants (`src/pages/lesson-*-page/constants.ts`) and every
`currentStop` prop are deleted; `src/pages/lesson-one-page/constants.ts` is not
created.

## 2. Step navigation primitive

**Problem.** Every step of the five lesson pages writes its next/back pair
inline; `grep -ro 'iconTrailing={ArrowRight}' src/pages/lesson-*` and the same
grep for `iconLeading={ArrowLeft}` each return twenty-eight hits today, so the
count is what those two greps report, not a separate claim. The forward button
is always rendered first, the back button is `color="link-gray" size="md"` next
to a `size="lg"` primary, so the two sit on one line with different heights and
no shared baseline.

**Design.** A new primitive `src/components/lesson/lesson-step-nav/` with
`lesson-step-nav.tsx` and `types.ts`:

```
LessonStepNavProps = {
  back?: { label: string; onClick: () => void };
  next?: { label: string; onClick: () => void };
}
```

It renders one `flex flex-wrap items-center gap-3` row, back first
(`color="link-gray" size="lg"`, `iconLeading={ArrowLeft}`), then next
(`size="lg"`, `iconTrailing={ArrowRight}`). Both are optional: the first step has
no back, and most steps reveal next only once the step is complete, which today
is expressed as `{progress… && <Button …>}` and becomes
`next={isComplete ? { … } : undefined}`. The back button keeps the focus
bookkeeping it has today (`setShouldFocusX(false); setShouldFocusY(true);
goTo(…)`) — the primitive takes the handler, not the routing. Completion
buttons that are not navigation (`Завершити урок`, in-lab controls) stay as they
are.

## 3. Intro step without an audio toggle

The intro step of lesson 1 renders «Звук: увімкнено / вимкнено» directly above
«Почати дослід», two buttons of different weight with no row to hold them. The
preference is already offered where the sound happens:
`virtual-guitar-string.tsx:54` has «Увімкнути звук» / «Вимкнути звук», wired to
the same `audioEnabled` state. The intro toggle is removed. `audioEnabled`,
its persistence and the line «Аудіо не запускається автоматично й не потрібне,
щоб пройти урок.» stay, so nothing about the audio contract changes.

## 4. The sound path rebuilt link by link

### What is wrong

Pedagogy: the card «Гітара рухає сусіднє повітря» names the guitar body as the
thing that moves the air, but lesson 1 never shows the body doing anything — the
learner has met a vibrating string and the air beside it. It also contradicts
the chain in `docs/course-map/stage-01-sound.md`
(`струна → коливання → середовище → звукова хвиля → вухо → мозок`) and the
wording lesson 5 already uses for the same link.

Interaction: five cards, each with «Раніше» and «Пізніше», ask the learner to
sort a list in which nothing is anchored. The success condition is global — the
whole permutation must be right before «Перевірити порядок» says anything — so a
learner who knows four links out of five gets the same «Знайдено перший розрив.»
as one who knows none. Drag-and-drop is offered in parallel and is unusable with
a keyboard.

### New mechanic: build the chain forward

`SoundPathCheckpoint` keeps its name, its place in both lessons and its content
contract, but the ordering task becomes a forward chain build:

1. The first card is placed for the learner and shown as link 1 of the chain,
   with its number and illustration. The lesson has already established it.
2. One question at a time, «Що відбувається далі?», lists the cards that are not
   yet in the chain, in the order given by `initialOrder` minus the ids already
   attached. Because `initialOrder` is a permutation of all cards, it contains
   `cards[0]`; that id is the pre-placed link of step 1 and is therefore never
   offered. The order is deterministic — no `Math.random`, so the e2e specs stay
   stable.
3. A correct pick attaches the card as the next link, announces it through the
   existing `aria-live` region and moves to the next question.
4. A wrong pick does not attach anything. It shows `breakHints[position]` — the
   hint array already reads as one nudge per link — and the learner picks again.
   After two wrong picks on the same link, the existing «Показати й пояснити»
   button appears; it keeps its label, but it now attaches only the one correct
   card for the current link instead of revealing the whole order, and the
   `attempts` counter resets for the next link.
5. When the last link attaches, the chain is shown whole with the existing
   `content.summary`, and the control question (`ChoiceQuestion` with
   `controlQuestion` / `controlChoices` / `correctChoiceId`) decides the pass,
   unchanged.

Focus after every attach, whether it came from a correct pick or from
«Показати й пояснити», moves to the next question's group label; when the last
link attaches it moves to the summary heading instead.

A learner who returns with `initiallyPassed` does not answer again: the chain
starts complete (`chain` is `cards.map(card => card.id)`), `attempts` is `0`,
`explained` is `false`, and the summary and the control question are shown in
their passed state, matching what `initiallyPassed` does today.

This matches the lesson flow in `CLAUDE.md`: each link is a prediction, the
answer is checked at once, and the feedback is local to the link the learner got
wrong instead of to the whole permutation.

### Content contract

`SoundPathCheckpointContent` is unchanged except that `initialOrder` is
redocumented as the order the unplaced cards are offered in. `cards` stays the
correct order, `breakHints` stays one hint per position. No lesson content key
is added or removed, so lesson 5's `path` step keeps working with its own words.

Removed from the component: `handleDragStart`, `handleDrop`, `moveCard`,
`checkSequence`, the `draggable` list and the «Раніше» / «Пізніше» buttons.
`SequenceResult` collapses to the chain state (`chain: string[]`,
`attempts: number` for the current link, `explained: boolean`).

### Lesson 1 wording

| id | before | after |
| --- | --- | --- |
| `string` | Струну смикнули — вона коливається | unchanged |
| `guitar-air` → `air` | Гітара рухає сусіднє повітря | Коливання штовхають сусіднє повітря |
| `wave` | Зміна поширюється як звукова хвиля | Зміна у повітрі біжить як звукова хвиля |
| `ear` | Хвиля досягає вуха | unchanged |
| `perception` | Ми сприймаємо звук | unchanged |

Card ids are not persisted — lesson 1 progress stores step ids and
`checkpointPassed` only — so renaming `guitar-air` to `air` is safe.
`breakHints[1]` becomes «Що саме штовхає струна одразу після того, як почала
коливатися?» to match. Lesson 5's cards and hints are not touched; its labels
are already the clearer ones. Terminology boundary is unchanged: the lesson still
names only `коливання`, `повітря`, `звукова хвиля`, and the guitar body is not
mentioned before the learner has seen it.

### Progress and accessibility

Step ids (`intro`, `string`, `air`, `checkpoint`, `complete`) and the pass
condition are unchanged: `checkpointPassed` is still set by the control
question, not by the chain. Every control is a button in document order, the
chain is an `<ol>`, the new question is a labelled group, and each attach is
announced through the existing polite live region. On a phone the screen is one
chain plus one list of choices, instead of five cards with two buttons each.

## 5. Stages on the course page

`courseLessons` carries `routeId`, `lessonId`, `title` and `steps`, and nothing
says which stage a lesson belongs to; the page renders one flat list. Each entry
gains `stageLabel`, taken from the lesson content that is already imported there
(`lessonOneContent.stageLabel` = «Етап I · Звук»), so the label has one source.

`useCoursePage` groups consecutive lessons with the same label into
`CourseStageView[] = { label, completed, total, lessons }`, and the page renders
one section per stage: a heading with the label and «{completed} з {total}
уроків», then the lesson cards. All five lessons are Stage I today, so the page
gains one heading; the grouping is what makes Stage II readable later. No
accordion — with one stage it would only hide the page's whole content. A new
sub-component `src/pages/course-page/components/course-stage/` owns the section;
`course-lesson` is unchanged, and `CourseStageView` goes in the page's
`types.ts`.

## 6. The account menu looks like a menu

Signing out works today: `app-layout.tsx:58` has «Вийти» in the avatar menu,
`/account` has a «Вийти» button, and `e2e/account-profile.spec.ts` covers both.
What fails is discovery — the trigger is a bare avatar circle with no chevron
and no label, so it does not read as something to open.

The trigger becomes a bordered button holding the avatar, the display name (or
`@username`) and `ChevronDown`, with the chevron rotating while the menu is
open. The text is hidden below `sm` and the avatar alone remains. The
`aria-label` stays «Меню акаунта @{username}», so the accessible name and the
existing e2e selectors do not change. The menu items stay «Акаунт» and «Вийти».

## Security and privacy

Nothing in this change touches authentication, session handling or the sign-out
request; `auth.logout()` and its route are untouched. No new data is stored or
sent, and card ids and step labels are static content. The reflection textarea in
lesson 1 stays private and unsaved.

## Migrations, deployment and rollback

No migration: no progress key, step id or server catalog entry changes, and a
learner's saved lesson 1 progress — including `checkpointPassed` — keeps its
meaning. Deployment is the standard Railway deploy of `main`; rollback is a
revert of the merge commit, after which the old step indicator and the old
checkpoint return with no stored state to repair.

## Test strategy

- Unit (`corepack pnpm test`): the shell derives «Крок N із M» from the step
  list, including the clamp for an unknown step id; `LessonStepNav` renders back
  before next and omits either when absent; the chain builder attaches on a
  correct pick, refuses and hints on a wrong one, and reveals after two wrong
  picks; the first question does not offer `cards[0]`, even though `initialOrder`
  contains it; with `initiallyPassed` the initial state is the complete chain
  with the summary and no open question; `useCoursePage` groups lessons into
  stage views with the right counts.
- Browser (`corepack pnpm test:browser`): `lesson-one.spec.ts` loses the intro
  audio toggle and the «Раніше» / «Перевірити порядок» steps and gains the chain
  picks, and asserts that focus lands on the next question after an attach and on
  the summary after the last link; `lesson-five.spec.ts` updates its task 4 the
  same way;
  `account-profile.spec.ts` is unchanged and proves the menu still signs out;
  the course flow asserts the stage heading. A walk through lesson 1 asserts
  that the indicator number matches the highlighted step on every step.
- `corepack pnpm build` and `git diff --check` as usual.

## Slices

Each slice is a checkpoint inside the one PR.

**Slice 1 — progress model.** Scope: `lesson-shell` types and bar, `stepLabels`
in all five content files, delete `stopByStep` and `currentStop`.
Acceptance: on every step of every lesson the number beside the bar equals the
highlighted step in the list and in the mobile summary; unit tests cover the
derivation; `corepack pnpm build` is green.

**Slice 2 — navigation.** Scope: `lesson-step-nav` primitive, every inline pair
in the five pages, remove the intro audio toggle (§3).
Acceptance: no inline next/back pair remains in `src/pages/lesson-*` —
`grep -r 'iconTrailing={ArrowRight}\|iconLeading={ArrowLeft}' src/pages/lesson-*`
returns nothing, and the only matches left in `src/pages` are the course and
home pages, which this design does not touch; every step shows back then next in
one centred row; conditional next buttons still appear only when the step is
complete; back still restores focus to the previous step's heading; the intro
shows one primary button.

**Slice 3 — sound path.** Scope: the new chain mechanic in
`sound-path-checkpoint`, lesson 1 card and hint wording, both e2e specs.
Acceptance: lesson 1 and lesson 5 reach `checkpointPassed` only through the
control question; a wrong pick hints and does not attach; two wrong picks offer
the explanation; no draggable element and no «Раніше» / «Пізніше» remains; the
chain reads as the course-map chain.

**Slice 4 — stages.** Scope: `stageLabel` on `courseLessons`, grouping in
`useCoursePage`, the `course-stage` section.
Acceptance: the course page shows «Етап I · Звук» with «N з 5 уроків» above the
lesson cards; lesson cards, badges and resume are unchanged.

**Slice 5 — account menu.** Scope: the header trigger in `app-layout`.
Acceptance: the trigger shows avatar, name and chevron on `sm` and up, avatar
alone below; the menu opens with pointer and keyboard; `aria-label` and the menu
items are unchanged and `account-profile.spec.ts` passes untouched.
