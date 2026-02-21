import React, { useState } from 'react';
import { useAchievementContext } from '../../context/AchievementContext';
import { loadLegacy } from '../Ending/EndingSequence';
import styles from './OnboardingScreen.module.css';

const EMPLOYEE_ID_KEY = 'agencyrpg-employee-id';

function generateEmployeeNumber(): string {
  const num = Math.floor(1000 + Math.random() * 97000); // 1,000 – 97,999
  return num.toLocaleString('en-US');
}

function getOrCreateEmployeeNumber(): string {
  const stored = localStorage.getItem(EMPLOYEE_ID_KEY);
  if (stored) return stored;
  const n = generateEmployeeNumber();
  localStorage.setItem(EMPLOYEE_ID_KEY, n);
  return n;
}

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps): React.ReactElement {
  const legacy = loadLegacy();
  const runNumber = legacy ? legacy.playthroughCount + 1 : 1;
  const [playerName, setPlayerName] = useState(legacy?.playerName ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const [employeeNumber] = useState(() => getOrCreateEmployeeNumber());
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
          <span className={styles.runBadge}>Contract Renewal — Run #{runNumber}</span>
          <p className={styles.welcomeBackText}>
            Resource #{employeeNumber} re-activated. Prior performance on file.
          </p>
        </div>
      )}

      <div className={styles.document}>
        <div className={styles.documentHeader}>
          <span className={styles.seal} aria-hidden="true">🏢</span>
          <h1 className={styles.title}>EMPLOYEE ONBOARDING AGREEMENT</h1>
          <p className={styles.subtitle}>OMNIPUBDENT HOLDINGS LLC</p>
          <p className={styles.subtitleSub}>Creative Services Division — Resource Intake Form</p>
        </div>

        <div className={styles.documentBody}>
          <p>Welcome to the OmniPubDent family.</p>
          <p>By signing below, you acknowledge and agree to:</p>
          <ul className={styles.list}>
            <li>Surrender creative autonomy to the Workflow Optimization Committee</li>
            <li>Attend all mandatory synergy sessions (attendance tracked)</li>
            <li>Submit timesheets in 15-minute increments</li>
            <li>Refer to yourself as "Resource #{employeeNumber}"</li>
            <li>Waive rights to original thought during business hours</li>
          </ul>
          <p className={styles.finePrint}>Employment is at-will. OmniPubDent reserves the right to redefine your role at any time. "Together, we optimize."</p>
        </div>

        <div className={styles.employeeIdBlock}>
          <span className={styles.employeeIdLabel}>Your Employee ID:</span>
          <span className={styles.employeeIdValue}>#{employeeNumber}</span>
        </div>

        <div className={styles.signatureSection}>
          <label htmlFor="signature" className={styles.signatureLabel}>Legal Name (print clearly for HR records):</label>
          <input
            id="signature"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Full legal name"
            className={`${styles.signatureInput} ${isTyping ? styles.signatureInputActive : ''}`}
            onFocus={() => setIsTyping(true)}
            onBlur={() => setIsTyping(false)}
            autoComplete="off"
            autoFocus
            maxLength={30}
            aria-label="Enter your full legal name to complete onboarding"
          />
          <p className={styles.signatureNote}>Signature: ___________________</p>
        </div>

        <button
          className={styles.foundButton}
          onClick={handleSubmit}
          disabled={playerName.trim().length < 2}
        >
          SUBMIT TO ONBOARDING
        </button>
      </div>
    </div>
  );
}
