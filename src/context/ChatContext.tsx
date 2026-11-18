import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import type {
  ChatState,
  ChatMessage,
  ChannelId,
  MoraleLevel,
  Channel,
  ChatCampaignEvent,
  ChatEventContext,
} from '../types/chat';
import { getInitialMessages, getCampaignEventMessages } from '../data/chatMessages';
import { getAmbientPool, chainId, chainHasPat } from '../data/ambientMessages';
import type { AmbientMessage } from '../data/ambientMessages';
import { usePlayerContext } from './PlayerContext';
import { pickUnseen, recordSpeaker, recordGameEvent, noteAmbientThread, patAllowed } from '../utils/chatMemory';
import { setChatGameSnapshot } from '../utils/chatGameState';
import { generateAmbientThread, pickHook, scriptedStateThread, STATE_SHARE } from '../utils/chatEngine';
import type { AmbientLine } from '../utils/chatEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  { id: 'general', name: 'all-staff', description: 'OmniPubDent approved communications', icon: '#', readOnly: false },
  { id: 'creative', name: 'project-work', description: 'Project updates and deliverables', icon: '📁', readOnly: true },
  { id: 'random', name: 'watercooler', description: 'Off-topic (monitored per Policy 2.4)', icon: '💬', readOnly: false },
  { id: 'food', name: 'Approved Nutrition', description: 'Mandatory meal documentation', icon: '🍕', readOnly: false },
  { id: 'memes', name: 'Morale Content', description: 'Pre-approved humor only', icon: '🖼️', readOnly: false },
  { id: 'haiku', name: 'Structured Creativity', description: 'Poetry within parameters', icon: '🎋', readOnly: false },
];

const initialState: ChatState = {
  channels: CHANNELS,
  messages: [],
  activeChannel: 'general',
  morale: 'medium',
  lastReadTimestamps: {
    general: 0,
    creative: 0,
    random: 0,
    food: 0,
    memes: 0,
    haiku: 0,
  },
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_ACTIVE_CHANNEL'; payload: ChannelId }
  | { type: 'MARK_CHANNEL_READ'; payload: ChannelId }
  | { type: 'SET_MORALE'; payload: MoraleLevel }
  | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string } }
  | { type: 'SEED_MESSAGES'; payload: ChatMessage[] };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_ACTIVE_CHANNEL': {
      const now = Date.now();
      return {
        ...state,
        activeChannel: action.payload,
        lastReadTimestamps: {
          ...state.lastReadTimestamps,
          [action.payload]: now,
        },
        messages: state.messages.map((m) =>
          m.channel === action.payload && !m.isRead
            ? { ...m, isRead: true }
            : m,
        ),
      };
    }

    case 'MARK_CHANNEL_READ': {
      const now = Date.now();
      return {
        ...state,
        lastReadTimestamps: {
          ...state.lastReadTimestamps,
          [action.payload]: now,
        },
        messages: state.messages.map((m) =>
          m.channel === action.payload && !m.isRead
            ? { ...m, isRead: true }
            : m,
        ),
      };
    }

    case 'SET_MORALE':
      return { ...state, morale: action.payload };

    case 'ADD_REACTION':
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.id !== action.payload.messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === action.payload.emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === action.payload.emoji
                  ? { ...r, count: r.count + 1 }
                  : r,
              ),
            };
          }
          return {
            ...m,
            reactions: [...m.reactions, { emoji: action.payload.emoji, count: 1 }],
          };
        }),
      };

    case 'SEED_MESSAGES':
      return { ...state, messages: action.payload };

    default:
      return state;
  }
}

// ─── Game events → chat memory ─────────────────────────────────────────────────
// So later banter (and replies) can reference what happened.

