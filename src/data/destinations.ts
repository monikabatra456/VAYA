// src/data/destinations.ts

export interface Destination {
  id: string;
  name: string;
  place: string;
  lat: number;
  lon: number;
  cat: string;
  tags: string[];
  best: string;
  description: string;
  img: string;
  locked: boolean;
}

export const HUB = {
  name: 'India Hub',
  lat: 22.5,
  lon: 79.0,
};

export const INDIA_POLYGON: [number, number][] = [
  [34.5, 74.0],
  [35.6, 77.0],
  [34.9, 79.0],
  [32.5, 79.4],
  [30.5, 81.0],
  [28.8, 80.2],
  [27.5, 88.1],
  [28.1, 89.5],
  [27.3, 92.0],
  [28.6, 96.1],
  [27.3, 97.3],
  [25.2, 95.2],
  [23.9, 93.4],
  [22.0, 92.5],
  [21.9, 89.0],
  [20.0, 86.9],
  [16.5, 82.3],
  [13.0, 80.4],
  [8.1, 77.5],
  [8.3, 76.8],
  [11.5, 75.5],
  [15.0, 74.0],
  [20.5, 72.7],
  [22.5, 69.0],
  [23.7, 68.2],
  [24.5, 71.0],
  [27.0, 70.0],
  [28.8, 70.4],
  [30.5, 74.5],
  [32.3, 74.7],
];

export const DESTINATIONS: Destination[] = [
  {
    id: 'taj',
    name: 'Taj Mahal',
    place: 'Agra, Uttar Pradesh',
    lat: 27.18,
    lon: 78.04,
    cat: 'Heritage',
    tags: ['Heritage'],
    best: 'Oct – Mar',
    description: "The ivory-white marble mausoleum on the Yamuna river, captured in real light.",
    img: '/wonder/cards/taj.webp',
    locked: false,
  },
  {
    id: 'hawa',
    name: 'Hawa Mahal',
    place: 'Jaipur, Rajasthan',
    lat: 26.92,
    lon: 75.82,
    cat: 'Heritage',
    tags: ['Heritage'],
    best: 'Oct – Mar',
    description: "The iconic pink honeycomb facade with 953 jharokhas catching morning breezes.",
    img: '/wonder/cards/hawa.webp',
    locked: false,
  },
  {
    id: 'kerala',
    name: 'Kerala Backwaters',
    place: 'Alappuzha, Kerala',
    lat: 9.49,
    lon: 76.33,
    cat: 'Beaches',
    tags: ['Beaches'],
    best: 'Sep – Mar',
    description: "Serene interconnected canals, palm-fringed lagoons, and slow houseboat journeys.",
    img: '/wonder/cards/kerala.webp',
    locked: false,
  },
  {
    id: 'goa',
    name: 'Goa Beaches',
    place: 'Goa',
    lat: 15.30,
    lon: 74.12,
    cat: 'Beaches',
    tags: ['Beaches'],
    best: 'Nov – Feb',
    description: "Golden sands, hidden coves, Portuguese heritage and calm Arabian Sea sunsets.",
    img: '/wonder/cards/goa.webp',
    locked: false,
  },
  {
    id: 'pangong',
    name: 'Pangong Lake',
    place: 'Ladakh',
    lat: 33.73,
    lon: 78.67,
    cat: 'Mountains',
    tags: ['Mountains', 'Adventure'],
    best: 'May – Sep',
    description: "High-altitude saline lake shifting between vivid azure, turquoise and deep blue.",
    img: '/wonder/cards/pangong.webp',
    locked: false,
  },
  {
    id: 'kashmir',
    name: 'Kashmir Valley',
    place: 'Jammu & Kashmir',
    lat: 34.08,
    lon: 74.80,
    cat: 'Mountains',
    tags: ['Mountains'],
    best: 'Apr – Oct',
    description: "Paradise on Earth: snow-capped Himalayan peaks, Dal Lake shikaras, and verdant meadows.",
    img: '/wonder/cards/kashmir.webp',
    locked: false,
  },
];
