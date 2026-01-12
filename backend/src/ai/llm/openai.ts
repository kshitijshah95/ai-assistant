import OpenAI from 'openai';
import { LLMProvider, ChatMessage, ChatOptions } from '../../types/index.js';
import { config } from '../../config/index.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.openai.apiKey,
    });
    this.model = config.llm.openai.model;
    this.embeddingModel = config.llm.openai.embeddingModel;
  }

  getName(): string {
    return 'openai';
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }
}
