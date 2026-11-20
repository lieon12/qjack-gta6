// The Solmar Bay PD helicopter: it joins the chase from three wanted stars.
// It never lands. It hangs in the air above the player, drifts on a slow
// circle so it never sits dead still, and trains a searchlight on the
// player's position — the bright ring on the ground is the thing the foot
// cops steer toward. Shooting it down is not a thing; losing the cops on the
// ground is what makes it leave.
import { TUNE } from './config.js';

export function makeHeli(x, y, id) {
  return {
    kind: 'heli',
    x, y,
    angle: 0, // the direction the nose points
    rotor: 0, // rotor spin, for the drawing
    drift: Math.random() * Math.PI * 2, // phase of the slow circling drift
    spotlightR: 90, // radius of the searchlight ring on the ground
    id: id || 0,
  };
}

// One helicopter at most: it is the eye in the sky, not a swarm.
export function spawnHeli(world) {
  const p = world.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  const heli = makeHeli(px - 120, py - 180, world.nextId());
  world.helis.push(heli);
  world.events.push({ type: 'banner', text: 'Police helicopter overhead — lose the cops!', color: '#ff5a4e' });
  return heli;
}

export function updateHeli(world, heli, dt) {
  const p = world.player;
  const px = p.inCar ? p.car.x : p.x;
  const py = p.inCar ? p.car.y : p.y;
  // Drift in a slow circle around the player, 130 px out, and keep the nose
  // on them; the rotor spins fast the whole time.
  heli.drift += dt * 0.5;
  const tx = px + Math.cos(heli.drift) * 130;
  const ty = py + Math.sin(heli.drift) * 130 - 40;
  heli.x += (tx - heli.x) * Math.min(1, dt * 1.6);
  heli.y += (ty - heli.y) * Math.min(1, dt * 1.6);
  heli.angle = Math.atan2(py - heli.y, px - heli.x);
  heli.rotor += dt * 26;
  // The searchlight tightens on the player as the wanted level climbs.
  heli.spotlightR = 110 - world.wanted * 6;
}

// How many helicopters the wanted level calls for: none below three stars,
// one from three up. The world checks this every step.
export function heliTargetCount(wanted) {
  return wanted >= TUNE.heliWanted ? 1 : 0;
}
