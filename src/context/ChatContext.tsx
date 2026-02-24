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

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  { id: 'general', name: 'all-staff', description: 'OmniPubDent approved communications', icon: '#', readOnly: false },
  { id: 'creative', name: 'project-work', description: 'Project updates and deliverables', icon: '📁', readOnly: true },
  { id: 'random', name: 'watercooler', description: 'Off-topic (monitored per Policy 2.4)', icon: '💬', readOnly: false },
  { id: 'food', name: 'Approved Nutrition', description: 'Mandatory meal documentation', icon: '🍕', readOnly: false },
  { id: 'memes', name: 'Morale Content', description: 'Pre-approved humor only', icon: '🖼️', readOnly: false },
  { id: 'haiku', name: 'Structured Creativity', description: 'Poetry within parameters', icon: '🎋', readOnly: false },
];

// ─── Ambient Messages ──────────────────────────────────────────────────────

interface AmbientMessage {
  channel: ChannelId;
  authorId: string;
  text: string;
  imageUrl?: string;
}

const AMBIENT_MESSAGES: AmbientMessage[] = [
  // #food
  { channel: 'food', authorId: 'pm', text: 'The vending machine has been upgraded. All selections now require manager approval.' },
  { channel: 'food', authorId: 'copywriter', text: 'I ranked every cereal by caloric density. This is what happens when I skip lunch.' },
  { channel: 'food', authorId: 'hr', text: 'Reminder: Microwaving fish is a terminable offense as of Q3.' },
  { channel: 'food', authorId: 'strategist', text: 'The salad bar has been "optimized." There are now three kinds of lettuce and nothing else.' },
  { channel: 'food', authorId: 'copywriter', text: 'Someone labeled their lunch "DO NOT EAT" and honestly that only made it more appealing.' },
  { channel: 'food', authorId: 'pm', text: 'Floor 2 fridge cleanout is today. If your container has developed sentience, that\'s on you.' },
  { channel: 'food', authorId: 'hr', text: 'The kombucha in the break room is not company-provided. Please stop expensing it.' },
  { channel: 'food', authorId: 'strategist', text: 'I\'ve been eating desk granola for three days. I think I\'m becoming the granola.' },
  { channel: 'food', authorId: 'suit', text: 'Client lunch went well. They ordered for us. We all had salad. Nobody wanted salad.' },
  { channel: 'food', authorId: 'copywriter', text: 'The coffee machine is working again but it\'s making choices I don\'t agree with.' },
  // #memes
  { channel: 'memes', authorId: 'copywriter', text: 'Nobody:\nAbsolutely nobody:\nVance: "Let\'s circle back on this"' },
  { channel: 'memes', authorId: 'strategist', text: 'Brief says "think outside the box"\nClient feedback: "not like that"', imageUrl: '  BRIEF: Think outside the box\n  ┌─────────────────────┐\n  │  CLIENT: Not like   │\n  │  that. Get back in  │\n  │  the box.           │\n  └─────────────────────┘' },
  { channel: 'memes', authorId: 'copywriter', text: 'Meetings that could have been emails\n  ╱|、\n(˚ˎ 。7\n |、˜〵\n じしˍ,)ノ\nthat\'s it. that\'s the meme.' },
  { channel: 'memes', authorId: 'pm', text: 'Timeline: 2 weeks\nScope creep: am I a joke to you\nTimeline: 6 weeks' },
  { channel: 'memes', authorId: 'strategist', text: '┌──────────────┐\n│  DRAKE  NO:  │ Reading the brief\n├──────────────┤\n│  DRAKE YES:  │ Guessing what the\n│              │ client actually wants\n└──────────────┘', imageUrl: '┌──────────────┐\n│  DRAKE  NO:  │ Reading the brief\n├──────────────┤\n│  DRAKE YES:  │ Guessing what the\n│              │ client actually wants\n└──────────────┘' },
  { channel: 'memes', authorId: 'copywriter', text: 'POV: you\'re a tagline that survived 7 rounds of feedback\n\n  * * *   BATTLE SCARRED   * * *' },
  { channel: 'memes', authorId: 'pm', text: '"Can you just make it pop?"\n\n(┛◉Д◉)┛彡┻━┻' },
  { channel: 'memes', authorId: 'strategist', text: 'The four horsemen of the apocalypse:\n1. "Quick question"\n2. "Per my last email"\n3. "Going forward"\n4. "Let\'s take this offline"' },
  { channel: 'memes', authorId: 'copywriter', text: 'Me: *writes perfect headline*\nClient: "Can we try something more... blue?"' },
  { channel: 'memes', authorId: 'pm', text: '  EXPECTATION     REALITY\n ┌─────────┐   ┌─────────┐\n │ Creative │   │ 47 email│\n │ freedom  │   │ threads │\n │          │   │ about   │\n │          │   │ font    │\n │          │   │ size    │\n └─────────┘   └─────────┘' },
  // #haiku
  { channel: 'haiku', authorId: 'copywriter', text: 'Standup was cancelled\nThe joy was brief and fragile\nNow we have two more' },
  { channel: 'haiku', authorId: 'strategist', text: 'That is six syllables.' },
  { channel: 'haiku', authorId: 'copywriter', text: 'Open plan office\nI can hear you breathing, Greg\nPlease stop doing that' },
  { channel: 'haiku', authorId: 'pm', text: 'Sprint is almost done\nNew requirements just dropped\nSprint is never done' },
  { channel: 'haiku', authorId: 'strategist', text: 'The deck is perfect\nClient wants "one small change" though\nThe deck is ruined' },
  { channel: 'haiku', authorId: 'copywriter', text: 'WiFi is down again\nI am free from all meetings\nNevermind it\'s back' },
  { channel: 'haiku', authorId: 'suit', text: 'Synergy is key\nLet us leverage our assets\nI don\'t know what that means' },
  { channel: 'haiku', authorId: 'strategist', text: 'That last line is seven syllables. This channel has standards.' },
  { channel: 'haiku', authorId: 'pm', text: 'Please update the board\nThe board has too many cards\nPlease update the board' },
  { channel: 'haiku', authorId: 'copywriter', text: 'My chair was stolen\nI filed a formal complaint\nNow I have no desk' },
  // #random enhanced
  { channel: 'random', authorId: 'copywriter', text: 'who keeps moving my chair' },
  { channel: 'random', authorId: 'pm', text: 'What chair?' },
  { channel: 'random', authorId: 'copywriter', text: 'MY chair. The one that was at MY desk. It\'s gone. Again.' },
  { channel: 'random', authorId: 'strategist', text: 'I saw facilities moving furniture at 6am. Could be related.' },
  { channel: 'random', authorId: 'copywriter', text: 'Is it 4pm already? Is this all there is?' },
  { channel: 'random', authorId: 'strategist', text: 'Do you ever think about how "deadline" has the word "dead" in it?' },
  { channel: 'random', authorId: 'pm', text: 'Does anyone else feel like today has been three days long?' },
  { channel: 'random', authorId: 'copywriter', text: 'The printer on floor 2 has started making decisions on its own. I respect it.' },
  { channel: 'random', authorId: 'suit', text: 'Has anyone seen my mug? It says "World\'s Most Adequate Employee." It has sentimental value.' },
  { channel: 'random', authorId: 'strategist', text: 'It\'s 4pm. What are we all doing here. What is the point of anything.' },
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

  // Ambient message system — periodically delivers casual messages
  const sentAmbientRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000; // 45-90 seconds
      return setTimeout(() => {
        // Find unsent messages
        const unsent = AMBIENT_MESSAGES
          .map((msg, idx) => ({ msg, idx }))
          .filter(({ idx }) => !sentAmbientRef.current.has(idx));

        if (unsent.length === 0) {
          // All sent — reset pool
          sentAmbientRef.current.clear();
          timerId = scheduleNext();
          return;
        }

        const pick = unsent[Math.floor(Math.random() * unsent.length)];
        sentAmbientRef.current.add(pick.idx);

        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: `ambient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            channel: pick.msg.channel,
            authorId: pick.msg.authorId,
            text: pick.msg.text,
            imageUrl: pick.msg.imageUrl,
            timestamp: Date.now(),
            reactions: [],
            isRead: false,
          },
        });

        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();

    return () => clearTimeout(timerId);
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
