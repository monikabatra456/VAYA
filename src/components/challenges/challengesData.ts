// src/components/challenges/challengesData.ts
// Data for "THE TRAVEL CHALLENGES" section (Page 2)

export interface ChallengeCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
  video: string;
  poster: string;
  position: {
    left: string;
    top: string;
    zDepth: number;
  };
  baseScale: number;
  baseOpacity: number;
}

export const CHALLENGES: ChallengeCard[] = [
  {
    id: "overcrowding",
    title: "Overcrowding",
    desc: "Popular spots can get too crowded, ruining your experience.",
    icon: "crowd",
    video: "/videos/challenges/overcrowding.webp",
    poster: "/videos/challenges/overcrowding.jpg",
    position: { left: "42cqi", top: "6cqi", zDepth: 1 },
    baseScale: 0.85,
    baseOpacity: 0.9,
  },
  {
    id: "local-guides",
    title: "Local guides",
    desc: "Finding authentic and trusted local guides is often difficult.",
    icon: "guide",
    video: "/videos/challenges/local-guides.mp4",
    poster: "/videos/challenges/local-guides.jpg",
    position: { left: "62cqi", top: "2cqi", zDepth: 1 },
    baseScale: 0.8,
    baseOpacity: 0.85,
  },
  {
    id: "prices",
    title: "Unreasonable prices",
    desc: "High prices, hidden costs and no transparency.",
    icon: "price",
    video: "/videos/challenges/budget.webp",
    poster: "/videos/challenges/prices.jpg",
    position: { left: "26cqi", top: "26cqi", zDepth: 1 },
    baseScale: 0.9,
    baseOpacity: 0.95,
  },
  {
    id: "changing-plans",
    title: "Changing plans",
    desc: "Unexpected weather, closures or schedule changes can spoil your trip.",
    icon: "weather",
    video: "/videos/challenges/VAYA_itinerary_demo.webp",
    poster: "/videos/challenges/changing-plans.jpg",
    position: { left: "57cqi", top: "20cqi", zDepth: 1 },
    baseScale: 1.0,
    baseOpacity: 1.0,
  },
  {
    id: "safety",
    title: "Safety concerns",
    desc: "Unfamiliar places, scams, health risks and emergencies can be risky.",
    icon: "safety",
    video: "/videos/challenges/safety.webp",
    poster: "/videos/challenges/safety.jpg",
    position: { left: "36cqi", top: "44cqi", zDepth: 1 },
    baseScale: 0.95,
    baseOpacity: 1.0,
  },
  {
    id: "planning",
    title: "Too much planning",
    desc: "It takes hours to research, compare and plan the perfect trip.",
    icon: "plan",
    video: "/videos/challenges/planning.webp",
    poster: "/videos/challenges/planning.jpg",
    position: { left: "60cqi", top: "42cqi", zDepth: 1 },
    baseScale: 0.85,
    baseOpacity: 0.9,
  },
];

export interface GhostCard {
  id: string;
  text: string;
  position: { left: string; top: string };
  baseScale: number;
  baseOpacity: number;
}

export const GHOST_CARDS: GhostCard[] = [
  {
    id: "ghost-0",
    text: "Long queues, no space, no peace.",
    position: { left: "-4cqi", top: "8cqi" },
    baseScale: 0.4,
    baseOpacity: 0.38,
  },
  {
    id: "ghost-1",
    text: "Hard to find genuine and reliable guides.",
    position: { left: "47cqi", top: "-14cqi" },
    baseScale: 0.5,
    baseOpacity: 0.38,
  },
  {
    id: "ghost-2",
    text: "Expensive, not worth it.",
    position: { left: "14cqi", top: "5cqi" },
    baseScale: 0.55,
    baseOpacity: 0.35,
  },
  {
    id: "ghost-3",
    text: "Weather, closures & unexpected changes.",
    position: { left: "72cqi", top: "5cqi" },
    baseScale: 0.5,
    baseOpacity: 0.35,
  },
  {
    id: "ghost-4",
    text: "Uncertain safety, natural disasters, local risks.",
    position: { left: "18cqi", top: "44cqi" },
    baseScale: 0.45,
    baseOpacity: 0.32,
  },
  {
    id: "ghost-5",
    text: "Missed local spots and real experiences.",
    position: { left: "70cqi", top: "50cqi" },
    baseScale: 0.5,
    baseOpacity: 0.35,
  },
  {
    id: "ghost-6",
    text: "Weather, closures and real experiences.",
    position: { left: "5cqi", top: "35cqi" },
    baseScale: 0.42,
    baseOpacity: 0.3,
  },
];

export const SIDE_NAV_ITEMS = [
  { label: "Home", roman: "I", id: "hero" },
  { label: "Challenges", roman: "II", id: "challenges" },
  { label: "About VAYA", roman: "III", id: "about-vaya" },
  { label: "Travel Network", roman: "IV", id: "traveller-network" },
  { label: "Blog", roman: "V", id: "blog" },
  { label: "Coming Soon", roman: "VI", id: "coming-soon" },
];
