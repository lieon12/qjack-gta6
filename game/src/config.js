// Solmar Bay — every number the game reads, in one place.
// World size, the road grid, the districts and named places, the palette,
// the six vehicle models, and the tuning for the player, the police and the
// wanted system. Change a number here and the whole city follows.
export const WORLD = { w: 3600, h: 2600 };

export const STREETS_Y = [200, 600, 1000, 1400, 1800, 2200, 2320];
export const AVENUES_X = [300, 800, 1300, 1800, 2300, 2800, 3300];
export const ROAD_W = 90;
export const BEACH_Y = 2380; // sand starts here
export const WATER_Y = 2520; // ocean starts here

// The Strip is the neon casino row uptown; the Marina is the boat basin on
// the south-east beach. Both sit on top of the older districts, so the
// district lookup below checks them first.
export const STRIP = { x: 2300, y: 0, w: 500, h: 600 };
export const MARINA = { x: 2800, y: 1800, w: 800, h: 580 };

export const DISTRICTS = [
  { name: 'Marina', x: MARINA.x, y: MARINA.y, w: MARINA.w, h: MARINA.h, tint: '#7fc4d9' },
  { name: 'The Strip', x: STRIP.x, y: STRIP.y, w: STRIP.w, h: STRIP.h, tint: '#e8b4ff' },
  { name: 'Downtown', x: 0, y: 0, w: 1300, h: 1000, tint: '#c8b28a' },
  { name: 'Calle Sol', x: 1300, y: 600, w: 1000, h: 800, tint: '#e8a34c' },
  { name: 'Docks', x: 2800, y: 0, w: 800, h: 600, tint: '#8a97a3' },
  { name: 'Beachfront', x: 0, y: 1800, w: 3600, h: 580, tint: '#f2d8a0' },
  { name: 'Parkside', x: 1300, y: 1000, w: 1000, h: 400, tint: '#7fb069' },
];

// The first district whose rectangle holds the point wins, so Marina and
// The Strip (listed first) beat the bigger districts underneath them.
export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  }
  return 'Solmar Bay';
}

// Named places the missions and the HUD refer to.
export const PLACES = {
  rosaGarage: { x: 1500, y: 760, name: "Rosa's Garage" },
  hideout: { x: 1500, y: 760, name: 'Hideout' },
  marlinHotel: { x: 2600, y: 2150, name: 'Marlin Hotel' },
  docksPickup: { x: 3350, y: 320, name: 'Docks — Pier 7' },
  ironworks: { x: 950, y: 760, name: 'Ironworks' },
  park: { x: 1575, y: 1200, name: 'Central Park' },
  hospital: { x: 550, y: 1250, name: 'Solmar General' },
  bank: { x: 1050, y: 1050, name: 'Solmar Trust Bank' },
  beach: { x: 2000, y: 2440, name: 'Solmar Beach' },
  casino: { x: 2550, y: 300, name: 'Solmar Grand Casino' },
  casinoFrontA: { x: 2400, y: 200, name: 'Neon Slots' },
  casinoFrontB: { x: 2700, y: 450, name: 'Lucky Pelican' },
  casinoFrontC: { x: 2550, y: 540, name: 'Golden Marlin Club' },
  marina: { x: 3200, y: 2280, name: 'Solmar Marina' },
  marinaPier: { x: 3200, y: 2440, name: 'Marina Pier' },
  playerSpawn: { x: 1500, y: 900 },
};

export const PARK = { x: 1400, y: 1050, w: 350, h: 300 };
export const DOCKS = { x: 3050, y: 100, w: 550, h: 420 };

// Palette: a sun-soaked coastal city, warm sand, turquoise water, pastel walls.
export const PALETTE = {
  grass: '#7fae62',
  grassDark: '#74a158',
  sand: '#ecd9a4',
  water: '#2fa8c9',
  waterDeep: '#1d7ea6',
  road: '#3d3a38',
  roadEdge: '#2c2927',
  lane: '#e8d44d',
  sidewalk: '#b8ab8d',
  buildingRoof: ['#e07856', '#e8a34c', '#7fb069', '#5b8dbf', '#c96f9b', '#8a6fb8', '#d9c27a', '#6fb3a4'],
  buildingWall: ['#d96a4a', '#d18a3d', '#6b9c58', '#4c7ba6', '#b45a86', '#775ba3', '#c2a95e', '#5d9c8c'],
  palm: '#3f8f4f',
  palmTrunk: '#8a6b46',
  carColors: ['#d94f3d', '#3d7bd9', '#e8c53d', '#e8e8e8', '#2b2b2b', '#7fb069', '#c96f9b', '#f28c28'],
  policeWhite: '#e8e8e8',
  policeBlack: '#1a1a1a',
  taxiYellow: '#f2c14e',
  neonPink: '#ff4fd8',
  neonCyan: '#37e0ff',
};

// Six vehicle models. Each one drives differently: top speed, acceleration,
// how sharply it turns, how long it is on the road, and how much damage it
// takes before it dies. The traffic, the parked cars and the player's stolen
// rides all draw from this list, so a Comet GT really does outrun a Limo.
export const VEHICLES = {
  comet: { name: 'Comet GT', top: 520, accel: 380, turn: 3.1, len: 44, health: 120, color: '#f2c14e' },
  sedan: { name: 'Solmar Sedan', top: 400, accel: 300, turn: 2.6, len: 42, health: 120, color: '#3d7bd9' },
  taxi: { name: 'City Taxi', top: 380, accel: 290, turn: 2.7, len: 42, health: 120, color: '#f2c14e' },
  pickup: { name: 'Desert Pickup', top: 360, accel: 280, turn: 2.3, len: 48, health: 170, color: '#7fb069' },
  hatch: { name: 'Palm Hatchback', top: 430, accel: 340, turn: 3.3, len: 38, health: 100, color: '#c96f9b' },
  limo: { name: 'Grand Limo', top: 340, accel: 240, turn: 2.0, len: 56, health: 180, color: '#2b2b2b' },
};
export const VEHICLE_MODELS = ['comet', 'sedan', 'taxi', 'pickup', 'hatch', 'limo'];

// Tuning for the player, cars, police and the wanted system.
export const TUNE = {
  walkSpeed: 170,
  runSpeed: 265,
  carReverseMax: 140,
  carBrake: 500,
  trafficSpeed: 95,
  pedSpeed: 55,
  pedFleeSpeed: 150,
  copSpeed: 185,
  policeCarSpeed: 460,
  punchRange: 46,
  punchDamage: 25,
  pistolDamage: 34,
  pistolRange: 520,
  pistolAmmoStart: 24,
  pistolPrice: 500,
  armorPrice: 300,
  maxHealth: 100,
  maxArmor: 100,
  wantedDecayPerSec: 1.2,
  wantedPerStar: 20,
  bustedHoldSec: 2.5,
  // Eight story missions now: the five Rosa jobs plus the three
  // "Tiburón Rising" jobs on the Strip and at the Marina.
  missionReward: [400, 600, 800, 1000, 2500, 1500, 1800, 4000],
  // Taxi fares: a flat flag-fall plus a little per hundred pixels of road.
  taxiBaseFare: 10,
  taxiFarePer100: 1,
  // The police helicopter joins the chase from three stars up.
  heliWanted: 3,
  // The sky: one game hour passes every ten real seconds, so a full day
  // takes four minutes of play; the weather turns over every 40–90 seconds.
  hourSeconds: 10,
  weatherMinSec: 40,
  weatherMaxSec: 90,
};
