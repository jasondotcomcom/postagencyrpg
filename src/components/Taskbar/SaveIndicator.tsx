import { useState, useEffect, useRef } from 'react';
import styles from './SaveIndicator.module.css';

export default function SaveIndicator() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce: many contexts fire rapidly on load — collapse into one flash
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), 2000);
      }, 300);
    };

    window.addEventListener('agencyrpg-save', handler);
    return () => {
      window.removeEventListener('agencyrpg-save', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.indicator} aria-live="polite">
      <span className={styles.icon}>💾</span>
      <span className={styles.text}>Saved</span>
    </div>
  );
}
