// Screenshot scenes behind ?shot=chase|street|heist|beach.
// Each scene sets up a real game state through the game's own rules (entering
// a car, raising the wanted level, starting a mission) and then plays it
// forward with a scripted autopilot, so the frame is what a short session
// really looks like — and the same seed always gives the same frame.
import { PLACES } from './config.js';
import { makeCar, makePed } from './entities.js';
import { enterCar } from './player.js';

const STEP = 1 / 60;

// A fake input object with the same shape the world reads.
function scriptedInput() {
  const keys = new Set();
  return {
    keys,
    mouse: { x: 640, y: 360, down: false, clicked: false },
    anyKey: false,
    down: (...codes) => codes.some((c) => keys.has(c)),
    pressed: () => false,
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    endFrame() {},
  };
}

// Steer a car toward a point: W to accelerate, A/D to turn. It keeps
// accelerating until it is almost on the target, so a ram actually lands;
// when the target ends up right behind, it reverses toward it instead of
// spinning around (reversing keeps the car on the road).
function driveToward(input, world, tx, ty) {
  const car = world.player.car;
  if (!car) return;
  const dx = tx - car.x;
  const dy = ty - car.y;
  const dist = Math.hypot(dx, dy);
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - car.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  input.keys.clear();
  if (Math.abs(diff) > 2.2 && dist < 220) {
    input.keys.add('KeyS');
    if (diff > 0) input.keys.add('KeyD'); else input.keys.add('KeyA');
    if (car.speed > 50) input.keys.add('Space');
    return;
  }
  if (dist > 40) input.keys.add('KeyW');
  if (diff > 0.25) input.keys.add('KeyD');
  else if (diff < -0.25) input.keys.add('KeyA');
}

// Walk toward a point on foot.
function walkToward(input, world, tx, ty) {
  const p = world.player;
  const dx = tx - p.x;
  const dy = ty - p.y;
  input.keys.clear();
  if (dx > 30) input.keys.add('KeyD');
  if (dx < -30) input.keys.add('KeyA');
  if (dy > 30) input.keys.add('KeyS');
  if (dy < -30) input.keys.add('KeyW');
  input.keys.add('ShiftLeft');
}

function putPlayerInCar(world, x, y, color) {
  const car = makeCar(x, y, 0, { type: 'parked', color, rng: world.rng, id: world.nextId() });
  car.driver = false;
  world.cars.push(car);
  world.player.x = x;
  world.player.y = y + 30;
  enterCar(world, car);
  return car;
}

function runSteps(world, input, seconds, mouseWorld) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i += 1) {
    world.step(STEP, input, mouseWorld || { x: world.player.x + 100, y: world.player.y });
  }
}

// 1 — a police chase: the player tears down Bayfront Ave in a red Comet
// with police cars on the bumper and wanted stars, on the way to Rosa's
// garage with the car they just stole (mission 1, stage 2).
function stageChase(world) {
  const input = scriptedInput();
  world.missions.start(0);
  world.dialog = null; // skip the intro card for the screenshot
  world.player.x = 1300;
  world.player.y = 1000;
  const car = putPlayerInCar(world, 1300, 1000, '#d94f3d');
  car.angle = 0;
  world.addWanted(60, 'chase');
  runSteps(world, input, 1.0);
  // Drive east along Bayfront Ave, weaving a little.
  for (let s = 0; s < 3 && world.player.car; s += 1) {
    const target = { x: world.player.car.x + 900, y: 1000 + Math.sin(world.time * 0.8) * 60 };
    for (let i = 0; i < 60; i += 1) {
      driveToward(input, world, target.x, target.y);
      world.step(STEP, input, { x: world.player.x + 100, y: world.player.y });
    }
  }
  world.banner = { text: `Wanted level ${world.wanted} — lose the cops!`, color: '#ff5a4e', t: 3 };
  return { screen: 'play' };
}

// 2 — on foot downtown: traffic, pedestrians, a police car cruising past.
function stageStreet(world) {
  const input = scriptedInput();
  world.player.x = 800;
  world.player.y = 600;
  world.player.angle = 0;
  world.addWanted(20, 'street');
  for (let i = 0; i < 6; i += 1) {
    const ped = makePed(700 + i * 60, 560 + (i % 2) * 80, { rng: world.rng, id: world.nextId() });
    world.peds.push(ped);
  }
  for (let i = 0; i < 4; i += 1) {
    runSteps(world, input, 0.5);
    walkToward(input, world, 1100, 600);
  }
  runSteps(world, input, 1.5);
  return { screen: 'play' };
}

