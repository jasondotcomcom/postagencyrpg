import { useRef, useState, useCallback, useEffect, Suspense } from 'react';
import AppRouter from './AppRouter';
import MobileAppHeader from './MobileAppHeader';
import { useMobileContext } from '../../context/MobileContext';
import { useTouchGesture } from '../../hooks/useTouchGesture';
import { hapticTap } from './haptics';
import styles from './Mobile.module.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum x for a touch to be considered an "edge swipe". */
const EDGE_ZONE = 20;
/** Distance (px) required to complete the edge-swipe-back gesture. */
const SWIPE_BACK_THRESHOLD = 100;
/** Animation duration -- must match the CSS value. */
const ANIMATION_MS = 200;
/** Brief delay before showing app content (loading skeleton). */
const LOADING_DELAY_MS = 150;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the user prefers reduced motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// Loading skeleton -- brief placeholder while app content initialises
// ---------------------------------------------------------------------------

function AppLoadingSkeleton() {
  return (
    <div className={styles.appLoadingSkeleton}>
      <div className={styles.appLoadingSpinner} />
      <span className={styles.appLoadingText}>Loading&hellip;</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DelayedContent -- shows skeleton for LOADING_DELAY_MS, then real content
// ---------------------------------------------------------------------------

function DelayedContent({ appId }: { appId: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [appId]);

  if (!ready) {
    return <AppLoadingSkeleton />;
  }

  return (
    <Suspense fallback={<AppLoadingSkeleton />}>
      <AppRouter appId={appId} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// MobileAppContainer
// ---------------------------------------------------------------------------

interface MobileAppContainerProps {
  appId: string;
}

export default function MobileAppContainer({ appId }: MobileAppContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { goBack, goHome } = useMobileContext();

  // --- Animation state ---------------------------------------------------
  const reduced = prefersReducedMotion();
  const [animClass, setAnimClass] = useState<string>(
    reduced ? '' : styles.appContainerEntering,
  );
  const isExitingRef = useRef(false);

  // Remove entering class after animation completes
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setAnimClass(''), ANIMATION_MS);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play exit animation then fire the actual navigation callback
  const playExitThen = useCallback(
    (action: () => void) => {
      if (isExitingRef.current) return;
      isExitingRef.current = true;

      if (reduced) {
        action();
        return;
      }

      setAnimClass(styles.appContainerExiting);
      setTimeout(() => action(), ANIMATION_MS);
    },
    [reduced],
  );

  const handleBack = useCallback(() => {
    hapticTap();
    playExitThen(goBack);
  }, [playExitThen, goBack]);

  const handleHome = useCallback(() => {
    hapticTap();
    playExitThen(goHome);
  }, [playExitThen, goHome]);

  // --- Edge-swipe-back gesture -------------------------------------------
  const edgeSwipeActiveRef = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStartCapture = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    edgeSwipeActiveRef.current = touch.clientX < EDGE_ZONE;
    if (!edgeSwipeActiveRef.current) {
      setSwipeOffset(0);
    }
  }, []);

  useTouchGesture(containerRef, {
    swipeThreshold: SWIPE_BACK_THRESHOLD,
    onSwipeMove(deltaX) {
      if (!edgeSwipeActiveRef.current) return;
      setSwipeOffset(Math.max(0, deltaX));
    },
    onSwipeRight() {
      if (!edgeSwipeActiveRef.current) return;
      edgeSwipeActiveRef.current = false;
      setSwipeOffset(0);
      handleBack();
    },
    onSwipeEnd() {
      edgeSwipeActiveRef.current = false;
      setSwipeOffset(0);
    },
  });

  // --- Inline styles for swipe offset ------------------------------------
  const translateStyle =
    swipeOffset > 0
      ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' }
      : undefined;

  const className = [styles.appContainer, animClass].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStartCapture={handleTouchStartCapture}
      style={translateStyle}
    >
      <MobileAppHeader appId={appId} onBack={handleBack} onHome={handleHome} />
      <div className={styles.appContent}>
        <DelayedContent appId={appId} />
      </div>
    </div>
  );
}
