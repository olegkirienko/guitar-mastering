import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed === "null") return null;
  if (trimmed === "[]") return [];
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const body = trimmed.slice(1, -1).trim();
    return body ? body.split(",").map((entry) => scalar(entry)) : [];
  }
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  return trimmed;
}

function topScalar(source, name) {
  const match = source.match(new RegExp(`^${name}: (.+)$`, "m"));
  assert.ok(match, `missing top-level ${name}`);
  return scalar(match[1]);
}

function section(source, name) {
  const match = new RegExp(`^${name}:(?: ([^\\n]*))?\\n?`, "m").exec(source);
  assert.ok(match, `missing section ${name}`);
  if (match[1]) return { inline: scalar(match[1]), body: "" };
  const remainder = source.slice(match.index + match[0].length);
  const next = remainder.search(/^[a-z_][a-z0-9_]*:/m);
  return { inline: undefined, body: next === -1 ? remainder : remainder.slice(0, next) };
}

function sectionList(source, name) {
  const selected = section(source, name);
  if (selected.inline) return selected.inline;
  return [...selected.body.matchAll(/^  - (.+)$/gm)].map((match) => scalar(match[1]));
}

function sectionMap(source, name) {
  const body = section(source, name).body;
  return Object.fromEntries(
    [...body.matchAll(/^  ([a-z_][a-z0-9_]*): (.+)$/gm)]
      .map(([, key, value]) => [key, scalar(value)]),
  );
}

function nestedMap(body, name) {
  const match = new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z_][a-z0-9_]*:|(?![\\s\\S]))`, "m").exec(body);
  if (!match) return undefined;
  return Object.fromEntries(
    [...match[1].matchAll(/^    ([a-z_][a-z0-9_]*): (.+)$/gm)]
      .map(([, key, value]) => [key, scalar(value)]),
  );
}

function nestedList(body, name) {
  const match = new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z_][a-z0-9_]*:|(?![\\s\\S]))`, "m").exec(body);
  if (!match) return undefined;
  return [...match[1].matchAll(/^    - (.+)$/gm)].map((entry) => scalar(entry[1]));
}

function parseFindings(source) {
  const selected = section(source, "blocking_findings");
  if (selected.inline) return selected.inline;
  return [...selected.body.matchAll(/^  - id: (.+)\n([\s\S]*?)(?=^  - id:|(?![\s\S]))/gm)]
    .map(([, id, body]) => ({
      id: scalar(id),
      ...Object.fromEntries(
        [...body.matchAll(/^    ([a-z_][a-z0-9_]*): (.+)$/gm)]
          .map(([, key, value]) => [key, scalar(value)]),
      ),
    }));
}

function parseWorkflow(source) {
  const nextBody = section(source, "next").body;
  const next = Object.fromEntries(
    [...nextBody.matchAll(/^  ([a-z_][a-z0-9_]*): (.+)$/gm)]
      .map(([, key, value]) => [key, scalar(value)]),
  );
  const state = {
    version: topScalar(source, "version"),
    work_item_id: topScalar(source, "work_item_id"),
    work_item_type: topScalar(source, "work_item_type"),
    title: topScalar(source, "title"),
    phase: topScalar(source, "phase"),
    status: topScalar(source, "status"),
    gate: topScalar(source, "gate"),
    design: sectionMap(source, "design"),
    context: sectionList(source, "context"),
    completed_slices: sectionList(source, "completed_slices"),
    current_slice: sectionMap(source, "current_slice"),
    latest_review: sectionMap(source, "latest_review"),
    blocking_findings: parseFindings(source),
    next,
  };

  const onApproval = nestedMap(nextBody, "on_approval");
  const onSuccess = nestedMap(nextBody, "on_success");
  if (onApproval) state.next.on_approval = onApproval;
  if (onSuccess) state.next.on_success = onSuccess;
  if (/^gate_scope:/m.test(source)) state.gate_scope = sectionMap(source, "gate_scope");
  if (/^reconciliation:/m.test(source)) {
    const reconciliationBody = section(source, "reconciliation").body;
    state.reconciliation = Object.fromEntries(
      [...reconciliationBody.matchAll(/^  ([a-z_][a-z0-9_]*): (.+)$/gm)]
        .map(([, key, value]) => [key, scalar(value)]),
    );
    state.reconciliation.basis = nestedMap(reconciliationBody, "basis");
    state.reconciliation.allowed_paths = nestedList(reconciliationBody, "allowed_paths");
    state.reconciliation.acceptance = nestedList(reconciliationBody, "acceptance");
  }
  if (/^notes:/m.test(source)) state.notes = sectionList(source, "notes");
  return state;
}

