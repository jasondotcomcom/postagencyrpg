import React from 'react';
import { useChatContext } from '../../../context/ChatContext';
import styles from './MobileChannelTabs.module.css';

export default function MobileChannelTabs(): React.ReactElement {
  const { channels, activeChannel, setActiveChannel, getUnreadCountForChannel } = useChatContext();

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabScroll}>
        {channels.map((channel) => {
          const unread = getUnreadCountForChannel(channel.id);
          const isActive = activeChannel === channel.id;
          return (
            <button
              key={channel.id}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveChannel(channel.id)}
            >
              <span className={styles.tabIcon}>{channel.icon}</span>
              <span className={styles.tabName}>{channel.name}</span>
              {unread > 0 && (
                <span className={styles.unreadBadge}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
