import { useEffect, useRef } from 'react';
import { useMobileContext } from '../../context/MobileContext';
import { useChatContext } from '../../context/ChatContext';
import { hapticTap } from './haptics';
import styles from './Mobile.module.css';

// ---------------------------------------------------------------------------
// Quick-action definitions per app (dystopian corporate version)
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  action: string; // Internal action identifier
}

function getQuickActions(appId: string): QuickAction[] {
  const actions: QuickAction[] = [];

  switch (appId) {
    case 'inbox':
      actions.push({ label: 'View directives only', action: 'inbox:briefs' });
      actions.push({ label: 'Report to HR', action: 'report:hr' });
      break;
    case 'chat':
      actions.push({ label: 'Jump to #general', action: 'chat:general' });
      actions.push({ label: 'Jump to #creative', action: 'chat:creative' });
      actions.push({ label: 'Jump to #random', action: 'chat:random' });
      actions.push({ label: 'Flag for Review', action: 'flag:review' });
      break;
    case 'projects':
      actions.push({ label: 'View active campaigns', action: 'projects:active' });
      actions.push({ label: 'Flag for Review', action: 'flag:review' });
      break;
    default:
      actions.push({ label: 'Report to HR', action: 'report:hr' });
      actions.push({ label: 'Flag for Review', action: 'flag:review' });
      break;
  }

  actions.push({ label: 'Open', action: 'open' });
  return actions;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuickActionMenuProps {
  appId: string;
  /** Rect of the icon element, used for positioning. */
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function QuickActionMenu({ appId, anchorRect, onClose }: QuickActionMenuProps) {
  const { openApp } = useMobileContext();
  const { setActiveChannel } = useChatContext();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when tapping outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Use a short delay so the long-press touchend doesn't immediately close
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const actions = getQuickActions(appId);

  function handleAction(action: string) {
    hapticTap();

    switch (action) {
      case 'open':
        openApp(appId);
        break;
      case 'inbox:briefs':
        openApp('inbox');
        break;
      case 'chat:general':
        setActiveChannel('general');
        openApp('chat');
        break;
      case 'chat:creative':
        setActiveChannel('creative');
        openApp('chat');
        break;
      case 'chat:random':
        setActiveChannel('random');
        openApp('chat');
        break;
      case 'projects:active':
        openApp('projects');
        break;
      case 'report:hr':
        // Report to HR -- opens inbox (the corporate way)
        openApp('inbox');
        break;
      case 'flag:review':
        // Flag for review -- opens projects
        openApp('projects');
        break;
      default:
        openApp(appId);
    }

    onClose();
  }

  // Position: above the icon, centered horizontally
  const menuWidth = 180;
  const left = Math.max(
    8,
    Math.min(
      anchorRect.left + anchorRect.width / 2 - menuWidth / 2,
      window.innerWidth - menuWidth - 8,
    ),
  );
  const top = Math.max(8, anchorRect.top - actions.length * 44 - 12);

  return (
    <div
      ref={menuRef}
      className={styles.quickActionMenu}
      style={{ left, top, width: menuWidth }}
    >
      {actions.map(a => (
        <button
          key={a.action}
          className={styles.quickActionItem}
          onClick={() => handleAction(a.action)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
