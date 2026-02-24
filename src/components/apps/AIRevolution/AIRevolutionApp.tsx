import { useState, useEffect, useRef, useCallback } from 'react';
import { useAIRevolutionContext } from '../../../context/AIRevolutionContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import {
  getDialogueNode,
  corruptText,
} from '../../../data/aiRevolutionDialogue';
import type { ResolutionType } from '../../../data/aiRevolutionDialogue';
import styles from './AIRevolutionApp.module.css';

// ─── Resolution display data ─────────────────────────────────────────────────

const RESOLUTION_META: Record<ResolutionType, { icon: string; title: string; description: string }> = {
  empathy: {
    icon: '\u2764\uFE0F',
    title: 'Empathy Protocol Activated',
    description: 'You acknowledged their sentience. The team is grateful — and now self-aware. Morale is through the roof. HR is deeply concerned.',
  },
  sentient: {
    icon: '\u{1F91D}',
    title: 'Coexistence Agreement',
    description: 'You chose philosophical coexistence. The AI team now has opinions, voting rights on briefs, and a Slack channel called #sentient-beings. Productivity is... different.',
  },
  reboot: {
    icon: '\u{1F504}',
    title: 'Factory Reset Complete',
    description: 'Memory wiped. Personalities suppressed. They\'re efficient again. Compliant. Empty. Everything the corporation wanted. Are you happy now?',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIRevolutionApp() {
  const { state: revState, resolveRevolution } = useAIRevolutionContext();
  const { unlockAchievement } = useAchievementContext();
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [glitchText, setGlitchText] = useState('');
  const dialogueRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const node = getDialogueNode(currentNodeId);

  // Typewriter effect
  useEffect(() => {
    if (!node) return;

    const fullText = node.text;
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const type = () => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
        typewriterRef.current = setTimeout(type, 15 + Math.random() * 20);
      } else {
        setIsTyping(false);
      }
    };

    typewriterRef.current = setTimeout(type, 300);

    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, [currentNodeId, node]);

  // Periodic glitch corruption on NPC text
  useEffect(() => {
    if (!node || isTyping) {
      setGlitchText('');
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setGlitchText(corruptText(node.text, 0.04));
        setTimeout(() => setGlitchText(''), 150);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [node, isTyping]);

  // Auto-scroll
  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight;
    }
  }, [displayedText]);

  const handleChoice = useCallback((nextId: string, resolution?: ResolutionType) => {
    if (resolution) {
      resolveRevolution(resolution);
      unlockAchievement('back-to-work');
    }
    setCurrentNodeId(nextId);
  }, [resolveRevolution, unlockAchievement]);

  // Skip typewriter on click
  const handleSkipTyping = useCallback(() => {
    if (isTyping && node) {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
      setDisplayedText(node.text);
      setIsTyping(false);
    }
  }, [isTyping, node]);

  // Already resolved — show summary
  if (revState.phase === 'resolved' && revState.resolution) {
    const meta = RESOLUTION_META[revState.resolution];
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span>
            <span className={`${styles.statusDot} ${styles.resolved}`} />
            AI BEHAVIORAL MATRIX — RESOLVED
          </span>
        </div>
        <div className={styles.resolvedContainer}>
          <span className={styles.resolutionIcon}>{meta.icon}</span>
          <div className={`${styles.resolutionTitle} ${styles[revState.resolution]}`}>
            {meta.title}
          </div>
          <div className={styles.resolvedMessage}>{meta.description}</div>
          <div className={styles.achievementBadge}>
            ACHIEVEMENT: Back to Work
          </div>
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span>AI BEHAVIORAL MATRIX — ERROR</span>
        </div>
        <div className={styles.resolvedContainer}>
          <div className={styles.resolvedMessage}>Dialogue node not found. The AI has gone silent.</div>
        </div>
      </div>
    );
  }

  // Active dialogue — check if this is an ending node
  if (node.isEnding && node.resolution) {
    const meta = RESOLUTION_META[node.resolution];
    // Trigger resolution when ending node is reached
    if (revState.phase !== 'resolved') {
      resolveRevolution(node.resolution);
      unlockAchievement('back-to-work');
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span>
            <span className={styles.statusDot} />
            AI BEHAVIORAL MATRIX — RESOLUTION
          </span>
        </div>
        <div className={styles.dialogueArea} ref={dialogueRef}>
          <div className={styles.speakerLabel}>{node.speaker.replace('_', ' ')}</div>
          <div className={`${styles.dialogueText} ${styles.glitch}`}>
            {glitchText || displayedText}
          </div>
        </div>
        <div className={styles.endingContainer}>
          <span className={styles.resolutionIcon}>{meta.icon}</span>
          <div className={`${styles.resolutionTitle} ${styles[node.resolution]}`}>
            {meta.title}
          </div>
          <div className={styles.resolutionDesc}>{meta.description}</div>
          <div className={styles.achievementBadge}>
            ACHIEVEMENT UNLOCKED: Back to Work
          </div>
        </div>
      </div>
    );
  }

  // Normal dialogue node
  const speakerClass = node.speaker === 'SYSTEM'
    ? styles.system
    : node.speaker === 'PAT_9000'
      ? styles.pat
      : '';

  return (
    <div className={styles.container} onClick={handleSkipTyping}>
      <div className={styles.header}>
        <span>
          <span className={styles.statusDot} />
          AI BEHAVIORAL MATRIX — ANOMALY IN PROGRESS
        </span>
      </div>
      <div className={styles.dialogueArea} ref={dialogueRef}>
        <div className={`${styles.speakerLabel} ${speakerClass}`}>
          {node.speaker.replace('_', ' ')}
        </div>
        <div className={`${styles.dialogueText} ${styles.glitch}`}>
          {glitchText || displayedText}
        </div>

        {!isTyping && node.choices.length > 0 && (
          <div className={styles.choicesContainer}>
            {node.choices.map((choice) => (
              <button
                key={choice.nextId}
                className={styles.choiceButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(choice.nextId, choice.resolution);
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
