import { Quaternion, Vector3 } from "three";
import {
  CAMERA_FORWARD,
  FACE_KEYS,
  FACES,
  type FaceKey,
} from "../data/faces";

export interface FaceAngle {
  face: FaceKey;
  index: number;
  angle: number;
  dot: number;
  normal: Vector3;
}

export interface NearestFace extends FaceAngle {
  others: FaceAngle[];
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export const getFaceAngles = (
  quaternion: Quaternion,
  cameraDirection: Vector3 = new Vector3(...CAMERA_FORWARD),
): FaceAngle[] => {
  const direction = cameraDirection.clone().normalize();
  return FACE_KEYS.map((face, index) => {
    const normal = new Vector3(...FACES[face].normal).applyQuaternion(
      quaternion,
    );
    const dot = clamp(normal.dot(direction), -1, 1);
    return {
      face,
      index,
      angle: toDegrees(Math.acos(dot)),
      dot,
      normal,
    };
  });
};

export const getNearestFace = (
  quaternion: Quaternion,
  cameraDirection: Vector3 = new Vector3(...CAMERA_FORWARD),
): NearestFace => {
  const angles = getFaceAngles(quaternion, cameraDirection);
  const sorted = [...angles].sort((a, b) => a.angle - b.angle);
  return { ...sorted[0], others: sorted.slice(1) };
};

export const angleToFace = (
  quaternion: Quaternion,
  face: FaceKey,
  cameraDirection: Vector3 = new Vector3(...CAMERA_FORWARD),
): number => {
  const normal = new Vector3(...FACES[face].normal).applyQuaternion(quaternion);
  return toDegrees(Math.acos(clamp(normal.dot(cameraDirection), -1, 1)));
};

export interface HysteresisResult {
  face: FaceKey | null;
  angle: number;
  nearest: FaceKey;
  nearestAngle: number;
  locked: boolean;
}

export const resolveHysteresis = (
  previous: FaceKey | null,
  angles: FaceAngle[],
  enterThreshold = 10,
  exitThreshold = 17,
): HysteresisResult => {
  const sorted = [...angles].sort((a, b) => a.angle - b.angle);
  const nearest = sorted[0];
  if (previous) {
    const previousAngle = angles.find((entry) => entry.face === previous);
    if (previousAngle && previousAngle.angle <= exitThreshold) {
      return {
        face: previous,
        angle: previousAngle.angle,
        nearest: nearest.face,
        nearestAngle: nearest.angle,
        locked: previousAngle.angle <= enterThreshold,
      };
    }
  }
  return {
    face: nearest.angle <= enterThreshold ? nearest.face : null,
    angle: nearest.angle,
    nearest: nearest.face,
    nearestAngle: nearest.angle,
    locked: nearest.angle <= enterThreshold,
  };
};

export const magneticResistance = (
  angle: number,
  start = 25,
  end = 10,
  minimum = 0.58,
): number => {
  if (angle >= start) return 1;
  const t = smoothstep(end, start, angle);
  return minimum + (1 - minimum) * t;
};
