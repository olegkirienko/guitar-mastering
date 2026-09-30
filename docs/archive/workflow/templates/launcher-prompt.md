Start each prompt in a fresh Codex session. Each invocation runs one phase and
stops, reporting the prompt for the next one.

## Ordinary phase
Use the work-orchestrator workflow for <work-item-id>.

Read and validate the current workflow state, execute exactly the next allowed phase, publish its transition, and stop.

## Human gate
Use the work-orchestrator workflow for <work-item-id>.

Approve the current <gate> human gate, publish the transition, and stop.

## Merge approval
Use the work-orchestrator workflow for <work-item-id>.

Approve merge_approval for PR head <full 40-hex SHA from the presenting phase>, merge, publish the transition, and stop.

## Explicit continuation (optional)
Append this line when several tightly coupled phases should share one session:

Continue until the next human gate.
