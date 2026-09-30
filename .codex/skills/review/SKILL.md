---
name: review
description: Independently review a design or a PR diff, post findings with stable IDs and one verdict as a PR comment.
---

# Review

Review only. Never modify the reviewed design or code. The session or agent
that wrote the change must not review it. If the author keeps working during
the review, review in a separate git worktree at the PR head
(`git worktree add --detach <dir> <sha>`). Never switch branches in a shared
checkout.

Read:

- `AGENTS.md`;
- the latest earlier review, if any:
  `gh pr view <n> --json comments --jq '[.comments[] | select(.author.login == "olegkirienko" and (.body | startswith("## Review")))][-1].body'`;
- the design. For an implementation review, read its goal, non-goals,
  constraints, acceptance criteria, and the slice under review;
- the change: `git diff --stat origin/main...HEAD` first, then diff single
  paths.

Do not re-run the validation. Read the CI result with
`gh pr checks <n>` and record it. Run one targeted command only when a finding
needs evidence that CI cannot provide.

Assess correctness, design compliance, scope, regressions, security, and
privacy. For a lesson, also assess the pedagogy against `AGENTS.md`,
accessibility, and cognitive load.

Scale the depth to the risk:

- **Behavioral checks** are for risky areas: auth, persistence and progress
  sync, migrations, deployment, credentials, audio safety, and security. Use
  targeted tests, scratch probes, or a quick mutation check to confirm that a
  test would catch a regression.
- **Reading the diff** is enough for copy, styling, docs, and layout.

Findings get stable IDs (`HIGH-01`, `MEDIUM-01`, `LOW-01`). Each finding has
evidence (`file:line`), impact, a correction, and a verification. Report only
concrete, high-confidence problems; style preferences are not findings.

Verdict: `APPROVED` or `CHANGES REQUIRED`.

Post the review as one PR comment of about 3 KB: write the body to a file
outside the repository, then run `gh pr comment <n> --body-file <file>`. The
body starts with `## Review — <design | commit SHA> — <date>` and records the
validation results, the findings, and the verdict. Do not add review files to
the repository.

Only open `HIGH` or `MEDIUM` findings get a re-review. It checks just those
findings plus direct regressions, marks each `FIXED` or `NOT FIXED`, and may
use a faster model. `LOW` findings are fixed without a re-review: the author
lists them as fixed in a short PR comment, and the next full review of the
PR confirms them.

After posting, stop with the next prompt:

- after `CHANGES REQUIRED`, the fix prompt;
- after `APPROVED`, the owner's design approval, or the merge approval that
  names the full PR head SHA.
