// The taxi job: drive a Solmar Taxi, press T near a waiting pedestrian to
// pick them up, and take them where they want to go. The fare is charged
// by distance — a flat flagfall plus a rate per metre from pickup to
// destination — and it is paid in full when the passenger steps out at
// the stop. Leave the cab mid-ride and the fare is lost.
import { PLACES } from './config.js';

export const TAXI_STOPS = [
  PLACES.strip,
  PLACES.casino,
  PLACES.marina,
  PLACES.beach,
  PLACES.hospital,
  PLACES.bank,
  PLACES.docksPickup,
  PLACES.park,
];

const FLAGFALL = 10; // dollars, charged on every ride
const PER_METRE = 0.035; // dollars per metre of pickup-to-destination distance

export class TaxiJob {
  constructor() {
    this.active = false;
    this.passenger = null;
    this.dest = null;
    this.fare = 0;
    this.pickupX = 0;
    this.pickupY = 0;
  }

  fareFor(fromX, fromY, toX, toY) {
    const dist = Math.hypot(toX - fromX, toY - fromY);
    return Math.round(FLAGFALL + dist * PER_METRE);
  }

  // The nearest pedestrian close enough to hail the cab.
  nearestHail(world) {
    const p = world.player;
    if (!p.inCar || !p.car) return null;
    let best = null;
    let bestD = 150;
    for (const ped of world.peds) {
      if (ped.state !== 'walk') continue;
      const d = Math.hypot(ped.x - p.car.x, ped.y - p.car.y);
      if (d < bestD) { bestD = d; best = ped; }
    }
    return best;
  }

  startRide(world, ped) {
    const p = world.player;
    // Pick a destination that is not right where the ride starts.
    const options = TAXI_STOPS.filter(
      (s) => Math.hypot(s.x - p.car.x, s.y - p.car.y) > 400,
    );
    const dest = options.length
      ? options[Math.floor(Math.random() * options.length)]
      : TAXI_STOPS[0];
    this.active = true;
    this.passenger = ped;
    this.dest = dest;
    this.pickupX = p.car.x;
    this.pickupY = p.car.y;
    this.fare = this.fareFor(p.car.x, p.car.y, dest.x, dest.y);
    ped.state = 'riding';
    world.events.push({
      type: 'banner',
      text: `Taxi — take your passenger to ${dest.name}  ·  fare $${this.fare}`,
      color: '#ffd34e',
    });
  }

  dropOff(world) {
    const p = world.player;
    p.money += this.fare;
    world.audio.cash();
    world.events.push({
      type: 'banner',
      text: `Fare paid: +$${this.fare}`,
      color: '#7fd67f',
    });
    const ped = this.passenger;
    if (ped) {
      ped.state = 'walk';
      ped.x = this.dest.x + 30;
      ped.y = this.dest.y + 30;
      ped.wp = null;
    }
    this.active = false;
    this.passenger = null;
    this.dest = null;
    this.fare = 0;
  }

  cancelRide(world) {
    const p = world.player;
    const ped = this.passenger;
    if (ped) {
      ped.state = 'walk';
      ped.x = p.car ? p.car.x + 40 : p.x + 40;
      ped.y = p.car ? p.car.y : p.y;
      ped.wp = null;
    }
    this.active = false;
    this.passenger = null;
    this.dest = null;
    this.fare = 0;
    world.events.push({ type: 'banner', text: 'Passenger left — fare lost', color: '#ff9d4e' });
  }

  update(world, _dt, input) {
    const p = world.player;
    if (this.active) {
      // The passenger rides along inside the cab.
      if (this.passenger) {
        this.passenger.x = p.car ? p.car.x : p.x;
        this.passenger.y = p.car ? p.car.y : p.y;
      }
      // Stepping out of the cab abandons the ride.
      if (!p.inCar || !p.car || p.car.model !== 'taxi') {
        this.cancelRide(world);
        return;
      }
      const d = Math.hypot(p.car.x - this.dest.x, p.car.y - this.dest.y);
      if (d < 80) this.dropOff(world);
      return;
    }
    // No ride yet: T hails a passenger, but only from a taxi.
    if (input && input.pressed && input.pressed('KeyT') && p.inCar && p.car && p.car.model === 'taxi') {
      const ped = this.nearestHail(world);
      if (ped) this.startRide(world, ped);
    }
  }

  // What the HUD shows while a ride is running.
  status(world) {
    if (!this.active || !this.dest) return null;
    const p = world.player;
    const px = p.inCar ? p.car.x : p.x;
    const py = p.inCar ? p.car.y : p.y;
    const left = Math.round(Math.hypot(this.dest.x - px, this.dest.y - py));
    return { dest: this.dest.name, fare: this.fare, metresLeft: left };
  }
}
