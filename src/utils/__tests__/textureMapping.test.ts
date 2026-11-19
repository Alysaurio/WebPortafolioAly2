import { describe, expect, it } from "vitest";
import { computeImageRect } from "../textureMapping";

describe("GIF framing", () => {
  it("crops a wide image for a square target while preserving aspect", () => {
    const rect = computeImageRect(362, 203, 512, 512, "cover");
    expect(rect.sw).toBeCloseTo(203, 5);
    expect(rect.sh).toBeCloseTo(203, 5);
    expect(rect.sx).toBeCloseTo(79.5, 5);
    expect(rect.sy).toBeCloseTo(0, 5);
    expect(rect.sw / rect.sh).toBeCloseTo(1, 5);
  });

  it("honors the focal point when cropping", () => {
    const left = computeImageRect(362, 203, 512, 512, "cover", [0, 0.5]);
    const right = computeImageRect(362, 203, 512, 512, "cover", [1, 0.5]);
    expect(left.sx).toBeCloseTo(0, 5);
    expect(right.sx).toBeCloseTo(159, 5);
  });

  it("letterboxes with contain", () => {
    const rect = computeImageRect(362, 203, 512, 512, "contain");
    expect(rect.dw).toBeCloseTo(512, 5);
    expect(rect.dh).toBeCloseTo(287.16, 1);
    expect(rect.dy).toBeCloseTo((512 - 287.16) / 2, 1);
    expect(rect.dx).toBeCloseTo(0, 5);
  });

  it("clamps focal points to the source", () => {
    const rect = computeImageRect(200, 512, 512, 512, "cover", [-2, 4]);
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(200);
    expect(rect.sy + rect.sh).toBeLessThanOrEqual(512);
  });
});
