import { config } from '../config/index.js';

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (!config.llm.openai.apiKey && !config.llm.anthropic.apiKey) {
    errors.push('At least one LLM API key (OPENAI_API_KEY or ANTHROPIC_API_KEY) is required');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  // Validate default provider has API key
  if (config.llm.defaultProvider === 'openai' && !config.llm.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required when DEFAULT_LLM_PROVIDER is openai');
  }

  if (config.llm.defaultProvider === 'anthropic' && !config.llm.anthropic.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required when DEFAULT_LLM_PROVIDER is anthropic');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function printStartupInfo() {
  console.log('\n========================================');
  console.log('  AI Assistant - Life Management Tool');
  console.log('========================================\n');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Port: ${config.port}`);
  console.log(`Default LLM: ${config.llm.defaultProvider}`);
  console.log(`OpenAI: ${config.llm.openai.apiKey ? '✓ configured' : '✗ not configured'}`);
  console.log(`Anthropic: ${config.llm.anthropic.apiKey ? '✓ configured' : '✗ not configured'}`);
  console.log('\n');
}
