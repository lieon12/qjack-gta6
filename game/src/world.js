// The world: everything the game simulates each step — the player, traffic,
// pedestrians, police, the helicopter, the taxi rides, the sky and its
// weather, the wanted level, missions, pickups and the camera.
// main.js only runs the loop and draws; this file decides what happens.
import { WORLD, PLACES, PARK, TUNE, districtAt } from './config.js';
import { buildCity, randomRoadPoint } from './city.js';
import { mulberry32, range, rangeInt, pick } from './random.js';
import { makePlayer, updatePlayer, exitCar } from './player.js';
import {
  makeCar, makePed, updateTrafficCar, updatePed, updatePoliceCar, updateCop,
  spawnPoliceCar, spawnCop, policeTargetCount, damageCar, updateParticles,
} from './entities.js';
import { MissionManager, MISSIONS as MISSION_DEFS } from './missions.js';
import { AudioEngine } from './audio.js';
import { loadSave, writeSave } from './save.js';
import { Sky } from './daynight.js';
import { spawnHeli, updateHeli, heliTargetCount } from './helicopter.js';
import { updateRide } from './taxi.js';

let idCounter = 1;

export class World {
  constructor(seed = 20261118) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.city = buildCity(seed);
    this.audio = new AudioEngine();
    this.sky = new Sky();
    this.player = makePlayer(PLACES.playerSpawn.x, PLACES.playerSpawn.y);
    this.cars = [];
    this.peds = [];
    this.helis = [];
    this.particles = [];
    this.tracers = [];
    this.events = [];
    this.cashPickups = [];
    this.heat = 0;
    this.wanted = 0;
    this.time = 0;
    this.gunshotTimer = 0;
    this.skidTimer = 0;
    this.lastCrimeAt = -100;
    this.missions = new MissionManager(this);
    this.missionsDoneCount = 0;
    this.nextMissionAt = null;
    this.shopOwnedPistol = false;
    this.dialog = null;
    this.banner = null;
    this.over = null; // 'wasted' | 'busted'
    this.camera = { x: this.player.x, y: this.player.y, zoom: 1 };
    this.playerSpeed = 0;
    this.cashTimer = 20;
    this.shopPrompt = null;
    this.taxiRide = null;
    this.taxiFaresPaid = 0;
    this.district = districtAt(this.player.x, this.player.y);
    this.saved = loadSave();
    this.spawnInitial();
  }

  // Apply a save on the player's choice (Continue), never automatically.
  applySave(data) {
    if (!data) return;
    this.player.money = data.money;
    this.player.weapon = data.weapon || 'fists';
    this.player.ammo = data.ammo || 0;
    this.player.armor = data.armor || 0;
    this.player.health = data.health || TUNE.maxHealth;
    this.missionsDoneCount = data.missionsDone || 0;
    this.shopOwnedPistol = data.weapon === 'pistol';
    this.taxiFaresPaid = data.taxiFaresPaid || 0;
    this.player.x = data.x ?? this.player.x;
    this.player.y = data.y ?? this.player.y;
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    if (this.missionsDoneCount > 0 && this.missionsDoneCount < MISSION_DEFS.length) {
      this.nextMissionAt = { x: PLACES.rosaGarage.x, y: PLACES.rosaGarage.y };
    }
  }

  nextId() { return idCounter += 1; }

  spawnInitial() {
    // Parked cars along the streets (all on street centres, so none sit in a building).
    const spots = [
      [1550, 600, 0], [1700, 600, 0], [1450, 1000, Math.PI], [2050, 1000, 0],
      [1250, 600, 0], [2750, 600, 0], [2350, 1000, 0], [950, 600, Math.PI],
      [1850, 1800, Math.PI], [2750, 1800, 0], [350, 1000, 0], [3350, 1000, Math.PI],
      [650, 2200, 0], [3050, 2200, 0], [800, 1400, Math.PI], [2300, 1400, 0],
      [2600, 1800, 0], [1050, 2200, Math.PI],
    ];
    for (const [x, y, a] of spots) {
      const car = makeCar(x, y, a, { type: 'parked', rng: this.rng, id: this.nextId() });
      car.driver = false;
      this.cars.push(car);
    }
    // Two taxis cruise from the start, so a fare is never far away.
    for (let i = 0; i < 2; i += 1) this.spawnTaxiCar();
    for (let i = 0; i < 10; i += 1) this.spawnTrafficCar();
    for (let i = 0; i < 14; i += 1) this.spawnPed();
  }

  spawnTrafficCar() {
    const p = randomRoadPoint(this.rng);
    const car = makeCar(p.x, p.y, p.horizontal ? 0 : Math.PI / 2, {
      type: 'traffic', rng: this.rng, id: this.nextId(),
    });
    car.dir = p.horizontal ? 0 : 1;
    this.cars.push(car);
    return car;
  }

  spawnTaxiCar() {
    const p = randomRoadPoint(this.rng);
    const car = makeCar(p.x, p.y, p.horizontal ? 0 : Math.PI / 2, {
      type: 'taxi', model: 'taxi', color: '#f2c14e', rng: this.rng, id: this.nextId(),
    });
    car.dir = p.horizontal ? 0 : 1;
    this.cars.push(car);
    return car;
  }

  spawnPed() {
    const p = randomRoadPoint(this.rng);
    const ped = makePed(p.x + range(this.rng, -60, 60), p.y + range(this.rng, -60, 60), {
      rng: this.rng, id: this.nextId(),
    });
    this.peds.push(ped);
    return ped;
  }

  // --- Wanted level -------------------------------------------------------
  addWanted(amount, _reason) {
    if (amount <= 0) return;
    this.heat = Math.min(100, this.heat + amount);
    this.lastCrimeAt = this.time;
    const stars = Math.min(5, Math.ceil(this.heat / TUNE.wantedPerStar));
    if (stars > this.wanted) {
      this.wanted = stars;
      this.audio.wantedUp();
      this.events.push({ type: 'banner', text: `Wanted level ${stars} — the cops are on you`, color: '#ff5a4e' });
    } else {
      this.wanted = stars;
    }
  }

  setWanted(stars) {
    this.heat = stars * TUNE.wantedPerStar;
    this.wanted = stars;
  }

  // --- Damage, death, arrest ----------------------------------------------
  damagePlayer(amount) {
    const p = this.player;
    if (this.over) return;
    let rest = amount;
    if (p.armor > 0) {
      const absorbed = Math.min(p.armor, rest);
      p.armor -= absorbed;
      rest -= absorbed;
    }
    p.health -= rest;
    if (p.health <= 0) {
      p.health = 0;
      this.wasted();
    }
  }

  wasted() {
    if (this.over) return;
    this.over = 'wasted';
    this.audio.busted();
    if (this.player.inCar) exitCar(this);
  }

  busted() {
    if (this.over) return;
    this.over = 'busted';
    this.audio.busted();
  }

  ejectFromCar() {
    const p = this.player;
    if (!p.car) return;
    const car = p.car;
    p.x = car.x + 40;
    p.y = car.y;
    p.inCar = null;
    p.car = null;
    this.damagePlayer(20);
  }

  respawn() {
    const p = this.player;
    p.health = TUNE.maxHealth;
    p.armor = 0;
    p.money = Math.max(0, p.money - 200);
    p.x = PLACES.hospital.x;
    p.y = PLACES.hospital.y;
    p.inCar = null;
    p.car = null;
    this.setWanted(0);
    this.over = null;
    this.helis = [];
    this.taxiRide = null;
    // Clear the police that were on the player.
    this.cars = this.cars.filter((c) => c.type !== 'police');
    this.peds = this.peds.filter((pd) => pd.state !== 'cop');
    if (this.missions.active) this.missions.fail('You went down — the job is blown.');
  }

  // --- One simulation step --------------------------------------------------
  step(dt, input, mouseWorld) {
    if (this.dialog || this.over) return; // dialogs and game-over pause the world
    this.time += dt;
    this.gunshotTimer = Math.max(0, this.gunshotTimer - dt);
    this.skidTimer = Math.max(0, this.skidTimer - dt);
    this.sky.update(dt, this.rng);
    this.district = districtAt(this.player.x, this.player.y);

    // Start the first job by walking into Rosa's garage.
    if (!this.missions.active && this.missionsDoneCount === 0 && this.missions.current === -1) {
      const p = this.player;
      const px = p.inCar ? p.car.x : p.x;
      const py = p.inCar ? p.car.y : p.y;
      if (Math.hypot(px - PLACES.rosaGarage.x, py - PLACES.rosaGarage.y) < 90) {
        this.missions.start(0);
      }
    }
    // Later jobs start at the same garage.
    if (!this.missions.active && this.nextMissionAt) {
      const p = this.player;
      const px = p.inCar ? p.car.x : p.x;
      const py = p.inCar ? p.car.y : p.y;
      if (Math.hypot(px - this.nextMissionAt.x, py - this.nextMissionAt.y) < 90) {
        this.nextMissionAt = null;
        this.missions.start(this.missionsDoneCount);
      }
    }

    updatePlayer(this, dt, input, mouseWorld);
    this.playerSpeed = this.player.speed;
    if (this.taxiRide) updateRide(this, dt);

    // The armored van runs its route until it is stopped. Its driver steers
    // back onto Bayfront Ave after being shoved off it by a ram.
    if (this.missions.van) {
      const van = this.missions.van;
      if (!van.dead && van.health > 0) {
        van.speed = 90;
        van.angle = van.vanRoute === 1 ? 0 : Math.PI;
        van.x += Math.cos(van.angle) * van.speed * dt;
        van.y += (1000 - van.y) * Math.min(1, dt * 2);
        if (van.x > 3400) van.vanRoute = -1;
        if (van.x < 200) van.vanRoute = 1;
        if (van.smoking && Math.random() < dt * 4) {
          this.particles.push({
            x: van.x, y: van.y - 10, vx: range(this.rng, -20, 20), vy: -40,
            life: 0.8, maxLife: 0.8, color: '#555', size: 6, smoke: true,
          });
        }
      }
    }

    for (const car of [...this.cars]) {
      if (car.dead) continue;
      if (car.type === 'traffic' || car.type === 'taxi') updateTrafficCar(this, car, dt);
      else if (car.type === 'police') updatePoliceCar(this, car, dt);
      if (car.smoking && Math.random() < dt * 6) {
        this.particles.push({
          x: car.x, y: car.y - 8, vx: range(this.rng, -15, 15), vy: -50,
          life: 0.9, maxLife: 0.9, color: '#666', size: 6, smoke: true,
        });
      }
    }

    for (const ped of [...this.peds]) {
      if (ped.state === 'cop') updateCop(this, ped, dt);
      else if (ped.state === 'gang') this.updateGang(ped, dt);
      else updatePed(this, ped, dt);
    }

    // The police helicopter: one eye in the sky from three stars up, gone
    // when the heat dies down.
    if (this.helis.length < heliTargetCount(this.wanted)) spawnHeli(this);
    if (this.wanted === 0) this.helis = [];
    for (const heli of this.helis) updateHeli(this, heli, dt);

    this.maintainPopulation();
    this.updateWanted(dt);
    this.missions.update(dt);
    this.updatePickups(dt);
    this.updateShop(input);
    this.healAtHospital(dt);
    updateParticles(this, dt);
    for (const t of this.tracers) t.life -= dt;
    this.tracers = this.tracers.filter((t) => t.life > 0);

    // Camera follows the player (or the car) with a little smoothing.
    const tx = this.player.x;
    const ty = this.player.y;
    this.camera.x += (tx - this.camera.x) * Math.min(1, dt * 5);
    this.camera.y += (ty - this.camera.y) * Math.min(1, dt * 5);

    // Sound follows the action.
    const top = this.player.inCar && this.player.car ? (this.player.car.topSpeed || 420) : 420;
    this.audio.setEngine(this.player.inCar ? Math.abs(this.player.car.speed) / top : 0);
    this.audio.setSiren(this.wanted > 0 && this.cars.some((c) => c.type === 'police' && !c.dead));
    this.audio.setRotor(this.helis.length > 0);

    // Drain one-shot events into banners.
    for (const ev of this.events) {
      if (ev.type === 'banner') this.banner = { text: ev.text, color: ev.color, t: 3 };
    }
    this.events.length = 0;
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
  }

  updateGang(gang, dt) {
    const p = this.player;
    if (p.inCar) { gang.speed = 0; return; }
    const dx = p.x - gang.x;
    const dy = p.y - gang.y;
    const d = Math.hypot(dx, dy);
    if (d > 600) { gang.speed = 0; return; }
    gang.angle = Math.atan2(dy, dx);
    gang.speed = 150;
    gang.x += Math.cos(gang.angle) * gang.speed * dt;
    gang.y += Math.sin(gang.angle) * gang.speed * dt;
    gang.attackCooldown -= dt;
    if (d < 34 && gang.attackCooldown <= 0) {
      gang.attackCooldown = 1.0;
      this.damagePlayer(10);
      this.audio.punch();
    }
  }

  maintainPopulation() {
    const p = this.player;
    // Traffic: about 14 cars near the player.
    const traffic = this.cars.filter((c) => (c.type === 'traffic' || c.type === 'taxi') && !c.dead);
    if (traffic.length < 12) {
      // One in eight fresh cars is a taxi, so the streets always have cabs.
      if (this.rng() < 0.125) this.spawnTaxiCar();
      else this.spawnTrafficCar();
    }
    this.cars = this.cars.filter((c) => {
      if (c.dead && c.type !== 'van') return Math.hypot(c.x - p.x, c.y - p.y) < 1400;
      if ((c.type === 'traffic' || c.type === 'taxi') && Math.hypot(c.x - p.x, c.y - p.y) > 1400) return false;
      return true;
    });
    // Pedestrians: about 18 near the player.
    const walkers = this.peds.filter((pd) => pd.state === 'walk' || pd.state === 'flee');
    if (walkers.length < 16) this.spawnPed();
    this.peds = this.peds.filter((pd) => {
      if (pd.state === 'down') return Math.hypot(pd.x - p.x, pd.y - p.y) < 900;
      if ((pd.state === 'walk' || pd.state === 'flee') && Math.hypot(pd.x - p.x, pd.y - p.y) > 1100) return false;
      return true;
    });
    // Police presence follows the wanted level.
    const want = policeTargetCount(this.wanted);
    const policeCars = this.cars.filter((c) => c.type === 'police' && !c.dead);
    if (policeCars.length < want) spawnPoliceCar(this);
    if (this.wanted === 0) {
      this.cars = this.cars.filter((c) => c.type !== 'police' || Math.hypot(c.x - p.x, c.y - p.y) < 1600);
    }
    const cops = this.peds.filter((pd) => pd.state === 'cop');
    if (this.wanted >= 1 && !p.inCar && cops.length < Math.min(2, this.wanted)) spawnCop(this);
    if (this.wanted === 0) this.peds = this.peds.filter((pd) => pd.state !== 'cop');
  }

  updateWanted(dt) {
    if (this.heat <= 0) { this.wanted = 0; return; }
    const nearPolice = this.cars.some((c) => c.type === 'police' && !c.dead && Math.hypot(c.x - this.player.x, c.y - this.player.y) < 450)
      || this.peds.some((pd) => pd.state === 'cop' && Math.hypot(pd.x - this.player.x, pd.y - this.player.y) < 450);
    if (!nearPolice && this.time - this.lastCrimeAt > 8) {
      this.heat = Math.max(0, this.heat - TUNE.wantedDecayPerSec * dt);
      this.wanted = Math.min(5, Math.ceil(this.heat / TUNE.wantedPerStar));
    }
  }

  updatePickups(dt) {
    this.cashTimer -= dt;
    if (this.cashTimer <= 0) {
      this.cashTimer = 25;
      if (this.cashPickups.length < 3) {
        const p = randomRoadPoint(this.rng);
        this.cashPickups.push({ x: p.x, y: p.y, amount: pick(this.rng, [50, 75, 100, 150]) });
      }
    }
    const p = this.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    for (const c of [...this.cashPickups]) {
      if (Math.hypot(c.x - px, c.y - py) < 36) {
        p.money += c.amount;
        this.audio.cash();
        this.events.push({ type: 'banner', text: `+$${c.amount} cash`, color: '#7fd67f' });
        this.cashPickups = this.cashPickups.filter((o) => o !== c);
      }
    }
  }

  updateShop(input) {
    const p = this.player;
    const d = Math.hypot(p.x - PLACES.ironworks.x, p.y - PLACES.ironworks.y);
    if (d < 90 && !p.inCar) {
      this.shopPrompt = this.shopOwnedPistol
        ? 'Ironworks — [4] Armor $300  |  [2] Pistol ready'
        : 'Ironworks — [3] Pistol $500  |  [4] Armor $300';
      if (input.pressed('Digit3') && !this.shopOwnedPistol && p.money >= TUNE.pistolPrice) {
        p.money -= TUNE.pistolPrice;
        this.shopOwnedPistol = true;
        p.weapon = 'pistol';
        p.ammo += TUNE.pistolAmmoStart;
        this.audio.cash();
        this.events.push({ type: 'banner', text: 'Pistol bought — press 2 to draw it', color: '#7fd67f' });
      }
      if (input.pressed('Digit4') && p.money >= TUNE.armorPrice && p.armor < TUNE.maxArmor) {
        p.money -= TUNE.armorPrice;
        p.armor = TUNE.maxArmor;
        this.audio.cash();
        this.events.push({ type: 'banner', text: 'Armor fitted — 100', color: '#7fd67f' });
      }
    } else {
      this.shopPrompt = null;
    }
  }

  healAtHospital(dt) {
    const p = this.player;
    if (p.inCar) return;
    const d = Math.hypot(p.x - PLACES.hospital.x, p.y - PLACES.hospital.y);
    if (d < 70 && p.health < TUNE.maxHealth) p.health = Math.min(TUNE.maxHealth, p.health + 12 * dt);
  }

  save() {
    return writeSave({
      money: this.player.money,
      missionsDone: this.missionsDoneCount,
      weapon: this.player.weapon,
      ammo: this.player.ammo,
      armor: this.player.armor,
      health: this.player.health,
      x: this.player.x,
      y: this.player.y,
      taxiFaresPaid: this.taxiFaresPaid,
    });
  }
}
