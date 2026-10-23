// src/app/heroConfig.js
// ─── All tunable constants for Section 1: Hero ────────────────────────────────
// Real photo-cloud layers from /public/hero/real/

export const HERO_CONFIG = {
  // ── Camera Dive & Layer Scales at Swap (p = 0.58) ──────────────────────────
  // Scale formula: scale = 1 + (target - 1) * diveEase(p / SWAP_END)
  LAYER_SCALE_AT_SWAP: {
    base: 1.20,
    far:  1.30,
    mid:  1.50,
    near: 1.95, // If double-image ghosting appears on cloud edges, lower to 1.70
  },

  // ── Scene Swap A → B ───────────────────────────────────────────────────────
  SWAP_START: 0.44,
  SWAP_END:   0.58,
  CLOUDS_FADE_START: 0.46,
  CLOUDS_FADE_END:   0.62,
  SCENE_B_SCALE_END: 1.45,

  // ── Plane & Cloud Veiling Window ───────────────────────────────────────────
  // Plane starts at x: 46vw, y: 74vh
  PLANE_START: { xVw: 0.46, yVh: 0.74 },
  PLANE_WIDTH_DESKTOP: 30, // 30vw
  PLANE_WIDTH_MOBILE:  56, // 56vw
  PLANE_END_SCALE:     0.10,
  PLANE_PITCH_DEG:     -2,
  PLANE_SCROLL_END:    0.62,
  PLANE_CLOUD_WINDOW: {
    rampStart: 0.16,
    rampEnd:   0.30,
    holdEnd:   0.38,
    easeEnd:   0.50,
    peakOpacity: 0.90,
    easedOpacity: 0.60,
  },

  // ── Camera Drift & Tilt ────────────────────────────────────────────────────
  CAMERA_TILT_VH:   1.5, // base translateY 0 -> 1.5vh over plane rise
  CAMERA_SWAY_VW:   0.4, // idle slow sine sway +-0.4vw (40s period)

  // ── Layer Drift as they pass camera ────────────────────────────────────────
  DRIFT: {
    midX:   -1.5, // vw
    midY:    1.5, // vh
    nearX:   3.0, // vw
    nearY:  -3.0, // vh
  },

  // ── Text reveal (Columbus layout) ──────────────────────────────────────────
  TEXT_START:       0.62,   // progress at which VAYA begins to appear
  TEXT_REVEAL_SPAN: 0.14,
  VAYA_ALIGN:       'left',
  SCRIM_MAX_OPACITY: 0.25,

  // ── Scroll / Damping ───────────────────────────────────────────────────────
  DAMPING:              0.07,   // lerp factor
  SCROLL_LENGTH:        900,    // desktop: total pinned scroll (vh)
  SCROLL_LENGTH_MOBILE: 650,    // mobile (<768 px)
  DPR_CAP:              1.5,

  // ── Vanishing point ────────────────────────────────────────────────────────
  VP_X: 0.50,
  VP_Y: 0.58,
  VP_MOBILE_X: 0.50,
  VP_MOBILE_Y: 0.58,
};
