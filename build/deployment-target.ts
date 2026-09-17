export type DeploymentTarget = "pages" | "railway";

export interface DeploymentConfig {
  target: DeploymentTarget;
  base: "/" | "/guitar-mastering/";
  accountCapabilitiesEnabled: boolean;
}

export function resolveDeploymentTarget(value: string | undefined): DeploymentTarget {
  return value === "railway" ? "railway" : "pages";
}

export function createDeploymentConfig(value: string | undefined): DeploymentConfig {
  const target = resolveDeploymentTarget(value);

  return {
    target,
    base: target === "railway" ? "/" : "/guitar-mastering/",
    accountCapabilitiesEnabled: target === "railway",
  };
}
