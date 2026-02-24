import { useState, useEffect, useRef, useCallback } from 'react';
import { useWindowContext } from '../../context/WindowContext';
import { useMobileContext } from '../../context/MobileContext';
import type { Notification } from '../../types';
import styles from './MobileNotifications.module.css';

/**
 * Push notification banner that slides down from under the status bar.
 * Styled as "Alert from Management". Consumes notifications from
 * WindowContext, queues them, and shows one at a time.
 * Tappable to open the relevant app. Swipe up to dismiss.
 */
export default function MobileToast() {
  const { notifications, removeNotification } = useWindowContext();
  const { openApp } = useMobileContext();

  // Queue of notification IDs to display
  const [queue, setQueue] = useState<Notification[]>([]);
  // Currently visible toast
  const [current, setCurrent] = useState<Notification | null>(null);
  // Animation phase: 'entering' | 'visible' | 'dismissing' | null
  const [phase, setPhase] = useState<'entering' | 'visible' | 'dismissing' | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number>(0);
  const touchDeltaRef = useRef<number>(0);
  const toastRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Track new notifications and add them to the queue
  useEffect(() => {
    const newNotifs = notifications.filter(n => !seenIdsRef.current.has(n.id));
    if (newNotifs.length > 0) {
      newNotifs.forEach(n => seenIdsRef.current.add(n.id));
      setQueue(prev => [...prev, ...newNotifs]);
    }
  }, [notifications]);

  // Show next queued toast when nothing is currently showing
  useEffect(() => {
    if (current || queue.length === 0) return;

    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrent(next);
    setPhase('entering');

    // Transition to visible after a short frame to trigger CSS transition
    const enterTimer = setTimeout(() => {
      setPhase('visible');
    }, 30);

    return () => clearTimeout(enterTimer);
  }, [current, queue]);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (phase !== 'visible') return;

    timerRef.current = setTimeout(() => {
      dismiss();
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const dismiss = useCallback(() => {
    if (phase === 'dismissing') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('dismissing');

    setTimeout(() => {
      if (current) {
        removeNotification(current.id);
      }
      setCurrent(null);
      setPhase(null);
    }, 300);
  }, [phase, current, removeNotification]);

  const handleTap = useCallback(() => {
    if (!current) return;
    // Try to infer app from notification icon or title
    const appId = guessAppId(current);
    if (appId) {
      openApp(appId);
    }
    dismiss();
  }, [current, openApp, dismiss]);

  // Touch handling for swipe-up-to-dismiss
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartYRef.current;
    touchDeltaRef.current = delta;

    // Live feedback: translate toast as user drags
    if (toastRef.current && delta < 0) {
      toastRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchDeltaRef.current < -50) {
      // Swiped up enough to dismiss
      dismiss();
    } else if (toastRef.current) {
      // Snap back
      toastRef.current.style.transform = '';
    }
  }, [dismiss]);

  if (!current) return null;

  const toastClasses = [
    styles.toast,
    phase === 'visible' ? styles.toastVisible : '',
    phase === 'dismissing' ? styles.toastDismissing : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.toastWrapper}>
      <div
        ref={toastRef}
        className={toastClasses}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="alert"
        aria-live="polite"
      >
        <div className={styles.toastIcon}>
          {current.icon ?? '\u{1F514}'}
        </div>
        <div className={styles.toastBody}>
          <div className={styles.toastTitle}>Alert from Management</div>
          <div className={styles.toastMessage}>{current.message}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Try to guess which app a notification is associated with based on its
 * icon string or title. Falls back to 'inbox'.
 */
function guessAppId(notif: Notification): string {
  const icon = notif.icon?.toLowerCase() ?? '';
  const title = notif.title.toLowerCase();

  if (icon.includes('inbox') || icon.includes('mail') || title.includes('email') || title.includes('inbox')) return 'inbox';
  if (icon.includes('chat') || title.includes('chat') || title.includes('message')) return 'chat';
  if (icon.includes('calendar') || title.includes('calendar') || title.includes('event')) return 'calendar';
  if (icon.includes('project') || title.includes('project')) return 'projects';
  if (icon.includes('terminal') || title.includes('terminal')) return 'terminal';
  if (icon.includes('note') || title.includes('note')) return 'notes';
  if (icon.includes('setting') || title.includes('setting')) return 'settings';
  if (icon.includes('help') || title.includes('help')) return 'help';
  if (icon.includes('portfolio') || title.includes('portfolio')) return 'portfolio';

  return 'inbox';
}
