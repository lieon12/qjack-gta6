// Drawing the world: sun-soaked streets, pastel buildings with height shadows,
// palms, the beach and the ocean, the neon Strip, the Marina and its boats,
// then every car, pedestrian, helicopter and effect. The camera follows the
// player; everything is drawn on one canvas. Last of all come the sky's
// overlays — the dark of night, rain streaks, fog — painted over the frame
// so the same city reads differently at dawn, in a storm, and at midnight.
import { WORLD, STREETS_Y, AVENUES_X, ROAD_W, BEACH_Y, WATER_Y, PARK, DOCKS, PLACES, PALETTE, STRIP, MARINA } from './config.js';
import { PIER } from './city.js';
import { drawModelBody } from './vehicles.js';

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
  const night = world.sky.darkness();
  const raining = world.sky.weather === 'rain';
  const foggy = world.sky.weather === 'fog';

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

  // The Marina: a wooden pier out over the water and the moored boats.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(PIER.x, PIER.y, PIER.w, PIER.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  for (let y = PIER.y + 18; y < PIER.y + PIER.h; y += 18) {
    ctx.beginPath(); ctx.moveTo(PIER.x, y); ctx.lineTo(PIER.x + PIER.w, y); ctx.stroke();
  }
  for (const boat of world.city.boats) {
    if (!inView(boat.x, boat.y, 60)) continue;
    const bob = Math.sin(world.time * 1.2 + boat.bob) * 2;
    ctx.save();
    ctx.translate(boat.x, boat.y + bob);
    ctx.rotate(boat.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(2, 4, boat.len / 2, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.moveTo(-boat.len / 2, 0);
    ctx.lineTo(boat.len / 2, -8);
    ctx.lineTo(boat.len / 2, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.restore();
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
    if (b.casino) {
      // Neon casino sign: pink by day, glowing hard at night.
      const glow = 0.55 + night * 0.45 + Math.sin(world.time * 3 + b.x) * 0.08;
      ctx.save();
      ctx.globalAlpha = Math.max(0.35, Math.min(1, glow));
      ctx.fillStyle = PALETTE.neonPink;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CASINO', b.x + b.w / 2, b.y - lift + 22);
      ctx.fillStyle = PALETTE.neonCyan;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('$ $ $', b.x + b.w / 2, b.y - lift + 38);
      ctx.restore();
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
    [PLACES.casino, 'GRAND CASINO', '#ff4fd8'],
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

  // Cars, drawn by model.
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

  // The player, ringed so the eye finds them instantly.
  const p = world.player;
  if (!p.inCar) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 20 + Math.sin(world.time * 3) * 2, 0, Math.PI * 2); ctx.stroke();
    drawPerson(ctx, p.x, p.y, p.angle, '#f2f2f2', '#d94f3d', true);
  }

  // Police helicopters: searchlight cone first, then the machine itself.
  for (const heli of world.helis) {
    if (!inView(heli.x, heli.y, 160)) continue;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    const grad = ctx.createRadialGradient(px, py, 8, px, py, heli.spotlightR);
    grad.addColorStop(0, 'rgba(255,244,180,0.4)');
    grad.addColorStop(1, 'rgba(255,244,180,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(px, py, heli.spotlightR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(heli.x + 10, heli.y + 14, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(heli.x, heli.y);
    ctx.rotate(heli.angle);
    ctx.fillStyle = '#1a2a4a';
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath(); ctx.ellipse(6, 0, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(20,30,40,0.85)';
    ctx.beginPath(); ctx.ellipse(16, 0, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    const r = heli.rotor;
    ctx.beginPath(); ctx.moveTo(Math.cos(r) * 34, Math.sin(r) * 34); ctx.lineTo(-Math.cos(r) * 34, -Math.sin(r) * 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Math.cos(r + Math.PI / 2) * 30, Math.sin(r + Math.PI / 2) * 30); ctx.lineTo(-Math.cos(r + Math.PI / 2) * 30, -Math.sin(r + Math.PI / 2) * 30); ctx.stroke();
    ctx.restore();
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

  // --- Sky overlays, painted over the whole frame in screen space. ---
  if (night > 0.01) {
    // The dark of night, blue rather than black, so the city stays readable.
    ctx.fillStyle = `rgba(8,12,38,${night.toFixed(3)})`;
    ctx.fillRect(0, 0, viewW, viewH);
    // Streetlights glow at the intersections once it is properly dark.
    if (night > 0.25) {
      for (const sy of STREETS_Y) {
        for (const ax of AVENUES_X) {
          const sx = viewW / 2 + (ax - cam.x) * zoom;
          const sy2 = viewH / 2 + (sy - cam.y) * zoom;
          if (sx < -20 || sx > viewW + 20 || sy2 < -20 || sy2 > viewH + 20) continue;
          const g2 = ctx.createRadialGradient(sx, sy2, 2, sx, sy2, 46);
          g2.addColorStop(0, `rgba(255,214,120,${(0.28 * night).toFixed(3)})`);
          g2.addColorStop(1, 'rgba(255,214,120,0)');
          ctx.fillStyle = g2;
          ctx.fillRect(sx - 46, sy2 - 46, 92, 92);
        }
      }
    }
  }
  if (raining) {
    // Rain streaks, slanted by the wind, plus the odd splash ring.
    ctx.strokeStyle = 'rgba(200,220,255,0.5)';
    ctx.lineWidth = 1;
    const t = world.time;
    for (let i = 0; i < 70; i += 1) {
      const x = ((i * 97 + t * 420) % (viewW + 80)) - 40;
      const y = ((i * 173 + t * 620) % (viewH + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 7, y + 16);
      ctx.stroke();
    }
  }
  if (foggy) {
    ctx.fillStyle = 'rgba(210,220,225,0.20)';
    ctx.fillRect(0, 0, viewW, viewH);
    const g = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.2, viewW / 2, viewH / 2, viewH * 0.75);
    g.addColorStop(0, 'rgba(210,220,225,0)');
    g.addColorStop(1, 'rgba(210,220,225,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  if (night <= 0.01 && !raining && !foggy) {
    // Warm sun glare, drawn over the whole frame on a clear day.
    const g = ctx.createRadialGradient(viewW * 0.82, viewH * 0.08, 40, viewW * 0.82, viewH * 0.08, viewW * 0.75);
    g.addColorStop(0, 'rgba(255,236,170,0.14)');
    g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

function drawCar(ctx, car, world) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  const len = car.len || 42;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, -len / 2 + 1, -9 + 4, len, 22, 7);
  ctx.fill();
  drawModelBody(ctx, car.model || 'sedan', len, 20, car.color, car.type === 'police', world.time);
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
