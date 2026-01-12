import { create } from 'zustand';
import { Message, Conversation, LLMProvider } from '../types';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { generateId } from '../lib/utils';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  provider: LLMProvider;
  isConnected: boolean;
  error: string | null;

  // Actions
  setProvider: (provider: LLMProvider) => void;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  createConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => void;
  getCurrentConversation: () => Conversation | null;
  initializeSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isStreaming: false,
  streamingContent: '',
  provider: 'openai',
  isConnected: false,
  error: null,

  setProvider: (provider) => set({ provider }),

  loadConversations: async () => {
    try {
      const conversations = await api.conversations.list();
      set({
        conversations: conversations.map((c) => ({
          id: c.id,
          title: c.title || 'New Conversation',
          createdAt: new Date(c.createdAt),
          messages: [],
        })),
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      set({ error: 'Failed to load conversations' });
    }
  },

  selectConversation: async (id) => {
    if (!id) {
      set({ currentConversationId: null });
      return;
    }

    try {
      const conversation = await api.conversations.get(id);
      set((state) => ({
        currentConversationId: id,
        conversations: state.conversations.map((c) =>
          c.id === id
            ? {
                ...c,
                messages: conversation.messages.map((m) => ({
                  id: m.id,
                  role: m.role as 'user' | 'assistant' | 'system',
                  content: m.content,
                  createdAt: new Date(m.createdAt),
                })),
              }
            : c
        ),
      }));
    } catch (error) {
      console.error('Failed to load conversation:', error);
      set({ error: 'Failed to load conversation' });
    }
  },

  createConversation: async () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: new Date(),
      messages: [],
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
    }));

    return newConversation.id;
  },

  deleteConversation: async (id) => {
    try {
      await api.conversations.delete(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversationId:
          state.currentConversationId === id ? null : state.currentConversationId,
      }));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      set({ error: 'Failed to delete conversation' });
    }
  },

  sendMessage: (content) => {
    const state = get();
    const socket = socketService.getSocket();

    if (!socket) {
      set({ error: 'Not connected to server' });
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    // Add user message immediately
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === state.currentConversationId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ),
      isStreaming: true,
      streamingContent: '',
      error: null,
    }));

    // Send to server
    socket.emit('chat:message', {
      message: content,
      conversationId: state.currentConversationId,
      provider: state.provider,
    });
  },

  getCurrentConversation: () => {
    const state = get();
    return (
      state.conversations.find((c) => c.id === state.currentConversationId) ||
      null
    );
  },

  initializeSocket: () => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      set({ isConnected: true, error: null });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('chat:conversation', (data: { conversationId: string }) => {
      // Update conversation ID if server created a new one
      set((state) => {
        const currentConv = state.conversations.find(
          (c) => c.id === state.currentConversationId
        );
        if (currentConv && currentConv.messages.length <= 1) {
          return {
            conversations: state.conversations.map((c) =>
              c.id === state.currentConversationId
                ? { ...c, id: data.conversationId }
                : c
            ),
            currentConversationId: data.conversationId,
          };
        }
        return state;
      });
    });

    socket.on('chat:start', () => {
      set({ isStreaming: true, streamingContent: '' });
    });

    socket.on('chat:chunk', (data: { content: string }) => {
      set((state) => ({
        streamingContent: state.streamingContent + data.content,
      }));
    });

    socket.on(
      'chat:end',
      (data: { conversationId: string; messageId: string; content: string }) => {
        const assistantMessage: Message = {
          id: data.messageId,
          role: 'assistant',
          content: data.content,
          createdAt: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === data.conversationId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c
          ),
          isStreaming: false,
          streamingContent: '',
        }));
      }
    );

    socket.on('chat:title', (data: { conversationId: string; title: string }) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === data.conversationId ? { ...c, title: data.title } : c
        ),
      }));
    });

    socket.on('chat:error', (data: { message: string }) => {
      set({ error: data.message, isStreaming: false, streamingContent: '' });
    });
  },
}));
