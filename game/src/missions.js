// The story: Danny Vega, new in Solmar Bay, works jobs for Mama Rosa while
// Los Tiburones push back. Eight missions, each a chain of small objectives
// the world checks every step: reach a place, steal a car, take someone down,
// lose the cops. The first five are Rosa's jobs around town; the last three
// are the "Tiburón Rising" arc — the Strip, the Marina, and El Tiburón
// himself, the shark who wants the city back.
import { PLACES, TUNE } from './config.js';
import { makeCar, makePed } from './entities.js';

export const MISSIONS = [
  {
    name: 'First Wheels',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "Danny, welcome to Solmar Bay. A kid with no wheels is a kid',
      'with no future. Steal a car — any car — and bring it to my garage."',
      'Steal a car with E, then drive it to the yellow marker.',
    ],
    reward: 400,
    stages: [
      { type: 'steal', text: 'Steal a car (walk up to one and press E)' },
      { type: 'goto', x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y, r: 90, text: "Drive to Rosa's Garage" },
    ],
  },
  {
    name: 'Dockside Run',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "A package is waiting at Pier 7. The Marlin Hotel wants it',
      'tonight, and the clock is already running. Drive fast, Danny."',
      'Grab the package, then deliver it before the timer runs out.',
    ],
    reward: 600,
    stages: [
      { type: 'pickup', x: PLACES.docksPickup.x, y: PLACES.docksPickup.y, r: 70, text: 'Pick up the package at Pier 7' },
      { type: 'goto', x: PLACES.marlinHotel.x, y: PLACES.marlinHotel.y, r: 90, text: 'Deliver to the Marlin Hotel', timer: 90 },
    ],
  },
  {
    name: 'Park Payback',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "Los Tiburones think the park is theirs. Three of their',
      'enforcers are shaking down my boys there. Go remind them whose',
      'city this is. Fists work. A pistol works better."',
      'Take down all 3 Tiburones enforcers in Central Park.',
    ],
    reward: 800,
    stages: [
      { type: 'goto', x: PLACES.park.x, y: PLACES.park.y, r: 140, text: 'Go to Central Park' },
      { type: 'kill', count: 3, x: PLACES.park.x, y: PLACES.park.y, text: 'Take down the Tiburones enforcers (0/3)' },
    ],
  },
  {
    name: 'Hot Wheels',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "A yellow Comet GT is parked uptown, keys in it, owner',
      'nowhere. Take it — but the owner called the cops, so the moment',
      'you touch it, they come. Lose them and bring it to the hideout."',
      'Steal the yellow Comet GT, then lose the cops at the hideout.',
    ],
    reward: 1000,
    stages: [
      { type: 'stealCar', x: 2600, y: 600, text: 'Steal the yellow Comet GT uptown' },
      { type: 'escape', x: PLACES.hideout.x, y: PLACES.hideout.y, r: 90, text: 'Lose the cops — reach the hideout' },
    ],
  },
  {
    name: 'The Big Score',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "One last job, Danny, and we are rich. A Solmar Trust',
      'armored van runs the bay road every afternoon. Stop it, take the',
      'cash, and vanish. The whole city will be looking for you."',
      'Stop the armored van, grab the cash, escape to the hideout.',
    ],
    reward: 2500,
    stages: [
      { type: 'goto', x: PLACES.bank.x, y: PLACES.bank.y, r: 110, text: 'Get to Solmar Trust Bank' },
      { type: 'ram', text: 'Stop the armored van — ram it until it stalls' },
      { type: 'pickup', x: 0, y: 0, r: 80, text: 'Grab the cash from the van', followVan: true },
      { type: 'escape', x: PLACES.hideout.x, y: PLACES.hideout.y, r: 90, text: 'Escape to the hideout with the cash' },
    ],
  },
  {
    name: 'Strip Lights',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "The Strip pays me protection, Danny, and the Tiburones',
      'have been skimming it. Three of my fronts on the casino row are',
      'holding cash for me. Walk the Strip, collect it all, and bring it',
      'home. The neon watches everything — keep it quiet."',
      'Collect the protection money from the three casino fronts.',
    ],
    reward: 1500,
    stages: [
      { type: 'goto', x: PLACES.casino.x, y: PLACES.casino.y, r: 110, text: 'Go to the Solmar Grand Casino' },
      { type: 'pickup', x: PLACES.casinoFrontA.x, y: PLACES.casinoFrontA.y, r: 70, text: 'Collect from Neon Slots' },
      { type: 'pickup', x: PLACES.casinoFrontB.x, y: PLACES.casinoFrontB.y, r: 70, text: 'Collect from Lucky Pelican' },
      { type: 'pickup', x: PLACES.casinoFrontC.x, y: PLACES.casinoFrontC.y, r: 70, text: 'Collect from Golden Marlin Club' },
      { type: 'goto', x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y, r: 90, text: "Bring the take back to Rosa's Garage" },
    ],
  },
  {
    name: 'Marina Run',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "A crate came in on the night boat, Danny, and it is',
      'sitting on the Marina pier with my name on it. The Tiburones know',
      'it too. Grab it, run it to Pier 7 before their boat leaves, and',
      'do not let them catch you holding it."',
      'Grab the crate at the Marina pier, deliver it to Pier 7 in time.',
    ],
    reward: 1800,
    stages: [
      { type: 'goto', x: PLACES.marina.x, y: PLACES.marina.y, r: 110, text: 'Go to the Solmar Marina' },
      { type: 'pickup', x: PLACES.marinaPier.x, y: PLACES.marinaPier.y, r: 70, text: 'Grab the crate on the pier', wanted: 40 },
      { type: 'goto', x: PLACES.docksPickup.x, y: PLACES.docksPickup.y, r: 90, text: 'Deliver to Pier 7 before the boat leaves', timer: 75 },
      { type: 'escape', x: PLACES.hideout.x, y: PLACES.hideout.y, r: 90, text: 'Lose the heat — reach the hideout' },
    ],
  },
  {
    name: 'Tiburón Rising',
    giver: 'Mama Rosa',
    intro: [
      'Mama Rosa: "El Tiburón himself is on the Strip tonight, Danny,',
      'with his whole crew, telling the casinos the city is his now.',
      'End it. Take down his crew and take down the shark, and Solmar',
      'Bay is ours for good. Come back alive, hijo."',
      'Take down El Tiburón and his 4 enforcers on the Strip, then vanish.',
    ],
    reward: 4000,
    stages: [
      { type: 'goto', x: PLACES.casino.x, y: PLACES.casino.y, r: 140, text: 'Go to the Strip — El Tiburón is there' },
      { type: 'kill', count: 5, x: PLACES.casino.x, y: PLACES.casino.y, boss: true, text: 'Take down El Tiburón and his crew (0/5)' },
      { type: 'escape', x: PLACES.hideout.x, y: PLACES.hideout.y, r: 90, text: 'Vanish — reach the hideout' },
    ],
  },
];

