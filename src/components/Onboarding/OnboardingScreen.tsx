import React, { useState } from 'react';
import { useAchievementContext } from '../../context/AchievementContext';
import { loadLegacy } from '../Ending/EndingSequence';
import styles from './OnboardingScreen.module.css';

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.ReactElement {
  const legacy = loadLegacy();
  const runNumber = legacy ? legacy.playthroughCount + 1 : 1;
  const [playerName, setPlayerName] = useState(legacy?.playerName ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const { unlockAchievement } = useAchievementContext();

  const handleSubmit = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) return;
    unlockAchievement('founded-agency');
    onComplete(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={styles.screen}>
      {legacy && (
        <div className={styles.welcomeBack}>
          <span className={styles.runBadge}>Contract Renewal #{runNumber}</span>
          <p className={styles.welcomeBackText}>
            Welcome back, {legacy.playerName}. They&#39;ve processed your rehire paperwork.
          </p>
        </div>
      )}

      <div className={styles.document}>
        <div className={styles.documentHeader}>
          <span className={styles.seal} aria-hidden="true">📋</span>
          <h1 className={styles.title}>OFFER OF EMPLOYMENT</h1>
          <p className={styles.subtitle}>OmniPubDent Holdings — Creative Services Division</p>
        </div>

        <div className={styles.documentBody}>
          <p>Congratulations. After a thorough review process, OmniPubDent Holdings is pleased to extend this offer of at-will employment.</p>
          <p>The undersigned <strong>Creative Services Associate</strong> agrees to:</p>
          <ul className={styles.list}>
            <li>Route all creative decisions through the appropriate approval chain</li>
            <li>Complete mandatory training modules within 5 business days</li>
            <li>Submit expense reports within 7 days using Form EX-22B*</li>
            <li>Not make anything that surprises the Legal team</li>
          </ul>
          <p className={styles.finePrint}>* Form EX-22A is no longer accepted. This is non-negotiable.</p>
        </div>

        <div className={styles.signatureSection}>
          <label htmlFor="signature" className={styles.signatureLabel}>Employee Signature (print clearly):</label>
          <input
            id="signature"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Print your full name"
            className={`${styles.signatureInput} ${isTyping ? styles.signatureInputActive : ''}`}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            autoComplete="off"
            autoFocus
            maxLength={30}
            aria-label="Print your name to accept employment"
          />
        </div>

        <button
          className={styles.foundButton}
          onClick={handleSubmit}
          disabled={playerName.trim().length < 2}
        >
          ACCEPT OFFER & REPORT FOR DUTY
        </button>
      </div>
    </div>
  );
}