function renderWorkflow(state) {
  const value = (entry) => {
    if (entry === null) return "null";
    if (Array.isArray(entry)) return `[${entry.map((item) => JSON.stringify(item)).join(", ")}]`;
    if (typeof entry === "string") return JSON.stringify(entry);
    return String(entry);
  };
  const lines = [
    `version: ${state.version}`,
    "",
    `work_item_id: ${state.work_item_id}`,
    `work_item_type: ${state.work_item_type ?? "maintenance"}`,
    `title: ${value(state.title ?? "Fixture")}`,
    "",
    `phase: ${state.phase}`,
    `status: ${state.status}`,
    `gate: ${state.gate}`,
    "",
    "design:",
    `  path: ${state.design.path}`,
    "",
    state.context.length ? "context:" : "context: []",
    ...state.context.map((path) => `  - ${path}`),
    state.completed_slices.length ? "completed_slices:" : "completed_slices: []",
    ...state.completed_slices.map((slice) => `  - ${slice}`),
    "",
    "current_slice:",
    `  id: ${state.current_slice.id}`,
    `  name: ${value(state.current_slice.name)}`,
    "",
    "latest_review:",
    `  path: ${value(state.latest_review.path)}`,
    "",
  ];

  if (state.blocking_findings.length) {
    lines.push("blocking_findings:");
    for (const finding of state.blocking_findings) {
      lines.push(`  - id: ${finding.id}`);
      lines.push(`    class: ${finding.class}`);
      lines.push(`    source: ${finding.source}`);
      lines.push(`    summary: ${value(finding.summary)}`);
    }
  } else {
    lines.push("blocking_findings: []");
  }

  if (state.gate_scope) {
    lines.push("", "gate_scope:");
    for (const [key, entry] of Object.entries(state.gate_scope)) lines.push(`  ${key}: ${value(entry)}`);
  }
  if (state.reconciliation) {
    lines.push("", "reconciliation:");
    lines.push(`  id: ${state.reconciliation.id}`);
    lines.push(`  kind: ${state.reconciliation.kind}`);
    lines.push("  basis:");
    lines.push(`    path: ${state.reconciliation.basis.path}`);
    lines.push(`    finding_ids: ${value(state.reconciliation.basis.finding_ids)}`);
    lines.push("  allowed_paths:");
    state.reconciliation.allowed_paths.forEach((path) => lines.push(`    - ${path}`));
    lines.push("  acceptance:");
    state.reconciliation.acceptance.forEach((check) => lines.push(`    - ${value(check)}`));
  }

  lines.push("", "next:", `  action: ${state.next.action}`);
  for (const destination of ["on_approval", "on_success"]) {
    if (!state.next[destination]) continue;
    lines.push(`  ${destination}:`);
    for (const [key, entry] of Object.entries(state.next[destination])) lines.push(`    ${key}: ${entry}`);
  }
  return `${lines.join("\n")}\n`;
}

const actionPatterns = {
  design: /^create-or-revise-design$/,
  design_review: /^review-design$/,
  implementation: /^implement-.+$/,
  implementation_review: /^review-.+$/,
  fixes: /^fix-.+$/,
  fix_rereview: /^rereview-.+$/,
  reconciliation: /^reconcile-.+$/,
  human_gate: /^approve-.+$/,
  complete: /^none$/,
};

const operationalGates = new Set([
  "production_mutation_approval",
  "destructive_action_approval",
  "credential_change_approval",
]);

const gateActions = {
  design_approval: "approve-design",
  next_slice_approval: "approve-next-slice",
  work_item_completion: "approve-work-item-completion",
  lesson_completion: "approve-lesson-completion",
  production_mutation_approval: "approve-production-mutation",
  destructive_action_approval: "approve-destructive-action",
  credential_change_approval: "approve-credential-change",
};

const findingClasses = new Set([
  "design_defect",
  "implementation_defect",
  "documentation_defect",
  "state_sync_defect",
]);

