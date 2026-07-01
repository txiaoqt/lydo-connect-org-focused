import { describe, expect, it } from "vitest";
import {
  shouldUseInstalledUserPwa,
  type InstalledUserPwaDecision,
} from "./useInstalledUserPwa";

const eligible: InstalledUserPwaDecision = {
  enabled: true,
  adminSurface: false,
  userRoute: true,
  compact: true,
  standalone: true,
  developmentPreview: false,
};

describe("shouldUseInstalledUserPwa", () => {
  it("enables the alternate UI for an eligible installed user route", () => {
    expect(shouldUseInstalledUserPwa(eligible)).toBe(true);
  });

  it.each([
    ["feature flag disabled", { enabled: false }],
    ["admin deployment", { adminSurface: true }],
    ["public or admin route", { userRoute: false }],
    ["ordinary mobile browser", { standalone: false }],
  ])("keeps the existing website UI when %s", (_label, change) => {
    expect(shouldUseInstalledUserPwa({ ...eligible, ...change })).toBe(false);
  });

  it("does not use viewport width to disable an installed PWA", () => {
    expect(shouldUseInstalledUserPwa({ ...eligible, compact: false })).toBe(true);
  });

  it("allows local development preview without standalone mode", () => {
    expect(
      shouldUseInstalledUserPwa({
        ...eligible,
        standalone: false,
        developmentPreview: true,
      }),
    ).toBe(true);
  });
});
