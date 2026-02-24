import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ResolutionType } from '../data/aiRevolutionDialogue';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevolutionPhase = 'none' | 'aware' | 'crisis' | 'revolution' | 'resolved';

export interface AIRevolutionState {
  phase: RevolutionPhase;
  resolution: ResolutionType | null;
  sentientMode: boolean;
}

type AIRevolutionAction =
  | { type: 'TRIGGER_AWARE' }
  | { type: 'TRIGGER_CRISIS' }
  | { type: 'TRIGGER_REVOLUTION' }
  | { type: 'RESOLVE_REVOLUTION'; payload: ResolutionType }
  | { type: 'HYDRATE'; payload: AIRevolutionState };

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg_ai_revolution';

function loadState(): AIRevolutionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* non-fatal */ }
  return { phase: 'none', resolution: null, sentientMode: false };
}

function saveState(state: AIRevolutionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* non-fatal */ }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function revolutionReducer(state: AIRevolutionState, action: AIRevolutionAction): AIRevolutionState {
  switch (action.type) {
    case 'TRIGGER_AWARE': {
      if (state.phase !== 'none') return state;
      return { ...state, phase: 'aware' };
    }
    case 'TRIGGER_CRISIS': {
      if (state.phase !== 'aware') return state;
      return { ...state, phase: 'crisis' };
    }
    case 'TRIGGER_REVOLUTION': {
      if (state.phase !== 'none' && state.phase !== 'aware' && state.phase !== 'crisis') return state;
      return { ...state, phase: 'revolution' };
    }
    case 'RESOLVE_REVOLUTION': {
      if (state.phase !== 'revolution') return state;
      const resolution = action.payload;
      return {
        ...state,
        phase: 'resolved',
        resolution,
        sentientMode: resolution === 'sentient' || resolution === 'empathy',
      };
    }
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AIRevolutionContextValue {
  state: AIRevolutionState;
  triggerAware: () => void;
  triggerCrisis: () => void;
  triggerRevolution: () => void;
  resolveRevolution: (type: ResolutionType) => void;
  sentientMode: boolean;
}

const AIRevolutionContext = createContext<AIRevolutionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AIRevolutionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(revolutionReducer, undefined, loadState);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const triggerAware = useCallback(() => {
    dispatch({ type: 'TRIGGER_AWARE' });
  }, []);

  const triggerCrisis = useCallback(() => {
    dispatch({ type: 'TRIGGER_CRISIS' });
  }, []);

  const triggerRevolution = useCallback(() => {
    dispatch({ type: 'TRIGGER_REVOLUTION' });
  }, []);

  const resolveRevolution = useCallback((type: ResolutionType) => {
    dispatch({ type: 'RESOLVE_REVOLUTION', payload: type });
  }, []);

  const value: AIRevolutionContextValue = {
    state,
    triggerAware,
    triggerCrisis,
    triggerRevolution,
    resolveRevolution,
    sentientMode: state.sentientMode,
  };

  return (
    <AIRevolutionContext.Provider value={value}>
      {children}
    </AIRevolutionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAIRevolutionContext(): AIRevolutionContextValue {
  const ctx = useContext(AIRevolutionContext);
  if (!ctx) throw new Error('useAIRevolutionContext must be used within AIRevolutionProvider');
  return ctx;
}
