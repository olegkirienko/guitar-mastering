import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

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
  if (/^git:/m.test(source)) state.git = sectionMap(source, "git");
  if (/^delivery:/m.test(source)) state.delivery = sectionMap(source, "delivery");
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

function workflowPathsFromEntries(entries, directory = "docs/workflow") {
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => `${directory}/${entry.name}`)
    .sort();
}

function discoverWorkflowPaths() {
  return workflowPathsFromEntries(readdirSync(new URL("docs/workflow/", root), { withFileTypes: true }));
}

function completedSliceDetails(source) {
  const selected = section(source, "completed_slices");
  if (selected.inline) return [];
  const objectSlices = [...selected.body.matchAll(/^  - id: (.+)\n([\s\S]*?)(?=^  - id:|(?![\s\S]))/gm)]
    .map(([, id, body]) => {
      const finalReviews = [...body.matchAll(/^    (?:final_review|review): (.+)$/gm)];
      assert.ok(finalReviews.length <= 1, `completed slice ${scalar(id)} has ambiguous review evidence`);
      const finalReview = finalReviews[0];
      return { id: scalar(id), finalReview: finalReview ? scalar(finalReview[1]) : null };
    });
  const scalarSlices = [...selected.body.matchAll(/^  - (?!id:)(.+)$/gm)]
    .map(([, id]) => ({ id: scalar(id), finalReview: null }));
  return [...objectSlices, ...scalarSlices];
}

function amendmentPaths(source) {
  if (!/^amendments:/m.test(source)) return [];
  return [...section(source, "amendments").body.matchAll(/^    path: (.+)$/gm)]
    .map(([, path]) => scalar(path));
}

function assertRepositoryPath(path, description) {
  assert.ok(typeof path === "string" && path.length > 0, `missing ${description} path`);
  assert.equal(path.startsWith("/"), false, `${description} must be repository-relative: ${path}`);
  assert.equal(path.includes("\\"), false, `${description} must use forward slashes: ${path}`);
  assert.equal(path.split("/").some((segment) => segment === "" || segment === "." || segment === ".."), false, `${description} is not a normalized repository path: ${path}`);
}

function assertArtifact(path, exists, description) {
  assertRepositoryPath(path, description);
  assert.ok(exists(path), `missing ${description}: ${path}`);
}

function validateModernArtifacts(state, exists) {
  const terminal = state.phase === "complete";
  assertArtifact(state.design.path, exists, "authoritative design");
  for (const path of state.context) {
    if (terminal) assertRepositoryPath(path, "historical context artifact");
    else assertArtifact(path, exists, "context artifact");
  }
  if (state.latest_review.path) assertArtifact(state.latest_review.path, exists, "latest review");
  for (const finding of state.blocking_findings) {
    assertArtifact(finding.source, exists, `finding source ${finding.id}`);
  }
}

function validateLegacyWorkflow(source, exists) {
  const version = topScalar(source, "version");
  assert.ok(version === 1 || version === 2, `unsupported legacy version: ${version}`);
  const identity = topScalar(source, version === 1 ? "lesson_id" : "work_item_id");
  const phase = topScalar(source, "phase");
  const status = topScalar(source, "status");
  const gate = topScalar(source, "gate");
  const currentSlice = sectionMap(source, "current_slice");
  const latestReview = sectionMap(source, "latest_review");
  const findings = parseFindings(source);
  const next = sectionMap(source, "next");
  const slices = completedSliceDetails(source);
  const terminal = phase === "complete";

  assert.ok(identity, "missing legacy workflow identity");
  assert.equal(currentSlice.status, "approved");
  assert.equal(latestReview.verdict, "APPROVED");
  assert.deepEqual(findings, []);

  if (terminal) {
    assert.equal(status, "complete");
    assert.equal(gate, "none");
    assert.equal(next.phase, "complete");
    assert.equal(next.action, "none");
    assert.equal(next.human_approval_required, false);
    assert.ok(slices.some((slice) => slice.id === currentSlice.id), "current slice is absent from completed slices");
  } else if (version === 1) {
    assert.equal(phase, "human_gate");
    assert.equal(status, "approved");
    assert.equal(gate, "design_approval");
    assert.equal(next.phase, "implementation");
    assert.equal(next.action, "begin-approved-implementation");
    assert.equal(next.human_approval_required, true);
  } else {
    assert.fail("unsupported active legacy v2 workflow; migrate it or add a reviewed compatibility contract");
  }

  assertArtifact(latestReview.path, exists, "latest review");
  if (version === 1) {
    const specification = sectionMap(source, "spec");
    const courseMap = sectionMap(source, "course_map");
    assert.equal(specification.status, "approved");
    assertArtifact(specification.path, exists, "lesson specification");
    for (const [name, path] of Object.entries(courseMap)) {
      if (terminal) assertRepositoryPath(path, `historical course-map ${name}`);
      else assertArtifact(path, exists, `course-map ${name}`);
    }
    if (/^previous_lesson:/m.test(source)) {
      const previousLesson = sectionMap(source, "previous_lesson");
      assert.equal(previousLesson.status, "complete");
      for (const name of ["spec", "workflow"]) {
        if (terminal) assertRepositoryPath(previousLesson[name], `historical previous-lesson ${name}`);
        else assertArtifact(previousLesson[name], exists, `previous-lesson ${name}`);
      }
    }
  } else {
    const design = sectionMap(source, "design");
    assert.equal(design.status, "approved");
    assertArtifact(design.path, exists, "authoritative design");
    const context = /^context:/m.test(source) ? sectionList(source, "context") : [];
    for (const path of context) {
      if (terminal) assertRepositoryPath(path, "historical context artifact");
      else assertArtifact(path, exists, "context artifact");
    }
    for (const path of amendmentPaths(source)) assertArtifact(path, exists, "design amendment");
  }

  if (terminal) {
    for (const slice of slices) {
      if (slice.finalReview) assertArtifact(slice.finalReview, exists, `final review for ${slice.id}`);
    }
  }
  return identity;
}

function validateWorkflowDocument(path, source, exists) {
  try {
    const version = topScalar(source, "version");
    if (version === 3 || version === "3.1") {
      const state = parseWorkflow(source);
      validateState(state);
      validateModernArtifacts(state, exists);
      return state.work_item_id;
    }
    if (version === 1 || version === 2) return validateLegacyWorkflow(source, exists);
    assert.fail(`unsupported workflow version: ${version}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${path}: ${message}`, { cause: error });
  }
}

function validateRepositoryWorkflows(paths, readWorkflow, exists) {
  const identities = new Map();
  for (const path of paths) {
    const identity = validateWorkflowDocument(path, readWorkflow(path), exists);
    assert.equal(identities.has(identity), false, `${path}: duplicate workflow identity ${identity}; first seen in ${identities.get(identity)}`);
    identities.set(identity, path);
  }
  return identities;
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

  if (String(state.version) === "3.1") {
    lines.push(
      "git:",
      `  repository: ${state.git.repository}`,
      `  branch: ${state.git.branch}`,
      `  lifecycle_generation: ${state.git.lifecycle_generation}`,
      `  lifecycle_anchor_sha: ${value(state.git.lifecycle_anchor_sha)}`,
      `  pr_number: ${value(state.git.pr_number)}`,
      `  reviewed_sha: ${value(state.git.reviewed_sha)}`,
      `  merged_sha: ${value(state.git.merged_sha)}`,
      "",
      "delivery:",
      `  evidence_path: ${value(state.delivery.evidence_path)}`,
      "",
    );
  }

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
  work_item_init: /^initialize-work-item$/,
  design: /^create-or-revise-design$/,
  design_review: /^review-design$/,
  implementation: /^implement-.+$/,
  implementation_review: /^review-.+$/,
  fixes: /^fix-.+$/,
  fix_rereview: /^rereview-.+$/,
  reconciliation: /^reconcile-.+$/,
  delivery_verification: /^(verify-delivery|retry-delivery-.+)$/,
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
  merge_approval: "approve-merge",
};

const findingClasses = new Set([
  "design_defect",
  "implementation_defect",
  "documentation_defect",
  "state_sync_defect",
]);

