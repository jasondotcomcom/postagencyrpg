import React, { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import { useAchievementContext } from '../../../context/AchievementContext';
import { useChatContext } from '../../../context/ChatContext';
import { useWindowContext } from '../../../context/WindowContext';
import styles from './CalendarApp.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameResultMeta {
  customFlags?: string[];
}

interface CalSlot { day: number; slot: number; duration: number; title: string; color?: string }

interface CalMeeting {
  id: string;
  title: string;
  duration: number;
  color: string;
  constraint?: { days?: number[]; maxSlot?: number; minSlot?: number };
  trashable?: boolean;
  isSurprise?: boolean;
  untrashable?: boolean;
  isUrgent?: boolean;
  dependsOn?: string;
  conflictsWith?: string;
  isRecurring?: boolean;
  isLocked?: boolean;
  person?: string;
  trashPenalty?: number;
}

interface CalInterruption {
  id: string;
  trigger: { type: 'time'; atSeconds: number } | { type: 'placementCount'; count: number };
  message: string;
  emoji: string;
  effect:
    | { type: 'forcePlace'; meeting: CalMeeting; day: number; slot: number }
    | { type: 'reschedule'; meetingId: string; newConstraint: CalMeeting['constraint'] }
    | { type: 'removePerson'; person: string }
    | { type: 'addMeeting'; meeting: CalMeeting };
}

interface CalScenario {
  name: string;
  theme: string;
  prefilled: CalSlot[];
  queue: CalMeeting[];
  interruptions: CalInterruption[];
  dripSize: number;
  difficulty: 'normal' | 'hard' | 'chaos';
}

// ─── Game State ───────────────────────────────────────────────────────────────

interface GameState {
  grid: (string | null)[][];
  placedMeetings: Record<string, { day: number; slot: number }>;
  fullQueue: CalMeeting[];
  visibleQueue: CalMeeting[];
  dripIndex: number;
  trashedIds: string[];
  trashCount: number;
  totalTrashPenalty: number;
  timeLeft: number;
  timerSpeedMultiplier: number;
  chaosMode: boolean;
  firedInterruptions: string[];
  pendingInterruption: CalInterruption | null;
  conflictModal: {
    placingMeetingId: string;
    conflictsWithId: string;
    targetDay: number;
    targetSlot: number;
  } | null;
  delegateUsesLeft: number;
  reputation: number;
  grovelCount: number;
  dragId: string | null;
  invalidCells: { day: number; slot: number }[];
  noInvalidPlacements: boolean;
  placementCount: number;
  scenario: CalScenario;
  allMeetings: Record<string, CalMeeting>;
  recurringAllFive: boolean;
  interruptionFired: boolean;
}

type GameAction =
  | { type: 'PLACE_MEETING'; meetingId: string; day: number; slot: number }
  | { type: 'UNPLACE_MEETING'; meetingId: string }
  | { type: 'TRASH_MEETING'; meetingId: string }
  | { type: 'TICK_TIMER'; elapsedMs: number }
  | { type: 'DISMISS_INTERRUPTION' }
  | { type: 'RESOLVE_CONFLICT'; resolution: 'reschedule' | 'delegate' | 'decline' | 'grovel'; success?: boolean }
  | { type: 'SET_DRAG'; meetingId: string | null }
  | { type: 'CLEAR_INVALID_CELLS' };

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAYS = 5;
const SLOTS = 18;
const SLOT_H = 24;
const TIME_LABELS = ['9', '9:30', '10', '10:30', '11', '11:30', '12', '12:30', '1', '1:30', '2', '2:30', '3', '3:30', '4', '4:30', '5', '5:30'];
const GAME_DURATION = 120;
const STARTING_REP = 80;

// ─── Pure Helper Functions ────────────────────────────────────────────────────

function createGrid(prefilled: CalSlot[]): (string | null)[][] {
  const g: (string | null)[][] = Array.from({ length: DAYS }, () => Array(SLOTS).fill(null));
  for (const pf of prefilled) {
    for (let s = 0; s < pf.duration; s++) {
      if (pf.slot + s < SLOTS) g[pf.day][pf.slot + s] = `pf-${pf.title}`;
    }
  }
  return g;
}

function canPlace(meeting: CalMeeting, day: number, slot: number, state: GameState): boolean {
  if (slot + meeting.duration > SLOTS) return false;
  for (let s = 0; s < meeting.duration; s++) {
    if (state.grid[day][slot + s] !== null) return false;
  }
  if (meeting.constraint) {
    if (meeting.constraint.days && !meeting.constraint.days.includes(day)) return false;
    if (meeting.constraint.maxSlot !== undefined && slot > meeting.constraint.maxSlot) return false;
    if (meeting.constraint.minSlot !== undefined && slot < meeting.constraint.minSlot) return false;
  }
  if (meeting.dependsOn) {
    const depPos = state.placedMeetings[meeting.dependsOn];
    if (!depPos) return false;
    const depMeeting = state.allMeetings[meeting.dependsOn];
    if (!depMeeting) return false;
    const depEnd = depPos.day * SLOTS + depPos.slot + depMeeting.duration;
    const meetingStart = day * SLOTS + slot;
    if (meetingStart < depEnd) return false;
  }
  return true;
}

function placeMeetingInState(state: GameState, meetingId: string, day: number, slot: number): GameState {
  const meeting = state.allMeetings[meetingId];
  if (!meeting) return state;
  const newGrid = state.grid.map(d => [...d]);
  for (let s = 0; s < meeting.duration; s++) {
    newGrid[day][slot + s] = meetingId;
  }
  return {
    ...state,
    grid: newGrid,
    placedMeetings: { ...state.placedMeetings, [meetingId]: { day, slot } },
    visibleQueue: state.visibleQueue.filter(m => m.id !== meetingId),
  };
}

function unplaceMeeting(state: GameState, meetingId: string): GameState {
  const pos = state.placedMeetings[meetingId];
  if (!pos) return state;
  const meeting = state.allMeetings[meetingId];
  if (!meeting || meeting.isLocked) return state;
  const newGrid = state.grid.map(d => [...d]);
  for (let s = 0; s < meeting.duration; s++) {
    if (pos.slot + s < SLOTS && newGrid[pos.day][pos.slot + s] === meetingId) {
      newGrid[pos.day][pos.slot + s] = null;
    }
  }
  const newPlaced = { ...state.placedMeetings };
  delete newPlaced[meetingId];
  return {
    ...state,
    grid: newGrid,
    placedMeetings: newPlaced,
    visibleQueue: [...state.visibleQueue, meeting],
  };
}

