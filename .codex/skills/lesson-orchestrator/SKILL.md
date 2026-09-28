---
name: lesson-orchestrator
description: Backward-compatible wrapper for historical lesson workflows.
---

# Lesson Orchestrator Compatibility Wrapper

Delegate to `work-orchestrator`.

If state contains `lesson_id` but no generic identity, interpret it as:

```yaml
work_item_id: <lesson_id>
work_item_type: lesson
```

Do not rewrite completed historical workflows only for schema migration.

Validate legacy lesson state under its declared version. Migrate an active legacy lesson only at its next explicit orchestration action and only when the authoritative outcome is unambiguous.

New lesson workflows use v3.1 through `work-orchestrator`.
