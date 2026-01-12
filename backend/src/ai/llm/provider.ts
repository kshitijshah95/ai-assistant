import { LLMProvider, LLMProviderType } from '../../types/index.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { config } from '../../config/index.js';

let defaultProvider: LLMProvider | null = null;

export function createProvider(type: LLMProviderType): LLMProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    default:
      throw new Error(`Unknown LLM provider: ${type}`);
  }
}

export function getDefaultProvider(): LLMProvider {
  if (!defaultProvider) {
    defaultProvider = createProvider(config.llm.defaultProvider);
  }
  return defaultProvider;
}

export function setDefaultProvider(type: LLMProviderType): void {
  defaultProvider = createProvider(type);
}

export type { LLMProvider };
