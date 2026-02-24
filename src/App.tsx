import { useState, useEffect, useRef, useCallback } from 'react';
import { WindowProvider } from './context/WindowContext';
import { EmailProvider } from './context/EmailContext';
import { CampaignProvider } from './context/CampaignContext';
import { ChatProvider } from './context/ChatContext';
import { ReputationProvider, useReputationContext } from './context/ReputationContext';
import { AgencyFundsProvider } from './context/AgencyFundsContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { SettingsProvider } from './context/SettingsContext';
import { EndingProvider } from './context/EndingContext';
import { ConductProvider } from './context/ConductContext';
import { CheatProvider } from './context/CheatContext';
import { AIRevolutionProvider } from './context/AIRevolutionContext';
import { AchievementProvider } from './context/AchievementContext';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { MobileProvider } from './context/MobileContext';
import { Desktop } from './components/Desktop';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { NotificationContainer } from './components/Notifications';
import LevelUpModal from './components/LevelUp/LevelUpModal';
import EndingSequence from './components/Ending/EndingSequence';
import HRWatcher from './components/HRWatcher/HRWatcher';
import CheatIndicator from './components/CheatIndicator/CheatIndicator';
import OnboardingScreen from './components/Onboarding/OnboardingScreen';
import Screensaver from './components/Screensaver/Screensaver';
import MobileShell from './components/Mobile/MobileShell';
import { useCoreGameEffects } from './hooks/useCoreGameEffects';
import { useDeviceMode } from './utils/deviceDetection';

const MOBILE_BETA_KEY = 'agencyrpg_mobile_beta';

// ─── Desktop App Content ─────────────────────────────────────────────────────

function AppContent() {
  const { playerName, setPlayerName, showScreensaver } = usePlayerContext();
  const { state: repState, hideLevelUp } = useReputationContext();

  // All game logic side-effects (briefs, level-ups, morale, revolution, etc.)
  useCoreGameEffects();

  if (showScreensaver) {
    return <Screensaver />;
  }

  if (!playerName) {
    return <OnboardingScreen onComplete={setPlayerName} />;
  }

  return (
    <>
      <Desktop />
      <WindowManager />
      <Taskbar />
      <NotificationContainer />
      {repState.showLevelUp && repState.levelUpTier && (
        <LevelUpModal
          tier={repState.levelUpTier}
          reputation={repState.currentReputation}
          onClose={hideLevelUp}
        />
      )}
      <EndingSequence />
      <HRWatcher />
      <CheatIndicator />
    </>
  );
}

// ─── Mobile App Content ──────────────────────────────────────────────────────

function MobileAppContent() {
  const { playerName, setPlayerName } = usePlayerContext();

  // Same game logic as desktop
  useCoreGameEffects();

  if (!playerName) {
    return <OnboardingScreen onComplete={setPlayerName} />;
  }

  return (
    <MobileProvider>
      <MobileShell />
    </MobileProvider>
  );
}

// ─── Konami Code: swipe ↑↑↓↓←→←→ tap tap ────────────────────────────────────

type GestureInput = 'up' | 'down' | 'left' | 'right' | 'tap';
const KONAMI_SEQUENCE: GestureInput[] = [
  'up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'tap', 'tap',
];
const SWIPE_THRESHOLD = 40;
const TAP_THRESHOLD = 15;

function useKonamiUnlock(onUnlock: () => void) {
  const progressRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceOrReset = useCallback((input: GestureInput) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => { progressRef.current = 0; }, 3000);

    if (KONAMI_SEQUENCE[progressRef.current] === input) {
      progressRef.current++;
      if (progressRef.current === KONAMI_SEQUENCE.length) {
        progressRef.current = 0;
        onUnlock();
      }
    } else {
      progressRef.current = KONAMI_SEQUENCE[0] === input ? 1 : 0;
    }
  }, [onUnlock]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD) {
        advanceOrReset('tap');
      } else if (absDx > absDy && absDx >= SWIPE_THRESHOLD) {
        advanceOrReset(dx > 0 ? 'right' : 'left');
      } else if (absDy >= SWIPE_THRESHOLD) {
        advanceOrReset(dy > 0 ? 'down' : 'up');
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [advanceOrReset]);

  return progressRef;
}

// ─── Mobile Block (with hidden Konami unlock) ────────────────────────────────

function MobileBlock({ onUnlock }: { onUnlock: () => void }) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState(false);
  const progressRef = useKonamiUnlock(onUnlock);

  useEffect(() => {
    const timer = setTimeout(() => setHint(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Post Agency RPG', url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard denied */ }
  };

  const progress = progressRef.current;

  return (
    <div className="mobile-block">
      <div className="mobile-icon">📱 → 💻</div>
      <h1>This workstation requires a desktop terminal.</h1>
      <p>Per OmniPubDent Policy 3.1, mobile devices are not authorized for creative labor.</p>
      <p className="mobile-url">
        Access your workstation at <strong>PostAgencyRPG.com</strong> on an approved device.
      </p>
      <button onClick={handleShare} className={copied ? 'mobile-btn copied' : 'mobile-btn'}>
        {copied ? '✓ Link copied!' : 'Send link to myself'}
      </button>
      {progress > 0 && (
        <div style={{
          marginTop: 24, display: 'flex', gap: 6,
          justifyContent: 'center', alignItems: 'center',
        }}>
          {KONAMI_SEQUENCE.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < progress ? '#a8e6cf' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s ease',
            }} />
          ))}
        </div>
      )}
      {hint && progress === 0 && (
        <p style={{
          marginTop: 32, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)',
          fontStyle: 'italic',
        }}>
          ...unless you know the override code.
        </p>
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const deviceMode = useDeviceMode();
  const isMobile = deviceMode === 'phone' || deviceMode === 'tablet';
  const [mobileBetaUnlocked, setMobileBetaUnlocked] = useState(
    () => localStorage.getItem(MOBILE_BETA_KEY) === '1'
  );

  const handleUnlock = useCallback(() => {
    localStorage.setItem(MOBILE_BETA_KEY, '1');
    setMobileBetaUnlocked(true);
  }, []);

  // Mobile users without beta access see the block screen
  if (isMobile && !mobileBetaUnlocked) {
    return <MobileBlock onUnlock={handleUnlock} />;
  }

  return (
    <PlayerProvider>
    <SettingsProvider>
      <AchievementProvider>
        <CheatProvider>
          <AIRevolutionProvider>
          <WindowProvider>
            <EmailProvider>
              <ChatProvider>
                <CampaignProvider>
                  <ReputationProvider>
                    <AgencyFundsProvider>
                      <PortfolioProvider>
                        <EndingProvider>
                          <ConductProvider>
                            {isMobile ? <MobileAppContent /> : <AppContent />}
                          </ConductProvider>
                        </EndingProvider>
                      </PortfolioProvider>
                    </AgencyFundsProvider>
                  </ReputationProvider>
                </CampaignProvider>
              </ChatProvider>
            </EmailProvider>
          </WindowProvider>
          </AIRevolutionProvider>
        </CheatProvider>
      </AchievementProvider>
    </SettingsProvider>
    </PlayerProvider>
  );
}

export default App;