function validateGateScope(gate, scope) {
  if (gate === "production_mutation_approval" || gate === "destructive_action_approval") {
    assert.ok(scope.provider);
    assert.ok(scope.environment_id);
    assert.ok(scope.targets?.length > 0);
    assert.ok(scope.plan_digest || scope.operation);
    assert.ok(scope.stop_conditions);
  }
  if (gate === "destructive_action_approval") {
    assert.ok(Number.isInteger(scope.allowed_destroy_count));
    assert.ok(scope.recovery_evidence);
  }
  if (gate === "credential_change_approval") {
    assert.ok(scope.owner);
    assert.ok(scope.scope);
    assert.ok(scope.storage_destination);
    assert.ok(scope.expiry_rotation);
    assert.ok(scope.secret_safe_verification);
  }
}

function validateState(state) {
  assert.equal(state.version, 3);
  assert.ok(state.work_item_id);
  assert.ok(state.design?.path);
  assert.equal("status" in state.design, false);
  assert.ok(Array.isArray(state.context));
  assert.ok(Array.isArray(state.completed_slices));
  assert.ok(state.current_slice?.id);
  assert.equal("status" in state.current_slice, false);
  assert.ok(state.latest_review && "path" in state.latest_review);
  assert.equal("verdict" in state.latest_review, false);
  assert.equal("phase" in state.next, false);
  assert.equal("human_approval_required" in state.next, false);
  assert.equal("notes" in state, false);
  assert.ok(actionPatterns[state.phase]);
  assert.ok(Object.hasOwn(gateActions, state.gate) || state.gate === "none");

  const findingIds = new Set();
  for (const finding of state.blocking_findings) {
    assert.ok(finding.id);
    assert.equal(findingIds.has(finding.id), false);
    findingIds.add(finding.id);
    assert.ok(findingClasses.has(finding.class));
    assert.ok(finding.source);
    assert.ok(finding.summary);
  }
  if (state.status === "blocked") {
    assert.match(state.next?.action, /^supply-.+$/);
  } else {
    assert.ok(actionPatterns[state.phase]?.test(state.next?.action));
  }

  if (state.phase === "human_gate") {
    assert.equal(state.status, "awaiting_approval");
    assert.notEqual(state.gate, "none");
    assert.ok(state.next.on_approval);
    assert.equal(state.next.action, gateActions[state.gate]);
    if (state.gate === "work_item_completion" || state.gate === "lesson_completion") {
      assert.equal(state.next.on_approval.phase, "complete");
      assert.equal(state.next.on_approval.action, "none");
    } else {
      assert.equal(state.next.on_approval.phase, "implementation");
      assert.match(state.next.on_approval.action, /^(implement|resume)-.+$/);
    }
  } else if (state.phase === "complete") {
    assert.equal(state.status, "complete");
    assert.equal(state.gate, "none");
    assert.deepEqual(state.blocking_findings, []);
    assert.deepEqual(state.next, { action: "none" });
    assert.ok(state.completed_slices.includes(state.current_slice.id));
  } else {
    assert.ok(state.status === "ready" || state.status === "blocked");
    assert.equal(state.gate, "none");
  }

  if (state.phase === "reconciliation") {
    assert.ok(state.reconciliation?.id);
    assert.ok(state.reconciliation?.kind === "documentation_defect" || state.reconciliation?.kind === "state_sync_defect");
    assert.ok(state.reconciliation?.basis?.path);
    assert.ok(state.reconciliation.allowed_paths.length > 0);
    assert.ok(state.reconciliation.acceptance.length > 0);
    assert.ok(state.next.on_success);
    assert.ok(state.reconciliation.basis.finding_ids.every((id) => findingIds.has(id)));
    assert.ok(state.blocking_findings.every((finding) => finding.class === "documentation_defect" || finding.class === "state_sync_defect"));
  } else {
    assert.equal("on_success" in state.next, false);
    assert.equal("reconciliation" in state, false);
  }
  if (state.phase !== "human_gate") assert.equal("on_approval" in state.next, false);

  const route = routeFor(state.blocking_findings, state.phase === "reconciliation");
  if (state.blocking_findings.length === 0) {
    assert.equal(["fixes", "fix_rereview", "reconciliation"].includes(state.phase), false);
  } else if (route === "design") {
    assert.equal(state.phase, "design");
  } else if (route === "fixes") {
    assert.ok(state.phase === "fixes" || state.phase === "fix_rereview");
  } else {
    assert.equal(state.phase, "reconciliation");
  }

  if (state.phase === "human_gate" || state.phase === "complete") {
    assert.deepEqual(state.blocking_findings, []);
  }
  if (operationalGates.has(state.gate)) {
    assert.ok(state.gate_scope);
    validateGateScope(state.gate, state.gate_scope);
  } else {
    assert.equal("gate_scope" in state, false);
  }
}

