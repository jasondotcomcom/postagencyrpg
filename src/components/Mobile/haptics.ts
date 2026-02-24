/**
 * Haptic feedback utilities.
 * Wraps navigator.vibrate with common patterns; no-ops if unsupported.
 */

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Light tap -- 10ms vibration */
export function hapticTap(): void {
  if (canVibrate()) navigator.vibrate(10);
}

/** Success pattern -- two short pulses */
export function hapticSuccess(): void {
  if (canVibrate()) navigator.vibrate([10, 50, 10]);
}

/** Warning pattern -- two medium pulses */
export function hapticWarning(): void {
  if (canVibrate()) navigator.vibrate([30, 50, 30]);
}

/** Error pattern -- three strong pulses */
export function hapticError(): void {
  if (canVibrate()) navigator.vibrate([50, 30, 50, 30, 50]);
}
