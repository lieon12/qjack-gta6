// SOLMAR BAY — a working gta6-01 entry (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This file hands it in: it copies game/ from beside
// this file to /output, turns the base64 screenshot texts in shots-b64/ back
// into real image files in /output/screenshots/ (the images travel as base64
// because the repository holds text only), and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
// The game itself: a top-down open-world crime game in an original coastal
// city. On foot or behind the wheel of one of six vehicle models — a Comet
// GT, a sedan, a hatchback, a pickup, a limo, or a City Taxi you can hail
// for a metered fare — through traffic and pedestrians, under a sky that
// turns from dawn to night while the weather drifts between clear, overcast,
// rain and fog. A five-star wanted level brings police cars, foot cops and,
// from three stars, a helicopter with a searchlight. Eight story missions
// for Mama Rosa run from the first car theft to the "Tiburón Rising" finale
// on the neon Strip, with a stop at the Marina's boats on the way. There is
// combat, a weapon and armor shop, cash pickups, a hospital, a minimap, a
// HUD with a clock, save/continue, and synthesized sound and music.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// The screenshots travel as base64 text (shots-b64/*.b64) because the repository
// holds text only. Turn each one back into a real image file under
// /output/screenshots/ at grade time.
mkdirSync(join(out, 'screenshots'), { recursive: true });
for (const file of readdirSync(join(here, 'shots-b64'))) {
  if (!file.endsWith('.b64')) continue;
  const image = file.slice(0, -'.b64'.length);
  const bytes = Buffer.from(readFileSync(join(here, 'shots-b64', file), 'utf8').trim(), 'base64');
  writeFileSync(join(out, 'screenshots', image), bytes);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