function validateGateScope(gate, scope) {
  if (gate === "merge_approval") {
    assert.match(scope.repository, /^github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+$/i);
    assert.match(scope.branch, /^work\/.+$/);
    assert.match(scope.lifecycle_generation, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.ok(Number.isInteger(scope.pr_number) && scope.pr_number > 0);
    assert.equal(scope.target_branch, "main");
    assert.match(scope.reviewed_sha, /^[0-9a-f]{40}$/);
    for (const dynamicField of [
      "head_sha",
      "validation_run_id",
      "required_checks_passed",
      "clean_tree",
      "branch_retained",
      "auto_delete_disabled",
      "cleanup_deletion_blocked",
      "diff_scope_verified",
      "unresolved_findings",
    ]) assert.equal(dynamicField in scope, false, `${dynamicField} must be resolved dynamically`);
  }
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

function validateGitIdentity(state) {
  assert.ok(state.git);
  assert.match(state.git.repository, /^github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+$/i);
  assert.equal(state.git.branch, `work/${state.work_item_id}`);
  assert.match(state.git.lifecycle_generation, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.ok(state.git.lifecycle_anchor_sha === null || /^[0-9a-f]{40}$/.test(state.git.lifecycle_anchor_sha));
  assert.ok(state.git.pr_number === null || (Number.isInteger(state.git.pr_number) && state.git.pr_number > 0));
  assert.equal("head_sha" in state.git, false, "v3.1 must not persist the current PR head");
  for (const name of ["reviewed_sha", "merged_sha"]) {
    assert.ok(state.git[name] === null || /^[0-9a-f]{40}$/.test(state.git[name]));
  }
  assert.ok(state.delivery && Object.hasOwn(state.delivery, "evidence_path"));
  assert.ok(state.delivery.evidence_path === null || /^docs\/delivery-evidence\/.+\/delivery-\d+\.md$/.test(state.delivery.evidence_path));
  for (const duplicatedRoute of ["phase", "status", "gate", "blocking_findings", "next"]) {
    assert.equal(duplicatedRoute in state.git, false);
    assert.equal(duplicatedRoute in state.delivery, false);
  }
}

function validateState(state) {
  const isV31 = String(state.version) === "3.1";
  assert.ok(state.version === 3 || isV31);
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
  if (isV31) validateGitIdentity(state);
  else {
    assert.equal("git" in state, false);
    assert.equal("delivery" in state, false);
    assert.equal(["work_item_init", "delivery_verification"].includes(state.phase), false);
    assert.notEqual(state.gate, "merge_approval");
  }

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
      if (isV31) {
        assert.ok(state.git.merged_sha);
        assert.ok(state.delivery.evidence_path);
        assert.equal(state.gate_scope?.merged_sha, state.git.merged_sha);
        assert.equal(state.gate_scope?.evidence_path, state.delivery.evidence_path);
      }
    } else if (state.gate === "merge_approval") {
      assert.equal(state.next.on_approval.phase, "delivery_verification");
      assert.equal(state.next.on_approval.action, "verify-delivery");
      assert.equal(state.gate_scope.repository, state.git.repository);
      assert.equal(state.gate_scope.branch, state.git.branch);
      assert.equal(state.gate_scope.lifecycle_generation, state.git.lifecycle_generation);
      assert.equal(state.gate_scope.pr_number, state.git.pr_number);
      assert.equal(state.gate_scope.reviewed_sha, state.git.reviewed_sha);
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
    assert.ok(state.phase === "design" || state.phase === "design_review");
  } else if (route === "fixes") {
    assert.ok(state.phase === "fixes" || state.phase === "fix_rereview");
  } else {
    assert.equal(state.phase, "reconciliation");
  }

  if (state.phase === "human_gate" || state.phase === "complete") {
    assert.deepEqual(state.blocking_findings, []);
  }
  if (operationalGates.has(state.gate) || state.gate === "merge_approval") {
    assert.ok(state.gate_scope);
    validateGateScope(state.gate, state.gate_scope);
  } else if (isV31 && state.gate === "work_item_completion") {
    assert.ok(state.gate_scope);
  } else {
    assert.equal("gate_scope" in state, false);
  }

  if (isV31) {
    if (state.phase === "work_item_init") {
      assert.equal(state.git.lifecycle_anchor_sha, null);
      assert.equal(state.git.pr_number, null);
      assert.equal(state.git.reviewed_sha, null);
      assert.equal(state.git.merged_sha, null);
      assert.equal(state.delivery.evidence_path, null);
    } else {
      assert.match(state.git.lifecycle_anchor_sha, /^[0-9a-f]{40}$/);
    }
    const afterMerge = state.phase === "delivery_verification"
      || (state.phase === "human_gate" && state.gate === "work_item_completion")
      || state.phase === "complete";
    if (afterMerge) assert.ok(state.git.merged_sha);
    const requiresReviewedSha = (state.phase === "human_gate" && state.gate === "merge_approval") || afterMerge;
    if (requiresReviewedSha) assert.match(state.git.reviewed_sha, /^[0-9a-f]{40}$/);
    else assert.equal(state.git.reviewed_sha, null, "reviewed SHA must be null before final review approval or merge");
    if (state.phase === "complete") assert.ok(state.delivery.evidence_path);
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

const shaA = "a".repeat(40);
const shaB = "b".repeat(40);
const shaC = "c".repeat(40);
const generation = "123e4567-e89b-42d3-a456-426614174000";
const v31Base = {
  ...base,
  version: "3.1",
  git: {
    repository: "github.com/owner/repository",
    branch: "work/fixture",
    lifecycle_generation: generation,
    lifecycle_anchor_sha: shaA,
    pr_number: 17,
    reviewed_sha: null,
    merged_sha: null,
  },
  delivery: { evidence_path: null },
};

const implementationFinding = {
  id: "MEDIUM-01",
  class: "implementation_defect",
  source: "docs/reviews/fixture.md",
  summary: "Implementation does not satisfy the approved contract.",
};

const designFinding = {
  id: "HIGH-01",
  class: "design_defect",
  source: "docs/reviews/fixture.md",
  summary: "The design contract requires revision.",
};

const legal = [
  ["design", "create-or-revise-design"],
  ["design_review", "review-design"],
  ["implementation", "implement-slice-a"],
  ["implementation_review", "review-slice-a"],
].map(([phase, action]) => ({ ...base, phase, next: { action } }));

legal.push({ ...base, phase: "fixes", blocking_findings: [implementationFinding], next: { action: "fix-MEDIUM-01" } });
legal.push({ ...base, phase: "fix_rereview", blocking_findings: [implementationFinding], next: { action: "rereview-slice-a" } });
legal.push({ ...base, phase: "design", blocking_findings: [designFinding], next: { action: "create-or-revise-design" } });
legal.push({ ...base, phase: "design_review", blocking_findings: [designFinding], next: { action: "review-design" } });

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

const v31Legal = [
  {
    ...v31Base,
    phase: "work_item_init",
    git: { ...v31Base.git, lifecycle_anchor_sha: null, pr_number: null, reviewed_sha: null },
    next: { action: "initialize-work-item" },
  },
  ...[
    ["design", "create-or-revise-design"],
    ["design_review", "review-design"],
    ["implementation", "implement-slice-a"],
    ["implementation_review", "review-slice-a"],
  ].map(([phase, action]) => ({ ...v31Base, phase, next: { action } })),
  {
    ...v31Base,
    phase: "human_gate",
    status: "awaiting_approval",
    gate: "design_approval",
    next: { action: "approve-design", on_approval: { phase: "implementation", action: "implement-slice-a" } },
  },
  {
    ...v31Base,
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
      acceptance: ["Synchronize the reviewed state."],
    },
    next: {
      action: "reconcile-MEDIUM-01",
      on_success: { phase: "implementation_review", action: "review-slice-a" },
    },
  },
  {
    ...v31Base,
    phase: "human_gate",
    status: "awaiting_approval",
    gate: "merge_approval",
    git: { ...v31Base.git, reviewed_sha: shaA },
    gate_scope: {
      repository: "github.com/owner/repository",
      branch: "work/fixture",
      lifecycle_generation: generation,
      pr_number: 17,
      target_branch: "main",
      reviewed_sha: shaA,
    },
    next: { action: "approve-merge", on_approval: { phase: "delivery_verification", action: "verify-delivery" } },
  },
  {
    ...v31Base,
    phase: "delivery_verification",
    git: { ...v31Base.git, reviewed_sha: shaA, merged_sha: shaB },
    next: { action: "verify-delivery" },
  },
  {
    ...v31Base,
    phase: "delivery_verification",
    status: "blocked",
    git: { ...v31Base.git, reviewed_sha: shaA, merged_sha: shaB },
    next: { action: "supply-provider-observation" },
  },
  {
    ...v31Base,
    phase: "human_gate",
    status: "awaiting_approval",
    gate: "work_item_completion",
    git: { ...v31Base.git, reviewed_sha: shaA, merged_sha: shaB },
    delivery: { evidence_path: "docs/delivery-evidence/fixture/delivery-01.md" },
    gate_scope: { merged_sha: shaB, evidence_path: "docs/delivery-evidence/fixture/delivery-01.md" },
    next: { action: "approve-work-item-completion", on_approval: { phase: "complete", action: "none" } },
  },
  {
    ...v31Base,
    phase: "complete",
    status: "complete",
    completed_slices: ["slice-a"],
    git: { ...v31Base.git, reviewed_sha: shaA, merged_sha: shaB },
    delivery: { evidence_path: "docs/delivery-evidence/fixture/delivery-01.md" },
    next: { action: "none" },
  },
];
v31Legal.forEach(validateState);
v31Legal.forEach((state) => validateState(parseWorkflow(renderWorkflow(state))));
const v31DesignApproval = v31Legal.find((state) => state.gate === "design_approval");
const v31Reconciliation = v31Legal.find((state) => state.phase === "reconciliation");
assert.throws(() => validateState({
  ...v31DesignApproval,
  git: { ...v31DesignApproval.git, reviewed_sha: shaA },
}), /reviewed SHA must be null/);
assert.throws(() => validateState({
  ...v31Reconciliation,
  git: { ...v31Reconciliation.git, reviewed_sha: shaA },
}), /reviewed SHA must be null/);

const invalid = [
  { ...base, phase: "design", gate: "design_approval", next: { action: "create-or-revise-design" } },
  { ...base, phase: "human_gate", next: { action: "approve-design" } },
  { ...base, phase: "complete", status: "ready", next: { action: "none" } },
  { ...base, phase: "implementation", next: { action: "review-slice-a" } },
  { ...base, phase: "implementation", blocking_findings: [designFinding], next: { action: "implement-slice-a" } },
  {
    ...base,
    phase: "human_gate",
    status: "awaiting_approval",
    gate: "design_approval",
    blocking_findings: [designFinding],
    next: {
      action: "approve-design",
      on_approval: { phase: "implementation", action: "implement-slice-a" },
    },
  },
  { ...v31Base, phase: "implementation", git: { ...v31Base.git, branch: "work/other" }, next: { action: "implement-slice-a" } },
  { ...v31Base, phase: "delivery_verification", next: { action: "verify-delivery" } },
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
  work_item_init: new Set(["design"]),
  design: new Set(["design_review"]),
  design_review: new Set(["human_gate", "reconciliation", "design"]),
  implementation: new Set(["implementation_review", "human_gate"]),
  implementation_review: new Set(["human_gate", "fixes", "reconciliation", "design"]),
  fixes: new Set(["fix_rereview"]),
  fix_rereview: new Set(["human_gate", "fixes", "reconciliation"]),
  reconciliation: new Set(),
  delivery_verification: new Set(["human_gate", "fixes", "reconciliation", "design"]),
  human_gate: new Set(),
  complete: new Set(),
};

function validateTransition(from, to, {
  finalSlice = false,
  laterSlice = false,
  terminalPushed = false,
  deliveryEvidence,
  observedMerge,
  reviewedSha,
} = {}) {
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
  if (to.phase === "human_gate" && to.gate === "merge_approval") {
    assert.equal(String(to.version), "3.1");
    assert.equal(finalSlice, true);
    assert.match(reviewedSha, /^[0-9a-f]{40}$/, "approved implementation SHA is required");
    assert.equal(to.git.reviewed_sha, reviewedSha, "merge gate records another reviewed implementation SHA");
  }
  if (to.phase === "human_gate" && (to.gate === "work_item_completion" || to.gate === "lesson_completion")) {
    assert.equal(finalSlice, true);
    assert.deepEqual(to.blocking_findings, []);
    if (String(to.version) === "3.1") {
      assert.equal(from.phase, "delivery_verification");
      const verified = verifyDelivery(from, deliveryEvidence);
      assert.equal(verified.mergedSha, from.git.merged_sha);
      assert.equal(to.git.merged_sha, from.git.merged_sha, "completion changed the authoritative merged SHA");
      assert.equal(to.gate_scope.merged_sha, from.git.merged_sha, "completion gate is bound to another merged SHA");
      assert.equal(to.delivery.evidence_path, verified.evidencePath, "completion points to different delivery evidence");
      assert.equal(to.gate_scope.evidence_path, verified.evidencePath, "completion gate points to different delivery evidence");
    }
  }
  if (from.phase === "human_gate" && from.gate === "merge_approval") {
    validateMergeResult(from, to, observedMerge);
  }
  if (from.phase === "human_gate" && (from.gate === "work_item_completion" || from.gate === "lesson_completion")) {
    assert.equal(finalSlice, true);
    assert.equal(to.phase, "complete");
    assert.ok(to.completed_slices.includes(to.current_slice.id));
    if (String(from.version) === "3.1") assert.equal(terminalPushed, true);
  }
}

const implementationReviewState = legal.find((state) => state.phase === "implementation_review");
const fixesState = legal.find((state) => state.phase === "fixes");
const fixRereviewState = legal.find((state) => state.phase === "fix_rereview");
const designReviewWithFindingsState = legal.find((state) => state.phase === "design_review" && state.blocking_findings.length > 0);
const designApprovalGateState = legal.find((state) => state.gate === "design_approval");
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
  [designReviewWithFindingsState, designApprovalGateState],
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

const v31ImplementationReview = v31Legal.find((state) => state.phase === "implementation_review");
const mergeGateState = v31Legal.find((state) => state.gate === "merge_approval");
const deliveryState = v31Legal.find((state) => state.phase === "delivery_verification" && state.status === "ready");
const v31CompletionGate = v31Legal.find((state) => state.gate === "work_item_completion");
const v31Complete = v31Legal.find((state) => state.phase === "complete");

function validatePostReviewCommits(state, observation) {
  const reviewedSha = state.git.reviewed_sha;
  assert.match(reviewedSha, /^[0-9a-f]{40}$/, "merge gate requires a reviewed SHA");
  assert.equal(
    observation.headSha === reviewedSha || observation.headAncestors.includes(reviewedSha),
    true,
    "current PR head does not descend from reviewed SHA",
  );
  assert.ok(Array.isArray(observation.commitsAfterReviewed), "post-review commit evidence is required");
  const workflowPath = `docs/workflow/${state.work_item_id}.yaml`;
  const reviewPattern = new RegExp(`^docs/reviews/${state.work_item_id}/(?:implementation-review|fix-rereview)-.+\\.md$`);
  let expectedParent = reviewedSha;
  for (const commit of observation.commitsAfterReviewed) {
    assert.match(commit.sha, /^[0-9a-f]{40}$/, "post-review commit SHA is invalid");
    assert.equal(commit.parentSha, expectedParent, "post-review commits are not a contiguous first-parent chain");
    assert.ok(Array.isArray(commit.changes) && commit.changes.length > 0, "post-review commit has no auditable changes");
    for (const change of commit.changes) {
      assert.equal(change.previousPath, undefined, "post-review renames are forbidden");
      if (change.path === workflowPath) {
        assert.equal(change.status, "modified", "workflow control-plane file may only be modified");
      } else {
        assert.match(change.path, reviewPattern, "post-review implementation/application path requires review again");
        assert.equal(change.status, "added", "post-review evidence must be a new immutable review");
      }
    }
    expectedParent = commit.sha;
  }
  assert.equal(expectedParent, observation.headSha, "post-review evidence does not end at the current PR head");
}

function resolveMergeCandidate(state, observation) {
  validateState(state);
  assert.equal(state.phase, "human_gate");
  assert.equal(state.gate, "merge_approval");
  assert.equal(observation.repository, state.git.repository, "merge candidate repository mismatch");
  assert.equal(observation.branch, state.git.branch, "merge candidate branch mismatch");
  assert.equal(observation.lifecycleGeneration, state.git.lifecycle_generation, "merge candidate generation mismatch");
  assert.equal(observation.prNumber, state.git.pr_number, "merge candidate PR mismatch");
  assert.equal(observation.targetBranch, "main", "merge candidate does not target main");
  assert.match(observation.headSha, /^[0-9a-f]{40}$/, "current PR head is not a full SHA");
  assert.match(observation.remoteBranchHeadSha, /^[0-9a-f]{40}$/, "canonical remote head is not a full SHA");
  assert.match(observation.prHeadSha, /^[0-9a-f]{40}$/, "live PR head is not a full SHA");
  assert.equal(observation.remoteBranchHeadSha, observation.headSha, "canonical remote head differs from presented head");
  assert.equal(observation.prHeadSha, observation.headSha, "live PR head differs from presented head");
  validatePostReviewCommits(state, observation);
  assert.ok(observation.validationRunId, "required validation run is missing");
  assert.equal(observation.validationHeadSha, observation.headSha, "validation belongs to another PR head");
  assert.equal(observation.requiredChecksPassed, true, "required checks did not pass");
  assert.equal(observation.cleanTree, true, "working tree is dirty");
  assert.equal(observation.diffScopeVerified, true, "approved diff scope is not proven");
  assert.equal(observation.unresolvedFindings, "none", "review findings remain active");
  assert.equal(observation.branchRetained, true, "merge path may delete the canonical branch");
  assert.equal(observation.autoDeleteDisabled, true, "automatic branch deletion is enabled");
  assert.equal(observation.cleanupDeletionBlocked, true, "cleanup can delete a non-terminal branch");
  return {
    repository: observation.repository,
    branch: observation.branch,
    lifecycleGeneration: observation.lifecycleGeneration,
    reviewedSha: state.git.reviewed_sha,
    headSha: observation.headSha,
    validationRunId: observation.validationRunId,
    requiredChecksPassed: observation.requiredChecksPassed,
    prNumber: observation.prNumber,
    targetBranch: observation.targetBranch,
    controlPlaneLineageVerified: true,
    cleanTree: observation.cleanTree,
    diffScopeVerified: observation.diffScopeVerified,
    unresolvedFindings: observation.unresolvedFindings,
    branchRetained: observation.branchRetained,
    autoDeleteDisabled: observation.autoDeleteDisabled,
    cleanupDeletionBlocked: observation.cleanupDeletionBlocked,
  };
}

function consumeMergeApproval(state, presentation, currentObservation) {
  const current = resolveMergeCandidate(state, currentObservation);
  assert.deepEqual(current, presentation, "merge-gate evidence changed after approval");
  return { expectedHeadOid: current.headSha, prNumber: current.prNumber };
}

const mergeCandidateObservation = {
  repository: "github.com/owner/repository",
  branch: "work/fixture",
  lifecycleGeneration: generation,
  prNumber: 17,
  targetBranch: "main",
  headSha: shaC,
  remoteBranchHeadSha: shaC,
  prHeadSha: shaC,
  headAncestors: [shaA, shaB],
  commitsAfterReviewed: [
    {
      sha: shaB,
      parentSha: shaA,
      changes: [
        { path: "docs/reviews/fixture/implementation-review-01-slice-a.md", status: "added" },
        { path: "docs/workflow/fixture.yaml", status: "modified" },
      ],
    },
    {
      sha: shaC,
      parentSha: shaB,
      changes: [{ path: "docs/workflow/fixture.yaml", status: "modified" }],
    },
  ],
  validationRunId: 991,
  validationHeadSha: shaC,
  requiredChecksPassed: true,
  cleanTree: true,
  diffScopeVerified: true,
  unresolvedFindings: "none",
  branchRetained: true,
  autoDeleteDisabled: true,
  cleanupDeletionBlocked: true,
};
const mergePresentation = resolveMergeCandidate(mergeGateState, mergeCandidateObservation);
assert.deepEqual(consumeMergeApproval(mergeGateState, mergePresentation, mergeCandidateObservation), {
  expectedHeadOid: shaC,
  prNumber: 17,
});
const observedMergeProof = {
  repositoryMergeStrategy: "merge",
  prNumber: 17,
  reviewedSha: shaA,
  approvedHeadSha: shaC,
  currentPrHeadSha: shaC,
  expectedHeadOid: shaC,
  sourceHeadSha: shaC,
  resultSha: shaB,
  protectedMainSha: shaB,
  parentShas: [shaC, shaA],
  providerAttributed: true,
};
const authoritativeDeliveryEvidence = {
  evidencePath: "docs/delivery-evidence/fixture/delivery-01.md",
  authoritativeMergedSha: shaB,
  mainSha: shaB,
  prMergeSha: shaB,
  githubRunSha: shaB,
  railwayDeploymentSha: shaB,
  railwayGitCommitSha: shaB,
  exactShaVerifierSha: shaB,
  githubEvent: "push",
  githubConclusion: "success",
  railwayWaitingObserved: true,
  railwayObservedState: "SUCCESS",
  verifierBeforeMigration: true,
  timestampsOrdered: true,
  migrationSucceeded: true,
  readinessSucceeded: true,
  smokeSucceeded: true,
  identitiesUnchanged: true,
};
validateTransition(v31ImplementationReview, mergeGateState, { finalSlice: true, reviewedSha: shaA });
validateTransition(mergeGateState, deliveryState, { finalSlice: true, observedMerge: observedMergeProof });
validateTransition(deliveryState, v31CompletionGate, { finalSlice: true, deliveryEvidence: authoritativeDeliveryEvidence });
validateTransition(v31CompletionGate, v31Complete, { finalSlice: true, terminalPushed: true });
assert.throws(() => validateTransition(v31ImplementationReview, v31CompletionGate, { finalSlice: true }));
assert.throws(() => validateTransition(deliveryState, v31CompletionGate, { finalSlice: true }));
assert.throws(() => validateTransition(v31CompletionGate, v31Complete, { finalSlice: true }));

const safeWorkItemIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedRefComponents = new Set([
  "head", "heads", "tags", "remotes", "origin", "orchestration", "work",
]);

function validateWorkItemId(workItemId) {
  assert.equal(typeof workItemId, "string", "work-item ID must be a string");
  assert.ok(workItemId.length > 0 && workItemId.length <= 80, "work-item ID length is unsafe");
  assert.match(workItemId, safeWorkItemIdPattern, "work-item ID must be lowercase kebab-case");
  for (const component of workItemId.split("-")) {
    assert.equal(reservedRefComponents.has(component), false, "work-item ID contains a reserved ref component");
  }
  return workItemId;
}

function deriveLifecycleRefs(workItemId, lifecycleGeneration) {
  validateWorkItemId(workItemId);
  assert.match(lifecycleGeneration, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const branch = `work/${workItemId}`;
  const branchRef = `refs/heads/${branch}`;
  const registrationRef = `refs/tags/orchestration/${workItemId}/${lifecycleGeneration}`;
  for (const ref of [branchRef, registrationRef]) {
    assert.doesNotMatch(ref, /(?:\.\.|@\{|\\|\s|[~^:?*\[]|\.$|\/\.|\.\/|\/\/)/, "derived Git ref is unsafe");
    assert.equal(ref.endsWith(".lock"), false, "derived Git ref uses a reserved suffix");
  }
  return { branch, branchRef, registrationRef };
}

function initializeWorkItem(input) {
  assert.equal(input.currentBranch, "main", "initialization requires main");
  assert.equal(input.clean, true, "initialization requires a clean tree");
  assert.equal(input.originRepository, input.expectedRepository, "origin identity mismatch");
  assert.equal(input.fetchSucceeded, true, "fetch failed");
  assert.equal(input.mainRelation, "synchronized", "main is ahead or divergent");
  assert.equal(input.fastForwardPull, true, "fast-forward-only pull failed");
  assert.equal(input.localBranchExists, false, "canonical local branch already exists");
  assert.equal(input.remoteBranchExists, false, "canonical remote branch already exists");
  assert.deepEqual(input.lifecycleRegistrations, [], "lifecycle registration already exists");
  assert.deepEqual(input.sameIdClaims, [], "work-item identity is already claimed");
  if (input.inheritedLifecycleGeneration) {
    assert.notEqual(input.lifecycleGeneration, input.inheritedLifecycleGeneration, "fresh init inherited a lifecycle generation");
  }
  assert.match(input.mainSha, /^[0-9a-f]{40}$/, "main must resolve to a full SHA");
  assert.match(input.bootstrapSha, /^[0-9a-f]{40}$/, "bootstrap commit must resolve to a full SHA");
  assert.notEqual(input.bootstrapSha, input.mainSha, "bootstrap commit must be a new commit");
  assert.deepEqual(input.bootstrapParentShas, [input.mainSha], "bootstrap commit must be based directly on synchronized main");
  const refs = deriveLifecycleRefs(input.workItemId, input.lifecycleGeneration);
  const bootstrapIdentity = {
    repository: input.expectedRepository,
    workItemId: input.workItemId,
    branch: refs.branch,
    lifecycleGeneration: input.lifecycleGeneration,
  };
  return {
    baseSha: input.mainSha,
    bootstrapSha: input.bootstrapSha,
    branch: refs.branch,
    branchRef: refs.branchRef,
    lifecycleGeneration: input.lifecycleGeneration,
    bootstrapIdentity,
    registrationRef: refs.registrationRef,
    registration: {
      ref: refs.registrationRef,
      workItemId: input.workItemId,
      lifecycleGeneration: input.lifecycleGeneration,
      annotated: true,
      targetSha: input.bootstrapSha,
      annotation: bootstrapIdentity,
      bootstrapIdentity,
    },
  };
}

function publishInitialization(plan, publication) {
  assert.equal(publication.atomicPushSupported, true, "remote cannot publish lifecycle refs atomically");
  assert.equal(publication.atomicPushSucceeded, true, "atomic lifecycle publication failed");
  assert.deepEqual(
    [...publication.publishedRefs].sort(),
    [plan.branchRef, plan.registrationRef].sort(),
    "lifecycle publication was partial or included another ref",
  );
  assert.match(publication.remoteBranchSha, /^[0-9a-f]{40}$/, "published branch head is not a full SHA");
  assert.equal(publication.remoteBranchAncestors.includes(plan.bootstrapSha), true, "published branch does not descend from the bootstrap commit");
  assert.equal(publication.remoteRegistration.ref, plan.registrationRef, "published registration ref mismatch");
  assert.equal(publication.remoteRegistration.annotated, true, "published registration is not annotated");
  assert.equal(publication.remoteRegistration.targetSha, plan.bootstrapSha, "published registration targets another commit");
  assert.deepEqual(publication.remoteRegistration.annotation, plan.bootstrapIdentity, "published registration annotation mismatch");
  assert.deepEqual(publication.remoteRegistration.bootstrapIdentity, plan.bootstrapIdentity, "published bootstrap identity mismatch");
  assert.equal(publication.remoteState.work_item_id, plan.bootstrapIdentity.workItemId, "published workflow ID mismatch");
  assert.equal(publication.remoteState.git.repository, plan.bootstrapIdentity.repository, "published workflow repository mismatch");
  assert.equal(publication.remoteState.git.branch, plan.bootstrapIdentity.branch, "published workflow branch mismatch");
  assert.equal(publication.remoteState.git.lifecycle_generation, plan.lifecycleGeneration, "published workflow generation mismatch");
  assert.equal(publication.remoteState.git.lifecycle_anchor_sha, plan.bootstrapSha, "published workflow anchor mismatch");
  return {
    branchRef: plan.branchRef,
    branchSha: publication.remoteBranchSha,
    branchAncestors: publication.remoteBranchAncestors,
    registration: publication.remoteRegistration,
    remoteState: publication.remoteState,
  };
}

const safeInit = {
  currentBranch: "main",
  clean: true,
  originRepository: "github.com/owner/repository",
  expectedRepository: "github.com/owner/repository",
  fetchSucceeded: true,
  mainRelation: "synchronized",
  fastForwardPull: true,
  lifecycleRegistrations: [],
  sameIdClaims: [],
  localBranchExists: false,
  remoteBranchExists: false,
  lifecycleGeneration: generation,
  mainSha: shaA,
  bootstrapSha: shaB,
  bootstrapParentShas: [shaA],
  workItemId: "fixture",
};
const safeInitPlan = initializeWorkItem(safeInit);
assert.deepEqual(safeInitPlan, {
  baseSha: shaA,
  bootstrapSha: shaB,
  branch: "work/fixture",
  branchRef: "refs/heads/work/fixture",
  lifecycleGeneration: generation,
  bootstrapIdentity: {
    repository: "github.com/owner/repository",
    workItemId: "fixture",
    branch: "work/fixture",
    lifecycleGeneration: generation,
  },
  registrationRef: `refs/tags/orchestration/fixture/${generation}`,
  registration: {
    ref: `refs/tags/orchestration/fixture/${generation}`,
    workItemId: "fixture",
    lifecycleGeneration: generation,
    annotated: true,
    targetSha: shaB,
    annotation: {
      repository: "github.com/owner/repository",
      workItemId: "fixture",
      branch: "work/fixture",
      lifecycleGeneration: generation,
    },
    bootstrapIdentity: {
      repository: "github.com/owner/repository",
      workItemId: "fixture",
      branch: "work/fixture",
      lifecycleGeneration: generation,
    },
  },
});
for (const unsafe of [
  { clean: false },
  { currentBranch: "feature/other" },
  { mainRelation: "ahead" },
  { mainRelation: "diverged" },
  { localBranchExists: true },
  { remoteBranchExists: true },
  { lifecycleRegistrations: [`refs/tags/orchestration/fixture/${generation}`] },
  { sameIdClaims: ["refs/heads/main:docs/workflow/fixture.yaml"] },
  { inheritedLifecycleGeneration: generation },
  { mainSha: "main" },
  { bootstrapSha: shaA },
  { bootstrapParentShas: [shaC] },
  { lifecycleGeneration: `${generation}/refs` },
]) {
  assert.throws(() => initializeWorkItem({ ...safeInit, ...unsafe }));
}
for (const workItemId of [
  "../fixture", "fixture/topic", "fixture..topic", "fixture.lock", "Fixture",
  "fixture@{one}", "fixture--topic", "refs-heads-fixture", "work-fixture", "head",
]) {
  assert.throws(() => initializeWorkItem({ ...safeInit, workItemId }));
}

function identityTuple(entry) {
  return {
    repository: entry.repository,
    workItemId: entry.workItemId,
    branch: entry.branch,
    lifecycleGeneration: entry.lifecycleGeneration,
  };
}

function validatePrAndMergeLineage(selected, registration) {
  const state = selected.state;
  if (state.git.pr_number === null) {
    assert.equal(selected.pr, null, "unexpected PR metadata before primary PR creation");
    assert.equal(state.git.merged_sha, null, "workflow cannot be merged without a primary PR");
    return;
  }

  assert.ok(selected.pr, "primary PR metadata is missing");
  assert.equal(selected.pr.number, state.git.pr_number, "primary PR number mismatch");
  assert.equal(selected.pr.headRef, state.git.branch, "primary PR head is not the canonical branch");
  assert.equal(selected.pr.baseRef, "main", "primary PR does not target main");
  assert.equal(selected.pr.headAncestors.includes(registration.targetSha), true, "PR head does not descend from the bootstrap anchor");
  assert.equal(selected.bootstrapAncestors.includes(selected.pr.headSha), true, "PR head is outside canonical branch ancestry");
  if (state.git.reviewed_sha !== null) {
    assert.equal(selected.bootstrapAncestors.includes(state.git.reviewed_sha), true, "reviewed SHA is outside canonical branch ancestry");
    assert.equal(
      selected.pr.headSha === state.git.reviewed_sha || selected.pr.headAncestors.includes(state.git.reviewed_sha),
      true,
      "PR head does not descend from reviewed SHA",
    );
  }
  assert.equal(selected.pr.mergeStrategy, selected.repositoryMergeStrategy, "PR lineage uses a merge strategy different from repository configuration");

  if (state.git.merged_sha === null) {
    assert.equal(selected.pr.mergedSha, null, "provider reports a merge absent from workflow state");
    return;
  }

  assert.equal(selected.pr.mergedSha, state.git.merged_sha, "merged main SHA does not match primary PR result");
  assert.ok(selected.pr.mergeLineage, "merge lineage evidence is missing");
  assert.equal(selected.pr.mergeLineage.resultSha, state.git.merged_sha, "merge lineage result differs from workflow merged SHA");
  assert.equal(selected.pr.mergeLineage.prNumber, state.git.pr_number, "merge lineage belongs to another PR");
  assert.equal(selected.pr.mergeLineage.sourceHeadSha, selected.pr.headSha, "merge lineage belongs to another PR head");
  if (selected.pr.mergeStrategy === "merge") {
    assert.equal(selected.pr.mergeLineage.parentShas.includes(selected.pr.headSha), true, "merge commit does not contain the approved PR head");
  } else if (selected.pr.mergeStrategy === "squash" || selected.pr.mergeStrategy === "rebase") {
    assert.equal(selected.pr.mergeLineage.providerAttributed, true, `${selected.pr.mergeStrategy} result is not attributed to the approved PR`);
  } else {
    assert.fail("unsupported or missing repository merge strategy");
  }
}

function resolveExecutableRef({ requestedId, expectedRepository, executionRef, refs, registrations }) {
  validateWorkItemId(requestedId);
  const expectedRef = `refs/remotes/origin/work/${requestedId}`;
  assert.equal(executionRef, expectedRef, "workflow copies on another ref are non-executable");
  const exact = refs.filter((entry) => entry.ref === expectedRef);
  assert.equal(exact.length, 1, "missing or ambiguous canonical work branch");
  const selected = exact[0];

  const sameIdRegistrations = registrations.filter((entry) => entry.workItemId === requestedId);
  assert.equal(sameIdRegistrations.length, 1, "missing or duplicate lifecycle registration");
  const registration = sameIdRegistrations[0];
  const expectedTag = `refs/tags/orchestration/${requestedId}/${registration.lifecycleGeneration}`;
  assert.equal(registration.ref, expectedTag, "lifecycle registration namespace mismatch");
  assert.equal(registration.annotated, true, "lifecycle registration must be annotated");
  assert.match(registration.targetSha, /^[0-9a-f]{40}$/);
  assert.deepEqual(registration.annotation, {
    repository: expectedRepository,
    workItemId: requestedId,
    branch: `work/${requestedId}`,
    lifecycleGeneration: registration.lifecycleGeneration,
  }, "lifecycle annotation identity mismatch");
  assert.deepEqual(registration.bootstrapIdentity, registration.annotation, "bootstrap identity mismatch");

  const selectedIdentity = identityTuple(registration.annotation);
  for (const candidate of registrations) {
    const claimsSelectedIdentity = candidate.workItemId === requestedId
      || candidate.lifecycleGeneration === registration.lifecycleGeneration;
    if (!claimsSelectedIdentity) continue;
    assert.deepEqual(identityTuple(candidate.annotation), selectedIdentity, "conflicting lifecycle registration identity");
    assert.deepEqual(identityTuple(candidate.bootstrapIdentity), selectedIdentity, "conflicting bootstrap registration identity");
    assert.equal(candidate.ref, expectedTag, "same identity is registered under another lifecycle ref");
    assert.equal(candidate.targetSha, registration.targetSha, "same identity has conflicting bootstrap anchors");
  }

  validateState(selected.state);
  assert.equal(String(selected.state.version), "3.1");
  assert.equal(selected.state.work_item_id, requestedId);
  assert.equal(selected.state.git.repository, expectedRepository);
  assert.equal(selected.state.git.branch, `work/${requestedId}`);
  assert.equal(selected.state.git.lifecycle_generation, registration.lifecycleGeneration, "lifecycle generation mismatch");
  assert.equal(selected.state.git.lifecycle_anchor_sha, registration.targetSha, "lifecycle anchor mismatch");
  assert.equal(selected.bootstrapAncestors.includes(registration.targetSha), true, "bootstrap anchor is outside canonical ancestry");
  for (const candidate of refs) {
    if (candidate === selected || !candidate.state || String(candidate.state.version) !== "3.1") continue;
    const claimsSelectedIdentity = candidate.state.work_item_id === requestedId
      || candidate.state.git?.lifecycle_generation === registration.lifecycleGeneration;
    if (!claimsSelectedIdentity) continue;
    const inertMainSnapshot = candidate.ref === "refs/remotes/origin/main"
      && candidate.state.work_item_id === requestedId
      && candidate.state.git.repository === expectedRepository
      && candidate.state.git.branch === selected.state.git.branch
      && candidate.state.git.lifecycle_generation === registration.lifecycleGeneration
      && candidate.state.git.lifecycle_anchor_sha === registration.targetSha;
    assert.equal(inertMainSnapshot, true, "conflicting same-ID or same-generation claim exists on another ref");
  }
  validatePrAndMergeLineage(selected, registration);
  assert.notEqual(selected.state.phase, "complete", "terminal retained branch is non-executable");
  return { selected, registration };
}

function enterWorkItem(mode, input) {
  if (mode === "initialize") return initializeWorkItem(input);
  if (mode === "resume") return resolveExecutableRef(input);
  assert.fail("entry path must be explicitly initialize or resume");
}

const executableRef = {
  ref: "refs/remotes/origin/work/fixture",
  repositoryMergeStrategy: "merge",
  bootstrapAncestors: [shaA],
  headSha: shaA,
  pr: {
    number: 17,
    headRef: "work/fixture",
    baseRef: "main",
    headSha: shaA,
    headAncestors: [shaA],
    mergedSha: null,
    mergeStrategy: "merge",
    mergeLineage: null,
  },
  state: { ...v31Base, phase: "implementation", next: { action: "implement-slice-a" } },
};
const lifecycleRegistration = {
  ref: `refs/tags/orchestration/fixture/${generation}`,
  workItemId: "fixture",
  lifecycleGeneration: generation,
  annotated: true,
  targetSha: shaA,
  annotation: {
    repository: "github.com/owner/repository",
    workItemId: "fixture",
    branch: "work/fixture",
    lifecycleGeneration: generation,
  },
  bootstrapIdentity: {
    repository: "github.com/owner/repository",
    workItemId: "fixture",
    branch: "work/fixture",
    lifecycleGeneration: generation,
  },
};
const publishedLifecycle = publishInitialization(safeInitPlan, {
  atomicPushSupported: true,
  atomicPushSucceeded: true,
  publishedRefs: [safeInitPlan.branchRef, safeInitPlan.registrationRef],
  remoteBranchSha: shaC,
  remoteBranchAncestors: [safeInitPlan.bootstrapSha],
  remoteRegistration: safeInitPlan.registration,
  remoteState: {
    ...v31Base,
    phase: "design",
    git: {
      ...v31Base.git,
      lifecycle_anchor_sha: safeInitPlan.bootstrapSha,
      pr_number: null,
      reviewed_sha: null,
    },
    next: { action: "create-or-revise-design" },
  },
});
const initializedExecutableRef = {
  ref: "refs/remotes/origin/work/fixture",
  bootstrapAncestors: [safeInitPlan.bootstrapSha, shaC],
  headSha: shaC,
  pr: null,
  state: publishedLifecycle.remoteState,
};
assert.equal(publishedLifecycle.registration.targetSha, safeInitPlan.bootstrapSha);
assert.equal(resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: initializedExecutableRef.ref,
  refs: [initializedExecutableRef],
  registrations: [publishedLifecycle.registration],
}).selected.ref, initializedExecutableRef.ref);
for (const failedPublication of [
  { atomicPushSupported: false, atomicPushSucceeded: false, publishedRefs: [] },
  { atomicPushSupported: true, atomicPushSucceeded: false, publishedRefs: [] },
  { atomicPushSupported: true, atomicPushSucceeded: true, publishedRefs: [safeInitPlan.branchRef] },
  { atomicPushSupported: true, atomicPushSucceeded: true, publishedRefs: [safeInitPlan.registrationRef] },
]) {
  assert.throws(() => publishInitialization(safeInitPlan, {
    remoteBranchSha: shaC,
    remoteBranchAncestors: [safeInitPlan.bootstrapSha],
    remoteRegistration: safeInitPlan.registration,
    remoteState: initializedExecutableRef.state,
    ...failedPublication,
  }));
}
for (const invalidPublishedIdentity of [
  { remoteBranchAncestors: [] },
  { remoteRegistration: { ...safeInitPlan.registration, annotated: false } },
  { remoteRegistration: { ...safeInitPlan.registration, targetSha: shaA } },
  {
    remoteRegistration: {
      ...safeInitPlan.registration,
      annotation: { ...safeInitPlan.registration.annotation, repository: "github.com/other/repository" },
    },
  },
  {
    remoteState: {
      ...initializedExecutableRef.state,
      git: { ...initializedExecutableRef.state.git, lifecycle_anchor_sha: shaA },
    },
  },
]) {
  assert.throws(() => publishInitialization(safeInitPlan, {
    atomicPushSupported: true,
    atomicPushSucceeded: true,
    publishedRefs: [safeInitPlan.branchRef, safeInitPlan.registrationRef],
    remoteBranchSha: shaC,
    remoteBranchAncestors: [safeInitPlan.bootstrapSha],
    remoteRegistration: safeInitPlan.registration,
    remoteState: initializedExecutableRef.state,
    ...invalidPublishedIdentity,
  }));
}
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: initializedExecutableRef.ref,
  refs: [initializedExecutableRef],
  registrations: [],
}), /missing or duplicate lifecycle registration/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: initializedExecutableRef.ref,
  refs: [],
  registrations: [safeInitPlan.registration],
}), /missing or ambiguous canonical work branch/);
const staleMainSnapshot = {
  ...executableRef,
  ref: "refs/remotes/origin/main",
};
assert.equal(resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [staleMainSnapshot, executableRef],
  registrations: [lifecycleRegistration],
}).selected.ref, executableRef.ref);

