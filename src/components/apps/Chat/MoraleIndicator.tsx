import React from 'react';
import { useChatContext } from '../../../context/ChatContext';
import type { MoraleLevel } from '../../../types/chat';
import styles from './MoraleIndicator.module.css';

const moraleLabels: Record<MoraleLevel, string> = {
  high: '\uD83D\uDD25 Fired Up',
  medium: '\uD83D\uDE0A Steady',
  low: '\uD83D\uDE13 Running Low',
  toxic: '\u26A0\uFE0F Enthusiasm Deficit',
  mutiny: '\uD83D\uDEA8 Insubordination Alert',
};

export default function MoraleIndicator(): React.ReactElement {
  const { morale } = useChatContext();

  return (
    <div className={styles.moraleIndicator}>
      <span className={styles.moraleLabel}>Team Morale</span>
      <div className={styles.moraleBar}>
        <div className={`${styles.moraleFill} ${styles[morale]}`} />
      </div>
      <span className={styles.moraleText}>{moraleLabels[morale]}</span>
    </div>
  );
}
