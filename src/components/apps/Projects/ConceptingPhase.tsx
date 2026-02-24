import React, { useState, useMemo, useRef } from 'react';
import type { Campaign, TeamMember } from '../../../types/campaign';
import { calculateTeamCost, formatBudget } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useChatContext } from '../../../context/ChatContext';
import { useAchievementContext } from '../../../context/AchievementContext';
import { teamMembers } from '../../../data/team';
import { getRandomDirection, getRandomDirectionExcluding } from '../../../data/autoDirections';
import MicroGames from '../../MicroGames/MicroGames';
import HelpToast from './HelpToast';
import styles from './ConceptingPhase.module.css';

interface ConceptingPhaseProps {
  campaign: Campaign;
}

export default function ConceptingPhase({ campaign }: ConceptingPhaseProps): React.ReactElement {
  const {
    setConceptingTeam,
    setStrategicDirection,
    generateConcepts,
    isGeneratingConcepts,
  } = useCampaignContext();
  const { triggerCampaignEvent } = useChatContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>(
    campaign.conceptingTeam?.memberIds || []
  );
  const [direction, setDirection] = useState(campaign.strategicDirection);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const conceptingCost = calculateTeamCost(selectedTeamIds.length);
  const productionBudget = campaign.clientBudget - conceptingCost;

  // Surprise Me state
  const surpriseMeCountRef = useRef(0);
  const lastQualityRef = useRef<'good' | 'mid' | 'bad' | null>(null);
  const [usedSurpriseMe, setUsedSurpriseMe] = useState(false);

  const canGenerate = selectedTeamIds.length >= 2 && selectedTeamIds.length <= 4 && direction.trim().length > 0;

  const handleTeamSave = () => {
    setConceptingTeam(campaign.id, selectedTeamIds);
    setShowTeamModal(false);
  };

  const handleDirectionChange = (value: string) => {
    setDirection(value);
    setStrategicDirection(campaign.id, value);
  };

  const handleSurpriseMe = () => {
    const result = usedSurpriseMe
      ? getRandomDirectionExcluding(direction)
      : getRandomDirection();

    handleDirectionChange(result.text);
    lastQualityRef.current = result.quality;
    setUsedSurpriseMe(true);
    surpriseMeCountRef.current += 1;

    // Achievement: used Surprise Me 3 times
    if (surpriseMeCountRef.current >= 3) {
      unlockAchievement('delegator');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    // Achievement: chaos-goblin if submitting a bad direction
    if (usedSurpriseMe && lastQualityRef.current === 'bad') {
      unlockAchievement('chaos-goblin');
    }

    // Achievement: control-freak if never used Surprise Me
    if (!usedSurpriseMe) {
      const count = incrementCounter('manual-directions');
      if (count >= 5) {
        unlockAchievement('control-freak');
      }
    }

    triggerCampaignEvent('CONCEPTING', {
      campaignName: campaign.campaignName,
      clientName: campaign.clientName,
    });
    await generateConcepts(campaign.id);
  };

  // Memoize by string key so any ConceptingPhase re-render (e.g. direction keystrokes)
  // doesn't create a new array reference → which would reset the active MicroGame
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedMembers = useMemo(() => teamMembers.filter(m => selectedTeamIds.includes(m.id)), [selectedTeamIds.join(',')]);

  return (
    <div className={styles.conceptingPhase}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>💡</div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Develop Campaign Concepts</h2>
          <p className={styles.subtitle}>
            Pick your team and set the creative direction. They'll brainstorm campaign concepts for you to choose from.
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Team Selection */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>👥</span>
            <span className={styles.sectionTitle}>Pick Your Team</span>
            <span className={styles.sectionHint}>(Select 2-4 people)</span>
          </div>

          {selectedMembers.length > 0 ? (
            <div className={styles.selectedTeam}>
              <div className={styles.teamAvatars}>
                {selectedMembers.map(member => (
                  <div key={member.id} className={styles.teamMember}>
                    <span className={styles.memberAvatar}>{member.avatar}</span>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberRole}>{member.role}</span>
                  </div>
                ))}
              </div>
              <div className={styles.teamCost}>
                <span className={styles.costLabel}>Concepting cost:</span>
                <span className={styles.costValue}>{formatBudget(conceptingCost)}</span>
              </div>
              <button
                className={styles.editTeamButton}
                onClick={() => setShowTeamModal(true)}
              >
                Edit Team
              </button>
            </div>
          ) : (
            <button
              className={styles.assembleButton}
              onClick={() => setShowTeamModal(true)}
            >
              <span className={styles.assembleIcon}>👥</span>
              Choose Your Crew
            </button>
          )}
        </div>

        {/* Strategic Direction */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🎯</span>
            <span className={styles.sectionTitle}>Strategic Direction</span>
          </div>
          <p className={styles.directionHint}>
            Give your team a starting point. What's your POV on solving this brief?
          </p>
          <textarea
            className={styles.directionInput}
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value)}
            placeholder="e.g., 'Go TikTok-native, show real overwhelm vs. calm' or 'Position as anti-AI-hype, focus on simplicity' or 'Local community angle, grassroots activation'"
            rows={3}
          />
          <button
            className={styles.surpriseMeButton}
            onClick={handleSurpriseMe}
            type="button"
          >
            {usedSurpriseMe ? '\uD83D\uDD04 Try Another' : '\u2728 Surprise Me'}
          </button>
        </div>

        {/* Budget Preview */}
        <div className={styles.budgetPreview}>
          <div className={styles.budgetRow}>
            <span>Client Budget:</span>
            <span className={styles.budgetValue}>{formatBudget(campaign.clientBudget)}</span>
          </div>
          <div className={styles.budgetRow}>
            <span>Your Agency Fee (profit):</span>
            <span className={styles.budgetValue}>- {formatBudget(conceptingCost)}</span>
          </div>
          <div className={`${styles.budgetRow} ${styles.budgetRemaining}`}>
            <span>Production Budget:</span>
            <span className={styles.budgetValue}>{formatBudget(productionBudget)}</span>
          </div>
          {productionBudget < campaign.clientBudget * 0.3 && (
            <div className={styles.budgetWarning}>
              ⚠️ Large team fee leaves tight production budget
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          className={`${styles.generateButton} ${canGenerate && !isGeneratingConcepts ? styles.active : ''}`}
          onClick={handleGenerate}
          disabled={!canGenerate || isGeneratingConcepts}
        >
          {isGeneratingConcepts ? (
            <>
              <span className={styles.spinner}>✨</span>
              {selectedMembers.map(m => m.name).join(' & ')} are brainstorming...
            </>
          ) : (
            <>
              <span className={styles.generateIcon}>✨</span>
              Generate Concepts
            </>
          )}
        </button>

        {!canGenerate && selectedTeamIds.length > 0 && (
          <p className={styles.generateHint}>
            {selectedTeamIds.length < 2 && 'Select at least 2 team members. '}
            {selectedTeamIds.length > 4 && 'Select no more than 4 team members. '}
            {!direction.trim() && 'Add a strategic direction. '}
          </p>
        )}

        {isGeneratingConcepts && (
          <ConceptingWait members={selectedMembers} />
        )}
      </div>

      {/* Team Selection Modal */}
      {/* Team Selection Modal */}
      {showTeamModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTeamModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>👥 Pick Your Team</h3>
              <button className={styles.closeButton} onClick={() => setShowTeamModal(false)}>×</button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.costInfo}>
                <div className={styles.costScale}>
                  <span className={styles.costScaleLabel}>Team costs:</span>
                  <span>2 people = {formatBudget(25000)}</span>
                  <span>3 people = {formatBudget(45000)}</span>
                  <span>4 people = {formatBudget(70000)}</span>
                </div>
                <div className={styles.currentCost}>
                  Selected: {selectedTeamIds.length} → {formatBudget(calculateTeamCost(selectedTeamIds.length))}
                </div>
              </div>

              <div className={styles.memberList}>
                {teamMembers.map(member => {
                  const isSelected = selectedTeamIds.includes(member.id);
                  const wouldExceed = !isSelected && selectedTeamIds.length >= 4;

                  return (
                    <button
                      key={member.id}
                      className={`${styles.memberCard} ${isSelected ? styles.selected : ''} ${wouldExceed ? styles.disabled : ''}`}
                      onClick={() => {
                        if (wouldExceed) return;
                        setSelectedTeamIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        );
                      }}
                      disabled={wouldExceed}
                    >
                      <span className={styles.cardAvatar}>{member.avatar}</span>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{member.name}</span>
                        <span className={styles.cardRole}>{member.role}</span>
                        <span className={styles.cardSpecialty}>{member.specialty}</span>
                      </div>
                      <div className={styles.checkMark}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.selectedCount}>
                {selectedTeamIds.length} selected
                {selectedTeamIds.length < 2 && ' (need at least 2)'}
                {selectedTeamIds.length > 4 && ' (max 4)'}
              </span>
              <button
                className={`${styles.saveButton} ${selectedTeamIds.length >= 2 && selectedTeamIds.length <= 4 ? styles.active : ''}`}
                onClick={handleTeamSave}
                disabled={selectedTeamIds.length < 2 || selectedTeamIds.length > 4}
              >
                Confirm Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Concepting Wait Screen (CTA → Games) ────────────────────────────────

function ConceptingWait({ members }: { members: TeamMember[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const handleHelpFromToast = () => {
    setShowToast(false);
    ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (isPlaying) {
    return (
      <div className={styles.microGamesArea}>
        <MicroGames
          phase="concepting"
          members={members}
          progress={null}
          isComplete={false}
        />
        <button
          className={styles.stopPlayingButton}
          onClick={() => setIsPlaying(false)}
        >
          Stop Playing
        </button>
      </div>
    );
  }

  return (
    <>
      {showToast && (
        <HelpToast
          phase="concepting"
          onHelp={handleHelpFromToast}
          onDismiss={() => setShowToast(false)}
        />
      )}
      <div className={styles.conceptingWait}>
        <div className={styles.waitIcon}>⏳</div>
        <div className={styles.waitTitle}>Team is brainstorming...</div>
        <div className={styles.waitSubtitle}>Usually takes 1-2 minutes</div>

        <>
          <div className={styles.scrollHint}>
            <span className={styles.scrollArrow}>↓</span>
          </div>

          <div className={styles.ctaDivider} />

          <div className={styles.ctaPrompt}>Want to help while you wait?</div>
          <button
            ref={ctaRef}
            className={styles.playButton}
            onClick={() => setIsPlaying(true)}
          >
            💡 HELP WITH CONCEPTING
          </button>
          <div className={styles.ctaAlt}>or just watch the team work</div>
        </>
      </div>
    </>
  );
}
