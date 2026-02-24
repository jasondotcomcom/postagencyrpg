import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Extended DeviceMotionEvent constructor for iOS 13+ */
interface DeviceMotionEventConstructor {
  new (type: string, eventInit?: DeviceMotionEventInit): DeviceMotionEvent;
  prototype: DeviceMotionEvent;
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ShakeDetectionOptions {
  /** Called when shake is detected. */
  onShake: () => void;
  /** Acceleration threshold in m/s^2 (default 15). */
  threshold?: number;
  /** Number of threshold-exceeding accelerations required (default 3). */
  shakeCount?: number;
  /** Window in ms within which shakeCount events must occur (default 500). */
  windowMs?: number;
  /** Debounce in ms — won't fire again within this period (default 1000). */
  debounceMs?: number;
  /** If true, the hook is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShakeDetection(options: ShakeDetectionOptions): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (optsRef.current.disabled) return;

    // Check for DeviceMotionEvent support
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      return;
    }

    const threshold = optsRef.current.threshold ?? 15;
    const requiredCount = optsRef.current.shakeCount ?? 3;
    const windowMs = optsRef.current.windowMs ?? 500;
    const debounceMs = optsRef.current.debounceMs ?? 1000;

    const shakeTimestamps: number[] = [];
    let lastFireTime = 0;
    let permissionGranted = false;
    let listening = false;

    function handleMotion(event: Event) {
      const motionEvent = event as DeviceMotionEvent;
      const acc = motionEvent.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      // Subtract rough gravity and compute magnitude
      const magnitude = Math.sqrt(x * x + y * y + z * z) - 9.81;

      if (magnitude < threshold) return;

      const now = Date.now();

      // Debounce check
      if (now - lastFireTime < debounceMs) return;

      // Record this shake event
      shakeTimestamps.push(now);

      // Remove old entries outside the window
      while (shakeTimestamps.length > 0 && now - shakeTimestamps[0] > windowMs) {
        shakeTimestamps.shift();
      }

      // Check if we have enough shakes within the window
      if (shakeTimestamps.length >= requiredCount) {
        lastFireTime = now;
        shakeTimestamps.length = 0;
        optsRef.current.onShake();
      }
    }

    function startListening() {
      if (listening) return;
      listening = true;
      window.addEventListener('devicemotion', handleMotion);
    }

    // iOS 13+ requires permission
    const DME = DeviceMotionEvent as unknown as DeviceMotionEventConstructor;
    if (typeof DME.requestPermission === 'function') {
      // We can't auto-request — must be in response to user gesture.
      // Try requesting on first user interaction.
      function requestOnInteraction() {
        if (permissionGranted) return;
        DME.requestPermission!()
          .then((response: string) => {
            if (response === 'granted') {
              permissionGranted = true;
              startListening();
            }
          })
          .catch(() => {
            // Permission denied or unavailable — silently ignore
          });
        // Remove after first attempt
        window.removeEventListener('touchstart', requestOnInteraction);
        window.removeEventListener('click', requestOnInteraction);
      }

      window.addEventListener('touchstart', requestOnInteraction, { once: true });
      window.addEventListener('click', requestOnInteraction, { once: true });

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        window.removeEventListener('touchstart', requestOnInteraction);
        window.removeEventListener('click', requestOnInteraction);
        listening = false;
      };
    } else {
      // Non-iOS or older — just start listening
      startListening();

      return () => {
        window.removeEventListener('devicemotion', handleMotion);
        listening = false;
      };
    }
  }, []);
}