function applyInterruptionEffect(state: GameState, effect: CalInterruption['effect']): GameState {
  switch (effect.type) {
    case 'forcePlace': {
      const newGrid = state.grid.map(d => [...d]);
      const displaced: string[] = [];
      for (let s = 0; s < effect.meeting.duration; s++) {
        const existing = newGrid[effect.day][effect.slot + s];
        if (existing && !existing.startsWith('pf-') && !displaced.includes(existing)) {
          displaced.push(existing);
        }
      }
      let newPlaced = { ...state.placedMeetings };
      const newVisible = [...state.visibleQueue];
      for (const id of displaced) {
        const m = state.allMeetings[id];
        if (m) {
          const pos = newPlaced[id];
          if (pos) {
            for (let s = 0; s < m.duration; s++) {
              if (newGrid[pos.day][pos.slot + s] === id) {
                newGrid[pos.day][pos.slot + s] = null;
              }
            }
          }
          delete newPlaced[id];
          newVisible.push(m);
        }
      }
      for (let s = 0; s < effect.meeting.duration; s++) {
        newGrid[effect.day][effect.slot + s] = effect.meeting.id;
      }
      newPlaced[effect.meeting.id] = { day: effect.day, slot: effect.slot };
      return {
        ...state,
        grid: newGrid,
        placedMeetings: newPlaced,
        visibleQueue: newVisible,
        allMeetings: { ...state.allMeetings, [effect.meeting.id]: effect.meeting },
      };
    }
    case 'reschedule': {
      const meeting = state.allMeetings[effect.meetingId];
      if (!meeting) return state;
      const updated = { ...meeting, constraint: effect.newConstraint };
      const newAll = { ...state.allMeetings, [effect.meetingId]: updated };
      const pos = state.placedMeetings[effect.meetingId];
      if (pos) {
        const newGrid = state.grid.map(d => [...d]);
        for (let s = 0; s < meeting.duration; s++) {
          if (newGrid[pos.day][pos.slot + s] === effect.meetingId) {
            newGrid[pos.day][pos.slot + s] = null;
          }
        }
        const newPlaced = { ...state.placedMeetings };
        delete newPlaced[effect.meetingId];
        return { ...state, grid: newGrid, placedMeetings: newPlaced, visibleQueue: [...state.visibleQueue, updated], allMeetings: newAll };
      }
      return {
        ...state,
        visibleQueue: state.visibleQueue.map(m => m.id === effect.meetingId ? updated : m),
        fullQueue: state.fullQueue.map(m => m.id === effect.meetingId ? updated : m),
        allMeetings: newAll,
      };
    }
    case 'removePerson': {
      const newGrid = state.grid.map(d => [...d]);
      const newPlaced = { ...state.placedMeetings };
      const newVisible = [...state.visibleQueue];
      for (const [id, meeting] of Object.entries(state.allMeetings)) {
        if (meeting.person === effect.person && newPlaced[id]) {
          const pos = newPlaced[id];
          for (let s = 0; s < meeting.duration; s++) {
            if (newGrid[pos.day][pos.slot + s] === id) {
              newGrid[pos.day][pos.slot + s] = null;
            }
          }
          delete newPlaced[id];
          newVisible.push(meeting);
        }
      }
      return { ...state, grid: newGrid, placedMeetings: newPlaced, visibleQueue: newVisible };
    }
    case 'addMeeting': {
      return {
        ...state,
        visibleQueue: [...state.visibleQueue, effect.meeting],
        allMeetings: { ...state.allMeetings, [effect.meeting.id]: effect.meeting },
      };
    }
  }
}

function resolveConflict(
  state: GameState,
  resolution: 'reschedule' | 'delegate' | 'decline' | 'grovel',
  success?: boolean,
): GameState {
  if (!state.conflictModal) return state;
  const { placingMeetingId, targetDay, targetSlot } = state.conflictModal;
  let s = { ...state, conflictModal: null as GameState['conflictModal'], timerSpeedMultiplier: 1 };

  switch (resolution) {
    case 'reschedule':
      if (success) {
        s = placeMeetingInState(s, placingMeetingId, targetDay, targetSlot);
      } else {
        s = { ...s, reputation: s.reputation - 5 };
      }
      break;
    case 'delegate':
      s = placeMeetingInState(s, placingMeetingId, targetDay, targetSlot);
      s = { ...s, delegateUsesLeft: s.delegateUsesLeft - 1 };
      break;
    case 'decline':
      s = {
        ...s,
        visibleQueue: s.visibleQueue.filter(m => m.id !== placingMeetingId),
        trashedIds: [...s.trashedIds, placingMeetingId],
        trashCount: s.trashCount + 1,
        reputation: s.reputation - 10,
      };
      break;
    case 'grovel':
      s = placeMeetingInState(s, placingMeetingId, targetDay, targetSlot);
      s = { ...s, timeLeft: Math.max(0, s.timeLeft - 8), reputation: s.reputation - 3, grovelCount: s.grovelCount + 1 };
      break;
  }
  return dripNext(s, getDripCount(s));
}

function expandRecurring(state: GameState, meeting: CalMeeting, targetSlot: number): GameState {
  let newGrid = state.grid.map(d => [...d]);
  let newPlaced = { ...state.placedMeetings };
  let newVisible = state.visibleQueue.filter(m => m.id !== meeting.id);
  const newAll = { ...state.allMeetings };
  let allFivePlaced = true;

  for (let day = 0; day < DAYS; day++) {
    const dayId = `${meeting.id}-d${day}`;
    const dayMeeting: CalMeeting = {
      ...meeting,
      id: dayId,
      isRecurring: false,
      title: `${meeting.title} (${DAY_LABELS[day]})`,
      constraint: { ...(meeting.constraint || {}), days: [day] },
    };
    newAll[dayId] = dayMeeting;

    const tempState: GameState = { ...state, grid: newGrid, placedMeetings: newPlaced, allMeetings: newAll };
    if (canPlace(dayMeeting, day, targetSlot, tempState)) {
      for (let s = 0; s < meeting.duration; s++) {
        newGrid[day][targetSlot + s] = dayId;
      }
      newPlaced[dayId] = { day, slot: targetSlot };
    } else {
      allFivePlaced = false;
      newVisible.push(dayMeeting);
    }
  }

  return {
    ...state,
    grid: newGrid,
    placedMeetings: newPlaced,
    visibleQueue: newVisible,
    allMeetings: newAll,
    recurringAllFive: state.recurringAllFive || allFivePlaced,
  };
}

function dripNext(state: GameState, count: number): GameState {
  let { dripIndex } = state;
  const newVisible = [...state.visibleQueue];

  for (let i = 0; i < count && dripIndex < state.fullQueue.length; i++) {
    const next = state.fullQueue[dripIndex];
    if (!newVisible.find(m => m.id === next.id) && !state.placedMeetings[next.id] && !state.trashedIds.includes(next.id)) {
      newVisible.push(next);
    }
    dripIndex++;
  }

  return { ...state, visibleQueue: newVisible, dripIndex };
}

function getDripCount(state: GameState): number {
  if (state.chaosMode) return 999;
  if (state.timeLeft <= 40) return 2;
  return 1;
}

function calculateScore(state: GameState): number {
  let score = state.reputation;
  if (state.noInvalidPlacements) score += 10;
  if (checkWinCondition(state)) score += 10;
  score += Math.floor(state.timeLeft / 10);
  return Math.max(0, Math.min(100, score));
}

function checkWinCondition(state: GameState): boolean {
  if (state.visibleQueue.length > 0) return false;
  if (state.dripIndex < state.fullQueue.length) return false;
  if (state.pendingInterruption) return false;
  for (const int of state.scenario.interruptions) {
    if (int.effect.type === 'addMeeting' && !state.firedInterruptions.includes(int.id)) {
      return false;
    }
  }
  return true;
}

function getGrovelText(count: number): string {
  const texts = [
    "I deeply apologize for this scheduling irregularity, Overseer...",
    "Please don't flag this on my permanent record...",
    "I acknowledge my time-management deficiency and submit to correction...",
    "I will voluntarily attend an extra Behavioral Compliance Module as penance.",
    "At this point my Productivity Score is beyond salvage. I accept my fate.",
  ];
  return texts[Math.min(count, texts.length - 1)];
}