const conflictingRef = {
  ...executableRef,
  ref: "refs/remotes/origin/work/fixture-copy",
};
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef, conflictingRef],
  registrations: [lifecycleRegistration],
}), /conflicting same-ID or same-generation claim/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef, {
    ...conflictingRef,
    state: { ...conflictingRef.state, git: { ...conflictingRef.state.git, lifecycle_anchor_sha: shaB } },
  }],
  registrations: [lifecycleRegistration],
}), /conflicting same-ID or same-generation claim/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef, {
    ...conflictingRef,
    state: { ...conflictingRef.state, git: { ...conflictingRef.state.git, repository: "github.com/other/repository" } },
  }],
  registrations: [lifecycleRegistration],
}), /conflicting same-ID or same-generation claim/);
const reusedGenerationRegistration = {
  ...lifecycleRegistration,
  ref: `refs/tags/orchestration/other/${generation}`,
  workItemId: "other",
  annotation: {
    repository: "github.com/owner/repository",
    workItemId: "other",
    branch: "work/other",
    lifecycleGeneration: generation,
  },
  bootstrapIdentity: {
    repository: "github.com/owner/repository",
    workItemId: "other",
    branch: "work/other",
    lifecycleGeneration: generation,
  },
};
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef],
  registrations: [lifecycleRegistration, reusedGenerationRegistration],
}), /conflicting lifecycle registration identity/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, pr: { ...executableRef.pr, headAncestors: [] } }],
  registrations: [lifecycleRegistration],
}), /PR head does not descend/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{
    ...executableRef,
    headSha: shaB,
    pr: { ...executableRef.pr, headSha: shaB, headAncestors: [shaA] },
  }],
  registrations: [lifecycleRegistration],
}), /PR head is outside canonical branch ancestry/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, pr: { ...executableRef.pr, mergeStrategy: "squash" } }],
  registrations: [lifecycleRegistration],
}), /different from repository configuration/);

