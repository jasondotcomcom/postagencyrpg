import React, { useCallback, useEffect, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import type { WindowState } from '../../types';
import { useWindowContext } from '../../context/WindowContext';
import { useWindowDrag } from '../../hooks/useWindowDrag';
import { useWindowResize } from '../../hooks/useWindowResize';
import TitleBar from './TitleBar';
import ResizeHandles from './ResizeHandles';
import { InboxApp } from '../apps/Inbox';
import { ProjectsApp } from '../apps/Projects';
import { ChatApp } from '../apps/Chat';
import PortfolioApp from '../apps/Portfolio/PortfolioApp';
import SettingsApp from '../apps/Settings/SettingsApp';
import TerminalApp from '../apps/Terminal/TerminalApp';
import NotesApp from '../apps/Notes/NotesApp';
import AboutApp from '../apps/About/AboutApp';
import { useSettingsContext } from '../../context/SettingsContext';
import { HR_TRAINING_SLIDES } from '../../data/conductEvents';
import styles from './Window.module.css';

// Lazy-load larger game apps
const SolitaireApp = lazy(() => import('../apps/Solitaire/SolitaireApp'));
const MinesweeperApp = lazy(() => import('../apps/Minesweeper/MinesweeperApp'));
const SkiFreeApp = lazy(() => import('../apps/SkiFree/SkiFreeApp'));
const CalendarApp = lazy(() => import('../apps/Calendar/CalendarApp'));
const NDAEnforcementApp = lazy(() => import('../apps/Lawsuit/NDAEnforcementApp'));
const AIRevolutionApp = lazy(() => import('../apps/AIRevolution/AIRevolutionApp'));

interface WindowProps {
  window: WindowState;
  children?: ReactNode;
}

export default function Window({ window: windowState, children }: WindowProps) {
  const {
    activeWindowId,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updatePosition,
    updateSize,
  } = useWindowContext();
  const { settings } = useSettingsContext();
  const windowOpacity = settings.display.windowOpacity / 100;

  const isActive = activeWindowId === windowState.id;

  const handleFocus = useCallback(() => {
    focusWindow(windowState.id);
  }, [focusWindow, windowState.id]);

  const handlePositionChange = useCallback((x: number, y: number) => {
    updatePosition(windowState.id, x, y);
  }, [updatePosition, windowState.id]);

  const handleSizeChange = useCallback((width: number, height: number) => {
    updateSize(windowState.id, width, height);
  }, [updateSize, windowState.id]);

  const { onMouseDown: onDragMouseDown } = useWindowDrag({
    position: windowState.position,
    isMaximized: windowState.isMaximized,
    onPositionChange: handlePositionChange,
    onFocus: handleFocus,
  });

  const { getHandleProps } = useWindowResize({
    position: windowState.position,
    size: windowState.size,
    minSize: windowState.minSize,
    isMaximized: windowState.isMaximized,
    onPositionChange: handlePositionChange,
    onSizeChange: handleSizeChange,
    onFocus: handleFocus,
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow(windowState.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, closeWindow, windowState.id]);

  const windowStyle: React.CSSProperties = windowState.isMaximized
    ? { opacity: windowOpacity }
    : {
        left: windowState.position.x,
        top: windowState.position.y,
        width: windowState.size.width,
        height: windowState.size.height,
        minWidth: windowState.minSize.width,
        minHeight: windowState.minSize.height,
        zIndex: windowState.zIndex,
        opacity: windowOpacity,
      };

  if (windowState.isMinimized) {
    return null;
  }

  return (
    <div
      className={`${styles.window} ${windowState.isMaximized ? styles.maximized : ''}`}
      style={windowStyle}
      onMouseDown={handleFocus}
    >
      <TitleBar
        title={windowState.title}
        appId={windowState.appId}
        isActive={isActive}
        isMaximized={windowState.isMaximized}
        onMinimize={() => minimizeWindow(windowState.id)}
        onMaximize={() => maximizeWindow(windowState.id)}
        onClose={() => closeWindow(windowState.id)}
        onMouseDown={onDragMouseDown}
      />
      <div className={styles.windowContent}>
        {children || <AppContent appId={windowState.appId} />}
      </div>
      {!windowState.isMaximized && <ResizeHandles getHandleProps={getHandleProps} />}
    </div>
  );
}

// App content renderer - renders actual apps or placeholder content
function AppContent({ appId }: { appId: string }) {
  // Render actual app components
  switch (appId) {
    case 'inbox':
      return <InboxApp />;
    case 'projects':
      return <ProjectsApp />;
    case 'chat':
      return <ChatApp />;
    case 'portfolio':
      return <PortfolioApp />;
    case 'settings':
      return <SettingsApp />;
    case 'terminal':
      return <TerminalApp />;
    case 'notes':
      return <NotesApp />;
    case 'about':
      return <AboutApp />;
    case 'solitaire':
      return <Suspense fallback={<LazyLoading />}><SolitaireApp /></Suspense>;
    case 'minesweeper':
      return <Suspense fallback={<LazyLoading />}><MinesweeperApp /></Suspense>;
    case 'skifree':
      return <Suspense fallback={<LazyLoading />}><SkiFreeApp /></Suspense>;
    case 'calendar':
      return <Suspense fallback={<LazyLoading />}><CalendarApp /></Suspense>;
    case 'lawsuit':
    case 'ndahearing':
      return <Suspense fallback={<LazyLoading />}><NDAEnforcementApp /></Suspense>;
    case 'airevolution':
      return <Suspense fallback={<LazyLoading />}><AIRevolutionApp /></Suspense>;
    case 'hrtraining':
      return <HRTrainingApp />;
    default:
      return <PlaceholderContent appId={appId} />;
  }
}

// Loading fallback for lazy-loaded apps
function LazyLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
      Loading...
    </div>
  );
}

