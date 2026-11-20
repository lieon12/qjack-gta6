// The police helicopter. At one or two wanted stars it patrols high over
// the city, circling wide; at three stars and up it drops into pursuit,
// hanging over the player with its searchlight on them so the chase is
// visible even when the patrol cars fall behind. When the heat is gone it
// climbs away and leaves.
export class PoliceHeli {
  constructor() {
    this.active = false;
    this.mode = 'away'; // away | patrol | pursuit
    this.x = 0;
    this.y = 0;
    this.orbit = 0;
    this.alt = 1; // 1 = high, lower when pursuing
    this.spotX = 0;
    this.spotY = 0;
  }

  update(world, dt) {
    const p = world.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    const wanted = world.wanted;

    if (wanted >= 3) this.mode = 'pursuit';
    else if (wanted >= 1) this.mode = 'patrol';
    else this.mode = 'away';

    if (this.mode === 'away') {
      if (this.active) {
        // Climb away from the player until it is out of sight, then switch off.
        const d = Math.hypot(this.x - px, this.y - py);
        this.alt = Math.min(2, this.alt + dt * 0.5);
        this.x += ((this.x - px) / Math.max(1, d)) * 260 * dt;
        this.y += ((this.y - py) / Math.max(1, d)) * 260 * dt;
        if (d > 1400) this.active = false;
      }
      return;
    }

    if (!this.active) {
      // Arrive from the edge of the sky, above the player.
      this.active = true;
      this.x = px + 600;
      this.y = py - 600;
      this.orbit = Math.atan2(this.y - py, this.x - px);
      this.alt = 1.6;
    }
    const radius = this.mode === 'pursuit' ? 190 : 520;
    const speed = this.mode === 'pursuit' ? 0.55 : 0.25;
    this.orbit += speed * dt;
    const tx = px + Math.cos(this.orbit) * radius;
    const ty = py + Math.sin(this.orbit) * radius;
    this.x += (tx - this.x) * Math.min(1, dt * 1.6);
    this.y += (ty - this.y) * Math.min(1, dt * 1.6);
    const targetAlt = this.mode === 'pursuit' ? 1 : 1.6;
    this.alt += (targetAlt - this.alt) * Math.min(1, dt * 1.2);
    // The searchlight stays pinned on the player while pursuing.
    this.spotX = px;
    this.spotY = py;
  }
}