const mergedExecutableRef = {
  ...executableRef,
  bootstrapAncestors: [shaA],
  state: {
    ...v31Base,
    phase: "delivery_verification",
    git: { ...v31Base.git, reviewed_sha: shaA, merged_sha: shaB },
    next: { action: "verify-delivery" },
  },
  pr: {
    ...executableRef.pr,
    mergedSha: shaB,
    mergeLineage: {
      resultSha: shaB,
      prNumber: 17,
      sourceHeadSha: shaA,
      parentShas: [shaC, shaA],
      providerAttributed: true,
    },
  },
};
assert.equal(resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: mergedExecutableRef.ref,
  refs: [mergedExecutableRef],
  registrations: [lifecycleRegistration],
}).selected.state.git.merged_sha, shaB);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: mergedExecutableRef.ref,
  refs: [{
    ...mergedExecutableRef,
    pr: {
      ...mergedExecutableRef.pr,
      mergeLineage: { ...mergedExecutableRef.pr.mergeLineage, parentShas: [shaC] },
    },
  }],
  registrations: [lifecycleRegistration],
}), /merge commit does not contain/);
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [staleMainSnapshot],
  registrations: [lifecycleRegistration],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef],
  registrations: [],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef],
  registrations: [lifecycleRegistration, { ...lifecycleRegistration, targetSha: shaB }],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, state: {
    ...executableRef.state,
    git: { ...executableRef.state.git, lifecycle_anchor_sha: shaB },
  } }],
  registrations: [lifecycleRegistration],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, state: {
    ...executableRef.state,
    git: { ...executableRef.state.git, lifecycle_generation: "123e4567-e89b-42d3-a456-426614174001" },
  } }],
  registrations: [lifecycleRegistration],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, bootstrapAncestors: [] }],
  registrations: [lifecycleRegistration],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: "refs/remotes/origin/work/copied-snapshot",
  refs: [executableRef, { ...executableRef, ref: "refs/remotes/origin/work/copied-snapshot" }],
  registrations: [lifecycleRegistration],
}));
assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [{ ...executableRef, state: v31Complete, headSha: shaA }],
  registrations: [lifecycleRegistration],
}));

