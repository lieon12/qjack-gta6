// The player: Danny Vega, on foot and behind the wheel.
// On foot: WASD to move, Shift to sprint, Space to punch, F / click to shoot,
// E to steal or enter a car, T to hail a taxi. In a car: W/S to drive, A/D to
// steer, Space to brake. How a car drives comes from its model, not from a
// single set of numbers — a Comet GT and a Limo feel nothing alike.
import { WORLD, TUNE, PLACES } from './config.js';
import { collideCircle } from './city.js';
import { spawnParticles, damageCar } from './entities.js';
import { findTaxi, startRide, finishRide } from './taxi.js';

export function makePlayer(x, y) {
  return {
    x, y,
    angle: -Math.PI / 2,
    health: TUNE.maxHealth,
    armor: 0,
    money: 250,
    weapon: 'fists', // fists | pistol
    ammo: 0,
    inCar: null,
    car: null,
    punchCooldown: 0,
    shootCooldown: 0,
    speed: 0,
    moving: false,
  };
}

// The nearest car the player could get into (parked, traffic or police).
export function nearestCar(world, maxDist = 70) {
  const p = world.player;
  let best = null;
  let bestD = maxDist;
  for (const car of world.cars) {
    if (car.dead) continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

export function updatePlayer(world, dt, input, mouseWorld) {
  const p = world.player;
  p.punchCooldown -= dt;
  p.shootCooldown -= dt;

  // Riding in a taxi as a passenger: the cab drives, the player just rides.
  // E gets out early (and pays the meter so far); nothing else is needed.
  if (world.taxiRide && world.taxiRide.state === 'ride' && p.car === world.taxiRide.taxi) {
    if (input.pressed('KeyE')) finishRide(world, true);
    p.speed = Math.abs(p.car.speed);
    return;
  }

  if (p.inCar) {
    updateDriving(world, dt, input);
    return;
  }

  const mv = input.moveVector();
  const sprint = input.down('ShiftLeft', 'ShiftRight');
  const speed = sprint ? TUNE.runSpeed : TUNE.walkSpeed;
  p.moving = mv.x !== 0 || mv.y !== 0;
  if (p.moving) {
    p.angle = Math.atan2(mv.y, mv.x);
    p.x += mv.x * speed * dt;
    p.y += mv.y * speed * dt;
    const fixed = collideCircle(world.city, p.x, p.y, 14);
    p.x = fixed.x; p.y = fixed.y;
    p.speed = speed;
  } else {
    p.speed = 0;
  }

  // E: steal / enter the nearest car.
  if (input.pressed('KeyE')) {
    const car = nearestCar(world);
    if (car) enterCar(world, car);
  }

  // T: hail the nearest taxi, if one is cruising close by.
  if (input.pressed('KeyT') && !world.taxiRide) {
    const taxi = findTaxi(world, p.x, p.y);
    if (taxi) {
      startRide(world, taxi);
    } else {
      world.events.push({ type: 'banner', text: 'No taxi nearby — wait for a yellow cab', color: '#ffd34e' });
    }
  }

  // Space: punch whatever is in front of the player.
  if (input.pressed('Space') && p.punchCooldown <= 0) {
    p.punchCooldown = 0.45;
    punch(world);
  }

  // F or left click: shoot the pistol toward the mouse.
  if ((input.pressed('KeyF') || input.mouse.clicked) && p.weapon === 'pistol' && p.ammo > 0 && p.shootCooldown <= 0) {
    p.shootCooldown = 0.22;
    shoot(world, mouseWorld);
  }

  // 1: fists, 2: pistol (when owned).
  if (input.pressed('Digit1')) p.weapon = 'fists';
  if (input.pressed('Digit2') && p.ammo >= 0 && world.shopOwnedPistol) p.weapon = 'pistol';
}

function updateDriving(world, dt, input) {
  const p = world.player;
  const car = p.car;
  const mv = input.moveVector();
  const forward = mv.y < 0 ? 1 : mv.y > 0 ? -0.5 : 0;
  const steering = mv.x;
  // The car's own model sets how hard it pulls and how fast it goes.
  const accel = car.accel || TUNE.carAccel;
  const top = car.topSpeed || TUNE.carMaxSpeed;
  const turn = car.turn || TUNE.carTurn;
  if (forward !== 0) {
    car.speed += forward * accel * dt;
  } else {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 240 * dt);
  }
  if (input.down('Space')) {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), TUNE.carBrake * dt);
    if (Math.abs(car.speed) > 120) {
      world.skidTimer = 0.1;
      spawnParticles(world, car.x - Math.cos(car.angle) * 14, car.y - Math.sin(car.angle) * 14, {
        count: 2, color: '#c9c2b4', speed: 30, life: 0.5, size: 3, smoke: true,
      });
    }
  }
  car.speed = Math.max(-TUNE.carReverseMax, Math.min(top, car.speed));
  const turnRate = turn * Math.min(1, Math.abs(car.speed) / 140) * Math.sign(car.speed || 1);
  car.angle += steering * turnRate * dt;
  const prevX = car.x;
  const prevY = car.y;
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  const fixed = collideCircle(world.city, car.x, car.y, 20);
  if (fixed.x !== car.x || fixed.y !== car.y) {
    car.crashCooldown = (car.crashCooldown || 0) - dt;
    if (Math.abs(car.speed) > 180 && car.crashCooldown <= 0) {
      car.crashCooldown = 0.5;
      damageCar(world, car, 6);
      world.audio.crash();
      spawnParticles(world, car.x, car.y, { count: 8, color: '#ffd34e', speed: 120, life: 0.4 });
    }
    car.speed *= 0.55;
    car.x = fixed.x; car.y = fixed.y;
  }
  // Running over a pedestrian is a crime, and it shows.
  for (const ped of world.peds) {
    if (ped.state === 'down' || ped.state === 'cop') continue;
    const d = Math.hypot(ped.x - car.x, ped.y - car.y);
    if (d < 26 && Math.abs(car.speed) > 60) {
      ped.state = 'down';
      ped.health = 0;
      world.addWanted(15, 'pedestrian hit');
      spawnParticles(world, ped.x, ped.y, { count: 8, color: '#c94f4f', speed: 100 });
      world.audio.punch();
    }
  }
  // Bumping traffic cars shoves them and costs the player a little heat (once per hit).
  // A ram at even moderate speed dents the other car; the armored van takes
  // more, because stopping it by ramming is the job.
  for (const other of world.cars) {
    if (other === car || other.dead) continue;
    other.bumpCooldown = (other.bumpCooldown || 0) - dt;
    const d = Math.hypot(other.x - car.x, other.y - car.y);
    if (d < 44 && Math.abs(car.speed) > 60 && other.bumpCooldown <= 0) {
      other.bumpCooldown = 0.5;
      const a = Math.atan2(other.y - car.y, other.x - car.x);
      other.x += Math.cos(a) * 26;
      other.y += Math.sin(a) * 26;
      damageCar(world, other, other.type === 'van' ? 20 : 8);
      damageCar(world, car, 3);
      world.audio.crash();
      world.addWanted(3, 'traffic hit');
    }
  }
  car.x = Math.max(24, Math.min(WORLD.w - 24, car.x));
  car.y = Math.max(24, Math.min(2516, car.y));
  p.x = car.x;
  p.y = car.y;
  p.angle = car.angle;
  p.speed = Math.abs(car.speed);
  if (prevX === car.x && prevY === car.y) p.speed = Math.abs(car.speed);
  if (input.pressed('KeyE')) exitCar(world);
}