const base = {
  version: 3,
  work_item_id: "fixture",
  design: { path: "docs/technical-designs/fixture.md" },
  context: [],
  completed_slices: [],
  current_slice: { id: "slice-a", name: "Slice A" },
  latest_review: { path: null },
  status: "ready",
  gate: "none",
  blocking_findings: [],
};

const implementationFinding = {
  id: "MEDIUM-01",
  class: "implementation_defect",
  source: "docs/reviews/fixture.md",
  summary: "Implementation does not satisfy the approved contract.",
};

const legal = [
  ["design", "create-or-revise-design"],
  ["design_review", "review-design"],
  ["implementation", "implement-slice-a"],
  ["implementation_review", "review-slice-a"],
].map(([phase, action]) => ({ ...base, phase, next: { action } }));

legal.push({ ...base, phase: "fixes", blocking_findings: [implementationFinding], next: { action: "fix-MEDIUM-01" } });
legal.push({ ...base, phase: "fix_rereview", blocking_findings: [implementationFinding], next: { action: "rereview-slice-a" } });

legal.push({
  ...base,
  phase: "reconciliation",
  blocking_findings: [{
    id: "MEDIUM-01",
    class: "documentation_defect",
    source: "docs/reviews/fixture.md",
    summary: "State text is stale.",
  }],
  reconciliation: {
    id: "RECON-01",
    kind: "documentation_defect",
    basis: { path: "docs/reviews/fixture.md", finding_ids: ["MEDIUM-01"] },
    allowed_paths: ["docs/workflow/fixture.yaml"],
    acceptance: ["Synchronize the already-reviewed state."],
  },
  next: {
    action: "reconcile-MEDIUM-01",
    on_success: { phase: "human_gate", gate: "work_item_completion", action: "approve-work-item-completion" },
  },
});

const gateFixtures = [
  ["design_approval", "approve-design"],
  ["next_slice_approval", "approve-next-slice"],
  ["work_item_completion", "approve-work-item-completion"],
  ["lesson_completion", "approve-lesson-completion"],
  ["production_mutation_approval", "approve-production-mutation", {
    provider: "railway", environment_id: "production", targets: ["service-a"],
    plan_digest: "sha256:abc", stop_conditions: ["target mismatch"],
  }],
  ["destructive_action_approval", "approve-destructive-action", {
    provider: "railway", environment_id: "production", targets: ["variable-a"],
    plan_digest: "sha256:abc", stop_conditions: ["destroy count mismatch"],
    allowed_destroy_count: 1, recovery_evidence: "backup-01",
  }],
  ["credential_change_approval", "approve-credential-change", {
    owner: "repository-owner", scope: "actions:read", storage_destination: "sealed-variable",
    expiry_rotation: "90-days/rotate-7-days-before", secret_safe_verification: "status-only",
  }],
];

for (const [gate, action, gateScope] of gateFixtures) {
  const completion = gate === "work_item_completion" || gate === "lesson_completion";
  legal.push({
    ...base,
    phase: "human_gate",
    status: "awaiting_approval",
    gate,
    ...(gateScope ? { gate_scope: gateScope } : {}),
    next: {
      action,
      on_approval: completion
        ? { phase: "complete", action: "none" }
        : { phase: "implementation", action: gate === "design_approval" || gate === "next_slice_approval" ? "implement-slice-a" : "resume-slice-a" },
    },
  });
}

legal.push({ ...base, phase: "complete", status: "complete", completed_slices: ["slice-a"], next: { action: "none" } });
legal.push({ ...base, phase: "implementation", status: "blocked", next: { action: "supply-missing-evidence" } });
legal.forEach(validateState);
legal.forEach((state) => validateState(parseWorkflow(renderWorkflow(state))));

const invalid = [
  { ...base, phase: "design", gate: "design_approval", next: { action: "create-or-revise-design" } },
  { ...base, phase: "human_gate", next: { action: "approve-design" } },
  { ...base, phase: "complete", status: "ready", next: { action: "none" } },
  { ...base, phase: "implementation", next: { action: "review-slice-a" } },
];
invalid.forEach((state) => assert.throws(() => validateState(state)));