function recordChatEvent(event: ChatCampaignEvent, ctx: ChatEventContext): void {
  const name = ctx.campaignName ? `"${ctx.campaignName}"` : 'the project';
  switch (event) {
    case 'BRIEF_ACCEPTED': recordGameEvent(event, `Took on a new brief from ${ctx.clientName}`); break;
    case 'NEW_BRIEF_ARRIVED': recordGameEvent(event, `A new brief arrived from ${ctx.clientName}`); break;
    case 'CAMPAIGN_SCORED_WELL':
    case 'CAMPAIGN_SCORED_POORLY':
      if (typeof ctx.score === 'number') {
        recordGameEvent(event, `${name} for ${ctx.clientName} scored ${ctx.score}/100${event === 'CAMPAIGN_SCORED_POORLY' ? ' — the client was unhappy' : ''}`);
        setChatGameSnapshot({ lastScore: { campaignName: ctx.campaignName ?? 'the project', clientName: ctx.clientName, score: ctx.score, at: Date.now() } });
      }
      break;
    case 'AWARD_WON': recordGameEvent(event, `${name} won ${ctx.awardName ?? 'an award'}`); break;
    default: break;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ChatContextValue extends ChatState {
  setActiveChannel: (channel: ChannelId) => void;
  markChannelRead: (channel: ChannelId) => void;
  setMorale: (level: MoraleLevel) => void;
  addReaction: (messageId: string, emoji: string) => void;
  addMessage: (msg: ChatMessage) => void;
  triggerCampaignEvent: (event: ChatCampaignEvent, context: ChatEventContext) => void;
  getUnreadCount: () => number;
  getUnreadCountForChannel: (channel: ChannelId) => number;
  getMessagesForChannel: (channel: ChannelId) => ChatMessage[];
  typingAuthorId: string | null;
  setTypingAuthorId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [typingAuthorId, setTypingAuthorId] = useState<string | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Seed messages on mount
  useEffect(() => {
    dispatch({ type: 'SEED_MESSAGES', payload: getInitialMessages() });
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Keep the latest state in refs so the long-lived ambient loop can read it.
  const { playerName } = usePlayerContext();
  const playerNameRef = useRef(playerName ?? 'there');
  useEffect(() => { playerNameRef.current = (playerName ?? '').trim().split(/\s+/)[0] || 'there'; }, [playerName]);
  const messagesRef = useRef<ChatMessage[]>(state.messages);
  const recordedCountRef = useRef(0);
  useEffect(() => {
    messagesRef.current = state.messages;
    // Track who has spoken so replies and ambient threads rotate through the team.
    if (state.messages.length < recordedCountRef.current) recordedCountRef.current = 0;
    state.messages.slice(recordedCountRef.current).forEach(m => {
      if (!m.id.startsWith('seed-')) recordSpeaker(m.authorId);
    });
    recordedCountRef.current = state.messages.length;
  }, [state.messages]);
  useEffect(() => { setChatGameSnapshot({ morale: state.morale }); }, [state.morale]);

  // ─── Ambient chat ──────────────────────────────────────────────────────────
  // Every 45–90s one thread lands in one channel. Most threads are about what's
  // actually happening in the game (briefs, deadlines, scores, awards, morale,
  // time of day) — generated live when the tab is visible, otherwise from
  // state-aware templates. The rest come from each channel's scripted pool,
  // which never repeats a thread until the pool is exhausted (tracked in save
  // state, reset on New Game). Pat shows up in at most one in five threads.
  useEffect(() => {
    const channelWeights: Array<[ChannelId, number]> = [
      ['general', 0.25], ['creative', 0.15], ['random', 0.2], ['food', 0.15], ['memes', 0.1], ['haiku', 0.15],
    ];
    let lastChannel: ChannelId | null = null;
    let stopped = false;

    function pickChannel(): ChannelId {
      const options = channelWeights.filter(([c]) => c !== lastChannel);
      const total = options.reduce((a, [, w]) => a + w, 0);
      let roll = Math.random() * total;
      for (const [c, w] of options) { roll -= w; if (roll <= 0) return c; }
      return options[0][0];
    }

    function post(channel: ChannelId, lines: Array<AmbientMessage | AmbientLine>) {
      let t = 0;
      lines.forEach((msg, msgIdx) => {
        const fixed = (msg as AmbientMessage).delayMs;
        if (msgIdx > 0) t += fixed ?? (1400 + Math.min((msg.text?.length ?? 0) * 30, 3500) + Math.random() * 1500);
        const msgTimer = setTimeout(() => {
          timersRef.current.delete(msgTimer);
          const emoji = (msg as AmbientLine).emoji;
          const reactions = (msg as AmbientMessage).reactions ?? (emoji ? [{ emoji, count: 1 }] : []);
          const imageUrl = (msg as AmbientMessage).imageUrl;
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: `ambient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              channel,
              authorId: msg.authorId,
              text: msg.text ?? '',
              timestamp: Date.now(),
              reactions,
              isRead: false,
              ...(imageUrl ? { imageUrl } : {}),
            },
          });
        }, t);
        timersRef.current.add(msgTimer);
      });
    }

    /** Scripted pool thread, with Pat lines dropped unless Pat is due. */
    function scriptedPoolThread(channel: ChannelId): { lines: AmbientMessage[]; pat: boolean } | null {
      const pool = getAmbientPool(channel);
      const allowPat = patAllowed() && Math.random() < 0.35;
      const chain = pickUnseen(`pool:${channel}`, pool, c => chainId(channel, c), c => allowPat || !chainHasPat(c) || c.messages.some(m => m.authorId !== 'hr'));
      if (!chain) return null;
      const lines = allowPat ? chain.messages : chain.messages.filter(m => m.authorId !== 'hr');
      if (lines.length === 0) return null;
      return { lines, pat: lines.some(m => m.authorId === 'hr') };
    }

    async function runThread() {
      const channel = pickChannel();
      lastChannel = channel;
      const stateDriven = Math.random() < (STATE_SHARE[channel] ?? 0.5);
      const hook = stateDriven ? pickHook(channel) : null;

      // 1) Live, state-aware thread (only while the tab is visible).
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        const recent = messagesRef.current
          .filter(m => m.channel === channel)
          .slice(-15)
          .map(m => ({ authorId: m.authorId, text: m.text }));
        const live = await generateAmbientThread({ channel, playerName: playerNameRef.current, recent, hook });
        if (stopped) return;
        if (live) {
          post(channel, live.lines);
          noteAmbientThread(live.includedPat);
          return;
        }
      }

      // 2) Offline / API failed: state template if this was a state thread.
      if (hook) {
        const lines = scriptedStateThread(hook, playerNameRef.current);
        if (lines) {
          post(channel, lines);
          noteAmbientThread(false);
          return;
        }
      }

      // 3) Scripted pool.
      const scripted = scriptedPoolThread(channel);
      if (scripted) {
        post(channel, scripted.lines);
        noteAmbientThread(scripted.pat);
      }
    }

    function scheduleNext(delay = 45000 + Math.random() * 45000) {
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        runThread().catch(() => { /* non-fatal */ }).finally(() => { if (!stopped) scheduleNext(); });
      }, delay);
      timersRef.current.add(timer);
    }

    // First thread soon after load, so a returning player sees chat pick up
    // where the game is rather than generic banter.
    scheduleNext(10000 + Math.random() * 6000);

    return () => { stopped = true; };
  }, []);

  const setActiveChannel = useCallback((channel: ChannelId) => {
    dispatch({ type: 'SET_ACTIVE_CHANNEL', payload: channel });
  }, []);

  const markChannelRead = useCallback((channel: ChannelId) => {
    dispatch({ type: 'MARK_CHANNEL_READ', payload: channel });
  }, []);

  const setMorale = useCallback((level: MoraleLevel) => {
    dispatch({ type: 'SET_MORALE', payload: level });
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji } });
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg });
  }, []);

  const triggerCampaignEvent = useCallback(
    (event: ChatCampaignEvent, context: ChatEventContext) => {
      const templates = getCampaignEventMessages(event, context, state.morale);
      recordChatEvent(event, context);

      templates.forEach((template, index) => {
        const delay = 1000 + index * (2000 + Math.random() * 2000);
        const timer = setTimeout(() => {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              channel: template.channel,
              authorId: template.authorId,
              text: template.text,
              timestamp: Date.now(),
              reactions: template.reactions || [],
              isRead: false,
            },
          });
          timersRef.current.delete(timer);
        }, delay);
        timersRef.current.add(timer);
      });

      // Morale adjustments from scoring events
      if (event === 'CAMPAIGN_SCORED_WELL') {
        const moraleUp: Record<MoraleLevel, MoraleLevel> = {
          mutiny: 'toxic',
          toxic: 'low',
          low: 'medium',
          medium: 'high',
          high: 'high',
        };
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: moraleUp[state.morale] });
          timersRef.current.delete(moraleTimer);
        }, 6000);
        timersRef.current.add(moraleTimer);
      }
      if (event === 'CAMPAIGN_SCORED_POORLY') {
        const moraleDown: Record<MoraleLevel, MoraleLevel> = {
          high: 'medium',
          medium: 'low',
          low: 'toxic',
          toxic: 'mutiny',
          mutiny: 'mutiny',
        };
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: moraleDown[state.morale] });
          timersRef.current.delete(moraleTimer);
        }, 6000);
        timersRef.current.add(moraleTimer);
      }
    },
    [state.morale],
  );

  const getUnreadCount = useCallback(() => {
    return state.messages.filter((m) => !m.isRead).length;
  }, [state.messages]);

  const getUnreadCountForChannel = useCallback(
    (channel: ChannelId) => {
      return state.messages.filter((m) => m.channel === channel && !m.isRead).length;
    },
    [state.messages],
  );

  const getMessagesForChannel = useCallback(
    (channel: ChannelId) => {
      return state.messages
        .filter((m) => m.channel === channel)
        .sort((a, b) => a.timestamp - b.timestamp);
    },
    [state.messages],
  );

  const value: ChatContextValue = {
    ...state,
    setActiveChannel,
    markChannelRead,
    setMorale,
    addReaction,
    addMessage,
    triggerCampaignEvent,
    getUnreadCount,
    getUnreadCountForChannel,
    getMessagesForChannel,
    typingAuthorId,
    setTypingAuthorId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