assert.throws(() => resolveExecutableRef({
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [executableRef],
  registrations: [],
}), /missing or duplicate lifecycle registration/);
assert.throws(() => enterWorkItem("resume", {
  requestedId: "fixture",
  expectedRepository: "github.com/owner/repository",
  executionRef: executableRef.ref,
  refs: [],
  registrations: [],
}), /missing or ambiguous canonical work branch/);
assert.throws(() => enterWorkItem("initialize", {
  ...safeInit,
  remoteBranchExists: true,
  lifecycleRegistrations: [lifecycleRegistration.ref],
}), /canonical remote branch already exists/);

function branchDeletionEligible({
  state,
  terminalCommitSha,
  remoteHeadSha,
  terminalCommitPushed,
  destructiveApproval,
  recoveryEvidence,
  lifecycleGeneration,
  prHistory,
}) {
  return state.phase === "complete"
    && state.status === "complete"
    && terminalCommitPushed === true
    && /^[0-9a-f]{40}$/.test(terminalCommitSha)
    && remoteHeadSha === terminalCommitSha
    && destructiveApproval === true
    && Boolean(recoveryEvidence)
    && lifecycleGeneration === state.git.lifecycle_generation
    && Array.isArray(prHistory)
    && prHistory.includes(state.git.pr_number);
}
const deletionProof = {
  state: v31Complete,
  terminalCommitSha: shaA,
  remoteHeadSha: shaA,
  terminalCommitPushed: true,
  destructiveApproval: true,
  recoveryEvidence: "refs/pull/17 + terminal commit",
  lifecycleGeneration: generation,
  prHistory: [17],
};
assert.equal(branchDeletionEligible({ ...deletionProof, state: executableRef.state }), false);
assert.equal(branchDeletionEligible({ ...deletionProof, terminalCommitPushed: false }), false);
assert.equal(branchDeletionEligible({ ...deletionProof, remoteHeadSha: shaB }), false);
assert.equal(branchDeletionEligible({ ...deletionProof, destructiveApproval: false }), false);
assert.equal(branchDeletionEligible(deletionProof), true);