export function enterCar(world, car) {
  const p = world.player;
  if (car.type === 'traffic' && car.driver) {
    // Carjacking: the driver bails out and runs, the law notices.
    car.driver = false;
    world.addWanted(20, 'car stolen');
    const driver = world.peds.find((pd) => pd.state === 'walk' && Math.hypot(pd.x - car.x, pd.y - car.y) < 40);
    if (driver) { driver.state = 'flee'; driver.panic = 3; }
    world.events.push({ type: 'banner', text: 'Car stolen — the law is watching', color: '#ff9d4e' });
    world.audio.wantedUp();
  }
  if (car.type === 'taxi') {
    // Taking a taxi by force is still a carjacking — the meter does not run.
    car.driver = false;
    world.addWanted(20, 'taxi stolen');
    world.events.push({ type: 'banner', text: 'Taxi stolen — the law is watching', color: '#ff9d4e' });
    world.audio.wantedUp();
  }
  p.inCar = car;
  p.car = car;
  car.type = car.type === 'police' ? 'police' : 'player';
  world.audio.ensure();
}

export function exitCar(world) {
  const p = world.player;
  if (!p.car) return;
  const car = p.car;
  const a = car.angle + Math.PI / 2;
  p.x = car.x + Math.cos(a) * 30;
  p.y = car.y + Math.sin(a) * 30;
  const fixed = collideCircle(world.city, p.x, p.y, 14);
  p.x = fixed.x; p.y = fixed.y;
  p.inCar = null;
  p.car = null;
  car.speed = 0;
}

