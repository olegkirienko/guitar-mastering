---
name: review
description: Independently review a design or a PR diff, record findings with stable IDs in the change's review file, and give one verdict.
---

# Review

Review only. Never modify the reviewed design or code. The session or agent
that wrote the change must not review it.

Read:

- `AGENTS.md`;
- the design. For an implementation review, read its goal, non-goals,
  constraints, acceptance criteria, and the slice under review;
- the change: `git diff --stat origin/main...HEAD` first, then diff single
  paths.

Run the validation that `AGENTS.md` requires.

Assess correctness, design compliance, scope, regressions, security, and
privacy. For a lesson, also assess the pedagogy against `AGENTS.md`,
accessibility, and cognitive load.

Findings get stable IDs (`HIGH-01`, `MEDIUM-01`, `LOW-01`). Each finding has
evidence (`file:line`), impact, a correction, and a verification. Report only
concrete, high-confidence problems; style preferences are not findings.

Verdict: `APPROVED` or `CHANGES REQUIRED`.

Append a dated section to `docs/reviews/<topic>.md`, kept near 3 KB. It
records:

- the scope (design, or the commit SHA);
- the validation results;
- the findings;
- the verdict.

On a re-review, check only the open findings plus direct regressions, and mark
each one `FIXED` or `NOT FIXED`.

Commit and push the review file, then stop with the next prompt:

- after `CHANGES REQUIRED`, the fix prompt;
- after `APPROVED`, the owner's design approval, or the merge approval that
  names the full PR head SHA.
