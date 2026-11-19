import {
  BufferAttribute,
  BufferGeometry,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import { FACES, type FaceKey } from "../data/faces";

export const MODULE_SIZE = 1;
export const MODULE_GAP = 0.03;
export const MODULE_CENTER = (MODULE_SIZE + MODULE_GAP) * 0.5;
export const BODY_SIZE = 0.985;
export const BEVEL_RADIUS = 0.034;
export const PANEL_SIZE = 0.985;
export const PANEL_DISTANCE = 0.5025;
export const FRAME_DISTANCE = 0.496;
export const GLASS_DISTANCE = 0.506;
export const FRAME_SIZE = 0.998;
export const FACE_HALF_EXTENT = MODULE_CENTER + PANEL_SIZE * 0.5;
export const FREE_SEPARATION = 0.065;
export const PREVIEW_SEPARATION = 0.012;
export const SNAP_ENTER = 10;
export const SNAP_EXIT = 17;
export const PREVIEW_ENTER = 25;

export interface ModuleDefinition {
  key: string;
  signs: readonly [number, number, number];
  base: readonly [number, number, number];
  direction: readonly [number, number, number];
  phase: number;
}

const signsList: Array<readonly [number, number, number]> = [];
for (const sx of [-1, 1]) {
  for (const sy of [-1, 1]) {
    for (const sz of [-1, 1]) {
      signsList.push([sx, sy, sz]);
    }
  }
}

export const MODULES: ModuleDefinition[] = signsList.map((signs, index) => {
  const base = signs.map((sign) => sign * MODULE_CENTER) as [
    number,
    number,
    number,
  ];
  const length = Math.sqrt(3);
  const direction = signs.map((sign) => sign / length) as [
    number,
    number,
    number,
  ];
  return {
    key: signs.map((sign) => (sign > 0 ? "p" : "n")).join(""),
    signs,
    base,
    direction,
    phase: index * 1.732,
  };
});

export const faceForAxis = (axis: 0 | 1 | 2, sign: number): FaceKey => {
  const suffix = sign > 0 ? "+" : "-";
  if (axis === 0) return `${suffix}X` as FaceKey;
  if (axis === 1) return `${suffix}Y` as FaceKey;
  return `${suffix}Z` as FaceKey;
};

export const moduleFaceKeys = (
  signs: readonly [number, number, number],
): FaceKey[] => [
  faceForAxis(0, signs[0]),
  faceForAxis(1, signs[1]),
  faceForAxis(2, signs[2]),
];

export const faceAxis = (face: FaceKey): 0 | 1 | 2 =>
  face.endsWith("X") ? 0 : face.endsWith("Y") ? 1 : 2;

export const faceSign = (face: FaceKey): number =>
  face.startsWith("+") ? 1 : -1;

export const getFaceQuaternion = (face: FaceKey): Quaternion => {
  const definition = FACES[face];
  const right = new Vector3(...definition.right);
  const up = new Vector3(...definition.up);
  const normal = new Vector3(...definition.normal);
  const matrix = new Matrix4()
    .makeBasis(right, up, normal)
    .transpose();
  return new Quaternion().setFromRotationMatrix(matrix);
};

export interface PanelGeometryData {
  face: FaceKey;
  moduleKey: string;
  positions: Float32Array;
  uvs: Float32Array;
  normals: Float32Array;
  indices: number[];
}

export interface PanelUvRect {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

export const getPanelUvRect = (
  face: FaceKey,
  signs: readonly [number, number, number],
): PanelUvRect => {
  const axis = faceAxis(face);
  const sign = faceSign(face);
  if (signs[axis] !== sign) {
    throw new Error(`Module does not expose face ${face}`);
  }
  const definition = FACES[face];
  const right = new Vector3(...definition.right);
  const up = new Vector3(...definition.up);
  const center = new Vector3(
    signs[0] * MODULE_CENTER,
    signs[1] * MODULE_CENTER,
    signs[2] * MODULE_CENTER,
  );
  const uCenter = 0.5 + center.dot(right) / (FACE_HALF_EXTENT * 2);
  const vCenter = 0.5 + center.dot(up) / (FACE_HALF_EXTENT * 2);
  const half = PANEL_SIZE / (FACE_HALF_EXTENT * 4);
  return {
    uMin: uCenter - half,
    uMax: uCenter + half,
    vMin: vCenter - half,
    vMax: vCenter + half,
  };
};

export const getPanelGeometryData = (
  face: FaceKey,
  module: ModuleDefinition,
): PanelGeometryData => {
  const definition = FACES[face];
  const right = new Vector3(...definition.right);
  const up = new Vector3(...definition.up);
  const normal = new Vector3(...definition.normal);
  const rect = getPanelUvRect(face, module.signs);
  const half = PANEL_SIZE * 0.5;
  const cornerSigns: Array<[number, number, number, number]> = [
    [-1, -1, rect.uMin, rect.vMin],
    [1, -1, rect.uMax, rect.vMin],
    [1, 1, rect.uMax, rect.vMax],
    [-1, 1, rect.uMin, rect.vMax],
  ];
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  for (const [uSign, vSign, u, v] of cornerSigns) {
    const point = normal
      .clone()
      .multiplyScalar(PANEL_DISTANCE)
      .addScaledVector(right, uSign * half)
      .addScaledVector(up, vSign * half);
    positions.push(point.x, point.y, point.z);
    uvs.push(u, v);
    normals.push(normal.x, normal.y, normal.z);
  }
  return {
    face,
    moduleKey: module.key,
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    normals: new Float32Array(normals),
    indices: [0, 1, 2, 0, 2, 3],
  };
};

export const createPanelGeometry = (
  face: FaceKey,
  module: ModuleDefinition,
): BufferGeometry => {
  const data = getPanelGeometryData(face, module);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
  geometry.setAttribute("uv", new BufferAttribute(data.uvs, 2));
  geometry.setAttribute("normal", new BufferAttribute(data.normals, 3));
  geometry.setIndex(data.indices);
  return geometry;
};

export const getFaceNormal = (face: FaceKey): Vector3 =>
  new Vector3(...FACES[face].normal);

export const getFaceRight = (face: FaceKey): Vector3 =>
  new Vector3(...FACES[face].right);

export const getFaceUp = (face: FaceKey): Vector3 =>
  new Vector3(...FACES[face].up);

export const getAssembledFacePanels = () =>
  MODULES.flatMap((module) =>
    moduleFaceKeys(module.signs).map((face) => ({
      face,
      module,
      data: getPanelGeometryData(face, module),
    })),
  );
