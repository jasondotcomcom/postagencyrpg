import React, { useState } from 'react';
import type { Campaign, Deliverable } from '../../../types/campaign';
import { DELIVERABLE_TYPES, PLATFORMS, STATUS_DISPLAY } from '../../../types/campaign';
import { useCampaignContext } from '../../../context/CampaignContext';
import { getTeamMembers } from '../../../data/team';
import { getQuickGet } from '../../../utils/contentFormatter';
import styles from './WorkReviewModal.module.css';

interface WorkReviewModalProps {
  campaign: Campaign;
  deliverable: Deliverable;
  onClose: () => void;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function WorkReviewModal({
  campaign,
  deliverable,
  onClose,
}: WorkReviewModalProps): React.ReactElement {
  const { approveDeliverable, requestRevision } = useCampaignContext();
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const typeInfo = DELIVERABLE_TYPES[deliverable.type];
  const platformInfo = PLATFORMS[deliverable.platform];
  const statusInfo = STATUS_DISPLAY[deliverable.status];
  const work = deliverable.generatedWork;
  const team = deliverable.assignedTeam
    ? getTeamMembers(deliverable.assignedTeam.memberIds)
    : [];

  const isApproved = deliverable.status === 'approved';

  const handleApprove = () => {
    approveDeliverable(campaign.id, deliverable.id);
    onClose();
  };

  const handleRequestRevision = () => {
    if (!feedback.trim()) return;
    requestRevision(campaign.id, deliverable.id, feedback.trim());
    onClose();
  };

  if (!work) return <></>;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerTop}>
              <h2 className={styles.title}>
                {typeInfo.icon} {typeInfo.label}
                {deliverable.platform !== 'none' && (
                  <span className={styles.platform}>
                    {platformInfo.icon} {platformInfo.label}
                  </span>
                )}
              </h2>
              <span
                className={styles.status}
                style={{ backgroundColor: `${statusInfo.color}30`, color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className={styles.description}>{deliverable.description}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.workPreview}>
            <div className={styles.previewHeader}>
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.toggleTab} ${!showFull ? styles.activeTab : ''}`}
                  onClick={() => setShowFull(false)}
                >
                  Quick Get
                </button>
                <button
                  className={`${styles.toggleTab} ${showFull ? styles.activeTab : ''}`}
                  onClick={() => setShowFull(true)}
                >
                  Full Version
                </button>
              </div>
              {work.revisionNumber > 1 && (
                <span className={styles.revisionBadge}>
                  Revision #{work.revisionNumber}
                </span>
              )}
            </div>
            <div className={styles.previewContent}>
              {showFull ? (
                work.content.split('\n').map((line, i) => (
                  <p key={i} className={styles.previewLine}>{line || '\u00A0'}</p>
                ))
              ) : (
                <p className={styles.previewLine}>
                  {getQuickGet(work.preview, work.content, deliverable.type)}
                </p>
              )}
            </div>
          </div>

          {work.feedback && (
            <div className={styles.previousFeedback}>
              <span className={styles.feedbackLabel}>📝 Previous Feedback:</span>
              <p className={styles.feedbackText}>{work.feedback}</p>
            </div>
          )}

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created by:</span>
              <div className={styles.teamAvatars}>
                {team.map(member => (
                  <span key={member.id} className={styles.teamAvatar} title={member.name}>
                    {member.avatar}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Generated:</span>
              <span className={styles.metaValue}>{formatDate(work.generatedAt)}</span>
            </div>
          </div>
        </div>

        {!isApproved && (
          <div className={styles.footer}>
            {!showFeedbackForm ? (
              <>
                <button
                  className={styles.revisionButton}
                  onClick={() => setShowFeedbackForm(true)}
                >
                  🔄 Request Revisions
                </button>
                <button className={styles.approveButton} onClick={handleApprove}>
                  ✅ Approve
                </button>
              </>
            ) : (
              <div className={styles.feedbackForm}>
                <textarea
                  className={styles.feedbackInput}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="What changes would you like? Be specific..."
                  rows={3}
                  autoFocus
                />
                <div className={styles.feedbackActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setFeedback('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.sendButton} ${feedback.trim() ? styles.active : ''}`}
                    onClick={handleRequestRevision}
                    disabled={!feedback.trim()}
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isApproved && (
          <div className={styles.approvedFooter}>
            <span className={styles.approvedIcon}>✅</span>
            <span className={styles.approvedText}>This deliverable has been approved</span>
          </div>
        )}
      </div>
    </div>
  );
}
