import { create } from 'zustand';

export interface ChatMessage {
  key: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  loading?: boolean;
  dataCard?: any;
}

export interface ModelRef {
  llmService: string;
  model: string;
}

export interface ConversationSummary {
  sessionId: string;
  title: string | null;
  updatedAt: string;
}

export const AI_EMPLOYEE_USERNAME = 'clothing-summary';

interface ChatState {
  // Messages
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (updater: (msg: ChatMessage) => ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;

  // Session
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Conversation list
  conversations: ConversationSummary[];
  setConversations: (list: ConversationSummary[]) => void;
  currentSessionTitle: string | null;
  setCurrentSessionTitle: (title: string | null) => void;
  sessionsLoading: boolean;
  setSessionsLoading: (loading: boolean) => void;

  // UI state
  responseLoading: boolean;
  setResponseLoading: (loading: boolean) => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;

  // LLM model reference
  model: ModelRef | null;
  setModel: (model: ModelRef | null) => void;

  // Abort controller for cancelling requests
  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Messages
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastMessage: (updater) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const messages = [...state.messages];
      messages[messages.length - 1] = updater(messages[messages.length - 1]);
      return { messages };
    }),
  setMessages: (msgs) => set({ messages: msgs }),
  clearMessages: () => set({ messages: [] }),

  // Session
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),

  // Conversation list
  conversations: [],
  setConversations: (list) => set({ conversations: list }),
  currentSessionTitle: null,
  setCurrentSessionTitle: (title) => set({ currentSessionTitle: title }),
  sessionsLoading: false,
  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),

  // UI state
  responseLoading: false,
  setResponseLoading: (loading) => set({ responseLoading: loading }),
  sidebarVisible: false,
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  // LLM model reference
  model: null,
  setModel: (model) => set({ model }),

  // Abort controller
  abortController: null,
  setAbortController: (controller) => set({ abortController: controller }),
}));
