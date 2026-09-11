# Generalized Work-Item Workflow

The orchestration layer manages arbitrary repository work items using a finite deterministic state machine.

## Preferred schema

```yaml
version: 2
work_item_id: feature-auth-persistence
work_item_type: technical_feature
title: "Authentication and persistence foundation"
```

Historical lesson workflows using `lesson_id` remain supported.

## Authoritative design

Every workflow explicitly references its authoritative design/specification artifact:

```yaml
design:
  path: docs/technical-designs/feature-auth-persistence.md
  status: draft
```

Historical lesson workflows may still use `spec:`.

## Optional context

```yaml
context:
  - AGENTS.md
  - README.md
```

Do not use transient chat history as required workflow context.

## Canonical routing

Top-level `phase` is canonical.

Supported phases:

- `design`
- `design_review`
- `human_gate`
- `implementation`
- `implementation_review`
- `fixes`
- `fix_rereview`
- `complete`

Normally `next.phase == phase` after a completed transition.

At `human_gate`, `next.phase` names the phase unlocked only by explicit approval.

## Fail closed

If workflow state is contradictory:

```text
WORKFLOW STATE INCONSISTENT
```

The orchestrator stops and must not infer or silently repair the intended transition.

## State machine

`design → design_review → human_gate → implementation → implementation_review → fixes ↔ fix_rereview → human_gate → next slice or complete`

## Gates

- `design_approval`
- `next_slice_approval`
- `work_item_completion`
- legacy `lesson_completion`

For new workflows prefer `work_item_completion`.

## Transition table

| Completed phase/gate | Outcome | New canonical phase | Gate |
|---|---|---|---|
| `design` | ready | `design_review` | `none` |
| `design_review` | approved | `human_gate` | `design_approval` |
| `design_review` | changes required | `design` | `none` |
| `design_approval` | human approved | `implementation` | `none` |
| `implementation` | success | `implementation_review` | `none` |
| `implementation_review` | changes required | `fixes` | `none` |
| `implementation_review` | approved + later slice | `human_gate` | `next_slice_approval` |
| `implementation_review` | approved + final slice | `human_gate` | `work_item_completion` |
| `fixes` | success | `fix_rereview` | `none` |
| `fix_rereview` | changes required | `fixes` | `none` |
| `fix_rereview` | approved + later slice | `human_gate` | `next_slice_approval` |
| `fix_rereview` | approved + final slice | `human_gate` | `work_item_completion` |
| `next_slice_approval` | human approved | `implementation` | `none` |
| `work_item_completion` | human approved | `complete` | `none` |
| legacy `lesson_completion` | human approved | `complete` | `none` |

Never invent a new slice from numbering conventions.

## Complete-transition rule

A phase/gate is not complete until all relevant fields are updated together:

- `phase`
- `status`
- `gate`
- `current_slice`
- `completed_slices`
- `latest_review`
- `blocking_findings`
- `next.phase`
- `next.action`
- `next.human_approval_required`

## Reviews

Review artifacts live under:

`docs/reviews/<work-item-id>/`

They are immutable snapshots.

## Terminal state

```yaml
phase: complete
status: complete
gate: none
blocking_findings: []
next:
  phase: complete
  action: none
  human_approval_required: false
```

The final approved slice remains visible in `current_slice` and is recorded in `completed_slices`.

`complete` applies only to the current work item.

## Backward compatibility

Do not rewrite completed historical workflows merely to migrate:

- `lesson_id` → `work_item_id`
- `spec` → `design`
- `lesson_completion` → `work_item_completion`

New workflows should use v2 names.
