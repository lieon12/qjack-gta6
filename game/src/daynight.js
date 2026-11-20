// The sky clock: a day/night cycle and weather that change how the city
// looks and how cars handle. One full day lasts four minutes of play; the
// weather rolls to a new state every minute or so, and rain makes the roads
// slick while fog and night cut how far the player can see clearly.
export const WEATHERS = ['clear', 'clouds', 'rain', 'storm', 'fog'];

const WEATHER_NAMES = {
  clear: 'Clear',
  clouds: 'Cloudy',
  rain: 'Rain',
  storm: 'Storm',
  fog: 'Fog',
};

export class SkyClock {
  constructor() {
    this.hour = 10; // 10:00 in the morning when a new game starts
    this.weather = 'clear';
    this.weatherTimer = 55;
    this.dayLengthSec = 240; // one full day per four minutes
  }

  update(dt, rng) {
    this.hour = (this.hour + (dt / this.dayLengthSec) * 24) % 24;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 40 + (rng ? rng() * 40 : 20);
      // Clear skies are the most likely; storms are rare.
      const roll = rng ? rng() : Math.random();
      this.weather = roll < 0.45 ? 'clear'
        : roll < 0.65 ? 'clouds'
          : roll < 0.8 ? 'rain'
            : roll < 0.9 ? 'fog' : 'storm';
    }
  }

  // Dawn 5-7, day 7-17, dusk 17-19, night otherwise.
  phase() {
    const h = this.hour;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 19) return 'dusk';
    return 'night';
  }

  phaseName() {
    const p = this.phase();
    return p === 'day' ? 'Day' : p === 'night' ? 'Night' : p === 'dawn' ? 'Dawn' : 'Dusk';
  }

  weatherName() {
    return WEATHER_NAMES[this.weather] || 'Clear';
  }

  // 0-1 brightness the renderer tints the frame with.
  light() {
    const p = this.phase();
    if (p === 'day') return 1;
    if (p === 'dawn' || p === 'dusk') return 0.6;
    return 0.3;
  }

  // How much grip the roads have: rain and storm make cars slide.
  grip() {
    if (this.weather === 'storm') return 0.82;
    if (this.weather === 'rain') return 0.9;
    return 1;
  }

  // Fog thickness, 0 when the air is clear.
  fogAlpha() {
    if (this.weather === 'fog') return 0.28;
    if (this.weather === 'clouds') return 0.06;
    return 0;
  }

  timeLabel() {
    const h = Math.floor(this.hour);
    const m = Math.floor((this.hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  label() {
    return `${this.timeLabel()} · ${this.phaseName()} · ${this.weatherName()}`;
  }
}
