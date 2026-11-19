// Cars, pedestrians, police and particles: the moving life of Solmar Bay.
// Traffic follows the road grid, pedestrians walk the sidewalks and flee from
// danger, and the police answer the player's wanted level.
import { WORLD, STREETS_Y, AVENUES_X, PALETTE, TUNE, VEHICLE_MODELS } from './config.js';
import { collideCircle, randomRoadPoint, nearestRoadPoint } from './city.js';
import { pick, range } from './random.js';

// Six vehicle models, each with its own speed, acceleration, handling and
// silhouette. A model can be picked by id, or rolled from the seed like a colour.
export function vehicleModel(opts = {}) {
  if (opts.model) {
    const found = VEHICLE_MODELS.find((m) => m.id === opts.model);
    if (found) return found;
  }
  if (opts.type === 'police') {
    return { id: 'interceptor', name: 'Police Interceptor', max: 470, accel: 360, turn: 2.9, len: 42, w: 20, color: '#e8e8e8', stripe: '#1a1a1a' };
  }
  if (opts.type === 'van') {
    return { id: 'armored', name: 'Armored Van', max: 300, accel: 200, turn: 1.8, len: 52, w: 24, color: '#3d3a38', stripe: '#c8a24a' };
  }
  return pick(opts.rng || Math.random, VEHICLE_MODELS);
}

export function makeCar(x, y, angle, opts = {}) {
  const model = vehicleModel(opts);
  return {
    kind: 'car',
    type: opts.type || 'traffic', // traffic | parked | police | getaway | van | taxi
    modelId: model.id,
    modelName: model.name,
    modelMax: model.max,
    modelAccel: model.accel,
    modelTurn: model.turn,
    modelLen: model.len,
    modelW: model.w,
    modelStripe: model.stripe,
    x, y, angle,
    speed: opts.speed || 0,
    color: opts.color || model.color,
    health: opts.health ?? 120,
    maxHealth: opts.health ?? 120,
    driver: opts.driver ?? true, // a traffic car with a driver can be carjacked
    smoking: false,
    dead: false,
    wp: null, // traffic waypoint {x, y}
    dir: opts.dir || 0, // traffic heading: 0 east, 1 south, 2 west, 3 north
    siren: false,
    id: opts.id || 0,
  };
}

// --- Police helicopter: an airborne pursuer that escalates with the wanted level.
export function makeHelicopter(x, y, opts = {}) {
  return {
    kind: 'heli', x, y, angle: 0, rotor: 0, speed: 0,
    altitude: 1, leaving: false, searchTimer: 0, id: opts.id || 0,
  };
}

export function spawnHelicopter(world) {
  const p = world.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  const a = world.rng() * Math.PI * 2;
  const heli = makeHelicopter(px + Math.cos(a) * 600, py + Math.sin(a) * 600, { id: world.nextId() });
  world.heli = heli;
  world.audio.heliAlert();
  world.events.push({ type: 'banner', text: 'Police helicopter overhead — lose it!', color: '#ff5a4e' });
  return heli;
}

// A helicopter hovers 260 px off the player, spotlight on them, and keeps the
// heat up while it watches. At 5 stars a second pass is faster, not a second heli.
export function updateHelicopter(world, heli, dt) {
  const p = world.player;
  const tx = p.inCar ? p.car.x : p.x;
  const ty = p.inCar ? p.car.y : p.y;
  heli.rotor += dt * 22;
  if (heli.leaving) {
    heli.x += Math.cos(heli.angle) * TUNE.heliSpeed * 1.4 * dt;
    heli.y += Math.sin(heli.angle) * TUNE.heliSpeed * 1.4 * dt;
    if (Math.hypot(heli.x - tx, heli.y - ty) > 1400) world.heli = null;
    return;
  }
  // Hover offset so the spotlight cone, not the body, sits on the player.
  const hx = tx + 180;
  const hy = ty - 180;
  const dx = hx - heli.x;
  const dy = hy - heli.y;
  const d = Math.hypot(dx, dy);
  heli.angle = Math.atan2(dy, dx);
  const speed = world.wanted >= 5 ? TUNE.heliSpeed * 1.25 : TUNE.heliSpeed;
  if (d > 40) {
    heli.x += Math.cos(heli.angle) * Math.min(speed, d * 2) * dt;
    heli.y += Math.sin(heli.angle) * Math.min(speed, d * 2) * dt;
  }
  heli.searchTimer += dt;
  // The spotlight holds the wanted level: heat does not decay under the heli.
  if (d < 700) world.lastCrimeAt = world.time;
}

