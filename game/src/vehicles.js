// The six drivable vehicle models of Solmar Bay. Each one is a different
// body with its own top speed, acceleration, steering and length, so a
// sports car, a taxi and a limo genuinely drive differently — the player
// feels which one they stole. Traffic and parked cars are dealt a model
// from this list, and the renderer draws each body its own way.
export const VEHICLE_MODELS = [
  {
    id: 'comet', name: 'Comet GT', kind: 'sports',
    top: 520, accel: 430, turn: 3.1, len: 44, wid: 20,
    color: '#d94f3d', roof: '#8c2f22', spoiler: true,
  },
  {
    id: 'cruiser', name: 'Bay Cruiser', kind: 'sedan',
    top: 420, accel: 320, turn: 2.6, len: 44, wid: 20,
    color: '#3d7bd9', roof: '#274a7d',
  },
  {
    id: 'taxi', name: 'Solmar Taxi', kind: 'taxi',
    top: 400, accel: 300, turn: 2.7, len: 44, wid: 20,
    color: '#f2c14e', roof: '#f2c14e', taxi: true,
  },
  {
    id: 'hauler', name: 'Dock Hauler', kind: 'pickup',
    top: 360, accel: 280, turn: 2.2, len: 54, wid: 22,
    color: '#7fb069', roof: '#4d7a3d', bed: true,
  },
  {
    id: 'runner', name: 'Sun Runner', kind: 'convertible',
    top: 460, accel: 360, turn: 2.9, len: 44, wid: 20,
    color: '#c96f9b', roof: '#c96f9b', open: true,
  },
  {
    id: 'limo', name: 'Marina Limo', kind: 'limo',
    top: 380, accel: 260, turn: 2.0, len: 64, wid: 20,
    color: '#22242a', roof: '#3a3d47', long: true,
  },
];

export function modelById(id) {
  return VEHICLE_MODELS.find((m) => m.id === id) || VEHICLE_MODELS[1];
}

// A random model for a traffic or parked car.
export function randomModel(rng) {
  const pickFrom = rng || Math.random;
  return VEHICLE_MODELS[Math.floor(pickFrom() * VEHICLE_MODELS.length)];
}

// Handling numbers for a car: its model's, or the sedan's when it has none.
export function modelStats(car) {
  if (!car) return VEHICLE_MODELS[1];
  if (car.type === 'van') {
    return {
      id: 'van', name: 'Armored Van', kind: 'van',
      top: 300, accel: 220, turn: 1.9, len: 54, wid: 22,
      color: car.color || '#3d3a38', roof: '#3d3a38',
    };
  }
  return modelById(car.model || 'cruiser');
}
