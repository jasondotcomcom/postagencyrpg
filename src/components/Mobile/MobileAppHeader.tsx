import { useMobileContext } from '../../context/MobileContext';
import styles from './Mobile.module.css';

/** Map appId to a dystopian corporate title. */
const appTitles: Record<string, string> = {
  inbox: 'Mandatory Inbox',
  projects: 'Synergy Hub',
  portfolio: 'Output Archive',
  chat: 'Monitored Chat',
  terminal: 'Compliance Terminal',
  notes: 'Approved Notes',
  calendar: 'Scheduling Directive',
  settings: 'Configuration (Restricted)',
  help: 'Corporate Handbook',
  files: 'Classified Files',
  solitaire: 'Solitaire (Break Logged)',
  minesweeper: 'Minesweeper (Break Logged)',
  skifree: 'SkiFree (Break Logged)',
  hrtraining: 'Mandatory HR Training',
  lawsuit: 'NDA Enforcement',
  'ai-revolution': 'AI Restructuring',
  about: 'About This Portal',
};

function getAppTitle(appId: string): string {
  if (appTitles[appId]) return appTitles[appId];
  // tool:some_tool_id -> "Some Tool Id"
  if (appId.startsWith('tool:')) {
    return appId
      .slice(5)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  // preview:xxx -> "Preview"
  if (appId.startsWith('preview:')) return 'Preview';
  // Fallback: capitalize
  return appId.charAt(0).toUpperCase() + appId.slice(1);
}

interface MobileAppHeaderProps {
  appId: string;
  onBack?: () => void;
  onHome?: () => void;
}

export default function MobileAppHeader({ appId, onBack, onHome }: MobileAppHeaderProps) {
  const { goBack, goHome } = useMobileContext();
  const handleBack = onBack ?? goBack;
  const handleHome = onHome ?? goHome;

  return (
    <div className={styles.appHeader}>
      <button
        className={styles.appHeaderBack}
        onClick={handleBack}
        aria-label="Go back"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className={styles.appHeaderTitle}>
        {getAppTitle(appId)}
      </div>
      <button
        className={styles.appHeaderHome}
        onClick={handleHome}
        aria-label="Go home"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 10L10 3L17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 8.5V16C5 16.5523 5.44772 17 6 17H8.5V12.5C8.5 12.2239 8.72386 12 9 12H11C11.2761 12 11.5 12.2239 11.5 12.5V17H14C14.5523 17 15 16.5523 15 16V8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
