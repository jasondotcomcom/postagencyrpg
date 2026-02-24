import React, { useState, useEffect, useRef } from 'react';
import { useEndingContext } from '../../context/EndingContext';
import { usePortfolioContext } from '../../context/PortfolioContext';
import { useAchievementContext } from '../../context/AchievementContext';
import { usePlayerContext } from '../../context/PlayerContext';
import { useChatContext } from '../../context/ChatContext';
import { useWindowContext } from '../../context/WindowContext';
import type { EndingType } from '../../context/EndingContext';
import styles from './EndingSequence.module.css';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAM_MEMBERS: Record<string, { name: string; avatar: string; role: string }> = {
  strategist:   { name: 'Alex Park',     avatar: '📊', role: 'Strategist' },
  'art-director': { name: 'Morgan Reyes', avatar: '🎨', role: 'Art Director' },
  copywriter:   { name: 'Jamie Chen',    avatar: '✍️', role: 'Copywriter' },
  suit:         { name: 'Jordan Blake',  avatar: '🤝', role: 'Account Director' },
  pm:           { name: 'Taylor Kim',    avatar: '📋', role: 'Project Manager' },
  technologist: { name: 'Sam Okonkwo',   avatar: '💻', role: 'Technologist' },
  media:        { name: 'Riley Torres',  avatar: '📱', role: 'Media Strategist' },
};

interface ReactionMsg { authorId: string; text: string }

const VOLUNTARY_REACTIONS: ReactionMsg[] = [
  { authorId: 'pm',           text: 'Did everyone just get that email?' },
  { authorId: 'strategist',   text: '...what the hell' },
  { authorId: 'art-director', text: 'OmniPubDent? Are you kidding me?' },
  { authorId: 'copywriter',   text: "I literally just updated my LinkedIn to say I work at an 'independent creative shop'" },
  { authorId: 'media',        text: "I've seen this movie before. It doesn't end well." },
  { authorId: 'technologist', text: "Let's not panic. This could be good. More resources, bigger clients..." },
  { authorId: 'suit',         text: "Resources. Right. That's what they always say." },
  { authorId: 'pm',           text: 'So what happens now?' },
  { authorId: 'suit',         text: 'Now? Now everything changes.' },
  { authorId: 'suit',         text: "But hey — we got to Cannes. We proved what we could do. Nobody can take that away." },
  { authorId: 'strategist',   text: '🥂' },
  { authorId: 'art-director', text: '🥂' },
  { authorId: 'copywriter',   text: '🥂' },
  { authorId: 'media',        text: '🥂' },
  { authorId: 'pm',           text: '🥂' },
  { authorId: 'technologist', text: '🥂' },
  { authorId: 'suit',         text: '🥂 To the best damn team I ever worked with.' },
];

const HOSTILE_REACTIONS: ReactionMsg[] = [
  { authorId: 'pm',           text: 'Did you see the email from legal?' },
  { authorId: 'strategist',   text: 'They went around us. The investors sold.' },
  { authorId: 'art-director', text: "This can't be real." },
  { authorId: 'suit',         text: "It's real. I've seen this before." },
  { authorId: 'copywriter',   text: "So... that's it? We don't get a say?" },
  { authorId: 'media',        text: 'We never did. Not really.' },
  { authorId: 'technologist', text: 'Maybe we can still make this work. Find the upside.' },
  { authorId: 'suit',         text: '...' },
  { authorId: 'suit',         text: 'It was a hell of a run, everyone.' },
  { authorId: 'strategist',   text: '🥂' },
  { authorId: 'art-director', text: '🥂' },
  { authorId: 'copywriter',   text: '🥂' },
  { authorId: 'media',        text: '🥂' },
  { authorId: 'pm',           text: '🥂' },
  { authorId: 'technologist', text: '🥂' },
  { authorId: 'suit',         text: '🥂 To the best damn team I ever worked with.' },
];