function enterChaosMode(state: GameState): GameState {
  const newVisible = [...state.visibleQueue];
  const remaining = state.fullQueue.slice(state.dripIndex);
  for (const m of remaining) {
    if (!newVisible.find(v => v.id === m.id) && !state.placedMeetings[m.id] && !state.trashedIds.includes(m.id)) {
      newVisible.push(m);
    }
  }
  newVisible.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return 0;
  });
  return { ...state, chaosMode: true, visibleQueue: newVisible, dripIndex: state.fullQueue.length };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_MEETING': {
      const meeting = state.visibleQueue.find(m => m.id === action.meetingId);
      if (!meeting) return state;

      if (!canPlace(meeting, action.day, action.slot, state)) {
        const cells: { day: number; slot: number }[] = [];
        for (let s = 0; s < meeting.duration; s++) {
          if (action.slot + s < SLOTS) cells.push({ day: action.day, slot: action.slot + s });
        }
        return { ...state, invalidCells: cells, noInvalidPlacements: false };
      }

      // Conflict check
      if (meeting.conflictsWith && state.placedMeetings[meeting.conflictsWith]) {
        return {
          ...state,
          conflictModal: {
            placingMeetingId: meeting.id,
            conflictsWithId: meeting.conflictsWith,
            targetDay: action.day,
            targetSlot: action.slot,
          },
          timerSpeedMultiplier: 0.5,
          dragId: null,
        };
      }

      // Recurring expansion
      if (meeting.isRecurring) {
        let ns = expandRecurring(state, meeting, action.slot);
        ns = dripNext(ns, getDripCount(ns));
        ns = { ...ns, placementCount: ns.placementCount + 1 };
        return checkPlacementInterruptions(ns);
      }

      // Normal placement
      let ns = placeMeetingInState(state, meeting.id, action.day, action.slot);
      ns = dripNext(ns, getDripCount(ns));
      ns = { ...ns, placementCount: ns.placementCount + 1 };
      return checkPlacementInterruptions(ns);
    }

    case 'UNPLACE_MEETING': {
      const pos = state.placedMeetings[action.meetingId];
      if (!pos) return state;
      const meeting = state.allMeetings[action.meetingId];
      if (!meeting || meeting.isLocked) return state;
      if (action.meetingId.startsWith('pf-')) return state;
      return unplaceMeeting(state, action.meetingId);
    }

    case 'TRASH_MEETING': {
      const meeting = state.visibleQueue.find(m => m.id === action.meetingId);
      if (!meeting) return state;
      if (meeting.untrashable) return state; // UI handles shake

      const penalty = meeting.trashPenalty ?? 5;
      let ns: GameState = {
        ...state,
        visibleQueue: state.visibleQueue.filter(m => m.id !== action.meetingId),
        trashedIds: [...state.trashedIds, action.meetingId],
        trashCount: state.trashCount + 1,
        totalTrashPenalty: state.totalTrashPenalty + penalty,
        timeLeft: Math.max(0, state.timeLeft - penalty),
        reputation: state.reputation - 2,
      };
      ns = dripNext(ns, getDripCount(ns));
      return ns;
    }

    case 'TICK_TIMER': {
      const effectiveMs = action.elapsedMs * state.timerSpeedMultiplier;
      const newTimeLeft = Math.max(0, state.timeLeft - effectiveMs / 1000);
      let ns: GameState = { ...state, timeLeft: newTimeLeft };

      // Chaos mode at 20s remaining
      if (!state.chaosMode && newTimeLeft <= 20) {
        ns = enterChaosMode(ns);
      }

      // Time-based interruptions
      if (!ns.pendingInterruption) {
        for (const int of ns.scenario.interruptions) {
          if (ns.firedInterruptions.includes(int.id)) continue;
          if (int.trigger.type === 'time' && newTimeLeft <= int.trigger.atSeconds) {
            ns = {
              ...ns,
              pendingInterruption: int,
              firedInterruptions: [...ns.firedInterruptions, int.id],
              interruptionFired: true,
            };
            break;
          }
        }
      }

      return ns;
    }

    case 'DISMISS_INTERRUPTION': {
      if (!state.pendingInterruption) return state;
      const effect = state.pendingInterruption.effect;
      return applyInterruptionEffect({ ...state, pendingInterruption: null }, effect);
    }

    case 'RESOLVE_CONFLICT': {
      return resolveConflict(state, action.resolution, action.success);
    }

    case 'SET_DRAG': {
      return { ...state, dragId: action.meetingId };
    }

    case 'CLEAR_INVALID_CELLS': {
      return { ...state, invalidCells: [] };
    }

    default:
      return state;
  }
}

function checkPlacementInterruptions(state: GameState): GameState {
  if (state.pendingInterruption) return state;
  for (const int of state.scenario.interruptions) {
    if (state.firedInterruptions.includes(int.id)) continue;
    if (int.trigger.type === 'placementCount' && state.placementCount >= int.trigger.count) {
      return {
        ...state,
        pendingInterruption: int,
        firedInterruptions: [...state.firedInterruptions, int.id],
        interruptionFired: true,
      };
    }
  }
  return state;
}

// ─── Initial State ────────────────────────────────────────────────────────────

