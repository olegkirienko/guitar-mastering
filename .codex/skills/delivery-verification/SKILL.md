---
name: delivery-verification
description: Verify a merged change in production with the bounded evidence command, and handle a failed deployment through the guarded, owner-approved retry.
---

# Delivery Verification

This step is read-only unless the owner approves a production mutation.

1. **Verify.** Run `corepack pnpm evidence:delivery --sha <merged SHA>`. See
   [references/railway-evidence.md](references/railway-evidence.md) for the
   rules and for any fact the command does not report. Then run
   `corepack pnpm smoke:production <origin>`. A `MISSING` line or a nonzero
   exit is never success.
2. **Record.** Post a short PR comment starting with `## Delivery`, with the
   merged SHA, the CI run, the deployment ID and status, the verifier,
   migration, startup, and readiness lines, and the smoke result. Use
   `gh pr comment <n> --body-file <file outside the repository>`.
3. **If the deployment failed:**
   - Diagnose with bounded logs. A code defect is fixed forward in a new PR.
   - A transient failure may be retried only after the owner approves the
     exact operation, for example
     `railway redeploy --project <id> --environment <id> --service <id> --yes`.
   - Immediately before the operation, run
     `corepack pnpm delivery:retry-guard --mode pre --sha <merged SHA>`. Stop
     unless it clears. A permanent stop means newer code or a successful
     deployment already exists, so report it to the owner.
   - Run the operation once. Then run
     `corepack pnpm delivery:retry-guard --mode post --sha <merged SHA> --retry-deployment <id>`.
     A stop means a possible rollback: stop and report it.
   - Verify again with step 1.

Never print variables, credentials, complete provider JSON, or full logs.
