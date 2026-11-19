import { PROJECTS } from "./projects";
import type { FaceKey } from "./faces";
import { getFaceQuaternion } from "../utils/geometry";

export interface Orientation {
  projectId: string;
  face: FaceKey;
  quaternion: ReturnType<typeof getFaceQuaternion>;
}

export const ORIENTATIONS: Orientation[] = PROJECTS.map((project) => ({
  projectId: project.id,
  face: project.face,
  quaternion: getFaceQuaternion(project.face),
}));

export const orientationByFace = (face: FaceKey) =>
  ORIENTATIONS.find((orientation) => orientation.face === face);