// HR Training app — non-skippable Corporate Desensitization Training
function HRTrainingApp() {
  const [slideIndex, setSlideIndex] = React.useState(0);
  const slide = HR_TRAINING_SLIDES[slideIndex];
  const isLast = slideIndex >= HR_TRAINING_SLIDES.length - 1;

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto', background: 'var(--bg-primary)', fontFamily: 'inherit' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Corporate Desensitization Training — Slide {slideIndex + 1} of {HR_TRAINING_SLIDES.length}
      </div>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>{slide.title}</h2>
      <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line', marginBottom: '20px' }}>{slide.body}</div>
      <div style={{ background: 'rgba(195,174,214,0.1)', border: '1px solid rgba(195,174,214,0.2)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
        {slide.patComment}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        {slideIndex > 0 && (
          <button onClick={() => setSlideIndex(i => i - 1)} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem' }}>
            Back
          </button>
        )}
        <button onClick={() => setSlideIndex(i => Math.min(i + 1, HR_TRAINING_SLIDES.length - 1))} disabled={isLast} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: isLast ? 'var(--bg-secondary)' : 'var(--color-lavender)', color: isLast ? 'var(--text-secondary)' : '#fff', cursor: isLast ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600 }}>
          {isLast ? 'Training Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// Placeholder content for apps not yet implemented
function PlaceholderContent({ appId }: { appId: string }) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#5a5a5a',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#888888',
    lineHeight: '1.6',
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const contents: Record<string, React.ReactElement> = {
    chat: (
      <div style={baseStyle}>
        <span style={emojiStyle}>💬</span>
        <p style={titleStyle}>Chat</p>
        <p style={subtitleStyle}>Talk to the team<br/>about the work.</p>
      </div>
    ),
    files: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📁</span>
        <p style={titleStyle}>My Files</p>
        <p style={subtitleStyle}>Your files will appear here.<br/>Drop something in!</p>
      </div>
    ),
    terminal: (
      <div style={{
        backgroundColor: '#2d2d2d',
        color: '#a8e6cf',
        padding: '16px',
        height: '100%',
        fontFamily: 'monospace',
        fontSize: '13px',
        borderRadius: '8px',
        lineHeight: '1.6',
      }}>
        <p style={{ color: '#c3aed6' }}>✨ Agency OS Terminal v1.0</p>
        <p style={{ marginTop: '12px', color: '#a8d8ea' }}>Ready when you are, boss.</p>
        <p style={{ marginTop: '8px' }}>
          <span style={{ color: '#ffb7b2' }}>~</span> <span style={{ color: '#a8e6cf' }}>&gt;</span> _
        </p>
      </div>
    ),
    notes: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📝</span>
        <p style={titleStyle}>Notes</p>
        <p style={subtitleStyle}>Jot down your thoughts<br/>and ideas here!</p>
      </div>
    ),
    calendar: (
      <div style={baseStyle}>
        <span style={emojiStyle}>📅</span>
        <p style={titleStyle}>Calendar</p>
        <p style={subtitleStyle}>No events scheduled.<br/>Time to plan something fun!</p>
      </div>
    ),
    settings: (
      <div style={baseStyle}>
        <span style={emojiStyle}>⚙️</span>
        <p style={titleStyle}>Settings</p>
        <p style={subtitleStyle}>Customize your experience<br/>just the way you like it.</p>
      </div>
    ),
    help: (
      <div style={{...baseStyle, alignItems: 'flex-start', textAlign: 'left'}}>
        <span style={{...emojiStyle, alignSelf: 'center'}}>📖</span>
        <p style={{...titleStyle, alignSelf: 'center', marginBottom: '16px'}}>Welcome to Agency OS!</p>
        <div style={{ ...subtitleStyle, lineHeight: '2' }}>
          <p>🖱️ <strong>Double-click</strong> icons to open apps</p>
          <p>✋ <strong>Drag</strong> title bars to move windows</p>
          <p>↔️ <strong>Drag corners</strong> to resize</p>
          <p>🔘 Use the <strong>colorful buttons</strong> to minimize, maximize, or close</p>
        </div>
      </div>
    ),
  };

  return contents[appId] || contents.help;
}

