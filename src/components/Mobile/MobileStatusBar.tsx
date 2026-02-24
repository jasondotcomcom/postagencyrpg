import { useState, useEffect } from 'react';
import { usePlayerContext } from '../../context/PlayerContext';
import { useReputationContext } from '../../context/ReputationContext';
import { useMobileContext } from '../../context/MobileContext';
import styles from './Mobile.module.css';

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

interface MobileStatusBarProps {
  /** Optional callback -- fired on tap (used for quick session summary). */
  onTap?: () => void;
}

export default function MobileStatusBar({ onTap }: MobileStatusBarProps) {
  const { playerName } = usePlayerContext();
  const { state: repState } = useReputationContext();
  const { toggleNotifDrawer } = useMobileContext();
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const update = () => setTime(formatTime(new Date()));
    // Align to next minute boundary
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const alignTimeout = setTimeout(() => {
      update();
      // Then tick every 60s
      const interval = setInterval(update, 60_000);
      // Clean up interval when effect is cleaned up
      cleanupRef = () => clearInterval(interval);
    }, msUntilNextMinute);

    let cleanupRef: (() => void) | null = null;

    return () => {
      clearTimeout(alignTimeout);
      cleanupRef?.();
    };
  }, []);

  return (
    <div className={styles.statusBar} onClick={onTap ?? toggleNotifDrawer}>
      <div className={styles.statusBarLeft}>
        MONITORED | {playerName ?? 'Employee'}
      </div>
      <div className={styles.statusBarCenter}>
        Employee Portal | {repState.currentTier.name}
      </div>
      <div className={styles.statusBarRight}>
        {time}
      </div>
    </div>
  );
}
