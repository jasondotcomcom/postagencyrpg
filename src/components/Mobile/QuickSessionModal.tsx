import { useEffect, useRef } from 'react';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import { useCampaignContext } from '../../context/CampaignContext';
import { useAgencyFunds } from '../../context/AgencyFundsContext';
import { useReputationContext } from '../../context/ReputationContext';
import { useMobileContext } from '../../context/MobileContext';
import styles from './Mobile.module.css';

interface QuickSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickSessionModal({ open, onClose }: QuickSessionModalProps) {
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();
  const { getActiveCampaigns } = useCampaignContext();
  const { formatFunds } = useAgencyFunds();
  const { state: repState } = useReputationContext();
  const { openApp } = useMobileContext();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const unreadEmails = getUnreadCount();
  const unreadChats = getChatUnreadCount();
  const activeCampaigns = getActiveCampaigns();
  const funds = formatFunds();
  const repLevel = repState.currentTier.name;

  const phaseLabels: Record<string, string> = {
    concepting: 'Concepting',
    selecting: 'Selecting',
    generating: 'Generating',
    reviewing: 'Reviewing',
    executing: 'Executing',
    submitted: 'Submitted',
    completed: 'Completed',
  };

  function jumpTo(appId: string) {
    openApp(appId);
    onClose();
  }

  return (
    <div className={styles.sessionModalBackdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.sessionModalPanel}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.sessionModalHeader}>
          <span className={styles.sessionModalTitle}>Employee Performance Snapshot</span>
          <button
            className={styles.sessionModalClose}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className={styles.sessionModalContent}>
          {/* Inbox */}
          <div className={styles.sessionModalRow}>
            <div className={styles.sessionModalRowInfo}>
              <span className={styles.sessionModalRowLabel}>Unread Directives</span>
              <span className={styles.sessionModalRowValue}>{unreadEmails}</span>
            </div>
            <button
              className={styles.sessionModalJump}
              onClick={() => jumpTo('inbox')}
            >
              Jump to
            </button>
          </div>

          {/* Chat */}
          <div className={styles.sessionModalRow}>
            <div className={styles.sessionModalRowInfo}>
              <span className={styles.sessionModalRowLabel}>Unread Messages</span>
              <span className={styles.sessionModalRowValue}>{unreadChats}</span>
            </div>
            <button
              className={styles.sessionModalJump}
              onClick={() => jumpTo('chat')}
            >
              Jump to
            </button>
          </div>

          {/* Campaigns */}
          {activeCampaigns.length > 0 && (
            <div className={styles.sessionModalSection}>
              <div className={styles.sessionModalSectionTitle}>Active Assignments</div>
              {activeCampaigns.map(c => (
                <div key={c.id} className={styles.sessionModalRow}>
                  <div className={styles.sessionModalRowInfo}>
                    <span className={styles.sessionModalRowLabel}>{c.campaignName}</span>
                    <span className={styles.sessionModalRowValue}>
                      {phaseLabels[c.phase] ?? c.phase}
                    </span>
                  </div>
                  <button
                    className={styles.sessionModalJump}
                    onClick={() => jumpTo('projects')}
                  >
                    Jump to
                  </button>
                </div>
              ))}
            </div>
          )}
          {activeCampaigns.length === 0 && (
            <div className={styles.sessionModalRow}>
              <div className={styles.sessionModalRowInfo}>
                <span className={styles.sessionModalRowLabel}>Active Assignments</span>
                <span className={styles.sessionModalRowValue}>None</span>
              </div>
              <button
                className={styles.sessionModalJump}
                onClick={() => jumpTo('projects')}
              >
                Jump to
              </button>
            </div>
          )}

          {/* Funds */}
          <div className={styles.sessionModalRow}>
            <div className={styles.sessionModalRowInfo}>
              <span className={styles.sessionModalRowLabel}>Department Budget</span>
              <span className={styles.sessionModalRowValue}>{funds}</span>
            </div>
          </div>

          {/* Reputation */}
          <div className={styles.sessionModalRow}>
            <div className={styles.sessionModalRowInfo}>
              <span className={styles.sessionModalRowLabel}>Compliance Rating</span>
              <span className={styles.sessionModalRowValue}>{repLevel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
