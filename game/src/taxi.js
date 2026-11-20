// Taxis and their fares. A City Taxi cruises the streets like any traffic
// car, but it is for hire: walk up to one and press T, and it pulls over,
// takes you aboard as a passenger, and drives you to your current objective
// (or to Rosa's garage when you have none). The meter runs the whole way —
// a flat flag-fall plus a little per hundred pixels of road — and you pay
// when it drops you off. Press E mid-ride to get out early; the meter stops
// where you are, and you still pay what it shows.
import { PLACES, TUNE, WORLD, STREETS_Y, AVENUES_X } from './config.js';
import { collideCircle, nearestRoadPoint } from './city.js';

// The nearest taxi that can take a fare: alive, not already on a job, and
// close enough to hail.
export function findTaxi(world, x, y, maxDist = 120) {
  let best = null;
  let bestD = maxDist;
  for (const car of world.cars) {
    if (car.dead || car.type !== 'taxi') continue;
    if (world.taxiRide && world.taxiRide.taxi === car) continue;
    const d = Math.hypot(car.x - x, car.y - y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

// Where a ride goes: the mission marker when there is one, Rosa's garage
// when there is not. The name rides along so the HUD can say where to.
// The cab itself drives to the nearest road point to the destination —
// garages and casinos sit inside blocks, and a cab drops you at the kerb,
// not through the front door.
export function rideDestination(world) {
  const obj = world.missions.objective();
  if (obj.x !== null && obj.y !== null) return { x: obj.x, y: obj.y, name: obj.text };
  return { x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y, name: "Rosa's Garage" };
}

export function startRide(world, taxi) {
  const dest = rideDestination(world);
  world.taxiRide = {
    taxi,
    state: 'pickup', // pickup: driving to the player | ride: carrying them
    dest,
    driveTo: nearestRoadPoint(dest.x, dest.y),
    fare: TUNE.taxiBaseFare,
    dist: 0,
    lastX: taxi.x,
    lastY: taxi.y,
  };
  taxi.driver = false;
  taxi.wp = null;
  world.events.push({ type: 'banner', text: `Taxi hailed — $${TUNE.taxiBaseFare} flag-fall`, color: '#ffd34e' });
  return world.taxiRide;
}

// Pick the next intersection that gets the cab closer to its target, the
// way traffic picks its turns — but goal-directed, never a U-turn. The cab
// only ever drives on roads, so it goes round a block instead of through it.
function taxiNextWaypoint(world, car, tx, ty) {
  const dirs = [0, 1, 2, 3].filter((d) => d !== ((car.dir + 2) % 4));
  let best = null;
  let bestScore = Infinity;
  for (const d of dirs) {
    let wp;
    if (d === 0) { // east along a street
      const nx = AVENUES_X.find((ax) => ax > car.x + 60) ?? WORLD.w - 100;
      wp = { x: nx, y: car.y };
    } else if (d === 2) { // west
      const nx = [...AVENUES_X].reverse().find((ax) => ax < car.x - 60) ?? 100;
      wp = { x: nx, y: car.y };
    } else if (d === 1) { // south along an avenue
      const ny = STREETS_Y.find((sy) => sy > car.y + 60) ?? 2250;
      wp = { x: car.x, y: ny };
    } else { // north
      const ny = [...STREETS_Y].reverse().find((sy) => sy < car.y - 60) ?? 100;
      wp = { x: car.x, y: ny };
    }
    const score = Math.abs(wp.x - tx) + Math.abs(wp.y - ty);
    if (score < bestScore) { bestScore = score; best = { wp, dir: d }; }
  }
  if (best) { car.dir = best.dir; car.wp = best.wp; }
}

// Drive the cab toward (tx, ty) on the road grid, and return the straight
// distance left. When the target is close and on the same road, the cab
// just heads straight for it; otherwise it works the grid, intersection
// by intersection, so it never tries to drive through a building.
function driveCab(world, car, tx, ty, dt) {
  const direct = Math.hypot(tx - car.x, ty - car.y);
  const sameRoad = Math.abs(tx - car.x) < 60 || Math.abs(ty - car.y) < 60;
  let target;
  if (direct < 170 && sameRoad) {
    target = { x: tx, y: ty };
  } else {
    if (!car.wp || Math.hypot(car.wp.x - car.x, car.wp.y - car.y) < 30) {
      const near = nearestRoadPoint(car.x, car.y);
      if (Math.hypot(near.x - car.x, near.y - car.y) > 40) car.wp = near;
      else taxiNextWaypoint(world, car, tx, ty);
    }
    target = car.wp;
  }
  // Stuck against a wall: the cab is pushing into a building and going
  // nowhere. Sidestep along the wall — 140 px to the side the target lies
  // on — until it clears the corner, then work the grid again.
  const moved = Math.hypot(car.x - (car._lx ?? car.x), car.y - (car._ly ?? car.y));
  car._lx = car.x;
  car._ly = car.y;
  if (car.speed > 80 && moved < 0.4) car._stuck = (car._stuck || 0) + dt;
  else car._stuck = 0;
  if (car._stuck > 0.5 && !car._side) {
    const a = Math.atan2(ty - car.y, tx - car.x);
    const side = Math.sin(a - car.angle) >= 0 ? 1 : -1;
    car._side = {
      x: car.x - Math.sin(car.angle) * side * 140,
      y: car.y + Math.cos(car.angle) * side * 140,
      t: 1.5,
    };
    car._stuck = 0;
  }
  if (car._side) {
    car._side.t -= dt;
    target = car._side;
    if (Math.hypot(target.x - car.x, target.y - car.y) < 30 || car._side.t <= 0) {
      car._side = null;
      car.wp = null;
    }
  }
  const targetAngle = Math.atan2(target.y - car.y, target.x - car.x);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
  const dist = Math.hypot(target.x - car.x, target.y - car.y);
  const want = dist < 90 ? 60 : 260;
  car.speed += Math.max(-320 * dt, Math.min(320 * dt, want - car.speed));
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const fixed = collideCircle(world.city, car.x, car.y, 20);
  if (fixed.x !== car.x || fixed.y !== car.y) car.speed *= 0.8;
  car.x = fixed.x;
  car.y = fixed.y;
  return direct;
}

export function updateRide(world, dt) {
  const ride = world.taxiRide;
  if (!ride) return;
  const taxi = ride.taxi;
  const p = world.player;
  if (taxi.dead) { // the cab died: the ride is over, nobody pays
    world.taxiRide = null;
    if (p.car === taxi) { p.inCar = null; p.car = null; }
    world.events.push({ type: 'banner', text: 'The taxi is wrecked — no fare', color: '#ff5a4e' });
    return;
  }
  if (ride.state === 'pickup') {
    driveCab(world, taxi, p.x, p.y, dt);
    const pd = Math.hypot(taxi.x - p.x, taxi.y - p.y);
    // Board when the cab pulls up — or when it is waiting at the kerb
    // nearest the player and the player is a short walk away.
    const kerb = nearestRoadPoint(p.x, p.y);
    const atKerb = Math.hypot(taxi.x - kerb.x, taxi.y - kerb.y) < 70 && pd < 150;
    if (pd < 46 || atKerb) {
      ride.state = 'ride';
      ride.lastX = taxi.x;
      ride.lastY = taxi.y;
      taxi.wp = null;
      p.inCar = taxi;
      p.car = taxi;
      world.events.push({ type: 'banner', text: `Cab to: ${ride.dest.name}`, color: '#ffd34e' });
    }
    return;
  }
  // Carrying the passenger: the meter runs on the road covered.
  const moved = Math.hypot(taxi.x - ride.lastX, taxi.y - ride.lastY);
  ride.dist += moved;
  ride.lastX = taxi.x;
  ride.lastY = taxi.y;
  ride.fare = TUNE.taxiBaseFare + Math.floor(ride.dist / 100) * TUNE.taxiFarePer100;
  p.x = taxi.x;
  p.y = taxi.y;
  p.angle = taxi.angle;
  const d = driveCab(world, taxi, ride.driveTo.x, ride.driveTo.y, dt);
  if (d < 70) finishRide(world, false);
}

// The ride ends: the fare comes off the player's money (or the whole purse
// when they are short — the driver takes what they have), the passenger
// steps out at the kerb, and the cab goes back to cruising.
export function finishRide(world, early) {
  const ride = world.taxiRide;
  if (!ride) return;
  const p = world.player;
  const paid = Math.min(p.money, ride.fare);
  p.money -= paid;
  world.taxiFaresPaid = (world.taxiFaresPaid || 0) + paid;
  const taxi = ride.taxi;
  world.taxiRide = null;
  if (p.car === taxi) {
    const a = taxi.angle + Math.PI / 2;
    p.x = taxi.x + Math.cos(a) * 30;
    p.y = taxi.y + Math.sin(a) * 30;
    const fixed = collideCircle(world.city, p.x, p.y, 14);
    p.x = fixed.x;
    p.y = fixed.y;
    p.inCar = null;
    p.car = null;
  }
  taxi.speed = 0;
  taxi.type = 'taxi';
  taxi.driver = true;
  taxi.wp = null;
  world.audio.cash();
  world.events.push({
    type: 'banner',
    text: early
      ? `Out early — taxi fare $${paid}`
      : `Arrived — taxi fare $${paid}`,
    color: '#7fd67f',
  });
}
