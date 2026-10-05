# Dark theme

## Goal and non-goals

**Goal.** Learners can read every page in a dark theme. A signed-in learner
chooses `Системна`, `Світла` or `Темна` on the account page; the choice is a
server-side account preference, like `audioEnabled` and `prefersStatic`. Guests
and signed-out pages follow the operating-system setting.

**Non-goals.** A theme switch in the header; a warm (cream-tinted) dark palette
— the dark surfaces use Untitled UI's neutral dark scale as shipped; per-device
overrides; anything kept in `localStorage` (the rule from
`redesign-account-only.md` stays, and its e2e assertion stays green).

## Current state

- `src/styles/theme.css` already defines every semantic token for light and,
  under `.dark-mode`, for dark; `globals.css` maps the `dark:` variant to
  `.dark-mode`. Since #44 the app code uses only semantic tokens, so applying
  the class switches the palette. Nothing sets the class today.
- The one raw colour left is `fill="#fff"` in
  `src/components/lesson/sound-propagation-lab/sound-propagation-lab.tsx:41`.
- `index.html` has `<meta name="theme-color" content="#ffffff">` and no
  `color-scheme`, so native controls and scrollbars stay light.
- The CSP in `server/app.ts` is `script-src 'self'`: no inline scripts.
- `user_preferences` (migration `002`) holds `audio_enabled` and
  `prefers_static`. `PUT /api/v1/preferences` requires exactly those two keys
  (`server/auth.ts:186`). The client sends the full object through
  `updatePreferences` in `src/auth/auth-provider/auth-provider.tsx`.

## Design

### Data and API contract

- Migration `003_user_theme.cjs`:
  `ALTER TABLE user_preferences ADD COLUMN theme text NOT NULL DEFAULT 'system'
  CHECK (theme IN ('system', 'light', 'dark'))`. Additive, `down = false` like
  `002`.
- `PreferencesView` gains `theme: 'system' | 'light' | 'dark'`;
  `preferencesView` maps a missing row or `null` to `'system'`. Every
  `UserView` (session, login, register) carries it.
- `PUT /api/v1/preferences` accepts `{ audioEnabled, prefersStatic }` or
  `{ audioEnabled, prefersStatic, theme }`. When `theme` is absent the stored
  value is kept (the upsert sets `theme` only from a supplied value; insert
  uses the default). This keeps a tab opened before the deploy working. Any
  other key set, or a `theme` outside the three values, is `422
  INVALID_FIELDS`. The response is the full `PreferencesView`.
- Client `Preferences` gains `theme`; `defaultPreferences.theme = 'system'`.
  `updatePreferences({ theme })` reuses the existing optimistic update,
  rollback and `preferencesSaveFailed` flag.

### Applying the theme

- `src/components/root-layout/hooks/use-root-layout.ts` (only the root layout
  uses it, so it stays in that unit per `CLAUDE.md`) resolves the effective
  theme: the signed-in user's `theme` when it is not `'system'`, otherwise
  `matchMedia('(prefers-color-scheme: dark)')`, listening for changes. It
  toggles `.dark-mode` on `document.documentElement`, sets
  `document.documentElement.style.colorScheme` and the `theme-color` meta's
  `content`. It applies them in `useLayoutEffect`, so the class changes in the
  same commit as the session result, before the browser paints the page that
  replaces `PageSkeleton`. On logout or account deletion the user is gone, so
  the theme falls back to the system.
- `public/theme-init.js`, a blocking classic script in `<head>`
  (`<script src="/theme-init.js"></script>`, allowed by `script-src 'self'`),
  applies the system theme (class, `colorScheme`, `theme-color`) before first
  paint, so a dark-system user sees no white flash.
- Known limitation: a signed-in user whose choice differs from the system sees
  the skeleton in the system theme until the session response, then the page
  in their theme. Removing it would need the choice in browser storage or a
  cookie, which the non-goals exclude. The PR notes this.
- `index.html`: `<meta name="color-scheme" content="light dark">` and one
  `<meta name="theme-color">` whose `content` is the light or dark `bg-primary`
  value, set by the init script and the hook, so mobile browser chrome follows
  an explicit choice too.
- `sound-propagation-lab.tsx:41`: `fill="#fff"` becomes `className="fill-bg-primary"`.

### Account page

A new section `Вигляд` between `Профіль` and `Небезпечна зона`, built with the
Untitled UI `radio-buttons` component already in `src/components/base`:
`Системна` (hint: «Як у налаштуваннях пристрою»), `Світла`, `Темна`. Selecting
an option applies it immediately and saves it. On a failed save the selection
reverts and the existing preferences error text appears. The component lives
in `src/pages/account-page/components/theme-preference/`.

### Contrast check

Each page is checked in dark at 375 px and 1280 px: body and tertiary text,
brand text and buttons, borders, focus rings, the lesson SVGs (they use
`fg-*`, `utility-brand-*` and `border-*`, which `.dark-mode` remaps) and the
skeleton. A token that fails WCAG AA (4.5:1 text, 3:1 non-text) is fixed by
overriding that token inside `.dark-mode` in `theme.css`, not in a component.
Each override is listed in the PR.

## Security and privacy

The theme is a non-sensitive preference tied to the account and deleted with
it by the existing `ON DELETE CASCADE`. Input is validated against a closed
set on the server and by the database `CHECK`. The init script is a static
same-origin file, so the CSP is unchanged. Nothing is written to browser
storage.

## Migrations, deployment and rollback

The migration is additive with a default, so the previous release keeps
working against the migrated schema: its insert gets `'system'` and its upsert
never touches `theme`. Rollback is a redeploy of the previous release; the
column stays. The migration runs through the existing release-time migration
step; a failure follows the `delivery-verification` retry path with owner
approval.

## Test strategy

- Server unit (`auth-routes.test.ts`): two-key and three-key bodies accepted,
  bad `theme` and extra keys rejected with 422, missing theme preserved.
- Postgres integration (`auth.integration.test.ts`,
  `migrations.integration.test.ts`): migration applies, default is `'system'`,
  the round-trip persists `'dark'`, the `CHECK` rejects other values.
- Unit (`use-root-layout`): user choice wins, `'system'` follows `matchMedia`
  and its changes, no user means system, `theme-color` follows the effective
  theme.
- Browser (`e2e/`): with `colorScheme: 'dark'` the document has `.dark-mode`
  already at `domcontentloaded` (fails without `theme-init.js`); a guest page
  has `.dark-mode` after load;
  a signed-in learner picks `Темна`, reloads and still has `.dark-mode`, picks
  `Світла` under a dark system and loses it; `localStorage` stays empty; a
  failed save reverts the radio and shows the error.
- Manual contrast pass above, with screenshots in the PR.

## Slices

1. **Server preference.** Migration `003`, `PreferencesView.theme`, PUT
   validation and upsert, server tests. *Accept:* old two-key PUT still works
   and keeps the theme; all server and Postgres tests pass.
2. **Applying the theme.** `theme-init.js`, `index.html` metas,
   `use-root-layout`, client `Preferences.theme`, SVG fill fix. *Accept:* a
   dark system gives a dark app with no white flash; the `domcontentloaded`
   e2e check and the hook unit tests pass.
3. **Account control.** `theme-preference` section with Untitled UI radios,
   optimistic save and revert. *Accept:* the choice persists across reload and
   sign-in on another browser; e2e tests pass.
4. **Contrast pass.** Dark audit of every page; token overrides in `theme.css`
   only where AA fails. *Accept:* screenshots of each page in dark at both
   widths in the PR; no component-level colour overrides.
