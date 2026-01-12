export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
  embed(text: string): Promise<number[]>;
  getName(): string;
}

export type LLMProviderType = 'openai' | 'anthropic';

export interface ConversationContext {
  conversationId: string;
  userId: string;
  messages: ChatMessage[];
}

export interface WebSocketMessage {
  type: 'chat' | 'status' | 'error';
  payload: unknown;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  provider?: LLMProviderType;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  done: boolean;
}
