import { describe, expect, it } from "vitest";
import { createDeploymentConfig, resolveDeploymentTarget } from "./deployment-target";

describe("deployment target", () => {
  it.each([undefined, "", "pages", "invalid"])(
    "fails closed to the Pages-safe target for %s",
    (value) => {
      expect(resolveDeploymentTarget(value)).toBe("pages");
    },
  );

  it("keeps the GitHub Pages base and disables account capabilities", () => {
    expect(createDeploymentConfig("pages")).toEqual({
      target: "pages",
      base: "/guitar-mastering/",
      accountCapabilitiesEnabled: false,
    });
  });

  it("uses a root base and enables account capabilities for Worker previews", () => {
    expect(createDeploymentConfig("worker")).toEqual({
      target: "worker",
      base: "/",
      accountCapabilitiesEnabled: true,
    });
  });
});