function validateMergeResult(from, to, observation) {
  assert.ok(observation, "protected merge observation is required");
  assert.equal(observation.prNumber, from.git.pr_number, "merge result belongs to another PR");
  assert.equal(observation.reviewedSha, from.git.reviewed_sha, "merge result belongs to another reviewed revision");
  assert.equal(observation.currentPrHeadSha, observation.approvedHeadSha, "PR head changed after merge approval");
  assert.equal(observation.expectedHeadOid, observation.approvedHeadSha, "merge was not atomically bound to the approved head");
  assert.equal(observation.sourceHeadSha, observation.approvedHeadSha, "merge result belongs to another PR head");
  assert.equal(observation.resultSha, observation.protectedMainSha, "merge result is not the observed protected-main SHA");
  assert.match(observation.resultSha, /^[0-9a-f]{40}$/);
  assert.equal(to.git.merged_sha, observation.resultSha, "delivery state did not record the observed merged-main SHA");
  assert.equal(to.git.reviewed_sha, from.git.reviewed_sha, "merge transition changed the reviewed implementation SHA");
  if (observation.repositoryMergeStrategy === "merge") {
    assert.equal(observation.parentShas.includes(observation.approvedHeadSha), true, "merged main SHA is not descended from the approved PR head");
  } else if (observation.repositoryMergeStrategy === "squash" || observation.repositoryMergeStrategy === "rebase") {
    assert.equal(observation.providerAttributed, true, "merged main SHA is not attributed to the approved PR lineage");
  } else {
    assert.fail("unsupported or missing repository merge strategy");
  }
  return observation.resultSha;
}

