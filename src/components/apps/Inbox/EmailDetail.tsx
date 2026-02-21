import { useState, useEffect } from 'react';
import type { Email } from '../../../types/email';
import { useEmailContext } from '../../../context/EmailContext';
import { useWindowContext } from '../../../context/WindowContext';
import { useCampaignContext } from '../../../context/CampaignContext';
import { useReputationContext } from '../../../context/ReputationContext';
import { useChatContext } from '../../../context/ChatContext';
import { useEndingContext } from '../../../context/EndingContext';
import styles from './EmailDetail.module.css';

interface EmailDetailProps {
  email: Email;
}

function formatFullDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function EmailDetail({ email }: EmailDetailProps) {
  const { toggleStar, deleteEmail, acceptBrief, markRead, markUnread } = useEmailContext();
  const { addNotification, openWindow, focusWindow, restoreWindow, windows } = useWindowContext();
  const { createCampaign, campaigns } = useCampaignContext();
  const { addReputation, subtractReputation, state: repState } = useReputationContext();
  const { triggerCampaignEvent } = useChatContext();
  const { handleAcquisitionAccept, handleAcquisitionReject, handleHostileTakeoverAccept, acquisitionState } = useEndingContext();
  const [reputationApplied, setReputationApplied] = useState(false);
  const [acquisitionActioned, setAcquisitionActioned] = useState(false);

  const briefAlreadyAccepted = email.type === 'campaign_brief'
    && campaigns.some(c => c.briefId === email.id);

  // Apply reputation bonus when email is first read
  useEffect(() => {
    if (email.type === 'reputation_bonus' && email.reputationBonus && !reputationApplied) {
      const change = email.reputationBonus.reputationChange;
      if (change > 0) {
        addReputation(change);
      } else if (change < 0) {
        subtractReputation(Math.abs(change));
      }
      setReputationApplied(true);
    }
  }, [email, reputationApplied, addReputation, subtractReputation]);

  const avatarClass = email.type === 'campaign_brief'
    ? styles.brief
    : email.type === 'team_message'
    ? styles.team
    : email.type === 'reputation_bonus'
    ? styles.bonus
    : '';

  const handleAcceptBrief = () => {
    if (!email.campaignBrief) return;

    acceptBrief(email.id);

    // Create campaign from the brief
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28); // 4 weeks from now

    createCampaign(
      email.id,
      email.campaignBrief.clientName,
      email.subject.replace(' - Campaign Brief', '').replace('Campaign Brief', email.campaignBrief.clientName),
      email.campaignBrief,
      email.campaignBrief.budget,
      deadline
    );

    addNotification(
      'Brief Accepted',
      `"${email.campaignBrief.clientName}" is live. Let's get to work.`
    );

    triggerCampaignEvent('BRIEF_ACCEPTED', {
      campaignName: email.subject.replace(' - Campaign Brief', '').replace('Campaign Brief', email.campaignBrief.clientName),
      clientName: email.campaignBrief.clientName,
    });

    // Auto-open Projects window (or bring to front if already open)
    const existingProjectsWindow = Array.from(windows.values()).find(w => w.appId === 'projects');
    if (existingProjectsWindow) {
      if (existingProjectsWindow.isMinimized) {
        restoreWindow(existingProjectsWindow.id);
      } else {
        focusWindow(existingProjectsWindow.id);
      }
    } else {
      openWindow('projects', 'Projects');
    }
  };

  const handleDelete = () => {
    deleteEmail(email.id);
    addNotification(
      'Email Deleted',
      'The email has been moved to trash.'
    );
  };

  const handleToggleRead = () => {
    if (email.isRead) {
      markUnread(email.id);
    } else {
      markRead(email.id);
    }
  };

  return (
    <div className={styles.emailDetail}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={`${styles.avatar} ${avatarClass}`}>
            {email.from.avatar || '📧'}
          </div>

          <div className={styles.headerInfo}>
            <h2 className={styles.subject}>{email.subject}</h2>
            <div className={styles.senderRow}>
              <span className={styles.sender}>{email.from.name}</span>
              <span className={styles.email}>&lt;{email.from.email}&gt;</span>
              <span className={styles.time}>• {formatFullDate(email.timestamp)}</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={`${styles.actionButton} ${email.isStarred ? styles.starred : ''}`}
              onClick={() => toggleStar(email.id)}
              title={email.isStarred ? 'Unstar' : 'Star'}
            >
              {email.isStarred ? '⭐' : '☆'}
            </button>
            <button
              className={styles.actionButton}
              onClick={handleToggleRead}
              title={email.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              {email.isRead ? '📭' : '📬'}
            </button>
            <button
              className={`${styles.actionButton} ${styles.delete}`}
              onClick={handleDelete}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className={styles.badges}>
          {email.type === 'campaign_brief' && (
            <>
              <span className={`${styles.badge} ${styles.brief}`}>📋 Campaign Brief</span>
              {email.campaignBrief && (
                <span className={`${styles.badge} ${styles.budget}`}>
                  💰 {formatBudget(email.campaignBrief.budget)}
                </span>
              )}
            </>
          )}
          {email.type === 'team_message' && (
            <span className={`${styles.badge} ${styles.team}`}>💬 Team Message</span>
          )}
          {email.type === 'reputation_bonus' && email.reputationBonus && (
            <>
              <span className={`${styles.badge} ${styles.bonus}`}>
                {email.reputationBonus.reputationChange > 0 ? '🎉' : '⚠️'} Agency News
              </span>
              <span className={`${styles.badge} ${email.reputationBonus.reputationChange > 0 ? styles.positive : styles.negative}`}>
                {email.reputationBonus.reputationChange > 0 ? '+' : ''}{email.reputationBonus.reputationChange} REP
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content} role="article" aria-label={`Email: ${email.subject}`}>
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(email.body) }}
        />

        {/* Strategic Campaign Brief Details */}
        {email.type === 'campaign_brief' && email.campaignBrief && (
          <div className={styles.briefDetails}>
            <h3 className={styles.briefTitle}>
              📋 Strategic Brief
            </h3>

            {/* The Challenge */}
            <div className={styles.briefSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🎯</span>
                <span className={styles.sectionLabel}>The Challenge</span>
              </div>
              <p className={styles.sectionContent}>{email.campaignBrief.challenge}</p>
            </div>

            {/* The Audience */}
            <div className={styles.briefSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>👥</span>
                <span className={styles.sectionLabel}>The Audience</span>
              </div>
              <p className={styles.sectionContent}>{email.campaignBrief.audience}</p>
            </div>

            {/* The Message */}
            <div className={styles.briefSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>💬</span>
                <span className={styles.sectionLabel}>The Message</span>
              </div>
              <p className={styles.sectionContent}>{email.campaignBrief.message}</p>
            </div>

            {/* Success Metrics */}
            <div className={styles.briefSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>📈</span>
                <span className={styles.sectionLabel}>Success Looks Like</span>
              </div>
              <ul className={styles.metricsList}>
                {email.campaignBrief.successMetrics.map((metric, index) => (
                  <li key={index} className={styles.metricItem}>
                    <span className={styles.metricBullet}>✓</span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>

            {/* Budget & Timeline */}
            <div className={styles.briefGrid}>
              <div className={styles.gridItem}>
                <div className={styles.gridLabel}>Budget</div>
                <div className={styles.gridValue}>{formatBudget(email.campaignBrief.budget)}</div>
              </div>
              <div className={styles.gridItem}>
                <div className={styles.gridLabel}>Timeline</div>
                <div className={styles.gridValue}>{email.campaignBrief.timeline}</div>
              </div>
            </div>

            {/* Vibe */}
            <div className={styles.briefSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>✨</span>
                <span className={styles.sectionLabel}>The Vibe</span>
              </div>
              <p className={styles.sectionContent}>{email.campaignBrief.vibe}</p>
            </div>

            {/* Constraints */}
            {email.campaignBrief.constraints && email.campaignBrief.constraints.length > 0 && (
              <div className={styles.briefSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>⚠️</span>
                  <span className={styles.sectionLabel}>Constraints</span>
                </div>
                <ul className={styles.constraintsList}>
                  {email.campaignBrief.constraints.map((constraint, index) => (
                    <li key={index} className={styles.constraintItem}>
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* The Ask - Highlighted */}
            <div className={styles.askSection}>
              <div className={styles.askHeader}>
                <span className={styles.askIcon}>🤔</span>
                <span className={styles.askLabel}>Your Call</span>
              </div>
              <p className={styles.askContent}>{email.campaignBrief.openEndedAsk}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      {email.type === 'campaign_brief' && (
        <div className={styles.footer}>
          <button className={styles.secondaryButton} disabled title="Coming soon">
            📤 Forward
          </button>
          {briefAlreadyAccepted ? (
            <button className={styles.secondaryButton} disabled>
              ✓ Brief Accepted
            </button>
          ) : (
            <button className={styles.primaryButton} onClick={handleAcceptBrief}>
              ✅ Accept Brief
            </button>
          )}
        </div>
      )}

      {/* Acquisition Offer Footer */}
      {email.type === 'acquisition_offer' && acquisitionState === 'email_sent' && !acquisitionActioned && (
        <div className={styles.footer}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              setAcquisitionActioned(true);
              handleAcquisitionReject(repState.completedCampaigns.length);
              addNotification('📧 Response sent', 'You turned down OmniPubDent. The team is going wild.');
            }}
          >
            Decline
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setAcquisitionActioned(true);
              handleAcquisitionAccept();
            }}
            style={{ background: 'linear-gradient(135deg, #c3aed6, #a8d8ea)' }}
          >
            🤝 Accept Offer
          </button>
        </div>
      )}
      {email.type === 'acquisition_offer' && acquisitionActioned && (
        <div className={styles.footer}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 12px' }}>
            Response sent.
          </span>
        </div>
      )}

      {/* Hostile Takeover Footer */}
      {email.type === 'hostile_takeover' && !acquisitionActioned && (
        <div className={styles.footer}>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setAcquisitionActioned(true);
              handleHostileTakeoverAccept();
            }}
            style={{ background: 'linear-gradient(135deg, #666, #444)', color: '#ccc' }}
          >
            Accept
          </button>
        </div>
      )}
      {email.type === 'hostile_takeover' && acquisitionActioned && (
        <div className={styles.footer}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0 12px' }}>
            Acknowledged.
          </span>
        </div>
      )}
    </div>
  );
}