function routeFor(findings, exactRepairContract = false) {
  const classes = new Set(findings.map((finding) => finding.class));
  if (classes.has("design_defect")) return "design";
  if (classes.has("implementation_defect")) return "fixes";
  if (!exactRepairContract) return "design";
  return "reconciliation";
}

assert.equal(routeFor([{ class: "design_defect" }], true), "design");
assert.equal(routeFor([{ class: "implementation_defect" }], true), "fixes");
assert.equal(routeFor([{ class: "documentation_defect" }], true), "reconciliation");
assert.equal(routeFor([{ class: "state_sync_defect" }], true), "reconciliation");
assert.equal(routeFor([{ class: "documentation_defect" }], false), "design");
assert.equal(routeFor([
  { class: "implementation_defect" },
  { class: "documentation_defect" },
], true), "fixes");

const transitionTargets = {
  design: new Set(["design_review"]),
  design_review: new Set(["human_gate", "reconciliation", "design"]),
  implementation: new Set(["implementation_review", "human_gate"]),
  implementation_review: new Set(["human_gate", "fixes", "reconciliation", "design"]),
  fixes: new Set(["fix_rereview"]),
  fix_rereview: new Set(["human_gate", "fixes", "reconciliation"]),
  reconciliation: new Set(),
  human_gate: new Set(),
  complete: new Set(),
};

function validateTransition(from, to, { finalSlice = false, laterSlice = false } = {}) {
  validateState(from);
  validateState(to);

  if (from.phase === "reconciliation") {
    assert.equal(to.phase, from.next.on_success.phase);
    assert.equal(to.next.action, from.next.on_success.action);
    if (to.phase === "human_gate") assert.equal(to.gate, from.next.on_success.gate);
  } else if (from.phase === "human_gate") {
    assert.equal(to.phase, from.next.on_approval.phase);
    assert.equal(to.next.action, from.next.on_approval.action);
  } else {
    assert.ok(transitionTargets[from.phase].has(to.phase));
  }

  if (to.phase === "human_gate" && to.gate === "next_slice_approval") assert.equal(laterSlice, true);
  if (to.phase === "human_gate" && (to.gate === "work_item_completion" || to.gate === "lesson_completion")) {
    assert.equal(finalSlice, true);
    assert.deepEqual(to.blocking_findings, []);
  }
  if (from.phase === "human_gate" && (from.gate === "work_item_completion" || from.gate === "lesson_completion")) {
    assert.equal(finalSlice, true);
    assert.equal(to.phase, "complete");
    assert.ok(to.completed_slices.includes(to.current_slice.id));
  }
}

const implementationReviewState = legal.find((state) => state.phase === "implementation_review");
const fixesState = legal.find((state) => state.phase === "fixes");
const fixRereviewState = legal.find((state) => state.phase === "fix_rereview");
const completionGateState = legal.find((state) => state.gate === "work_item_completion");
const completeState = legal.find((state) => state.phase === "complete");
const reconciliationToReview = {
  ...legal.find((state) => state.phase === "reconciliation"),
  next: {
    action: "reconcile-MEDIUM-01",
    on_success: { phase: "implementation_review", action: "review-slice-a" },
  },
};

const validTransitions = [
  [implementationReviewState, fixesState],
  [fixesState, fixRereviewState],
  [fixRereviewState, fixesState],
  [reconciliationToReview, implementationReviewState],
];
validTransitions.forEach(([from, to]) => validateTransition(from, to));
validateTransition(implementationReviewState, completionGateState, { finalSlice: true });
validateTransition(fixRereviewState, completionGateState, { finalSlice: true });
validateTransition(completionGateState, completeState, { finalSlice: true });
assert.throws(() => validateTransition(implementationReviewState, completionGateState));
assert.throws(() => validateTransition(legal.find((state) => state.phase === "implementation"), completeState));

function reconciliationEligible(change) {
  return Boolean(change.exactBasis)
    && change.allowedPaths.length > 0
    && !change.application
    && !change.provider
    && !change.credential
    && !change.database
    && !change.architecture
    && !change.approvedRisk
    && !change.scope
    && !change.targetIdentity
    && !change.reviewVerdict
    && !change.immutableArtifact;
}

