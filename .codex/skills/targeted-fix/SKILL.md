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
  id: <slice-id>
  name: <slice-name>
blocking_findings:
  - <same typed findings pending verification>
next:
  action: rereview-<slice-id>
```
