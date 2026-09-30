export interface RetryGuardDeployment {
  id: string;
  status: string;
  createdAt: string;
  commitHash?: string;
}

export interface RetryGuardInput {
  mode: "pre" | "post";
  sha: string;
  mainSha: string;
  deployments: RetryGuardDeployment[];
  retryDeploymentId?: string;
}

export interface RetryGuardDecision {
  clear: boolean;
  kind: "clear" | "temporary" | "permanent";
  reason: string;
}

export function retryGuardDecision(input: RetryGuardInput): RetryGuardDecision;

export function parseUsage(
  argv: string[],
): { mode: "pre" | "post"; sha: string; retryDeploymentId?: string } | undefined;