function punch(world) {
  const p = world.player;
  world.audio.punch();
  const px = p.x + Math.cos(p.angle) * 30;
  const py = p.y + Math.sin(p.angle) * 30;
  spawnParticles(world, px, py, { count: 4, color: '#fff', speed: 80, life: 0.25 });
  let hit = false;
  for (const ped of world.peds) {
    if (ped.state === 'down') continue;
    const d = Math.hypot(ped.x - p.x, ped.y - p.y);
    const a = Math.atan2(ped.y - p.y, ped.x - p.x);
    let diff = a - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (d < TUNE.punchRange && Math.abs(diff) < 1.1) {
      ped.health -= TUNE.punchDamage;
      ped.x += Math.cos(a) * 14;
      ped.y += Math.sin(a) * 14;
      hit = true;
      if (ped.state === 'cop') world.addWanted(30, 'cop hit');
      if (ped.health <= 0) {
        const wasGang = ped.state === 'gang';
        ped.state = 'down';
        if (wasGang) world.missions.onGangDown(ped);
        if (ped.state === 'down' && (wasGang || ped.color === '#1a2a4a')) world.addWanted(25, 'someone down');
        spawnParticles(world, ped.x, ped.y, { count: 8, color: '#c94f4f', speed: 100 });
      }
    }
  }
  // Punching a car door dents it and draws a little heat.
  for (const car of world.cars) {
    if (car.dead) continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < TUNE.punchRange + 6) {
      damageCar(world, car, 4);
      hit = true;
    }
  }
  if (!hit) {
    // A swing at nothing still counts as a swing.
  }
}

function shoot(world, mouseWorld) {
  const p = world.player;
  p.ammo -= 1;
  world.gunshotTimer = 1.2;
  world.audio.shoot();
  const a = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
  p.angle = a;
  const range = TUNE.pistolRange;
  let hitX = p.x + Math.cos(a) * range;
  let hitY = p.y + Math.sin(a) * range;
  let hitPed = null;
  let bestT = 1;
  for (const ped of world.peds) {
    if (ped.state === 'down') continue;
    const dx = ped.x - p.x;
    const dy = ped.y - p.y;
    const t = (dx * Math.cos(a) + dy * Math.sin(a)) / range;
    if (t < 0 || t > bestT) continue;
    const perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
    if (perp < 20) { bestT = t; hitPed = ped; }
  }
  if (hitPed) {
    hitX = hitPed.x; hitY = hitPed.y;
    hitPed.health -= TUNE.pistolDamage;
    spawnParticles(world, hitX, hitY, { count: 8, color: '#c94f4f', speed: 110 });
    if (hitPed.state === 'cop') world.addWanted(30, 'cop shot');
    if (hitPed.health <= 0) {
      const wasGang = hitPed.state === 'gang';
      hitPed.state = 'down';
      if (wasGang) world.missions.onGangDown(hitPed);
      world.addWanted(25, 'someone shot');
    }
  }
  // A tracer line the render step draws for a moment.
  world.tracers.push({ x1: p.x, y1: p.y, x2: hitX, y2: hitY, life: 0.08 });
  spawnParticles(world, p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 22, { count: 4, color: '#ffd34e', speed: 60, life: 0.15 });
  world.addWanted(8, 'shots fired');
}