// A taxi passenger waiting on the sidewalk, flagging a cab down.
export function spawnTaxiPassenger(world, x, y) {
  const ped = makePed(x, y, { rng: world.rng, id: world.nextId() });
  ped.state = 'taxi';
  ped.color = '#ffd34e';
  world.peds.push(ped);
  return ped;
}

export function makePed(x, y, opts = {}) {
  return {
    kind: 'ped',
    x, y,
    angle: opts.angle || 0,
    speed: 0,
    color: opts.color || pick(opts.rng || Math.random, ['#e8e8e8', '#d94f3d', '#3d7bd9', '#e8c53d', '#7fb069', '#c96f9b']),
    state: 'walk', // walk | flee | down | gang | cop
    health: opts.health ?? 40,
    panic: 0,
    wp: null,
    dir: opts.dir || 0,
    attackCooldown: 0,
    id: opts.id || 0,
  };
}

export function spawnParticles(world, x, y, opts = {}) {
  const n = opts.count || 10;
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = (opts.speed || 120) * (0.4 + Math.random() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: opts.life || 0.6, maxLife: opts.life || 0.6,
      color: opts.color || '#f2c14e',
      size: opts.size || 3,
      smoke: !!opts.smoke,
    });
  }
}

// --- Traffic: drive the road grid, turn at intersections, slow for the car ahead.
function nextWaypoint(car, rng) {
  const dirs = [0, 1, 2, 3].filter((d) => d !== ((car.dir + 2) % 4)); // never U-turn
  car.dir = pick(rng, dirs);
  const p = { x: car.x, y: car.y };
  if (car.dir === 0) { // east along a street
    const y = p.y;
    const nextX = AVENUES_X.find((ax) => ax > p.x + 60) ?? WORLD.w - 100;
    car.wp = { x: nextX, y };
  } else if (car.dir === 2) { // west
    const nextX = [...AVENUES_X].reverse().find((ax) => ax < p.x - 60) ?? 100;
    car.wp = { x: nextX, y: p.y };
  } else if (car.dir === 1) { // south along an avenue
    const nextY = STREETS_Y.find((sy) => sy > p.y + 60) ?? 2250;
    car.wp = { x: p.x, y: nextY };
  } else { // north
    const nextY = [...STREETS_Y].reverse().find((sy) => sy < p.y - 60) ?? 100;
    car.wp = { x: p.x, y: nextY };
  }
}

export function updateTrafficCar(world, car, dt) {
  if (car.type !== 'traffic' && car.type !== 'taxi') return;
  if (!car.wp) nextWaypoint(car, world.rng);
  const dx = car.wp.x - car.x;
  const dy = car.wp.y - car.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 30) { nextWaypoint(car, world.rng); return; }
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.angle += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
  // Slow down for a car directly ahead.
  let ahead = false;
  for (const other of world.cars) {
    if (other === car || other.dead) continue;
    const ox = other.x - car.x;
    const oy = other.y - car.y;
    const along = ox * Math.cos(car.angle) + oy * Math.sin(car.angle);
    const side = Math.abs(-ox * Math.sin(car.angle) + oy * Math.cos(car.angle));
    if (along > 0 && along < 70 && side < 26) { ahead = true; break; }
  }
  const want = ahead ? 0 : TUNE.trafficSpeed;
  car.speed += Math.max(-200 * dt, Math.min(200 * dt, want - car.speed));
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  // Stay on the road: snap back if pushed off the grid.
  const near = nearestRoadPoint(car.x, car.y);
  if (Math.hypot(near.x - car.x, near.y - car.y) > 130) {
    car.x = near.x; car.y = near.y;
    car.wp = null;
  }
}

