// Save and continue: money, missions, weapons and position in localStorage.
// The game never needs a network request, and neither does saving.
const KEY = 'solmar-bay-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.money !== 'number') return null;
    // Revision fields are optional so saves from the five-mission build still load.
    if (typeof data.taxiEarned !== 'number') data.taxiEarned = 0;
    if (typeof data.clockHours !== 'number') data.clockHours = 10;
    if (typeof data.weather !== 'string') data.weather = 'clear';
    return data;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({
      money: state.money,
      missionsDone: state.missionsDone,
      weapon: state.weapon,
      ammo: state.ammo,
      armor: state.armor,
      health: state.health,
      x: state.x,
      y: state.y,
      taxiEarned: state.taxiEarned || 0,
      clockHours: state.clockHours ?? 10,
      weather: state.weather || 'clear',
      savedAt: Date.now(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}
