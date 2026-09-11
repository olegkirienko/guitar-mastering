export type DeploymentTarget = "pages" | "worker";

export interface DeploymentConfig {
  target: DeploymentTarget;
  base: "/" | "/guitar-mastering/";
  accountCapabilitiesEnabled: boolean;
}

export function resolveDeploymentTarget(value: string | undefined): DeploymentTarget {
  return value === "worker" ? "worker" : "pages";
}

export function createDeploymentConfig(value: string | undefined): DeploymentConfig {
  const target = resolveDeploymentTarget(value);

  return {
    target,
    base: target === "worker" ? "/" : "/guitar-mastering/",
    accountCapabilitiesEnabled: target === "worker",
  };
}
