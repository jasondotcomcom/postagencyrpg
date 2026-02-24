import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useWindowContext } from './WindowContext';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface MobileState {
  activeAppId: string | null;   // Currently open app, null = home screen
  navStack: string[];            // Back navigation history (array of appIds)
  notifDrawerOpen: boolean;      // Notification drawer state
}

const initialState: MobileState = {
  activeAppId: null,
  navStack: [],
  notifDrawerOpen: false,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type MobileAction =
  | { type: 'OPEN_APP'; payload: { appId: string } }
  | { type: 'GO_BACK' }
  | { type: 'GO_HOME' }
  | { type: 'TOGGLE_NOTIF_DRAWER' };

function mobileReducer(state: MobileState, action: MobileAction): MobileState {
  switch (action.type) {
    case 'OPEN_APP': {
      const { appId } = action.payload;
      // Push current activeAppId onto navStack (if there is one)
      const navStack = state.activeAppId !== null
        ? [...state.navStack, state.activeAppId]
        : [...state.navStack];
      return {
        ...state,
        activeAppId: appId,
        navStack,
      };
    }

    case 'GO_BACK': {
      const navStack = [...state.navStack];
      const previous = navStack.pop() ?? null;
      return {
        ...state,
        activeAppId: previous,
        navStack,
      };
    }

    case 'GO_HOME': {
      return {
        ...state,
        activeAppId: null,
        navStack: [],
      };
    }

    case 'TOGGLE_NOTIF_DRAWER': {
      return {
        ...state,
        notifDrawerOpen: !state.notifDrawerOpen,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface MobileContextValue extends MobileState {
  openApp: (appId: string) => void;
  goBack: () => void;
  goHome: () => void;
  toggleNotifDrawer: () => void;
}

const MobileContext = createContext<MobileContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mobileReducer, initialState);
  const { windows } = useWindowContext();

  // ---- WindowContext bridge ------------------------------------------------
  // Track previous window IDs so we can detect newly opened windows.
  const prevWindowIdsRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    const currentIds = new Set(windows.keys());
    const prevIds = prevWindowIdsRef.current;

    // Find IDs that exist now but didn't exist before
    currentIds.forEach((id) => {
      if (!prevIds.has(id)) {
        const win = windows.get(id);
        if (win) {
          dispatch({ type: 'OPEN_APP', payload: { appId: win.appId } });
        }
      }
    });

    // Update ref for next comparison
    prevWindowIdsRef.current = currentIds;
  }, [windows]);

  // ---- Action helpers ------------------------------------------------------

  const openApp = useCallback((appId: string) => {
    dispatch({ type: 'OPEN_APP', payload: { appId } });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const goHome = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
  }, []);

  const toggleNotifDrawer = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTIF_DRAWER' });
  }, []);

  // ---- Value ---------------------------------------------------------------

  const value: MobileContextValue = {
    ...state,
    openApp,
    goBack,
    goHome,
    toggleNotifDrawer,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMobileContext() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
}
