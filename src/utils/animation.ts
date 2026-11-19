export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number) => t * t * t;

export const damp = (
  current: number,
  target: number,
  smoothing: number,
  dt: number,
) => lerp(current, target, 1 - Math.exp(-smoothing * dt));

export const dampVector = (
  current: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  smoothing: number,
  dt: number,
) => {
  const t = 1 - Math.exp(-smoothing * dt);
  current.x = lerp(current.x, target.x, t);
  current.y = lerp(current.y, target.y, t);
  current.z = lerp(current.z, target.z, t);
};

export const shortestAngle = (angle: number) => {
  let value = angle % (Math.PI * 2);
  if (value > Math.PI) value -= Math.PI * 2;
  if (value < -Math.PI) value += Math.PI * 2;
  return value;
};
