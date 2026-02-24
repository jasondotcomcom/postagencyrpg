import { useState, useEffect } from 'react';

export type DeviceMode = 'desktop' | 'phone' | 'tablet';

export function getDeviceMode(): DeviceMode {
  const width = window.innerWidth;
  const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (width < 768 || (isTouchPrimary && mobileUA && width < 1024)) return 'phone';
  if (width < 1024 && isTouchPrimary) return 'tablet';
  return 'desktop';
}

export function isMobile(): boolean {
  const mode = getDeviceMode();
  return mode === 'phone' || mode === 'tablet';
}

export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>(getDeviceMode);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMode(getDeviceMode());
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    // Also listen for pointer capability changes (e.g. connecting a mouse to a tablet)
    const mql = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = () => setMode(getDeviceMode());
    mql.addEventListener('change', handlePointerChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mql.removeEventListener('change', handlePointerChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return mode;
}