// --- Pedestrians: walk the sidewalks, flee gunfire, cars and chases.
export function updatePed(world, ped, dt) {
  if (ped.state === 'down') return;
  const player = world.player;
  const dangerX = player.inCar ? player.car.x : player.x;
  const dangerY = player.inCar ? player.car.y : player.y;
  const dPlayer = Math.hypot(ped.x - dangerX, ped.y - dangerY);
  const scared = world.gunshotTimer > 0 || (dPlayer < 90 && world.playerSpeed > 200) || world.wanted >= 3;
  if (scared && ped.state !== 'gang' && ped.state !== 'cop') {
    ped.state = 'flee';
    ped.panic = 2;
  }
  if (ped.state === 'flee') {
    ped.panic -= dt;
    const a = Math.atan2(ped.y - dangerY, ped.x - dangerX);
    ped.angle = a;
    ped.speed = TUNE.pedFleeSpeed;
    ped.x += Math.cos(a) * ped.speed * dt;
    ped.y += Math.sin(a) * ped.speed * dt;
    const fixed = collideCircle(world.city, ped.x, ped.y, 12);
    ped.x = fixed.x; ped.y = fixed.y;
    if (ped.panic <= 0) ped.state = 'walk';
    return;
  }
  if (ped.state === 'gang' || ped.state === 'cop') return; // driven by police.js / missions.js
  // Walk along the nearest sidewalk, turning at intersections.
  if (!ped.wp || Math.hypot(ped.wp.x - ped.x, ped.wp.y - ped.y) < 24) {
    const p = randomRoadPoint(world.rng);
    ped.wp = { x: p.x, y: p.y };
    ped.dir = p.horizontal ? (world.rng() < 0.5 ? 0 : 2) : (world.rng() < 0.5 ? 1 : 3);
  }
  const dx = ped.wp.x - ped.x;
  const dy = ped.wp.y - ped.y;
  ped.angle = Math.atan2(dy, dx);
  ped.speed = TUNE.pedSpeed;
  ped.x += Math.cos(ped.angle) * ped.speed * dt;
  ped.y += Math.sin(ped.angle) * ped.speed * dt;
  const fixed = collideCircle(world.city, ped.x, ped.y, 12);
  ped.x = fixed.x; ped.y = fixed.y;
}

// --- Police: cars that ram the player's car, foot cops that chase and arrest.
export function policeTargetCount(wanted) {
  return wanted <= 0 ? 0 : wanted <= 1 ? 1 : wanted <= 2 ? 2 : wanted <= 3 ? 3 : 4;
}

export function spawnPoliceCar(world) {
  const p = world.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  // Spawn on a road 500-700 px away from the player.
  for (let tries = 0; tries < 12; tries += 1) {
    const a = world.rng() * Math.PI * 2;
    const x = px + Math.cos(a) * range(world.rng, 500, 700);
    const y = py + Math.sin(a) * range(world.rng, 500, 700);
    const near = nearestRoadPoint(x, y);
    if (Math.abs(x - near.x) > 200 || Math.abs(y - near.y) > 200) continue;
    if (x < 60 || y < 60 || x > WORLD.w - 60 || y > 2320) continue;
    const car = makeCar(near.x, near.y, Math.atan2(py - near.y, px - near.x), {
      type: 'police', color: '#e8e8e8', rng: world.rng, id: world.nextId(),
    });
    car.siren = true;
    world.cars.push(car);
    return car;
  }
  return null;
}

