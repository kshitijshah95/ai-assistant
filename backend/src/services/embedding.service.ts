import { getDefaultProvider } from '../ai/llm/index.js';
import prisma from '../db/prisma.js';

export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    const provider = getDefaultProvider();
    return provider.embed(text);
  }

  async findSimilarNotes(userId: string, embedding: number[], limit: number = 5) {
    // Use raw SQL for vector similarity search
    const results = await prisma.$queryRaw<
      { id: string; title: string | null; content: string; category: string | null; similarity: number }[]
    >`
      SELECT 
        id, 
        title, 
        content, 
        category,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM notes 
      WHERE user_id = ${userId} 
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;

    return results;
  }

  async findSimilarCategories(userId: string, embedding: number[], type: string = 'note', limit: number = 3) {
    const results = await prisma.$queryRaw<
      { id: string; name: string; similarity: number }[]
    >`
      SELECT 
        id, 
        name,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM categories 
      WHERE user_id = ${userId} 
        AND type = ${type}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${limit}
    `;

    return results;
  }

  async createOrUpdateCategory(userId: string, name: string, type: string, embedding: number[]) {
    // Upsert category with embedding
    await prisma.$executeRaw`
      INSERT INTO categories (id, user_id, name, type, embedding, created_at)
      VALUES (gen_random_uuid(), ${userId}, ${name}, ${type}, ${embedding}::vector, NOW())
      ON CONFLICT (user_id, name, type) 
      DO UPDATE SET embedding = ${embedding}::vector
    `;
  }
}

export const embeddingService = new EmbeddingService();
