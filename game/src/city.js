// The city of Solmar Bay: roads, blocks, buildings, palms, the park and the
// docks, all generated from a seed so every player gets the same city.
import { WORLD, STREETS_Y, AVENUES_X, ROAD_W, BEACH_Y, WATER_Y, PARK, DOCKS, PALETTE, DISTRICTS, STRIP, CASINO_ROW, MARINA } from './config.js';
import { mulberry32, pick, range, rangeInt } from './random.js';

function onRoad(x, y, margin = 0) {
  const hw = ROAD_W / 2 + margin;
  for (const sy of STREETS_Y) if (Math.abs(y - sy) < hw) return true;
  for (const ax of AVENUES_X) if (Math.abs(x - ax) < hw) return true;
  return false;
}

export function buildCity(seed = 20261118) {
  const rng = mulberry32(seed);
  const buildings = [];
  const palms = [];
  const containers = [];
  const trees = [];

  // Buildings fill every block between the streets and avenues.
  const xs = [0, ...AVENUES_X, WORLD.w];
  const ys = [0, ...STREETS_Y, BEACH_Y];
  for (let bi = 0; bi < xs.length - 1; bi += 1) {
    for (let bj = 0; bj < ys.length - 1; bj += 1) {
      const bx = xs[bi] + ROAD_W / 2 + 14;
      const by = ys[bj] + ROAD_W / 2 + 14;
      const bw = xs[bi + 1] - xs[bi] - ROAD_W - 28;
      const bh = ys[bj + 1] - ys[bj] - ROAD_W - 28;
      if (bw < 90 || bh < 70) continue;
      // The park block stays a park; the docks block stays docks.
      if (bx < PARK.x + PARK.w && bx + bw > PARK.x && by < PARK.y + PARK.h && by + bh > PARK.y) continue;
      if (bx < DOCKS.x + DOCKS.w && bx + bw > DOCKS.x && by < DOCKS.y + DOCKS.h && by + bh > DOCKS.y) continue;
      const downtown = bx < 1300 && by < 1000;
      const beachfront = by > 1800;
      const count = downtown ? rangeInt(rng, 2, 4) : beachfront ? rangeInt(rng, 1, 2) : rangeInt(rng, 1, 3);
      for (let k = 0; k < count; k += 1) {
        const w = range(rng, 70, Math.min(200, bw / count));
        const h = range(rng, 60, Math.min(160, bh));
        const x = bx + range(rng, 0, Math.max(1, bw - w));
        const y = by + range(rng, 0, Math.max(1, bh - h));
        const ci = Math.floor(rng() * PALETTE.buildingRoof.length);
        buildings.push({
          x, y, w, h,
          roof: PALETTE.buildingRoof[ci],
          wall: PALETTE.buildingWall[ci],
          tall: downtown ? rangeInt(rng, 2, 4) : beachfront ? rangeInt(rng, 2, 3) : 1,
          hotel: beachfront && rng() < 0.5,
        });
      }
    }
  }

  // Palm trees along Ocean Drive and around the park.
  for (let x = 120; x < WORLD.w; x += 130) {
    palms.push({ x: x + range(rng, -20, 20), y: 2352, lean: range(rng, -0.2, 0.2) });
    if (rng() < 0.6) palms.push({ x: x + 60, y: 2430, lean: range(rng, -0.2, 0.2) });
  }
  for (let i = 0; i < 26; i += 1) {
    trees.push({ x: PARK.x + range(rng, 15, PARK.w - 15), y: PARK.y + range(rng, 15, PARK.h - 15), r: range(rng, 10, 16) });
  }
  // A few palms scattered on sidewalks downtown and on Calle Sol.
  for (let i = 0; i < 40; i += 1) {
    const x = range(rng, 100, WORLD.w - 100);
    const y = pick(rng, STREETS_Y) + 62;
    if (!onRoad(x, y, 4)) palms.push({ x, y, lean: range(rng, -0.15, 0.15) });
  }

  // Shipping containers stacked in the docks.
  const contColors = ['#c96a3d', '#3d7bd9', '#7fb069', '#e8c53d', '#8a6fb8'];
  for (let i = 0; i < 14; i += 1) {
    containers.push({
      x: DOCKS.x + 20 + (i % 5) * 105,
      y: DOCKS.y + 20 + Math.floor(i / 5) * 130,
      w: 90, h: 46,
      color: contColors[i % contColors.length],
    });
  }

  // New districts, built from the same seed so they are identical every run.
  // Casino row: two tall gold towers with lit signs, standing clear of the road grid.
  const casinoTowers = [
    { x: 2450, y: 720, w: 170, h: 130, roof: '#ffd34e', wall: '#b8860b', tall: 5, hotel: false, sign: 'CASINO' },
    { x: 2950, y: 720, w: 150, h: 120, roof: '#e86fb8', wall: '#8a2f63', tall: 4, hotel: false, sign: 'SLOTS' },
  ];
  for (const t of casinoTowers) buildings.push(t);
  // The Strip: neon-fronted blocks along Palm Row, kept off the roads.
  const stripNeon = [];
  for (let i = 0; i < 8; i += 1) {
    stripNeon.push({
      x: STRIP.x + 60 + i * 115, y: STRIP.y + 150, w: 84, h: 110,
      color: ['#e86fb8', '#ffd34e', '#7fc4d9', '#7fb069'][i % 4],
    });
  }
  // Marina: wooden piers reaching into the water and moored boats.
  const piers = [];
  const boats = [];
  for (let i = 0; i < 3; i += 1) {
    const px = MARINA.x + 60 + i * 240;
    piers.push({ x: px, y: 2380, w: 26, h: 150 });
    boats.push({ x: px + 60, y: 2550, angle: range(rng, -0.3, 0.3), color: ['#e8e8e8', '#3d7bd9', '#f2c14e'][i % 3] });
    boats.push({ x: px + 150, y: 2525, angle: range(rng, -0.3, 0.3), color: '#d94f3d' });
  }

  return { buildings, palms, trees, containers, seed, casinoTowers, stripNeon, piers, boats };
}

