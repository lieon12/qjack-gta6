// The HUD and the menus: wanted stars, health, money, the minimap, the
// mission objective, prompts, banners, and the title / pause / game-over /
// dialog screens. Everything is drawn on the same canvas as the world, so
// the screenshots show the game exactly as a player sees it.
import { WORLD, TUNE, PLACES, districtAt } from './config.js';

function panel(ctx, x, y, w, h, alpha = 0.55) {
  ctx.fillStyle = `rgba(10,12,18,${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

export function drawHUD(ctx, world, viewW, viewH) {
  const p = world.player;
  const obj = world.missions.objective();

  // Wanted stars, top-left.
  panel(ctx, 14, 14, 190, 40);
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < world.wanted ? '#ffd34e' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', 24 + i * 34, 35);
  }

  // Mission objective, top-centre.
  const ow = Math.min(viewW - 420, 560);
  panel(ctx, (viewW - ow) / 2, 14, ow, 40);
  ctx.fillStyle = '#ffd34e';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(obj.text, viewW / 2, 35);

  // Clock, weather and district, under the wanted stars.
  if (world.sky) {
    const district = districtAt(p.x, p.y);
    panel(ctx, 14, 62, 250, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${world.sky.label()} — ${district}`, 24, 80);
    if (world.heli && world.heli.active && world.heli.mode === 'pursuit') {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('POLICE HELI OVERHEAD', 24, 104);
    }
  }

  drawMinimap(ctx, world, viewW);

  // Health, armour, weapon and money, bottom-left.
  panel(ctx, 14, viewH - 76, 250, 62);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('HEALTH', 26, viewH - 58);
  ctx.fillStyle = '#333';
  ctx.fillRect(96, viewH - 66, 150, 12);
  ctx.fillStyle = p.health > 30 ? '#7fd67f' : '#ff5a4e';
  ctx.fillRect(96, viewH - 66, 150 * (p.health / TUNE.maxHealth), 12);
  if (p.armor > 0) {
    ctx.fillStyle = '#7fb8d9';
    ctx.fillRect(96, viewH - 50, 150 * (p.armor / TUNE.maxArmor), 5);
  }
  ctx.fillStyle = '#ffd34e';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`$${p.money}`, 26, viewH - 28);
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui, sans-serif';
  const weapon = p.weapon === 'pistol' ? `Pistol  ${p.ammo} ammo` : 'Fists';
  ctx.fillText(weapon, 120, viewH - 28);

  // Speed, bottom-right, while driving.
  if (p.inCar && p.car) {
    panel(ctx, viewW - 150, viewH - 76, 136, 62);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(Math.abs(p.car.speed) * 0.24)}`, viewW - 40, viewH - 46);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#bbb';
    ctx.fillText('km/h', viewW - 40, viewH - 26);
    ctx.textAlign = 'left';
    const hp = Math.max(0, p.car.health);
    ctx.fillStyle = '#333';
    ctx.fillRect(viewW - 136, viewH - 66, 108, 8);
    ctx.fillStyle = hp > 40 ? '#7fd67f' : '#ff5a4e';
    ctx.fillRect(viewW - 136, viewH - 66, 108 * (hp / p.car.maxHealth), 8);
  }

  // Context prompt, bottom-centre.
  let prompt = null;
  if (world.shopPrompt) prompt = world.shopPrompt;
  else if (!p.inCar) {
    const car = nearestCarForPrompt(world);
    if (car) prompt = car.type === 'police' ? 'E — Take the police car' : 'E — Steal car';
    else if (p.weapon === 'pistol') prompt = 'F / Click — Shoot    Space — Punch    Shift — Sprint';
    else prompt = 'WASD — Move    Shift — Sprint    Space — Punch    E — Enter car';
  } else if (p.car && p.car.model === 'taxi' && !world.taxi.active) {
    prompt = 'WASD — Drive    Space — Brake    E — Leave car    T — Pick up passenger';
  } else {
    prompt = 'WASD — Drive    Space — Brake    E — Leave car';
  }
  if (prompt) {
    ctx.font = '14px system-ui, sans-serif';
    const w = ctx.measureText(prompt).width + 28;
    panel(ctx, (viewW - w) / 2, viewH - 34, w, 26, 0.5);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, viewW / 2, viewH - 20);
  }

  // Taxi fare, above the prompt bar, while a ride is running.
  const taxi = world.taxi ? world.taxi.status(world) : null;
  if (taxi) {
    const text = `TAXI  →  ${taxi.dest}   ·   fare $${taxi.fare}   ·   ${taxi.metresLeft}m to go`;
    ctx.font = 'bold 14px system-ui, sans-serif';
    const w = ctx.measureText(text).width + 28;
    panel(ctx, (viewW - w) / 2, viewH - 66, w, 26, 0.6);
    ctx.fillStyle = '#ffd34e';
    ctx.textAlign = 'center';
    ctx.fillText(text, viewW / 2, viewH - 48);
  }

  // Banner (mission complete, wanted, pickups), centre.
  if (world.banner) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    const w = ctx.measureText(world.banner.text).width + 40;
    panel(ctx, (viewW - w) / 2, viewH / 2 - 110, w, 44, 0.65);
    ctx.fillStyle = world.banner.color;
    ctx.textAlign = 'center';
    ctx.fillText(world.banner.text, viewW / 2, viewH / 2 - 88);
  }

  // Off-screen objective arrow.
  if (obj.x !== null && obj.y !== null) {
    const cam = world.camera;
    const sx = viewW / 2 + (obj.x - cam.x) * cam.zoom;
    const sy = viewH / 2 + (obj.y - cam.y) * cam.zoom;
    if (sx < 0 || sx > viewW || sy < 0 || sy > viewH) {
      const cx = Math.max(40, Math.min(viewW - 40, sx));
      const cy = Math.max(90, Math.min(viewH - 130, sy));
      const a = Math.atan2(sy - viewH / 2, sx - viewW / 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = '#ffd34e';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -11);
      ctx.lineTo(-10, 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffd34e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const d = Math.round(Math.hypot(obj.x - p.x, obj.y - p.y));
      // Keep the distance clear of the health panel and the prompt bar.
      const textY = cy > viewH - 170 ? cy - 26 : cy + 28;
      ctx.fillText(`${d}m`, cx, textY);
    }
  }
  ctx.textBaseline = 'alphabetic';
}

function nearestCarForPrompt(world) {
  const p = world.player;
  let best = null;
  let bestD = 70;
  for (const car of world.cars) {
    if (car.dead) continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

function drawMinimap(ctx, world, viewW) {
  const mw = 200;
  const mh = Math.round((200 * WORLD.h) / WORLD.w);
  const mx = viewW - mw - 14;
  const my = 64;
  const sx = mw / WORLD.w;
  const sy = mh / WORLD.h;
  panel(ctx, mx - 6, my - 6, mw + 12, mh + 12, 0.6);
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, mw, mh);
  ctx.clip();
  ctx.fillStyle = '#5d8a4a';
  ctx.fillRect(mx, my, mw, mh);
  // Water.
  ctx.fillStyle = '#2fa8c9';
  ctx.fillRect(mx, my + 2520 * sy, mw, mh - 2520 * sy);
  // Roads.
  ctx.strokeStyle = '#3d3a38';
  ctx.lineWidth = 3;
  for (const y of [200, 600, 1000, 1400, 1800, 2200, 2320]) {
    ctx.beginPath(); ctx.moveTo(mx, my + y * sy); ctx.lineTo(mx + mw, my + y * sy); ctx.stroke();
  }
  for (const x of [300, 800, 1300, 1800, 2300, 2800, 3300]) {
    ctx.beginPath(); ctx.moveTo(mx + x * sx, my); ctx.lineTo(mx + x * sx, my + mh); ctx.stroke();
  }
  // Cars and police.
  for (const car of world.cars) {
    if (car.dead) continue;
    ctx.fillStyle = car.type === 'police' ? '#ff2a2a' : 'rgba(255,255,255,0.85)';
    ctx.fillRect(mx + car.x * sx - 1.5, my + car.y * sy - 1.5, 3, 3);
  }
  // The new quarters, marked on the map.
  const quarterDots = [
    [PLACES.strip, '#ff5ad0'],
    [PLACES.casino, '#ffd34e'],
    [PLACES.marina, '#2fa8c9'],
  ];
  for (const [place, color] of quarterDots) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(mx + place.x * sx, my + place.y * sy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Mission marker.
  const obj = world.missions.objective();
  if (obj.x !== null && obj.y !== null) {
    const r = 4 + Math.sin(world.time * 4) * 1.5;
    ctx.fillStyle = '#ffd34e';
    ctx.beginPath(); ctx.arc(mx + obj.x * sx, my + obj.y * sy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a5c00';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // View rectangle.
  const cam = world.camera;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + (cam.x - 640) * sx, my + (cam.y - 360) * sy, 1280 * sx, 720 * sy);
  // Player.
  const p = world.player;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(mx + p.x * sx, my + p.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d94f3d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SOLMAR BAY', mx, my + mh + 18);
}

// --- Screens ---------------------------------------------------------------

export function drawTitle(ctx, world, viewW, viewH, hasSave) {
  ctx.fillStyle = '#0e1420';
  ctx.fillRect(0, 0, viewW, viewH);
  // Sun-soaked gradient sky.
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, '#ff9d5c');
  g.addColorStop(0.5, '#ff7e5f');
  g.addColorStop(1, '#2b1055');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.beginPath(); ctx.arc(viewW * 0.78, viewH * 0.22, 60, 0, Math.PI * 2); ctx.fill();
  // Palm silhouettes.
  ctx.strokeStyle = 'rgba(20,20,30,0.85)';
  ctx.lineWidth = 10;
  for (const [bx, by, s] of [[0.08, 1.0, 1.4], [0.9, 1.0, 1.2], [0.16, 1.02, 0.9]]) {
    const x = viewW * bx;
    const y = viewH * by;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 140 * s, x + 60, y - 190 * s); ctx.stroke();
    ctx.lineWidth = 5;
    for (let f = 0; f < 5; f += 1) {
      const a = Math.PI + (f / 5) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x + 60, y - 190 * s);
      ctx.quadraticCurveTo(x + 60 + Math.cos(a) * 70, y - 190 * s + Math.sin(a) * 40 - 30, x + 60 + Math.cos(a) * 110, y - 190 * s + Math.sin(a) * 60 + 20);
      ctx.stroke();
    }
    ctx.lineWidth = 10;
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18;
  ctx.fillText('SOLMAR BAY', viewW / 2, viewH * 0.34);
  ctx.shadowBlur = 0;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('Steal. Drive. Survive. Own the city.', viewW / 2, viewH * 0.42);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('Danny Vega is new in town. Mama Rosa has work — five jobs, one big score.', viewW / 2, viewH * 0.52);
  ctx.fillText('WASD move / drive  •  E steal car  •  Space punch / brake  •  F shoot  •  P pause', viewW / 2, viewH * 0.58);
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) {
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = '#ffd34e';
    ctx.fillText(hasSave ? 'Press ENTER to play — C to continue your save' : 'Press ENTER to play', viewW / 2, viewH * 0.7);
  }
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('An original game. Its city, people and story are its own.', viewW / 2, viewH * 0.92);
}

export function drawPause(ctx, viewW, viewH) {
  ctx.fillStyle = 'rgba(8,10,16,0.72)';
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('PAUSED', viewW / 2, viewH * 0.4);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#ddd';
  ctx.fillText('P / Esc — resume      S — save game      M — music on/off', viewW / 2, viewH * 0.5);
  ctx.fillText('WASD move / drive  •  E steal car  •  Space punch / brake  •  F shoot', viewW / 2, viewH * 0.56);
}

export function drawGameOver(ctx, world, viewW, viewH) {
  ctx.fillStyle = world.over === 'wasted' ? 'rgba(60,8,8,0.78)' : 'rgba(8,12,40,0.78)';
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText(world.over === 'wasted' ? 'WASTED' : 'BUSTED', viewW / 2, viewH * 0.42);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#ddd';
  ctx.fillText(world.over === 'wasted'
    ? 'Danny went down. The hospital patched him up — minus $200.'
    : 'The Solmar Bay PD caught up with Danny. Time served — minus $200.', viewW / 2, viewH * 0.52);
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = '#ffd34e';
  ctx.fillText('Press ENTER to get back on the streets', viewW / 2, viewH * 0.64);
}

export function drawDialog(ctx, world, viewW, viewH) {
  const d = world.dialog;
  if (!d) return;
  ctx.fillStyle = 'rgba(8,10,16,0.66)';
  ctx.fillRect(0, 0, viewW, viewH);
  const w = Math.min(760, viewW - 120);
  const h = 110 + d.lines.length * 26;
  const x = (viewW - w) / 2;
  const y = (viewH - h) / 2;
  panel(ctx, x, y, w, h, 0.92);
  ctx.strokeStyle = '#ffd34e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd34e';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(d.title, x + 28, y + 44);
  ctx.fillStyle = '#fff';
  ctx.font = '16px system-ui, sans-serif';
  d.lines.forEach((line, i) => ctx.fillText(line, x + 28, y + 80 + i * 26));
  const blink = Math.floor(world.time * 2) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffd34e';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(d.hint || 'Press ENTER', x + 28, y + h - 22);
  }
}
