import { initial } from './parking';
const storageKey = 'halo-parking-session-v1';
export function loadSession() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initial();
    const saved = JSON.parse(raw);
    const state = saved.state;
    if (saved.version !== 1 || !Array.isArray(state?.requests) || !Array.isArray(state.queue)) return initial();
    const ids = new Set(state.requests.map(r => r.id));
    if (ids.size !== 2 || !ids.has('C-118') || !ids.has('C-076') || !ids.has(state.selected)) return initial();
    if (!state.queue.every(id => ids.has(id)) || new Set(state.queue).size !== state.queue.length) return initial();
    if (!['occupied', 'reserved', 'checking', 'clear'].includes(state.shaft)) return initial();
    if (!state.overrides || typeof state.overrides !== 'object') return initial();
    const defaults = initial().requests;
    return {...state, requests:state.requests.map(r=>({...r,arrival:r.arrival||defaults.find(d=>d.id===r.id).arrival,departure:r.departure==='Now'?'14:35':r.departure}))};
  } catch {
    return initial();
  }
}
export function saveSession(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, state }));
  } catch {
    // The demo remains usable when browser storage is unavailable.
  }
}
