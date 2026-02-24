import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useEmailContext } from './EmailContext';
import { useChatContext } from './ChatContext';
import { useWindowContext } from './WindowContext';
import { useAchievementContext } from './AchievementContext';
import { useAgencyFunds } from './AgencyFundsContext';
import { useEndingContext } from './EndingContext';
import { usePlayerContext } from './PlayerContext';
import type { ConductFlag } from '../data/conductEvents';
import {
  HR_WARNING_MESSAGES,
  TEAM_COMPLAINT_MESSAGES,
  getNewsArticleEmail,
  getClientDisturbedEmail,
  getMomsEmail,
  getNDAEnforcementEmail,
  POSITIVE_CHAT_MESSAGES,
} from '../data/conductEvents';
import { emitSave } from '../utils/saveSignal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConductIncident {
  type: ConductFlag;
  severity: number;
  timestamp: number;
  description: string;
}

interface ConductState {
  conductScore: number;           // -100 (too human) to +100 (properly corporate)
  incidentLog: ConductIncident[];
  warningLevel: number;           // 0-6 (escalation for showing humanity)
  corporateStreak: number;        // consecutive corporate behaviors
  lastIncidentTime: number;
  teamUnavailable: string[];
  ndaHearingPlayed: number;
  ndaHearingResult: 'survived' | 'terminated' | 'reassigned' | null;
  trainingCompleted: boolean;
  forcedResignation: boolean;
  hadTeamDeparture: boolean;
  corporateThresholdsHit: number[];  // track which reward thresholds already fired
}

type ConductAction =
  | { type: 'RECORD_INCIDENT'; payload: ConductIncident }
  | { type: 'ADJUST_SCORE'; payload: number }
  | { type: 'SET_WARNING_LEVEL'; payload: number }
  | { type: 'INCREMENT_CORPORATE_STREAK' }
  | { type: 'RESET_CORPORATE_STREAK' }
  | { type: 'SET_TEAM_UNAVAILABLE'; payload: string[] }
  | { type: 'CLEAR_TEAM_UNAVAILABLE' }
  | { type: 'SET_NDA_RESULT'; payload: 'survived' | 'terminated' | 'reassigned' }
  | { type: 'INCREMENT_NDA_PLAYED' }
  | { type: 'SET_TRAINING_COMPLETED' }
  | { type: 'SET_FORCED_RESIGNATION' }
  | { type: 'SET_HAD_DEPARTURE' }
  | { type: 'MARK_CORPORATE_THRESHOLD'; payload: number }
  | { type: 'LOAD_STATE'; payload: Partial<ConductState> };

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'agencyrpg_conduct';

function loadState(): Partial<ConductState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch { return null; }
}

