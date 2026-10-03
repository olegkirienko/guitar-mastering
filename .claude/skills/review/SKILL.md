---
name: review
description: Independently review a design or a PR diff, post findings with stable IDs and one verdict as a PR comment.
---

# Review

Review only. Never modify the reviewed design or code. The session or agent
that wrote the change must not review it. Review the exact PR head without
switching branches in a shared checkout. Run these as separate commands with
the literal SHA; command substitution is refused by the permission check:

1. `git fetch origin`
2. `gh pr view <n> --json headRefOid --jq .headRefOid`
3. The `reviewer` subagent already runs in its own worktree:
   `git checkout --detach <SHA>`. A separate session creates one instead:
   `git worktree add --detach <dir> <SHA>`, and removes it afterwards.

Read:

- the latest earlier review, if any:
  `gh pr view <n> --json comments --jq '[.comments[] | select(.author.login == "olegkirienko" and (.body | startswith("## Review")))][-1].body'`;
- the design. For an implementation review, read its goal, non-goals,
  constraints, acceptance criteria, and the slice under review;
- the change: `git diff --stat origin/main...HEAD` first, then diff single
  paths.

Do not re-run the validation. Gate on CI instead:

1. Wait for the checks with
   `gh pr checks <n> --watch --interval 20 > /dev/null`.
2. Read them with
   `gh pr view <n> --json headRefOid,statusCheckRollup --jq '{head: .headRefOid, checks: [.statusCheckRollup[] | "\(.name)=\(.conclusion)"]}'`.
3. The head must equal the SHA under review, and every check must be
   `SUCCESS`. If a check is pending, failing, or for another SHA, the verdict
   cannot be `APPROVED`. Report that instead.

Run one targeted command only when a finding needs evidence that CI cannot
provide.

Assess correctness, design compliance, scope, regressions, security, and
privacy. For a lesson, also assess the pedagogy against `CLAUDE.md`,
accessibility, and cognitive load.

Scale the depth to the risk:

- **Behavioral checks** are for risky areas: auth, persistence and progress
  sync, migrations, deployment, `.github/`, `.railway/`, `server/`,
  credentials, audio safety, and security. Use targeted tests, scratch probes,
  or a quick mutation check to confirm that a test would catch a regression.
  A change to CI itself is not proven by its own green run, so read that
  workflow change directly.
- **Reading the diff** is enough for copy, styling, docs, and layout.

Findings get stable IDs (`HIGH-01`, `MEDIUM-01`, `LOW-01`). Each finding has
evidence (`file:line`), impact, a correction, and a verification. Report only
concrete, high-confidence problems; style preferences are not findings.

Verdict:

- `CHANGES REQUIRED` when any `HIGH` or `MEDIUM` finding is open, or CI is not
  green for the reviewed SHA;
- `APPROVED` otherwise, including when only `LOW` findings remain. These are
  non-blocking.

Post the review as one PR comment of about 3 KB: write the body to a file
outside the repository, then run `gh pr comment <n> --body-file <file>`. The
body starts with `## Review — <design | commit SHA> — <date>` and records the
validation results, the findings, and the verdict. Do not add review files to
the repository.

Only open `HIGH` or `MEDIUM` findings get a re-review. It checks just those
findings plus direct regressions, marks each `FIXED` or `NOT FIXED`, and may
use a faster model. `LOW` findings are fixed without a re-review: the author
posts a short `## Fixes` PR comment listing them. The owner's merge approval
names the resulting head, so it covers those fixes.

After posting, stop with the next prompt:

- after `CHANGES REQUIRED`, the fix prompt;
- after `APPROVED`, the owner's design approval, or the merge approval that
  names the full PR head SHA.
