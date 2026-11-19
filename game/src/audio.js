// All sound is synthesised with WebAudio — no audio files, no network.
// Engine hum, sirens, gunshots, punches, pickups and a low-key music loop.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicOn = true;
    this._engineOsc = null;
    this._engineGain = null;
    this._sirenOsc = null;
    this._sirenGain = null;
    this._musicTimer = null;
    this._musicStep = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      // Engine: a low sawtooth whose pitch follows the car's speed.
      this._engineOsc = this.ctx.createOscillator();
      this._engineOsc.type = 'sawtooth';
      this._engineOsc.frequency.value = 55;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      this._engineGain = this.ctx.createGain();
      this._engineGain.gain.value = 0;
      this._engineOsc.connect(lp).connect(this._engineGain).connect(this.ctx.destination);
      this._engineOsc.start();
      // Police siren: a triangle that wails between two notes.
      this._sirenOsc = this.ctx.createOscillator();
      this._sirenOsc.type = 'triangle';
      this._sirenOsc.frequency.value = 700;
      this._sirenGain = this.ctx.createGain();
      this._sirenGain.gain.value = 0;
      this._sirenOsc.connect(this._sirenGain).connect(this.ctx.destination);
      this._sirenOsc.start();
      this._startMusic();
    } catch {
      this.ctx = null;
    }
  }

  setEngine(speed01) {
    if (!this.ctx || !this._engineGain) return;
    this._engineGain.gain.setTargetAtTime(0.02 + speed01 * 0.05, this.ctx.currentTime, 0.1);
    this._engineOsc.frequency.setTargetAtTime(50 + speed01 * 110, this.ctx.currentTime, 0.1);
  }

  setSiren(on) {
    if (!this.ctx || !this._sirenGain) return;
    this._sirenGain.gain.setTargetAtTime(on ? 0.035 : 0, this.ctx.currentTime, 0.2);
    if (on) this._sirenOsc.frequency.setTargetAtTime(700 + Math.sin(this.ctx.currentTime * 4) * 180, this.ctx.currentTime, 0.05);
  }

  _blip(freq, dur, type = 'sine', vol = 0.08) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + dur);
    } catch { /* audio is decoration; never break the game */ }
  }

  _noise(dur, vol = 0.12) {
    if (!this.ctx) return;
    try {
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g).connect(this.ctx.destination);
      src.start();
    } catch { /* ignore */ }
  }

  // Taxi fare paid: a cheerful two-note chime. Helicopter alert: a low thump.
  fare() { this._blip(880, 0.1); setTimeout(() => this._blip(1318, 0.16), 90); }
  heliAlert() { this._blip(110, 0.25, 'sawtooth', 0.07); setTimeout(() => this._blip(110, 0.25, 'sawtooth', 0.07), 260); }
  setHeli(on) {
    if (!this.ctx) return;
    try {
      if (on && !this._heliOsc) {
        this._heliOsc = this.ctx.createOscillator();
        this._heliOsc.type = 'square';
        this._heliOsc.frequency.value = 38;
        this._heliGain = this.ctx.createGain();
        this._heliGain.gain.value = 0.02;
        this._heliOsc.connect(this._heliGain).connect(this.ctx.destination);
        this._heliOsc.start();
      } else if (!on && this._heliOsc) {
        this._heliGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        const osc = this._heliOsc;
        setTimeout(() => { try { osc.stop(); } catch { /* already stopped */ } }, 600);
        this._heliOsc = null;
      }
    } catch { /* rotor sound is decoration; never break the game */ }
  }
  shoot() { this._noise(0.12, 0.16); this._blip(160, 0.08, 'square', 0.05); }
  punch() { this._noise(0.07, 0.1); this._blip(90, 0.09, 'sine', 0.09); }
  crash() { this._noise(0.25, 0.14); }
  pickup() { this._blip(660, 0.09); setTimeout(() => this._blip(880, 0.12), 70); }
  cash() { this._blip(880, 0.08); setTimeout(() => this._blip(1174, 0.14), 80); }
  wantedUp() { this._blip(220, 0.18, 'square', 0.06); setTimeout(() => this._blip(180, 0.22, 'square', 0.06), 140); }
  missionDone() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._blip(f, 0.16, 'triangle', 0.07), i * 110));
  }
  busted() { [392, 330, 262].forEach((f, i) => setTimeout(() => this._blip(f, 0.3, 'sawtooth', 0.05), i * 200)); }

  // A slow, warm bass-and-pad loop: Am – F – C – G, one bar a second.
  _startMusic() {
    if (this._musicTimer) return;
    const roots = [110, 87.3, 130.8, 98];
    this._musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicOn) return;
      const root = roots[this._musicStep % 4];
      this._musicStep += 1;
      [1, 1.5, 2].forEach((mult, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.value = root * mult;
        g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(i === 0 ? 0.045 : 0.018, this.ctx.currentTime + 0.2);
        g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
        o.connect(g).connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + 1.05);
      });
    }, 1000);
  }
}