export function spawnCop(world) {
  const p = world.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  const a = world.rng() * Math.PI * 2;
  const cop = makePed(px + Math.cos(a) * 320, py + Math.sin(a) * 320, { rng: world.rng, id: world.nextId() });
  cop.state = 'cop';
  cop.health = 80;
  cop.color = '#1a2a4a';
  world.peds.push(cop);
  return cop;
}

export function updatePoliceCar(world, car, dt) {
  const p = world.player;
  const tx = p.inCar ? p.car.x : p.x;
  const ty = p.inCar ? p.car.y : p.y;
  const targetAngle = Math.atan2(ty - car.y, tx - car.x);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const steer = Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
  car.angle += steer;
  const want = TUNE.policeCarSpeed;
  car.speed += Math.max(-400 * dt, Math.min(400 * dt, want - car.speed));
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const fixed = collideCircle(world.city, car.x, car.y, 20);
  // Sliding along a building kills some speed instead of stopping dead.
  if (fixed.x !== car.x || fixed.y !== car.y) car.speed *= 0.85;
  car.x = fixed.x; car.y = fixed.y;
  // Ram the player's car: damage both, shove the player (at most once per 0.6s).
  if (p.inCar) {
    const d = Math.hypot(car.x - p.car.x, car.y - p.car.y);
    car.ramCooldown = (car.ramCooldown || 0) - dt;
    if (d < 46) {
      const push = 60 * dt;
      const a = Math.atan2(p.car.y - car.y, p.car.x - car.x);
      p.car.x += Math.cos(a) * push;
      p.car.y += Math.sin(a) * push;
      if (car.speed > 200 && car.ramCooldown <= 0) {
        car.ramCooldown = 0.8;
        damageCar(world, p.car, 2);
        damageCar(world, car, 2);
        world.audio.crash();
      }
    }
  }
}

export function updateCop(world, cop, dt) {
  const p = world.player;
  if (p.inCar) { // cops wait by the road when the player drives past
    cop.speed = 0;
    return;
  }
  const dx = p.x - cop.x;
  const dy = p.y - cop.y;
  const d = Math.hypot(dx, dy);
  if (d > 700) { cop.speed = 0; return; }
  cop.angle = Math.atan2(dy, dx);
  cop.speed = TUNE.copSpeed;
  cop.x += Math.cos(cop.angle) * cop.speed * dt;
  cop.y += Math.sin(cop.angle) * cop.speed * dt;
  const fixed = collideCircle(world.city, cop.x, cop.y, 12);
  cop.x = fixed.x; cop.y = fixed.y;
  cop.attackCooldown -= dt;
  if (d < 34 && cop.attackCooldown <= 0) {
    cop.attackCooldown = 0.9;
    world.damagePlayer(12);
    world.audio.punch();
    spawnParticles(world, p.x, p.y, { count: 5, color: '#ff5a4e', speed: 90 });
  }
  // A cop holding the player still for 2.5 seconds makes the bust.
  if (d < 30) {
    cop.holdTime = (cop.holdTime || 0) + dt;
    if (cop.holdTime > TUNE.bustedHoldSec) world.busted();
  } else {
    cop.holdTime = 0;
  }
}

export function damageCar(world, car, amount) {
  if (car.dead) return;
  car.health -= amount;
  if (car.health <= 55 && !car.smoking) {
    car.smoking = true;
    world.events.push({ type: 'smoke', car });
  }
  if (car.health <= 0) {
    car.dead = true;
    car.speed = 0;
    spawnParticles(world, car.x, car.y, { count: 26, color: '#f28c28', speed: 260, life: 0.9, size: 5 });
    spawnParticles(world, car.x, car.y, { count: 16, color: '#555', speed: 90, life: 1.4, size: 7, smoke: true });
    world.audio.crash();
    if (world.player.inCar && world.player.car === car) world.ejectFromCar();
  }
}

export function updateParticles(world, dt) {
  for (const pt of world.particles) {
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
  }
  world.particles = world.particles.filter((pt) => pt.life > 0);
}
