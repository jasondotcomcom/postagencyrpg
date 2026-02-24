import { icons } from './mobileIcons';
import { useMobileContext } from '../../context/MobileContext';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import styles from './Mobile.module.css';

interface DockItem {
  appId: string;
  iconKey: string;
  label: string;
}

const dockItems: DockItem[] = [
  { appId: 'inbox', iconKey: 'inbox', label: 'Mandatory Inbox' },
  { appId: 'chat', iconKey: 'chat', label: 'Monitored Chat' },
  { appId: 'projects', iconKey: 'projects', label: 'Synergy Hub' },
  { appId: 'terminal', iconKey: 'terminal', label: 'Compliance Terminal' },
];

export default function MobileDock() {
  const { activeAppId, openApp } = useMobileContext();
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();

  const unreadCount = getUnreadCount();
  const chatUnreadCount = getChatUnreadCount();

  const getBadge = (appId: string): number | undefined => {
    if (appId === 'inbox') return unreadCount || undefined;
    if (appId === 'chat') return chatUnreadCount || undefined;
    return undefined;
  };

  return (
    <div className={styles.dock} aria-label="Quick Access (Monitored)">
      {dockItems.map(item => {
        const badge = getBadge(item.appId);
        const isActive = activeAppId === item.appId;

        return (
          <div
            key={item.appId}
            className={styles.dockIcon}
            onClick={() => openApp(item.appId)}
            role="button"
            tabIndex={0}
            aria-label={`Open ${item.label}`}
          >
            <div className={styles.dockIconImage}>
              {icons[item.iconKey] || icons.help}
            </div>
            {badge !== undefined && badge > 0 && (
              <span className={styles.dockBadge}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            <div className={isActive ? styles.dockIndicator : styles.dockIndicatorHidden} />
          </div>
        );
      })}
    </div>
  );
}
