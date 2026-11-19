export type FaceKey = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

export type Vec3Tuple = readonly [number, number, number];

export interface FaceDefinition {
  key: FaceKey;
  normal: Vec3Tuple;
  right: Vec3Tuple;
  up: Vec3Tuple;
  label: string;
}

export const CAMERA_FORWARD: Vec3Tuple = [0, 0, 1];

export const FACES: Record<FaceKey, FaceDefinition> = {
  "+X": {
    key: "+X",
    normal: [1, 0, 0],
    right: [0, 0, -1],
    up: [0, 1, 0],
    label: "RIGHT FACE",
  },
  "-X": {
    key: "-X",
    normal: [-1, 0, 0],
    right: [0, 0, 1],
    up: [0, 1, 0],
    label: "LEFT FACE",
  },
  "+Y": {
    key: "+Y",
    normal: [0, 1, 0],
    right: [1, 0, 0],
    up: [0, 0, -1],
    label: "TOP FACE",
  },
  "-Y": {
    key: "-Y",
    normal: [0, -1, 0],
    right: [1, 0, 0],
    up: [0, 0, 1],
    label: "BOTTOM FACE",
  },
  "+Z": {
    key: "+Z",
    normal: [0, 0, 1],
    right: [1, 0, 0],
    up: [0, 1, 0],
    label: "FRONT FACE",
  },
  "-Z": {
    key: "-Z",
    normal: [0, 0, -1],
    right: [-1, 0, 0],
    up: [0, 1, 0],
    label: "BACK FACE",
  },
};

export const FACE_KEYS: FaceKey[] = ["+Z", "+X", "-Z", "-X", "+Y", "-Y"];
