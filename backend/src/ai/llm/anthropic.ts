import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { LLMProvider, ChatMessage, ChatOptions } from '../../types/index.js';
import { config } from '../../config/index.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private openaiClient: OpenAI; // For embeddings (Anthropic doesn't have embeddings API)
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.llm.anthropic.apiKey,
    });
    // Use OpenAI for embeddings when using Anthropic
    this.openaiClient = new OpenAI({
      apiKey: config.llm.openai.apiKey,
    });
    this.model = config.llm.anthropic.model;
  }

  getName(): string {
    return 'anthropic';
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const stream = this.client.messages.stream({
      model: options?.model || this.model,
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    // Anthropic doesn't have an embeddings API, so we use OpenAI's
    const response = await this.openaiClient.embeddings.create({
      model: config.llm.openai.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }
}
