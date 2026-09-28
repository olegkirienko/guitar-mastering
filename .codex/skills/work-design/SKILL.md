---
name: work-design
description: Create or revise the authoritative design/specification for an arbitrary work item without modifying application code.
---

# Work Design

Read:
- `AGENTS.md`
- workflow state
- referenced `context`
- relevant prior designs/reviews

For new v3.1 work, initialization must already have established a clean,
synchronized, non-divergent `main`, the deterministic canonical work branch,
a fresh lifecycle generation, and its annotated bootstrap registration. Never
inherit executable state from a stale workflow snapshot on `main`.

Use `work_item_type` only to select relevant concerns; explicit requirements remain authoritative.

Designs own durable decisions, constraints, acceptance criteria, risks, and approved slices. They must not claim the current workflow phase, gate, active finding, or next authorized action.

## lesson

Cover pedagogy, discovery sequence, terminology, accessibility, lesson-state boundaries, mobile behavior, and implementation slices.

## technical_feature

Cover:
- goals/non-goals;
- user flows;
- architecture;
- trust/security boundaries;
- API contracts;
- data model/persistence;
- validation/errors;
- migrations;
- runtime/deployment implications;
- privacy;
- accessibility/UI;
- test strategy;
- implementation slices;
- rollback/compatibility.

## refactor

Cover preserved invariants, migration sequence, regression risks, compatibility, tests, and incremental slices.

## infrastructure

Cover topology, environments, secrets/configuration, security, deployment, rollback, limits/cost where relevant, observability, and failure modes.

Write/update exactly the design path referenced by workflow state.

Do not modify application code.

After design is ready:

```yaml
phase: design_review
status: ready
gate: none
next:
  action: review-design
```
