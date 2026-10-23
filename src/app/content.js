// src/app/content.js
// ─── All site content: copy, links, globe data ─────────────────────────────

export const SITE = {
  name: 'VAYA',
  tagline1: 'Know before you go',
  tagline2: 'Step in, step out',
  scrollCue: 'SCROLL TO EXPLORE',
  description: 'VAYA — A scroll-driven cinematic journey. Know before you go.',
};

export const LINKS = {
  instagram: 'https://www.instagram.com/vaya.travel',
  linkedin:  'https://www.linkedin.com/company/vaya-travel',
  linktree:  'https://linktr.ee/vaya.travel',
  email:     'mailto:hello@vaya.travel',
};

// Section 2 — Why travellers need VAYA
export const WHY_CARDS = [
  {
    slug: 'overcrowding',
    emoji: '👥',
    title: 'Overcrowding',
    tagline: 'See estimated crowd levels before you visit',
    body: 'Popular spots can get overwhelmingly busy. VAYA aggregates estimated crowd data from multiple sources so you can make an informed choice.',
    howVayaHelps: 'Browse estimated crowd trends, filter by month, and discover nearby quieter alternatives.',
  },
  {
    slug: 'prices',
    emoji: '💸',
    title: 'Unreasonable prices',
    tagline: 'Know what to expect before you book',
    body: 'Prices can spike dramatically during peak periods with no warning.',
    howVayaHelps: 'VAYA shows estimated seasonal price trends for accommodation, transport, and activities so you can plan smarter.',
  },
  {
    slug: 'local-guides',
    emoji: '🧭',
    title: 'Finding local guides',
    tagline: 'Connect with people who actually know the place',
    body: 'Generic itineraries miss the soul of a destination. Local knowledge makes the difference.',
    howVayaHelps: 'Discover verified local guides who share real insights — not just tourist-trail highlights.',
  },
  {
    slug: 'changing-plans',
    emoji: '🔄',
    title: 'Changing plans',
    tagline: 'Adapt on the go without the stress',
    body: 'Weather, closures, or local events can upend the best-laid plans.',
    howVayaHelps: 'Real-time condition alerts and instant alternative suggestions keep you moving.',
  },
  {
    slug: 'safety',
    emoji: '🛡️',
    title: 'Safety concerns',
    tagline: 'Travel with confidence, not anxiety',
    body: 'Navigating unfamiliar places raises genuine safety questions.',
    howVayaHelps: 'VAYA surfaces community-reported safety notes and local advisories so you're never in the dark.',
  },
  {
    slug: 'planning',
    emoji: '🗓️',
    title: 'Too much planning',
    tagline: 'Less research, more experience',
    body: 'Hours of tab-juggling and conflicting advice drain the joy out of anticipation.',
    howVayaHelps: 'Everything you need — crowds, weather, events, costs — in one place, before you go.',
  },
];

// Section 3 — Globe nodes (~12 countries)
export const GLOBE_NODES = [
  { country: 'India',       lat: 20.59,  lng:  78.96, travellers: '12k+', bestSeason: 'Oct–Mar', places: ['Hampi', 'Spiti Valley', 'Chikmangalur'], tip: 'Book trains weeks ahead for popular routes.' },
  { country: 'Japan',       lat: 36.20,  lng: 138.25, travellers: '8k+',  bestSeason: 'Mar–May', places: ['Kyoto', 'Yakushima', 'Naoshima'],       tip: 'IC card covers most local transit — no cash needed.' },
  { country: 'Italy',       lat: 41.87,  lng:  12.56, travellers: '7k+',  bestSeason: 'Apr–Jun', places: ['Cinque Terre', 'Matera', 'Ortigia'],     tip: 'Museum reservations are essential in summer.' },
  { country: 'France',      lat: 46.23,  lng:   2.21, travellers: '6k+',  bestSeason: 'May–Sep', places: ['Alsace', 'Camargue', 'Gorges du Verdon'], tip: 'Many museums are free on the first Sunday of each month.' },
  { country: 'Thailand',    lat: 15.87,  lng: 100.99, travellers: '9k+',  bestSeason: 'Nov–Feb', places: ['Pai', 'Koh Lanta', 'Sukhothai'],          tip: 'Avoid Koh Samui in Oct–Nov (monsoon season).' },
  { country: 'Indonesia',   lat:  -0.79, lng: 113.92, travellers: '5k+',  bestSeason: 'May–Sep', places: ['Flores', 'Sumba', 'Raja Ampat'],          tip: 'Dive season peaks Jun–Aug across the archipelago.' },
  { country: 'Switzerland', lat: 46.82,  lng:   8.23, travellers: '4k+',  bestSeason: 'Jun–Sep', places: ['Lauterbrunnen', 'Appenzell', 'Lugano'],   tip: 'Swiss Half Fare Card is worth it for multi-day trips.' },
  { country: 'UAE',         lat: 23.42,  lng:  53.85, travellers: '6k+',  bestSeason: 'Nov–Mar', places: ['Al Ain', 'Hatta', 'Sir Bani Yas'],        tip: 'Off-peak hours at museums are earlier than you think.' },
  { country: 'USA',         lat: 37.09,  lng: -95.71, travellers: '15k+', bestSeason: 'Apr–Oct', places: ['Escalante', 'Olympic NP', 'Marfa'],        tip: 'National Park passes save significantly for road trips.' },
  { country: 'Australia',   lat: -25.27, lng: 133.78, travellers: '5k+',  bestSeason: 'Apr–Nov', places: ['Kimberley', 'Flinders Ranges', 'Cradle Mtn'], tip: 'Hire cars are scarce in remote WA — book months out.' },
  { country: 'Brazil',      lat: -14.24, lng: -51.93, travellers: '4k+',  bestSeason: 'May–Sep', places: ['Chapada Diamantina', 'Lençóis', 'Bonito'], tip: 'Some parks limit daily visitors — reserve early.' },
  { country: 'Egypt',       lat: 26.82,  lng:  30.80, travellers: '3k+',  bestSeason: 'Oct–Apr', places: ['Siwa Oasis', 'White Desert', 'Luxor'],     tip: 'Dawn visits to the Valley of the Kings beat the heat.' },
];
