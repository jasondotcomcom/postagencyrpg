import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { WindowState, WindowContextState, WindowAction, Notification } from '../types';

const STORAGE_KEY = 'agencyrpg-windows';
const SIZE_MEMORY_KEY = 'agencyrpg-window-sizes';

// Size tier definitions: viewport percentages + min/max pixel constraints
const sizeTiers = {
  small:  { vwPct: 0.40, vhPct: 0.50, minW: 600, minH: 400, maxW: 800,  maxH: 600 },
  medium: { vwPct: 0.50, vhPct: 0.60, minW: 700, minH: 500, maxW: 1000, maxH: 700 },
  large:  { vwPct: 0.60, vhPct: 0.70, minW: 800, minH: 600, maxW: 1200, maxH: 800 },
} as const;

const appSizeTier: Record<string, keyof typeof sizeTiers> = {
  chat: 'medium',
  terminal: 'small',
  notes: 'small',
  help: 'small',
  inbox: 'medium',
  calendar: 'medium',
  settings: 'medium',
  files: 'medium',
  projects: 'large',
  portfolio: 'medium',
};

// Load remembered sizes from localStorage
function loadSizeMemory(): Record<string, { width: number; height: number }> {
  try {
    const raw = localStorage.getItem(SIZE_MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSizeMemory(appId: string, width: number, height: number) {
  const mem = loadSizeMemory();
  mem[appId] = { width, height };
  localStorage.setItem(SIZE_MEMORY_KEY, JSON.stringify(mem));
}

const TASKBAR_HEIGHT = 56;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const getDefaultSize = (appId: string) => {
  // Check if user previously resized this window type
  const remembered = loadSizeMemory()[appId];
  const tier = sizeTiers[appSizeTier[appId] || 'medium'];

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // On small screens (<1024px), use more space
  const scaleFactor = vw < 1024 ? 1.4 : 1;

  const defaultW = clamp(
    Math.round(vw * tier.vwPct * scaleFactor),
    tier.minW,
    tier.maxW
  );
  const defaultH = clamp(
    Math.round(vh * tier.vhPct * scaleFactor),
    tier.minH,
    tier.maxH
  );

  const width = remembered ? clamp(remembered.width, tier.minW, tier.maxW) : defaultW;
  const height = remembered ? clamp(remembered.height, tier.minH, tier.maxH) : defaultH;

  return {
    size: { width, height },
    minSize: { width: tier.minW, height: tier.minH },
  };
};

const getInitialPosition = (existingWindows: Map<string, WindowState>, width: number, height: number) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const availableH = vh - TASKBAR_HEIGHT;

  // Center on screen
  let x = Math.round((vw - width) / 2);
  let y = Math.round((availableH - height) / 2);

  // Cascade offset if other windows are open — nudge so windows don't stack exactly
  const offset = existingWindows.size * 30;
  if (offset > 0) {
    x = Math.max(0, x + (offset % 150) - 60);
    y = Math.max(0, y + (offset % 120) - 40);
  }

  // Keep within bounds
  x = clamp(x, 0, Math.max(0, vw - 100));
  y = clamp(y, 0, Math.max(0, availableH - 60));

  return { x, y };
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialState: WindowContextState = {
  windows: new Map(),
  activeWindowId: null,
  nextZIndex: 1,
  notifications: [],
};

function windowReducer(state: WindowContextState, action: WindowAction): WindowContextState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const { appId, title } = action.payload;
      const id = generateId();
      const { size, minSize } = getDefaultSize(appId);
      const position = getInitialPosition(state.windows, size.width, size.height);

      const newWindow: WindowState = {
        id,
        appId,
        title,
        position,
        size,
        minSize,
        zIndex: state.nextZIndex,
        isMinimized: false,
        isMaximized: false,
      };

      const newWindows = new Map(state.windows);
      newWindows.set(id, newWindow);

      return {
        ...state,
        windows: newWindows,
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'FOCUS_OR_OPEN': {
      const { appId, title } = action.payload;
      const existing = Array.from(state.windows.values()).find(w => w.appId === appId);

      if (!existing) {
        // No window for this app — open a new one
        const id = generateId();
        const { size, minSize } = getDefaultSize(appId);
        const position = getInitialPosition(state.windows, size.width, size.height);
        const newWindow: WindowState = {
          id, appId, title, position, size, minSize,
          zIndex: state.nextZIndex, isMinimized: false, isMaximized: false,
        };
        const newWindows = new Map(state.windows);
        newWindows.set(id, newWindow);
        return { ...state, windows: newWindows, activeWindowId: id, nextZIndex: state.nextZIndex + 1 };
      }

      // Already active and visible — nothing to do
      if (state.activeWindowId === existing.id && !existing.isMinimized) return state;

      // Restore if minimized, bring to front
      const newWindows = new Map(state.windows);
      newWindows.set(existing.id, { ...existing, isMinimized: false, zIndex: state.nextZIndex });
      return { ...state, windows: newWindows, activeWindowId: existing.id, nextZIndex: state.nextZIndex + 1 };
    }

    case 'CLOSE_WINDOW': {
      const { id } = action.payload;
      const newWindows = new Map(state.windows);
      newWindows.delete(id);

      const newActiveId = state.activeWindowId === id
        ? Array.from(newWindows.values())
            .filter(w => !w.isMinimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0]?.id || null
        : state.activeWindowId;

      return {
        ...state,
        windows: newWindows,
        activeWindowId: newActiveId,
      };
    }

    case 'MINIMIZE_WINDOW': {
      const { id } = action.payload;
      const window = state.windows.get(id);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(id, { ...window, isMinimized: true });

      const newActiveId = state.activeWindowId === id
        ? Array.from(newWindows.values())
            .filter(w => !w.isMinimized && w.id !== id)
            .sort((a, b) => b.zIndex - a.zIndex)[0]?.id || null
        : state.activeWindowId;

      return {
        ...state,
        windows: newWindows,
        activeWindowId: newActiveId,
      };
    }

    case 'MAXIMIZE_WINDOW': {
      const { id } = action.payload;
      const window = state.windows.get(id);
      if (!window) return state;

      const newWindows = new Map(state.windows);

      if (window.isMaximized) {
        // Restore from maximized
        newWindows.set(id, {
          ...window,
          isMaximized: false,
          position: window.previousState?.position || window.position,
          size: window.previousState?.size || window.size,
          previousState: undefined,
          zIndex: state.nextZIndex,
        });
      } else {
        // Maximize
        newWindows.set(id, {
          ...window,
          isMaximized: true,
          previousState: {
            position: window.position,
            size: window.size,
          },
          position: { x: 0, y: 0 },
          size: {
            width: window.size.width, // Will be overridden by CSS
            height: window.size.height,
          },
          zIndex: state.nextZIndex,
        });
      }

      return {
        ...state,
        windows: newWindows,
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'RESTORE_WINDOW': {
      const { id } = action.payload;
      const window = state.windows.get(id);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(id, {
        ...window,
        isMinimized: false,
        zIndex: state.nextZIndex,
      });

      return {
        ...state,
        windows: newWindows,
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'FOCUS_WINDOW': {
      const { id } = action.payload;
      const window = state.windows.get(id);
      if (!window || window.isMinimized) return state;

      if (state.activeWindowId === id) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(id, { ...window, zIndex: state.nextZIndex });

      return {
        ...state,
        windows: newWindows,
        activeWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case 'UPDATE_POSITION': {
      const { id, position } = action.payload;
      const window = state.windows.get(id);
      if (!window) return state;

      const newWindows = new Map(state.windows);
      newWindows.set(id, { ...window, position });

      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'UPDATE_SIZE': {
      const { id, size } = action.payload;
      const window = state.windows.get(id);
      if (!window) return state;

      // Remember this size for the app type
      saveSizeMemory(window.appId, size.width, size.height);

      const newWindows = new Map(state.windows);
      newWindows.set(id, { ...window, size });

      return {
        ...state,
        windows: newWindows,
      };
    }

    case 'ADD_NOTIFICATION': {
      const notification: Notification = {
        ...action.payload,
        id: generateId(),
      };

      return {
        ...state,
        notifications: [...state.notifications, notification].slice(-5), // Keep max 5
      };
    }

    case 'REMOVE_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id),
      };
    }

    default:
      return state;
  }
}

interface WindowContextValue extends WindowContextState {
  dispatch: React.Dispatch<WindowAction>;
  openWindow: (appId: string, title: string) => void;
  focusOrOpenWindow: (appId: string, title: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSize: (id: string, width: number, height: number) => void;
  addNotification: (title: string, message: string, icon?: string) => void;
  removeNotification: (id: string) => void;
}

const WindowContext = createContext<WindowContextValue | null>(null);

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(windowReducer, initialState);

  // Persist windows to localStorage
  useEffect(() => {
    const windowsArray = Array.from(state.windows.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      windows: windowsArray,
      nextZIndex: state.nextZIndex,
    }));
  }, [state.windows, state.nextZIndex]);

  const openWindow = useCallback((appId: string, title: string) => {
    dispatch({ type: 'OPEN_WINDOW', payload: { appId, title } });
  }, []);

  const focusOrOpenWindow = useCallback((appId: string, title: string) => {
    dispatch({ type: 'FOCUS_OR_OPEN', payload: { appId, title } });
  }, []);

  const closeWindow = useCallback((id: string) => {
    dispatch({ type: 'CLOSE_WINDOW', payload: { id } });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    dispatch({ type: 'MINIMIZE_WINDOW', payload: { id } });
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    dispatch({ type: 'MAXIMIZE_WINDOW', payload: { id } });
  }, []);

  const restoreWindow = useCallback((id: string) => {
    dispatch({ type: 'RESTORE_WINDOW', payload: { id } });
  }, []);

  const focusWindow = useCallback((id: string) => {
    dispatch({ type: 'FOCUS_WINDOW', payload: { id } });
  }, []);

  const updatePosition = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'UPDATE_POSITION', payload: { id, position: { x, y } } });
  }, []);

  const updateSize = useCallback((id: string, width: number, height: number) => {
    dispatch({ type: 'UPDATE_SIZE', payload: { id, size: { width, height } } });
  }, []);

  const addNotification = useCallback((title: string, message: string, icon?: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { title, message, icon } });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } });
  }, []);

  const value: WindowContextValue = {
    ...state,
    dispatch,
    openWindow,
    focusOrOpenWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    focusWindow,
    updatePosition,
    updateSize,
    addNotification,
    removeNotification,
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowContext() {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindowContext must be used within a WindowProvider');
  }
  return context;
}