// Which named district contains this point; the newer districts win overlaps
// so the Strip, Casino and Marina read correctly on the HUD and minimap.
export function districtAt(x, y) {
  for (let i = DISTRICTS.length - 1; i >= 0; i -= 1) {
    const d = DISTRICTS[i];
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d.name;
  }
  return 'Solmar Bay';
}

export function isInDistrict(x, y, name) {
  return districtAt(x, y) === name;
}

// True when the point is inside a building, the park pond, or the water.
export function blockedAt(city, x, y) {
  if (x < 20 || y < 20 || x > WORLD.w - 20 || y > WORLD.h - 20) return true;
  if (y > WATER_Y) return true;
  for (const b of city.buildings) {
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  }
  return false;
}

// Push a circle (x, y, r) out of buildings and the world edge; returns corrected pos.
// The building is treated as its rectangle expanded by r on every side, and
// the circle is pushed out along the smallest overlap: that lets a car slide
// along a wall instead of wedging into a corner.
export function collideCircle(city, x, y, r) {
  let nx = x;
  let ny = y;
  nx = Math.max(20 + r, Math.min(WORLD.w - 20 - r, nx));
  ny = Math.max(20 + r, Math.min(WATER_Y - 4 - r, ny));
  for (const b of city.buildings) {
    const ex0 = b.x - r;
    const ex1 = b.x + b.w + r;
    const ey0 = b.y - r;
    const ey1 = b.y + b.h + r;
    if (nx > ex0 && nx < ex1 && ny > ey0 && ny < ey1) {
      const pushLeft = nx - ex0;
      const pushRight = ex1 - nx;
      const pushTop = ny - ey0;
      const pushBottom = ey1 - ny;
      const m = Math.min(pushLeft, pushRight, pushTop, pushBottom);
      if (m === pushLeft) nx = ex0;
      else if (m === pushRight) nx = ex1;
      else if (m === pushTop) ny = ey0;
      else ny = ey1;
    }
  }
  return { x: nx, y: ny };
}

// A point on a road, for spawning traffic and pedestrians.
export function randomRoadPoint(rng) {
  if (rng() < 0.5) {
    const y = pick(rng, STREETS_Y);
    return { x: range(rng, 100, WORLD.w - 100), y: y + range(rng, -20, 20), horizontal: true };
  }
  const x = pick(rng, AVENUES_X);
  return { x: x + range(rng, -20, 20), y: range(rng, 100, BEACH_Y - 100), horizontal: false };
}

export function nearestRoadPoint(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const sy of STREETS_Y) {
    const d = Math.abs(y - sy);
    if (d < bestD) { bestD = d; best = { x, y: sy }; }
  }
  for (const ax of AVENUES_X) {
    const d = Math.abs(x - ax);
    if (d < bestD) { bestD = d; best = { x: ax, y }; }
  }
  return best;
}
