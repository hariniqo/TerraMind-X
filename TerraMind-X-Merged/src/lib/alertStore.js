// Shared, persistent read-state for weather alerts (localStorage).
// Lets the Dashboard bell count active + unread alerts consistently with the Notifications screen.

const KEY = 'terra_weather_alert_read_ids';

export function getReadAlertIds() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return new Set(JSON.parse(raw || '[]'));
  } catch {
    return new Set();
  }
}

function save(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

export function isAlertRead(id) {
  return getReadAlertIds().has(id);
}

export function markAlertRead(id) {
  const s = getReadAlertIds();
  s.add(id);
  save(s);
}

export function toggleAlertRead(id) {
  const s = getReadAlertIds();
  if (s.has(id)) s.delete(id);
  else s.add(id);
  save(s);
}

export function markAllAlertsRead(ids) {
  const s = getReadAlertIds();
  ids.forEach((id) => s.add(id));
  save(s);
}