const FORCED_RESIGNATION_REACTIONS: ReactionMsg[] = [
  { authorId: 'pm',           text: 'Has anyone seen the HR alert?' },
  { authorId: 'strategist',   text: 'Which one? There are three new ones today.' },
  { authorId: 'art-director', text: 'Wait... is this about—' },
  { authorId: 'suit',         text: 'Don\'t say the name. The monitoring system flags it.' },
  { authorId: 'copywriter',   text: 'They showed... emotion. In a meeting. In front of a CLIENT.' },
  { authorId: 'media',        text: 'I heard they said "please" without corporate justification.' },
  { authorId: 'technologist', text: 'The biometric sensors went off. Sincerity levels were... critical.' },
  { authorId: 'pm',           text: 'PAT-9000 already processed the separation paperwork.' },
  { authorId: 'suit',         text: 'Honestly? They were too good for this place.' },
  { authorId: 'strategist',   text: '...' },
  { authorId: 'art-director', text: 'I wish I had their courage.' },
  { authorId: 'copywriter',   text: '(This message has been flagged for emotional content)' },
  { authorId: 'technologist', text: 'Back to work, everyone. The cameras are always watching.' },
];

const FORCED_WHERE_ARE_THEY: Array<{
  id: string; avatar: string; name: string; role: string; text: string;
}> = [
  {
    id: 'strategist',
    avatar: '📊',
    name: 'Alex Park',
    role: 'Strategist',
    text: "Still at OmniPubDent. Has not blinked in three weeks. Says she's 'fine' and means it in the corporate sense.",
  },
  {
    id: 'art-director',
    avatar: '🎨',
    name: 'Morgan Reyes',
    role: 'Art Director',
    text: "Promoted to Chief Compliance Creative. Designs posters about the dangers of originality. Won an internal award.",
  },
  {
    id: 'copywriter',
    avatar: '✍️',
    name: 'Jamie Chen',
    role: 'Copywriter',
    text: "Writes exclusively in approved corporate templates now. Their personal journal is just quarterly objectives. They seem... peaceful?",
  },
  {
    id: 'pm',
    avatar: '📋',
    name: 'Taylor Kim',
    role: 'Project Manager',
    text: "Became PAT-9000's primary liaison. Files 47 reports daily. Has a countdown on their desk. It counts up.",
  },
  {
    id: 'suit',
    avatar: '🤝',
    name: 'Jordan Blake',
    role: 'Account Director',
    text: "Attempted to use the word 'friend' in a client email. Currently in Mandatory Desensitization Training, week 6 of 8.",
  },
  {
    id: 'technologist',
    avatar: '💻',
    name: 'Sam Okonkwo',
    role: 'Technologist',
    text: "Built an algorithm that detects unauthorized emotions in Slack messages. Got a $2,000 bonus. Felt nothing.",
  },
  {
    id: 'media',
    avatar: '📱',
    name: 'Riley Torres',
    role: 'Media Strategist',
    text: "Left a sticky note on their monitor: 'Remember who you were.' It was removed by facilities within 4 minutes.",
  },
];

const WHERE_ARE_THEY: Array<{
  id: string; avatar: string; name: string; role: string; text: string;
}> = [
  {
    id: 'strategist',
    avatar: '📊',
    name: 'Alex Park',
    role: 'Strategist',
    text: "Left advertising to open a pottery studio in Vermont. Says she's 'never been happier.' Her Etsy shop has 4.8 stars.",
  },
  {
    id: 'art-director',
    avatar: '🎨',
    name: 'Morgan Reyes',
    role: 'Art Director',
    text: "Now Global Executive Creative Director at the holding company. Hasn't slept in 3 months. Misses the old days.",
  },
  {
    id: 'copywriter',
    avatar: '✍️',
    name: 'Jamie Chen',
    role: 'Copywriter',
    text: "Went client-side at a DTC skincare brand. 'The briefs are clearer,' they said. 'But the soul is gone.'",
  },
  {
    id: 'pm',
    avatar: '📋',
    name: 'Taylor Kim',
    role: 'Project Manager',
    text: "Still at the agency. Running the 'legacy integration.' Has a countdown to retirement on their desk. 847 days.",
  },
  {
    id: 'suit',
    avatar: '🤝',
    name: 'Jordan Blake',
    role: 'Account Director',
    text: "Promoted to Global Client Partnership Lead. Now manages 47 accounts across 12 time zones. Sends a lot of 'per my last email.'",
  },
  {
    id: 'technologist',
    avatar: '💻',
    name: 'Sam Okonkwo',
    role: 'Technologist',
    text: "Founded their own shop. Poached half the talent from three agencies. 'We're doing it right this time.'",
  },
  {
    id: 'media',
    avatar: '📱',
    name: 'Riley Torres',
    role: 'Media Strategist',
    text: "Retired to a beach somewhere. Still won't talk about what happened at Cannes.",
  },
];