const safeRepair = {
  exactBasis: true,
  allowedPaths: ["docs/workflow/fixture.yaml"],
  application: false,
  provider: false,
  credential: false,
  database: false,
  architecture: false,
  approvedRisk: false,
  scope: false,
  targetIdentity: false,
  reviewVerdict: false,
  immutableArtifact: false,
};
assert.equal(reconciliationEligible(safeRepair), true);
for (const forbidden of ["application", "provider", "credential", "database", "architecture", "approvedRisk", "scope", "targetIdentity", "reviewVerdict", "immutableArtifact"]) {
  assert.equal(reconciliationEligible({ ...safeRepair, [forbidden]: true }), false);
}

const approvedScope = {
  provider: "railway",
  environment_id: "production",
  targets: ["service-a"],
  plan_digest: "sha256:abc",
  allowed_destroy_count: 1,
};
const sameScope = (candidate) => JSON.stringify(candidate) === JSON.stringify(approvedScope);
assert.equal(sameScope({ ...approvedScope }), true);
assert.equal(sameScope({ ...approvedScope, targets: ["service-b"] }), false);
assert.equal(sameScope({ ...approvedScope, plan_digest: "sha256:def" }), false);
assert.equal(sameScope({ ...approvedScope, allowed_destroy_count: 2 }), false);

function migrationOutcome(state) {
  if (state.status === "complete") return "leave-legacy";
  if (state.ambiguousRisk || state.ambiguousTarget || state.ambiguousApproval) return "fail-closed";
  if (state.staleButAuthoritative) return "repair-and-migrate";
  return "migrate";
}

assert.equal(migrationOutcome({ version: 2, status: "complete" }), "leave-legacy");
assert.equal(migrationOutcome({ version: 2, status: "ready" }), "migrate");
assert.equal(migrationOutcome({ version: 2, status: "ready", staleButAuthoritative: true }), "repair-and-migrate");
assert.equal(migrationOutcome({ version: 2, status: "ready", ambiguousApproval: true }), "fail-closed");

for (const path of [
  "docs/workflow/templates/work-item-state.yaml",
  "docs/workflow/templates/technical-feature-state.yaml",
  "docs/workflow/templates/workflow-state.yaml",
]) {
  const template = read(path);
  assert.match(template, /^version: 3/m);
  assert.doesNotMatch(template, /^ +status:/m);
  assert.doesNotMatch(template, /^ +verdict:/m);
  assert.doesNotMatch(template, /^ +phase:/m);
  assert.doesNotMatch(template, /human_approval_required:/);
  assert.doesNotMatch(template, /^notes:/m);
}

for (const path of [
  ".codex/skills/work-orchestrator/SKILL.md",
  ".codex/skills/work-design/SKILL.md",
  ".codex/skills/design-review/SKILL.md",
  ".codex/skills/implementation-slice/SKILL.md",
  ".codex/skills/implementation-review/SKILL.md",
  ".codex/skills/targeted-fix/SKILL.md",
  ".codex/skills/targeted-rereview/SKILL.md",
  ".codex/skills/reconciliation/SKILL.md",
]) {
  const instructions = read(path);
  assert.doesNotMatch(instructions, /next\.phase:/);
  assert.doesNotMatch(instructions, /human_approval_required:/);
}

const historical = read("docs/workflow/railway-ci-cd-iac.yaml");
assert.match(historical, /^version: 2/m);
assert.match(historical, /^phase: complete/m);
assert.match(historical, /^status: complete/m);

const active = read("docs/workflow/maintenance-orchestration-simplification.yaml");
const activeState = parseWorkflow(active);
assert.equal(activeState.work_item_id, "maintenance-orchestration-simplification");
validateState(activeState);
for (const path of [activeState.design.path, ...activeState.context]) {
  assert.ok(existsSync(new URL(path, root)), `missing active workflow artifact: ${path}`);
}
if (activeState.latest_review.path) {
  assert.ok(existsSync(new URL(activeState.latest_review.path, root)), "missing latest review");
}
for (const finding of activeState.blocking_findings) {
  assert.ok(existsSync(new URL(finding.source, root)), `missing finding source: ${finding.source}`);
}

console.log(`workflow-contract: ${legal.length} legal states, ${invalid.length} illegal states, and ${validTransitions.length + 3} transitions verified`);
