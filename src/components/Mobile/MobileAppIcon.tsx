import { useCallback, useRef } from 'react';
import { icons } from './mobileIcons';
import { useMobileContext } from '../../context/MobileContext';
import { hapticTap } from './haptics';
import styles from './Mobile.module.css';

interface MobileAppIconProps {
  appId: string;
  label: string;
  iconKey: string;
  badgeCount?: number;
  showLabel?: boolean;
  /** Called on long-press with the icon's bounding rect. */
  onLongPress?: (appId: string, rect: DOMRect) => void;
}

/** Long-press duration in ms. */
const LONG_PRESS_MS = 500;

export default function MobileAppIcon({
  appId,
  label,
  iconKey,
  badgeCount,
  showLabel = true,
  onLongPress,
}: MobileAppIconProps) {
  const { openApp } = useMobileContext();
  const iconRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const handleClick = useCallback(() => {
    // If a long-press just fired, suppress the click
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    openApp(appId);
  }, [openApp, appId]);

  // --- Long press via pointer events (works for both touch & mouse) ---

  const clearTimer = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      longPressFired.current = false;
      if (!onLongPress) return;

      clearTimer();
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true;
        longPressTimer.current = null;
        hapticTap();
        const rect = iconRef.current?.getBoundingClientRect();
        if (rect) {
          onLongPress(appId, rect);
        }
        // Prevent the subsequent click
      }, LONG_PRESS_MS);

      // We do NOT call e.preventDefault() here to keep scrolling working
      // unless the user holds long enough.
      void e; // satisfy linter
    },
    [appId, onLongPress, clearTimer],
  );

  const handleTouchMove = useCallback(() => {
    // If user moves finger, cancel long-press
    clearTimer();
  }, [clearTimer]);

  const handleTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const isToolIcon = iconKey.startsWith('tool:');
  const emojiChar = isToolIcon ? iconKey.slice(5) : null;

  return (
    <div
      ref={iconRef}
      className={styles.appIcon}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`Open ${label}`}
    >
      <div className={styles.appIconImageWrapper}>
        <div className={styles.appIconImage}>
          {isToolIcon ? (
            <span className={styles.appIconEmoji}>{emojiChar}</span>
          ) : (
            icons[iconKey] || icons.help
          )}
        </div>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className={styles.badge}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      {showLabel && (
        <span className={styles.appIconLabel}>{label}</span>
      )}
    </div>
  );
}
