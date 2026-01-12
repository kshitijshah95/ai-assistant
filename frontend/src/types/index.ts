export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
}

export type View = 'chat' | 'notes' | 'tasks' | 'calendar' | 'habits' | 'goals';

export type LLMProvider = 'openai' | 'anthropic';