function createInitialState(scenario: CalScenario): GameState {
  const allMeetings: Record<string, CalMeeting> = {};
  for (const m of scenario.queue) allMeetings[m.id] = m;

  return {
    grid: createGrid(scenario.prefilled),
    placedMeetings: {},
    fullQueue: scenario.queue,
    visibleQueue: scenario.queue.slice(0, scenario.dripSize),
    dripIndex: scenario.dripSize,
    trashedIds: [],
    trashCount: 0,
    totalTrashPenalty: 0,
    timeLeft: GAME_DURATION,
    timerSpeedMultiplier: 1,
    chaosMode: false,
    firedInterruptions: [],
    pendingInterruption: null,
    conflictModal: null,
    delegateUsesLeft: 2,
    reputation: STARTING_REP,
    grovelCount: 0,
    dragId: null,
    invalidCells: [],
    noInvalidPlacements: true,
    placementCount: 0,
    scenario,
    allMeetings,
    recurringAllFive: false,
    interruptionFired: false,
  };
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const scenarios: CalScenario[] = [
  {
    name: 'Monday Dread',
    theme: 'Your compliance schedule is packed with mandatory engagements. Organize before the Overseer notices.',
    difficulty: 'normal',
    dripSize: 4,
    prefilled: [
      { day: 0, slot: 2, duration: 4, title: 'Productivity Optimization Review', color: '#7f8c8d' },
      { day: 2, slot: 6, duration: 2, title: 'Sanctioned Nutrition Break w/ Revenue Unit', color: '#7f8c8d' },
      { day: 4, slot: 14, duration: 4, title: 'Weekly Compliance Summary', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-standup', title: 'Mandatory Alignment Session', duration: 1, color: '#3498db', isRecurring: true, constraint: { maxSlot: 1 } },
      { id: 'cal-client', title: 'Revenue Unit Interface', duration: 2, color: '#5b8def', constraint: { days: [0, 2] }, untrashable: true },
      { id: 'cal-1on1-taylor', title: 'Performance Surveillance Check-in (Taylor)', duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 }, person: 'Taylor' },
      { id: 'cal-focus', title: 'Sanctioned Independent Labor Block', duration: 4, color: '#27ae60' },
      { id: 'cal-creative', title: 'Creative Output Audit', duration: 2, color: '#e67e22' },
      { id: 'cal-design', title: 'Visual Compliance Review', duration: 2, color: '#e74c3c' },
      { id: 'cal-prep', title: 'Pre-Evaluation Preparation Window', duration: 2, color: '#2ecc71' },
      { id: 'cal-pitch', title: 'Revenue Extraction Proposal', duration: 3, color: '#f39c12', dependsOn: 'cal-prep', conflictsWith: 'cal-vendor' },
      { id: 'cal-vendor', title: 'Vendor Dependency Demonstration', duration: 2, color: '#1abc9c', constraint: { days: [1, 3] }, conflictsWith: 'cal-pitch' },
      { id: 'cal-sync', title: 'Collective Synchronization Ritual', duration: 1, color: '#34495e' },
      { id: 'cal-budget', title: 'Cost Reduction Theater', duration: 2, color: '#c0392b', untrashable: true },
      { id: 'cal-email', title: 'Mandatory Status Transparency Report', duration: 1, color: '#95a5a6', trashable: true, trashPenalty: 3 },
      { id: 'cal-catchup', title: 'Informal Surveillance Debrief', duration: 1, color: '#bdc3c7', trashable: true, trashPenalty: 3 },
      { id: 'cal-onboard', title: 'Replacement Candidate Assessment', duration: 1, color: '#8e44ad' },
    ],
    interruptions: [
      {
        id: 'int-taylor-sick',
        trigger: { type: 'time', atSeconds: 40 },
        message: "Taylor has been flagged for unauthorized absence. All Taylor engagements require reassignment.",
        emoji: '🔴',
        effect: { type: 'removePerson', person: 'Taylor' },
      },
    ],
  },
  {
    name: 'Week of Compliance',
    theme: 'Mandatory presentation Friday. You need labor blocks but the Oversight Committee demands meetings.',
    difficulty: 'hard',
    dripSize: 3,
    prefilled: [
      { day: 2, slot: 0, duration: 4, title: 'Mandatory Progress Disclosure', color: '#7f8c8d' },
      { day: 4, slot: 0, duration: 6, title: 'Revenue Unit Presentation', color: '#7f8c8d' },
      { day: 0, slot: 6, duration: 2, title: 'Sanctioned Nutrition Break (Group)', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-standup-dl', title: 'Mandatory Alignment Session', duration: 1, color: '#3498db', isRecurring: true, constraint: { maxSlot: 1 } },
      { id: 'cal-focus-dl', title: 'Deep Sanctioned Labor Block', duration: 6, color: '#27ae60' },
      { id: 'cal-vendor-dl', title: 'Vendor Dependency Demonstration', duration: 2, color: '#3498db', conflictsWith: 'cal-review-dl' },
      { id: 'cal-1on1a-dl', title: 'Performance Surveillance Check-in (Morgan)', duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 }, person: 'Morgan' },
      { id: 'cal-1on1b-dl', title: 'Performance Surveillance Check-in (Charlie)', duration: 1, color: '#8e44ad', constraint: { maxSlot: 5 } },
      { id: 'cal-review-dl', title: 'Deliverable Inspection Session', duration: 2, color: '#e74c3c', constraint: { days: [2, 3] }, conflictsWith: 'cal-vendor-dl' },
      { id: 'cal-email-dl', title: 'Weekly Accountability Recap', duration: 1, color: '#95a5a6', trashable: true, trashPenalty: 3 },
      { id: 'cal-sync-dl', title: 'Redundant Synchronization Ritual', duration: 1, color: '#bdc3c7', trashable: true, trashPenalty: 3 },
      { id: 'cal-client-dl', title: 'Revenue Unit Interface', duration: 2, color: '#5b8def', constraint: { days: [0, 1] }, untrashable: true },
      { id: 'cal-prep-dl', title: 'Presentation Compliance Preparation', duration: 3, color: '#2ecc71' },
      { id: 'cal-pitch-dl', title: 'Capital Extraction Pitch', duration: 3, color: '#f39c12', dependsOn: 'cal-prep-dl', conflictsWith: 'cal-allhands-dl' },
      { id: 'cal-allhands-dl', title: 'Mandatory Morale Injection', duration: 2, color: '#e67e22', constraint: { days: [3] }, conflictsWith: 'cal-pitch-dl' },
      { id: 'cal-design-dl', title: 'Creative Output Audit', duration: 2, color: '#e74c3c' },
      { id: 'cal-budget-dl', title: 'Cost Reduction Theater', duration: 2, color: '#c0392b', untrashable: true },
      { id: 'cal-coffee-dl', title: 'Mandatory Casual Interaction', duration: 1, color: '#795548', trashable: true, trashPenalty: 2 },
    ],
    interruptions: [
      {
        id: 'int-ceo-allhands',
        trigger: { type: 'time', atSeconds: 50 },
        message: "The Algorithm has reassigned your time. Mandatory Morale Injection Thursday 2pm. Resistance is documented.",
        emoji: '🤖',
        effect: {
          type: 'forcePlace',
          meeting: { id: 'cal-ceo-forced', title: 'Mandatory Morale Injection (Supreme)', duration: 4, color: '#c0392b', isLocked: true, isUrgent: true },
          day: 3,
          slot: 10,
        },
      },
      {
        id: 'int-client-reschedule',
        trigger: { type: 'time', atSeconds: 30 },
        message: "Revenue Unit demands interface relocation to Wednesday morning. Your preferences are irrelevant.",
        emoji: '📡',
        effect: { type: 'reschedule', meetingId: 'cal-client-dl', newConstraint: { days: [2], maxSlot: 5 } },
      },
    ],
  },
  {
    name: 'The Gauntlet',
    theme: 'Your schedule resembles a prison yard rotation. Find a way to survive the week.',
    difficulty: 'hard',
    dripSize: 3,
    prefilled: [
      { day: 0, slot: 4, duration: 4, title: 'Blame Distribution Meeting', color: '#7f8c8d' },
      { day: 2, slot: 8, duration: 4, title: 'Visual Compliance Review', color: '#7f8c8d' },
      { day: 4, slot: 2, duration: 2, title: 'Board Oversight Tribunal', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-standup-bb', title: 'Mandatory Alignment Session', duration: 1, color: '#3498db', isRecurring: true, constraint: { maxSlot: 1 } },
      { id: 'cal-checkin-bb', title: 'Weekly Compliance Verification', duration: 2, color: '#1abc9c', isRecurring: true, constraint: { maxSlot: 5 } },
      { id: 'cal-client-bb', title: 'Revenue Unit Interface', duration: 2, color: '#5b8def', untrashable: true },
      { id: 'cal-1on1a-bb', title: 'Performance Surveillance Check-in (Taylor)', duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 }, person: 'Taylor' },
      { id: 'cal-1on1b-bb', title: 'Performance Surveillance Check-in (Sam)', duration: 1, color: '#8e44ad', constraint: { maxSlot: 5 } },
      { id: 'cal-focus-bb', title: 'Sanctioned Independent Labor Block', duration: 4, color: '#27ae60' },
      { id: 'cal-prep-bb', title: 'Pre-Evaluation Preparation Window', duration: 2, color: '#2ecc71', constraint: { days: [3, 4] } },
      { id: 'cal-pitch-bb', title: 'Terminal Revenue Proposal', duration: 3, color: '#f39c12', dependsOn: 'cal-prep-bb', conflictsWith: 'cal-vendor-bb' },
      { id: 'cal-vendor-bb', title: 'Vendor Dependency Pitch', duration: 2, color: '#3498db', constraint: { days: [1, 3] }, conflictsWith: 'cal-pitch-bb' },
      { id: 'cal-creative-bb', title: 'Ideation Compliance Workshop', duration: 3, color: '#e74c3c' },
      { id: 'cal-strategy-bb', title: 'Strategic Obedience Session', duration: 2, color: '#f1c40f', dependsOn: 'cal-creative-bb' },
      { id: 'cal-allhands-bb', title: 'Mandatory Morale Injection', duration: 2, color: '#e67e22', constraint: { days: [1] }, conflictsWith: 'cal-vendor-bb' },
      { id: 'cal-email-bb', title: 'Pointless Synchronization Ritual', duration: 1, color: '#95a5a6', trashable: true, trashPenalty: 3 },
      { id: 'cal-email2-bb', title: 'Mandatory Status Transparency Report', duration: 1, color: '#bdc3c7', trashable: true, trashPenalty: 3 },
      { id: 'cal-budget-bb', title: 'Cost Reduction Theater', duration: 2, color: '#c0392b', untrashable: true },
      { id: 'cal-onboard-bb', title: 'Replacement Candidate Assessment', duration: 1, color: '#8e44ad' },
    ],
    interruptions: [
      {
        id: 'int-taylor-sick-bb',
        trigger: { type: 'time', atSeconds: 60 },
        message: "Taylor has been flagged for unauthorized absence. All Taylor engagements require reassignment.",
        emoji: '🔴',
        effect: { type: 'removePerson', person: 'Taylor' },
      },
      {
        id: 'int-ceo-bb',
        trigger: { type: 'time', atSeconds: 40 },
        message: "The Algorithm has reassigned your time. Mandatory session Wednesday afternoon. Compliance is not optional.",
        emoji: '🤖',
        effect: {
          type: 'forcePlace',
          meeting: { id: 'cal-ceo-bb', title: 'Algorithmic Directive Briefing', duration: 3, color: '#c0392b', isLocked: true, isUrgent: true },
          day: 2,
          slot: 12,
        },
      },
      {
        id: 'int-server-down',
        trigger: { type: 'time', atSeconds: 20 },
        message: "MANDATORY CRISIS THEATER: Infrastructure failure detected. Emergency engagement required NOW.",
        emoji: '🚨',
        effect: {
          type: 'addMeeting',
          meeting: { id: 'cal-emergency-bb', title: 'Mandatory Crisis Theater', duration: 2, color: '#e74c3c', isUrgent: true, untrashable: true },
        },
      },
    ],
  },
  {
    name: 'Open Office Nightmare',
    theme: 'Every available minute has been claimed by the system. Escape is not an option.',
    difficulty: 'chaos',
    dripSize: 3,
    prefilled: [
      { day: 1, slot: 0, duration: 4, title: 'Behavioral Compliance Module', color: '#7f8c8d' },
      { day: 3, slot: 6, duration: 4, title: 'Cross-Functional Accountability Circle', color: '#7f8c8d' },
      { day: 0, slot: 10, duration: 2, title: 'Wellness Surveillance Check', color: '#7f8c8d' },
    ],
    queue: [
      { id: 'cal-standup-on', title: 'Mandatory Alignment Session', duration: 1, color: '#3498db', isRecurring: true, constraint: { maxSlot: 1 } },
      { id: 'cal-client-on', title: 'Revenue Unit Interface', duration: 2, color: '#5b8def', untrashable: true },
      { id: 'cal-1on1a-on', title: 'Performance Surveillance Check-in (Jordan)', duration: 1, color: '#9b59b6', constraint: { maxSlot: 5 }, person: 'Jordan' },
      { id: 'cal-1on1b-on', title: 'Performance Surveillance Check-in (Alex)', duration: 1, color: '#8e44ad', constraint: { maxSlot: 5 } },
      { id: 'cal-focus-on', title: 'Sanctioned Independent Labor Block', duration: 4, color: '#27ae60' },
      { id: 'cal-retro-on', title: 'Blame Distribution Meeting', duration: 2, color: '#e67e22' },
      { id: 'cal-design-on', title: 'Creative Output Audit', duration: 2, color: '#e74c3c', conflictsWith: 'cal-strategy-on' },
      { id: 'cal-strategy-on', title: 'Strategic Obedience Session', duration: 3, color: '#f1c40f', conflictsWith: 'cal-design-on' },
      { id: 'cal-budget-on', title: 'Cost Reduction Theater', duration: 2, color: '#c0392b', untrashable: true },
      { id: 'cal-lunch-on', title: 'Sanctioned Nutrition Break', duration: 2, color: '#795548', constraint: { minSlot: 6, maxSlot: 8 } },
      { id: 'cal-prep-on', title: 'Pre-Evaluation Preparation Window', duration: 2, color: '#2ecc71', constraint: { days: [2, 4] } },
      { id: 'cal-pitch-on', title: 'Revenue Extraction Proposal', duration: 3, color: '#f39c12', dependsOn: 'cal-prep-on' },
      { id: 'cal-email-on', title: 'Mandatory Status Transparency Report', duration: 1, color: '#95a5a6', trashable: true, trashPenalty: 3 },
      { id: 'cal-sync-on', title: 'Redundant Synchronization Ritual', duration: 1, color: '#bdc3c7', trashable: true, trashPenalty: 3 },
      { id: 'cal-onboard-on', title: 'Replacement Candidate Assessment', duration: 1, color: '#8e44ad' },
      { id: 'cal-allhands-on', title: 'Mandatory Morale Injection', duration: 2, color: '#e67e22', constraint: { days: [4] } },
    ],
    interruptions: [
      {
        id: 'int-jordan-flagged',
        trigger: { type: 'time', atSeconds: 60 },
        message: "Jordan has been reassigned to another division. All Jordan engagements require redistribution.",
        emoji: '🔴',
        effect: { type: 'removePerson', person: 'Jordan' },
      },
      {
        id: 'int-algo-override',
        trigger: { type: 'time', atSeconds: 35 },
        message: "The Algorithm has reassigned your time. Mandatory directive Tuesday afternoon. You have no say.",
        emoji: '🤖',
        effect: {
          type: 'forcePlace',
          meeting: { id: 'cal-algo-on', title: 'Algorithmic Override Session', duration: 4, color: '#c0392b', isLocked: true, isUrgent: true },
          day: 1,
          slot: 10,
        },
      },
      {
        id: 'int-crisis-theater',
        trigger: { type: 'time', atSeconds: 15 },
        message: "MANDATORY CRISIS THEATER: A situation has been manufactured. Your attendance is compulsory.",
        emoji: '🚨',
        effect: {
          type: 'addMeeting',
          meeting: { id: 'cal-crisis-on', title: 'Mandatory Crisis Theater', duration: 2, color: '#e74c3c', isUrgent: true, untrashable: true },
        },
      },
    ],
  },
];

function pickScenario(): CalScenario {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// ─── Calendar App ─────────────────────────────────────────────────────────────

export default function CalendarApp() {
  const { unlockAchievement } = useAchievementContext();
  const { setMorale } = useChatContext();
  const { addNotification } = useWindowContext();

  const [phase, setPhase] = useState<'messy' | 'playing' | 'solved' | 'failed'>('messy');
  const [scenario, setScenario] = useState<CalScenario>(() => pickScenario());
  const [solvedPlacements, setSolvedPlacements] = useState<Map<string, { day: number; slot: number }>>(new Map());
  const [lastScore, setLastScore] = useState<number | null>(null);

  const startGame = useCallback(() => {
    setScenario(pickScenario());
    setPhase('playing');
  }, []);

  const handleWin = useCallback((_grid: (string | null)[][], _placements: Map<string, { day: number; slot: number }>, meta?: GameResultMeta) => {
    setPhase('solved');
    setMorale('high');
    addNotification('Your calendar has been optimized.', 'All time is now accounted for. The Algorithm is satisfied.');
    unlockAchievement('calendar-master');

    if (meta?.customFlags) {
      if (meta.customFlags.includes('no-invalid')) unlockAchievement('calendar-tetris');
      if (meta.customFlags.includes('focus-placed')) unlockAchievement('protected-my-peace');
      if (meta.customFlags.includes('trashed-email')) unlockAchievement('that-was-an-email');
      if (meta.customFlags.includes('schedule-survivor')) unlockAchievement('schedule-survivor');
      if (meta.customFlags.includes('master-groveler')) unlockAchievement('master-groveler');
      if (meta.customFlags.includes('delegation-king')) unlockAchievement('delegation-king');
      if (meta.customFlags.includes('chaos-calendar')) unlockAchievement('chaos-calendar');
      if (meta.customFlags.includes('zero-trash')) unlockAchievement('zero-trash');
      if (meta.customFlags.includes('recurring-champion')) unlockAchievement('recurring-champion');

      const scoreFlag = meta.customFlags.find(f => f.startsWith('score:'));
      if (scoreFlag) setLastScore(parseInt(scoreFlag.split(':')[1]));
    }
  }, [setMorale, addNotification, unlockAchievement]);

  const handleFail = useCallback((meta?: GameResultMeta) => {
    setPhase('failed');
    if (meta?.customFlags) {
      const scoreFlag = meta.customFlags.find(f => f.startsWith('score:'));
      if (scoreFlag) setLastScore(parseInt(scoreFlag.split(':')[1]));
    }
  }, []);

  if (phase === 'playing') {
    return (
      <div className={styles.container}>
        <CalendarShuffleEnhanced
          scenario={scenario}
          onWin={(_grid, placements, meta) => {
            setSolvedPlacements(placements);
            handleWin(_grid, placements, meta);
          }}
          onFail={handleFail}
        />
      </div>
    );
  }

  if (phase === 'solved') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>This Week's Mandate</div>
          <div className={styles.headerStatus}>
            <span className={styles.statusBadge}>Compliant</span>
            {lastScore !== null && (
              <span className={styles.statusBadge} style={{ marginLeft: 6 }}>Compliance Score: {lastScore}</span>
            )}
          </div>
          <button className={styles.reshuffleBtn} onClick={startGame}>
            Reassign Week
          </button>
        </div>
        <SolvedCalendarView scenario={scenario} placements={solvedPlacements} />
      </div>
    );
  }

  // Messy or failed state
  const meetingCount = scenario.queue.length;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>This Week's Mandate</div>
        <div className={styles.headerStatus}>
          {phase === 'failed' ? (
            <span className={styles.statusBadgeFail}>
              Scheduling failure detected. This has been documented.
              {lastScore !== null && ` | Compliance Score: ${lastScore}`}
            </span>
          ) : (
            <span className={styles.statusBadgeMessy}>NON-COMPLIANT | {meetingCount} mandatory engagements</span>
          )}
        </div>
      </div>
      <div className={styles.messyView}>
        <MessyCalendarPreview scenario={scenario} />
        <div className={styles.messyCta}>
          <div className={styles.messyEmoji}>
            {phase === 'failed' ? '📋' : '⚠️'}
          </div>
          <div className={styles.messyTitle}>
            {phase === 'failed' ? 'Your non-compliance has been noted.' : scenario.theme}
          </div>
          <div className={styles.messySub}>
            Drag mandatory engagements into time slots. Discard at your own risk.
            {scenario.difficulty === 'hard' && ' (Elevated Compliance Mode)'}
            {scenario.difficulty === 'chaos' && ' (Total Oversight Mode)'}
          </div>
          <button className={styles.sortBtn} onClick={startGame}>
            {phase === 'failed' ? 'Attempt Compliance Again' : 'Begin Schedule Optimization'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Messy Calendar Preview ───────────────────────────────────────────────────

function MessyCalendarPreview({ scenario }: { scenario: CalScenario }) {
  return (
    <div className={styles.previewGrid}>
      {DAY_LABELS.map(day => (
        <div key={day} className={styles.previewCol}>
          <div className={styles.previewDay}>{day}</div>
          <div className={styles.previewSlots}>
            {scenario.queue.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={styles.previewBlock}
                style={{
                  background: m.color,
                  top: `${10 + i * 25}%`,
                  height: `${15 + m.duration * 5}%`,
                  opacity: 0.5 + Math.random() * 0.3,
                }}
              />
            ))}
            <div className={styles.previewOverlap}>?</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Solved Calendar View ─────────────────────────────────────────────────────

function SolvedCalendarView({
  scenario,
  placements,
}: {
  scenario: CalScenario;
  placements: Map<string, { day: number; slot: number }>;
}) {
  // Build a lookup including expanded recurring day-copies
  const findMeeting = (id: string): CalMeeting | undefined => {
    const direct = scenario.queue.find(m => m.id === id);
    if (direct) return direct;
    // Recurring day-copy: e.g. cal-standup-d0
    const base = id.replace(/-d\d$/, '');
    const parent = scenario.queue.find(m => m.id === base);
    if (parent) return { ...parent, id, title: `${parent.title} (${DAY_LABELS[parseInt(id.slice(-1))]})` };
    // Force-placed or added by interruption
    for (const int of scenario.interruptions) {
      if (int.effect.type === 'forcePlace' && int.effect.meeting.id === id) return int.effect.meeting;
      if (int.effect.type === 'addMeeting' && int.effect.meeting.id === id) return int.effect.meeting;
    }
    return undefined;
  };

  return (
    <div className={styles.solvedGrid}>
      <div className={styles.solvedTimeCol}>
        <div className={styles.solvedCorner} />
        {TIME_LABELS.filter((_, i) => i % 2 === 0).map((t, i) => (
          <div key={i} className={styles.solvedTimeLabel} style={{ top: i * SLOT_H * 2 + 28 }}>
            {t}
          </div>
        ))}
      </div>
      {DAY_LABELS.map((day, d) => (
        <div key={day} className={styles.solvedDayCol}>
          <div className={styles.solvedDayHeader}>{day}</div>
          <div className={styles.solvedDayBody}>
            {Array.from({ length: SLOTS }).map((_, s) => (
              <div key={s} className={styles.solvedSlotLine} style={{ top: s * SLOT_H }} />
            ))}
            {scenario.prefilled.filter(p => p.day === d).map(pf => (
              <div
                key={`pf-${pf.title}`}
                className={styles.solvedMeeting}
                style={{
                  top: pf.slot * SLOT_H + 1,
                  height: pf.duration * SLOT_H - 2,
                  background: pf.color || '#bdc3c7',
                }}
              >
                <span className={styles.solvedMeetingTitle}>{pf.title}</span>
              </div>
            ))}
            {[...placements.entries()].filter(([, pos]) => pos.day === d).map(([id, pos]) => {
              const meeting = findMeeting(id);
              if (!meeting) return null;
              return (
                <div
                  key={id}
                  className={styles.solvedMeeting}
                  style={{
                    top: pos.slot * SLOT_H + 1,
                    height: meeting.duration * SLOT_H - 2,
                    background: meeting.color,
                  }}
                >
                  <span className={styles.solvedMeetingTitle}>{meeting.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Enhanced Calendar Shuffle Game ───────────────────────────────────────────

function CalendarShuffleEnhanced({
  scenario,
  onWin,
  onFail,
}: {
  scenario: CalScenario;
  onWin: (grid: (string | null)[][], placements: Map<string, { day: number; slot: number }>, meta?: GameResultMeta) => void;
  onFail: (meta?: GameResultMeta) => void;
}) {
  const [state, dispatch] = useReducer(gameReducer, scenario, createInitialState);

  const wonRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const gridRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const buildMeta = useCallback((st: GameState): GameResultMeta => {
    const flags: string[] = [];
    flags.push(`reputation:${st.reputation}`);
    flags.push(`score:${calculateScore(st)}`);
    if (st.noInvalidPlacements) flags.push('no-invalid');
    if (Object.keys(st.placedMeetings).some(id => {
      const m = st.allMeetings[id];
      return m?.title.toLowerCase().includes('labor block');
    })) flags.push('focus-placed');
    if (st.trashedIds.some(id => st.allMeetings[id]?.trashable)) flags.push('trashed-email');
    if (st.interruptionFired) flags.push('schedule-survivor');
    if (st.grovelCount >= 3) flags.push('master-groveler');
    if (st.delegateUsesLeft === 0) flags.push('delegation-king');
    if (st.chaosMode && st.timeLeft >= 5) flags.push('chaos-calendar');
    if (st.trashCount === 0) flags.push('zero-trash');
    if (st.recurringAllFive) flags.push('recurring-champion');
    return { customFlags: flags };
  }, []);

  // Timer
  useEffect(() => {
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;
      dispatch({ type: 'TICK_TIMER', elapsedMs: elapsed });
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Win check
  useEffect(() => {
    if (wonRef.current) return;
    if (checkWinCondition(state)) {
      wonRef.current = true;
      const meta = buildMeta(state);
      onWin(state.grid, new Map(Object.entries(state.placedMeetings)), meta);
    }
  }, [state.visibleQueue.length, state.dripIndex, state.placedMeetings, state.trashedIds, state.pendingInterruption, state.firedInterruptions, onWin, state, buildMeta]);

  // Fail check
  useEffect(() => {
    if (wonRef.current) return;
    if (state.timeLeft <= 0) {
      const meta = buildMeta(state);
      onFail(meta);
    }
  }, [state.timeLeft, onFail, state, buildMeta]);

  // Clear invalid cells after flash
  useEffect(() => {
    if (state.invalidCells.length > 0) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_INVALID_CELLS' }), 300);
      return () => clearTimeout(t);
    }
  }, [state.invalidCells]);

  // Drag events
  useEffect(() => {
    if (!state.dragId) return;
    const handleMove = (e: MouseEvent) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - dragOffsetRef.current.x}px`;
        ghostRef.current.style.top = `${e.clientY - dragOffsetRef.current.y}px`;
      }
    };
    const handleUp = (e: MouseEvent) => {
      const cs = stateRef.current;
      const meetingId = cs.dragId;
      if (!meetingId) { dispatch({ type: 'SET_DRAG', meetingId: null }); return; }
      const meeting = cs.visibleQueue.find(m => m.id === meetingId);
      if (!meeting) { dispatch({ type: 'SET_DRAG', meetingId: null }); return; }

      // Check trash zone
      const trashEl = trashRef.current;
      if (trashEl) {
        const trashRect = trashEl.getBoundingClientRect();
        if (e.clientX >= trashRect.left && e.clientX <= trashRect.right &&
            e.clientY >= trashRect.top && e.clientY <= trashRect.bottom) {
          if (meeting.untrashable) {
            trashEl.classList.add(styles.trashShake);
            setTimeout(() => trashEl.classList.remove(styles.trashShake), 500);
          } else {
            dispatch({ type: 'TRASH_MEETING', meetingId });
          }
          dispatch({ type: 'SET_DRAG', meetingId: null });
          return;
        }
      }

      // Check grid placement
      const gridEl = gridRef.current;
      if (gridEl) {
        const rect = gridEl.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        const timeLabelsWidth = 36;
        const dayWidth = (rect.width - timeLabelsWidth) / DAYS;
        const headerHeight = 28;
        const dayIdx = Math.floor((relX - timeLabelsWidth) / dayWidth);
        const slotIdx = Math.round((relY - headerHeight) / SLOT_H);

        if (dayIdx >= 0 && dayIdx < DAYS && slotIdx >= 0 && slotIdx < SLOTS) {
          dispatch({ type: 'PLACE_MEETING', meetingId, day: dayIdx, slot: slotIdx });
        }
      }

      dispatch({ type: 'SET_DRAG', meetingId: null });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [state.dragId]);

  const getConstraintLabel = (m: CalMeeting) => {
    const parts: string[] = [];
    if (m.constraint?.days) parts.push(m.constraint.days.map(d => DAY_LABELS[d]).join('/') + ' only');
    if (m.constraint?.maxSlot !== undefined) parts.push('morning only');
    if (m.trashable) parts.push('discardable');
    if (m.untrashable) parts.push('MANDATORY');
    if (m.isRecurring) parts.push('recurring x5');
    if (m.dependsOn) {
      const dep = state.allMeetings[m.dependsOn];
      parts.push(`after ${dep?.title || m.dependsOn}`);
    }
    return parts.join(' | ');
  };

  const durationLabel = (d: number) => {
    const mins = d * 30;
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const isDependencyMet = (m: CalMeeting) => {
    if (!m.dependsOn) return true;
    return !!state.placedMeetings[m.dependsOn];
  };

  const timerPct = (state.timeLeft / GAME_DURATION) * 100;
  const timerColor = state.timeLeft <= 15 ? '#e74c3c' : state.timeLeft <= 30 ? '#e67e22' : 'var(--color-mint)';
  const placingMeeting = state.conflictModal ? state.allMeetings[state.conflictModal.placingMeetingId] : null;
  const conflictingMeeting = state.conflictModal ? state.allMeetings[state.conflictModal.conflictsWithId] : null;

  return (
    <div className={styles.gameWrap}>
      {/* Timer bar */}
      <div className={`${styles.timerBar} ${state.chaosMode ? styles.timerBarChaos : ''}`}>
        <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
        <span className={styles.timerText}>
          {Math.ceil(state.timeLeft)}s — {scenario.name}
          {state.chaosMode && ' — TOTAL OVERSIGHT MODE'}
        </span>
      </div>

      {/* Score bar */}
      <div className={styles.scoreBar}>
        <span>Compliance Rating: {state.reputation}/100</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '0.5625rem' }}>
          Blame Redirects: {state.delegateUsesLeft}/2
        </span>
      </div>

      <div className={styles.gameBody}>
        {/* Calendar Grid */}
        <div ref={gridRef} className={styles.gameGrid}>
          <div className={styles.gameCorner} />
          {DAY_LABELS.map(d => (
            <div key={d} className={styles.gameDayHeader}>{d}</div>
          ))}
          {Array.from({ length: SLOTS }).map((_, s) => (
            <React.Fragment key={s}>
              <div className={styles.gameTimeLabel}>
                {s % 2 === 0 ? TIME_LABELS[s] : ''}
              </div>
              {Array.from({ length: DAYS }).map((_, d) => {
                const cellId = state.grid[d][s];
                const isInvalid = state.invalidCells.some(c => c.day === d && c.slot === s);
                const isPrefilled = cellId?.startsWith('pf-');
                const isPlaced = cellId && !isPrefilled;

                let blockEl: React.ReactNode = null;
                if (isPrefilled) {
                  const pf = scenario.prefilled.find(p => `pf-${p.title}` === cellId && p.day === d && p.slot === s);
                  if (pf) {
                    blockEl = (
                      <div className={styles.gamePrefilled} style={{ height: pf.duration * SLOT_H - 2, background: pf.color }}>
                        {pf.title}
                      </div>
                    );
                  }
                } else if (isPlaced) {
                  const pos = state.placedMeetings[cellId];
                  if (pos && pos.day === d && pos.slot === s) {
                    const meeting = state.allMeetings[cellId];
                    if (meeting) {
                      const isClickable = !meeting.isLocked;
                      blockEl = (
                        <div
                          className={`${styles.gamePlaced} ${isClickable ? styles.gamePlacedClickable : styles.gamePlacedLocked}`}
                          style={{ height: meeting.duration * SLOT_H - 2, background: meeting.color }}
                          onClick={isClickable ? () => dispatch({ type: 'UNPLACE_MEETING', meetingId: cellId }) : undefined}
                        >
                          {meeting.title}
                          {meeting.isLocked && <span className={styles.lockIcon}> [LOCKED]</span>}
                        </div>
                      );
                    }
                  }
                }

                return (
                  <div key={`${d}-${s}`}
                    className={`${styles.gameSlot} ${isInvalid ? styles.gameInvalid : ''}`}
                  >
                    {blockEl}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Queue Panel */}
        <div className={`${styles.gameQueue} ${state.chaosMode ? styles.gameQueueChaos : ''}`}>
          <div className={styles.gameQueueTitle}>
            Mandates ({state.visibleQueue.length} pending)
          </div>
          <div className={styles.gameQueueList}>
            {state.visibleQueue.map(m => {
              const depMet = isDependencyMet(m);
              return (
                <div
                  key={m.id}
                  className={`${styles.gameQueueItem} ${m.isUrgent ? styles.gameQueueItemUrgent : ''} ${!depMet ? styles.gameQueueItemDimmed : ''}`}
                  style={{ borderLeftColor: m.color }}
                  onMouseDown={(e) => {
                    if (!depMet) return;
                    if (state.pendingInterruption || state.conflictModal) return;
                    dragOffsetRef.current = {
                      x: e.clientX - e.currentTarget.getBoundingClientRect().left,
                      y: e.clientY - e.currentTarget.getBoundingClientRect().top,
                    };
                    dispatch({ type: 'SET_DRAG', meetingId: m.id });
                    if (ghostRef.current) {
                      ghostRef.current.style.left = `${e.clientX - dragOffsetRef.current.x}px`;
                      ghostRef.current.style.top = `${e.clientY - dragOffsetRef.current.y}px`;
                    }
                    e.preventDefault();
                  }}
                >
                  <div className={styles.gameQueueItemTitle}>
                    {m.isUrgent && <span className={styles.urgentBadge}>PRIORITY</span>}
                    {m.title}
                    {m.isRecurring && <span className={styles.recurringBadge}>x5</span>}
                  </div>
                  <div className={styles.gameQueueItemDur}>{durationLabel(m.duration)}</div>
                  {getConstraintLabel(m) && (
                    <div className={styles.gameQueueConstraint}>{getConstraintLabel(m)}</div>
                  )}
                  {!depMet && m.dependsOn && (
                    <div className={styles.dependencyLabel}>
                      Requires "{state.allMeetings[m.dependsOn]?.title}" first
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trash zone */}
          <div ref={trashRef} id="cal-app-trash" className={styles.gameTrash}>
            <span>🗑️</span> Discard
            {state.trashCount > 0 && <span className={styles.trashCount}>({state.trashCount})</span>}
            {state.totalTrashPenalty > 0 && (
              <span className={styles.gameTrashPenalty}>-{state.totalTrashPenalty}s</span>
            )}
          </div>
        </div>
      </div>

      {/* Interruption banner */}
      {state.pendingInterruption && (
        <div className={styles.interruptionBanner}>
          <span className={styles.interruptionEmoji}>{state.pendingInterruption.emoji}</span>
          <span className={styles.interruptionMsg}>{state.pendingInterruption.message}</span>
          <button
            onClick={() => dispatch({ type: 'DISMISS_INTERRUPTION' })}
            className={styles.interruptionDismiss}
          >
            Comply
          </button>
        </div>
      )}

      {/* Conflict modal */}
      {state.conflictModal && placingMeeting && conflictingMeeting && (
        <div className={styles.conflictOverlay}>
          <div className={styles.conflictModal}>
            <div className={styles.conflictTitle}>Scheduling Violation Detected</div>
            <div className={styles.conflictDesc}>
              "{placingMeeting.title}" conflicts with "{conflictingMeeting.title}" which is already mandated. Choose your consequence.
            </div>
            <div className={styles.conflictOptions}>
              <button
                onClick={() => dispatch({ type: 'RESOLVE_CONFLICT', resolution: 'reschedule', success: Math.random() > 0.5 })}
                className={styles.conflictOption}
              >
                Delay the Inevitable (50/50) | -5 compliance if fails
              </button>
              <button
                onClick={() => dispatch({ type: 'RESOLVE_CONFLICT', resolution: 'delegate' })}
                className={`${styles.conflictOption} ${state.delegateUsesLeft <= 0 ? styles.conflictOptionDisabled : ''}`}
                disabled={state.delegateUsesLeft <= 0}
              >
                Blame a Subordinate ({state.delegateUsesLeft} remaining) | always works
              </button>
              <button
                onClick={() => dispatch({ type: 'RESOLVE_CONFLICT', resolution: 'decline' })}
                className={`${styles.conflictOption} ${placingMeeting.untrashable ? styles.conflictOptionDisabled : ''}`}
                disabled={!!placingMeeting.untrashable}
              >
                Career Suicide | -10 compliance
              </button>
              <button
                onClick={() => dispatch({ type: 'RESOLVE_CONFLICT', resolution: 'grovel' })}
                className={styles.conflictOption}
              >
                Grovel | -8s, -3 compliance
                <div style={{ fontSize: '0.5rem', opacity: 0.7, marginTop: 2 }}>
                  {getGrovelText(state.grovelCount)}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag ghost */}
      {state.dragId && (() => {
        const meeting = state.visibleQueue.find(m => m.id === state.dragId);
        if (!meeting) return null;
        return (
          <div ref={ghostRef} className={styles.gameGhost}
            style={{ borderLeftColor: meeting.color }}>
            {meeting.title} ({durationLabel(meeting.duration)})
            {meeting.isRecurring && <span className={styles.recurringGhostBadge}> x5</span>}
          </div>
        );
      })()}
    </div>
  );
}
