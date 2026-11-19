// Drawing the world: sun-soaked streets, pastel buildings with height shadows,
// palms, the beach and the ocean, then every car, pedestrian and effect.
// The camera follows the player; everything is drawn on one canvas.
import { WORLD, STREETS_Y, AVENUES_X, ROAD_W, BEACH_Y, WATER_Y, PARK, DOCKS, PLACES, PALETTE, STRIP, CASINO_ROW, MARINA } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, world, viewW, viewH) {
  const cam = world.camera;
  const zoom = cam.zoom;
  const vx0 = cam.x - viewW / 2 / zoom;
  const vy0 = cam.y - viewH / 2 / zoom;
  const vx1 = cam.x + viewW / 2 / zoom;
  const vy1 = cam.y + viewH / 2 / zoom;
  const inView = (x, y, m = 80) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;

  ctx.save();
  ctx.translate(viewW / 2, viewH / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);

  // Ground: grass everywhere, sand and water along the south edge.
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(vx0 - 10, vy0 - 10, vx1 - vx0 + 20, vy1 - vy0 + 20);
  if (vy1 > BEACH_Y) {
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(vx0 - 10, BEACH_Y, vx1 - vx0 + 20, WATER_Y - BEACH_Y);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(vx0 - 10, WATER_Y, vx1 - vx0 + 20, vy1 - WATER_Y + 10);
    // Shimmer lines on the water.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    const t = world.time;
    for (let i = 0; i < 14; i += 1) {
      const y = WATER_Y + 12 + ((i * 37 + t * 12) % 70);
      const x = vx0 + ((i * 271) % Math.max(1, vx1 - vx0));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 46, y);
      ctx.stroke();
    }
  }

  // Central park.
  ctx.fillStyle = '#6fae56';
  ctx.fillRect(PARK.x, PARK.y, PARK.w, PARK.h);
  ctx.fillStyle = '#7fc4d9';
  ctx.beginPath();
  ctx.ellipse(PARK.x + PARK.w / 2, PARK.y + PARK.h / 2, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const tr of world.city.trees) {
    if (!inView(tr.x, tr.y)) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.arc(tr.x + 4, tr.y + 5, tr.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f7d3d';
    ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4da34d';
    ctx.beginPath(); ctx.arc(tr.x - 3, tr.y - 3, tr.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  // Docks: concrete yard and shipping containers.
  ctx.fillStyle = '#9aa1a8';
  ctx.fillRect(DOCKS.x, DOCKS.y, DOCKS.w, DOCKS.h);
  for (const c of world.city.containers) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath(); ctx.moveTo(c.x + (c.w / 4) * i, c.y); ctx.lineTo(c.x + (c.w / 4) * i, c.y + c.h); ctx.stroke();
    }
  }

  // New districts: the Strip's neon pavement, the Casino row's gold forecourt,
  // and the Marina's piers and moored boats on the water's edge.
  ctx.fillStyle = 'rgba(232,111,184,0.16)';
  ctx.fillRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
  ctx.fillStyle = 'rgba(255,211,78,0.14)';
  ctx.fillRect(CASINO_ROW.x, CASINO_ROW.y, CASINO_ROW.w, CASINO_ROW.h);
  ctx.fillStyle = 'rgba(127,196,217,0.18)';
  ctx.fillRect(MARINA.x, MARINA.y, MARINA.w, MARINA.h);
  for (const pier of world.city.piers || []) {
    ctx.fillStyle = '#8a6b46';
    ctx.fillRect(pier.x, pier.y, pier.w, pier.h);
    ctx.fillStyle = '#a8875e';
    ctx.fillRect(pier.x, pier.y, pier.w, 8);
  }
  for (const boat of world.city.boats || []) {
    if (!inView(boat.x, boat.y, 60)) continue;
    ctx.save();
    ctx.translate(boat.x, boat.y);
    ctx.rotate(boat.angle);
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,40,0.7)';
    ctx.fillRect(-8, -5, 16, 10);
    ctx.restore();
  }
  for (const neon of world.city.stripNeon || []) {
    if (!inView(neon.x, neon.y, 80)) continue;
    ctx.fillStyle = neon.color;
    ctx.fillRect(neon.x, neon.y, neon.w, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(neon.x, neon.y + 10, neon.w, 4);
  }

  // Roads: asphalt, sidewalks, dashed centre lines.
  ctx.fillStyle = PALETTE.sidewalk;
  for (const sy of STREETS_Y) ctx.fillRect(vx0 - 10, sy - ROAD_W / 2 - 8, vx1 - vx0 + 20, ROAD_W + 16);
  for (const ax of AVENUES_X) ctx.fillRect(ax - ROAD_W / 2 - 8, vy0 - 10, ROAD_W + 16, vy1 - vy0 + 20);
  ctx.fillStyle = PALETTE.road;
  for (const sy of STREETS_Y) ctx.fillRect(vx0 - 10, sy - ROAD_W / 2, vx1 - vx0 + 20, ROAD_W);
  for (const ax of AVENUES_X) ctx.fillRect(ax - ROAD_W / 2, vy0 - 10, ROAD_W, vy1 - vy0 + 20);
  ctx.strokeStyle = PALETTE.lane;
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 26]);
  for (const sy of STREETS_Y) {
    ctx.beginPath(); ctx.moveTo(vx0, sy); ctx.lineTo(vx1, sy); ctx.stroke();
  }
  for (const ax of AVENUES_X) {
    ctx.beginPath(); ctx.moveTo(ax, vy0); ctx.lineTo(ax, vy1); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Street name labels, drawn small on the road.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const streetNames = ['Sunset Blvd', 'Calle Sol', 'Bayfront Ave', 'Palm Row', 'Marlin St', 'Coral Way', 'Ocean Drive'];
  STREETS_Y.forEach((sy, i) => {
    if (sy > vy0 && sy < vy1) ctx.fillText(streetNames[i] || '', 620, sy + 4);
  });

  // Buildings: drop shadow, wall side for height, roof with windows.
  for (const b of world.city.buildings) {
    if (!inView(b.x + b.w / 2, b.y + b.h / 2, 120)) continue;
    const lift = b.tall * 7;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.wall;
    ctx.fillRect(b.x, b.y - lift, b.w, b.h + lift);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x, b.y - lift, b.w, b.h);
    // Roof windows.
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    const cols = Math.max(1, Math.floor(b.w / 26));
    const rows = Math.max(1, Math.floor(b.h / 26));
    for (let cx = 0; cx < cols; cx += 1) {
      for (let cy = 0; cy < rows; cy += 1) {
        ctx.fillRect(b.x + 8 + cx * 26, b.y - lift + 8 + cy * 26, 12, 9);
      }
    }
    if (b.hotel) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOTEL', b.x + b.w / 2, b.y - lift + 22);
    }
  }

  // Palm trees.
  for (const palm of world.city.palms) {
    if (!inView(palm.x, palm.y)) continue;
    ctx.strokeStyle = PALETTE.palmTrunk;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(palm.x, palm.y);
    ctx.lineTo(palm.x + palm.lean * 30, palm.y - 26);
    ctx.stroke();
    ctx.fillStyle = PALETTE.palm;
    for (let f = 0; f < 5; f += 1) {
      const a = (f / 5) * Math.PI * 2 + palm.lean;
      ctx.beginPath();
      ctx.ellipse(palm.x + palm.lean * 30 + Math.cos(a) * 12, palm.y - 26 + Math.sin(a) * 8, 13, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Named-place signs.
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const signs = [
    [PLACES.rosaGarage, "ROSA'S GARAGE", '#ffd34e'],
    [PLACES.ironworks, 'IRONWORKS', '#e8e8e8'],
    [PLACES.hospital, 'SOLMAR GENERAL', '#fff'],
    [PLACES.marlinHotel, 'MARLIN HOTEL', '#ffd34e'],
    [PLACES.bank, 'SOLMAR TRUST', '#e8e8e8'],
    [PLACES.casino, 'SOLMAR GRAND CASINO', '#ffd34e'],
    [PLACES.strip, 'THE STRIP', '#e86fb8'],
    [PLACES.marina, 'SOLMAR MARINA', '#7fc4d9'],
  ];
  for (const [place, label, color] of signs) {
    if (!inView(place.x, place.y, 200)) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const w = ctx.measureText(label).width + 16;
    roundRect(ctx, place.x - w / 2, place.y - 52, w, 22, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillText(label, place.x, place.y - 37);
  }

  // Cash pickups.
  for (const c of world.cashPickups) {
    if (!inView(c.x, c.y)) continue;
    const pulse = 1 + Math.sin(world.time * 5) * 0.15;
    ctx.fillStyle = 'rgba(127,214,127,0.35)';
    ctx.beginPath(); ctx.arc(c.x, c.y, 18 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f7d3d';
    ctx.beginPath(); ctx.arc(c.x, c.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('$', c.x, c.y + 5);
  }

  // Mission marker: a pulsing beacon the player can always find.
  const marker = world.missions.objective();
  if (marker.x !== null && marker.y !== null) {
    const pulse = 1 + Math.sin(world.time * 4) * 0.18;
    ctx.strokeStyle = '#ffd34e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 26 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,211,78,0.25)';
    ctx.beginPath(); ctx.arc(marker.x, marker.y, 26 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd34e';
    ctx.beginPath();
    ctx.moveTo(marker.x, marker.y - 34);
    ctx.lineTo(marker.x - 10, marker.y - 52);
    ctx.lineTo(marker.x + 10, marker.y - 52);
    ctx.closePath();
    ctx.fill();
  }

  // Taxi markers: a yellow ring on the waiting passenger, a green ring on
  // the destination while a fare is running.
  if (world.taxi) {
    const t = world.taxi;
    if (t.passenger) {
      ctx.strokeStyle = '#ffd34e';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(t.passenger.x, t.passenger.y, 24 + Math.sin(world.time * 5) * 4, 0, Math.PI * 2); ctx.stroke();
    }
    if (t.dest) {
      ctx.strokeStyle = '#7fd67f';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(t.dest.x, t.dest.y, 26 + Math.sin(world.time * 5) * 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(127,214,127,0.2)';
      ctx.beginPath(); ctx.arc(t.dest.x, t.dest.y, 26, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Cars.
  for (const car of world.cars) {
    if (car.dead && car.type !== 'van') continue;
    if (!inView(car.x, car.y, 60)) continue;
    drawCar(ctx, car, world);
  }

  // Pedestrians.
  for (const ped of world.peds) {
    if (!inView(ped.x, ped.y, 40)) continue;
    drawPed(ctx, ped);
  }

  // The police helicopter, rotor spinning, spotlight cone on the player.
  if (world.heli) {
    const h = world.heli;
    const px = world.player.x;
    const py = world.player.y;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#fff8c9';
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    ctx.lineTo(px - 40, py - 30);
    ctx.lineTo(px + 40, py - 30);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,248,201,0.5)';
    ctx.beginPath(); ctx.arc(px, py, 26, 0, Math.PI * 2); ctx.fill();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(4, 5, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2a4a';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath(); ctx.ellipse(12, 0, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a2a4a';
    ctx.lineWidth = 3;
    const r = h.rotor;
    ctx.beginPath(); ctx.moveTo(Math.cos(r) * -34, Math.sin(r) * -34); ctx.lineTo(Math.cos(r) * 34, Math.sin(r) * 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(r + Math.PI / 2) * -34, Math.sin(r + Math.PI / 2) * -34); ctx.lineTo(Math.cos(r + Math.PI / 2) * 34, Math.sin(r + Math.PI / 2) * 34); ctx.stroke();
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // The player, ringed so the eye finds them instantly.
  const p = world.player;
  if (!p.inCar) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 20 + Math.sin(world.time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
    drawPerson(ctx, p.x, p.y, p.angle, '#f2f2f2', '#d94f3d', true);
  }

  // Tracers and particles.
  for (const t of world.tracers) {
    ctx.strokeStyle = `rgba(255,211,78,${Math.max(0, t.life / 0.08)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke();
  }
  for (const pt of world.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife) * (pt.smoke ? 0.5 : 0.9);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Day / night: the sky darkens after 18:00 and lifts again after 06:00,
  // with a cold moon glow at night instead of the warm sun glare.
  const dark = world.darkness ? world.darkness() : 0;
  if (dark > 0) {
    ctx.fillStyle = `rgba(8,10,40,${(dark * 0.45).toFixed(3)})`;
    ctx.fillRect(0, 0, viewW, viewH);
    const mg = ctx.createRadialGradient(viewW * 0.18, viewH * 0.12, 20, viewW * 0.18, viewH * 0.12, viewW * 0.4);
    mg.addColorStop(0, `rgba(200,220,255,${(dark * 0.12).toFixed(3)})`);
    mg.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, viewW, viewH);
  } else {
    const g = ctx.createRadialGradient(viewW * 0.82, viewH * 0.08, 40, viewW * 0.82, viewH * 0.08, viewW * 0.75);
    g.addColorStop(0, 'rgba(255,236,170,0.14)');
    g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  // Weather: rain streaks slant across the frame; fog is a pale wash that
  // shortens how far the player can read the street.
  if (world.weather) {
    if (world.weather.rain) {
      ctx.strokeStyle = 'rgba(180,200,220,0.45)';
      ctx.lineWidth = 1;
      const t = world.time * 900;
      for (let i = 0; i < 60; i += 1) {
        const x = ((i * 173 + t) % (viewW + 40)) - 20;
        const y = (i * 97 + t * 1.4) % viewH;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); ctx.stroke();
      }
    } else if (world.weather.id === 'fog') {
      ctx.fillStyle = 'rgba(200,205,215,0.28)';
      ctx.fillRect(0, 0, viewW, viewH);
    } else if (world.weather.id === 'cloudy') {
      ctx.fillStyle = 'rgba(120,130,150,0.10)';
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }
}

function drawCar(ctx, car, world) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  // Each model has its own length and width, so a limo reads long and a
  // speedster reads low and wide next to a boxy van.
  const len = car.modelLen || 40;
  const wid = car.modelW || 20;
  const halfL = len / 2;
  const halfW = wid / 2;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, -halfL + 1, -halfW + 5, len, wid + 2, 7);
  ctx.fill();
  const isPolice = car.type === 'police';
  ctx.fillStyle = isPolice ? PALETTE.policeWhite : car.color;
  roundRect(ctx, -halfL, -halfW, len, wid, 7);
  ctx.fill();
  // Model stripe down the body; the taxi gets its checker band instead.
  if (car.modelId === 'taxi' || car.type === 'taxi') {
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 5; i += 1) ctx.fillRect(-halfL + 4 + i * 7, -halfW, 4, 5);
    ctx.fillStyle = '#ffd34e';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, 3);
  } else if (car.modelStripe) {
    ctx.fillStyle = car.modelStripe;
    ctx.fillRect(-halfL + 4, -3, len - 8, 6);
  }
  if (car.modelId === 'speedster') {
    // Rear spoiler.
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-halfL - 2, -halfW - 2, 4, wid + 4);
  }
  if (car.modelId === 'limo') {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-4, -halfW + 2, 3, wid - 4);
  }
  if (isPolice) {
    ctx.fillStyle = PALETTE.policeBlack;
    ctx.fillRect(-4, -10, 10, 20);
    ctx.fillStyle = '#2b6cb0';
    ctx.fillRect(-8, -10, 4, 20);
    // Flashing light bar.
    const flash = Math.floor(world.time * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2a2a' : '#2a6bff';
    ctx.fillRect(-14, -8, 6, 5);
    ctx.fillStyle = flash ? '#2a6bff' : '#ff2a2a';
    ctx.fillRect(-14, 3, 6, 5);
  }
  // Windshield and roof.
  ctx.fillStyle = 'rgba(20,30,40,0.85)';
  ctx.fillRect(2, -8, 8, 16);
  ctx.fillStyle = isPolice ? '#dfe6ea' : 'rgba(255,255,255,0.25)';
  ctx.fillRect(-8, -7, 7, 14);
  // Headlights.
  ctx.fillStyle = '#fff8c9';
  ctx.fillRect(19, -8, 2, 4);
  ctx.fillRect(19, 4, 2, 4);
  if (car.type === 'van') {
    ctx.fillStyle = '#c8a24a';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TRUST', 0, 3);
  }
  if (car.getaway) {
    ctx.fillStyle = '#ffd34e';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GT', 0, 3);
  }
  if (car.smoking) {
    ctx.fillStyle = 'rgba(80,80,80,0.6)';
    ctx.beginPath(); ctx.arc(-14, -6, 5 + Math.sin(world.time * 9) * 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPed(ctx, ped) {
  if (ped.state === 'down') {
    // Lying flat.
    ctx.fillStyle = ped.color;
    ctx.beginPath(); ctx.ellipse(ped.x, ped.y, 14, 7, ped.angle, 0, Math.PI * 2); ctx.fill();
    return;
  }
  drawPerson(ctx, ped.x, ped.y, ped.angle, ped.color, ped.state === 'cop' ? '#101c30' : ped.state === 'gang' ? '#1d3557' : '#3a3a3a', false);
}

function drawPerson(ctx, x, y, angle, shirt, pants, isPlayer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(2, 3, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Body.
  ctx.fillStyle = shirt;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  // Head / cap.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(5, 0, 6, 0, Math.PI * 2); ctx.fill();
  if (isPlayer) {
    ctx.fillStyle = '#d94f3d';
    ctx.beginPath(); ctx.arc(5, 0, 6, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
  }
  // Direction tick.
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(15, 0); ctx.stroke();
  ctx.restore();
}
