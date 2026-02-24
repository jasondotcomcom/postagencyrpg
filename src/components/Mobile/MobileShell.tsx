import { useState, useCallback } from 'react';
import { useMobileContext } from '../../context/MobileContext';
import { useShakeDetection } from './useShakeDetection';
import MobileStatusBar from './MobileStatusBar';
import MobileHomeScreen from './MobileHomeScreen';
import MobileAppContainer from './MobileAppContainer';
import MobileDock from './MobileDock';
import MobileToast from './MobileToast';
import MobileNotificationDrawer from './MobileNotificationDrawer';
import QuickSessionModal from './QuickSessionModal';
import styles from './Mobile.module.css';

export default function MobileShell() {
  const { activeAppId } = useMobileContext();
  const [sessionModalOpen, setSessionModalOpen] = useState(false);

  const isOnHomeScreen = activeAppId === null;

  // Shake triggers session summary on home screen
  useShakeDetection({
    onShake: useCallback(() => {
      if (isOnHomeScreen) {
        setSessionModalOpen(true);
      }
    }, [isOnHomeScreen]),
    disabled: !isOnHomeScreen,
  });

  // Status bar tap triggers session summary on home screen
  const handleStatusBarTap = useCallback(() => {
    if (isOnHomeScreen) {
      setSessionModalOpen(true);
    }
  }, [isOnHomeScreen]);

  const handleCloseSessionModal = useCallback(() => {
    setSessionModalOpen(false);
  }, []);

  return (
    <div className={styles.phoneFrame}>
      <MobileStatusBar onTap={handleStatusBarTap} />
      <div className={styles.screenArea}>
        {activeAppId ? (
          <MobileAppContainer key={activeAppId} appId={activeAppId} />
        ) : (
          <MobileHomeScreen />
        )}
      </div>
      <MobileDock />
      <MobileToast />
      <MobileNotificationDrawer />

      <QuickSessionModal
        open={sessionModalOpen}
        onClose={handleCloseSessionModal}
      />
    </div>
  );
}