export class MissionManager {
  constructor(world) {
    this.world = world;
    this.current = -1; // no mission yet
    this.stageIdx = 0;
    this.active = false;
    this.done = false;
    this.kills = 0;
    this.timer = 0;
    this.van = null;
    this.getaway = null;
    this.gang = [];
  }

  get def() { return this.current >= 0 ? MISSIONS[this.current] : null; }
  get stage() { return this.def ? this.def.stages[this.stageIdx] : null; }

  get missionsDone() { return this.world.player ? this.world.missionsDoneCount : 0; }

  start(index) {
    const world = this.world;
    this.current = index;
    this.stageIdx = 0;
    this.active = true;
    this.kills = 0;
    this.timer = 0;
    this.gang = [];
    const def = MISSIONS[index];
    world.dialog = {
      title: `Mission ${index + 1}: ${def.name}`,
      lines: [...def.intro, '', `Reward: $${def.reward}`],
      hint: 'Press ENTER to start',
    };
    world.events.push({ type: 'missionStart', index });
    this.setupStage();
  }

  setupStage() {
    const world = this.world;
    const stage = this.stage;
    if (!stage) return;
    if (stage.type === 'stealCar' && !this.getaway) {
      const car = makeCar(stage.x, stage.y, 0, {
        type: 'parked', model: 'comet', color: '#f2c14e', rng: world.rng, id: world.nextId(),
      });
      car.driver = false;
      car.getaway = true;
      world.cars.push(car);
      this.getaway = car;
    }
    if (stage.type === 'kill' && this.gang.length === 0) {
      const cx = stage.x ?? PLACES.park.x;
      const cy = stage.y ?? PLACES.park.y;
      for (let i = 0; i < stage.count; i += 1) {
        const ped = makePed(cx + (i - Math.floor(stage.count / 2)) * 70, cy + (i % 2) * 60 - 30, {
          rng: world.rng, id: world.nextId(),
        });
        ped.state = 'gang';
        // The last one in a boss fight is El Tiburón himself: twice the
        // health and a dark red jacket, so the player knows who he is.
        if (stage.boss && i === stage.count - 1) {
          ped.health = 120;
          ped.color = '#7a1f1f';
        } else {
          ped.health = 60;
          ped.color = '#2b4d6f';
        }
        world.peds.push(ped);
        this.gang.push(ped);
      }
    }
    if (stage.type === 'ram' && !this.van) {
      const van = makeCar(400, 1000, 0, { type: 'van', model: 'pickup', color: '#3d3a38', rng: world.rng, id: world.nextId() });
      van.health = 80;
      van.maxHealth = 80;
      van.speed = 110;
      van.vanRoute = 1; // eastbound
      world.cars.push(van);
      this.van = van;
      world.addWanted(0, 'van spotted');
    }
    if (stage.timer) this.timer = stage.timer;
  }

