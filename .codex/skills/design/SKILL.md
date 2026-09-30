---
name: design
description: Write or revise a short design for a lesson or a risky change before any code, then stop for an independent review and the owner's approval.
---

# Design

Write the design at `docs/lesson-designs/<topic>.md` for a lesson or at
`docs/technical-designs/<topic>.md` for anything else. Do not modify
application code.

Read `AGENTS.md`, the request, and only the code the change touches. For a
lesson, also read the matching `docs/course-map/` stage document.

Cover what applies:

- **lesson:**
  - the learning outcome and the discovery sequence from `AGENTS.md`;
  - the terminology boundaries;
  - the screens and the completion criteria;
  - accessibility and mobile behavior;
  - the progress step IDs;
  - the slices;
- **technical:**
  - the goal and non-goals;
  - the design, and the data and API contracts;
  - security and privacy;
  - migrations, deployment, and rollback;
  - the test strategy;
  - the slices.

Keep it proportional. State each decision once, and cite existing documents
instead of restating them. The target is about 10 KB for a technical design and
20 KB for a lesson. Slices are checkpoints inside one PR, and each lists its
scope and acceptance criteria.

When done:

1. Commit the design on the change branch.
2. Open or update the draft PR.
3. Stop with the prompt for the design review.
