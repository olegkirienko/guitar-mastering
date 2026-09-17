import { accountCapabilitiesEnabled, deploymentTarget } from "@/config/deployment";

document.body.dataset.deploymentTarget =
  deploymentTarget === "railway" ? "__GM_TARGET_RAILWAY__" : "__GM_TARGET_PAGES__";
document.body.dataset.accountCapabilities = accountCapabilitiesEnabled
  ? "__GM_CAPABILITIES_ENABLED__"
  : "__GM_CAPABILITIES_DISABLED__";