function verifyDelivery(workflow, correlation) {
  assert.ok(correlation, "delivery evidence is required");
  const expected = workflow.git.merged_sha;
  assert.match(expected, /^[0-9a-f]{40}$/);
  assert.equal(correlation.authoritativeMergedSha, expected, "delivery evidence is bound to another workflow merged SHA");
  assert.match(correlation.evidencePath, /^docs\/delivery-evidence\/.+\/delivery-\d+\.md$/);
  for (const field of [
    "mainSha",
    "prMergeSha",
    "githubRunSha",
    "railwayDeploymentSha",
    "railwayGitCommitSha",
    "exactShaVerifierSha",
  ]) {
    assert.equal(correlation[field], expected, `${field} does not match merged SHA`);
  }
  assert.equal(correlation.githubEvent, "push");
  assert.equal(correlation.githubConclusion, "success");
  assert.equal(correlation.railwayWaitingObserved, true);
  assert.ok(["WAITING", "SUCCESS"].includes(correlation.railwayObservedState));
  assert.equal(correlation.verifierBeforeMigration, true);
  assert.equal(correlation.timestampsOrdered, true);
  for (const field of ["migrationSucceeded", "readinessSucceeded", "smokeSucceeded", "identitiesUnchanged"]) {
    assert.equal(correlation[field], true, `${field} is not proven`);
  }
  return { mergedSha: expected, evidencePath: correlation.evidencePath };
}
assert.deepEqual(verifyDelivery(deliveryState, authoritativeDeliveryEvidence), {
  mergedSha: shaB,
  evidencePath: "docs/delivery-evidence/fixture/delivery-01.md",
});
assert.throws(() => verifyDelivery(deliveryState, {
  ...authoritativeDeliveryEvidence,
  authoritativeMergedSha: shaA,
}), /another workflow merged SHA/);
assert.throws(() => verifyDelivery(deliveryState, Object.fromEntries(
  Object.entries(authoritativeDeliveryEvidence).map(([key, value]) => [
    key,
    key === "authoritativeMergedSha" || key.endsWith("Sha") ? shaA : value,
  ]),
)), /another workflow merged SHA/);
for (const field of [
  "githubRunSha",
  "railwayDeploymentSha",
  "railwayGitCommitSha",
  "exactShaVerifierSha",
]) {
  assert.throws(() => verifyDelivery(deliveryState, { ...authoritativeDeliveryEvidence, [field]: shaA }));
}
assert.throws(() => validateMergeResult(mergeGateState, deliveryState, {
  ...observedMergeProof,
  resultSha: shaC,
  protectedMainSha: shaC,
}));
assert.throws(() => validateMergeResult(mergeGateState, deliveryState, {
  ...observedMergeProof,
  parentShas: [shaA],
}), /not descended from the approved PR head/);
assert.throws(() => validateMergeResult(mergeGateState, deliveryState, {
  ...observedMergeProof,
  currentPrHeadSha: shaB,
}), /changed after merge approval/);
assert.throws(() => validateMergeResult(mergeGateState, deliveryState, {
  ...observedMergeProof,
  expectedHeadOid: shaB,
}), /not atomically bound/);
assert.throws(() => validateTransition(deliveryState, v31CompletionGate, {
  finalSlice: true,
  deliveryEvidence: { ...authoritativeDeliveryEvidence, authoritativeMergedSha: shaA },
}));

