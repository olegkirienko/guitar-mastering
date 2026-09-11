import { accountCapabilitiesEnabled, deploymentTarget } from "@/config/deployment";

document.body.dataset.deploymentTarget =
  deploymentTarget === "worker" ? "__GM_TARGET_WORKER__" : "__GM_TARGET_PAGES__";
document.body.dataset.accountCapabilities = accountCapabilitiesEnabled
  ? "__GM_CAPABILITIES_ENABLED__"
  : "__GM_CAPABILITIES_DISABLED__";
