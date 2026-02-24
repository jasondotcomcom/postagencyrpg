import React, { lazy, Suspense } from 'react';
import { InboxApp } from '../apps/Inbox';
import { ProjectsApp } from '../apps/Projects';
import { ChatApp } from '../apps/Chat';
import PortfolioApp from '../apps/Portfolio/PortfolioApp';
import SettingsApp from '../apps/Settings/SettingsApp';
import TerminalApp from '../apps/Terminal/TerminalApp';
import NotesApp from '../apps/Notes/NotesApp';
import CalendarApp from '../apps/Calendar/CalendarApp';
import SolitaireApp from '../apps/Solitaire/SolitaireApp';
import MinesweeperApp from '../apps/Minesweeper/MinesweeperApp';

const SkiFreeApp = lazy(() => import('../apps/SkiFree/SkiFreeApp'));
const NDAEnforcementApp = lazy(() => import('../apps/Lawsuit/NDAEnforcementApp'));
const AIRevolutionApp = lazy(() => import('../apps/AIRevolution/AIRevolutionApp'));
const AboutApp = lazy(() => import('../apps/About/AboutApp'));

const LoadingFallback = ({ text = 'Loading...' }: { text?: string }) => (
  <div style={{ padding: 24, textAlign: 'center' }}>{text}</div>
);

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
    files: (
      <div style={baseStyle}>
        <span style={emojiStyle}>&#128193;</span>
        <p style={titleStyle}>Classified Files</p>
        <p style={subtitleStyle}>Access restricted.<br/>Submit Form 27-B to request clearance.</p>
      </div>
    ),
    help: (
      <div style={{...baseStyle, alignItems: 'flex-start', textAlign: 'left'}}>
        <span style={{...emojiStyle, alignSelf: 'center'}}>&#128214;</span>
        <p style={{...titleStyle, alignSelf: 'center', marginBottom: '16px'}}>Employee Portal Guide</p>
        <div style={{ ...subtitleStyle, lineHeight: '2' }}>
          <p>&#128433;&#65039; <strong>Tap</strong> approved applications to open</p>
          <p>&#9995; <strong>Swipe</strong> to navigate between sections</p>
          <p>&#8596;&#65039; <strong>Edge swipe</strong> to go back</p>
          <p>&#128308; All activity is <strong>monitored and logged</strong></p>
        </div>
      </div>
    ),
  };

  return contents[appId] || contents.help;
}

/**
 * Shared app router -- maps appId to React component.
 * Used by mobile MobileAppContainer.
 */
export default function AppRouter({ appId }: { appId: string }) {
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
    case 'calendar':
      return <CalendarApp />;
    case 'solitaire':
      return <SolitaireApp />;
    case 'minesweeper':
      return <MinesweeperApp />;
    case 'skifree':
      return <Suspense fallback={<LoadingFallback text="Loading SkiFree..." />}><SkiFreeApp /></Suspense>;
    case 'lawsuit':
      return <Suspense fallback={<LoadingFallback />}><NDAEnforcementApp /></Suspense>;
    case 'ai-revolution':
      return <Suspense fallback={<LoadingFallback />}><AIRevolutionApp /></Suspense>;
    case 'about':
      return <Suspense fallback={<LoadingFallback />}><AboutApp /></Suspense>;
    default:
      return <PlaceholderContent appId={appId} />;
  }
}