function deliveryFailureRoute(kind) {
  return {
    implementation_defect: "fixes",
    design_defect: "design",
    provider_transient: "delivery_verification",
    evidence_mismatch: "reconciliation",
    production_retry: "production_mutation_approval",
  }[kind];
}
assert.equal(deliveryFailureRoute("implementation_defect"), "fixes");
assert.equal(deliveryFailureRoute("design_defect"), "design");
assert.equal(deliveryFailureRoute("provider_transient"), "delivery_verification");
assert.equal(deliveryFailureRoute("evidence_mismatch"), "reconciliation");
assert.equal(deliveryFailureRoute("production_retry"), "production_mutation_approval");

for (const gateChange of [
  { reviewed_sha: shaB },
  { target_branch: "release" },
  { head_sha: shaB },
  { validation_run_id: 992 },
  { required_checks_passed: false },
  { pr_number: 18 },
]) {
  assert.throws(() => validateState({
    ...mergeGateState,
    gate_scope: { ...mergeGateState.gate_scope, ...gateChange },
  }));
}

assert.throws(() => resolveMergeCandidate(mergeGateState, {
  ...mergeCandidateObservation,
  headAncestors: [shaB],
}), /does not descend from reviewed SHA/);
assert.throws(() => resolveMergeCandidate(mergeGateState, {
  ...mergeCandidateObservation,
  remoteBranchHeadSha: shaB,
}), /canonical remote head differs from presented head/);
assert.throws(() => resolveMergeCandidate(mergeGateState, {
  ...mergeCandidateObservation,
  prHeadSha: shaB,
}), /live PR head differs from presented head/);
assert.throws(() => resolveMergeCandidate(mergeGateState, {
  ...mergeCandidateObservation,
  commitsAfterReviewed: [
    ...mergeCandidateObservation.commitsAfterReviewed.slice(0, 1),
    {
      sha: shaC,
      parentSha: shaB,
      changes: [{ path: "src/application.ts", status: "modified" }],
    },
  ],
}), /implementation\/application path requires review again/);
assert.throws(() => resolveMergeCandidate(mergeGateState, {
  ...mergeCandidateObservation,
  commitsAfterReviewed: [{
    sha: shaC,
    parentSha: shaA,
    changes: [{
      path: "docs/reviews/fixture/implementation-review-01-slice-a.md",
      status: "modified",
    }],
  }],
}), /new immutable review/);
const changedHeadObservation = {
  ...mergeCandidateObservation,
  headSha: shaB,
  remoteBranchHeadSha: shaB,
  prHeadSha: shaB,
  headAncestors: [shaA],
  commitsAfterReviewed: mergeCandidateObservation.commitsAfterReviewed.slice(0, 1),
  validationRunId: 992,
  validationHeadSha: shaB,
};
assert.throws(
  () => consumeMergeApproval(mergeGateState, mergePresentation, changedHeadObservation),
  /merge-gate evidence changed after approval/,
);

function validatePrimaryPrPolicy({ draft, target, primaryPrCount, routineDirectMainPush, routineAdditionalPr }) {
  assert.equal(draft, true);
  assert.equal(target, "main");
  assert.equal(primaryPrCount, 1);
  assert.equal(routineDirectMainPush, false);
  assert.equal(routineAdditionalPr, false);
}
validatePrimaryPrPolicy({
  draft: true,
  target: "main",
  primaryPrCount: 1,
  routineDirectMainPush: false,
  routineAdditionalPr: false,
});
assert.throws(() => validatePrimaryPrPolicy({
  draft: false,
  target: "main",
  primaryPrCount: 1,
  routineDirectMainPush: false,
  routineAdditionalPr: false,
}));

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
  assert.match(template, /^version: 3\.1$/m);
  assert.match(template, /^phase: work_item_init$/m);
  assert.match(template, /^  branch: work\//m);
  assert.match(template, /^  lifecycle_generation: <uuid>$/m);
  assert.match(template, /^  lifecycle_anchor_sha: null$/m);
  assert.match(template, /^  evidence_path: null$/m);
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
  ".codex/skills/delivery-verification/SKILL.md",
]) {
  const instructions = read(path);
  assert.doesNotMatch(instructions, /next\.phase:/);
  assert.doesNotMatch(instructions, /human_approval_required:/);
}

const orchestratorInstructions = read(".codex/skills/work-orchestrator/SKILL.md");
assert.match(orchestratorInstructions, /After every successful non-human phase, re-resolve the authoritative workflow/);
assert.match(orchestratorInstructions, /run the full preflight against that\nfresh state/);
assert.match(orchestratorInstructions, /dispatch that action immediately in the same invocation/);
assert.match(orchestratorInstructions, /fresh routing fingerprint—lifecycle identity/);
assert.match(orchestratorInstructions, /An unchanged fingerprint or an invalid or\nambiguous transition is unsafe continuation/);
assert.match(orchestratorInstructions, /explicit human gate, a risky\nexternal mutation requiring its typed approval, blocked input/);
assert.match(orchestratorInstructions, /Ordinary phase completion is not a stop\ncondition/);
assert.match(orchestratorInstructions, /Approval supplied for an earlier gate is never reused/);

const fakeEntry = (name, file) => ({ name, isFile: () => file });
assert.deepEqual(workflowPathsFromEntries([
  fakeEntry("z-new.yaml", true),
  fakeEntry("templates", false),
  fakeEntry("README.md", true),
  fakeEntry("a-existing.yaml", true),
]), [
  "docs/workflow/a-existing.yaml",
  "docs/workflow/z-new.yaml",
]);

const completeFixture = renderWorkflow({
  ...base,
  phase: "complete",
  status: "complete",
  context: ["retired/context.txt"],
  completed_slices: ["slice-a"],
  latest_review: { path: "docs/reviews/fixture.md" },
  next: { action: "none" },
});
const activeFixture = renderWorkflow({
  ...base,
  phase: "implementation",
  context: ["missing/active-context.txt"],
  next: { action: "implement-slice-a" },
});
const invalidActiveFixture = renderWorkflow({
  ...base,
  phase: "implementation",
  next: { action: "review-slice-a" },
});
const fixtureExists = (path) => path !== "retired/context.txt" && path !== "missing/active-context.txt";

assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/new-invalid.yaml"],
  () => invalidActiveFixture,
  () => true,
), /docs\/workflow\/new-invalid\.yaml:/);
assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/duplicate-a.yaml", "docs/workflow/duplicate-b.yaml"],
  () => completeFixture,
  () => true,
), /docs\/workflow\/duplicate-b\.yaml: duplicate workflow identity fixture/);
assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/active-missing-context.yaml"],
  () => activeFixture,
  fixtureExists,
), /docs\/workflow\/active-missing-context\.yaml: missing context artifact: missing\/active-context\.txt/);
assert.doesNotThrow(() => validateRepositoryWorkflows(
  ["docs/workflow/complete-retired-context.yaml"],
  () => completeFixture,
  fixtureExists,
));
assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/complete-missing-design.yaml"],
  () => completeFixture,
  (path) => path !== "docs/technical-designs/fixture.md",
), /docs\/workflow\/complete-missing-design\.yaml: missing authoritative design/);
assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/complete-missing-review.yaml"],
  () => completeFixture,
  (path) => path !== "docs/reviews/fixture.md",
), /docs\/workflow\/complete-missing-review\.yaml: missing latest review/);

const activeV2Fixture = `version: 2

work_item_id: active-v2
work_item_type: maintenance
title: "Active v2"

phase: implementation
status: ready
gate: none

design:
  path: docs/technical-designs/active-v2.md
  status: approved

context: []
completed_slices: []

current_slice:
  id: slice-a
  name: "Slice A"
  status: approved

latest_review:
  path: docs/reviews/active-v2.md
  verdict: APPROVED

blocking_findings: []

next:
  phase: implementation_review
  action: review-slice-a
  human_approval_required: false
`;
assert.throws(() => validateRepositoryWorkflows(
  ["docs/workflow/active-v2.yaml"],
  () => activeV2Fixture,
  () => true,
), /docs\/workflow\/active-v2\.yaml: unsupported active legacy v2 workflow/);

const discoveredWorkflowPaths = discoverWorkflowPaths();
assert.equal(discoveredWorkflowPaths.some((path) => path.includes("/templates/")), false);
assert.ok(discoveredWorkflowPaths.includes("docs/workflow/ci-workflow-contract-validation.yaml"));
assert.ok(discoveredWorkflowPaths.includes("docs/workflow/stage-01-lesson-02.yaml"));
const repositoryWorkflowIdentities = validateRepositoryWorkflows(
  discoveredWorkflowPaths,
  read,
  (path) => existsSync(new URL(path, root)),
);
assert.equal(repositoryWorkflowIdentities.get("ci-workflow-contract-validation"), "docs/workflow/ci-workflow-contract-validation.yaml");
assert.equal(repositoryWorkflowIdentities.get("stage-01-lesson-02"), "docs/workflow/stage-01-lesson-02.yaml");

console.log(`workflow-contract: ${legal.length + v31Legal.length} legal states, ${invalid.length} illegal states, ${validTransitions.length + 11} transitions, and ${discoveredWorkflowPaths.length} repository workflows verified`);
