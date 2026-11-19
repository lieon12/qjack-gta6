// Solmar Bay — configuration: world size, streets, districts, colours, tuning.
// Every number the rest of the game reads lives here, so the city can be re-tuned
// without touching the systems that use it.
export const WORLD = { w: 3600, h: 2600 };

export const STREETS_Y = [200, 600, 1000, 1400, 1800, 2200, 2320];
export const AVENUES_X = [300, 800, 1300, 1800, 2300, 2800, 3300];
export const ROAD_W = 90;
export const BEACH_Y = 2380; // sand starts here
export const WATER_Y = 2520; // ocean starts here

export const DISTRICTS = [
  { name: 'Downtown', x: 0, y: 0, w: 1300, h: 1000, tint: '#c8b28a' },
  { name: 'Calle Sol', x: 1300, y: 600, w: 1000, h: 800, tint: '#e8a34c' },
  { name: 'Docks', x: 2800, y: 0, w: 800, h: 600, tint: '#8a97a3' },
  { name: 'Beachfront', x: 0, y: 1800, w: 3600, h: 580, tint: '#f2d8a0' },
  { name: 'Parkside', x: 1300, y: 1000, w: 1000, h: 400, tint: '#7fb069' },
  // Revision districts: the neon Strip, the Casino row and the Marina piers.
  { name: 'Strip', x: 1800, y: 1300, w: 1000, h: 500, tint: '#e86fb8' },
  { name: 'Casino', x: 2300, y: 500, w: 1000, h: 500, tint: '#ffd34e' },
  { name: 'Marina', x: 2800, y: 1800, w: 800, h: 580, tint: '#7fc4d9' },
];

export const STRIP = { x: 1800, y: 1300, w: 1000, h: 500 };
export const CASINO_ROW = { x: 2300, y: 500, w: 1000, h: 500 };
export const MARINA = { x: 2800, y: 1800, w: 800, h: 580 };

// Six distinct vehicle models: different speed, acceleration, handling and look.
export const VEHICLE_MODELS = [
  { id: 'comet', name: 'Comet GT', max: 520, accel: 390, turn: 3.1, len: 42, w: 20, color: '#f2c14e', stripe: '#d94f3d' },
  { id: 'sedan', name: 'Solmar Sedan', max: 380, accel: 300, turn: 2.4, len: 40, w: 20, color: '#3d7bd9', stripe: '#e8e8e8' },
  { id: 'van', name: 'Bay Van', max: 320, accel: 240, turn: 2.0, len: 48, w: 22, color: '#7fb069', stripe: '#e8e8e8' },
  { id: 'limo', name: 'Tiburon Limo', max: 400, accel: 280, turn: 2.2, len: 54, w: 20, color: '#1d3557', stripe: '#ffd34e' },
  { id: 'speedster', name: 'Marina Speedster', max: 560, accel: 430, turn: 3.3, len: 42, w: 19, color: '#e86fb8', stripe: '#ffffff' },
  { id: 'taxi', name: 'City Taxi', max: 410, accel: 320, turn: 2.6, len: 40, w: 20, color: '#f2c14e', stripe: '#1a1a1a' },
];

// Weather: each type changes grip (driving) and visibility (rendering).
export const WEATHER_TYPES = [
  { id: 'clear', label: 'Clear', grip: 1.0, vis: 1.0, rain: false },
  { id: 'cloudy', label: 'Cloudy', grip: 0.95, vis: 0.95, rain: false },
  { id: 'rain', label: 'Rain', grip: 0.72, vis: 0.8, rain: true },
  { id: 'fog', label: 'Fog', grip: 0.88, vis: 0.55, rain: false },
];
export const DAY_LENGTH_SEC = 480; // one full in-game day lasts 480 real seconds

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
  casino: { x: 2800, y: 600, name: 'Solmar Grand Casino' },
  strip: { x: 2300, y: 1400, name: 'The Strip' },
  marina: { x: 3300, y: 2200, name: 'Solmar Marina' },
  taxiStand: { x: 1300, y: 600, name: 'Taxi Stand' },
  tiburonLair: { x: 3300, y: 1000, name: 'Tiburon Lair' },
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
};

// Tuning for the player, cars, police and the wanted system.
export const TUNE = {
  walkSpeed: 170,
  runSpeed: 265,
  carAccel: 320,
  carMaxSpeed: 420,
  carReverseMax: 140,
  carTurn: 2.6,
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
  missionReward: [400, 600, 800, 1000, 2500, 1200, 1500, 3000],
  dayLengthSec: 480,
  heliSpeed: 260,
  heliSpotRange: 320,
  taxiBaseFare: 40,
  taxiPerMetre: 0.35,
  taxiTimeLimit: 120,
};
