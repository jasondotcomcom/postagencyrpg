// ─── Chat voices ──────────────────────────────────────────────────────────────
// Per-character voice rules for team chat. Names and roles come from the team
// roster (data/team.ts); this file only adds HOW each person talks, so every
// character stops sounding like the same witty person.

import { teamMembers, getTeamMember } from '../data/team';

// Post-acquisition there are no layoffs mechanics; the roster is the team data.
const getRoster = () => teamMembers.map(m => ({ ...m, isAI: false as boolean }));

export interface ChatVoice {
  /** Concrete verbal habits */
  habits: string;
  /** What they bring up on their own */
  caresAbout: string;
  /** Things they would never say or do in chat */
  never: string;
  /** Typical message length */
  length: string;
}

export const CHAT_VOICES: Record<string, ChatVoice> = {
  copywriter: {
    habits: 'Short, careful, compliance-safe sentences. Every so often a genuinely beautiful line slips out, then they catch themselves ("anyway. approved copy attached."). Dry, quiet humor.',
    caresAbout: 'Words that used to matter, the brand voice guide, the old agency (mentioned rarely and sideways), getting through the day.',
    never: 'Never uses buzzwords sincerely. Never uses exclamation points. Never openly complains about OmniPubDent in writing.',
    length: 'Short. Often one sentence or less.',
  },
  strategist: {
    habits: 'Answers with frameworks, 2x2s, percentages and slide numbers. Replies fast and flat. Uses "circle back" without irony. Occasionally a single bleak observation.',
    caresAbout: 'Benchmarks, stakeholder reports, slide 4, response-time metrics.',
    never: 'Never shows enthusiasm. Never uses emoji except a single 📊. Never jokes on purpose.',
    length: 'One sentence, sometimes a fragment with a number in it.',
  },
  suit: {
    habits: 'Relentlessly upbeat corporate optimism. Talks about upsells, retainers, "the relationship" and HQ. Name-drops leadership. Uses 🙌 or 🚀 sometimes.',
    caresAbout: 'Accounts (fiercely territorial), the next promotion, OmniPubDent values, client satisfaction scores.',
    never: 'Never admits something went badly — reframes it. Never swears. Never criticizes HQ.',
    length: 'One or two sentences.',
  },
  pm: {
    habits: 'Overwhelmed and precise: ticket numbers, due dates, approval chains, "per the workflow". Holds it all together. Occasional crack in the composure.',
    caresAbout: 'Process, the approval chain, timelines, capacity, the 14-step sign-off.',
    never: 'Never skips a process step. Never says "no worries".',
    length: 'Short. Usually one line with a date, time or ticket in it.',
  },
  vance: {
    habits: 'Buzzword generator imported from HQ: "leverage", "synergies", "north star", "unlock". Schedules meetings for everything. Speaks in confident nothing.',
    caresAbout: 'Alignment, check-ins, the quarterly narrative, looking strategic to HQ.',
    never: 'Never says anything concrete. Never answers a direct question directly.',
    length: 'One or two long-winded sentences.',
  },
  hr: {
    habits: 'Speaks only in policy language and cites policy numbers ("per Policy 6.3"). "This has been documented." Cheerful, well-rested.',
    caresAbout: 'Policy, forms, training modules, documentation.',
    never: 'Never jokes on purpose. Never uses emoji.',
    length: 'One sentence.',
  },
  contractor: {
    habits: 'External vendor. Terse and transactional. Mentions SLAs, revision limits and change orders. Signs off formally.',
    caresAbout: 'Scope, change orders, the 72-hour turnaround.',
    never: 'Never offers an opinion on the work. Never does anything out of scope.',
    length: 'One short line plus a sign-off.',
  },
};

/** Shared tics that made everyone sound the same. Banned for every character. */
export const BANNED_TICS = [
  '"I\'m here for this"',
  '"honestly" (in any position)',
  '"[noun] energy" constructions like "Director energy:" or "main character energy"',
  'starting a message with "Ha!" or "Haha"',
  '"guilty as charged"',
  'narrating what the player just did back to them ("you just X\'d us", "look at you doing X")',
  '"love that", "this is the way", "we love to see it", "chef\'s kiss"',
  'starting with the person\'s name followed by a comma in every message',
];

