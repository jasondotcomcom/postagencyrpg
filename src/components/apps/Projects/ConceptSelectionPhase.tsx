import React, { useState, useMemo } from 'react';
import type { Campaign, CampaignConcept, DeliverableType } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, calculateTeamCost, formatBudget } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useChatContext } from '../../../context/ChatContext';
import { teamMembers } from '../../../data/team';
import styles from './ConceptSelectionPhase.module.css';

interface ConceptSelectionPhaseProps {
  campaign: Campaign;
}

export default function ConceptSelectionPhase({ campaign }: ConceptSelectionPhaseProps): React.ReactElement {
  const { selectConcept, generateCampaignDeliverables, generateConcepts, tweakConcept, setProductionTeam, isGeneratingConcepts } = useCampaignContext();
  const { triggerCampaignEvent } = useChatContext();
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tweakModalConceptId, setTweakModalConceptId] = useState<string | null>(null);
  const [tweakNote, setTweakNote] = useState('');
  const [tweakingConceptId, setTweakingConceptId] = useState<string | null>(null);
  const [productionMemberIds, setProductionMemberIds] = useState<string[]>([]);

  const selectedConceptId = campaign.selectedConceptId;
  const selectedConcept = campaign.generatedConcepts.find(c => c.id === selectedConceptId);

  const conceptingIds = campaign.conceptingTeam?.memberIds || [];
  const availableMembers = useMemo(
    () => teamMembers.filter(m => m.id !== 'hr' && !conceptingIds.includes(m.id)),
    [conceptingIds]
  );

  const VISUAL_HEAVY_TYPES: DeliverableType[] = ['print_ad', 'billboard', 'video', 'tiktok_series', 'social_post', 'landing_page', 'experiential', 'guerrilla'];
  const hasVisualDeliverables = selectedConcept?.suggestedDeliverables.some(d => VISUAL_HEAVY_TYPES.includes(d.type)) ?? false;

  const conceptingCount = conceptingIds.length;
  const additionalCost = productionMemberIds.length > 0
    ? calculateTeamCost(conceptingCount + productionMemberIds.length) - calculateTeamCost(conceptingCount)
    : 0;
  const updatedProductionBudget = campaign.productionBudget - additionalCost;
  const budgetNegative = updatedProductionBudget < 0;

  const handleSelectConcept = (conceptId: string) => {
    selectConcept(campaign.id, conceptId);
  };

  const handleBuildCampaign = () => {
    if (!selectedConceptId || !selectedConcept) return;
    setShowConfirmation(true);
  };

  const handleConfirmGenerate = () => {
    setShowConfirmation(false);
    if (productionMemberIds.length > 0) {
      setProductionTeam(campaign.id, productionMemberIds);
    }
    triggerCampaignEvent('CONCEPT_CHOSEN', {
      campaignName: campaign.campaignName,
      clientName: campaign.clientName,
    });
    generateCampaignDeliverables(campaign.id, productionMemberIds.length > 0 ? productionMemberIds : undefined);
    setTimeout(() => {
      triggerCampaignEvent('DELIVERABLES_GENERATING', {
        campaignName: campaign.campaignName,
        clientName: campaign.clientName,
      });
    }, 8000);
  };

  const handleToggleProductionMember = (memberId: string) => {
    setProductionMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRevise = async () => {
    if (!revisionFeedback.trim()) return;
    setShowReviseModal(false);
    // In a real implementation, this would pass the feedback to the AI
    await generateConcepts(campaign.id);
    setRevisionFeedback('');
  };

  const handleOpenTweakModal = (conceptId: string) => {
    setTweakNote('');
    setTweakModalConceptId(conceptId);
  };

  const handleApplyTweak = async () => {
    if (!tweakNote.trim() || !tweakModalConceptId) return;
    const conceptId = tweakModalConceptId;
    setTweakModalConceptId(null);
    setTweakNote('');
    setTweakingConceptId(conceptId);
    try {
      await tweakConcept(campaign.id, conceptId, tweakNote.trim());
    } finally {
      setTweakingConceptId(null);
    }
  };

  return (
    <div className={styles.selectionPhase}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>🎨</div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Choose Your Direction</h2>
          <p className={styles.subtitle}>
            Your team generated {campaign.generatedConcepts.length} campaign concepts. Select the one that best solves the brief.
          </p>
        </div>
      </div>

      <div className={styles.conceptsGrid}>
        {campaign.generatedConcepts.map((concept, index) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            index={index}
            isSelected={concept.id === selectedConceptId}
            onSelect={() => handleSelectConcept(concept.id)}
            onTweak={() => handleOpenTweakModal(concept.id)}
            isTweaking={tweakingConceptId === concept.id}
            isTweakDisabled={tweakingConceptId !== null || isGeneratingConcepts}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.reviseButton}
          onClick={() => setShowReviseModal(true)}
          disabled={isGeneratingConcepts}
        >
          {isGeneratingConcepts ? '⏳ Regenerating...' : '🔄 Revise Concepts'}
        </button>

        <button
          className={`${styles.buildButton} ${selectedConceptId ? styles.active : ''}`}
          onClick={handleBuildCampaign}
          disabled={!selectedConceptId}
        >
          🚀 Generate Campaign
        </button>
      </div>

      {selectedConcept && !showConfirmation && (
        <div className={styles.selectedPreview}>
          <h3 className={styles.previewTitle}>
            Selected: "{selectedConcept.name}"
          </h3>
          <p className={styles.previewText}>
            Your team will generate {selectedConcept.suggestedDeliverables.reduce((sum, d) => sum + d.quantity, 0)} deliverables
            across {selectedConcept.recommendedChannels.length} channels. You'll review everything in a presentation.
          </p>
        </div>
      )}

      {/* Pre-Generation Confirmation */}
      {showConfirmation && selectedConcept && (
        <div className={styles.confirmationPanel}>
          <h3 className={styles.confirmationTitle}>Ready to build this campaign?</h3>
          <p className={styles.confirmationSubtitle}>
            Based on "{selectedConcept.name}", we'll create:
          </p>

          <div className={styles.confirmationDeliverables}>
            {selectedConcept.suggestedDeliverables.map((del, i) => (
              <div key={i} className={styles.confirmationItem}>
                <span className={styles.confirmationIcon}>
                  {DELIVERABLE_TYPES[del.type]?.icon}
                </span>
                <span className={styles.confirmationLabel}>
                  {del.quantity}x {DELIVERABLE_TYPES[del.type]?.label}
                  {del.platform !== 'none' && ` (${PLATFORMS[del.platform]?.label})`}
                </span>
              </div>
            ))}
          </div>

          {/* Production Crew Selector */}
          <div className={styles.productionCrewSection}>
            <div className={styles.currentTeam}>
              <span className={styles.ideaLabel}>Current Team</span>
              <div className={styles.channels}>
                {conceptingIds.map(id => {
                  const member = teamMembers.find(m => m.id === id);
                  return member ? (
                    <span key={id} className={styles.teamChip}>
                      {member.avatar} {member.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {availableMembers.length > 0 && (
              <div className={styles.availableMembers}>
                <span className={styles.ideaLabel}>Need extra hands?</span>
                {availableMembers.map(member => {
                  const isRecommended = hasVisualDeliverables && (member.id === 'copywriter' || member.id === 'contractor');
                  return (
                    <label key={member.id} className={styles.memberToggle}>
                      <input
                        type="checkbox"
                        checked={productionMemberIds.includes(member.id)}
                        onChange={() => handleToggleProductionMember(member.id)}
                      />
                      <div className={styles.memberInfo}>
                        <span>{member.avatar} {member.name}</span>
                        <span className={styles.detailValue}>{member.role}</span>
                        {isRecommended && <span className={styles.recommendedBadge}>Recommended</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {productionMemberIds.length > 0 && (
              <div className={styles.costPreview}>
                <span>Additional team cost: {formatBudget(additionalCost)}</span>
                <span>Updated production budget: <strong className={budgetNegative ? styles.costWarning : ''}>{formatBudget(updatedProductionBudget)}</strong></span>
              </div>
            )}
            {budgetNegative && (
              <p className={styles.costWarning} style={{ margin: '4px 0 0 0' }}>
                Warning: production budget will go negative
              </p>
            )}
          </div>

          <p className={styles.confirmationNote}>
            This will use Claude (text) and DALL-E (images). Should take about 30-60 seconds.
          </p>

          <div className={styles.confirmationActions}>
            <button
              className={styles.backButton}
              onClick={() => setShowConfirmation(false)}
            >
              ← Back to Concepts
            </button>
            <button
              className={styles.confirmButton}
              onClick={handleConfirmGenerate}
            >
              🚀 Generate Campaign
            </button>
          </div>
        </div>
      )}

      {/* Tweak Modal */}
      {tweakModalConceptId && (() => {
        const tweakTarget = campaign.generatedConcepts.find(c => c.id === tweakModalConceptId);
        return (
          <div className={styles.modalOverlay} onClick={() => setTweakModalConceptId(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>✏️ Tweak: {tweakTarget?.name}</h3>
                <button className={styles.closeButton} onClick={() => setTweakModalConceptId(null)}>×</button>
              </div>
              <div className={styles.modalContent}>
                <p className={styles.modalText}>What needs to change?</p>
                <textarea
                  className={styles.feedbackInput}
                  value={tweakNote}
                  onChange={(e) => setTweakNote(e.target.value)}
                  placeholder='e.g., "Make the tagline present tense" or "Swap the video for a TikTok series"'
                  rows={4}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) handleApplyTweak();
                  }}
                />
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelButton} onClick={() => setTweakModalConceptId(null)}>
                  Cancel
                </button>
                <button
                  className={`${styles.regenerateButton} ${tweakNote.trim() ? styles.active : ''}`}
                  onClick={handleApplyTweak}
                  disabled={!tweakNote.trim()}
                >
                  Apply Tweak
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Revise Modal */}
      {showReviseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReviseModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🔄 Revise Concepts</h3>
              <button className={styles.closeButton} onClick={() => setShowReviseModal(false)}>×</button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalText}>
                What direction should your team explore instead?
              </p>
              <textarea
                className={styles.feedbackInput}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="e.g., 'More playful, less serious' or 'Focus more on the community angle' or 'Bigger, bolder ideas'"
                rows={3}
                autoFocus
              />
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowReviseModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.regenerateButton} ${revisionFeedback.trim() ? styles.active : ''}`}
                onClick={handleRevise}
                disabled={!revisionFeedback.trim()}
              >
                Regenerate Concepts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Concept Card
interface ConceptCardProps {
  concept: CampaignConcept;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onTweak: () => void;
  isTweaking: boolean;
  isTweakDisabled: boolean;
}

function ConceptCard({ concept, index, isSelected, onSelect, onTweak, isTweaking, isTweakDisabled }: ConceptCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyIdea = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${concept.name}\n\n${concept.bigIdea}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const colors = [
    { bg: 'rgba(168, 230, 207, 0.15)', border: 'var(--color-mint)' },
    { bg: 'rgba(168, 216, 234, 0.15)', border: 'var(--color-sky)' },
    { bg: 'rgba(195, 174, 214, 0.15)', border: 'var(--color-lavender)' },
    { bg: 'rgba(249, 231, 159, 0.15)', border: 'var(--color-butter)' },
    { bg: 'rgba(255, 183, 178, 0.15)', border: 'var(--color-peach)' },
  ];
  const colorScheme = colors[index % colors.length];

  return (
    <div
      className={`${styles.conceptCard} ${isSelected ? styles.selected : ''}`}
      style={{
        '--card-bg': colorScheme.bg,
        '--card-border': colorScheme.border,
      } as React.CSSProperties}
    >
      <div className={styles.cardHeader}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="concept"
            checked={isSelected}
            onChange={onSelect}
            className={styles.radioInput}
          />
          <span className={styles.radioCustom} />
        </label>
        <div className={styles.cardTitle}>
          <h3 className={styles.conceptName}>{concept.name}</h3>
          <p className={styles.conceptTagline}>"{concept.tagline}"</p>
        </div>
      </div>

      <div className={styles.cardBody}>
        {concept.isTweaked && (
          <div className={styles.tweakedBadge}>✨ TWEAKED</div>
        )}

        <div className={styles.bigIdea}>
          <div className={styles.bigIdeaHeader}>
            <span className={styles.ideaLabel}>Big Idea:</span>
            <button
              className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
              onClick={handleCopyIdea}
              aria-label="Copy big idea to clipboard"
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
          </div>
          <p className={styles.ideaText}>{concept.bigIdea}</p>
        </div>

        <div className={styles.channels}>
          {concept.recommendedChannels.map(channel => (
            <span key={channel} className={styles.channelBadge}>
              {PLATFORMS[channel as keyof typeof PLATFORMS]?.icon || '📍'} {channel}
            </span>
          ))}
        </div>

        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ Less details' : '▼ More details'}
        </button>

        {isExpanded && (
          <div className={styles.expandedContent}>
            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Tone:</span>
              <span className={styles.detailValue}>{concept.tone}</span>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Strategic Thinking:</span>
              <p className={styles.detailText}>{concept.whyItWorks}</p>
            </div>

            <div className={styles.detailSection}>
              <span className={styles.detailLabel}>Suggested Deliverables:</span>
              <ul className={styles.deliverablesList}>
                {concept.suggestedDeliverables.map((del, i) => (
                  <li key={i}>
                    {DELIVERABLE_TYPES[del.type]?.icon} {del.quantity}x {DELIVERABLE_TYPES[del.type]?.label}
                    {del.platform !== 'none' && ` (${PLATFORMS[del.platform]?.label})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className={styles.cardActions}>
          <button
            className={`${styles.chooseButton} ${isSelected ? styles.chosen : ''}`}
            onClick={onSelect}
          >
            {isSelected ? '✓ Selected' : '✓ Choose This'}
          </button>
          <button
            className={styles.tweakButton}
            onClick={onTweak}
            disabled={isTweakDisabled}
          >
            {isTweaking ? '⏳ Tweaking...' : '✏️ Tweak This'}
          </button>
        </div>
      </div>
    </div>
  );
}
