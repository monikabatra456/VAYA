// src/components/section2/data/problems.ts
export type IconId = "crowd" | "guide" | "price" | "weather" | "safety" | "plan";

export interface Problem {
  id: string;
  title: string;
  description: string;
  icon: IconId;
  helpText: string;
  videoSrc: string;
}

export interface ProblemMedia {
  mp4?: string;
  webm?: string;
  mov?: string;
  webp?: string;
  poster: string;
  cropPhone?: boolean; // If true and using opaque video, crop tightly to phone body
}

export const PROBLEM_MEDIA_MAP: Record<string, ProblemMedia> = {
  overcrowding: {
    mp4: "/videos/overcrowding.mp4",
    webm: "/videos/challenges/overcrowding.webm",
    mov: "/videos/challenges/overcrowding.mov",
    webp: "/assets/challenges/overcrowding.webp",
    poster: "/assets/challenges/overcrowding-poster.png",
    cropPhone: true,
  },
  "local-guides": {
    mp4: "/videos/local-guide.mp4",
    webm: "/videos/local-guide.webm",
    webp: "/assets/challenges/local-guides.webp",
    poster: "/assets/challenges/local-guides-poster.png",
    cropPhone: false,
  },
  "changing-plans": {
    webp: "/assets/challenges/changing-plans.webp",
    poster: "/assets/challenges/changing-plans-poster.png",
  },
  prices: {
    webp: "/assets/challenges/unreasonable-prices.webp",
    poster: "/assets/challenges/unreasonable-prices-poster.png",
  },
  safety: {
    webp: "/assets/challenges/safety-concerns.webp",
    poster: "/assets/challenges/safety-concerns-poster.png",
  },
  planning: {
    webp: "/assets/challenges/too-much-planning.webp",
    poster: "/assets/challenges/too-much-planning-poster.png",
  },
};

export const PROBLEM_WEBP_MAP: Record<string, string> = {
  overcrowding: "/assets/challenges/overcrowding.webp",
  "local-guides": "/assets/challenges/local-guides.webp",
  localGuides: "/assets/challenges/local-guides.webp",
  "changing-plans": "/assets/challenges/changing-plans.webp",
  changingPlans: "/assets/challenges/changing-plans.webp",
  prices: "/assets/challenges/unreasonable-prices.webp",
  unreasonablePrices: "/assets/challenges/unreasonable-prices.webp",
  safety: "/assets/challenges/safety-concerns.webp",
  safetyConcerns: "/assets/challenges/safety-concerns.webp",
  planning: "/assets/challenges/too-much-planning.webp",
  tooMuchPlanning: "/assets/challenges/too-much-planning.webp",
};

export const PROBLEMS: Problem[] = [
  {
    id: "overcrowding",
    title: "Overcrowding",
    description: "Popular spots can get too crowded, ruining your experience.",
    icon: "crowd",
    helpText: "VAYA provides real-time crowd levels so you plan visits when it's actually enjoyable.",
    videoSrc: PROBLEM_WEBP_MAP["overcrowding"],
  },
  {
    id: "local-guides",
    title: "Local guides",
    description: "Finding authentic and trusted local guides is often difficult.",
    icon: "guide",
    helpText: "VAYA helps you discover verified local experts with aggregated reviews.",
    videoSrc: PROBLEM_WEBP_MAP["local-guides"],
  },
  {
    id: "changing-plans",
    title: "Changing plans",
    description: "Unexpected weather, closures or schedule changes can spoil your trip.",
    icon: "weather",
    helpText: "VAYA monitors real-time conditions and suggests smart alternatives.",
    videoSrc: PROBLEM_WEBP_MAP["changing-plans"],
  },
  {
    id: "prices",
    title: "Unreasonable prices",
    description: "High prices, hidden costs and no transparency.",
    icon: "price",
    helpText: "VAYA shows estimated price ranges from multiple platforms — full transparency before you book.",
    videoSrc: PROBLEM_WEBP_MAP["prices"],
  },
  {
    id: "safety",
    title: "Safety concerns",
    description: "Unfamiliar places, scams, health risks and emergencies can be risky.",
    icon: "safety",
    helpText: "VAYA aggregates safety advisories from trusted sources to keep you informed.",
    videoSrc: PROBLEM_WEBP_MAP["safety"],
  },
  {
    id: "planning",
    title: "Too much planning",
    description: "It takes hours to research, compare and plan the perfect trip.",
    icon: "plan",
    helpText: "VAYA consolidates all research into one smart dashboard, cutting planning time dramatically.",
    videoSrc: PROBLEM_WEBP_MAP["planning"],
  },
];

