import type { ImageFit } from "../data/projects";

export interface ImageDrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const computeImageRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: ImageFit = "cover",
  focalPoint: [number, number] = [0.5, 0.5],
): ImageDrawRect => {
  const focusX = clamp01(focalPoint[0]);
  const focusY = clamp01(focalPoint[1]);
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (fit === "contain") {
    let dw = targetWidth;
    let dh = targetHeight;
    if (sourceAspect > targetAspect) {
      dh = targetWidth / sourceAspect;
    } else {
      dw = targetHeight * sourceAspect;
    }
    return {
      sx: 0,
      sy: 0,
      sw: sourceWidth,
      sh: sourceHeight,
      dx: (targetWidth - dw) * 0.5,
      dy: (targetHeight - dh) * 0.5,
      dw,
      dh,
    };
  }

  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceAspect > targetAspect) {
    sw = sourceHeight * targetAspect;
  } else {
    sh = sourceWidth / targetAspect;
  }
  const sx = (sourceWidth - sw) * focusX;
  const sy = (sourceHeight - sh) * focusY;
  return {
    sx,
    sy,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: targetWidth,
    dh: targetHeight,
  };
};