// 3 — the big score in progress: the armored van is stopped and smoking,
// the cash is on the street, four wanted stars, cops closing in.
function stageHeist(world) {
  const input = scriptedInput();
  world.missions.start(4);
  world.dialog = null; // skip the intro card for the screenshot
  // Stage 1 (go to the bank) completes by standing at the bank.
  world.player.x = PLACES.bank.x;
  world.player.y = PLACES.bank.y;
  runSteps(world, input, 0.5);
  // Stage 2 (ram the van): chase it straight down Bayfront Ave. The trick
  // is speed matching — cruise just above the van's speed when close, so
  // each nudge lands instead of blowing past it. When the car overshoots
  // and the van ends up behind, brake to a crawl first, then turn around
  // on the road; turning at speed is what wedges a car into a building.
  const van = world.missions.van;
  const car = putPlayerInCar(world, van.x - 260, 1000, '#3d7bd9');
  car.angle = 0;
  let guard = 0;
  let lastX = car.x;
  let stuckFor = 0;
  while (world.missions.stage && world.missions.stage.type === 'ram' && guard < 200) {
    guard += 1;
    const v = world.missions.van;
    const c = world.player.car;
    if (!v || !c) break;
    for (let i = 0; i < 30; i += 1) {
      const cc = world.player.car;
      if (!cc) break;
      input.keys.clear();
      const dx = v.x - cc.x;
      const dy = v.y - cc.y;
      const dist = Math.hypot(dx, dy);
      const ta = Math.atan2(dy, dx);
      let diff = ta - cc.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 2.2 && dist < 220) {
        // The van is right behind: reverse toward it.
        input.keys.add('KeyS');
        if (diff > 0) input.keys.add('KeyD'); else input.keys.add('KeyA');
        if (cc.speed > 50) input.keys.add('Space');
      } else {
        const targetSpeed = dist < 200 ? 140 : 420;
        if (cc.speed < targetSpeed) input.keys.add('KeyW');
        else if (cc.speed > targetSpeed + 30) input.keys.add('Space');
        if (diff > 0.25) input.keys.add('KeyD');
        else if (diff < -0.25) input.keys.add('KeyA');
      }
      world.step(STEP, input, { x: world.player.x + 100, y: world.player.y });
    }
    if (world.player.car) {
      if (world.player.car.x - lastX < 20 && v.x > world.player.car.x - 20) {
        stuckFor += 1;
        input.keys.clear();
        input.keys.add('KeyS');
        input.keys.add('KeyA');
        runSteps(world, input, 0.8);
        input.keys.clear();
      } else {
        stuckFor = 0;
      }
      lastX = world.player.car.x;
      if (stuckFor > 3) break;
    }
  }
  // Grab the cash: step out of the car next to the stopped van.
  if (world.missions.van) {
    const v = world.missions.van;
    world.player.x = v.x + 30;
    world.player.y = v.y + 30;
    if (world.player.inCar) {
      world.player.inCar = null;
      world.player.car = null;
    }
    runSteps(world, input, 0.6);
  }
  world.banner = { text: `${world.wanted} stars — escape to the hideout with the cash!`, color: '#ff5a4e', t: 3 };
  return { screen: 'play' };
}

// 4 — a golden drive down Ocean Drive: beach, palms, hotels, the ocean.
function stageBeach(world) {
  const input = scriptedInput();
  const car = putPlayerInCar(world, 2900, 2320, '#f28c28');
  car.angle = Math.PI; // westbound, along the beach
  for (let s = 0; s < 4; s += 1) {
    for (let i = 0; i < 60; i += 1) {
      driveToward(input, world, world.player.car.x - 900, 2320);
      world.step(STEP, input, { x: world.player.x - 100, y: world.player.y });
    }
  }
  return { screen: 'play' };
}

export function stageShot(name, world) {
  world.dialog = null;
  if (name === 'chase') return stageChase(world);
  if (name === 'street') return stageStreet(world);
  if (name === 'heist') return stageHeist(world);
  if (name === 'beach') return stageBeach(world);
  return stageStreet(world);
}
