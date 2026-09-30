# Railway Delivery Evidence

Load this reference only while collecting Railway evidence for an exact merged
SHA. Railway reads remain subject to the repository delivery contract.

## Default: one command

Run this first:

```sh
corepack pnpm evidence:delivery --sha <full merged SHA>
```

It prints only the facts the contract needs: the push-event `Validate` run, the
Railway deployment for that SHA (ID, status, times, repository, branch, image
digest), the first build-log timestamp for CI ordering, and the pre-deploy,
migration, `server_started`, and readiness events. Every expected fact that is
absent is printed as a `MISSING` line and makes the command exit 1; that result
fails closed and is never success. Production smoke still runs separately with
`corepack pnpm smoke:production <origin>`.

For delivery verification, do not load the external `use-railway` skill. Do
not run `railway whoami`, `railway status --json`, `railway api describe` or
`search`, or `--help` preflights, because the pinned identity already lives in
the operations contract. Use the rules below only for a fact the command does
not report, or to diagnose a `MISSING` line.

## Query discipline

Start with the project, environment, service, deployment, and merged SHA already
pinned by the workflow or operations contract. Pass explicit IDs; do not use a
linked default when the identity is known.

Prefer the narrowest available path:

1. Use a Railway MCP read when it returns the exact scoped fields without a
   broad payload.
2. Otherwise use a GraphQL query whose selection set contains only required
   scalar fields. Inspect the schema first if a field name is uncertain.
3. Use CLI JSON only when the CLI operation is the authoritative or practical
   source. Apply limits and project the response in the same shell command so
   raw JSON never enters model output.

Use exact deployment or service IDs, exact commit SHA filters, the shortest
useful time window, small result limits, and bounded log lines. Do not list an
entire project or deployment history when one known deployment can answer the
question.

## Minimum evidence sets

Retrieve fields incrementally for the proof at hand:

- source correlation: deployment ID, repository, branch, and full commit SHA;
- lifecycle: status plus creation, first-build, completion, and update times
  needed to prove CI ordering;
- artifact: image digest when delivery correlation requires it;
- runtime identity: the exact startup event containing the deployment SHA;
- release path: only the pre-deploy verifier, migration, readiness, and failure
  events required by the contract;
- smoke/observation: route status summaries and bounded error/latency metrics.

Do not fetch another category until the current proof requires it.

## Logs and JSON

For logs, pin the deployment or service, bound `--since` and `--lines`, and
select only contract markers such as CI verification, migration completion,
startup identity, readiness, and errors. Return timestamp, event/message, and
deployment identity only. Increase the window or line count once, narrowly,
when a required marker is missing; never fall back immediately to complete
logs.

For JSON, prefer source-side field selection. When a CLI returns a fixed broad
schema, pipe it directly through a projector such as `jq` and emit only the
required IDs, status, SHA, timestamps, digest, and source identity. Do not run
the unfiltered command first.

Never request or print variable collections, tokens, credentials, database
URLs, headers, or secret-bearing configuration. Use presence/absence or
redacted read-back only when the contract explicitly requires configuration
evidence.

## Evidence artifact

Record the correlated facts and their source in the immutable delivery
artifact. Summarize provider evidence; do not paste raw responses. Missing or
ambiguous fields fail closed and may trigger one smaller follow-up query for
the exact missing fact.
