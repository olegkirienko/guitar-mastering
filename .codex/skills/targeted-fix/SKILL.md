---
name: targeted-fix
description: Apply only active blocking finding fixes for any work-item type.
---

# Targeted Fix

Read:
- AGENTS.md
- workflow state
- authoritative design
- context
- owning review artifact
- named source files

Fix only active blocking IDs unless explicitly narrowed.

Do not implement future slices or unrelated improvements.

Run required validation.

After success:

```yaml
phase: fix_rereview
status: ready
gate: none
current_slice:
  status: fixed
blocking_findings:
  - <same IDs pending verification>
next:
  phase: fix_rereview
  action: rereview-<slice-id>
  human_approval_required: false
```
