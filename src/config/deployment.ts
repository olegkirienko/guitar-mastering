export const deploymentTarget = import.meta.env.VITE_DEPLOY_TARGET;

export const accountCapabilitiesEnabled = deploymentTarget === "worker";
