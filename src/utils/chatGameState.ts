// ─── Chat game-state snapshot ─────────────────────────────────────────────────
// ChatProvider sits above the campaign / reputation / portfolio providers, so
// it can't read them directly. ChatGameStateBridge (rendered inside all the
// providers) writes a plain snapshot here; the chat reads it when it builds
// ambient banter and reply prompts.

import type { MoraleLevel } from '../types/chat';
import { getRecentEvents } from './chatMemory';

export interface ActiveBriefSnapshot {
  clientName: string;
  campaignName: string;
  phase: string;
  deadline: number;
}

export interface ChatGameSnapshot {
  activeBriefs: ActiveBriefSnapshot[];
  reputationTier: string | null;
  completedCount: number;
  lastScore: { campaignName: string; clientName: string; score: number; at: number } | null;
  awardsWon: string[];
  morale: MoraleLevel;
}

let snapshot: ChatGameSnapshot = {
  activeBriefs: [],
  reputationTier: null,
  completedCount: 0,
  lastScore: null,
  awardsWon: [],
  morale: 'medium',
};

export function setChatGameSnapshot(patch: Partial<ChatGameSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
}

export function getChatGameSnapshot(): ChatGameSnapshot {
  return snapshot;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function describeDeadline(deadline: number, now = Date.now()): string {
  const days = Math.round((deadline - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

export function timeOfDayLabel(d = new Date()): string {
  const h = d.getHours();
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  if (h < 6) return `the middle of the night (${day})`;
  if (h < 10) return `early ${day} morning`;
  if (h < 12) return `late ${day} morning`;
  if (h < 14) return `${day} lunchtime`;
  if (h < 17) return `${day} afternoon`;
  if (h < 20) return `${day} evening, after hours`;
  return `late ${day} night`;
}

const PHASE_LABEL: Record<string, string> = {
  concepting: 'still concepting',
  selecting: 'picking a concept',
  generating: 'in production',
  reviewing: 'in review',
  executing: 'ready to submit',
};

function ago(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Compact, model-readable description of what's going on in the game. */
export function describeGameState(): string {
  const s = snapshot;
  const lines: string[] = [];
  lines.push(`Time: ${timeOfDayLabel()}`);
  lines.push(`Team morale: ${s.morale}`);
  if (s.reputationTier) lines.push(`Agency reputation tier: ${s.reputationTier} (${s.completedCount} campaigns shipped)`);
  if (s.activeBriefs.length > 0) {
    lines.push('Active briefs:');
    s.activeBriefs.slice(0, 4).forEach(b => {
      lines.push(`- "${b.campaignName}" for ${b.clientName}: ${PHASE_LABEL[b.phase] ?? b.phase}, ${describeDeadline(b.deadline)}`);
    });
  } else {
    lines.push('Active briefs: none right now (waiting on new work)');
  }
  if (s.lastScore) lines.push(`Last campaign scored: "${s.lastScore.campaignName}" for ${s.lastScore.clientName} got ${s.lastScore.score}/100 (${ago(s.lastScore.at)})`);
  if (s.awardsWon.length > 0) lines.push(`Awards on the shelf: ${s.awardsWon.slice(0, 4).join(', ')}`);
  const events = getRecentEvents().slice(0, 5);
  if (events.length > 0) {
    lines.push('Recent happenings:');
    events.forEach(e => lines.push(`- ${e.text} (${ago(e.at)})`));
  }
  return lines.join('\n');
}

// ─── Hooks: concrete things ambient banter can be about ──────────────────────

export interface StateHook {
  id: string;
  kind: 'deadline' | 'score_good' | 'score_bad' | 'award' | 'event' | 'morale' | 'time' | 'pipeline';
  /** What the thread should be about, in a sentence, for the model */
  prompt: string;
  /** Data for the scripted fallback templates */
  data: Record<string, string | number>;
}

export function getStateHooks(): StateHook[] {
  const s = snapshot;
  const hooks: StateHook[] = [];
  const now = Date.now();

  s.activeBriefs.forEach(b => {
    hooks.push({
      id: `deadline:${b.campaignName}`,
      kind: 'deadline',
      prompt: `The "${b.campaignName}" campaign for ${b.clientName} is ${PHASE_LABEL[b.phase] ?? b.phase} and ${describeDeadline(b.deadline, now)}.`,
      data: { campaign: b.campaignName, client: b.clientName, when: describeDeadline(b.deadline, now), phase: PHASE_LABEL[b.phase] ?? b.phase },
    });
  });
  if (s.activeBriefs.length === 0) {
    hooks.push({ id: 'pipeline:empty', kind: 'pipeline', prompt: 'There are no active briefs right now. The team is waiting on new work.', data: {} });
  }

  if (s.lastScore && now - s.lastScore.at < 1000 * 60 * 60 * 24 * 2) {
    const good = s.lastScore.score >= 80;
    hooks.push({
      id: `score:${s.lastScore.campaignName}`,
      kind: good ? 'score_good' : 'score_bad',
      prompt: `The "${s.lastScore.campaignName}" campaign for ${s.lastScore.clientName} came back at ${s.lastScore.score}/100 ${good ? '(a good result)' : '(a disappointing result)'}.`,
      data: { campaign: s.lastScore.campaignName, client: s.lastScore.clientName, score: s.lastScore.score },
    });
  }

  if (s.awardsWon.length > 0) {
    hooks.push({ id: `award:${s.awardsWon[0]}`, kind: 'award', prompt: `The agency won "${s.awardsWon[0]}".`, data: { award: s.awardsWon[0] } });
  }

  getRecentEvents(1000 * 60 * 60 * 24).slice(0, 3).forEach((e, i) => {
    hooks.push({ id: `event:${e.type}:${i}:${e.at}`, kind: 'event', prompt: e.text, data: { text: e.text, type: e.type } });
  });

  hooks.push({ id: `morale:${s.morale}`, kind: 'morale', prompt: `Team morale is ${s.morale}. Let it color the mood without anyone announcing it.`, data: { morale: s.morale } });
  hooks.push({ id: `time:${new Date().getHours()}`, kind: 'time', prompt: `It's ${timeOfDayLabel()}.`, data: { time: timeOfDayLabel() } });

  return hooks;
}
