import { useEffect, useRef, useState } from 'react';
import { WindowProvider, useWindowContext } from './context/WindowContext';
import { EmailProvider, useEmailContext } from './context/EmailContext';
import { CampaignProvider, useCampaignContext } from './context/CampaignContext';
import { ChatProvider, useChatContext } from './context/ChatContext';
import { ReputationProvider, useReputationContext } from './context/ReputationContext';
import { useAchievementContext } from './context/AchievementContext';
import { AgencyFundsProvider } from './context/AgencyFundsContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { SettingsProvider } from './context/SettingsContext';
import { EndingProvider } from './context/EndingContext';
import { CheatProvider } from './context/CheatContext';
import { AchievementProvider } from './context/AchievementContext';
import { PlayerProvider, usePlayerContext } from './context/PlayerContext';
import { Desktop } from './components/Desktop';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { NotificationContainer } from './components/Notifications';
import LevelUpModal from './components/LevelUp/LevelUpModal';
import EndingSequence, { loadLegacy } from './components/Ending/EndingSequence';
import HRWatcher from './components/HRWatcher/HRWatcher';
import CheatIndicator from './components/CheatIndicator/CheatIndicator';
import OnboardingScreen from './components/Onboarding/OnboardingScreen';
import { LOCKED_BRIEFS } from './data/lockedBriefs';

// ─── Mobile Detection ─────────────────────────────────────────────────────────

function isMobileDevice(): boolean {
  if (window.innerWidth < 768) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function MobileBlock() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Agency RPG', url });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard denied */ }
  };

  return (
    <div className="mobile-block">
      <div className="mobile-icon">📱 → 💻</div>
      <h1>Agency RPG is a desktop experience.</h1>
      <p>Like a real creative agency, you'll need a real computer to do the work.</p>
      <p className="mobile-url">
        Visit <strong>AgencyRPG.com</strong> on your laptop or desktop.
      </p>
      <button onClick={handleShare} className={copied ? 'mobile-btn copied' : 'mobile-btn'}>
        {copied ? '✓ Link copied!' : 'Send link to myself'}
      </button>
    </div>
  );
}

// ─── App Content ──────────────────────────────────────────────────────────────

function AppContent() {
  const { addNotification } = useWindowContext();
  const { state: repState, hideLevelUp } = useReputationContext();
  const { campaigns } = useCampaignContext();
  const { addEmail } = useEmailContext();
  const { triggerCampaignEvent, morale } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const { playerName, setPlayerName } = usePlayerContext();
  const prevCompletedCountRef = useRef(0);
  const welcomeFiredRef = useRef(false);

  // Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win/Linux) — full reset including legacy data
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'R') return;
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      e.preventDefault();
      try {
        // Clear EVERYTHING — no legacy preserved
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
            localStorage.removeItem(key);
          }
        });
      } catch { /* non-fatal */ }
      window.location.reload();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Time-based achievements on mount
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 4) unlockAchievement('night-owl');
    if (hour >= 5 && hour < 7) unlockAchievement('early-bird');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Morale-max achievement
  useEffect(() => {
    if (morale === 'high') unlockAchievement('morale-max');
  }, [morale, unlockAchievement]);

  // Show welcome notification once the player has a name (NG+-aware)
  useEffect(() => {
    if (!playerName || welcomeFiredRef.current) return;
    welcomeFiredRef.current = true;
    const legacy = loadLegacy();
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (legacy) {
      const runNum = legacy.playthroughCount + 1;
      const bonusFunds = 50000 + legacy.totalCampaigns * 5000;
      const bonusRep   = 10 + legacy.totalAwards * 2;
      timers.push(setTimeout(() => {
        addNotification(
          `Contract Renewal — ${playerName} (Run #${runNum})`,
          'HR has processed your rehire. Your badge still works. Pat has been notified.'
        );
      }, 500));
      timers.push(setTimeout(() => {
        addNotification(
          'Carryover Credits Applied',
          `Prior performance: $${bonusFunds.toLocaleString()} starting budget, ${bonusRep} rep. Documented in your personnel file.`
        );
      }, 3500));
    } else {
      const employeeId = localStorage.getItem('agencyrpg-employee-id') ?? '????';
      timers.push(setTimeout(() => {
        addNotification(
          `Resource #${employeeId} successfully onboarded.`,
          'Your designated workstation is now active. Report to your manager.'
        );
      }, 500));
      timers.push(setTimeout(() => {
        addNotification(
          'Action Required: Synergy Hub™',
          'You have 2 unread project briefs awaiting assignment. Please review and confirm capacity by EOD.'
        );
      }, 3000));
    }

    return () => timers.forEach(clearTimeout);
  }, [playerName, addNotification]);

  // Unlock new briefs as campaigns complete
  useEffect(() => {
    const completedCount = campaigns.filter(c => c.phase === 'completed').length;
    if (completedCount <= prevCompletedCountRef.current) return;

    const toUnlock = LOCKED_BRIEFS.filter(
      entry => entry.unlockAt <= completedCount && entry.unlockAt > prevCompletedCountRef.current,
    );

    toUnlock.forEach((entry, i) => {
      // Stagger deliveries so multiple unlocks feel sequential
      const delay = 2000 + i * 3000;
      setTimeout(() => {
        addEmail(entry.buildEmail());
        addNotification(
          '📋 New Request',
          `${entry.clientName} project request in the Synergy Hub™. Please scope and confirm by EOD.`,
        );
        triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName });
      }, delay);
    });

    prevCompletedCountRef.current = completedCount;
  }, [campaigns, addEmail, addNotification, triggerCampaignEvent]);

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

function App() {
  if (isMobileDevice()) return <MobileBlock />;

  return (
    <PlayerProvider>
    <SettingsProvider>
      <AchievementProvider>
        <CheatProvider>
          <WindowProvider>
            <EmailProvider>
              <ChatProvider>
                <CampaignProvider>
                  <ReputationProvider>
                    <AgencyFundsProvider>
                      <PortfolioProvider>
                        <EndingProvider>
                          <AppContent />
                        </EndingProvider>
                      </PortfolioProvider>
                    </AgencyFundsProvider>
                  </ReputationProvider>
                </CampaignProvider>
              </ChatProvider>
            </EmailProvider>
          </WindowProvider>
        </CheatProvider>
      </AchievementProvider>
    </SettingsProvider>
    </PlayerProvider>
  );
}

export default App;
