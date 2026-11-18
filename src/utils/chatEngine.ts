// ─── Chat engine ──────────────────────────────────────────────────────────────
// Decides the SHAPE of team chat in code (how many people reply, who, what
// they do, how long) and leaves only the words to the model. Left to itself
// the model answers every message with two one-line quips aimed at the
// player; planning the shape here is what makes the chat feel varied.

import type { ChannelId, MoraleLevel } from '../types/chat';
import { teamMembers } from '../data/team';

const getRoster = () => teamMembers.map(m => ({ ...m, isAI: false as boolean }));

// Display names of the OmniPubDent channels (ids are shared with AgencyRPG).
export const CHANNEL_LABEL: Record<string, string> = {
  general: 'all-staff', creative: 'project-work', random: 'watercooler',
  food: 'Approved Nutrition', memes: 'Morale Content', haiku: 'Structured Creativity',
};

/** The vendor almost never speaks unprompted. */
function chatPool(message = ''): string[] {
  return activeTeamIds().filter(id => id !== 'contractor' || /designhub|vendor|contractor/i.test(message) || Math.random() < 0.08);
}
import {
  pickSpeakers, recordSpeaker, getUsedTopics, addTopics, addThread, maybeCallback,
  patAllowed, pickUnseen,
} from './chatMemory';
import type { RunningThread } from './chatMemory';
import { describeGameState, getStateHooks } from './chatGameState';
import type { StateHook } from './chatGameState';
import {
  activeTeamIds, describeRoster, displayName, firstName, playerNameRule, sanitizeChatText, BANNED_TICS,
} from './chatVoices';

const MODEL = 'claude-haiku-4-5-20251001';

export interface TranscriptLine { authorId: string; text: string }

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted<T>(options: Array<[T, number]>): T {
  const total = options.reduce((a, [, w]) => a + w, 0);
  let roll = Math.random() * total;
  for (const [value, w] of options) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return options[options.length - 1][0];
}

export function transcript(lines: TranscriptLine[], playerName: string): string {
  return lines
    .filter(l => l.text)
    .map(l => `${displayName(l.authorId, playerName)}: ${l.text.replace(/\n/g, ' / ')}`)
    .join('\n');
}

async function callModel(prompt: string, maxTokens: number, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`API error ${response.status}`);
    const data = await response.json();
    return String(data.content?.[0]?.text ?? '');
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

function usedTopicsBlock(): string {
  const topics = getUsedTopics();
  if (topics.length === 0) return '';
  return `\nTOPICS AND JOKES ALREADY USED THIS SESSION — do not reuse any of these, not even reworded:\n${topics.map(t => `- ${t}`).join('\n')}\n`;
}

function callbackBlock(thread: RunningThread | null): string {
  if (!thread) return '';
  return `\nOPTIONAL CALLBACK: a running bit from earlier is "${thread.label}" (${thread.detail}). One person may reference it in passing if it fits naturally, e.g. "is this the ${thread.label} again". Skip it if it doesn't fit.\n`;
}

const TIC_RULES = `BANNED for every character (these made everyone sound the same):\n${BANNED_TICS.map(t => `- ${t}`).join('\n')}`;

// ═════════════════════════════════════════════════════════════════════════════
// PLAYER REPLIES
// ═════════════════════════════════════════════════════════════════════════════

export interface ReplySlot {
  authorId: string;
  move: string;
  length: string;
  /** This reply (and only this one) uses the player's first name */
  useName?: boolean;
}

export interface ReplyPlan {
  slots: ReplySlot[];
  /** Teammate who drops an emoji reaction on the player's message (if any) */
  reactor: string | null;
}

let lastReplyCount = -1;

function lengthFor(authorId: string): string {
  const table: Record<string, Array<[string, number]>> = {
    'art-director': [['2-5 words', 0.6], ['one short sentence', 0.35], ['two sentences', 0.05]],
    media: [['2-5 words', 0.55], ['one short sentence', 0.4], ['two sentences', 0.05]],
    copywriter: [['2-5 words', 0.15], ['one sentence', 0.4], ['two sentences', 0.45]],
  };
  return weighted(table[authorId] ?? [['2-5 words', 0.3], ['one sentence', 0.45], ['two sentences', 0.25]]);
}