export const DEFAULT_ACTIVE_ID = "overcrowding";

export const PROBLEM_SEQUENCE = [
  "overcrowding",
  "local-guides",
  "changing-plans",
  "prices",
  "safety",
  "planning",
];

// ── Card canvas layout ────────────────────────────────────────────────────────
// 3 depth layers: 0=far (blur 8-10px, opacity ~0.3), 1=mid (blur 4-6px, opacity ~0.45), 2=near (blur 3-4px, opacity ~0.55)
export interface CardLayout {
  leftPct: number;
  topPct:  number;
  layer:   0 | 1 | 2; // 0=far, 1=mid, 2=near
}

export const CARD_LAYOUT: Record<string, CardLayout> = {
  overcrowding:     { leftPct: 2,  topPct: 4,  layer: 1 },
  "local-guides":   { leftPct: 56, topPct: 12, layer: 0 },
  "changing-plans": { leftPct: 2,  topPct: 37, layer: 1 },
  prices:           { leftPct: 56, topPct: 45, layer: 2 },
  safety:           { leftPct: 2,  topPct: 70, layer: 1 },
  planning:         { leftPct: 56, topPct: 78, layer: 0 },
};

export const LAYER_CONFIG = {
  0: { scale: 0.94, blur: 1.8, opacity: 0.55, zIndex: 6  },  // far  — barely blurred, quite visible
  1: { scale: 0.97, blur: 1.0, opacity: 0.68, zIndex: 12 },  // mid  — very mild
  2: { scale: 0.99, blur: 0.0, opacity: 0.80, zIndex: 18 },  // near — nearly sharp
} as const;

export const FLOAT_CONFIG = [
  { durX: 7.2, durY: 8.5, xAmp: 2.5, yAmp: 4.5, phaseX: 0.0, phaseY: 0.3 },
  { durX: 8.8, durY: 7.8, xAmp: 3.0, yAmp: 4.5, phaseX: 1.2, phaseY: 2.0 },
  { durX: 6.8, durY: 9.0, xAmp: 2.0, yAmp: 5.0, phaseX: 2.5, phaseY: 0.8 },
  { durX: 9.5, durY: 7.2, xAmp: 3.5, yAmp: 4.8, phaseX: 0.8, phaseY: 1.5 },
  { durX: 7.5, durY: 8.8, xAmp: 2.5, yAmp: 5.0, phaseX: 1.8, phaseY: 3.2 },
  { durX: 8.5, durY: 7.5, xAmp: 3.0, yAmp: 4.5, phaseX: 3.0, phaseY: 0.5 },
];

// Unified 1000×1000 coordinate space for flight path & card nodes
export const SVG_W = 1000;
export const SVG_H = 1000;

export const CARD_ANCHORS: Record<string, { x: number; y: number }> = {
  overcrowding:     { x: 240, y: 140 },
  "local-guides":   { x: 740, y: 180 },
  "changing-plans": { x: 240, y: 480 },
  prices:           { x: 740, y: 520 },
  safety:           { x: 240, y: 800 },
  planning:         { x: 740, y: 840 },
};

export const CARD_CENTERS = CARD_ANCHORS;

// Continuous smooth serpentine S-curve passing through all 6 card centers
export function buildFlightPath(): string {
  return [
    "M 240,140",
    "C 410,120 570,140 740,180",
    "C 870,290 110,360 240,480",
    "C 410,480 570,500 740,520",
    "C 870,630 110,700 240,800",
    "C 410,790 570,810 740,840",
  ].join(" ");
}

export const FLIGHT_PATH_D = buildFlightPath();

// Exact normalized progress offsets along the smooth S-curve for each card
export const PATH_OFFSETS: Record<string, number> = {
  overcrowding:     0.0,
  "local-guides":   0.1783,
  "changing-plans": 0.4135,
  prices:           0.5911,
  safety:           0.8222,
  planning:         1.0,
};
