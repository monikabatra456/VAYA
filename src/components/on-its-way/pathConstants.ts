// src/components/on-its-way/pathConstants.ts
// Mathematical coordinates and path curves matching the 1707 x 921 visual reference.

export const VIEWBOX_WIDTH = 1707;
export const VIEWBOX_HEIGHT = 921;
export const VIEWBOX = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

/**
 * Gold dashed flight path coming in from the left edge, sagging gently,
 * making ONE loop-the-loop (around x~410, y~445), sweeping right and rising to the airplane tail (~x 905, y 503).
 */
export const FLIGHT_PATH_D =
  'M -20 428 C 80 418, 200 440, 300 495 C 380 530, 440 480, 452 445 C 462 405, 385 395, 372 440 C 360 480, 410 520, 520 540 C 640 556, 800 530, 905 503';

/**
 * Hand-drawn swoosh underline running under "Way"
 */
export const SWOOSH_PATH_D =
  'M 4 6 C 45 14, 115 22, 155 19 C 168 18, 175 12, 177 5';

/**
 * Rest state of the airplane
 * Rest rotation = +6deg (net nose-up about 8-9deg with the ~15deg built into the image)
 */
export const RESTING_PLANE = {
  x: 905,
  y: 503,
  rotation: 6,
};

/**
 * Tail anchor percentage inside the airplane image
 * Fuselage tail is at ~3.0% from left, ~78.0% from top.
 */
export const PLANE_ANCHOR = {
  xPct: 3.0,
  yPct: 78.0,
};

/**
 * Engine coordinates for contrail streaks
 */
export const ENGINES = {
  engine1: { xPct: 58.0, yPct: 48.0 },
  engine2: { xPct: 73.0, yPct: 62.0 },
};

/**
 * Design color tokens sampled from reference
 */
export const COLORS = {
  navy: '#14264A',
  gold: '#C98A3A',
  cream: '#FBF1E3',
  slate: '#6B7280',
  taupe: '#BBA89E',
} as const;
