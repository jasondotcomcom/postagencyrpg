// ─── Chat memory ──────────────────────────────────────────────────────────────
// Everything team chat needs to remember so it stops repeating itself:
//  • which scripted openers / ambient threads have been shown (per channel)
//  • who spoke recently (so replies rotate through the team)
//  • topics and jokes already used (so nobody makes the same joke twice)
//  • running bits that can come back later as callbacks
//  • recent game events (scores, awards, declined briefs, mini-games)
//  • how many ambient threads since Pat last showed up
//
// Stored under an `agencyrpg_` key, so New Game / New Game+ / full reset
// (which wipe every agencyrpg_* key) clear it automatically.

const STORAGE_KEY = 'agencyrpg_chat_memory';

export interface RunningThread {
  /** Short handle, e.g. "the salmon thing" */
  label: string;
  /** One line of what happened, for the model */
  detail: string;
  channel: string;
  createdAt: number;
  /** Times it has been called back */
  uses: number;
}

export interface ChatGameEvent {
  type: string;
  text: string;
  at: number;
}

interface ChatMemoryState {
  seen: Record<string, string[]>;
  recentSpeakers: string[];
  topics: Array<{ text: string; at: number }>;
  threads: RunningThread[];
  events: ChatGameEvent[];
  threadsSincePat: number;
}

const EMPTY: ChatMemoryState = {
  seen: {},
  recentSpeakers: [],
  topics: [],
  threads: [],
  events: [],
  threadsSincePat: 5,
};

let state: ChatMemoryState = load();

function load(): ChatMemoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, seen: {} };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY, seen: {} };
  }
}

function save(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* non-fatal */ }
}

// ─── Seen tracking (openers + ambient pools) ─────────────────────────────────

/**
 * Pick an item from `items` that hasn't been shown yet under `bucket`.
 * Never repeats until every item in the bucket has been shown, then starts
 * a fresh cycle. Marks the pick as seen.
 */
export function pickUnseen<T>(bucket: string, items: T[], idOf: (item: T) => string, filter?: (item: T) => boolean): T | null {
  const candidates = filter ? items.filter(filter) : items;
  if (candidates.length === 0) return null;
  let seen = new Set(state.seen[bucket] ?? []);
  let fresh = candidates.filter(i => !seen.has(idOf(i)));
  if (fresh.length === 0) {
    // Pool exhausted — start a new cycle, keeping the filtered-out items' history.
    const candidateIds = new Set(candidates.map(idOf));
    seen = new Set([...seen].filter(id => !candidateIds.has(id)));
    fresh = candidates;
  }
  const pick = fresh[Math.floor(Math.random() * fresh.length)];
  seen.add(idOf(pick));
  state = { ...state, seen: { ...state.seen, [bucket]: [...seen] } };
  save();
  return pick;
}

export function seenCount(bucket: string): number {
  return state.seen[bucket]?.length ?? 0;
}

// ─── Speaker rotation ────────────────────────────────────────────────────────

export function recordSpeaker(authorId: string): void {
  if (authorId === 'player') return;
  state = { ...state, recentSpeakers: [authorId, ...state.recentSpeakers.filter((_, i) => i < 19)] };
  save();
}

export function getRecentSpeakers(): string[] {
  return state.recentSpeakers;
}

/** Weight for picking a speaker: low if they just spoke, high if they've been quiet. */
export function speakerWeight(authorId: string): number {
  const idx = state.recentSpeakers.indexOf(authorId);
  if (idx === -1) return 1.6;   // hasn't spoken in a while
  if (idx < 2) return 0.15;     // spoke in the last two messages
  if (idx < 5) return 0.5;
  if (idx < 10) return 0.9;
  return 1.2;
}

/** Weighted sample without replacement. */
export function pickSpeakers(pool: string[], count: number, exclude: string[] = []): string[] {
  const out: string[] = [];
  const available = pool.filter(id => !exclude.includes(id));
  while (out.length < count && available.length > 0) {
    const weights = available.map(speakerWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let idx = 0;
    for (; idx < weights.length - 1; idx++) {
      roll -= weights[idx];
      if (roll <= 0) break;
    }
    out.push(available[idx]);
    available.splice(idx, 1);
  }
  return out;
}

// ─── Topics / jokes already used ─────────────────────────────────────────────

export function addTopics(topics: string[] | undefined): void {
  if (!topics || topics.length === 0) return;
  const now = Date.now();
  const cleaned = topics.map(t => String(t).trim().slice(0, 80)).filter(Boolean);
  const existing = state.topics.filter(t => !cleaned.some(c => c.toLowerCase() === t.text.toLowerCase()));
  state = { ...state, topics: [...cleaned.map(text => ({ text, at: now })), ...existing].slice(0, 40) };
  save();
}

export function getUsedTopics(limit = 25): string[] {
  return state.topics.slice(0, limit).map(t => t.text);
}

// ─── Running threads / callbacks ─────────────────────────────────────────────

export function addThread(thread: { label?: string; detail?: string } | null | undefined, channel: string): void {
  if (!thread?.label || !thread.detail) return;
  const label = String(thread.label).slice(0, 60);
  if (state.threads.some(t => t.label.toLowerCase() === label.toLowerCase())) return;
  const next: RunningThread = { label, detail: String(thread.detail).slice(0, 200), channel, createdAt: Date.now(), uses: 0 };
  state = { ...state, threads: [next, ...state.threads].slice(0, 12) };
  save();
}

/**
 * Maybe return a running bit worth calling back to. Older bits that haven't
 * been used much are preferred; a bit is retired after three callbacks.
 */
export function maybeCallback(chance: number): RunningThread | null {
  if (Math.random() > chance) return null;
  const minAge = 3 * 60 * 1000; // don't call back to something from two minutes ago
  const eligible = state.threads.filter(t => t.uses < 3 && Date.now() - t.createdAt > minAge);
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => a.uses - b.uses || a.createdAt - b.createdAt);
  const pick = eligible[0];
  state = { ...state, threads: state.threads.map(t => (t === pick ? { ...t, uses: t.uses + 1 } : t)) };
  save();
  return pick;
}

// ─── Game events ─────────────────────────────────────────────────────────────

export function recordGameEvent(type: string, text: string): void {
  state = { ...state, events: [{ type, text, at: Date.now() }, ...state.events].slice(0, 12) };
  save();
}

export function getRecentEvents(maxAgeMs = 1000 * 60 * 60 * 24 * 3): ChatGameEvent[] {
  return state.events.filter(e => Date.now() - e.at < maxAgeMs);
}

// ─── Pat throttle ────────────────────────────────────────────────────────────
// Pat chimes in on at most one in five ambient threads.

export function patAllowed(): boolean {
  return state.threadsSincePat >= 4;
}

export function noteAmbientThread(includedPat: boolean): void {
  state = { ...state, threadsSincePat: includedPat ? 0 : state.threadsSincePat + 1 };
  save();
}