  advance() {
    this.stageIdx += 1;
    if (this.stageIdx >= this.def.stages.length) {
      this.complete();
      return;
    }
    this.setupStage();
  }

  complete() {
    const world = this.world;
    const def = this.def;
    world.player.money += def.reward;
    world.missionsDoneCount += 1;
    world.audio.missionDone();
    world.events.push({ type: 'banner', text: `Mission complete: ${def.name}  +$${def.reward}`, color: '#7fd67f' });
    world.events.push({ type: 'cash', x: world.player.x, y: world.player.y, amount: def.reward });
    this.active = false;
    this.current = -1;
    this.van = null;
    this.getaway = null;
    if (world.missionsDoneCount >= MISSIONS.length) {
      world.events.push({ type: 'banner', text: 'Solmar Bay is yours — free roam!', color: '#ffd34e' });
      this.done = true;
    } else {
      // The next job unlocks at Rosa's garage; a marker waits there.
      world.nextMissionAt = { x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y };
    }
  }

  fail(reason) {
    const world = this.world;
    this.active = false;
    world.audio.busted();
    world.dialog = {
      title: 'Mission failed',
      lines: [reason, '', 'Press ENTER to try it again.'],
      hint: 'ENTER — retry',
      retry: this.current,
    };
    // Clean up mission props so the retry starts fresh.
    if (this.van) { this.van.dead = true; this.van = null; }
    if (this.getaway && !this.world.player.inCar) { this.getaway.dead = true; this.getaway = null; }
    for (const g of this.gang) if (g.state !== 'down') g.state = 'walk';
    this.gang = [];
  }

  onGangDown(ped) {
    if (!this.active || !this.stage || this.stage.type !== 'kill') return;
    this.kills += 1;
    const stage = this.stage;
    stage.text = stage.boss
      ? `Take down El Tiburón and his crew (${this.kills}/${stage.count})`
      : `Take down the Tiburones enforcers (${this.kills}/${stage.count})`;
    if (this.kills >= stage.count) this.advance();
  }

  // The objective the HUD shows, and where the marker sits.
  objective() {
    if (this.active && this.stage) {
      const s = this.stage;
      let text = s.text;
      if (s.timer) text += `  —  ${Math.ceil(this.timer)}s`;
      return { text, x: s.x ?? null, y: s.y ?? null, followVan: !!s.followVan };
    }
    if (this.world.nextMissionAt) {
      return { text: 'Next job: see Mama Rosa at the garage', x: this.world.nextMissionAt.x, y: this.world.nextMissionAt.y };
    }
    if (!this.active && this.current === -1 && this.world.missionsDoneCount === 0) {
      return { text: 'Go to Rosa\'s Garage to start your first job', x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y };
    }
    return { text: 'Free roam — Solmar Bay is yours', x: null, y: null };
  }

  update(dt) {
    const world = this.world;
    const p = world.player;
    if (!this.active || !this.stage) return;
    const s = this.stage;
    if (s.timer) {
      this.timer -= dt;
      if (this.timer <= 0) { this.fail('Out of time — the delivery window closed.'); return; }
    }
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    switch (s.type) {
      case 'steal': {
        if (p.inCar) this.advance();
        break;
      }
      case 'stealCar': {
        if (p.inCar && p.car && p.car.getaway) {
          world.addWanted(40, 'getaway stolen');
          world.events.push({ type: 'banner', text: 'The cops are coming — lose them!', color: '#ff5a4e' });
          world.audio.wantedUp();
          this.advance();
        }
        break;
      }
      case 'goto':
      case 'escape': {
        const d = Math.hypot(px - s.x, py - s.y);
        if (d < s.r) {
          if (s.type === 'escape') {
            world.setWanted(0);
            world.events.push({ type: 'banner', text: 'You lost them', color: '#7fd67f' });
          }
          this.advance();
        }
        break;
      }
      case 'pickup': {
        const tx = s.followVan && this.van ? this.van.x : s.x;
        const ty = s.followVan && this.van ? this.van.y : s.y;
        const d = Math.hypot(px - tx, py - ty);
        if (d < s.r) {
          world.audio.pickup();
          // Some pickups are hot: grabbing the Marina crate brings the law.
          if (s.wanted) {
            world.addWanted(s.wanted, 'crate grabbed');
            world.events.push({ type: 'banner', text: 'They saw you take it — run!', color: '#ff5a4e' });
          }
          this.advance();
        }
        break;
      }
      case 'ram': {
        if (this.van && (this.van.dead || this.van.health <= 0)) {
          world.addWanted(80, 'van hit');
          world.events.push({ type: 'banner', text: 'The van is down — grab the cash!', color: '#ffd34e' });
          this.advance();
        }
        break;
      }
      case 'kill': {
        // Gang members chase the player; the kill count advances in onGangDown.
        break;
      }
      default: break;
    }
  }
}
