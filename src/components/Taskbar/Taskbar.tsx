import { useWindowContext } from '../../context/WindowContext';
import TaskbarButton from './TaskbarButton';
import Clock from './Clock';
import ReputationDisplay from './ReputationDisplay';
import AgencyFundsDisplay from './AgencyFundsDisplay';
import { loadLegacy } from '../Ending/EndingSequence';
import styles from './Taskbar.module.css';

export default function Taskbar() {
  const { windows } = useWindowContext();
  const legacy = loadLegacy();

  const windowList = Array.from(windows.values());

  return (
    <div className={styles.taskbar}>
      <button className={styles.startButton}>
        <div className={styles.startLogo}>
          <svg viewBox="0 0 24 24" fill="none">
            {/* OmniPubDent Corporate Logo Mark */}
            <rect x="2" y="2" width="20" height="20" rx="2" fill="#4a5568"/>
            <rect x="5" y="5" width="14" height="2" fill="#9ab0b0"/>
            <rect x="5" y="9" width="10" height="2" fill="#7a8a8a"/>
            <rect x="5" y="13" width="12" height="2" fill="#7a8a8a"/>
            <rect x="5" y="17" width="8" height="2" fill="#5a6a6a"/>
          </svg>
        </div>
        <span>OmniPubDent</span>
      </button>

      <div className={styles.windowButtons}>
        {windowList.map(win => (
          <TaskbarButton key={win.id} window={win} />
        ))}
      </div>

      <div className={styles.systemTray}>
        {legacy && (
          <div
            className={styles.ngBadge}
            title={`New Game+ — Run #${legacy.playthroughCount + 1}`}
          >
            NG+
          </div>
        )}
        <AgencyFundsDisplay />
        <ReputationDisplay />
        <Clock />
      </div>
    </div>
  );
}
