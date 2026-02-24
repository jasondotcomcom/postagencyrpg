import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useAchievementContext } from '../../context/AchievementContext';
import { usePlayerContext } from '../../context/PlayerContext';
import styles from './Screensaver.module.css';

// ── Constants ──────────────────────────────────────────────────────────────

const COLORS = [
  '#8b0000', '#2d2d2d', '#4a0e0e', '#cc3300', '#660000',
  '#993300', '#ff4444', '#331a00', '#800020', '#3d0c02',
  '#b22222', '#555555', '#a52a2a', '#dc143c', '#8b4513',
];

const SLOGANS = [
  'Synergy is Mandatory',
  'Your Best is Our Baseline',
  'Family* (*terms and conditions apply)',
  'Wellness Wednesday: Cry Quietly',
  'Your Data is Our Data',
  'Overtime is Caring',
  'Be the Change (or Be Changed)',
  'Disruption or Dismissal',
  'Loyalty is Compliance',
  'We Are All Replaceable',
  'Culture Fit Assessment Pending',
  'Passion is Not Optional',
  'Work-Life Integration',
  'Gratitude is Mandatory',
  'Think Outside the Cage',
  'Your Potential is Our Profit',
];

const ACRONYMS = [
  'KPI', 'ROI', 'SLA', 'OKR', 'EoD', 'WFH Revoked', 'PIP', 'RIF',
  'EBITDA', 'YoY', 'QBR', 'TPS Report', 'Action Item', 'Circle Back',
  'Deep Dive', 'Bandwidth', 'Leverage', 'Paradigm', 'Disrupt', 'Pivot',
];

const LOGO_SPEED = 1.5; // pixels per frame
const CORNER_THRESHOLD = 5; // px tolerance for corner hit

// ── Types ──────────────────────────────────────────────────────────────────

interface AcronymItem {
  word: string;
  left: number; // percentage
  duration: number; // seconds
  delay: number; // seconds
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Screensaver() {
  const { unlockAchievement } = useAchievementContext();
  const { dismissScreensaver } = usePlayerContext();
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 100, y: 100 });
  const velRef = useRef({
    vx: LOGO_SPEED * (Math.random() > 0.5 ? 1 : -1),
    vy: LOGO_SPEED * (Math.random() > 0.5 ? 1 : -1),
  });
  const colorIndexRef = useRef(0);
  const sloganIndexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const dismissedRef = useRef(false);
  const [currentSlogan, setCurrentSlogan] = useState(SLOGANS[0]);

  // Generate stable falling acronyms
  const acronyms = useMemo<AcronymItem[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      word: ACRONYMS[i % ACRONYMS.length],
      left: Math.random() * 90 + 5,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * -30,
    }));
  }, []);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    dismissScreensaver();
  }, [dismissScreensaver]);

  // Dismiss on click, touch, or keypress
  useEffect(() => {
    const handleKey = () => handleDismiss();
    const handlePointer = () => handleDismiss();
    // Small delay to prevent the click that triggers log off from also dismissing
    const timer = setTimeout(() => {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handlePointer);
      document.addEventListener('touchstart', handlePointer, { passive: true });
    }, 500);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
    };
  }, [handleDismiss]);

  // "Screen Burnout" achievement -- 60 seconds staring
  useEffect(() => {
    const timer = setTimeout(() => {
      unlockAchievement('screen-burnout');
    }, 60000);
    return () => clearTimeout(timer);
  }, [unlockAchievement]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const logo = logoRef.current;
      const container = containerRef.current;
      if (!logo || !container) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const pos = posRef.current;
      const vel = velRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const lw = logo.offsetWidth;
      const lh = logo.offsetHeight;

      // Move
      pos.x += vel.vx;
      pos.y += vel.vy;

      // Bounce
      let bounced = false;
      if (pos.x <= 0) { pos.x = 0; vel.vx = Math.abs(vel.vx); bounced = true; }
      if (pos.x + lw >= cw) { pos.x = cw - lw; vel.vx = -Math.abs(vel.vx); bounced = true; }
      if (pos.y <= 0) { pos.y = 0; vel.vy = Math.abs(vel.vy); bounced = true; }
      if (pos.y + lh >= ch) { pos.y = ch - lh; vel.vy = -Math.abs(vel.vy); bounced = true; }

      if (bounced) {
        colorIndexRef.current = (colorIndexRef.current + 1) % COLORS.length;
        logo.style.color = COLORS[colorIndexRef.current];

        // Cycle slogan on each bounce
        sloganIndexRef.current = (sloganIndexRef.current + 1) % SLOGANS.length;
        setCurrentSlogan(SLOGANS[sloganIndexRef.current]);

        // Corner detection
        const isAtLeft = pos.x <= CORNER_THRESHOLD;
        const isAtRight = pos.x + lw >= cw - CORNER_THRESHOLD;
        const isAtTop = pos.y <= CORNER_THRESHOLD;
        const isAtBottom = pos.y + lh >= ch - CORNER_THRESHOLD;
        const inCorner = (isAtLeft || isAtRight) && (isAtTop || isAtBottom);
        if (inCorner) unlockAchievement('corner-office');
      }

      logo.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [unlockAchievement]);

  return (
    <div ref={containerRef} className={styles.screensaver}>
      {/* Falling corporate acronyms */}
      {acronyms.map((item, i) => (
        <span
          key={i}
          className={styles.buzzword}
          style={{
            left: `${item.left}%`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.word}
        </span>
      ))}

      {/* Bouncing corporate slogan */}
      <div
        ref={logoRef}
        className={styles.logo}
        style={{ color: COLORS[0] }}
      >
        {currentSlogan}
      </div>

      {/* Hint */}
      <div className={styles.hint}>
        Click anywhere to resume mandatory productivity
      </div>
    </div>
  );
}