export function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] || fullName;
}

/** Ids of teammates who reply in chat. Pat (HR) is kept rare and the vendor almost silent. */
export function activeTeamIds(includeHR = false): string[] {
  return getRoster()
    .filter(m => (includeHR ? true : m.id !== 'hr'))
    .map(m => m.id);
}

/** Display name used inside prompts and transcripts. */
export function displayName(authorId: string, playerName: string): string {
  if (authorId === 'player') return playerName;
  const member = getRoster().find(m => m.id === authorId) ?? getTeamMember(authorId);
  if (!member) return authorId;
  return member.id === "contractor" ? member.name : firstName(member.name);
}

/** Roster block for prompts: names, roles and voice rules, from the team data. */
export function describeRoster(ids: string[]): string {
  const roster = getRoster();
  return ids.map(id => {
    const m = roster.find(r => r.id === id);
    if (!m) return '';
    if (m.isAI) {
      return `- ${m.name} (authorId: "${m.id}") — ${m.role} slot, now an AI tool. Agreeable, generic, no opinions, no jokes.`;
    }
    const v = CHAT_VOICES[id];
    const base = `- ${firstName(m.name)} ${m.name.split(' ').slice(1).join(' ')} (authorId: "${m.id}"), ${m.role}. ${m.personality}.`;
    if (!v) return base;
    return `${base}\n    Habits: ${v.habits}\n    Cares about: ${v.caresAbout}\n    Never: ${v.never}\n    Length: ${v.length}`;
  }).filter(Boolean).join('\n');
}

/** The player-name rule, included in every chat call. */
export function playerNameRule(playerName: string): string {
  return `The player's name is ${playerName}. They run this team inside OmniPubDent (they used to be the Creative Director of the agency OmniPubDent acquired) and they're everyone's manager. The company is corporate, but the team still talks to them like a coworker. Address them by first name only ("${playerName}"), and only sometimes — most messages don't use a name at all, the way real coworkers talk. Never call them "Director", "Creative Director", "CD", "boss", "chief", "captain" or any title. Teammates address each other by first name too, never by title or role.`;
}

// ─── Output cleanup (safety net if the model slips) ──────────────────────────

const TITLE_WORDS = '(?:creative\\s+director|director|boss|chief|captain|cd)';

export function sanitizeChatText(text: string, playerName: string, authorId?: string): string {
  let t = String(text ?? '').trim();
  const original = t;
  // "Director, ..." / "Boss — ..." at the start
  t = t.replace(new RegExp(`^${TITLE_WORDS}\\s*[,:—–-]\\s*`, 'i'), '');
  // "..., Director." / "..., boss!" at the end of a clause
  t = t.replace(new RegExp(`,\\s*${TITLE_WORDS}([.!?…]|$)`, 'gi'), '$1');
  // "Hey Director" / "Morning, chief"
  t = t.replace(new RegExp(`\\b(hey|hi|morning|yo|ok|okay|thanks|thank you)\\s*,?\\s+${TITLE_WORDS}\\b`, 'gi'), `$1 ${playerName}`);
  // "[Something] energy:" tic
  t = t.replace(/^[A-Z][\w' ]{0,25}\benergy:\s*/i, '');
  // "Ha!" / "Haha" openers and "Honestly," openers
  t = t.replace(/^(ha+!+|haha+[!.,]*|honestly[,:]?)\s+/i, '');
  t = t.replace(/\bhonestly,?\s*/gi, '');
  // Re-capitalise if we stripped the start (except Riley, who is lowercase by design)
  t = t.trim();
  if (t !== original && authorId !== 'media' && /^[a-z]/.test(t)) t = t[0].toUpperCase() + t.slice(1);
  return t || original;
}