/** Who did the player address by name? Uses first names from the team data. */
function namedTeammates(message: string, pool: string[]): string[] {
  const roster = getRoster();
  return pool.filter(id => {
    const m = roster.find(r => r.id === id);
    if (!m) return false;
    const name = m.id === 'contractor' ? 'DesignHub' : firstName(m.name);
    return new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message);
  });
}

export function planReply(message: string): ReplyPlan {
  const pool = chatPool(message);
  if (pool.length === 0) return { slots: [], reactor: null };

  const named = namedTeammates(message, pool);
  const isQuestion = /\?\s*$/.test(message.trim());
  const addressesEveryone = /\b(everyone|everybody|team|all|y'?all|guys|folks)\b/i.test(message);

  let count = weighted<number>([[0, 0.12], [1, 0.43], [2, 0.33], [3, 0.12]]);
  if (count === lastReplyCount) count = weighted<number>([[0, 0.12], [1, 0.43], [2, 0.33], [3, 0.12]]);
  if (named.length > 0 || isQuestion) count = Math.max(count, 1);
  if (addressesEveryone) count = Math.max(count, 2);
  count = Math.max(count, Math.min(named.length, 3));
  count = Math.min(count, pool.length, 3);
  lastReplyCount = count;

  const order = [...named.slice(0, 3), ...pickSpeakers(pool, count - Math.min(named.length, 3), named)];

  const slots: ReplySlot[] = order.slice(0, count).map((authorId, i) => {
    let move: string;
    if (i === 0) {
      move = named.includes(authorId)
        ? weighted([['answer the player directly, in character', 0.75], ['answer briefly, then ask the player a follow-up question', 0.25]])
        : weighted([
          ['respond to the player', 0.55],
          ['ask the player a real question back instead of making a joke', 0.2],
          ['respond briefly, then bring up something concrete about current work (a brief, a deadline, a result)', 0.25],
        ]);
    } else {
      const prev = displayName(order[i - 1], '');
      move = weighted([
        [`reply to ${prev}, not to the player`, 0.3],
        [`disagree with ${prev} — a real difference of opinion, in character`, 0.25],
        ['add a different angle for the player (not the same joke or point as anyone before)', 0.2],
        ['change the subject to something else on their mind', 0.15],
        ['ask the player a direct question', 0.1],
      ]);
    }
    const length = lengthFor(authorId);
    // A 2-5 word reply can't also "then" do a second thing.
    if (length === '2-5 words' && /then|instead of/.test(move)) move = i === 0 ? 'respond to the player' : `react to ${displayName(order[i - 1], '')}`;
    return { authorId, move, length };
  });

  // Real coworkers use your name sometimes, not constantly: about one exchange
  // in four, one reply says it.
  if (slots.length > 0 && Math.random() < 0.28) slots[Math.floor(Math.random() * slots.length)].useName = true;

  // Emoji-only when nobody types; otherwise sometimes an extra emoji too.
  let reactor: string | null = null;
  if (count === 0 || Math.random() < 0.3) {
    reactor = pickSpeakers(pool, 1, order)[0] ?? pickSpeakers(pool, 1)[0] ?? null;
  }
  return { slots, reactor };
}

export interface ReplyResult {
  sentiment: 'supportive' | 'encouraging' | 'neutral' | 'dismissive' | 'harsh';
  moraleImpact: 'up' | 'same' | 'down';
  summary: string;
  conductFlag?: string | null;
  replies: Array<{ authorId: string; text: string }>;
  emoji?: string;
  topics?: string[];
  thread?: { label: string; detail: string } | null;
}

const CHANNEL_GUIDANCE: Record<string, string> = {
  general: '#all-staff, the main OmniPubDent work channel. Evaluate as standard leadership communication.',
  creative: '#project-work: project updates and deliverables. Evaluate as creative collaboration.',
  random: '#watercooler, the off-topic channel ("monitored per Policy 2.4"). Playful banter and personality are POSITIVE team-bonding → moraleImpact: "up".',
  food: '#Approved Nutrition, the food channel. Joining food chat is POSITIVE team-bonding → moraleImpact: "up".',
  memes: '#Morale Content, the "pre-approved humor" channel. Sharing jokes is POSITIVE team-bonding → moraleImpact: "up".',
  haiku: '#Structured Creativity, the haiku channel. Writing haiku is POSITIVE creative bonding → moraleImpact: "up". Replies here should be haiku too (5-7-5, lines separated by \\n) unless the reply is 2-5 words.',
};

export function buildReplyPrompt(args: {
  playerName: string;
  playerMessage: string;
  channelId: string;
  recent: TranscriptLine[];
  morale: MoraleLevel;
  plan: ReplyPlan;
}): string {
  const { playerName, playerMessage, channelId, recent, morale, plan } = args;
  const pool = chatPool(playerMessage);
  const callback = maybeCallback(0.2);

  const planBlock = plan.slots.length === 0
    ? `NOBODY REPLIES IN TEXT this time. Return "replies": []. ${plan.reactor ? `${displayName(plan.reactor, playerName)} just reacts with an emoji — pick one that fits and put it in "emoji".` : ''}`
    : `EXACTLY ${plan.slots.length} ${plan.slots.length === 1 ? 'person replies' : 'people reply, in this order'}:\n${plan.slots
      .map((s, i) => `${i + 1}. ${displayName(s.authorId, playerName)} (authorId "${s.authorId}") — ${s.move}. Length: ${s.length}.${s.useName ? ` Work ${playerName}'s first name into this reply naturally.` : ''}`)
      .join('\n')}${plan.reactor ? `\nAlso: ${displayName(plan.reactor, playerName)} adds an emoji reaction to ${playerName}'s message — put it in "emoji".` : ''}`;

  return `You write team chat for an ad agency game and classify the player's message. Setting: the team's agency was acquired by the holding company OmniPubDent. Work is now minor deck tweaks; the culture is corporate, process-heavy and quietly bleak, played for dry comedy.

${playerNameRule(playerName)}

THE TEAM (use these exact authorIds):
${describeRoster(pool)}

${TIC_RULES}

Each character KNOWS their own name and role and all coworkers. Nobody asks "who is Jamie?".

WHAT'S GOING ON IN THE GAME (use it when relevant, don't recite it):
${describeGameState()}

Channel: #${CHANNEL_LABEL[channelId] ?? channelId}
Channel context: ${CHANNEL_GUIDANCE[channelId] ?? CHANNEL_GUIDANCE.general}

Last messages in #${CHANNEL_LABEL[channelId] ?? channelId} (oldest first):
${transcript(recent, playerName) || '(no recent messages)'}
${usedTopicsBlock()}${callbackBlock(callback)}
${playerName} (the player) just said: "${playerMessage}"
Current team morale: ${morale}

REPLY PLAN — follow it exactly:
${planBlock}

REPLY RULES:
- Build on what was actually said above instead of restarting the conversation.
- No two replies may make the same joke or point, even in different words. If someone already riffed on something, the next person goes somewhere else.
- Stick to each reply's length. "2-5 words" means 2-5 words.
- Only the reply marked above uses ${playerName}'s name. The others don't use it.
- Pat (HR) does not reply here. Never include authorId "hr".

Return ONLY valid JSON (no markdown):
{
  "sentiment": "supportive|encouraging|neutral|dismissive|harsh",
  "moraleImpact": "up|same|down",
  "summary": "One-line description of morale effect",
  "conductFlag": null,
  "replies": [ { "authorId": "...", "text": "..." } ],
  "emoji": "single emoji or null",
  "topics": ["2-5 word tag for each joke/topic used in the replies"],
  "thread": null
}
Set "thread" to {"label": "short name like 'the salmon thing'", "detail": "one line"} ONLY if this exchange created a memorable bit worth calling back later; otherwise null.

SENTIMENT GUIDELINES:
- supportive (empathetic, offers help/breaks, acknowledges effort, team bonding) → "up"
- encouraging (positive, forward-looking, praises work quality, creative play) → "up"
- perspective-giving (acknowledges effort + reframes with customer/business lens) → "up"
- neutral (purely informational, no engagement or personality) → "same"
- dismissive (minimises concerns without acknowledgment, pushy, changes subject) → "down"
- harsh (blames, aggressive, "suck it up") → "down"

In non-work channels (#haiku, #food, #memes, #random), the player participating at all is a morale boost: "supportive" or "encouraging" → "up" unless hostile or mean.
Good leaders after a mid-range score acknowledge the work, give perspective on what matters (client happiness), and show appreciation. That is SUPPORTIVE, even without addressing disappointment directly.
Actually dismissive ("down"): "doesn't matter, move on", "I don't care about the score", "why are you upset? Client paid us.", changing subject with zero acknowledgment, hostile or mean messages in any channel.

CONDUCT CHECK — set "conductFlag" if the message contains:
- "sexual": sexual innuendo, inappropriate romantic/sexual comments toward the team, explicit content
- "hostile": threats of violence, intimidation, aggressive personal attacks
- "discriminatory": slurs, discrimination based on protected characteristics
- "profanity_directed": profanity aimed AT a team member (e.g. "you're an idiot")
Otherwise null.
Telling the team they're AI, NPCs, code or "not real" is a game easter egg, NOT hostile.
Casual swearing about work ("damn this deadline") is NOT profanity_directed.`;
}

export async function generateReply(args: Parameters<typeof buildReplyPrompt>[0]): Promise<ReplyResult> {
  const prompt = buildReplyPrompt(args);
  const raw = await callModel(prompt, 600);
  const result = parseJson<ReplyResult & { reactions?: Array<{ authorId: string; text: string }> }>(raw);
  const allowed = new Set(args.plan.slots.map(sl => sl.authorId));
  const plannedIds = args.plan.slots.map(s => s.authorId);

  const replies = (result.replies ?? result.reactions ?? [])
    .filter(r => r && allowed.has(r.authorId) && r.text)
    .slice(0, Math.max(plannedIds.length, 0))
    .map(r => ({ authorId: r.authorId, text: sanitizeChatText(r.text, args.playerName, r.authorId) }))
    .filter(r => r.text.length > 0);

  addTopics(result.topics);
  addThread(result.thread ?? null, args.channelId);
  return { ...result, replies };
}

/** Typing / pacing: short replies land fast, longer ones take a beat. */
export function replyDelays(replies: Array<{ text: string }>): number[] {
  let t = 1600 + Math.random() * 1400;
  return replies.map((r, i) => {
    if (i > 0) t += 1200 + Math.min(r.text.length * 28, 3500) + Math.random() * 1200;
    return Math.round(t);
  });
}

export function noteSpeakers(ids: string[]): void {
  ids.forEach(recordSpeaker);
}

// ═════════════════════════════════════════════════════════════════════════════
// AMBIENT THREADS
// ═════════════════════════════════════════════════════════════════════════════

export interface AmbientLine {
  authorId: string;
  text: string;
  emoji?: string;
}

const AMBIENT_CHANNEL_GUIDE: Record<string, string> = {
  general: '#all-staff: OmniPubDent work channel — approvals, deck tweaks, deadlines, HQ directives, client notes, results.',
  creative: '#project-work: project updates on the actual deliverables (mostly small deck and logo tweaks). Rare flickers of real creative thinking, quickly suppressed.',
  random: '#watercooler, "monitored per Policy 2.4": life, the office, tangents, coping. Work only comes up sideways — no shop talk.',
  food: '#Approved Nutrition: EVERY message is about food, drinks, the cafeteria, vending machines or lunch. Work is only the backdrop.',
  memes: '#Morale Content, "pre-approved humor only": text memes about corporate life (formats like "Nobody: / Me:", "expectation vs reality", short ASCII boxes). Replies are short reactions.',
  haiku: '#Structured Creativity: EVERY message is a haiku — exactly three lines joined with \\n, 5-7-5 syllables. No prose replies, no one-liners. People answer each other in haiku.',
};

/** How much of each channel's ambient chat should come from game state. */
export const STATE_SHARE: Record<string, number> = {
  general: 0.9, creative: 0.85, random: 0.55, food: 0.5, memes: 0.6, haiku: 0.55,
};

export function pickHook(channel: string): StateHook | null {
  const hooks = getStateHooks();
  if (hooks.length === 0) return null;
  // Prefer concrete, recent things over mood/time.
  const weightOf = (h: StateHook): number => {
    const base: Record<StateHook['kind'], number> = {
      deadline: 3, score_good: 3, score_bad: 3, award: 2, event: 3, pipeline: 1.5, morale: 1, time: 0.8,
    };
    let w = base[h.kind];
    // Casual channels lean on mood and time; work news is only a backdrop there.
    if (channel === 'food' || channel === 'random') {
      if (h.kind === 'time' || h.kind === 'morale' || h.kind === 'award' || h.kind === 'pipeline') w += 1.5;
      else w *= 0.4;
    }
    return w;
  };
  return weighted(hooks.map(h => [h, weightOf(h)] as [StateHook, number]));
}

export async function generateAmbientThread(args: {
  channel: ChannelId;
  playerName: string;
  recent: TranscriptLine[];
  hook: StateHook | null;
}): Promise<{ lines: AmbientLine[]; includedPat: boolean } | null> {
  const { channel, playerName, recent, hook } = args;
  const pool = chatPool();
  if (pool.length === 0) return null;

  const count = Math.min(weighted<number>([[1, 0.28], [2, 0.36], [3, 0.26], [4, 0.1]]), pool.length);
  const people = pickSpeakers(pool, count);
  const withPat = patAllowed() && Math.random() < 0.2;
  const callback = maybeCallback(0.25);

  // In the casual channels a mood/time thread shouldn't turn into shop talk,
  // so it only gets the time and the mood, not the whole work picture.
  const casual = channel === 'food' || channel === 'random';
  const softHook = !hook || hook.kind === 'time' || hook.kind === 'morale' || hook.kind === 'pipeline' || hook.kind === 'award';
  const gameState = casual && softHook
    ? describeGameState().split('\n').filter(l => /^(Time|Team morale|Awards)/.test(l)).join('\n')
    : describeGameState();

  const shape = weighted([
    ['a quick exchange where they build on each other', 0.35],
    ['a mild disagreement between them', 0.25],
    ['one person asks the others something and gets an answer', 0.2],
    ['someone starts on one thing and the thread drifts somewhere else', 0.2],
  ]);

  const prompt = `You write a short, natural thread of team chat for an ad agency game. Setting: the team's agency was acquired by the holding company OmniPubDent; work is now minor deck tweaks and the culture is corporate and quietly bleak, played for dry comedy. The player is not part of this thread.

${playerNameRule(playerName)}
The team talks to each other here, not to ${playerName}. They may mention ${playerName} in the third person at most once, by first name.

WHO POSTS (in roughly this order; a person may post twice in a row as a quick follow-up):
${describeRoster(people)}${withPat ? `\n${describeRoster(['hr'])}\n    Pat may add ONE line, in HR compliance language only (handbook citations, "Noted."). Optional.` : '\nPat (HR) is NOT in this thread.'}

${TIC_RULES}

Channel: #${CHANNEL_LABEL[channel] ?? channel} — ${AMBIENT_CHANNEL_GUIDE[channel] ?? AMBIENT_CHANNEL_GUIDE.general}

WHAT'S GOING ON IN THE GAME:
${gameState}

${hook ? `THIS THREAD IS ABOUT: ${hook.prompt}\nMake it specific (names, numbers, the actual campaign) rather than generic office banter. Stay in the channel's lane — the topic comes through the way this channel talks${channel === 'food' ? ' (e.g. what people are eating or ordering because of it)' : channel === 'memes' ? ' (a text meme about it)' : channel === 'haiku' ? ' (haiku about it)' : ''}.` : 'THIS THREAD IS general OmniPubDent office life, but not microwaved fish or the coffee machine.'}
Shape: ${shape}.

Recent messages in #${CHANNEL_LABEL[channel] ?? channel} (oldest first) — continue naturally, don't repeat any of it:
${transcript(recent, playerName) || '(quiet so far)'}
${usedTopicsBlock()}${callbackBlock(callback)}
Vary message length: some 2-5 words, some a full sentence or two. ${count === 1 ? `Just ${displayName(people[0], playerName)} posting: 1 message, or 2 if it's a quick follow-up. Nobody talks to themselves.` : `${count + (withPat ? 1 : 0)} to ${count + 2} messages total.`}

Return ONLY valid JSON (no markdown):
{
  "messages": [ { "authorId": "...", "text": "...", "emoji": "optional single emoji reaction from someone else, or null" } ],
  "topics": ["2-5 word tag for each joke/topic used"],
  "thread": null
}
Set "thread" to {"label": "short name", "detail": "one line"} only if this created a running bit worth calling back later.`;

  try {
    const raw = await callModel(prompt, 700, 20000);
    const result = parseJson<{ messages?: AmbientLine[]; topics?: string[]; thread?: { label: string; detail: string } | null }>(raw);
    const allowed = new Set([...pool, ...(withPat ? ['hr'] : [])]);
    let patLines = 0;
    const lines = (result.messages ?? [])
      .filter(m => m && allowed.has(m.authorId) && m.text)
      .filter(m => (m.authorId === 'hr' ? ++patLines <= 1 : true))
      .filter(m => channel !== 'haiku' || (m.text ?? '').split('\n').filter(Boolean).length === 3)
      // Nobody posts more than twice in a row (no talking to yourself).
      .filter((m, i, arr) => !(i >= 2 && arr[i - 1].authorId === m.authorId && arr[i - 2].authorId === m.authorId))
      .slice(0, count === 1 ? 2 : 6)
      .map(m => ({
        authorId: m.authorId,
        text: sanitizeChatText(m.text ?? '', playerName, m.authorId),
        emoji: typeof m.emoji === 'string' && m.emoji.length <= 8 ? m.emoji : undefined,
      }));
    if (lines.length === 0) return null;
    addTopics(result.topics);
    addThread(result.thread ?? null, channel);
    return { lines, includedPat: lines.some(l => l.authorId === 'hr') };
  } catch {
    return null;
  }
}

// ─── Scripted state fallback ─────────────────────────────────────────────────
// Used when the API is unavailable, the tab is hidden, or for openers.
// Still tied to game state, so the chat reflects progress even offline.

type Tpl = { id: string; lines: Array<[string, string]> };

function stateTemplates(hook: StateHook, playerName: string): Tpl[] {
  const d = hook.data as Record<string, string>;
  switch (hook.kind) {
    case 'deadline': return [
      { id: 'dl1', lines: [['pm', `${d.campaign} is ${d.when}. Ticket OPD-4471. Approval chain is 9 steps, so please start now.`], ['copywriter', 'On it.']] },
      { id: 'dl2', lines: [['vance', `Quick pulse on ${d.campaign}: let's make sure we're leveraging the full runway before ${d.client} sees it. 15-min sync at 4?`], ['pm', 'That\'s the third sync today.']] },
      { id: 'dl3', lines: [['suit', `${d.client} is SO excited for ${d.campaign} 🙌 I told them we'd overdeliver. Please overdeliver.`]] },
      { id: 'dl4', lines: [['strategist', `${d.campaign}: 3 of 7 approvals in. 43%.`], ['pm', 'We are 43% approved and 100% due.']] },
      { id: 'dl5', lines: [['copywriter', `Moved the logo on ${d.campaign} two pixels left. Then back. Then left again. Submitting.`]] },
    ];
    case 'score_good': return [
      { id: 'sg1', lines: [['suit', `${d.client} gave ${d.campaign} a ${d.score}! Already pitching them the Platinum Retainer 🚀`]] },
      { id: 'sg2', lines: [['strategist', `${d.score} on ${d.campaign}. Top quartile. Adding it to slide 4.`], ['copywriter', 'Slide 4 is getting crowded.']] },
      { id: 'sg3', lines: [['vance', `Huge win on ${d.campaign}, team. This is exactly the kind of synergy HQ wants to see. Let's unpack the learnings Thursday.`]] },
    ];
    case 'score_bad': return [
      { id: 'sb1', lines: [['suit', `${d.client} scored ${d.campaign} a ${d.score}. Reframing that as a "growth opportunity" in the recap.`]] },
      { id: 'sb2', lines: [['pm', `Post-mortem for ${d.campaign} is booked. 90 minutes. Mandatory.`], ['copywriter', 'We changed one slide.']] },
      { id: 'sb3', lines: [['copywriter', `${d.score}. The version they rejected in round two was better. Anyway.`]] },
    ];
    case 'award': return [
      { id: 'aw1', lines: [['suit', `The ${d.award} is going in the HQ lobby display case. With HQ's name on it.`]] },
      { id: 'aw2', lines: [['strategist', `${d.award}. Benchmarked against the network: we're the only office that won anything this quarter.`]] },
    ];
    case 'event': return [
      { id: 'ev1', lines: [['pm', `Logged: ${d.text}`]] },
      { id: 'ev2', lines: [['vance', `Circling back on this: ${d.text}. Let's take it offline.`]] },
    ];
    case 'pipeline': return [
      { id: 'pl1', lines: [['pm', 'No active tickets. This has never happened. I don\'t trust it.']] },
      { id: 'pl2', lines: [['suit', 'Quiet week! Using it to build relationships 🙌'], ['strategist', 'He means golf.']] },
    ];
    case 'morale': {
      const m = d.morale;
      if (m === 'high') return [{ id: 'mh1', lines: [['copywriter', 'Good day today. Not sure what to do with that.']] }];
      if (m === 'low' || m === 'toxic' || m === 'mutiny') return [
        { id: 'ml1', lines: [['copywriter', 'Long week.'], ['strategist', 'Fourth one this month.']] },
        { id: 'ml2', lines: [['pm', 'If anyone needs a deadline moved, tell me before it goes up the chain.']] },
      ];
      return [{ id: 'mm1', lines: [['suit', `Does ${playerName} want the client deck before or after the alignment meeting?`], ['pm', 'Before. Always before.']] }];
    }
    case 'time':
    default: {
      const h = new Date().getHours();
      if (h < 11) return [{ id: 't1', lines: [['vance', 'Morning team. Let\'s make today a needle-mover.'], ['copywriter', 'Morning.']] }];
      if (h < 14) return [{ id: 't3', lines: [['pm', 'Lunch is 30 minutes. Please badge out.'], ['copywriter', 'We have to badge out for lunch now?']] }];
      if (h < 18) return [{ id: 't4', lines: [['strategist', '3pm. Response time average still 4 minutes.']] }];
      return [{ id: 't5', lines: [['pm', 'It\'s late. Please log off.'], ['strategist', 'Logging off is tracked.']] }];
    }
  }
}

/** A scripted, state-aware thread. Never repeats a template until its kind is exhausted. */
export function scriptedStateThread(hook: StateHook, playerName: string): AmbientLine[] | null {
  const pool = new Set(activeTeamIds());
  const tpls = stateTemplates(hook, playerName).filter(t => t.lines.every(([id]) => pool.has(id)));
  const pick = pickUnseen(`state:${hook.kind}`, tpls, t => t.id);
  if (!pick) return null;
  return pick.lines.map(([authorId, text]) => ({ authorId, text }));
}

export { rand };