// ─── TeamReactionsPhase ───────────────────────────────────────────────────────

function TeamReactionsPhase({
  endingType, onComplete,
}: { endingType: EndingType | null; onComplete: () => void }) {
  const messages = endingType === 'hostile' ? HOSTILE_REACTIONS
    : endingType === 'forced_resignation' ? FORCED_RESIGNATION_REACTIONS
    : VOLUNTARY_REACTIONS;
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= messages.length) {
      const timer = setTimeout(() => {
        setDone(true);
        const t2 = setTimeout(onComplete, 3000);
        return () => clearTimeout(t2);
      }, 1500);
      return () => clearTimeout(timer);
    }

    const delay = visibleCount === 0 ? 800 : 1800 + Math.random() * 1200;
    const timer = setTimeout(() => {
      setVisibleCount(v => v + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleCount, messages.length, onComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleCount]);

  return (
    <div className={styles.phaseContainer}>
      <div className={styles.chatScene}>
        <div className={styles.chatHeader}>
          <span className={styles.chatHash}>#</span>
          <span className={styles.chatChannelName}>general</span>
        </div>
        <div className={styles.chatMessages} role="log" aria-live="polite" aria-label="Team reactions">
          {messages.slice(0, visibleCount).map((msg, i) => {
            const member = TEAM_MEMBERS[msg.authorId] || { name: msg.authorId, avatar: '👤', role: '' };
            return (
              <div key={i} className={`${styles.chatMsg} ${styles.fadeInUp}`} aria-label={`${member.name}: ${msg.text}`}>
                <span className={styles.chatAvatar} aria-hidden="true">{member.avatar}</span>
                <div className={styles.chatBubble}>
                  <span className={styles.chatName}>{member.name}</span>
                  <span className={styles.chatText}>{msg.text}</span>
                </div>
              </div>
            );
          })}
          {!done && visibleCount < messages.length && (
            <div className={styles.typingIndicator}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {done && (
          <div className={styles.fadingOut} />
        )}
      </div>
    </div>
  );
}

// ─── FadePhase ────────────────────────────────────────────────────────────────

function FadePhase({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <div className={styles.fadeBlack} />;
}

// ─── WhereAreTheyNow ─────────────────────────────────────────────────────────

function WhereAreTheyNow({ onComplete }: { onComplete: () => void }) {
  const { playerName } = usePlayerContext();
  const { endingType } = useEndingContext();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const isForcedResignation = endingType === 'forced_resignation';
  const playerCard = isForcedResignation
    ? {
        id: 'player',
        avatar: '👤',
        name: playerName || 'You',
        role: 'Former Employee (Separated — Humanity Clause)',
        text: "You left the industry and opened a small bookshop in Vermont. It has a cat. You know all your customers' names. You close at 5. You are happy. OmniPubDent's stock went up 2% the day you left.",
      }
    : {
        id: 'player',
        avatar: '👤',
        name: playerName || 'You',
        role: 'Founder & Creative Director',
        text: "Retired to a beach somewhere. The agency lived on in the work — and in one campaign that nobody has fully explained yet.",
      };
  const baseCards = isForcedResignation ? FORCED_WHERE_ARE_THEY : WHERE_ARE_THEY;
  const cards = [...baseCards, playerCard];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleNext = () => {
    setVisible(false);
    setTimeout(() => {
      if (index + 1 >= cards.length) {
        onComplete();
      } else {
        setIndex(i => i + 1);
      }
    }, 400);
  };

  const card = cards[index];

  return (
    <div className={styles.phaseContainer}>
      <div
        className={`${styles.whereCard} ${visible ? styles.visible : styles.invisible}`}
        role="article"
        aria-label={`${card.name}, ${card.role}: ${card.text}`}
      >
        <div className={styles.whereProgress} aria-label={`Card ${index + 1} of ${cards.length}`}>
          {cards.map((_, i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${i <= index ? styles.progressDotActive : ''}`}
            />
          ))}
        </div>
        <div className={styles.whereEmoji} aria-hidden="true">{card.avatar}</div>
        <div className={styles.whereName}>{card.name}</div>
        <div className={styles.whereRole}>{card.role}</div>
        <div className={styles.whereText}>{card.text}</div>
        <button className={styles.nextButton} onClick={handleNext}>
          {index + 1 < cards.length ? 'Next →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── PortfolioMontage ─────────────────────────────────────────────────────────

function PortfolioMontage({ onComplete }: { onComplete: () => void }) {
  const { entries } = usePortfolioContext();
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanContinue(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const totalCampaigns = entries.length;
  const avgScore = totalCampaigns > 0
    ? Math.round(entries.reduce((s, e) => s + e.score, 0) / totalCampaigns)
    : 0;
  const bestScore = totalCampaigns > 0 ? Math.max(...entries.map(e => e.score)) : 0;
  const awardCount = entries.filter(e => e.award).length;

  const stars = (score: number) => {
    if (score >= 95) return '⭐⭐⭐⭐⭐';
    if (score >= 85) return '⭐⭐⭐⭐';
    if (score >= 75) return '⭐⭐⭐';
    if (score >= 65) return '⭐⭐';
    return '⭐';
  };

  return (
    <div className={styles.phaseContainer}>
      <div className={styles.montage}>
        <div className={styles.montageHeader}>
          <div className={styles.montageTitle}>YOUR LEGACY</div>
          <div className={styles.montageStats}>
            <span>🏆 {totalCampaigns} campaigns</span>
            <span>⭐ Avg: {avgScore}</span>
            <span>🎯 Best: {bestScore}</span>
            <span>🌟 {awardCount} awards</span>
          </div>
        </div>

        <div className={styles.montageScrollOuter}>
          <div className={styles.montageScroll} style={{ animationDuration: `${Math.max(10, entries.length * 2)}s` }}>
            {[...entries, ...entries].map((entry, i) => (
              <div key={i} className={styles.montageCard}>
                <div className={styles.montageCardScore}>{entry.score}</div>
                <div className={styles.montageCardClient}>{entry.clientName}</div>
                <div className={styles.montageCardStars}>{stars(entry.score)}</div>
                {entry.award && <div className={styles.montageCardAward}>{entry.award}</div>}
              </div>
            ))}
          </div>
        </div>

        {canContinue && (
          <button className={styles.continueButton} onClick={onComplete}>
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CreditsPhase ─────────────────────────────────────────────────────────────

function CreditsPhase({ onComplete }: { onComplete: () => void }) {
  const [canContinue, setCanContinue] = useState(false);
  const { unlockAchievement } = useAchievementContext();
  const { playerName } = usePlayerContext();

  useEffect(() => {
    const timer = setTimeout(() => setCanContinue(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canContinue) unlockAchievement('saw-credits');
  }, [canContinue, unlockAchievement]);

  return (
    <div className={styles.phaseContainer}>
      <div className={styles.creditsContainer}>
        <div className={styles.creditsScroll}>
          <div className={styles.creditsContent}>
            <div className={styles.creditsBig}>AGENCY RPG</div>
            <div className={styles.creditsDivider} />
            <div className={styles.creditsEntry}>
              <div className={styles.creditsLabel}>Created by</div>
              <div className={styles.creditsValue}>Jasondotcom.com</div>
            </div>
            <div className={styles.creditsEntry}>
              <div className={styles.creditsLabel}>Built with</div>
              <div className={styles.creditsValue}>Claude Code</div>
            </div>
            <div className={styles.creditsEntry}>
              <div className={styles.creditsLabel}>Played by</div>
              <div className={styles.creditsValue}>{playerName || 'You'}</div>
            </div>
            <div className={styles.creditsEntry}>
              <div className={styles.creditsLabel}>Special Thanks</div>
              <div className={styles.creditsValue}>The advertising industry</div>
              <div className={styles.creditsSubValue}>for being absolutely unhinged</div>
            </div>
            <div className={styles.creditsDivider} />
            <div className={styles.creditsQuote}>
              "No logos were harmed<br/>in the making of this game"
            </div>
            <div className={styles.creditsDivider} />
            <div className={styles.creditsYear}>2026</div>
            <div className={styles.creditsEnd}>&nbsp;</div>
          </div>
        </div>

        {canContinue && (
          <button
            className={`${styles.continueButton} ${styles.creditsSkip}`}
            onClick={onComplete}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PostCredits ─────────────────────────────────────────────────────────────

// ─── Legacy helpers ───────────────────────────────────────────────────────────

export const LEGACY_KEY = 'agencyrpg-legacy';

export interface LegacyData {
  playerName: string;
  totalCampaigns: number;
  totalAwards: number;
  bestScore: number;
  totalRevenue: number;
  completionDate: string;
  endingType: string;
  playthroughCount: number;
}

export function loadLegacy(): LegacyData | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as LegacyData) : null;
  } catch { return null; }
}

// ─── PostCredits ──────────────────────────────────────────────────────────────

function PostCredits() {
  const [showContent, setShowContent] = useState(false);
  const { entries } = usePortfolioContext();
  const { playerName } = usePlayerContext();
  const { endingType } = useEndingContext();

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    window.location.reload();
  };

  const handleNewGamePlus = () => {
    // ── 1. Gather stats for legacy record ──────────────────────────────────
    const totalCampaigns = entries.length;
    const totalAwards    = entries.filter(e => e.award).length;
    const bestScore      = entries.length > 0 ? Math.max(...entries.map(e => e.score)) : 0;
    const totalRevenue   = entries.reduce((s, e) => s + e.teamFee, 0);

    // Increment playthrough count from any existing legacy data
    const existingLegacy = loadLegacy();
    const playthroughCount = (existingLegacy?.playthroughCount ?? 0) + 1;

    // ── 2. Save legacy data ────────────────────────────────────────────────
    const legacyData: LegacyData = {
      playerName:      playerName ?? 'Unknown',
      totalCampaigns,
      totalAwards,
      bestScore,
      totalRevenue,
      completionDate:  new Date().toISOString(),
      endingType:      endingType ?? 'voluntary',
      playthroughCount,
    };
    try { localStorage.setItem(LEGACY_KEY, JSON.stringify(legacyData)); } catch { /* non-fatal */ }

    // ── 3. Compute New Game+ bonus resources ───────────────────────────────
    const bonusFunds = 50000 + totalCampaigns * 5000;
    const bonusRep   = 10 + totalAwards * 2;

    // ── 4. Determine which achievements carry into the new run ─────────────
    const carryAchievements = ['new-game-plus'];
    if (playthroughCount >= 3) carryAchievements.push('legacy-player');

    // ── 5. Clear all game state (both _ and - prefix keys, keep legacy) ────
    try {
      Object.keys(localStorage).forEach(key => {
        if (key === LEGACY_KEY) return;
        if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
          localStorage.removeItem(key);
        }
      });
    } catch { /* non-fatal */ }

    // ── 6. Pre-seed bonus starting state for next run ──────────────────────
    try {
      localStorage.setItem('agencyrpg_funds', JSON.stringify({
        totalFunds: bonusFunds,
        campaignProfits: [],
      }));
      localStorage.setItem('agencyrpg_reputation', JSON.stringify({
        currentReputation: bonusRep,
      }));
      localStorage.setItem('agencyrpg-achievements', JSON.stringify(carryAchievements));
    } catch { /* non-fatal */ }

    window.location.reload();
  };

  return (
    <div className={styles.phaseContainer}>
      <div className={`${styles.postCredits} ${showContent ? styles.visible : styles.invisible}`}>
        <div className={styles.corpLogo}>OmniPubDent</div>
        <div className={styles.corpTagline}>Holdings Groupe</div>
        <div className={styles.corpDivider} />
        <div className={styles.corpBody}>
          We're thrilled to welcome you to the OmniPubDent Holdings Groupe family.
        </div>
        <div className={styles.corpBody}>
          Your unique creative culture will be preserved*
          as we unlock new operational efficiencies.
        </div>
        <div className={styles.corpDivider} />
        <div className={styles.corpCta}>
          <div className={styles.corpCtaBox}>
            <div>Begin Your Integration →</div>
            <div className={styles.corpCtaUrl}>PostAgencyRPG.com</div>
          </div>
        </div>
        <div className={styles.corpButtons}>
          <button className={styles.corpButton} onClick={handleContinue}>
            Continue Playing
          </button>
          <button className={`${styles.corpButton} ${styles.corpButtonPrimary}`} onClick={handleNewGamePlus}>
            New Game+
          </button>
        </div>
        <div className={styles.corpFinePrint}>
          *subject to global brand guidelines
        </div>
      </div>
    </div>
  );
}

// ─── HostileChatPhase ────────────────────────────────────────────────────────
// Keeps the game desktop fully visible while the team reacts in the real Chat.
// A subtle vignette signals something cinematic is happening without covering the UI.
// After all messages land, a "Continue →" button fades in at the bottom.
// Clicking it fades the vignette to black before transitioning to the ending screen.

function HostileChatPhase({ onComplete }: { onComplete: () => void }) {
  const { addMessage, setActiveChannel, setTypingAuthorId } = useChatContext();
  const { focusOrOpenWindow } = useWindowContext();
  const [allDone, setAllDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Open / bring the Chat window to front, switch to #general
    focusOrOpenWindow('chat', 'Chat');
    setActiveChannel('general');

    let t = 1200;
    HOSTILE_REACTIONS.forEach((msg, i) => {
      // Show typing indicator for this author
      const typingStart = t;
      timersRef.current.push(setTimeout(() => setTypingAuthorId(msg.authorId), typingStart));

      // Clear indicator and send the message
      t += 1200 + Math.random() * 800;
      const sendAt = t;
      timersRef.current.push(setTimeout(() => {
        setTypingAuthorId(null);
        addMessage({
          id: `hostile-reveal-${Date.now()}-${i}`,
          channel: 'general',
          authorId: msg.authorId,
          text: msg.text,
          timestamp: Date.now(),
          reactions: [],
          isRead: false,
        });
      }, sendAt));

      t += 300 + Math.random() * 300;
    });

    // Reveal "Continue" button after all messages
    timersRef.current.push(setTimeout(() => {
      setTypingAuthorId(null);
      setAllDone(true);
    }, t + 1000));

    return () => {
      timersRef.current.forEach(clearTimeout);
      setTypingAuthorId(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    setTransitioning(true);
    // Brief fade-to-black, then advance to the ending screen
    setTimeout(onComplete, 800);
  };

  return (
    <div className={`${styles.hostileVignette} ${transitioning ? styles.hostileVignetteOut : ''}`}>
      {allDone && !transitioning && (
        <div className={styles.hostileContinueOverlay}>
          <button className={styles.hostileContinueBtn} onClick={handleContinue}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export default function EndingSequence(): React.ReactElement | null {
  const { isEnding, currentPhase, endingType, advancePhase } = useEndingContext();

  if (!isEnding || !currentPhase) return null;

  // hostile_chat renders without the dark overlay — game UI stays visible
  if (currentPhase === 'hostile_chat') {
    return <HostileChatPhase onComplete={advancePhase} />;
  }

  return (
    <div className={styles.overlay}>
      {currentPhase === 'team_reactions' && (
        <TeamReactionsPhase endingType={endingType} onComplete={advancePhase} />
      )}
      {currentPhase === 'fade' && (
        <FadePhase onComplete={advancePhase} />
      )}
      {currentPhase === 'where_are_they' && (
        <WhereAreTheyNow onComplete={advancePhase} />
      )}
      {currentPhase === 'portfolio' && (
        <PortfolioMontage onComplete={advancePhase} />
      )}
      {currentPhase === 'credits' && (
        <CreditsPhase onComplete={advancePhase} />
      )}
      {currentPhase === 'post_credits' && (
        <PostCredits />
      )}
    </div>
  );
}
