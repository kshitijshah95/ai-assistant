import dotenv from 'dotenv';

dotenv.config();

// Parse CORS origins (can be comma-separated for multiple origins)
const parseCorsOrigin = (origin: string | undefined): string | string[] => {
  if (!origin) return 'http://localhost:5173';
  if (origin.includes(',')) {
    return origin.split(',').map(o => o.trim());
  }
  return origin;
};

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_assistant?schema=public',
  },
  
  llm: {
    defaultProvider: (process.env.DEFAULT_LLM_PROVIDER || 'openai') as 'openai' | 'anthropic',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    },
  },
  
  cors: {
    origin: parseCorsOrigin(process.env.CORS_ORIGIN),
  },
};
