import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerContext } from '../../context/PlayerContext';
import { useWindowContext } from '../../context/WindowContext';
import { useAchievementContext } from '../../context/AchievementContext';
import { emitSave } from '../../utils/saveSignal';
import styles from './StartMenu.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: () => void;
  submenu?: MenuItem[];
  separator?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartMenu({ onClose }: { onClose: () => void }) {
  const { playerName, logOff: playerLogOff } = usePlayerContext();
  const { focusOrOpenWindow, addNotification, windows } = useWindowContext();
  const { recordAppOpened } = useAchievementContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<'newgame' | 'logoff' | null>(null);
  const [copied, setCopied] = useState(false);
  const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on click outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay so the open-click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const openApp = useCallback((appId: string, title: string) => {
    focusOrOpenWindow(appId, title);
    recordAppOpened(appId);
    onClose();
  }, [focusOrOpenWindow, recordAppOpened, onClose]);

  const handleSave = useCallback(() => {
    emitSave();
    addNotification('💾 Progress Checkpoint', 'Your productivity metrics have been archived.');
    onClose();
  }, [addNotification, onClose]);

  const handleNewGame = useCallback(() => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agencyrpg_') || key.startsWith('agencyrpg-')) {
          localStorage.removeItem(key);
        }
      });
    } catch { /* non-fatal */ }
    window.location.reload();
  }, []);

  const handleLogOff = useCallback(() => {
    emitSave();
    // Small delay to let save complete, then show screensaver
    setTimeout(() => {
      playerLogOff();
    }, 200);
    onClose();
  }, [playerLogOff, onClose]);

  const shareUrl = 'https://postagencyrpg.com';
  const shareText = "I've been surviving corporate dystopia at postagencyrpg.com — it's a browser sim where you do the bidding of a soulless megacorp while trying to maintain a shred of humanity. It's uncomfortably familiar.";

  const handleShareLinkedIn = useCallback(() => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  }, [onClose]);

  const handleShareTwitter = useCallback(() => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  }, [onClose]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback
      addNotification('📋 Link', shareUrl);
    });
  }, [addNotification]);

  // ── Monitored Activity (Recent Apps) ──────────────────────────────────────

  const recentApps = Array.from(windows.values())
    .sort((a, b) => b.zIndex - a.zIndex)
    .slice(0, 5)
    .map(w => ({
      id: `recent-${w.appId}`,
      label: w.title,
      icon: getAppIcon(w.appId),
      action: () => openApp(w.appId, w.title),
    }));

  // ── Licensed Software (All Apps) ──────────────────────────────────────────

  const allApps: MenuItem[] = [
    { id: 'all-inbox', label: 'Synergy Hub\u2122', icon: '📧', action: () => openApp('inbox', 'Synergy Hub\u2122') },
    { id: 'all-projects', label: 'Workflow Center', icon: '📁', action: () => openApp('projects', 'Workflow Center') },
    { id: 'all-portfolio', label: 'Deliverables Archive', icon: '🖼️', action: () => openApp('portfolio', 'Deliverables Archive') },
    { id: 'all-chat', label: 'Comm. Portal', icon: '💬', action: () => openApp('chat', 'Comm. Portal') },
    { id: 'all-terminal', label: 'IT Terminal', icon: '💻', action: () => openApp('terminal', 'IT Terminal') },
    { id: 'all-notes', label: 'Meeting Notes', icon: '📝', action: () => openApp('notes', 'Meeting Notes') },
    { id: 'all-calendar', label: 'Synergy Calendar', icon: '📅', action: () => openApp('calendar', 'Synergy Calendar') },
    { id: 'all-settings', label: 'Configuration', icon: '⚙️', action: () => openApp('settings', 'Configuration') },
    { id: 'all-help', label: 'Policy Manual', icon: '❓', action: () => openApp('help', 'Policy Manual') },
  ];

  // ── Submenu hover handling ──────────────────────────────────────────────────

  const handleSubmenuEnter = useCallback((id: string) => {
    if (submenuTimeoutRef.current) clearTimeout(submenuTimeoutRef.current);
    setActiveSubmenu(id);
  }, []);

  const handleSubmenuLeave = useCallback(() => {
    submenuTimeoutRef.current = setTimeout(() => setActiveSubmenu(null), 200);
  }, []);

  // ── Confirmation dialogs ────────────────────────────────────────────────────

  if (showConfirm) {
    const isNewGame = showConfirm === 'newgame';
    return (
      <div ref={menuRef} className={styles.menu}>
        <div className={styles.confirmDialog}>
          <div className={styles.confirmIcon}>{isNewGame ? '🔄' : '😴'}</div>
          <div className={styles.confirmTitle}>
            {isNewGame ? 'Employee Reset Protocol' : 'Mandatory Break'}
          </div>
          <div className={styles.confirmText}>
            {isNewGame
              ? 'All productivity records will be purged. This action is irreversible. Proceed?'
              : 'Your session will be archived. Break duration is monitored.'}
          </div>
          <div className={styles.confirmButtons}>
            <button
              className={styles.confirmCancel}
              onClick={() => setShowConfirm(null)}
            >
              Cancel
            </button>
            <button
              className={isNewGame ? styles.confirmDanger : styles.confirmOk}
              onClick={isNewGame ? handleNewGame : handleLogOff}
            >
              {isNewGame ? 'Purge Records' : 'Begin Break'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className={styles.menu}>
      {/* Employee header */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>👤</div>
        <div className={styles.headerName}>Resource: {playerName || 'Unregistered'}</div>
      </div>

      <div className={styles.separator} />

      {/* Search — all queries logged */}
      <button className={styles.item} disabled title="All queries are logged and reviewed">
        <span className={styles.itemIcon}>🔍</span>
        <span className={styles.itemLabel}>Search (All queries logged)</span>
      </button>

      {/* Monitored Activity (Recent Apps) */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('recent')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>👁️</span>
        <span className={styles.itemLabel}>Monitored Activity</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'recent' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('recent')} onMouseLeave={handleSubmenuLeave}>
            {recentApps.length > 0 ? recentApps.map(app => (
              <button key={app.id} className={styles.item} onClick={app.action}>
                <span className={styles.itemIcon}>{app.icon}</span>
                <span className={styles.itemLabel}>{app.label}</span>
              </button>
            )) : (
              <div className={styles.submenuEmpty}>No activity detected (suspicious)</div>
            )}
          </div>
        )}
      </div>

      {/* Licensed Software (All Apps) */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('allapps')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>📱</span>
        <span className={styles.itemLabel}>Licensed Software</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'allapps' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('allapps')} onMouseLeave={handleSubmenuLeave}>
            {allApps.map(app => (
              <button key={app.id} className={styles.item} onClick={app.action}>
                <span className={styles.itemIcon}>{app.icon}</span>
                <span className={styles.itemLabel}>{app.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.separator} />

      {/* Mandatory Programs */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('programs')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>🎮</span>
        <span className={styles.itemLabel}>Mandatory Programs</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'programs' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('programs')} onMouseLeave={handleSubmenuLeave}>
            <button className={styles.item} onClick={() => openApp('solitaire', 'Mandatory Fun Time')}>
              <span className={styles.itemIcon}>🃏</span>
              <span className={styles.itemLabel}>Mandatory Fun Time</span>
            </button>
            <button className={styles.item} onClick={() => openApp('minesweeper', 'Compliance Field')}>
              <span className={styles.itemIcon}>💣</span>
              <span className={styles.itemLabel}>Compliance Field</span>
            </button>
            <button className={styles.item} onClick={() => openApp('skifree', 'Escape the Quarterly Review')}>
              <span className={styles.itemIcon}>⛷️</span>
              <span className={styles.itemLabel}>Escape the Review</span>
            </button>
          </div>
        )}
      </div>

      {/* Compliance Settings */}
      <button className={styles.item} onClick={() => openApp('settings', 'Configuration')}>
        <span className={styles.itemIcon}>⚙️</span>
        <span className={styles.itemLabel}>Compliance Settings</span>
      </button>

      {/* Performance Metrics (Achievements) */}
      <button className={styles.item} onClick={() => openApp('notes', 'Performance Metrics')}>
        <span className={styles.itemIcon}>📊</span>
        <span className={styles.itemLabel}>Performance Metrics</span>
      </button>

      {/* Policy Manual */}
      <button className={styles.item} onClick={() => openApp('help', 'Policy Manual')}>
        <span className={styles.itemIcon}>📋</span>
        <span className={styles.itemLabel}>Policy Manual</span>
      </button>

      {/* About OmniPubDent OS */}
      <button className={styles.item} onClick={() => openApp('about', 'About OmniPubDent OS')}>
        <span className={styles.itemIcon}>ℹ️</span>
        <span className={styles.itemLabel}>About OmniPubDent OS</span>
      </button>

      <div className={styles.separator} />

      {/* Recommend to Management (Share Game) */}
      <div
        className={styles.item}
        onMouseEnter={() => handleSubmenuEnter('share')}
        onMouseLeave={handleSubmenuLeave}
      >
        <span className={styles.itemIcon}>📤</span>
        <span className={styles.itemLabel}>Recommend to Management</span>
        <span className={styles.itemArrow}>▸</span>
        {activeSubmenu === 'share' && (
          <div className={styles.submenu} onMouseEnter={() => handleSubmenuEnter('share')} onMouseLeave={handleSubmenuLeave}>
            <button className={styles.item} onClick={handleShareLinkedIn}>
              <span className={styles.itemIcon}>💼</span>
              <span className={styles.itemLabel}>LinkedIn</span>
            </button>
            <button className={styles.item} onClick={handleShareTwitter}>
              <span className={styles.itemIcon}>🐦</span>
              <span className={styles.itemLabel}>Twitter / X</span>
            </button>
            <button className={styles.item} onClick={handleCopyLink}>
              <span className={styles.itemIcon}>{copied ? '✅' : '🔗'}</span>
              <span className={styles.itemLabel}>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkpoint Progress (Save Game) */}
      <button className={styles.item} onClick={handleSave}>
        <span className={styles.itemIcon}>💾</span>
        <span className={styles.itemLabel}>Checkpoint Progress</span>
      </button>

      {/* Employee Reset Protocol (New Game) */}
      <button className={styles.item} onClick={() => setShowConfirm('newgame')}>
        <span className={styles.itemIcon}>🔄</span>
        <span className={styles.itemLabel}>Employee Reset Protocol</span>
      </button>

      {/* Mandatory Break (Log Off) */}
      <button className={styles.item} onClick={() => setShowConfirm('logoff')}>
        <span className={styles.itemIcon}>😴</span>
        <span className={styles.itemLabel}>Mandatory Break</span>
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAppIcon(appId: string): string {
  const icons: Record<string, string> = {
    inbox: '📧', projects: '📁', portfolio: '🖼️', chat: '💬',
    terminal: '💻', notes: '📝', calendar: '📅', settings: '⚙️',
    help: '❓', solitaire: '🃏', minesweeper: '💣', skifree: '⛷️',
    about: 'ℹ️', lawsuit: '⚖️',
  };
  return icons[appId] || '📄';
}
