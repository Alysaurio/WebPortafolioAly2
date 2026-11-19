import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import {
  FACE_KEYS,
  FACES,
  type FaceKey,
} from "../../data/faces";
import {
  FACE_HALF_EXTENT,
  MODULES,
  PANEL_SIZE,
  getAssembledFacePanels,
  getFaceQuaternion,
  getPanelUvRect,
  moduleFaceKeys,
} from "../geometry";

const forward = new Vector3(0, 0, 1);

describe("face orientations", () => {
  it("turns every face toward the camera without mirroring", () => {
    for (const face of FACE_KEYS) {
      const quaternion = getFaceQuaternion(face);
      const definition = FACES[face];
      const normal = new Vector3(...definition.normal).applyQuaternion(
        quaternion,
      );
      const right = new Vector3(...definition.right).applyQuaternion(
        quaternion,
      );
      const up = new Vector3(...definition.up).applyQuaternion(quaternion);
      expect(normal.dot(forward)).toBeCloseTo(1, 5);
      expect(right.x).toBeCloseTo(1, 5);
      expect(up.y).toBeCloseTo(1, 5);
    }
  });

  it("keeps all six project orientations distinct", () => {
    const values = FACE_KEYS.map((face) =>
      getFaceQuaternion(face).toArray().map((value) => value.toFixed(4)),
    );
    expect(new Set(values.map((value) => value.join(","))).size).toBe(6);
  });
});

describe("panel geometry", () => {
  it("builds four panels per face and 24 panels total", () => {
    const panels = getAssembledFacePanels();
    expect(panels).toHaveLength(24);
    for (const face of FACE_KEYS) {
      expect(panels.filter((panel) => panel.face === face)).toHaveLength(4);
    }
  });

  it("maps each panel to a unique quadrant without covering the whole face", () => {
    for (const face of FACE_KEYS) {
      const rects = MODULES.filter((module) => {
        const axis = face.endsWith("X") ? 0 : face.endsWith("Y") ? 1 : 2;
        return module.signs[axis] === (face.startsWith("+") ? 1 : -1);
      }).map((module) => getPanelUvRect(face, module.signs));
      const centers = new Set(
        rects.map(
          (rect) =>
            `${(rect.uMin + rect.uMax).toFixed(3)}:${(
              rect.vMin + rect.vMax
            ).toFixed(3)}`,
        ),
      );
      expect(centers.size).toBe(4);
      for (const rect of rects) {
        expect(rect.uMin).toBeGreaterThanOrEqual(-1e-9);
        expect(rect.uMax).toBeLessThanOrEqual(1 + 1e-9);
        expect(rect.vMin).toBeGreaterThanOrEqual(-1e-9);
        expect(rect.vMax).toBeLessThanOrEqual(1 + 1e-9);
        expect(rect.uMax - rect.uMin).toBeCloseTo(
          PANEL_SIZE / (FACE_HALF_EXTENT * 2),
          5,
        );
      }
    }
  });

  it("exposes the correct face keys for each module", () => {
    for (const module of MODULES) {
      const faces: FaceKey[] = moduleFaceKeys(module.signs);
      expect(faces).toHaveLength(3);
      for (const face of faces) {
        const axis = face.endsWith("X") ? 0 : face.endsWith("Y") ? 1 : 2;
        expect(Math.sign(module.signs[axis])).toBe(
          face.startsWith("+") ? 1 : -1,
        );
      }
    }
  });

  it("rejects a module that does not own the requested face", () => {
    const positiveModule = MODULES.find((module) => module.key === "ppp");
    expect(positiveModule).toBeDefined();
    expect(() =>
      getPanelUvRect("-Z", positiveModule!.signs),
    ).toThrowError();
  });
});

describe("quotient sanity", () => {
  it("produces unit quaternions", () => {
    for (const face of FACE_KEYS) {
      const quaternion = new Quaternion().copy(getFaceQuaternion(face));
      expect(quaternion.length()).toBeCloseTo(1, 6);
    }
  });
});
