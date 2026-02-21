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
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: 'high' });
          timersRef.current.delete(moraleTimer);
        }, 6000);
        timersRef.current.add(moraleTimer);
      }
      if (event === 'CAMPAIGN_SCORED_POORLY') {
        const moraleTimer = setTimeout(() => {
          dispatch({ type: 'SET_MORALE', payload: 'low' });
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
