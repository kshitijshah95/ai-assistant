import { getDefaultProvider } from '../ai/llm/index.js';

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const provider = getDefaultProvider();
      return await provider.embed(text);
    } catch (error) {
      // Return empty array if embedding fails (for deployments without embedding support)
      console.warn('Embedding generation failed:', error);
      return [];
    }
  }

  // Simplified search - returns empty for now (vector search requires pgvector)
  async findSimilarNotes(_userId: string, _embedding: number[], _limit: number = 5) {
    // Vector search disabled - would require pgvector extension
    return [];
  }

  async findSimilarCategories(_userId: string, _embedding: number[], _type: string = 'note', _limit: number = 3) {
    // Vector search disabled - would require pgvector extension
    return [];
  }

  async createOrUpdateCategory(_userId: string, _name: string, _type: string, _embedding: number[]) {
    // Category embedding disabled - would require pgvector extension
  }
}

export const embeddingService = new EmbeddingService();
