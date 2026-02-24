import { useMemo, useState, useCallback } from 'react';
import type { DesktopIcon as DesktopIconType } from '../../types';
import { useEmailContext } from '../../context/EmailContext';
import { useChatContext } from '../../context/ChatContext';
import { useTerminalTools } from '../../hooks/useTerminalTools';
import MobileAppIcon from './MobileAppIcon';
import QuickActionMenu from './QuickActionMenu';
import styles from './Mobile.module.css';

const defaultIcons: DesktopIconType[] = [
  { id: 'icon-inbox', label: 'Mandatory Inbox', icon: 'inbox', appId: 'inbox' },
  { id: 'icon-projects', label: 'Synergy Hub', icon: 'projects', appId: 'projects' },
  { id: 'icon-portfolio', label: 'Output Archive', icon: 'portfolio', appId: 'portfolio' },
  { id: 'icon-chat', label: 'Monitored Chat', icon: 'chat', appId: 'chat' },
  { id: 'icon-terminal', label: 'Compliance Terminal', icon: 'terminal', appId: 'terminal' },
  { id: 'icon-notes', label: 'Approved Notes', icon: 'notes', appId: 'notes' },
  { id: 'icon-calendar', label: 'Scheduling Directive', icon: 'calendar', appId: 'calendar' },
  { id: 'icon-settings', label: 'Configuration', icon: 'settings', appId: 'settings' },
  { id: 'icon-help', label: 'Handbook', icon: 'help', appId: 'help' },
];

interface QuickActionState {
  appId: string;
  rect: DOMRect;
}

export default function MobileHomeScreen() {
  const { getUnreadCount } = useEmailContext();
  const { getUnreadCount: getChatUnreadCount } = useChatContext();
  const terminalTools = useTerminalTools();

  const [quickAction, setQuickAction] = useState<QuickActionState | null>(null);

  const allIcons = useMemo<DesktopIconType[]>(() => {
    const toolIcons: DesktopIconType[] = terminalTools.map(t => ({
      id: `icon-tool-${t.id}`,
      label: t.name.replace(/_/g, ' '),
      icon: `tool:${t.icon}`,
      appId: `tool:${t.id}`,
    }));
    return [...defaultIcons, ...toolIcons];
  }, [terminalTools]);

  const unreadCount = getUnreadCount();
  const chatUnreadCount = getChatUnreadCount();

  const handleLongPress = useCallback((appId: string, rect: DOMRect) => {
    setQuickAction({ appId, rect });
  }, []);

  const handleCloseQuickAction = useCallback(() => {
    setQuickAction(null);
  }, []);

  return (
    <div className={styles.homeScreen}>
      {allIcons.map(icon => (
        <MobileAppIcon
          key={icon.id}
          appId={icon.appId}
          label={icon.label}
          iconKey={icon.icon}
          badgeCount={
            icon.appId === 'inbox' ? unreadCount :
            icon.appId === 'chat' ? chatUnreadCount :
            undefined
          }
          onLongPress={handleLongPress}
        />
      ))}

      {quickAction && (
        <QuickActionMenu
          appId={quickAction.appId}
          anchorRect={quickAction.rect}
          onClose={handleCloseQuickAction}
        />
      )}
    </div>
  );
}
