// The six vehicle models: what each one is, how it drives, and how it looks.
// A car carries its model's key; everything that needs its behaviour (top
// speed, acceleration, turning, length, toughness) reads it from here, and
// the renderer draws each model with its own silhouette so a Comet GT, a
// Pickup and a Limo are easy to tell apart at a glance.
import { VEHICLES, VEHICLE_MODELS } from './config.js';
import { pick } from './random.js';

// The stats of a model, with a safe fallback to the sedan.
export function modelStats(key) {
  return VEHICLES[key] || VEHICLES.sedan;
}

// A model for a car the world is spawning: taxis stay taxis, police cars
// stay sedans, and everything else is a weighted draw — taxis are rarer on
// the road than ordinary cars, so hailing one takes a little looking.
export function pickModel(rng, type) {
  if (type === 'taxi') return 'taxi';
  if (type === 'police') return 'sedan';
  if (type === 'van') return 'pickup';
  const roll = rng();
  if (roll < 0.10) return 'taxi';
  if (roll < 0.22) return 'comet';
  if (roll < 0.38) return 'hatch';
  if (roll < 0.52) return 'pickup';
  if (roll < 0.60) return 'limo';
  return 'sedan';
}

// A model for a parked car: the same draw, but never a taxi (taxis cruise;
// they do not sit parked) and never a limo in the cheap rows.
export function pickParkedModel(rng) {
  return pick(rng, ['comet', 'sedan', 'hatch', 'pickup', 'sedan', 'comet']);
}

// Paint a car body for its model. The caller has already translated and
// rotated the context so the car points east; len is the model's length and
// wid its width. Each model gets its own roof line and details:
//   comet   — low, long bonnet, rear spoiler
//   sedan   — the plain four-door box
//   taxi    — sedan body, checker band, roof sign
//   pickup  — long bed at the back, cab up front
//   hatch   — short, tall roof, rounded back
//   limo    — stretched, two roofs, long and slow to turn
export function drawModelBody(ctx, model, len, wid, color, isPolice, time) {
  const half = len / 2;
  const hw = wid / 2;
  ctx.fillStyle = isPolice ? '#e8e8e8' : color;
  ctx.beginPath();
  ctx.roundRect(-half, -hw, len, wid, 7);
  ctx.fill();
  if (isPolice) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-4, -hw, 10, wid);
    ctx.fillStyle = '#2b6cb0';
    ctx.fillRect(-9, -hw, 4, wid);
    const flash = Math.floor(time * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2a2a' : '#2a6bff';
    ctx.fillRect(-half + 6, -hw + 1, 6, 5);
    ctx.fillStyle = flash ? '#2a6bff' : '#ff2a2a';
    ctx.fillRect(-half + 6, hw - 6, 6, 5);
  }
  if (model === 'pickup') {
    // Open bed at the back, cab with a windshield up front.
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(half - 16, -hw + 3, 10, wid - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-half + 4, -hw + 3, len - 24, wid - 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-half + 4, -hw + 3, len - 24, wid - 6);
  } else if (model === 'hatch') {
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(2, -hw + 2, 8, wid - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(-half + 6, -hw + 3, 12, wid - 6, 4);
    ctx.fill();
  } else if (model === 'limo') {
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(half - 14, -hw + 2, 8, wid - 4);
    ctx.fillRect(-2, -hw + 2, 8, wid - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(-half + 8, -hw + 3, 12, wid - 6);
    ctx.fillRect(half - 26, -hw + 3, 10, wid - 6);
  } else if (model === 'comet') {
    // Long bonnet, spoiler lip at the back.
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(0, -hw + 2, 8, wid - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-half + 8, -hw + 3, 8, wid - 6);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-half - 1, -hw + 1, 3, wid - 2);
  } else {
    // Sedan and taxi share the plain body.
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(2, -hw + 2, 8, wid - 4);
    ctx.fillStyle = isPolice ? '#dfe6ea' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(-half + 8, -hw + 3, 7, wid - 6);
  }
  if (model === 'taxi' && !isPolice) {
    // Checker band along the side and a lit roof sign.
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 6; i += 1) {
      ctx.fillRect(-half + 6 + i * 5, -hw + 1, 3, 3);
      ctx.fillRect(-half + 6 + i * 5, hw - 4, 3, 3);
    }
    ctx.fillStyle = '#fff8c9';
    ctx.fillRect(-6, -hw - 3, 12, 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, -hw - 4);
  }
  // Headlights.
  ctx.fillStyle = '#fff8c9';
  ctx.fillRect(half - 1, -hw + 2, 2, 4);
  ctx.fillRect(half - 1, hw - 6, 2, 4);
}

export { VEHICLE_MODELS };
