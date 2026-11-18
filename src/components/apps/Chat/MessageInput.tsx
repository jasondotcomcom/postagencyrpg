import React, { useState, useCallback } from 'react';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useConductContext } from '../../../context/ConductContext';
import type { MoraleLevel } from '../../../types/chat';
import { usePlayerContext } from '../../../context/PlayerContext';
import { planReply, generateReply, replyDelays } from '../../../utils/chatEngine';
import styles from './MessageInput.module.css';

// ─── Team replies ─────────────────────────────────────────────────────────────
// The shape of each reply (how many people answer, who, what they do, how
// long) is planned in utils/chatEngine; the model only writes the words and
// classifies the player's message for morale.

function nextMorale(current: MoraleLevel, impact: 'up' | 'same' | 'down'): MoraleLevel {
  const levels: MoraleLevel[] = ['mutiny', 'toxic', 'low', 'medium', 'high'];
  if (impact === 'same') return current;
  const idx = levels.indexOf(current);
  if (impact === 'up') return levels[Math.min(idx + 1, levels.length - 1)];
  return levels[Math.max(idx - 1, 0)];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageInput(): React.ReactElement {
  const { activeChannel, channels, messages, morale, addMessage, addReaction, setMorale, setTypingAuthorId } = useChatContext();
  const { playerName } = usePlayerContext();
  const firstName = (playerName ?? '').trim().split(/\s+/)[0] || 'there';
  const { unlockAchievement, incrementCounter, resetCounter } = useAchievementContext();
  const { reportIncident, reportCorporate } = useConductContext();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moraleNotif, setMoraleNotif] = useState<{ icon: string; text: string } | null>(null);

  const channel = channels.find((c) => c.id === activeChannel);

  const showNotif = useCallback((icon: string, notifText: string) => {
    setMoraleNotif({ icon, text: notifText });
    setTimeout(() => setMoraleNotif(null), 3500);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // ─── Chat achievements (silent) ────────────────────────────────────────
    const lower = trimmed.toLowerCase();
    if (lower.includes('thank')) unlockAchievement('thanked-team');
    if (lower.includes('sorry') || lower.includes('apolog')) unlockAchievement('apologized');
    if (/\b(fuck|shit|damn|ass|bitch|bastard|crap|hell)\b/i.test(trimmed)) unlockAchievement('cursed');

    // All-caps streak (3 consecutive ALL CAPS messages)
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 3 && letters === letters.toUpperCase()) {
      const streak = incrementCounter('caps-streak');
      if (streak >= 3) unlockAchievement('all-caps-chat');
    } else {
      resetCounter('caps-streak');
    }
    // ──────────────────────────────────────────────────────────────────────

    // ─── Conduct system — humanity detection ──────────────────────────────
    // Positive/human language triggers HR; corporate buzzwords are rewarded
    const humanityPatterns: Array<{ pattern: RegExp; flag: 'emotional' | 'informal' | 'empathetic' | 'human' | 'work_life_balance'; desc: string }> = [
      { pattern: /\b(i feel|i'm feeling|feeling)\b/i, flag: 'emotional', desc: 'Expressed personal feelings' },
      { pattern: /\b(i love|love you|love this team)\b/i, flag: 'emotional', desc: 'Used the word "love" in a professional context' },
      { pattern: /\b(work.life balance|take a break|go home early|mental health)\b/i, flag: 'work_life_balance', desc: 'Referenced work-life balance' },
      { pattern: /\b(are you okay|how are you|hope you'?re? (doing )?well)\b/i, flag: 'empathetic', desc: 'Showed concern for a colleague' },
      { pattern: /\b(I'?m sorry|my bad|I apologize)\b/i, flag: 'empathetic', desc: 'Apologized sincerely' },
      { pattern: /\b(great job|proud of|you'?re? amazing|well done)\b/i, flag: 'human', desc: 'Praised a team member genuinely' },
      { pattern: /\b(friend|buddy|pal|fam)\b/i, flag: 'informal', desc: 'Used informal/personal address' },
      { pattern: /\b(hug|cry|tears|miss you|care about)\b/i, flag: 'emotional', desc: 'Displayed emotional vulnerability' },
    ];

    const corporatePatterns = /\b(synergy|leverage|align|optimize|stakeholder|deliverable|circle back|bandwidth|scalable|KPI|ROI|per my last|as per|going forward|touch base|deep dive|move the needle)\b/i;

    let conductTriggered = false;
    for (const { pattern, flag, desc } of humanityPatterns) {
      if (pattern.test(trimmed)) {
        reportIncident(flag, desc);
        conductTriggered = true;
        break; // One trigger per message
      }
    }
    if (!conductTriggered && corporatePatterns.test(trimmed)) {
      reportCorporate();
    }
    // ──────────────────────────────────────────────────────────────────────

    // Post player message immediately
    const playerMsgId = `msg-${Date.now()}-player`;
    addMessage({
      id: playerMsgId,
      channel: activeChannel,
      authorId: 'player',
      text: trimmed,
      timestamp: Date.now(),
      reactions: [],
      isRead: true,
    });
    setText('');
    setIsAnalyzing(true);

    // Plan who (if anyone) replies before the model call, so the right person
    // starts "typing" straight away.
    const sentAt = Date.now();
    const sendChannel = activeChannel;
    const plan = planReply(trimmed);
    const firstResponder = plan.slots[0]?.authorId ?? null;
    const typingTimer = firstResponder ? setTimeout(() => setTypingAuthorId(firstResponder), 600) : undefined;

    try {
      const recentMsgs = messages
        .filter(m => m.channel === activeChannel)
        .slice(-20)
        .map(m => ({ authorId: m.authorId, text: m.text }));

      const result = await generateReply({
        playerName: firstName,
        playerMessage: trimmed,
        channelId: activeChannel,
        recent: recentMsgs,
        morale,
        plan,
      });
      const elapsed = Date.now() - sentAt;

      // Apply morale change
      const newMorale = nextMorale(morale, result.moraleImpact);
      if (newMorale !== morale) {
        setMorale(newMorale);
      }

      // Show notification
      if (result.moraleImpact === 'up') {
        showNotif('😊', result.summary || 'Team morale improved');
        // Supportive boss: 10 encouraging messages
        const n = incrementCounter('encouraging-messages');
        if (n >= 10) unlockAchievement('supportive-boss');
      } else if (result.moraleImpact === 'down') {
        showNotif('😐', result.summary || 'Team morale decreased');
      }

      // Emoji reaction on the player's message (sometimes the only response).
      if (plan.reactor && result.emoji && typeof result.emoji === 'string' && result.emoji.length <= 8) {
        const emoji = result.emoji;
        setTimeout(() => addReaction(playerMsgId, emoji), Math.max(400, 1500 - elapsed) + Math.random() * 1500);
      }

      // Schedule replies from send time, so API latency is absorbed into the
      // "typing" pause instead of added on top of it.
      const replies = result.replies;
      clearTimeout(typingTimer);
      setTypingAuthorId(replies[0]?.authorId ?? null);
      const delays = replyDelays(replies);
      replies.forEach((reply, i) => {
        const fireAt = Math.max(350 * (i + 1), delays[i] - elapsed);
        setTimeout(() => {
          setTypingAuthorId(i < replies.length - 1 ? replies[i + 1].authorId : null);
          addMessage({
            id: `msg-${Date.now()}-${reply.authorId}-${Math.random().toString(36).slice(2, 6)}`,
            channel: sendChannel,
            authorId: reply.authorId,
            text: reply.text,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          });
        }, fireAt);
      });
    } catch {
      // Fail silently — don't block the player's message
      clearTimeout(typingTimer);
      setTypingAuthorId(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, activeChannel, messages, morale, addMessage, addReaction, setMorale, setTypingAuthorId, firstName, showNotif,
      unlockAchievement, incrementCounter, resetCounter, reportIncident, reportCorporate]);

  if (channel?.readOnly) {
    return (
      <div className={styles.readOnly}>
        <span className={styles.readOnlyIcon}>🔒</span>
        <span>This channel is read-only</span>
      </div>
    );
  }

  return (
    <div className={styles.inputWrap}>
      {moraleNotif && (
        <div className={styles.moraleNotif}>
          <span>{moraleNotif.icon}</span>
          <span>{moraleNotif.text}</span>
        </div>
      )}
      <div className={styles.inputBar}>
        <input
          className={styles.textInput}
          placeholder={`Message #${channel?.name ?? activeChannel}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isAnalyzing}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!text.trim() || isAnalyzing}
        >
          {isAnalyzing ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
