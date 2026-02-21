import React, { useState, useMemo, useRef } from 'react';
import type { Campaign } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { getTeamMembers } from '../../../data/team';
import MicroGames from '../../MicroGames/MicroGames';
import HelpToast from './HelpToast';
import styles from './GenerationPhase.module.css';

interface GenerationPhaseProps {
  campaign: Campaign;
}

export default function GenerationPhase({ campaign }: GenerationPhaseProps): React.ReactElement {
  const { generatingProgress, retryDeliverableGeneration } = useCampaignContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHelpToast, setShowHelpToast] = useState(true);
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Memoize by string key so campaign re-renders don't create new array references
  // (which would trigger MicroGames' pickMember useCallback and reset the active game)
  const memberIdsKey = campaign.conceptingTeam?.memberIds.join(',') ?? '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const members = useMemo(() => memberIdsKey ? getTeamMembers(campaign.conceptingTeam!.memberIds) : [], [memberIdsKey]);

  const progress = generatingProgress || { current: 0, total: campaign.deliverables.length || 4 };
  const isComplete = progress.total > 0 && progress.current >= progress.total;

  const isRevision = campaign.deliverables.some(d => d.status === 'needs_revision');

  const progressPct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className={styles.generationPhase}>
      {showHelpToast && !isComplete && !isPlaying && (
        <HelpToast
          phase="generating"
          onHelp={() => {
            setShowHelpToast(false);
            ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          onDismiss={() => setShowHelpToast(false)}
        />
      )}

      <div className={styles.headerCompact}>
        <span className={styles.headerIcon}>{isRevision ? '🔄' : '⚡'}</span>
        <span className={styles.headerTitle}>
          {isRevision ? 'Revising Flagged Work' : 'Your Team Is Building'}
        </span>
      </div>

      {isPlaying ? (
        <>
          <div className={styles.microGamesArea}>
            <MicroGames
              phase="generating"
              members={members}
              progress={progress}
              isComplete={isComplete}
              onSeeResults={() => {}}
            />
          </div>
          <button
            className={styles.stopPlayingButton}
            onClick={() => setIsPlaying(false)}
          >
            Stop Playing
          </button>
        </>
      ) : (
        <>
          <div className={styles.waitScreen}>
            <div className={styles.waitIcon}>⏳</div>
            <div className={styles.waitTitle}>
              {isRevision ? 'Revising deliverables...' : 'Generating deliverables...'}
            </div>
            <div className={styles.waitSubtitle}>Usually takes 2-3 minutes</div>

            <div className={styles.progressBarWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.progressLabel}>
                {progress.current}/{progress.total} ready
              </span>
            </div>

            <>
              <div className={styles.scrollHint}>
                <span className={styles.scrollArrow}>↓</span>
              </div>

              <div className={styles.ctaDivider} />

              <div className={styles.ctaSection}>
                <div className={styles.ctaPrompt}>Want to help while you wait?</div>
                <button
                  ref={ctaRef}
                  className={styles.playButton}
                  onClick={() => setIsPlaying(true)}
                >
                  🎨 HELP WITH PRODUCTION
                </button>
                <div className={styles.ctaAlt}>or just watch the team work</div>
              </div>
            </>
          </div>
        </>
      )}

      <div className={styles.deliverableList}>
        {campaign.deliverables.map((del, i) => {
          const typeInfo = DELIVERABLE_TYPES[del.type];
          const platformInfo = PLATFORMS[del.platform];
          const isCompleted = del.generatedWork !== null;
          const isFailed = del.status === 'generation_failed';
          const isActive = i === progress.current && !isCompleted && !isFailed;

          return (
            <div
              key={del.id}
              className={`${styles.deliverableRow} ${
                isCompleted ? styles.completed :
                isFailed ? styles.failed :
                isActive ? styles.active :
                styles.pending
              }`}
            >
              <span className={styles.statusIcon}>
                {isCompleted ? '✓' : isFailed ? '✗' : isActive ? '⏳' : '○'}
              </span>
              <span className={styles.deliverableInfo}>
                {typeInfo?.icon} {typeInfo?.label}
                {del.platform !== 'none' && ` — ${platformInfo?.label}`}
              </span>
              {isFailed && (
                <button
                  className={styles.retryButton}
                  onClick={() => retryDeliverableGeneration(campaign.id, del.id)}
                >
                  Retry
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
