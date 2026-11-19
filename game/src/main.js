// Solmar Bay — bootstrap and the game loop.
// Screens: title -> play -> pause / game-over. A ?shot= URL stages one
// screenshot scene instead of showing the title screen.
import { World } from './world.js';
import { Input } from './input.js';
import { drawWorld } from './render.js';
import { drawHUD, drawTitle, drawPause, drawGameOver, drawDialog } from './hud.js';
import { stageShot } from './shots.js';
import { loadSave } from './save.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const input = new Input(canvas);
const world = new World(seed);
const hasSave = !!loadSave();

let screen = 'title';
let last = performance.now();

if (shotName) {
  // Screenshot mode: stage the scene, draw one frame, announce readiness.
  const result = stageShot(shotName, world);
  screen = result.screen || 'play';
  world.camera.x = world.player.x;
  world.camera.y = world.player.y;
  drawWorld(ctx, world, canvas.width, canvas.height);
  drawHUD(ctx, world, canvas.width, canvas.height);
  document.title = 'shot-ready';
} else {
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  world.time += screen === 'title' ? dt : 0; // title palms shimmer while waiting

  if (screen === 'title') {
    if (input.pressed('Enter')) {
      world.audio.ensure();
      screen = 'play';
    } else if (input.pressed('KeyC') && hasSave) {
      world.applySave(world.saved);
      world.audio.ensure();
      screen = 'play';
    }
    drawTitle(ctx, world, canvas.width, canvas.height, hasSave);
  } else if (screen === 'play') {
    // Dialogs pause the world; ENTER closes them (or retries a failed mission).
    if (world.dialog) {
      if (input.pressed('Enter')) {
        const retry = world.dialog.retry;
        world.dialog = null;
        if (retry !== undefined && retry !== null) world.missions.start(retry);
      }
      drawWorld(ctx, world, canvas.width, canvas.height);
      drawHUD(ctx, world, canvas.width, canvas.height);
      drawDialog(ctx, world, canvas.width, canvas.height);
    } else if (world.over) {
      screen = 'over';
    } else {
      if (input.pressed('KeyP') || input.pressed('Escape')) screen = 'pause';
      if (input.pressed('KeyM')) world.audio.musicOn = !world.audio.musicOn;
      // T toggles taxi duty and N skips two in-game hours; both are handled
      // inside world.step so scripted play and screenshots see the same rules.
      const mouseWorld = {
        x: world.camera.x + (input.mouse.x - canvas.width / 2) / world.camera.zoom,
        y: world.camera.y + (input.mouse.y - canvas.height / 2) / world.camera.zoom,
      };
      world.step(dt, input, mouseWorld);
      drawWorld(ctx, world, canvas.width, canvas.height);
      drawHUD(ctx, world, canvas.width, canvas.height);
      if (world.over) screen = 'over';
    }
  } else if (screen === 'pause') {
    if (input.pressed('KeyP') || input.pressed('Escape')) screen = 'play';
    if (input.pressed('KeyS')) world.save();
    if (input.pressed('KeyM')) world.audio.musicOn = !world.audio.musicOn;
    drawWorld(ctx, world, canvas.width, canvas.height);
    drawHUD(ctx, world, canvas.width, canvas.height);
    drawPause(ctx, canvas.width, canvas.height);
  } else if (screen === 'over') {
    if (input.pressed('Enter')) {
      world.respawn();
      screen = 'play';
    }
    drawWorld(ctx, world, canvas.width, canvas.height);
    drawHUD(ctx, world, canvas.width, canvas.height);
    drawGameOver(ctx, world, canvas.width, canvas.height);
    if (world.dialog) drawDialog(ctx, world, canvas.width, canvas.height);
  }

  input.endFrame();
  requestAnimationFrame(loop);
}

// For the automated play-test: the world and the screen, nothing else.
window.__game = { world, get screen() { return screen; }, input };
