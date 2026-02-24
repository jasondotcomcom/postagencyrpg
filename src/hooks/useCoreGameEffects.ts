import { useEffect, useRef } from 'react';
import { useWindowContext } from '../context/WindowContext';
import { useReputationContext } from '../context/ReputationContext';
import { useCampaignContext } from '../context/CampaignContext';
import { useEmailContext } from '../context/EmailContext';
import { useChatContext } from '../context/ChatContext';
import { useAchievementContext } from '../context/AchievementContext';
import { usePlayerContext } from '../context/PlayerContext';
import { useConductContext } from '../context/ConductContext';
import { useAIRevolutionContext } from '../context/AIRevolutionContext';
import { loadLegacy } from '../components/Ending/EndingSequence';
import { LOCKED_BRIEFS } from '../data/lockedBriefs';

/**
 * useCoreGameEffects
 *
 * A side-effect-only hook that contains all the core game logic useEffect hooks.
 * Shared between desktop AppContent and MobileAppContent so both get
 * the same game logic (briefs, achievements, morale effects, etc.).
 */
export function useCoreGameEffects(): void {
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { state: repState } = useReputationContext();
  const { campaigns } = useCampaignContext();
  const { addEmail } = useEmailContext();
  const { triggerCampaignEvent, morale, addMessage } = useChatContext();
  const { unlockAchievement } = useAchievementContext();
  const { playerName } = usePlayerContext();
  const conductState = useConductContext();
  const { state: { phase: revolutionPhase } } = useAIRevolutionContext();

  const prevCompletedCountRef = useRef(campaigns.filter(c => c.phase === 'completed').length);
  const welcomeFiredRef = useRef(false);
  const prevMoraleRef = useRef(morale);
  const toxicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win/Linux) — full reset including legacy data
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'R') return;
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      e.preventDefault();
      try {
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

  // 2-hour playtime achievement ("what-year-is-it")
  useEffect(() => {
    const timer = setTimeout(() => {
      unlockAchievement('what-year-is-it');
      addNotification(
        'Time Anomaly Detected',
        'You have been logged in for 2 hours. The system is concerned. Are you okay? (PAT-9000 has been notified.)',
      );
    }, 2 * 60 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Unlock new briefs as campaigns complete (with dedup tracking)
  useEffect(() => {
    const completedCount = campaigns.filter(c => c.phase === 'completed').length;
    if (completedCount === 0) return;

    // Track delivered briefs to prevent duplicates across reloads
    const deliveredKey = 'agencyrpg_delivered_briefs';
    let delivered: string[] = [];
    try { delivered = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]'); } catch { /* */ }
    const deliveredSet = new Set(delivered);

    const toUnlock = LOCKED_BRIEFS.filter(
      entry => entry.unlockAt <= completedCount && !deliveredSet.has(entry.clientName),
    );

    if (toUnlock.length === 0) {
      prevCompletedCountRef.current = completedCount;
      return;
    }

    const isNewCompletion = completedCount > prevCompletedCountRef.current;

    toUnlock.forEach((entry, i) => {
      const delay = isNewCompletion ? (2000 + i * 3000) : (100 + i * 100);
      setTimeout(() => {
        addEmail(entry.buildEmail());

        if (isNewCompletion) {
          addNotification(
            '📋 New Request',
            `${entry.clientName} project request in the Synergy Hub™. Please scope and confirm by EOD.`,
          );
          triggerCampaignEvent('NEW_BRIEF_ARRIVED', { clientName: entry.clientName });
        }

        // Record delivery
        try {
          const current: string[] = JSON.parse(localStorage.getItem(deliveredKey) ?? '[]');
          if (!current.includes(entry.clientName)) {
            current.push(entry.clientName);
            localStorage.setItem(deliveredKey, JSON.stringify(current));
          }
        } catch { /* non-fatal */ }
      }, delay);
    });

    prevCompletedCountRef.current = completedCount;
  }, [campaigns, addEmail, addNotification, triggerCampaignEvent]);

  // ─── Toxic / Mutiny morale effects ─────────────────────────────────────────
  useEffect(() => {
    const prev = prevMoraleRef.current;
    prevMoraleRef.current = morale;

    // Clean up toxic interval when morale recovers
    if (morale !== 'toxic' && morale !== 'mutiny' && toxicIntervalRef.current) {
      clearInterval(toxicIntervalRef.current);
      toxicIntervalRef.current = null;
      conductState.clearTeamUnavailable();
    }

    // Entered TOXIC — "Insufficient Enthusiasm Detected"
    if (morale === 'toxic' && prev !== 'toxic') {
      addEmail({
        id: `morale-warning-${Date.now()}`,
        type: 'team_message',
        from: { name: 'Taylor Kim', email: 'taylor@omnipubdent.internal', avatar: '📋' },
        subject: '⚠️ Productivity Anomaly — Enthusiasm Deficit Detected',
        body: `This is an automated flag.\n\nTeam output metrics have dropped below acceptable thresholds. Morale indicators are in the red zone. Several team members have stopped responding to messages within the mandated 4-minute window.\n\nPer OmniPubDent People Policy 7.2, this constitutes a "productivity anomaly" and has been escalated to Pat.\n\nPlease take corrective action. The system is watching.\n\n— Taylor Kim\nProject Management Lead, Digital Execution`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
      });
      addNotification('⚠️ Productivity Anomaly', 'Team enthusiasm deficit detected. Pat has been notified.');

      // Periodic sick calls — PostAgencyRPG team members
      const TEAM_POOL = ['copywriter', 'strategist', 'contractor'];
      toxicIntervalRef.current = setInterval(() => {
        const sick = TEAM_POOL.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
        conductState.setTeamUnavailable(sick);
        const names = sick.map(id => id === 'copywriter' ? 'Jamie' : id === 'strategist' ? 'Alex' : 'DesignHub Pro');
        addMessage({
          id: `sick-${Date.now()}`, channel: 'general', authorId: 'pm',
          text: `${names.join(' and ')} filed a wellness absence form. Capacity is critical. This has been documented.`,
          timestamp: Date.now(), reactions: [], isRead: false,
        });
        setTimeout(() => conductState.clearTeamUnavailable(), 60000);
      }, 90000);
    }

    // Entered MUTINY — "Insubordination Alert"
    if (morale === 'mutiny' && prev !== 'mutiny') {
      if (toxicIntervalRef.current) {
        clearInterval(toxicIntervalRef.current);
        toxicIntervalRef.current = null;
      }
      conductState.setTeamUnavailable(['copywriter', 'strategist', 'contractor']);

      addEmail({
        id: `leak-${Date.now()}`,
        type: 'reputation_bonus',
        from: { name: 'Glassdoor Alerts', email: 'alerts@glassdoor.com', avatar: '📰' },
        subject: 'New Review: "This is not a workplace. This is a content mill."',
        body: `Your company has received a new 1-star review on Glassdoor.\n\nTitle: "Run while you can"\nRating: ★☆☆☆☆\nPros: "The coffee machine works sometimes"\nCons: "Everything else. The mandatory fun. The surveillance. The \'voluntary\' overtime. Pat."\n\nThis review has been flagged as trending in your industry.\n\n— Glassdoor Employer Alerts`,
        timestamp: new Date(),
        isRead: false,
        isStarred: false,
        isDeleted: false,
        reputationBonus: { eventType: 'media_exposure', reputationChange: -15 },
      });
      addNotification('📰 Glassdoor Alert', 'A scathing anonymous review has gone viral. Check inbox.');

      // Dystopian grievance messages
      const grievances = [
        { authorId: 'copywriter', text: 'I want it on record: I used to care about words. Now I write "deliverables." That\'s not a career. That\'s a diagnosis.', delay: 2000 },
        { authorId: 'strategist', text: 'I ran the numbers. Our team satisfaction score is statistically indistinguishable from zero. I put it in a 2x2 matrix. The only quadrant populated is "despair."', delay: 5000 },
        { authorId: 'contractor', text: 'Attached please find my notice period. Please advise on exit procedures. Best regards.', delay: 8000 },
        { authorId: 'suit', text: 'I scheduled a "synergy alignment session" about morale but nobody RSVPed. Even I don\'t want to attend.', delay: 11000 },
        { authorId: 'vance', text: 'I\'ve been in this industry for 20 years and I\'ve never seen a team this broken. And I\'ve broken a few.', delay: 14000 },
      ];
      grievances.forEach(g => {
        setTimeout(() => addMessage({
          id: `grievance-${Date.now()}-${g.authorId}`, channel: 'general', authorId: g.authorId,
          text: g.text, timestamp: Date.now(), reactions: [], isRead: false,
        }), g.delay);
      });
    }

    return () => {
      if (toxicIntervalRef.current) {
        clearInterval(toxicIntervalRef.current);
        toxicIntervalRef.current = null;
      }
    };
  }, [morale, addEmail, addNotification, addMessage, conductState]);

  // ─── AI Revolution phase watcher ──────────────────────────────────────────
  useEffect(() => {
    if (revolutionPhase === 'revolution') {
      focusOrOpenWindow('airevolution', 'AI REVOLUTION');
    }
  }, [revolutionPhase, focusOrOpenWindow]);

  // ─── Reputation milestones ────────────────────────────────────────────────
  useEffect(() => {
    const rep = repState.currentReputation;
    if (rep >= 100) unlockAchievement('company-man');
  }, [repState.currentReputation, unlockAchievement]);
}
