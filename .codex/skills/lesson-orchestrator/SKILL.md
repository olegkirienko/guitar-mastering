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

New lesson workflows should prefer `work-orchestrator`.
