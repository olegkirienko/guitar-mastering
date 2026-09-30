---
name: review
description: Independently review a design or a PR diff, post findings with stable IDs and one verdict as a PR comment.
---

# Review

Review only. Never modify the reviewed design or code. The session or agent
that wrote the change must not review it.

Read:

- `AGENTS.md`;
- the latest earlier review, if any:
  `gh pr view <n> --json comments --jq '[.comments[] | select(.body | startswith("## Review"))][-1].body'`;
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

Post the review as one PR comment of about 3 KB: write the body to a file
outside the repository, then run `gh pr comment <n> --body-file <file>`. The
body starts with `## Review — <design | commit SHA> — <date>` and records the
validation results, the findings, and the verdict. Do not add review files to
the repository.

On a re-review, check only the open findings plus direct regressions, and mark
each one `FIXED` or `NOT FIXED`.

After posting, stop with the next prompt:

- after `CHANGES REQUIRED`, the fix prompt;
- after `APPROVED`, the owner's design approval, or the merge approval that
  names the full PR head SHA.
