import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface TouchGestureOptions {
  /** Called on a completed swipe. */
  onSwipe?: (direction: SwipeDirection, event: TouchEvent) => void;
  onSwipeLeft?: (event: TouchEvent) => void;
  onSwipeRight?: (event: TouchEvent) => void;
  onSwipeUp?: (event: TouchEvent) => void;
  onSwipeDown?: (event: TouchEvent) => void;

  /** Called when user holds for >= longPressMs. */
  onLongPress?: (event: TouchEvent) => void;

  /** Called on two taps within doubleTapMs window. */
  onDoubleTap?: (event: TouchEvent) => void;

  /** Called continuously during a swipe with the current deltaX/deltaY. */
  onSwipeMove?: (deltaX: number, deltaY: number, event: TouchEvent) => void;
  /** Called when a swipe gesture ends (regardless of whether threshold met). */
  onSwipeEnd?: () => void;

  // Thresholds
  /** Minimum distance in px to recognize a swipe (default 50). */
  swipeThreshold?: number;
  /** Hold duration in ms for long-press (default 500). */
  longPressMs?: number;
  /** Window in ms for double-tap (default 300). */
  doubleTapMs?: number;

  /** If true, the hook is disabled. */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTouchGesture(
  ref: RefObject<HTMLElement | null>,
  options: TouchGestureOptions,
): void {
  // Store options in a ref so we always have the latest callbacks
  // without needing to re-attach listeners.
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || optsRef.current.disabled) return;

    // --- State ---------------------------------------------------------------
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTapTime = 0;
    let moved = false;

    // --- Helpers --------------------------------------------------------------

    function clearLongPress() {
      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    // --- Handlers ------------------------------------------------------------

    function handleTouchStart(e: TouchEvent) {
      const opts = optsRef.current;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      moved = false;

      // Long-press timer
      if (opts.onLongPress) {
        clearLongPress();
        longPressTimer = setTimeout(() => {
          if (!moved) {
            opts.onLongPress?.(e);
          }
          longPressTimer = null;
        }, opts.longPressMs ?? 500);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const opts = optsRef.current;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        moved = true;
        clearLongPress();
      }

      opts.onSwipeMove?.(dx, dy, e);
    }

    function handleTouchEnd(e: TouchEvent) {
      clearLongPress();

      const opts = optsRef.current;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const elapsed = Date.now() - startTime;
      const threshold = opts.swipeThreshold ?? 50;

      opts.onSwipeEnd?.();

      // --- Swipe detection ---
      if (!moved || (Math.abs(dx) < threshold && Math.abs(dy) < threshold)) {
        // Not a swipe — check double-tap
        if (!moved && elapsed < 300) {
          const now = Date.now();
          const doubleTapWindow = opts.doubleTapMs ?? 300;
          if (now - lastTapTime < doubleTapWindow) {
            opts.onDoubleTap?.(e);
            lastTapTime = 0; // Reset so triple-tap doesn't re-fire
          } else {
            lastTapTime = now;
          }
        }
        return;
      }

      // Determine primary axis
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > absY && absX >= threshold) {
        const dir: SwipeDirection = dx > 0 ? 'right' : 'left';
        opts.onSwipe?.(dir, e);
        if (dir === 'left') opts.onSwipeLeft?.(e);
        if (dir === 'right') opts.onSwipeRight?.(e);
      } else if (absY >= threshold) {
        const dir: SwipeDirection = dy > 0 ? 'down' : 'up';
        opts.onSwipe?.(dir, e);
        if (dir === 'up') opts.onSwipeUp?.(e);
        if (dir === 'down') opts.onSwipeDown?.(e);
      }
    }

    function handleTouchCancel() {
      clearLongPress();
      optsRef.current.onSwipeEnd?.();
    }

    // --- Attach --------------------------------------------------------------
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      clearLongPress();
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [ref]);
}
