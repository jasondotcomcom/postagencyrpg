import { useState, useRef, useCallback, useEffect } from 'react';
import { useWindowContext } from '../../context/WindowContext';
import { useMobileContext } from '../../context/MobileContext';
import type { Notification } from '../../types';
import styles from './MobileNotifications.module.css';

interface StoredNotification extends Notification {
  timestamp: number;
}

/**
 * Pull-down notification drawer. Toggled via MobileContext.notifDrawerOpen
 * (triggered by tapping the status bar). Keeps a local history of notifications
 * that have arrived via WindowContext.
 */
export default function MobileNotificationDrawer() {
  const { notifications } = useWindowContext();
  const { notifDrawerOpen, toggleNotifDrawer, openApp } = useMobileContext();

  // Local notification history
  const [history, setHistory] = useState<StoredNotification[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Tracks which cards are currently being dismissed (by id)
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  // Touch state per notification card
  const touchStateRef = useRef<{
    startX: number;
    currentX: number;
    id: string | null;
  }>({ startX: 0, currentX: 0, id: null });
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Ingest new notifications into local history
  useEffect(() => {
    const newOnes = notifications.filter(n => !seenIdsRef.current.has(n.id));
    if (newOnes.length === 0) return;

    const stored: StoredNotification[] = newOnes.map(n => ({
      ...n,
      timestamp: Date.now(),
    }));
    newOnes.forEach(n => seenIdsRef.current.add(n.id));
    setHistory(prev => [...stored, ...prev].slice(0, 50));
  }, [notifications]);

  // Dismiss a single notification card
  const dismissCard = useCallback((id: string) => {
    setDismissing(prev => new Set(prev).add(id));
    setTimeout(() => {
      setHistory(prev => prev.filter(n => n.id !== id));
      setDismissing(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setHistory([]);
  }, []);

  // Tap a notification to open the relevant app
  const handleCardTap = useCallback(
    (notif: StoredNotification) => {
      const appId = guessAppId(notif);
      openApp(appId);
      toggleNotifDrawer();
    },
    [openApp, toggleNotifDrawer],
  );

  // Close drawer when overlay is tapped
  const handleOverlayClick = useCallback(() => {
    if (notifDrawerOpen) toggleNotifDrawer();
  }, [notifDrawerOpen, toggleNotifDrawer]);

  // --- Card swipe-to-dismiss touch handlers ---

  const handleCardTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    touchStateRef.current = {
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      id,
    };
  }, []);

  const handleCardTouchMove = useCallback((e: React.TouchEvent) => {
    const ts = touchStateRef.current;
    if (!ts.id) return;
    ts.currentX = e.touches[0].clientX;
    const delta = ts.currentX - ts.startX;

    const el = cardRefsMap.current.get(ts.id);
    if (el && delta > 0) {
      el.style.transform = `translateX(${delta}px)`;
      el.style.opacity = `${Math.max(0, 1 - delta / 200)}`;
    }
  }, []);

  const handleCardTouchEnd = useCallback(() => {
    const ts = touchStateRef.current;
    if (!ts.id) return;

    const delta = ts.currentX - ts.startX;
    const el = cardRefsMap.current.get(ts.id);

    if (delta > 100) {
      dismissCard(ts.id);
    } else if (el) {
      // Snap back
      el.style.transform = '';
      el.style.opacity = '';
    }

    touchStateRef.current = { startX: 0, currentX: 0, id: null };
  }, [dismissCard]);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefsMap.current.set(id, el);
    } else {
      cardRefsMap.current.delete(id);
    }
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.drawerOverlay} ${notifDrawerOpen ? styles.drawerOverlayVisible : ''}`}
        onClick={handleOverlayClick}
      />

      {/* Drawer Panel */}
      <div
        className={`${styles.drawerPanel} ${notifDrawerOpen ? styles.drawerPanelOpen : ''}`}
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Compliance Notifications</span>
          {history.length > 0 && (
            <button className={styles.drawerClearBtn} onClick={clearAll} type="button">
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className={styles.drawerEmpty}>No compliance alerts at this time</div>
        ) : (
          history.map(notif => {
            const isDismissing = dismissing.has(notif.id);
            return (
              <div
                key={notif.id}
                ref={(el) => setCardRef(notif.id, el)}
                className={`${styles.notifCard} ${isDismissing ? styles.notifCardDismissing : ''}`}
                onClick={() => handleCardTap(notif)}
                onTouchStart={(e) => handleCardTouchStart(e, notif.id)}
                onTouchMove={handleCardTouchMove}
                onTouchEnd={handleCardTouchEnd}
                role="button"
                tabIndex={0}
              >
                <div className={styles.notifCardIcon}>
                  {notif.icon ?? '\u{1F514}'}
                </div>
                <div className={styles.notifCardBody}>
                  <div className={styles.notifCardTitle}>{notif.title}</div>
                  <div className={styles.notifCardMessage}>{notif.message}</div>
                </div>
                <div className={styles.notifCardTime}>
                  {formatTimestamp(notif.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

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
