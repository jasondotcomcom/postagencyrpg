// Lightweight save signal — any context can emit, SaveIndicator listens.
export function emitSave() {
  window.dispatchEvent(new CustomEvent('agencyrpg-save'));
}
