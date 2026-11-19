import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import {
  angleToFace,
  getFaceAngles,
  getNearestFace,
  magneticResistance,
  resolveHysteresis,
  smoothstep,
  toRadians,
} from "../faceDetection";
import { getFaceQuaternion } from "../geometry";

const anglesFor = (face: Parameters<typeof getFaceQuaternion>[0]) =>
  getFaceAngles(getFaceQuaternion(face));

describe("face detection", () => {
  it("finds the front face at orientation identity", () => {
    const nearest = getNearestFace(new Quaternion());
    expect(nearest.face).toBe("+Z");
    expect(nearest.angle).toBeCloseTo(0, 5);
    expect(nearest.others).toHaveLength(5);
  });

  it("finds each face after applying its orientation", () => {
    for (const face of ["+X", "-X", "+Y", "-Y", "+Z", "-Z"] as const) {
      const quaternion = getFaceQuaternion(face);
      expect(getNearestFace(quaternion).face).toBe(face);
      expect(angleToFace(quaternion, face)).toBeCloseTo(0, 5);
    }
  });

  it("measures 90 degrees to adjacent faces", () => {
    const angles = anglesFor("+Z");
    const right = angles.find((entry) => entry.face === "+X");
    expect(right?.angle).toBeCloseTo(90, 5);
  });
});

describe("hysteresis", () => {
  const angles = anglesFor("+Z");

  it("locks a new face only under the enter threshold", () => {
    expect(resolveHysteresis(null, angles).face).toBe("+Z");
    expect(resolveHysteresis(null, angles).locked).toBe(true);
  });

  it("keeps the previous face inside the exit threshold", () => {
    const tilted = getFaceAngles(
      getFaceQuaternion("+Z").multiply(
        new Quaternion().setFromAxisAngle(
          new Vector3(1, 0, 0),
          toRadians(15),
        ),
      ),
    );
    const result = resolveHysteresis("+Z", tilted);
    expect(result.face).toBe("+Z");
    expect(result.locked).toBe(false);
  });

  it("switches when the previous face leaves the exit threshold", () => {
    const tilted = getFaceAngles(
      getFaceQuaternion("+Z").multiply(
        new Quaternion().setFromAxisAngle(
          new Vector3(1, 0, 0),
          toRadians(20),
        ),
      ),
    );
    const result = resolveHysteresis("+Z", tilted);
    expect(result.face).not.toBe("+Z");
  });

  it("reports no face beyond the enter threshold", () => {
    const half = getFaceAngles(
      new Quaternion().setFromAxisAngle(
        new Vector3(1, 0, 0),
        toRadians(45),
      ),
    );
    const result = resolveHysteresis(null, half);
    expect(result.face).toBeNull();
  });
});

describe("magnetic resistance", () => {
  it("is full strength away from the target", () => {
    expect(magneticResistance(25)).toBe(1);
    expect(magneticResistance(40)).toBe(1);
  });

  it("reduces resistance toward the snap target", () => {
    expect(magneticResistance(10)).toBeCloseTo(0.58, 5);
    expect(magneticResistance(0)).toBeCloseTo(0.58, 5);
    expect(magneticResistance(17.5)).toBeGreaterThan(0.58);
    expect(magneticResistance(17.5)).toBeLessThan(1);
  });

  it("uses a clamped smoothstep", () => {
    expect(smoothstep(10, 20, 5)).toBe(0);
    expect(smoothstep(10, 20, 20)).toBe(1);
    expect(smoothstep(10, 20, 15)).toBeCloseTo(0.5, 5);
  });
});
