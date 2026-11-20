// Save and continue: money, missions, weapons, taxi fares and position in
// localStorage. The game never needs a network request, and neither does
// saving. Old saves without the newer fields still load — the missing
// numbers just fall back to zero.
const KEY = 'solmar-bay-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.money !== 'number') return null;
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
      taxiFaresPaid: state.taxiFaresPaid || 0,
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