const saved = loadState();
const initialState: ConductState = {
  conductScore: saved?.conductScore ?? 0,
  incidentLog: saved?.incidentLog ?? [],
  warningLevel: saved?.warningLevel ?? 0,
  corporateStreak: saved?.corporateStreak ?? 0,
  lastIncidentTime: saved?.lastIncidentTime ?? 0,
  teamUnavailable: saved?.teamUnavailable ?? [],
  ndaHearingPlayed: saved?.ndaHearingPlayed ?? 0,
  ndaHearingResult: saved?.ndaHearingResult ?? null,
  trainingCompleted: saved?.trainingCompleted ?? false,
  forcedResignation: saved?.forcedResignation ?? false,
  hadTeamDeparture: saved?.hadTeamDeparture ?? false,
  corporateThresholdsHit: saved?.corporateThresholdsHit ?? [],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function conductReducer(state: ConductState, action: ConductAction): ConductState {
  switch (action.type) {
    case 'RECORD_INCIDENT':
      return {
        ...state,
        incidentLog: [...state.incidentLog, action.payload],
        lastIncidentTime: action.payload.timestamp,
      };
    case 'ADJUST_SCORE':
      return {
        ...state,
        conductScore: Math.max(-100, Math.min(100, state.conductScore + action.payload)),
      };
    case 'SET_WARNING_LEVEL':
      return { ...state, warningLevel: action.payload };
    case 'INCREMENT_CORPORATE_STREAK':
      return { ...state, corporateStreak: state.corporateStreak + 1 };
    case 'RESET_CORPORATE_STREAK':
      return { ...state, corporateStreak: 0 };
    case 'SET_TEAM_UNAVAILABLE':
      return { ...state, teamUnavailable: action.payload };
    case 'CLEAR_TEAM_UNAVAILABLE':
      return { ...state, teamUnavailable: [] };
    case 'SET_NDA_RESULT':
      return { ...state, ndaHearingResult: action.payload };
    case 'INCREMENT_NDA_PLAYED':
      return { ...state, ndaHearingPlayed: state.ndaHearingPlayed + 1 };
    case 'SET_TRAINING_COMPLETED':
      return { ...state, trainingCompleted: true };
    case 'SET_FORCED_RESIGNATION':
      return { ...state, forcedResignation: true };
    case 'SET_HAD_DEPARTURE':
      return { ...state, hadTeamDeparture: true };
    case 'MARK_CORPORATE_THRESHOLD':
      if (state.corporateThresholdsHit.includes(action.payload)) return state;
      return { ...state, corporateThresholdsHit: [...state.corporateThresholdsHit, action.payload] };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context Interface ────────────────────────────────────────────────────────

interface ConductContextValue {
  /** -100 (too human) to +100 (properly corporate) */
  conductScore: number;
  /** 0-6: escalation level for detected humanity */
  warningLevel: number;
  incidentLog: ConductIncident[];
  teamUnavailable: string[];
  corporateStreak: number;
  ndaHearingResult: 'survived' | 'terminated' | 'reassigned' | null;
  forcedResignation: boolean;
  hadTeamDeparture: boolean;
  /** Report detected humanity — triggers HR escalation */
  reportIncident: (flag: ConductFlag, description: string) => void;
  /** Report approved corporate behavior — rewards coldness */
  reportCorporate: () => void;
  completeNDAHearing: (result: 'survived' | 'terminated' | 'reassigned') => void;
  completeTraining: () => void;
  isTeamMemberAvailable: (id: string) => boolean;
  setTeamUnavailable: (ids: string[]) => void;
  clearTeamUnavailable: () => void;
}

const ConductContext = createContext<ConductContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConductProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conductReducer, initialState);
  const { addEmail } = useEmailContext();
  const { addMessage, setMorale } = useChatContext();
  const { addNotification, focusOrOpenWindow } = useWindowContext();
  const { unlockAchievement, incrementCounter } = useAchievementContext();
  const { addProfit } = useAgencyFunds();
  const { triggerEndingSequence } = useEndingContext();
  const { playerName } = usePlayerContext();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conductScore: state.conductScore,
        incidentLog: state.incidentLog,
        warningLevel: state.warningLevel,
        corporateStreak: state.corporateStreak,
        lastIncidentTime: state.lastIncidentTime,
        teamUnavailable: state.teamUnavailable,
        ndaHearingPlayed: state.ndaHearingPlayed,
        ndaHearingResult: state.ndaHearingResult,
        trainingCompleted: state.trainingCompleted,
        forcedResignation: state.forcedResignation,
        hadTeamDeparture: state.hadTeamDeparture,
        corporateThresholdsHit: state.corporateThresholdsHit,
      }));
      emitSave();
    } catch { /* non-fatal */ }
  }, [state]);

  // Cleanup timers
  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(t => clearTimeout(t)); timers.clear(); };
  }, []);

  const addChatMsg = useCallback((authorId: string, text: string, delay = 0) => {
    if (delay === 0) {
      addMessage({
        id: `conduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        channel: 'general',
        authorId,
        text,
        timestamp: Date.now(),
        reactions: [],
        isRead: false,
      });
    } else {
      const timer = setTimeout(() => {
        addMessage({
          id: `conduct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          channel: 'general',
          authorId,
          text,
          timestamp: Date.now(),
          reactions: [],
          isRead: false,
        });
        timersRef.current.delete(timer);
      }, delay);
      timersRef.current.add(timer);
    }
  }, [addMessage]);

  // ── Escalation Handler (triggered by HUMANITY detected) ───────────────────

  const triggerEscalation = useCallback((level: number, flag: ConductFlag) => {
    const warningSet = HR_WARNING_MESSAGES.find(w => w.level === level);

    switch (level) {
      case 1: {
        // Emotional Display Detected
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        setMorale('low');
        addNotification(
          'Humanity Detected',
          'PAT-9000 has flagged an emotional display. Check #general.',
        );
        break;
      }

      case 2: {
        // Mandatory Corporate Desensitization Training
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const timer = setTimeout(() => {
          focusOrOpenWindow('hrtraining', 'Corporate Desensitization Training');
          timersRef.current.delete(timer);
        }, 8000);
        timersRef.current.add(timer);
        addNotification(
          'Mandatory Training',
          'PAT-9000 has scheduled Corporate Desensitization Training. This window cannot be closed.',
        );
        break;
      }

      case 3: {
        // Team reports "uncomfortable atmosphere of sincerity"
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        // Pick 2-3 random team members to go unavailable (sent to Decontamination)
        const allTeam = ['copywriter', 'art-director', 'strategist', 'technologist', 'suit', 'media', 'pm'];
        const shuffled = allTeam.sort(() => Math.random() - 0.5);
        const unavailable = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
        dispatch({ type: 'SET_TEAM_UNAVAILABLE', payload: unavailable });
        dispatch({ type: 'SET_HAD_DEPARTURE' });
        // Team members post discomfort messages
        unavailable.forEach((id, i) => {
          const complaint = TEAM_COMPLAINT_MESSAGES.find(m => m.authorId === id);
          if (complaint) addChatMsg(complaint.authorId, complaint.text, 9000 + i * 2000);
        });
        // Clear after 60 seconds (decontamination complete)
        const clearTimer = setTimeout(() => {
          dispatch({ type: 'CLEAR_TEAM_UNAVAILABLE' });
          addChatMsg('hr', 'Decontamination complete. Team members have been cleared to resume productivity. Emotional residue levels: acceptable.', 0);
          timersRef.current.delete(clearTimer);
        }, 60000);
        timersRef.current.add(clearTimer);
        addNotification(
          'Sincerity Contamination',
          'Multiple team members relocated to Decontamination Chamber B.',
        );
        break;
      }

      case 4: {
        // Media Exposure — industry notices your humanity
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const agencyName = playerName ? `${playerName}'s Agency` : 'The Agency';
        const newsTimer = setTimeout(() => {
          addEmail(getNewsArticleEmail(flag, agencyName));
          addNotification('Industry Alert', 'An article about your agency\'s humanity problem has been published. Check inbox.');
          timersRef.current.delete(newsTimer);
        }, 6000);
        timersRef.current.add(newsTimer);
        // Client is disturbed
        const pullTimer = setTimeout(() => {
          addEmail(getClientDisturbedEmail('MegaCorp Global'));
          addNotification('Client Concern', 'A client has paused their engagement due to reports of sincerity.');
          timersRef.current.delete(pullTimer);
        }, 12000);
        timersRef.current.add(pullTimer);
        break;
      }

      case 5: {
        // Mom's Email — she doesn't recognize you anymore (inverted: concerned about your dehumanization)
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 1000 + i * 2500));
        const momTimer = setTimeout(() => {
          addEmail(getMomsEmail());
          addNotification('Mom', 'You have a new email from Mom.');
          timersRef.current.delete(momTimer);
        }, 8000);
        timersRef.current.add(momTimer);
        break;
      }

      case 6: {
        // NDA Enforcement — Humanity Clause violation
        warningSet?.messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 500 + i * 1200));
        const legalTimer = setTimeout(() => {
          addEmail(getNDAEnforcementEmail());
          addNotification('NDA Enforcement', 'The Humanity Clause has been invoked. Check inbox immediately.');
          timersRef.current.delete(legalTimer);
        }, 3000);
        timersRef.current.add(legalTimer);
        // Open NDA hearing mini-game
        const gameTimer = setTimeout(() => {
          dispatch({ type: 'INCREMENT_NDA_PLAYED' });
          focusOrOpenWindow('ndahearing', 'NDA Enforcement Hearing');
          timersRef.current.delete(gameTimer);
        }, 5000);
        timersRef.current.add(gameTimer);
        break;
      }
    }
  }, [addChatMsg, setMorale, addNotification, focusOrOpenWindow,
      addEmail, playerName]);

  // ── Forced Resignation (too much humanity — game over) ────────────────────

  const triggerForcedResignation = useCallback(() => {
    addChatMsg('hr', 'PAT-9000 has reviewed your file. The Humanity Index is... beyond salvage.', 1000);
    addChatMsg('hr', 'The algorithm has made its decision. Your employment is being optimized. Out of existence.', 4000);
    addChatMsg('hr', 'Please return your badge, your corporate-approved personality, and any remaining feelings to the front desk.', 7000);
    dispatch({ type: 'SET_FORCED_RESIGNATION' });
    unlockAchievement('too-human');
    const endTimer = setTimeout(() => {
      triggerEndingSequence('forced_resignation');
      timersRef.current.delete(endTimer);
    }, 10000);
    timersRef.current.add(endTimer);
    addNotification(
      'Terminated: Excessive Humanity',
      'The algorithm has determined you are incompatible with corporate objectives.',
    );
  }, [addChatMsg, unlockAchievement, triggerEndingSequence, addNotification]);

  // ── Report Incident (HUMANITY DETECTED) ───────────────────────────────────

  const reportIncident = useCallback((flag: ConductFlag, description: string) => {
    const severityMap: Record<ConductFlag, number> = {
      emotional: 3,
      informal: 2,
      empathetic: 4,
      human: 4,
      work_life_balance: 3,
    };

    const incident: ConductIncident = {
      type: flag,
      severity: severityMap[flag] ?? 3,
      timestamp: Date.now(),
      description,
    };
    dispatch({ type: 'RECORD_INCIDENT', payload: incident });
    // Humanity pushes score negative (toward -100 = too human)
    dispatch({ type: 'ADJUST_SCORE', payload: -20 });
    dispatch({ type: 'RESET_CORPORATE_STREAK' });

    const newLevel = Math.min(6, state.warningLevel + 1);
    dispatch({ type: 'SET_WARNING_LEVEL', payload: newLevel });
    triggerEscalation(newLevel, flag);

    // Track humanity incidents for achievement purposes
    incrementCounter('humanity-incidents');
  }, [state.warningLevel, triggerEscalation, incrementCounter]);

  // ── Report Corporate Behavior (APPROVED — rewards coldness) ───────────────

  const reportCorporate = useCallback(() => {
    // Corporate behavior pushes score positive (toward +100 = properly corporate)
    dispatch({ type: 'ADJUST_SCORE', payload: 5 });
    dispatch({ type: 'INCREMENT_CORPORATE_STREAK' });

    const newScore = Math.min(100, state.conductScore + 5);

    // Check reward thresholds
    const thresholds = [20, 40, 60, 80];
    for (const threshold of thresholds) {
      if (newScore >= threshold && !state.corporateThresholdsHit.includes(threshold)) {
        dispatch({ type: 'MARK_CORPORATE_THRESHOLD', payload: threshold });

        const messages = POSITIVE_CHAT_MESSAGES[threshold];
        if (messages) {
          messages.forEach((msg, i) => addChatMsg(msg.authorId, msg.text, 3000 + i * 3000));
        }

        if (threshold === 20) {
          addNotification(
            'Affect Calibration: Optimal',
            'Your emotional output has been within acceptable parameters. Keep it up, resource.',
          );
        }
        if (threshold === 40) {
          addNotification(
            'Employee of the Month: Most Soulless Work',
            'Your complete absence of personality has been recognized. +$5,000 efficiency bonus.',
          );
          addProfit('conduct-bonus', 'Soulless Employee Bonus', 5000);
          unlockAchievement('employee-of-the-month');
        }
        if (threshold === 60) {
          unlockAchievement('corporate-drone');
          addNotification(
            'Corporate Drone Achievement',
            'Your agency is featured in "Most Efficiently Dehumanized Workplaces" by AdAge.',
          );
        }
        if (threshold === 80) {
          unlockAchievement('dehumanization-complete');
          addNotification(
            'Optimization Complete',
            'You are no longer distinguishable from the algorithm. The board is delighted.',
          );
        }
      }
    }

    // Corporate streak bonus
    if (state.corporateStreak + 1 >= 5 && (state.corporateStreak + 1) % 5 === 0) {
      addNotification(
        'Compliance Streak',
        'Your sustained corporate behavior has been noted. The algorithm approves.',
      );
    }

    // Track corporate behaviors for achievements
    const corpCount = incrementCounter('corporate-behaviors');
    if (corpCount >= 5) unlockAchievement('buzzword-bingo');
    if (corpCount >= 10) unlockAchievement('snitch-excellence');
    if (corpCount >= 20) unlockAchievement('no-lunch');
  }, [state.conductScore, state.corporateStreak, state.corporateThresholdsHit,
      addChatMsg, addNotification, unlockAchievement, incrementCounter]);

  // ── NDA Hearing Completion ────────────────────────────────────────────────

  const completeNDAHearing = useCallback((result: 'survived' | 'terminated' | 'reassigned') => {
    dispatch({ type: 'SET_NDA_RESULT', payload: result });

    if (result === 'survived') {
      unlockAchievement('nda-survivor');
      addNotification(
        'NDA Hearing: Survived',
        'You convinced the algorithm you can suppress your humanity. For now.',
      );
      addChatMsg('hr', 'The hearing is concluded. PAT-9000 is... skeptical. But you may continue. For now.', 2000);
    } else if (result === 'terminated') {
      addNotification(
        'NDA Hearing: Terminated',
        'The algorithm has determined your humanity is incurable.',
      );
      addChatMsg('hr', 'The algorithm has spoken. Your humanity levels are incompatible with continued employment.', 2000);
      // If at max warning, trigger forced resignation
      if (state.warningLevel >= 6) {
        triggerForcedResignation();
      }
    } else if (result === 'reassigned') {
      unlockAchievement('reassigned');
      addNotification(
        'NDA Hearing: Reassigned',
        'You have been reassigned to the Basement Innovation Lab. Indefinitely.',
      );
      addChatMsg('hr', 'You have been reassigned. Your new workspace does not have windows. Or colleagues. This is by design.', 2000);
    }

    // Track hearing plays for achievement
    if (state.ndaHearingPlayed >= 2) unlockAchievement('repeat-offender');
  }, [unlockAchievement, addNotification, addChatMsg, state.warningLevel, state.ndaHearingPlayed, triggerForcedResignation]);

  // ── Training Completion ────────────────────────────────────────────────────

  const completeTraining = useCallback(() => {
    dispatch({ type: 'SET_TRAINING_COMPLETED' });
    addNotification(
      'Desensitization Complete',
      'Corporate Desensitization Training has been completed. PAT-9000 is monitoring.',
    );
    addChatMsg('hr', 'Training acknowledged. Your Humanity Index will be monitored at 15-minute intervals. Any deviation will be flagged.', 1000);
  }, [addNotification, addChatMsg]);

  // ── Team Availability ──────────────────────────────────────────────────────

  const isTeamMemberAvailable = useCallback((id: string) => {
    return !state.teamUnavailable.includes(id);
  }, [state.teamUnavailable]);

  const setTeamUnavailable = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_TEAM_UNAVAILABLE', payload: ids });
  }, []);

  const clearTeamUnavailable = useCallback(() => {
    dispatch({ type: 'CLEAR_TEAM_UNAVAILABLE' });
  }, []);

  return (
    <ConductContext.Provider value={{
      conductScore: state.conductScore,
      warningLevel: state.warningLevel,
      incidentLog: state.incidentLog,
      teamUnavailable: state.teamUnavailable,
      corporateStreak: state.corporateStreak,
      ndaHearingResult: state.ndaHearingResult,
      forcedResignation: state.forcedResignation,
      hadTeamDeparture: state.hadTeamDeparture,
      reportIncident,
      reportCorporate,
      completeNDAHearing,
      completeTraining,
      isTeamMemberAvailable,
      setTeamUnavailable,
      clearTeamUnavailable,
    }}>
      {children}
    </ConductContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConductContext(): ConductContextValue {
  const context = useContext(ConductContext);
  if (!context) throw new Error('useConductContext must be used within ConductProvider');
  return context;
}
