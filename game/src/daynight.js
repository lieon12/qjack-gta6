// The sky over Solmar Bay: a clock and the weather.
// The clock starts mid-morning and runs — one game hour every few real
// seconds — from dawn through noon to dusk and night, then round again. The
// weather drifts on its own timer between clear skies, overcast, rain and
// fog. The renderer reads the light level and the weather to paint the city;
// the HUD reads the clock, the phase name and the weather for its readout.
import { TUNE } from './config.js';
import { chance, range } from './random.js';

const WEATHERS = ['clear', 'clear', 'overcast', 'rain', 'fog'];

export class Sky {
  constructor() {
    this.hour = 10.0; // 10:00, a bright late morning
    this.weather = 'clear';
    this.weatherTimer = 55;
    this.rainSeed = 0;
  }

  update(dt, rng) {
    this.hour += dt / TUNE.hourSeconds;
    if (this.hour >= 24) this.hour -= 24;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = range(rng, TUNE.weatherMinSec, TUNE.weatherMaxSec);
      const next = WEATHERS[Math.floor(rng() * WEATHERS.length)];
      // Rain and fog never follow themselves straight away; the sky moves on.
      this.weather = next === this.weather && chance(rng, 0.5)
        ? 'clear'
        : next;
      this.rainSeed += 1;
    }
  }

  // 0 in the dead of night, 1 at noon. Dawn breaks at 6, dusk falls at 19.
  daylight() {
    const h = this.hour;
    if (h < 5 || h >= 20) return 0;
    if (h < 7) return (h - 5) / 2;
    if (h < 17) return 1;
    if (h < 20) return 1 - (h - 17) / 3;
    return 0;
  }

  phase() {
    const h = this.hour;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }

  // How dark the night overlay should be: nothing by day, a deep blue veil
  // at night, with overcast and rain dimming the daylight a little too.
  darkness() {
    let d = (1 - this.daylight()) * 0.55;
    if (this.weather === 'overcast') d += 0.10;
    if (this.weather === 'rain') d += 0.16;
    if (this.weather === 'fog') d += 0.06;
    return Math.min(0.62, d);
  }

  isNight() {
    return this.phase() === 'night';
  }

  // "14:32" — the clock the HUD prints.
  clockText() {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  weatherLabel() {
    if (this.weather === 'clear') return this.daylight() > 0.6 ? 'Clear' : 'Clear night';
    if (this.weather === 'overcast') return 'Overcast';
    if (this.weather === 'rain') return 'Rain';
    return 'Fog';
  }

  // For the tests and the screenshot scenes: jump the clock and the weather
  // without waiting for the sky to turn on its own.
  setTime(hour, weather) {
    this.hour = hour;
    if (weather) this.weather = weather;
    this.weatherTimer = 120;
  }
}
